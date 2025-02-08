import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/FontAwesome5';

const Page2 = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const devices = useCameraDevices();
  const device = devices?.front || devices?.back; // const device = devices.front;
  const cameraRef = useRef(null);

  useEffect(() => {
    console.log('Devices:', devices);
    if (devices && devices.front) {
      console.log('Front device:', devices.front);
    } else {
      console.log('Front camera not available');
    }
  }, [devices]);

  const requestPermissions = async () => {
    try {
      const cameraStatus = await Camera.requestCameraPermission();
      const micStatus = await Camera.requestMicrophonePermission();

      if (cameraStatus === 'granted' && micStatus === 'granted') {
        setHasPermission(true);
      } else {
        Alert.alert('Permission Required', 'Camera & microphone permissions are required to use this feature.');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    }
  };

  const handleOpenCamera = async () => {
    await requestPermissions();
    if (hasPermission && device) {
      setShowCamera(true);
    }
  };

  return (
    <View style={styles.page}>
      {showCamera && device ? (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          format={device.formats[0]}
        />
      ) : (
        <>
          <Icon name="wheelchair" size={75} color="white" style={styles.icon} />
          <Text style={styles.title}>Start Glide!</Text>
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
    marginBottom: 10,
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