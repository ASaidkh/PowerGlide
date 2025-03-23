import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, PermissionsAndroid, PanResponder, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Page3 = () => {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const joystickPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

const Page3 = ({ vescState }) => {
  // Get the VESC state from the global state manager
  
  // Define constants inside the component
  const JOYSTICK_SIZE = 150;
  const HANDLE_SIZE = 50;
  const MAX_DISTANCE = (JOYSTICK_SIZE - HANDLE_SIZE) / 2;
  const MAX_RPM = 4000; // Maximum RPM for the motors
  const CAN_ID = 36; // CAN ID for the secondary VESC (left motor)
  
  // Joystick state
  const [joystickX, setJoystickX] = useState(0);
  const [joystickY, setJoystickY] = useState(0);
  
  // Motor RPM state (local copies for display)
  const [leftMotorRPM, setLeftMotorRPM] = useState(0);
  const [rightMotorRPM, setRightMotorRPM] = useState(0);
  
  // Active state for enabling/disabling motor control
  const [isActive, setIsActive] = useState(false);
  
  // Control interval reference
  const controlIntervalRef = useRef(null);
  
  // Animated values for the joystick position
  const pan = useRef(new Animated.ValueXY()).current;

 
  
  useEffect(() => {
    // This will run whenever vescState.states.isConnected changes
    console.log("Connection status in Page3:", vescState.states.isConnected);
    // You could also set a local state here if needed
  }, [vescState.states.isConnected]);

  // Convert joystick position to motor RPM values
  const calculateMotorRPM = (x, y) => {
    // Convert normalized joystick values (-1 to 1) to motor RPM
    
    // Forward/backward motion (throttle) comes from Y axis
    const throttle = y;
    
    // Steering comes from X axis
    const steering = x;
    
    // Calculate left and right motor RPM using differential steering formula
    let leftRPM, rightRPM;
    
    // Basic differential drive algorithm
    if (throttle >= 0) {
      // Moving forward
      leftRPM = MAX_RPM * (throttle + steering);
      rightRPM = MAX_RPM * (throttle - steering);
    } else {
      // Moving backward
      leftRPM = MAX_RPM * (throttle - steering);
      rightRPM = MAX_RPM * (throttle + steering);
    }
    
    // Implement "turn in place" when there's steering but no throttle
    if (Math.abs(throttle) < 0.1 && Math.abs(steering) > 0.1) {
      leftRPM = MAX_RPM * steering;
      rightRPM = -MAX_RPM * steering;
    }
    
    // Clamp values to prevent exceeding MAX_RPM
    leftRPM = Math.max(-MAX_RPM, Math.min(MAX_RPM, leftRPM));
    rightRPM = Math.max(-MAX_RPM, Math.min(MAX_RPM, rightRPM));
    
    return { leftRPM, rightRPM };
  };
  
  // Start sending commands to the VESC
  const startControl = () => {
    if (!vescState.states.isConnected) {
      Alert.alert('Not Connected', 'Please connect to VESC first');
      return;
    }
    
    // Clear any existing interval
    if (controlIntervalRef.current) {
      clearInterval(controlIntervalRef.current);
    }
    
    // Set the active flag
    setIsActive(true);
    
    // Start the control interval
    controlIntervalRef.current = setInterval(() => {
      const { leftRPM, rightRPM } = calculateMotorRPM(joystickX, joystickY);
      
      // Update local state for display
      setLeftMotorRPM(Math.round(leftRPM));
      setRightMotorRPM(Math.round(rightRPM));
      
      // Update the global state
      vescState.setters.setLeftMotorRPM(Math.round(leftRPM));
      vescState.setters.setRightMotorRPM(Math.round(rightRPM));
      
      // Send the commands
      try {
        // Access the control manager from Page1 via the global state
        if (vescState.states.controlInterval) {
          clearInterval(vescState.states.controlInterval);
          vescState.setters.setControlInterval(null);
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setHasLocationPermission(true);
      } else {
        Alert.alert('Permission Denied', 'Location access is required to proceed.');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 140; // Radius of the outer circle minus radius of the joystick maxDistance = rad_circle - rad_circle

        if (distance > maxDistance) {
          const angle = Math.atan2(dy, dx);
          const x = maxDistance * Math.cos(angle);
          const y = maxDistance * Math.sin(angle);
          joystickPosition.setValue({ x, y });
        } else {
          joystickPosition.setValue({ x: dx, y: dy });
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(joystickPosition, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  if (!hasLocationPermission) {
    return (
      <View style={styles.page}>
        <Icon name="gps-fixed" size={75} color="black" style={styles.gpsIcon} />
        <Text style={styles.title}>Begin Navigation</Text>
        <TouchableOpacity style={styles.button} onPress={requestLocationPermission}>
          <Text style={styles.buttonText}>Request Location Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.joystickContainer}>
        <View style={styles.outerCircle}>
          <Animated.View
            style={[
              styles.joystick,
              {
                transform: [
                  { translateX: joystickPosition.x },
                  { translateY: joystickPosition.y },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <Icon name="radio-button-checked" size={50} color="white" />
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'powderblue',
  },
  gpsIcon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: 'black',
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
  joystickContainer: {
    position: 'absolute',
    bottom: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joystick: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Page3;