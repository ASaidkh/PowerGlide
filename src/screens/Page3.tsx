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
        const { dx, dy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 140; // Radius of the outer circle minus radius of the joystick maxDistance = rad_circle - rad_circle

        if (distance > maxDistance) {
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
        vescState.setters.setJoystickY(-normalizedY); // Invert Y for intuitive control (up is positive)
      },
      onPanResponderRelease: () => {
        // Return joystick to center when released
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
        
        // Reset joystick values in global state to zero
        vescState.setters.setJoystickX(0);
        vescState.setters.setJoystickY(0);
      }
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
    marginVertical: 10,
    width: '100%'
  },
  joystickBase: {
    backgroundColor: '#ecf0f1',
    borderWidth: 3,
    borderColor: '#bdc3c7',
    alignItems: 'center',
  },
  outerCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  joystick: {
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
  },
});

export default Page3;