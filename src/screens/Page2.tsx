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

// Create an instance of the One Euro Filter for smooth head angle
class OneEuroFilter {
  private lastTime: number;
  private lastValue: number;
  private lastDerivative: number;
  private minCutoff: number;
  private beta: number;
  private derivateCutoff: number;

  constructor(
    initialValue: number = 0,
    minCutoff: number = 0.5,
    beta: number = 0.05,
    derivateCutoff: number = 1.0
  ) {
    this.lastTime = Date.now();
    this.lastValue = initialValue;
    this.lastDerivative = 0;
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.derivateCutoff = derivateCutoff;
  }

  filter(value: number): number {
    const currentTime = Date.now();
    const dt = Math.max(1, currentTime - this.lastTime) / 1000; // in seconds
    this.lastTime = currentTime;

    // Calculate alpha value (smoothing factor)
    const alpha = this.calculateAlpha(dt, this.minCutoff);
    const derivativeAlpha = this.calculateAlpha(dt, this.derivateCutoff);

    // Calculate derivative
    const derivative = (value - this.lastValue) / dt;
    const smoothedDerivative =
      this.lastDerivative +
      derivativeAlpha * (derivative - this.lastDerivative);

    // Calculate dynamic cutoff frequency based on movement speed
    const cutoff = this.minCutoff + this.beta * Math.abs(smoothedDerivative);
    const dynamicAlpha = this.calculateAlpha(dt, cutoff);

    // Apply filter to current value
    const smoothedValue = this.lastValue + dynamicAlpha * (value - this.lastValue);

    // Update state for next iteration
    this.lastValue = smoothedValue;
    this.lastDerivative = smoothedDerivative;

    return smoothedValue;
  }

  private calculateAlpha(dt: number, cutoff: number): number {
    const tau = 1.0 / (2.0 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }
}

const Page2 = ({ vescState }) => {
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
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  const facesRef = useRef([]);
  const lastProcessedTime = useRef(0);
  // Reference to the filter instance for smooth head angle
  const angleFilter = useRef(new OneEuroFilter(0, 0.5, 0.05, 1.0)).current;
  
  // Reference to the last raw angle for debug purposes
  const lastRawAngle = useRef(0);

  // Destructure all return values from useVoskRecognition hook
  const { result, recognizing, modelLoaded, loadModel, startRecognition, stopRecognition } = useVoskRecognition();

  const faceDetectionOptions = useRef<FaceDetectionOptions>({
    mode: 'accurate',
    detectLandmarks: 'all', // Use all landmarks for better angle detection
    runClassifications: 'all',
    tracking: true, // Enable tracking for more stable face IDs
  }).current;

  const { detectFaces } = useFaceDetector(faceDetectionOptions);

  // Function to calculate angle from face landmarks for more accuracy
  const calculateAngleFromLandmarks = (face: Face): number | null => {
    // Check if the face has landmarks
    if (!face.landmarks || 
        !Array.isArray(face.landmarks) || 
        face.landmarks.length < 5) {
      return null;
    }
    
    try {
      // Extract eye and nose positions
      const leftEye = face.landmarks.find(l => l.type === 'leftEye');
      const rightEye = face.landmarks.find(l => l.type === 'rightEye');
      const nose = face.landmarks.find(l => l.type === 'nose');
      
      if (!leftEye || !rightEye || !nose) {
        return null;
      }
      
      // Calculate eye midpoint (center of face)
      const eyeMidX = (leftEye.position.x + rightEye.position.x) / 2;
      const eyeMidY = (leftEye.position.y + rightEye.position.y) / 2;
      
      // Use the horizontal eye-line as reference for face orientation
      const eyeVector = {
        x: rightEye.position.x - leftEye.position.x,
        y: rightEye.position.y - leftEye.position.y
      };
      
      // Calculate eye line length (distance between eyes)
      const eyeLineLength = Math.sqrt(
        Math.pow(eyeVector.x, 2) + Math.pow(eyeVector.y, 2)
      );
      
      // Calculate nose offset from eye midpoint
      const noseOffset = {
        x: nose.position.x - eyeMidX,
        y: nose.position.y - eyeMidY
      };
      
      // Project nose offset onto eye line to measure left/right deviation
      // This gives us how far the nose is to the left or right relative to face orientation
      const projection = (noseOffset.x * eyeVector.x + noseOffset.y * eyeVector.y) / eyeLineLength;
      
      // Normalize by eye distance and convert to angle
      // When face is turned, the nose projects less onto the eye line
      const normalizedOffset = projection / eyeLineLength;
      
      // Convert to angle (approximately)
      // The relationship between projection and angle is non-linear
      // A simple approximation is to use asin and scale appropriately
      const angle = Math.asin(Math.min(Math.max(normalizedOffset, -0.8), 0.8)) * (180 / Math.PI) * 1.5;
      
      return -angle; // Negative because right is negative in our system
    } catch (error) {
      console.log('Error calculating angle from landmarks:', error);
      return null;
    }
  };

  // Function to fuse multiple angle estimation methods
  const fuseAngleEstimates = (
    nativeYaw: number | undefined, 
    landmarkAngle: number | null, 
    positionAngle: number
  ): number => {
    // Define weights for different methods - total should equal 1.0
    const weights = {
      nativeYaw: 0.6,    // Highest confidence in native yaw
      landmarks: 0.3,    // Good confidence in landmark calculation
      position: 0.1      // Lowest confidence in position calculation
    };
    
    // Start with position-based angle (always available)
    let finalAngle = positionAngle * weights.position;
    let totalWeight = weights.position;
    
    // Add landmark-based angle if available
    if (landmarkAngle !== null) {
      finalAngle += landmarkAngle * weights.landmarks;
      totalWeight += weights.landmarks;
    }
    
    // Add native yaw if available
    if (nativeYaw !== undefined) {
      finalAngle += nativeYaw * weights.nativeYaw;
      totalWeight += weights.nativeYaw;
    }
    
    // Normalize by total weight
    return finalAngle / totalWeight;
  };

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
        break; // Process only one command per recognition
      }
    }
  }, [vescState]);
  
 // Regular function (NOT a worklet)
