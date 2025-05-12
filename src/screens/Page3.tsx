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
  const JOYSTICK_SIZE = 350;
  const HANDLE_SIZE = 80;
  const MAX_DISTANCE = (JOYSTICK_SIZE - HANDLE_SIZE) / 2;

  const [displayLeftMotorRPM, setDisplayLeftMotorRPM] = useState(0);
  const [displayRightMotorRPM, setDisplayRightMotorRPM] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const controlIntervalRef = useRef(null);
  const pan = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    setDisplayLeftMotorRPM(vescState.states.LeftMotorRPM);
    setDisplayRightMotorRPM(vescState.states.RightMotorRPM);
  }, [vescState.states.LeftMotorRPM, vescState.states.RightMotorRPM]);

  const startControl = () => {
    if (!vescState.states.isConnected) {
      Alert.alert('Not Connected', 'Please connect to VESC first');
      return;
    }
    if (controlIntervalRef.current) {
      clearInterval(controlIntervalRef.current);
    }
    setIsActive(true);
    if (!vescState.states.isRunning && vescState.states.isConnected) {
      vescState.setters.setIsRunning(true);
    }
  };

  const stopControl = () => {
    if (controlIntervalRef.current) {
      clearInterval(controlIntervalRef.current);
      controlIntervalRef.current = null;
    }
    setIsActive(false);
    vescState.setters.setJoystickX(0);
    vescState.setters.setJoystickY(0);
    if (vescState.states.isRunning) {
      vescState.setters.setIsRunning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (controlIntervalRef.current) {
        clearInterval(controlIntervalRef.current);
      }
      vescState.setters.setJoystickX(0);
      vescState.setters.setJoystickY(0);
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx;
        const dy = gestureState.dy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let newX = dx;
        let newY = dy;

        if (distance > MAX_DISTANCE) {
          const angle = Math.atan2(dy, dx);
          newX = MAX_DISTANCE * Math.cos(angle);
          newY = MAX_DISTANCE * Math.sin(angle);
        }

        pan.setValue({ x: newX, y: newY });

        const normalizedX = parseFloat((newX / MAX_DISTANCE).toFixed(2));
        const normalizedY = parseFloat((newY / MAX_DISTANCE).toFixed(2));

        vescState.setters.setJoystickX(normalizedX);
        vescState.setters.setJoystickY(-normalizedY);
      },
      onPanResponderRelease: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5
        }).start();

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
            {...panResponder.panHandlers}
          />
        </View>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>Drag the joystick to control motor speed and direction.</Text>
        <Text style={styles.instructions}>Y-axis: Forward/Reverse speed</Text>
        <Text style={styles.instructions}>X-axis: Steering (turn left/right)</Text>
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
  controlButton: {
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center'
  },
  activeButton: {
    backgroundColor: '#2ecc71'
  },
  inactiveButton: {
    backgroundColor: '#95a5a6'
  },
  disabledButton: {
    backgroundColor: '#bdc3c7'
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  joystickContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20
  },
  joystickBase: {
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  joystickHandle: {
    backgroundColor: '#2980b9',
    position: 'absolute'
  },
  joystickDisabled: {
    backgroundColor: '#dcdde1'
  },
  handleDisabled: {
    backgroundColor: '#7f8c8d'
  },
  instructionsContainer: {
    alignItems: 'center',
    padding: 10
  },
  instructions: {
    fontSize: 14,
    color: '#7f8c8d',
    marginVertical: 2
  }
});

export default Page3;
