import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { BleManager } from 'react-native-ble-plx';

// Initialize BleManager with background support enabled
const bleManager = new BleManager({
  isBackgroundEnabled: true,
});

const Page1 = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Request Bluetooth permission and start scanning if granted
  const requestBluetoothPermission = async () => {
    try {
      const permission = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
      const scanPermission = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);

      if (permission === RESULTS.GRANTED && scanPermission === RESULTS.GRANTED) {
        startScanning(); // Start scanning for devices
      } else {
        Alert.alert('Permission Denied', 'Bluetooth permission is required to scan for devices.');
      }
    } catch (error) {
      console.error('Error requesting Bluetooth permission:', error);
      Alert.alert('Permission Error', 'Failed to request Bluetooth permission.');
    }
  };

  // Start scanning for Bluetooth devices
  const startScanning = () => {
    setDevices([]); // Reset devices list before starting scan
    setIsScanning(true);

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Error scanning for devices:', error);
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        setDevices((prevDevices) => {
          if (!prevDevices.find(d => d.id === device.id)) {
            return [...prevDevices, device]; // Add only unique devices
          }
          return prevDevices;
        });
      }
    });

    // Stop scanning after a certain period (e.g., 10 seconds)
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
    }, 10000); // 10 seconds
  };

  // Handle device selection
  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
    Alert.alert('Device Selected', `You selected: ${device.name}`);
  };

  return (
    <View style={[styles.page, { backgroundColor: 'lightgreen' }]}>
      <Icon name="microchip" size={75} color="black" style={styles.icon} />
      <Text style={styles.title}>Connect to VESC</Text>
      
      {/* Request Bluetooth Access Button */}
      <TouchableOpacity style={styles.button} onPress={requestBluetoothPermission}>
        <Text style={styles.buttonText}>Request Bluetooth Access</Text>
      </TouchableOpacity>

      {isScanning && <Text style={styles.scanningText}>Scanning for devices...</Text>}

      {!isScanning && devices.length > 0 && (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.deviceItem}
              onPress={() => handleDeviceSelect(item)}>
              <Text style={styles.deviceText}>{item.name || 'Unnamed device'}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {!isScanning && devices.length === 0 && <Text style={styles.noDevicesText}>No devices found</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'blue',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scanningText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  deviceItem: {
    backgroundColor: 'lightblue',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    width: '100%',
  },
  deviceText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noDevicesText: {
    marginTop: 20,
    fontSize: 16,
    color: 'black',
  },
});

export default Page1;
