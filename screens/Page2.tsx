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
  const [headDirection, setHeadDirection] = useState('Neutral (0°)');
  const [headAngle, setHeadAngle] = useState(0);
  const [previousAngle, setPreviousAngle] = useState(0);
  const [lastLoggedTime, setLastLoggedTime] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);
  const [micOn, setMicOn] = useState(false);  // Track microphone state

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

    if (detectedFaces.length !== previousFaceCount) {
      console.log(`Number of detected faces: ${detectedFaces.length}`);
      setPreviousFaceCount(detectedFaces.length);
    }

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
    // Negative values mean turning left, positive values mean turning right
    const calculatedAngle = -offsetPercentage * 45;
    
    // Round to nearest degree
    const roundedAngle = Math.round(calculatedAngle);
    
    // Use face.yawAngle if available (more accurate)
    const angle = face.yawAngle !== undefined ? face.yawAngle : roundedAngle;
    
    setHeadAngle(angle);

    // Determine direction text based on angle
    let directionText = 'Neutral (0°)';
    
    if (Math.abs(angle) < 5) {
      directionText = 'Neutral (0°)';
    } else if (angle < 0) {
      directionText = `Left (${Math.abs(angle)}°)`;
    } else {
      directionText = `Right (${angle}°)`;
    }

    const currentTime = Date.now();
    const timeDifference = currentTime - lastLoggedTime;
    const angleDifference = Math.abs(angle - previousAngle);

    // Update direction if angle changed by more than 5 degrees or if 15 seconds passed
    if (angleDifference >= 5 || timeDifference >= 15000) {
      setHeadDirection(directionText);
      setPreviousAngle(angle);
      setLastLoggedTime(currentTime);

      console.log(`Face Direction: ${directionText}, Angle: ${angle}°`);
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
          
          {/* Add angle indicator */}
          <View style={styles.angleIndicator}>
            <View style={styles.angleBar}>
              <View 
                style={[
                  styles.anglePointer, 
                  { left: `${50 + (headAngle / 90) * 50}%` }
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