import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, AppState } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission, useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector, Face, FaceDetectionOptions } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core'; // Import Worklets
import Reanimated from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome5';

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

const Page2 = () => {
  const device = useCameraDevice('front');
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();
  const [showCamera, setShowCamera] = useState(false);
  const [faces, setFaces] = useState<Face[]>([]);
  const [headDirection, setHeadDirection] = useState('Neutral');
  const [previousDirection, setPreviousDirection] = useState('Neutral');
  const [lastLoggedTime, setLastLoggedTime] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);  // Track app state

  const faceDetectionOptions = useRef<FaceDetectionOptions>({
    mode: 'accurate',
    detectLandmarks: 'none',
    runClassifications: 'all',
  }).current;

  const { detectFaces } = useFaceDetector(faceDetectionOptions);

  useEffect(() => {
    requestPermissions();
    
    // AppState listener to detect when the app goes to the background or is closed
    const appStateListener = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Stop face detection when the app goes to the background or is closed
        setShowCamera(false);
      } else if (nextAppState === 'active') {
        // Start face detection when the app is active
        if (hasCameraPermission && hasMicPermission) {
          setShowCamera(true);
        }
      }
    });

    // Clean up the listener on unmount
    return () => {
      appStateListener.remove();
    };
  }, [hasCameraPermission, hasMicPermission]);

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
  // Use Worklets to handle face detection
  const handleDetectedFaces = Worklets.createRunOnJS((detectedFaces: Face[]) => {
    setFaces(detectedFaces);

    // Log number of faces only when count changes
    if (detectedFaces.length !== previousFaceCount) {
      console.log(`Number of detected faces: ${detectedFaces.length}`);
      setPreviousFaceCount(detectedFaces.length);
    }

    if (detectedFaces.length === 0) return;

    const face = detectedFaces[0];

    if (!face.bounds || !face.bounds.width) return;

    const { x, width } = face.bounds;

    // Normalize x position using an assumed total frame width
    const frameWidth = 640; // Adjust based on actual camera resolution
    const normalizedX = (x + width / 2) / frameWidth;

    // Define thresholds
    const LEFT_THRESHOLD = 0.3;
    const RIGHT_THRESHOLD = 0.4;

    let newDirection = 'Neutral';

    if (normalizedX < LEFT_THRESHOLD) {
      newDirection = 'Turning Left';
    } else if (normalizedX > RIGHT_THRESHOLD) {
      newDirection = 'Turning Right';
    }

    const currentTime = Date.now();
    const timeDifference = currentTime - lastLoggedTime;

    // Update state only if the direction changes or after 15s
    if (newDirection !== previousDirection || timeDifference >= 15000) {
      setHeadDirection(newDirection);
      setPreviousDirection(newDirection);
      setLastLoggedTime(currentTime);

      console.log(`Face Direction: ${newDirection}`);
    }
  });

  // Frame processor
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'; // Indicating this is a worklet function
    const detectedFaces = detectFaces(frame);
    handleDetectedFaces(detectedFaces); // Process detected faces on the JS thread
  }, [handleDetectedFaces]);

  if (device == null) return <Text>No camera device</Text>;

  return (
    <View style={styles.page}>
      {showCamera ? (
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
      ) : (
        <>
          <Icon name="wheelchair" size={75} color="white" style={styles.icon} />
          <Text style={styles.title}>Start Glide!</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermissions}>
            <Text style={styles.buttonText}>Open Camera & Microphone</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.headDirectionTop}>
        <Text style={styles.headDirectionText}>Face: {headDirection}</Text>
      </View>
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
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headDirectionTop: {
    position: 'absolute',
    top: 50,  // Adjust as needed
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headDirectionText: {
    color: 'white',
    fontSize: 18,
  },
});

export default Page2;
