import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const Page2 = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);

  const devices = useCameraDevices();
  const device = devices.front; // You can choose front or back camera

  const handlePress = async () => {
    // Request permissions
    const cameraPermission = await request(PERMISSIONS.ANDROID.CAMERA);
    const microphonePermission = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);

    if (cameraPermission === RESULTS.GRANTED && microphonePermission === RESULTS.GRANTED) {
      setHasPermission(true);
    } else {
      alert('Permissions not granted. Please enable camera and microphone permissions.');
    }
  };

  return (
    <View style={[styles.page, { backgroundColor: 'white' }]}>
      <Text style={styles.title}>Start Glide!</Text>

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Open Camera & Microphone</Text>
      </TouchableOpacity>

      {/* Camera view */}
      {hasPermission && device != null ? (
        <Camera
          style={styles.camera}
          device={device}
          isActive={true}
          ref={ref => setCameraRef(ref)}
        />
      ) : (
        <Text>No camera access</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: 'black',
  },
  button: {
    backgroundColor: 'blue', // Button color
    paddingVertical: 10, // Vertical padding for the button
    paddingHorizontal: 20, // Horizontal padding for the button
    borderRadius: 5, // Optional: Rounded corners
    marginBottom: 20, // Add space between button and camera
  },
  buttonText: {
    color: 'white', // Text color
    fontSize: 16, // Font size of the button text
    fontWeight: 'bold', // Make the text bold
    textAlign: 'center', // Center the text within the button
  },
  camera: {
    width: '100%',
    height: '60%',
    marginTop: 20,
  },
});

export default Page2;