const handleDetectedFaces = useCallback((detectedFaces, frameWidth, frameHeight) => {
  // Store faces in ref instead of state to avoid re-renders
  facesRef.current = detectedFaces;
  
  if (detectedFaces.length === 0) return;

  const face = detectedFaces[0];
  if (!face.bounds || !face.bounds.width) return;

  // Calculate position-based angle (traditional method)
  const { x, width } = face.bounds;
  const centerX = frameWidth / 2;
  const faceCenter = x + width / 2;
  
  // Apply a non-linear response curve for position-based calculation
  const offsetPercentage = (faceCenter - centerX) / (frameWidth / 2);
  const positionBasedAngle = -Math.sign(offsetPercentage) * Math.pow(Math.abs(offsetPercentage), 0.8) * 50;
  
  // Get landmark-based angle if possible
  const landmarkAngle = calculateAngleFromLandmarks(face);
  
  // Get native yaw angle if available
  const nativeYaw = face.yawAngle;
  
  // Fuse all available angle estimates
  const fusedAngle = fuseAngleEstimates(nativeYaw, landmarkAngle, positionBasedAngle);
  
  // Store the raw angle for debugging
  lastRawAngle.current = fusedAngle;
  
  // Apply temporal filtering for smooth movement
  const smoothedAngle = angleFilter.filter(fusedAngle);
  
  // Round to 1 decimal place for stability and readability
  const finalAngle = parseFloat(smoothedAngle.toFixed(1));
  
  // Update the headAngle state for the live degree bar - UI update
  setHeadAngle(finalAngle);

  // Adaptive neutral zone - wider when using less reliable methods
  const neutralThreshold = nativeYaw !== undefined ? 8 : 
                          landmarkAngle !== null ? 6 : 5;
  
  // Check if the face is in neutral position
  const isNeutral = Math.abs(finalAngle) < neutralThreshold;

  // Determine head direction with more granularity
  let directionText = 'Neutral';
  if (!isNeutral) {
    if (finalAngle > 30) {
      directionText = 'Far Left';
    } else if (finalAngle > 15) {
      directionText = 'Left';
    } else if (finalAngle > neutralThreshold) {
      directionText = 'Slight Left';
    } else if (finalAngle < -30) {
      directionText = 'Far Right';
    } else if (finalAngle < -15) {
      directionText = 'Right';
    } else if (finalAngle < -neutralThreshold) {
      directionText = 'Slight Right';
    }
  }

  // Convert angle to improved joystick values for VESC control
  let command = { x: 0, y: 0 };
  
  if (!isNeutral) {
    // Map the angle to a joystick value with non-linear response curve
    // This creates more precise control in the center range
    
    // Define max angle considered for full turn
    const maxAngle = 40; 
    
    // Normalize angle to [-1, 1] range, capped at max
    const normalizedAngle = Math.max(-1, Math.min(1, finalAngle / maxAngle));
    
    // Apply a quadratic response curve for finer center control 
    // Sign preserves direction, power adjusts the curve shape
    const curvedResponse = Math.sign(normalizedAngle) * Math.pow(Math.abs(normalizedAngle), 1.5);
    
    // Scale to appropriate joystick range with 0.8 max for stability
    command.x = -curvedResponse * 0.8; // Negate because left turns should be negative X
    
    // Forward bias - maintain slight forward motion for better steering
    // Only apply if not already being controlled by voice
    if (Math.abs(vescState.states.joystickY) < 0.1) {
      command.y = 0.3; // Slight forward bias helps with steering
    } else {
      command.y = vescState.states.joystickY; // Maintain current Y from voice
    }
  }

  // Determine if we should update the state and log
  const currentTime = Date.now();
  const timeSinceLastLog = currentTime - lastLoggedTime;
  
  // Store current direction in variables to avoid unnecessary state updates
  const directionChanged = directionText !== headDirection;
  const currentWasNeutral = wasNeutral;
  const transitionToNeutral = !currentWasNeutral && isNeutral;
  const transitionFromNeutral = currentWasNeutral && !isNeutral;
  
  // Log and update state when significant changes occur - UI update
  if (directionChanged || timeSinceLastLog >= 15000 || transitionToNeutral || transitionFromNeutral) {
    setHeadDirection(directionText);
    setLastLoggedTime(currentTime);
    setWasNeutral(isNeutral);
    
    // Log detailed info for diagnostics
    console.log(
      `Head angle: ${finalAngle.toFixed(1)}° (raw: ${lastRawAngle.current.toFixed(1)}°) → ` +
      `${directionText}${isNeutral ? '' : ` → Command X: ${command.x.toFixed(2)}`}`
    );
    
    // Additional debug info when available
    if (nativeYaw !== undefined || landmarkAngle !== null) {
      console.log(
        `Angle sources: ${nativeYaw !== undefined ? `Native: ${nativeYaw.toFixed(1)}° ` : ''}` +
        `${landmarkAngle !== null ? `Landmarks: ${landmarkAngle.toFixed(1)}° ` : ''}` +
        `Position: ${positionBasedAngle.toFixed(1)}°`
      );
    }
  }

  // Send command to VESC state if not neutral - control update
  if (!isNeutral) {
    vescState.setters.setJoystickX(command.x);
    
    // Only update Y if we're providing a forward bias and not overriding voice commands
    if (command.y !== 0 && Math.abs(vescState.states.joystickY) < 0.1) {
      vescState.setters.setJoystickY(command.y);
    }
  } else if (transitionToNeutral) {
    // When returning to neutral, stop turning but keep forward/backward motion
    vescState.setters.setJoystickX(0);
  }
}, [vescState, angleFilter, headDirection, wasNeutral, lastLoggedTime]);

  const workletHandleDetectedFaces = Worklets.createRunOnJS((detectedFaces, frameWidth, frameHeight) => {
    // Throttle processing to avoid performance issues
    const now = Date.now();
    if (now - lastProcessedTime.current < 200) {
      return; // Skip this frame if less than 200ms since last processing
    }
    
    lastProcessedTime.current = now;
    handleDetectedFaces(detectedFaces, frameWidth, frameHeight);
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const detectedFaces = detectFaces(frame);
    workletHandleDetectedFaces(detectedFaces, frame.width, frame.height);
  }, [workletHandleDetectedFaces]);

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
            frameProcessorFps={10} // Increased for better responsiveness
            onError={(error) => {
              console.error('Camera error:', error);
            }}
          />
          
          {/* Enhanced angle indicator that moves with the user's face */}
          <View style={styles.angleIndicator}>
            <View style={styles.angleBar}>
              <View 
                style={[styles.anglePointer, { left: `${50 - (headAngle / 45) * 50}%` }]} 
              />
              {/* Add tick marks for better reference */}
              <View style={[styles.angleTick, { left: '25%' }]} />
              <View style={[styles.angleTick, { left: '50%' }]} />
              <View style={[styles.angleTick, { left: '75%' }]} />
            </View>
            <View style={styles.angleLabels}>
              <Text style={styles.angleLabel}>-45°</Text>
              <Text style={styles.angleLabel}>0°</Text>
              <Text style={styles.angleLabel}>45°</Text>
            </View>
          </View>
          
          <View style={styles.headDirectionTop}>
            <Text style={styles.headDirectionText}>Face: {headDirection}</Text>
            <Text style={styles.headAngleText}>{headAngle.toFixed(1)}°</Text>
            {faces.length > 0 && (
              <Text style={styles.faceDataText}>
                Face Detected: {faces[0].yawAngle !== undefined ? 'Full Data' : 'Basic Data'}
              </Text>
            )}
          </View>
          
          {/* Shows if audio recognition is active */}
          {micOn && (
            <View style={styles.voiceIndicator}>
              <Text style={styles.voiceIndicatorText}>
                {recognizing ? "Listening..." : "Voice Ready"}
              </Text>
            </View>
          )}
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