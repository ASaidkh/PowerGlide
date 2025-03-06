import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  PanResponder, 
  Animated, 
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';

const Page3 = ({ vescState }) => {
  // Define constants inside the component
  const JOYSTICK_SIZE = 150;
  const HANDLE_SIZE = 50;
  const MAX_DISTANCE = (JOYSTICK_SIZE - HANDLE_SIZE) / 2;
  
  // Joystick state
  const [joystickX, setJoystickX] = useState(0);
  const [joystickY, setJoystickY] = useState(0);
  
  // Active state for enabling/disabling control
  const [isActive, setIsActive] = useState(false);
  
  // Bluetooth data sending state
  const [isSendingData, setIsSendingData] = useState(false);
  const [lastSentTimestamp, setLastSentTimestamp] = useState(0);
  const [sendSuccess, setSendSuccess] = useState(true);
  const [sendAttempts, setSendAttempts] = useState(0);
  const [lastError, setLastError] = useState(null);
  
  // Control interval reference
  const bluetoothIntervalRef = useRef(null);
  const joystickXRef = useRef(0);
const joystickYRef = useRef(0);
  // Check connection status changes
  useEffect(() => {
    console.log("Connection status in Page3:", vescState.states.isConnected);
    
    // If disconnected while active, stop control
    if (!vescState.states.isConnected && isActive) {
      stopControl();
      Alert.alert(
        'Connection Lost',
        'Bluetooth connection was lost. Please reconnect from the Connections page.'
      );
    }
  }, [vescState.states.isConnected]);


  useEffect(() => {
    // Update refs to track current joystick values
    joystickXRef.current = joystickX;
    joystickYRef.current = joystickY;
  }, [joystickX, joystickY]);
  
  // Start sending joystick commands via Bluetooth
  const startControl = () => {
    if (!vescState.states.isConnected) {
      Alert.alert('Not Connected', 'Please connect to Bluetooth device first');
      return;
    }
    
    // Clear any existing interval
    if (bluetoothIntervalRef.current) {
      clearInterval(bluetoothIntervalRef.current);
    }
    
    // Set the active flag
    setIsActive(true);
    setIsSendingData(true);
    setSendSuccess(true);
    setSendAttempts(0);
    setLastError(null);
    
    // Update joystick values in global state
    //vescState.setters.setJoystickX(joystickX);
    //vescState.setters.setJoystickY(joystickY);
    
    // Start the Bluetooth data sending interval
    bluetoothIntervalRef.current = setInterval(async () => {
      if (vescState.states.bluetoothDevice && vescState.states.isConnected) {
        // Send joystick values over Bluetooth
        try {
          // Create data packet for Bluetooth
          const data = {
            type: 'joystick',
            x: joystickXRef.current, // Use ref instead of captured state
            y: joystickYRef.current, 
            timestamp: Date.now()
          };

          console.log("Data preparing to send:", data);
          
          // Send data to the connected device
          const success = await vescState.actions.sendDataToBluetooth(data);
          
          if (success) {
            setLastSentTimestamp(Date.now());
            setSendSuccess(true);
            setSendAttempts(0);
          } else {
            setSendSuccess(false);
            setSendAttempts(prev => prev + 1);
            
            // After 10 failed attempts, notify the user but keep trying
            if (sendAttempts >= 10 && sendAttempts % 10 === 0) {
              console.warn(`Failed to send data ${sendAttempts} times`);
            }
            
            // After 50 failed attempts, stop control
            if (sendAttempts >= 50) {
              console.error('Max send attempts reached, stopping control');
              stopControl();
              Alert.alert(
                'Connection Problem',
                'Failed to send data multiple times. Please check your connection and try again.',
                [{ text: 'OK' }]
              );
            }
          }
        } catch (error) {
          console.error('Error sending Bluetooth data:', error);
          setLastError(error.message || 'Unknown error');
          setSendSuccess(false);
          setSendAttempts(prev => prev + 1);
        }
      } else if (isActive) {
        // If we lost connection while active, stop control
        stopControl();
        if (vescState.states.bluetoothDevice) {
          Alert.alert(
            'Connection Problem',
            'The Bluetooth connection appears to be inactive. Please reconnect from the Connections page.',
            [{ text: 'OK' }]
          );
        }
      }
    }, 100); // Send at 10Hz (adjust as needed for your application)
  };
  
  // Stop sending commands
  const stopControl = () => {
    // Clear interval
    if (bluetoothIntervalRef.current) {
      clearInterval(bluetoothIntervalRef.current);
      bluetoothIntervalRef.current = null;
    }
    
    // Reset all flags
    setIsActive(false);
    setIsSendingData(false);
    setSendSuccess(true);
    setSendAttempts(0);
    
    // Reset joystick values
    setJoystickX(0);
    setJoystickY(0);
    vescState.setters.setJoystickX(0);
    vescState.setters.setJoystickY(0);
    
    // If still connected, send zero joystick values as final command
    if (vescState.states.isConnected && vescState.states.bluetoothDevice) {
      try {
        vescState.actions.sendDataToBluetooth({
          type: 'joystick',
          x: joystickX,
          y: joystickY,
          timestamp: Date.now()
        });
      } catch (error) {
        // Just log the error but don't alert the user since we're stopping anyway
        console.error('Error sending stop command:', error);
      }
    }
  };
  
  // Update joystick values in global state when they change
  useEffect(() => {
    if (isActive) {
      vescState.setters.setJoystickX(joystickX);
      vescState.setters.setJoystickY(joystickY);
      console.log(`Joystick updated: X=${vescState.states.joystickX}, Y=${vescState.states.joystickY}`);
    }
  }, [joystickX, joystickY, isActive, vescState]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (bluetoothIntervalRef.current) {
        clearInterval(bluetoothIntervalRef.current);
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

  // Animated values for the joystick position
  const pan = useRef(new Animated.ValueXY()).current;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Joystick Controller</Text>
      
      <View style={styles.connectionStatus}>
        <Text style={[
          styles.connectionText, 
          vescState.states.isConnected ? styles.connected : styles.disconnected
        ]}>
          {vescState.states.isConnected ? 'Bluetooth Connected' : 'Bluetooth Disconnected'}
        </Text>
        {isSendingData && (
          <View>
            <Text style={[
              styles.sendingDataText,
              !sendSuccess && styles.sendingErrorText
            ]}>
              {sendSuccess 
                ? `Sending data... (Last: ${new Date(lastSentTimestamp).toLocaleTimeString()})` 
                : `Connection issues (Attempts: ${sendAttempts})`
              }
            </Text>
            {!sendSuccess && lastError && (
              <Text style={styles.errorText}>Error: {lastError}</Text>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.valueContainer}>
        <View>
          <Text style={styles.valueText}>Joystick X: {joystickX.toFixed(2)}</Text>
          <Text style={styles.valueText}>Joystick Y: {joystickY.toFixed(2)}</Text>
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
            Alert.alert('Not Connected', 'Please connect to Bluetooth device on the Connections page first');
          }
        }}
        disabled={!vescState.states.isConnected}
      >
        {isSendingData && !sendSuccess ? (
          <ActivityIndicator color="white" size="small" style={styles.buttonSpinner} />
        ) : null}
        <Text style={styles.buttonText}>
          {isActive ? 'SEND DATA ACTIVE' : 'SEND DATA INACTIVE'}
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
          Drag the joystick to control and send data to the connected Bluetooth device.
        </Text>
        <Text style={styles.instructions}>
          Y-axis: Forward/Reverse motion
        </Text>
        <Text style={styles.instructions}>
          X-axis: Steering (turn left/right)
        </Text>
        <Text style={styles.instructions}>
          {vescState.states.isConnected 
            ? 'Press the button above to start sending joystick data.' 
            : 'Connect to a Bluetooth device on the Connections page first.'}
        </Text>
      </View>
      
      {/* Troubleshooting Guide */}
      {!sendSuccess && sendAttempts > 5 && (
        <View style={styles.troubleshootingContainer}>
          <Text style={styles.troubleshootingTitle}>Troubleshooting Tips:</Text>
          <Text style={styles.troubleshooting}>
            • Make sure the PC's Bluetooth is turned on and discoverable
          </Text>
          <Text style={styles.troubleshooting}>
            • Try disconnecting and reconnecting from the Connections page
          </Text>
          <Text style={styles.troubleshooting}>
            • Restart both the app and the server on your PC
          </Text>
          <Text style={styles.troubleshooting}>
            • Check that Windows Bluetooth services are running
          </Text>
        </View>
      )}
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
    marginBottom: 10,
    alignItems: 'center'
  },
  connectionText: {
    fontWeight: 'bold',
    fontSize: 16
  },
  sendingDataText: {
    fontSize: 14,
    color: '#3498db',
    marginTop: 5
  },
  sendingErrorText: {
    color: '#e74c3c'
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 2
  },
  connected: {
    color: '#2ecc71'
  },
  disconnected: {
    color: '#e74c3c'
  },
  buttonSpinner: {
    marginRight: 10
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
  troubleshootingContainer: {
    padding: 15,
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 10,
    width: '90%'
  },
  troubleshootingTitle: {
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5
  },
  troubleshooting: {
    color: '#856404',
    fontSize: 13,
    marginBottom: 3
  },
  controlButton: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center'
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