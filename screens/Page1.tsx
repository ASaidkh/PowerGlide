import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const Page1 = ({ vescState }) => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);

  // Update the local and global state when connection changes
  useEffect(() => {
    // Update local state
    setConnectedDevice(vescState.states.bluetoothDevice);
    
    // Set up listener for incoming data
    let subscription: any = null;
    
    if (vescState.states.bluetoothDevice) {
      // Set up data subscription - fixing the onDataReceived error
      try {
        // Use the addListener method instead of onDataReceived
        subscription = RNBluetoothClassic.addListener(
          'bluetoothDataReceived',
          (data) => {
            console.log('Received data from device:', data.data);
            try {
              // Handle any incoming data if needed
              const parsedData = JSON.parse(data.data);
              
              // Process different message types if needed
              if (parsedData.type === 'response') {
                console.log('Received response:', parsedData);
              }
            } catch (error) {
              console.error('Error parsing received data:', error);
            }
          }
        );
      } catch (error) {
        console.error('Error setting up Bluetooth listener:', error);
      }
    }
    
    // Clean up listener when component unmounts or device changes
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [vescState.states.bluetoothDevice]);

  const requestBluetoothPermissions = async () => {
    try {
      // Request both scan and connect permissions
      const scanResult = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
      const connectResult = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
      
      return scanResult === RESULTS.GRANTED && connectResult === RESULTS.GRANTED;
    } catch (error) {
      console.error('Bluetooth permission error:', error);
      return false;
    }
  };

  const startScan = async () => {
    const permissionGranted = await requestBluetoothPermissions();
    if (!permissionGranted) {
      Alert.alert('Permission Required', 'Bluetooth permissions are needed to connect to devices.');
      return;
    }
    
    setScanning(true);
    setDevices([]);

    try {
      // Enable Bluetooth adapter if it's not already enabled
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!enabled) {
        const success = await RNBluetoothClassic.requestBluetoothEnabled();
        if (!success) {
          Alert.alert('Bluetooth Required', 'Please enable Bluetooth to continue.');
          setScanning(false);
          return;
        }
      }

      const scanTimeout = setTimeout(() => {
        setScanning(false);
        if (devices.length === 0) {
          Alert.alert('No devices found', 'Please make sure your Bluetooth device is discoverable.');
        }
      }, 30000);
      
      // Start discovery of devices
      const availableDevices = await RNBluetoothClassic.startDiscovery();
      clearTimeout(scanTimeout);
      
      // Also get paired devices
      const bondedDevices = await RNBluetoothClassic.getBondedDevices();
      
      // Combine and filter out duplicates
      const allDevices = [...availableDevices];
      bondedDevices.forEach(bondedDevice => {
        if (!allDevices.some(device => device.address === bondedDevice.address)) {
          allDevices.push(bondedDevice);
        }
      });
      
      setDevices(allDevices);
      setScanning(false);
    } catch (error) {
      console.error('Bluetooth scan error:', error);
      Alert.alert('Scan Error', 'An error occurred while scanning for devices.');
      setScanning(false);
    }
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      setConnecting(true);
      
      // Check if already connected
      if (device.connected) {
        // Update both local and global state
        setConnectedDevice(device);
        vescState.actions.updateBluetoothConnection(device);
        setConnecting(false);
        Alert.alert('Already Connected', `Already connected to ${device.name || 'device'}`);
        return;
      }
      
      // Attempt to connect
      const connection = await RNBluetoothClassic.connectToDevice(device.address);
      
      if (connection) {
        // Update both local and global state
        setConnectedDevice(connection);
        vescState.actions.updateBluetoothConnection(connection);
        Alert.alert('Connection Successful', `Connected to ${connection.name || 'device'}`);
      } else {
        Alert.alert('Connection Failed', 'Could not connect to the device.');
      }
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection Error', 'An error occurred while connecting to the device.');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectDevice = async () => {
    if (!connectedDevice) return;
    
    try {
      await RNBluetoothClassic.disconnectFromDevice(connectedDevice.address);
      // Update both local and global state
      setConnectedDevice(null);
      vescState.actions.updateBluetoothConnection(null);
      Alert.alert('Disconnected', `Disconnected from ${connectedDevice.name || 'device'}`);
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert('Disconnect Error', 'An error occurred while disconnecting from the device.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      {connectedDevice ? (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Connected to: {connectedDevice.name || connectedDevice.address}
          </Text>
          <TouchableOpacity style={styles.disconnectButton} onPress={disconnectDevice}>
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.button, scanning && styles.disabledButton]} 
          onPress={startScan} 
          disabled={scanning || connecting}
        >
          <Text style={styles.buttonText}>
            {scanning ? 'Scanning...' : 'Request Bluetooth Access & Scan'}
          </Text>
          {scanning && <ActivityIndicator color="white" style={styles.spinner} />}
        </TouchableOpacity>
      )}

      {/* Device List */}
      {devices.length > 0 && !connectedDevice && (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Available Devices:</Text>
          <FlatList
            data={devices}
            keyExtractor={(item) => item.address}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.deviceItem}
                onPress={() => connectToDevice(item)}
                disabled={connecting}
              >
                <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                <Text style={styles.deviceAddress}>{item.address}</Text>
                {item.connected && (
                  <View style={styles.connectedBadge}>
                    <Text style={styles.connectedText}>Connected</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Loading indicator when connecting */}
      {connecting && (
        <View style={styles.connectingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.connectingText}>Connecting...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 20,
    width: '90%',
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  spinner: {
    marginLeft: 10,
  },
  listContainer: {
    width: '100%',
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  deviceItem: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    position: 'relative',
  },
  deviceName: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  deviceAddress: {
    color: '#666',
    fontSize: 14,
  },
  connectingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  connectingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#E8F5E9',
    width: '90%',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statusText: {
    fontSize: 16,
    color: '#2E7D32',
    marginBottom: 10,
  },
  disconnectButton: {
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  connectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default Page1;