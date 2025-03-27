import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, AppState } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission, useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector, Face, FaceDetectionOptions } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import Reanimated from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome5';
import useVoskRecognition from '../hooks/UseVoskRecognition'; // Import the custom hook
import { Command } from '../../App'; // Import the Command type

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

const Page2 = ({ vescState}) => {
  const device = useCameraDevice('front');
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();
  const [showCamera, setShowCamera] = useState(false);
  const [faces, setFaces] = useState<Face[]>([]);
  const [headDirection, setHeadDirection] = useState('Neutral');
  const [headAngle, setHeadAngle] = useState(0);
  const [previousAngle, setPreviousAngle] = useState(0);
  const [lastLoggedTime, setLastLoggedTime] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);
  const [micOn, setMicOn] = useState(false);  // Track microphone state
  const [wasNeutral, setWasNeutral] = useState(true); // Track if the previous position was neutral

  // Destructure all return values from useVoskRecognition hook
  const { result, recognizing, modelLoaded, loadModel, startRecognition, stopRecognition } = useVoskRecognition();

  const faceDetectionOptions = useRef<FaceDetectionOptions>({
    mode: 'accurate',
    detectLandmarks: 'all', // Changed from 'none' to 'all' to get more face data
    runClassifications: 'all',
  }).current;

  const { detectFaces } = useFaceDetector(faceDetectionOptions);

  useEffect(() => {
    requestPermissions();

    const appStateListener = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setShowCamera(false);
      } else if (nextAppState === 'active' && hasCameraPermission && hasMicPermission) {
        setShowCamera(true);
      }
    });

    return () => {
      appStateListener.remove();
    };
  }, [hasCameraPermission, hasMicPermission]);

  useEffect(() => {
    // Automatically load model on mount
    loadModel();
  }, [loadModel]);

  useEffect(() => {
    if (modelLoaded && micOn) {
      startRecognition();  // Start recognition when mic is turned on
    } else {
      stopRecognition();  // Stop recognition when mic is turned off
    }
  }, [modelLoaded, micOn, startRecognition, stopRecognition]);

  // Process voice commands when result changes
  useEffect(() => {
    if (result) {
      processVoiceCommand(result);
    }
  }, [result]);

  const requestPermissions = async () => {
    const cameraGranted = await requestCameraPermission();
    const micGranted = await requestMicPermission();

    if (cameraGranted && micGranted) {
      setShowCamera(true);
    } else {
      Alert.alert(
        'Permission Required',
        'Camera & Microphone access is needed. Please enable them in Settings.',
        [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel', style: 'cancel' }]
      );
    }
  };

  // Process voice commands
  const processVoiceCommand = useCallback((text: string) => {
    const command = text.toLowerCase();
    
    // List of valid voice commands
    const validCommands = [
      'go', 'reverse', 'speed one', 'speed two', 'speed three',
      'stop', 'left', 'right', 'help me'
    ];
    
    // Check if any valid command is in the voice result
    for (const validCommand of validCommands) {
      if (command.includes(validCommand)) {
        //Set x and y
       // console.log(`Voice command added: ${validCommand}`);
        break; // Only add one command per voice input
      }
    }
  }, []);

  const handleDetectedFaces = Worklets.createRunOnJS((detectedFaces: Face[]) => {
    setFaces(detectedFaces);

    if (detectedFaces.length === 0) return;

    const face = detectedFaces[0];

    if (!face.bounds || !face.bounds.width) return;

    // Calculate head turn angle
    const { x, width } = face.bounds;
    const frameWidth = 640;
    const centerX = frameWidth / 2;
    const faceCenter = x + width / 2;
    
    // Calculate offset from center as a percentage of half the frame width
    const offsetPercentage = (faceCenter - centerX) / (frameWidth / 2);
    
    // Convert to degrees (assuming max turn is about 45 degrees)
    const calculatedAngle = -offsetPercentage * 45;
    
    // Limit to 2 decimal places
    const roundedAngle = parseFloat(calculatedAngle.toFixed(2)); // Rounds to 2 decimal places
    
    // Use face.yawAngle if available (more accurate)
    const angle = face.yawAngle !== undefined ? parseFloat(face.yawAngle.toFixed(2)) : roundedAngle;

    // Update the headAngle state for the live degree bar
    setHeadAngle(angle);

    // Check if the face is in neutral position
    const isNeutral = Math.abs(angle) < 5;

    // Determine simplified direction text for UI
    let directionText = 'Neutral';
    
    if (isNeutral) {
      directionText = 'Neutral';
    } else if (angle > 0) {  // positive angle means left
      directionText = 'Left';
    } else {                 // negative angle means right
      directionText = 'Right';
    }

    const currentTime = Date.now();
    const timeDifference = currentTime - lastLoggedTime;
    const angleDifference = Math.abs(angle - previousAngle);

    // Determine if we should log based on:
    // 1. Significant angle change, or
    // 2. Time interval passed, or
    // 3. Transition to neutral from non-neutral, or
    // 4. Transition from neutral to non-neutral
    const transitionToNeutral = !wasNeutral && isNeutral;
    const transitionFromNeutral = wasNeutral && !isNeutral;
    
    if (angleDifference >= 5 || timeDifference >= 15000 || transitionToNeutral || transitionFromNeutral) {
      // Update state
      if (directionText !== headDirection || timeDifference >= 15000 || transitionToNeutral || transitionFromNeutral) {
        setHeadDirection(directionText);
        setPreviousAngle(angle);
        setLastLoggedTime(currentTime);
        setWasNeutral(isNeutral);
      }

      // Add direction command to the buffer if not neutral
      if (!isNeutral) {
       //Set x and y
        console.log(`Direction command added: ${directionText} (${angle}°)`);
      }
    }
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const detectedFaces = detectFaces(frame);
    handleDetectedFaces(detectedFaces);
  }, [handleDetectedFaces]);

  const toggleMic = () => {
    setMicOn(prev => !prev);
  };

  if (device == null) return <Text>No camera device</Text>;

  return (
    <View style={styles.page}>
      {showCamera ? (
        <>
          <ReanimatedCamera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            frameProcessor={frameProcessor}
            frameProcessorFps={5}
            onError={(error) => {
              console.error('Camera error:', error);
            }}
          />
          
          {/* Live angle indicator that moves with the user's face */}
          <View style={styles.angleIndicator}>
            <View style={styles.angleBar}>
              <View 
                style={[styles.anglePointer, { left: `${50 - (headAngle / 45) * 50}%` }]} 
              />
            </View>
            <View style={styles.angleLabels}>
              <Text style={styles.angleLabel}>-45°</Text>
              <Text style={styles.angleLabel}>0°</Text>
              <Text style={styles.angleLabel}>45°</Text>
            </View>
          </View>
          
          <View style={styles.headDirectionTop}>
            <Text style={styles.headDirectionText}>Face: {headDirection}</Text>
          </View>
          
          
        </>
      ) : (
        <>
          <Icon name="wheelchair" size={75} color="white" style={styles.icon} />
          <Text style={styles.title}>Start Glide!</Text>
          <TouchableOpacity style={styles.button} onPress={() => setShowCamera(true)}>
            <Text style={styles.buttonText}>Open Camera</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={() => setShowCamera(prev => !prev)} style={[styles.controlButton, showCamera ? styles.cameraActive : null]}>
          <Text style={styles.buttonText}>{showCamera ? 'Close Camera' : 'Open Camera'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleMic} style={[styles.controlButton, micOn ? styles.micActive : null]}>
          <Text style={styles.buttonText}>{micOn ? 'Stop Mic' : 'Start Mic'}</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  page: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'black' 
  },
  button: { 
    padding: 10, 
    backgroundColor: '#007AFF', 
    borderRadius: 5, 
    margin: 20 
  },
  buttonText: { 
    color: 'white', 
    fontSize: 18 
  },
  icon: { 
    marginBottom: 30 
  },
  title: { 
    fontSize: 24, 
    color: 'white' 
  },
  micButtonContainer: { 
    position: 'absolute', 
    bottom: 50 
  },
  micButton: { 
    padding: 10, 
    backgroundColor: '#00BFFF', 
    borderRadius: 5 
  },
  controlsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 30,
    justifyContent: 'space-around',
    width: '80%',
  },
  controlButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#1E90FF',
    marginHorizontal: 10,
  },
  cameraActive: {
    backgroundColor: '#FF4500',
  },
  micActive: {
    backgroundColor: '#32CD32',
  },
  angleIndicator: { 
    position: 'absolute', 
    bottom: 100, 
    width: '90%', 
    alignItems: 'center' 
  },
  angleBar: { 
    width: '100%', 
    height: 10, 
    backgroundColor: 'lightgrey', 
    position: 'relative',
    borderRadius: 5
  },
  anglePointer: { 
    position: 'absolute', 
    top: -5, 
    width: 20, 
    height: 20, 
    backgroundColor: 'blue', 
    borderRadius: 10 
  },
  angleLabels: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%' 
  },
  angleLabel: { 
    color: 'white', 
    fontSize: 12 
  },
  headDirectionTop: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headDirectionText: {
    color: 'white',
    fontSize: 18,
  },
  commandDisplay: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5
  },
  commandTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5
  },
  commandText: {
    color: 'white',
    fontSize: 14
  }
});

export default Page2;