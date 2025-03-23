import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  PanResponder, 
  Animated, 
  SafeAreaView,
  TouchableOpacity,
  Alert
} from 'react-native';


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
      } catch (error) {
        console.error('Failed to clear previous control interval', error);
      }
    }, 100); // Update at 10Hz
  };
  
  // Stop sending commands
  const stopControl = () => {
    // Clear the control interval
    if (controlIntervalRef.current) {
      clearInterval(controlIntervalRef.current);
      controlIntervalRef.current = null;
    }
    
    // Reset the active flag
    setIsActive(false);
    
    // Set motors to zero
    setLeftMotorRPM(0);
    setRightMotorRPM(0);
    vescState.setters.setLeftMotorRPM(0);
    vescState.setters.setRightMotorRPM(0);
  };
  
  // Update motor commands when joystick moves
  useEffect(() => {
    if (isActive && vescState.states.isConnected) {
      const { leftRPM, rightRPM } = calculateMotorRPM(joystickX, joystickY);
      setLeftMotorRPM(Math.round(leftRPM));
      setRightMotorRPM(Math.round(rightRPM));
      
      // Update global state so Page1 can send these values
      vescState.setters.setLeftMotorRPM(Math.round(leftRPM));
      vescState.setters.setRightMotorRPM(Math.round(rightRPM));
    }
  }, [joystickX, joystickY, isActive, vescState]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (controlIntervalRef.current) {
        clearInterval(controlIntervalRef.current);
      }
    };
  }, []);
  
  // Create the pan responder for touch control
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Save the initial position when touch starts
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate distance from center
        const dx = gestureState.dx;
        const dy = gestureState.dy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize values if distance exceeds max radius
        let newX = dx;
        let newY = dy;
        
        if (distance > MAX_DISTANCE) {
          const angle = Math.atan2(dy, dx);
          newX = MAX_DISTANCE * Math.cos(angle);
          newY = MAX_DISTANCE * Math.sin(angle);
        }
        
        // Update the animated value
        pan.setValue({ x: newX, y: newY });
        
        // Calculate normalized joystick values (-1 to 1)
        const normalizedX = parseFloat((newX / MAX_DISTANCE).toFixed(2));
        const normalizedY = parseFloat((newY / MAX_DISTANCE).toFixed(2));
        
        // Update the state with normalized values
        setJoystickX(normalizedX);
        setJoystickY(-normalizedY); // Invert Y for intuitive control (up is positive)
      },
      onPanResponderRelease: () => {
        // Return to center when released
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5
        }).start();
        
        // Reset joystick values to zero
        setJoystickX(0);
        setJoystickY(0);
      }
    })
  ).current;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Joystick Controller</Text>
      
      <View style={styles.connectionStatus}>
        <Text style={[
          styles.connectionText, 
          vescState.states.isConnected ? styles.connected : styles.disconnected
        ]}>
          {vescState.states.isConnected ? 'VESC Connected' : 'VESC Disconnected'}
        </Text>
      </View>
      
      <View style={styles.valueContainer}>
        <View>
          <Text style={styles.valueText}>Joystick X: {joystickX.toFixed(2)}</Text>
          <Text style={styles.valueText}>Joystick Y: {joystickY.toFixed(2)}</Text>
        </View>
        <View>
          <Text style={styles.valueText}>Left RPM: {leftMotorRPM}</Text>
          <Text style={styles.valueText}>Right RPM: {rightMotorRPM}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.controlButton, 
          isActive ? styles.activeButton : styles.inactiveButton,
          !vescState.states.isConnected && styles.disabledButton
        ]}
        onPress={() => {
          if (vescState.states.isConnected) {
            if (isActive) {
              stopControl();
            } else {
              startControl();
            }
          } else {
            Alert.alert('Not Connected', 'Please connect to VESC on the Connections page first');
          }
        }}
        disabled={!vescState.states.isConnected}
      >
        <Text style={styles.buttonText}>
          {isActive ? 'MOTORS ACTIVE' : 'MOTORS INACTIVE'}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.joystickContainer}>
        <View style={[
          styles.joystickBase, 
          { width: JOYSTICK_SIZE, height: JOYSTICK_SIZE, borderRadius: JOYSTICK_SIZE / 2 },
          !vescState.states.isConnected && styles.joystickDisabled
        ]}>
          <Animated.View
            style={[
              styles.joystickHandle,
              {
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                borderRadius: HANDLE_SIZE / 2,
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y }
                ]
              },
              !vescState.states.isConnected && styles.handleDisabled
            ]}
            {...(vescState.states.isConnected ? panResponder.panHandlers : {})}
          />
        </View>
      </View>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>
          Drag the joystick to control motor speed and direction.
        </Text>
        <Text style={styles.instructions}>
          Y-axis: Forward/Reverse speed
        </Text>
        <Text style={styles.instructions}>
          X-axis: Steering (turn left/right)
        </Text>
        <Text style={styles.instructions}>
          {vescState.states.isConnected 
            ? 'Press the button above to activate motor control.' 
            : 'Connect to your VESC on the Connections page first.'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10
  },
  connectionStatus: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10
  },
  connectionText: {
    fontWeight: 'bold',
    fontSize: 16
  },
  connected: {
    color: '#2ecc71'
  },
  disconnected: {
    color: '#e74c3c'
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    padding: 5
  },
  joystickContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30
  },
  joystickBase: {
    backgroundColor: '#ecf0f1',
    borderWidth: 2,
    borderColor: '#bdc3c7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  joystickDisabled: {
    backgroundColor: '#d5dbdb',
    borderColor: '#95a5a6',
    opacity: 0.7
  },
  joystickHandle: {
    backgroundColor: '#3498db',
    position: 'absolute',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  handleDisabled: {
    backgroundColor: '#7f8c8d',
    opacity: 0.7
  },
  instructionsContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  instructions: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 14,
    marginBottom: 5
  },
  controlButton: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    elevation: 3
  },
  activeButton: {
    backgroundColor: '#2ecc71' // Green when active
  },
  inactiveButton: {
    backgroundColor: '#e74c3c' // Red when inactive
  },
  disabledButton: {
    backgroundColor: '#95a5a6', // Gray when disabled
    opacity: 0.7
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default Page3;