import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission, useFrameProcessor } from 'react-native-vision-camera';
import { FaceDetector, Face } from 'react-native-vision-camera-face-detector';
import Reanimated, { useSharedValue, runOnJS } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome5';

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

const Page2 = () => {
  const device = useCameraDevice('front');
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();
  const [showCamera, setShowCamera] = useState(false);
  const [faces, setFaces] = useState<Face[]>([]);
  const [headDirection, setHeadDirection] = useState('Neutral');

  const faceSharedValue = useSharedValue<Face[]>([]);

  useEffect(() => {
    requestPermissions();
  }, []);

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

  const processFaces = useCallback((detectedFaces: Face[]) => {
    setFaces(detectedFaces);

    if (detectedFaces.length > 0) {
      const face = detectedFaces[0];
      // Your existing logic for determining head direction
      // ...
    }
  }, []);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'; 
    const detectedFaces = FaceDetector.detectFaces(frame);
    runOnJS(processFaces)(detectedFaces);
  }, []);
  

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
            console.error("Camera error:", error);
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

      <View style={styles.headDirection}>
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
});

export default Page2;