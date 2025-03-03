import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const Page1 = () => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);

  const requestBluetoothPermission = async () => {
    try {
      const result = await check(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
      if (result === RESULTS.GRANTED) return true;
      
      const granted = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
      return granted === RESULTS.GRANTED;
    } catch (error) {
      console.error('Bluetooth permission error:', error);
      return false;
    }
  };

  const startScan = async () => {
    const permissionGranted = await requestBluetoothPermission();
    if (!permissionGranted) {
      console.log('Bluetooth permission denied');
      return;
    }
    
    setScanning(true);
    setDevices([]);

    try {
      const scanTimeout = setTimeout(() => {
        setScanning(false);
        if (devices.length === 0) {
          Alert.alert('No devices found', 'Please make sure your Bluetooth device is discoverable.', [
            { text: 'OK', onPress: () => setScanning(false) }
          ]);
        }
      }, 30000);
      
      const availableDevices = await RNBluetoothClassic.startDiscovery();
      clearTimeout(scanTimeout);
      setDevices(availableDevices);
      setScanning(false);
    } catch (error) {
      console.error('Bluetooth scan error:', error);
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={startScan} disabled={scanning}>
        <Text style={styles.buttonText}>{scanning ? 'Scanning...' : 'Connect to SIM'}</Text>
      </TouchableOpacity>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.address}
        renderItem={({ item }) => (
          <View style={styles.deviceItem}>
            <Text style={styles.deviceText}>{item.name || 'Unknown Device'}</Text>
            <Text style={styles.deviceText}>{item.address}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'lightgreen',
  },
  button: {
    backgroundColor: 'blue',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 20,
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -25 }],
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deviceItem: {
    backgroundColor: '#333',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    width: '90%',
  },
  deviceText: {
    color: 'white',
    fontSize: 16,
  },
});

export default Page1;
