import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, AppState } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission, useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector, Face, FaceDetectionOptions } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import Reanimated from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome5';
import useVoskRecognition from '../hooks/UseVoskRecognition'; // Import the custom hook

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

const Page2 = () => {
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

  const [previousFaceCount, setPreviousFaceCount] = useState(0);

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

    // Create detailed direction text for logging
    let detailedDirectionText = 'Neutral (0°)';
    
    if (isNeutral) {
      detailedDirectionText = 'Neutral (0°)';
    } else if (angle > 0) {  // positive angle means left
      detailedDirectionText = `Left (${Math.abs(angle)}°)`;
    } else {                 // negative angle means right
      detailedDirectionText = `Right (${Math.abs(angle)}°)`;
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

      // Always log when conditions are met
      console.log(`Face Direction: ${detailedDirectionText}, Angle: ${angle}°`);
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
          <TouchableOpacity style={styles.toggleButton} onPress={() => setShowCamera(false)}>
            <Text style={styles.buttonText}>Close Camera</Text>
          </TouchableOpacity>
          
          {/* Live angle indicator that moves with the user's face */}
          <View style={styles.angleIndicator}>
            <View style={styles.angleBar}>
              <View 
                style={[
                  styles.anglePointer, 
                  { left: `${50 - (headAngle / 45) * 50}%` }
                ]} 
              />
            </View>
            <View style={styles.angleLabels}>
              <Text style={styles.angleLabel}>-45°</Text>
              <Text style={styles.angleLabel}>0°</Text>
              <Text style={styles.angleLabel}>45°</Text>
            </View>
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

      <View style={styles.headDirectionTop}>
        <Text style={styles.headDirectionText}>Face: {headDirection}</Text>
      </View>

      {/* Display the recognized voice command */}
      <View style={styles.commandContainer}>
        <Text style={styles.commandText}>Voice Command: {result}</Text>
      </View>

      {/* Mic on/off toggle */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={toggleMic}
      >
        <Text style={styles.buttonText}>{micOn ? 'Turn Off Mic' : 'Turn On Mic'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: 'white',
    textAlign: 'center',
  },
  button: {
    backgroundColor: 'blue',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 5,
    marginTop: 20,
  },
  toggleButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'red',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
  commandContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  commandText: {
    color: 'white',
    fontSize: 18,
  },
  angleIndicator: {
    position: 'absolute',
    top: 100,
    width: '80%',
    alignSelf: 'center',
  },
  angleBar: {
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    position: 'relative',
  },
  anglePointer: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: 20,
    backgroundColor: 'red',
    borderRadius: 2,
    transform: [{ translateX: -2 }], // Center the pointer
  },
  angleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  angleLabel: {
    color: 'white',
    fontSize: 12,
  },
});

export default Page2;