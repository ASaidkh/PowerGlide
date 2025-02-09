import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/FontAwesome5';

const Page2 = () => {
  const device = useCameraDevice('front'); // Get the front camera
  const { hasPermission, requestPermission } = useCameraPermission(); // Use built-in permission hook
  const [showCamera, setShowCamera] = React.useState(false);

  const handleOpenCamera = async () => {
    const granted = await requestPermission(); // Request camera & microphone permissions
    if (granted) {
      setShowCamera(true);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <TouchableOpacity style={styles.button} onPress={handleOpenCamera}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>No Front Camera Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {showCamera ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
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
