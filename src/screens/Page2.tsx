// screens/Page2.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import Reanimated from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';

import styles from '../utils/Page2styles';
import { usePermissions } from '../hooks/usePermissions';
import useVoskRecognition from '../hooks/UseVoskRecognition';
import { useHeadAngleProcessor } from '../hooks/useHeadAngleProcessor';
import HeadAngleDisplay from '../components/HeadAngleDisplay';
import VoiceIndicator from '../components/VoiceIndicator';

const requestCallPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
        {
          title: 'Phone Call Permission',
          message: 'App needs permission to make emergency calls.',
          buttonPositive: 'Allow',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.warn('Permission error:', error);
      return false;
    }
  }
  return true; // iOS handles permission at runtime via Linking
};

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

const Page2 = ({ vescState }) => {
  const device = useCameraDevice('front');
  const { hasCameraPermission, hasMicPermission, requestPermissions } = usePermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [micOn, setMicOn] = useState(false);

  const { result, recognizing, modelLoaded, loadModel, startRecognition, stopRecognition } = useVoskRecognition();
  const { headAngle, headDirection, frameProcessor } = useHeadAngleProcessor(vescState);

  useEffect(() => {
    requestPermissions().then(granted => {
      if (granted) setShowCamera(true);
      else {
        Alert.alert('Permission Required', 'Enable camera & mic', [
          { text: 'Settings', onPress: () => Linking.openSettings() },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
    });
    loadModel();
  }, []);

  const processVoiceCommand = async (text: string) => {
    const command = text.toLowerCase().trim();
    const commandMappings: Record<string, { x: number; y: number }> = {
      'go': { x: 0, y: 0.4 },
      'reverse': { x: 0, y: -0.4 },
      'speed one': { x: 0, y: 0.4 },
      'speed two': { x: 0, y: 0.7 },
      'speed three': { x: 0, y: 1 },
      'stop': { x: 0, y: 0 },
      'left': { x: -1, y: 0 },
      'right': { x: 1, y: 0 },
    };

    for (const [key, value] of Object.entries(commandMappings)) {
      if (command.includes(key)) {
        vescState.setters.setJoystickX(value.x);
        vescState.setters.setJoystickY(value.y);
        console.log(`Voice command recognized: ${key} -> x: ${value.x}, y: ${value.y}`);
        return;
      }
    }

    if (command.includes('help me')) {
      console.log('Voice command: help me');

      const granted = await requestCallPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Cannot place a call without permission.');
        return;
      }

      try {
        const storedNumber = await AsyncStorage.getItem('emergency_contact');
        
        if (!storedNumber) {
          // No contact saved, show an error message
          Alert.alert('Error', 'No emergency contact saved. Please set one up in the settings.');
          return;
        }

        const phoneNumber = `tel:${storedNumber}`;
        await Linking.openURL(phoneNumber);
      } catch (error) {
        Alert.alert('Call Failed', 'Unable to open the dialer.');
        console.error(error);
      }
    }
  };

  useEffect(() => {
    if (modelLoaded && micOn) startRecognition();
    else stopRecognition();
  }, [modelLoaded, micOn]);

  useEffect(() => {
    if (result) {
      processVoiceCommand(result);
    }
  }, [result]);

  if (!device) return <Text>No camera device</Text>;

  return (
    <View style={styles.page}>
      {showCamera ? (
        <>
          <ReanimatedCamera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive
            frameProcessor={frameProcessor}
            frameProcessorFps={10}
          />
          <HeadAngleDisplay headAngle={headAngle} headDirection={headDirection} />
          {micOn && <VoiceIndicator recognizing={recognizing} />}
        </>
      ) : (
        <View style={styles.cameraOffContainer}>
          {/* Only show the icon and text when the camera is closed */}
          <Icon name="wheelchair" size={75} color="white" style={styles.icon} />
          <Text style={styles.title}>Start Glide!</Text>
        </View>
      )}

      {/* Always show the bottom control buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={() => setShowCamera(prev => !prev)} style={styles.controlButton}>
          <Text style={styles.buttonText}>{showCamera ? 'Close Camera' : 'Open Camera'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMicOn(prev => !prev)} style={styles.controlButton}>
          <Text style={styles.buttonText}>{micOn ? 'Stop Mic' : 'Start Mic'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Page2;
