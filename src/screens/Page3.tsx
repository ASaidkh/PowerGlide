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
  // Define constants with larger sizes
  const JOYSTICK_SIZE = 350;
  const HANDLE_SIZE = 80;
  const MAX_DISTANCE = (JOYSTICK_SIZE - HANDLE_SIZE) / 2;
  
  // Local state for display purposes
  const [displayLeftMotorRPM, setDisplayLeftMotorRPM] = useState(0);
  const [displayRightMotorRPM, setDisplayRightMotorRPM] = useState(0);
  
  // Active state for enabling/disabling motor control
  const [isActive, setIsActive] = useState(false);
  
  // Control interval reference
  const controlIntervalRef = useRef(null);
  
  // Animated values for the joystick position
  const pan = useRef(new Animated.ValueXY()).current;

  // Update display when actual motor RPM values change
  useEffect(() => {
    setDisplayLeftMotorRPM(vescState.states.LeftMotorRPM);
    setDisplayRightMotorRPM(vescState.states.RightMotorRPM);
  }, [vescState.states.LeftMotorRPM, vescState.states.RightMotorRPM]);
  
  // Start sending joystick values to the global state
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
    
    // If there's an existing control interval in the VESC state, we need to ensure
    // it's running with our joystick values
    if (!vescState.states.isRunning && vescState.states.isConnected) {
      // Tell the state manager to start the motors
      vescState.setters.setIsRunning(true);
    }
  };
  
  // Stop sending commands
  const stopControl = () => {
    // Clear any local interval
    if (controlIntervalRef.current) {
      clearInterval(controlIntervalRef.current);
      controlIntervalRef.current = null;
    }
    
    // Reset the active flag
    setIsActive(false);
    
    // Reset joystick position in global state
    vescState.setters.setJoystickX(0);
    vescState.setters.setJoystickY(0);
    
    // If the motors are running, stop them
    if (vescState.states.isRunning) {
      vescState.setters.setIsRunning(false);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (controlIntervalRef.current) {
        clearInterval(controlIntervalRef.current);
      }
      // Reset joystick values when leaving this page
      vescState.setters.setJoystickX(0);
      vescState.setters.setJoystickY(0);
    };
  }, []);
  
  // Create the pan responder for touch control
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // No longer using setOffset which can cause issues
        // Just start from current position
        pan.setValue({ x: 0, y: 0 });
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
        
        // Update the animated value for visual feedback
        pan.setValue({ x: newX, y: newY });
        
        // Calculate normalized joystick values (-1 to 1)
        const normalizedX = parseFloat((newX / MAX_DISTANCE).toFixed(2));
        const normalizedY = parseFloat((newY / MAX_DISTANCE).toFixed(2));
        
        // Update the global state with normalized values
        vescState.setters.setJoystickX(normalizedX);
        vescState.setters.setJoystickY(normalizedY); // Invert Y for intuitive control (up is positive)
      },
      onPanResponderRelease: () => {
        // Return joystick to center when released
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5
        }).start();
        
        // Reset joystick values in global state to zero
        vescState.setters.setJoystickX(0);
        vescState.setters.setJoystickY(0);
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
          <Text style={styles.valueText}>Joystick X: {vescState.states.joystickX.toFixed(2)}</Text>
          <Text style={styles.valueText}>Joystick Y: {vescState.states.joystickY.toFixed(2)}</Text>
        </View>
        <View>
          <Text style={styles.valueText}>Left RPM: {displayLeftMotorRPM}</Text>
          <Text style={styles.valueText}>Right RPM: {displayRightMotorRPM}</Text>
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
          {isActive ? 'JOYSTICK ACTIVE' : 'JOYSTICK INACTIVE'}
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
            {...panResponder.panHandlers}  // Always apply panHandlers regardless of isActive
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
    marginVertical: 10,
    width: '100%'
  },
  joystickBase: {
    backgroundColor: '#ecf0f1',
    borderWidth: 3,
    borderColor: '#bdc3c7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  joystickDisabled: {
    backgroundColor: '#d5dbdb',
    borderColor: '#95a5a6',
    opacity: 0.7
  },
  joystickHandle: {
    backgroundColor: '#3498db',
    position: 'absolute',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#2980b9'
  },
  handleDisabled: {
    backgroundColor: '#7f8c8d',
    opacity: 0.7
  },
  instructionsContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginTop: 5
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
    marginVertical: 5,
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