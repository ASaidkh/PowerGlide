import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, PermissionsAndroid, PanResponder, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Page3 = () => {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const joystickPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'PowerGlideApp needs access to your location for navigation.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
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