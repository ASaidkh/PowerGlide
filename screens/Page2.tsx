import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, AppState } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Icon from 'react-native-vector-icons/FontAwesome5';

const Page2 = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const devices = useCameraDevices();
  const frontCamera = devices.front;
  const cameraRef = useRef(null);

  // Function to check and request permissions
  const requestPermissions = async () => {
    try {
      const cameraStatus = await check(PERMISSIONS.ANDROID.CAMERA);
      const micStatus = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);

      if (cameraStatus === RESULTS.GRANTED && micStatus === RESULTS.GRANTED) {
        setHasPermission(true);
      } else {
        const newCameraPermission = await request(PERMISSIONS.ANDROID.CAMERA);
        const newMicPermission = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);

        if (newCameraPermission === RESULTS.GRANTED && newMicPermission === RESULTS.GRANTED) {
          setHasPermission(true);
        } else {
          Alert.alert('Permission Required', 'Camera & microphone permissions are required to use this feature.');
        }
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    }
  };

  // Handle button press to open camera
  const handleOpenCamera = async () => {
    await requestPermissions();
    if (hasPermission && frontCamera) {
      setShowCamera(true); // Set showCamera only after permissions are confirmed
    }
  };

  return (
    <View style={styles.page}>
      {showCamera && frontCamera ? (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={frontCamera}
          isActive={true}
        />
      ) : (
        <>
          {/* Wheelchair Icon */}
          <Icon name="wheelchair" size={75} color="white" style={styles.icon} />

          {/* Title */}
          <Text style={styles.title}>Start Glide!</Text>

          {/* Button */}
          <TouchableOpacity style={styles.button} onPress={handleOpenCamera}>
            <Text style={styles.buttonText}>Open Camera & Microphone</Text>
          </TouchableOpacity>
        </>
      )}
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
    marginBottom: 10, // Space between the icon and title
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: 'white',
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
  camera: {
    width: '100%',
    height: '100%',
  },
});

export default Page2;
