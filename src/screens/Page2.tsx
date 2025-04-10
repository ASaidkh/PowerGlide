import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, AppState } from 'react-native';
import styles from '../utils/Page2styles'; // adjust the path if styles.ts is in a different folder
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
      console.log(`Voice command recognized: ${result}`);
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

  const processVoiceCommand = useCallback((text: string) => {
    const command = text.toLowerCase().trim(); // Normalize input
    
    // Map commands to corresponding VESC control values
    const commandMappings: Record<string, { x: number; y: number }> = {
      'go': { x: 0, y: 1 },          // Move forward
      'reverse': { x: 0, y: -1 },    // Move backward
      'speed one': { x: 0, y: 0.4 }, // Low speed
      'speed two': { x: 0, y: 0.7 },   // Medium speed
      'speed three': { x: 0, y: 1 }, // High speed
      'stop': { x: 0, y: 0 },        // Stop movement
      'left': { x: -1, y: 0 },       // Turn left
      'right': { x: 1, y: 0 },       // Turn right
      'help me': { x: 0, y: 0 },     // Emergency (no movement)
    };
  
    // Find a matching command
    for (const [key, value] of Object.entries(commandMappings)) {
      if (command.includes(key)) {
        console.log(`Voice command recognized: ${key} -> x: ${value.x}, y: ${value.y}`);
        
        // Send `x` and `y` values to VESC state update
        vescState.setters.setJoystickX(value.x);
        vescState.setters.setJoystickY(value.y);
        // vescState.updateCommand({ x: value.x, y: value.y } as Command);
        break; // Process only one command per recognition
      }
    }
  }, [vescState]);
  
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
    const roundedAngle = parseFloat(calculatedAngle.toFixed(2));
    
    // Use face.yawAngle if available (more accurate)
    const angle = face.yawAngle !== undefined ? parseFloat(face.yawAngle.toFixed(2)) : roundedAngle;

    // Update the headAngle state for the live degree bar
    setHeadAngle(angle);

    // Check if the face is in neutral position
    const isNeutral = Math.abs(angle) < 5;

    // Convert angle to x, y using unit circle approximation
    let directionText = 'Neutral';
    let command = { x: 0, y: 0 };
    
    if (!isNeutral) {
        const radians = (angle * Math.PI) / 180;
        command.x = Math.sin(radians); // Left (-) or Right (+)
        command.y = Math.cos(radians); // Forward movement component
        
        directionText = angle > 0 ? 'Left' : 'Right';
    }

    const currentTime = Date.now();
    const timeDifference = currentTime - lastLoggedTime;
    const angleDifference = Math.abs(angle - previousAngle);

    // Determine if we should log based on significant change or time interval
    const transitionToNeutral = !wasNeutral && isNeutral;
    const transitionFromNeutral = wasNeutral && !isNeutral;
    
    if (angleDifference >= 5 || timeDifference >= 15000 || transitionToNeutral || transitionFromNeutral) {
        if (directionText !== headDirection || timeDifference >= 15000 || transitionToNeutral || transitionFromNeutral) {
            setHeadDirection(directionText);
            setPreviousAngle(angle);
            setLastLoggedTime(currentTime);
            setWasNeutral(isNeutral);
        }

        // Send command to VESC state if not neutral
        if (!isNeutral) {
            vescState.setters.setJoystickX(command.x);
            vescState.setters.setJoystickY(command.y);
            console.log(`Direction command added: ${directionText} (${angle}°) -> x: ${command.x.toFixed(2)}, y: ${command.y.toFixed(2)}`);
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

export default Page2;