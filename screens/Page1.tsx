import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

// Initialize BleManager
const bleManager = new BleManager();

// VESC BLE UUIDs
const UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UART_RX_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const UART_TX_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

// VESC Commands
const COMM_GET_VALUES = 0x04;
const COMM_SET_DUTY = 0x05;
const COMM_SET_CURRENT = 0x06;
const COMM_SET_CURRENT_BRAKE = 0x07;
const COMM_SET_RPM = 0x08;
const COMM_SET_POS = 0x09;
const COMM_SET_HANDBRAKE = 0x0A;
const COMM_GET_MCCONF = 0x0B;
const COMM_GET_APPCONF = 0x0C;
const COMM_SET_MCCONF = 0x0D;
const COMM_SET_APPCONF = 0x0E;

const Page1 = () => {
  // State
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [device, setDevice] = useState(null);
  const [rxCharacteristic, setRxCharacteristic] = useState(null);
  const [txCharacteristic, setTxCharacteristic] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [vescValues, setVescValues] = useState({
    tempMosfet: 0,
    tempMotor: 0,
    currentMotor: 0,
    currentInput: 0,
    dutyCycleNow: 0,
    rpm: 0,
    voltage: 0,
    ampHours: 0,
    ampHoursCharged: 0,
    wattHours: 0,
    wattHoursCharged: 0,
    tachometer: 0,
    tachometerAbs: 0,
  });

  // Create VESC packet
  const createPacket = (commandId, data = []) => {
    const payload = [commandId, ...data];
    const payloadBuffer = Buffer.from(payload);
    
    let crc = 0;
    for (let byte of payloadBuffer) {
      crc ^= byte << 8;
      for (let i = 0; i < 8; i++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      }
      crc &= 0xFFFF;
    }
    
    return Buffer.concat([
      Buffer.from([2, payload.length]),
      payloadBuffer,
      Buffer.from([crc >> 8, crc & 0xFF, 3])
    ]);
  };

  // Parse received values
  // Parse received values
const parseVescValues = (data) => {
  try {
    let offset = 0;
    const tempMosfet = data.length > offset + 2 ? data.readInt16LE(offset) / 10.0 : 0; offset += 2;
    const tempMotor = data.length > offset + 2 ? data.readInt16LE(offset) / 10.0 : 0; offset += 2;
    const currentMotor = data.length > offset + 4 ? data.readInt32LE(offset) / 100.0 : 0; offset += 4;
    const currentInput = data.length > offset + 4 ? data.readInt32LE(offset) / 100.0 : 0; offset += 4;
    const dutyCycleNow = data.length > offset + 2 ? data.readInt16LE(offset) / 1000.0 : 0; offset += 2;
    const rpm = data.length > offset + 4 ? data.readInt32LE(offset) : 0; offset += 4;
    const voltage = data.length > offset + 2 ? data.readInt16LE(offset) / 10.0 : 0; offset += 2;
    const ampHours = data.length > offset + 4 ? data.readInt32LE(offset) / 10000.0 : 0; offset += 4;
    const ampHoursCharged = data.length > offset + 4 ? data.readInt32LE(offset) / 10000.0 : 0; offset += 4;
    const wattHours = data.length > offset + 4 ? data.readInt32LE(offset) / 10000.0 : 0; offset += 4;
    const wattHoursCharged = data.length > offset + 4 ? data.readInt32LE(offset) / 10000.0 : 0; offset += 4;
    const tachometer = data.length > offset + 4 ? data.readInt32LE(offset) : 0; offset += 4;
    const tachometerAbs = data.length > offset + 4 ? data.readInt32LE(offset) : 0;

    setVescValues({
      tempMosfet,
      tempMotor,
      currentMotor,
      currentInput,
      dutyCycleNow,
      rpm,
      voltage,
      ampHours,
      ampHoursCharged,
      wattHours,
      wattHoursCharged,
      tachometer,
      tachometerAbs
    });
  } catch (error) {
    console.error('Error parsing VESC values:', error);
  }
};

  // Send command to VESC
  const sendCommand = async (commandId, data = []) => {
    if (!rxCharacteristic || !isConnected) {
      Alert.alert('Error', 'Not connected to VESC');
      return;
    }

    try {
      const packet = createPacket(commandId, data);
      console.log('Sending packet:', packet);

      await rxCharacteristic.writeWithoutResponse(
        Buffer.from(packet).toString('base64')
      );
    } catch (error) {
      console.error('Error sending command:', error);
      Alert.alert('Error', 'Failed to send command');
    }
  };

  // Connect to device
  const connectToDevice = async (selectedDevice) => {
    try {
      console.log('Connecting to', selectedDevice.name);
      const connectedDevice = await selectedDevice.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();
      
      const services = await connectedDevice.services();
      const service = services.find(s => 
        s.uuid.toLowerCase() === UART_SERVICE_UUID.toLowerCase()
      );
      
      if (!service) {
        throw new Error('UART service not found');
      }

      const characteristics = await service.characteristics();
      const rx = characteristics.find(c => 
        c.uuid.toLowerCase() === UART_RX_CHAR_UUID.toLowerCase()
      );
      const tx = characteristics.find(c => 
        c.uuid.toLowerCase() === UART_TX_CHAR_UUID.toLowerCase()
      );

      if (!rx || !tx) {
        throw new Error('UART characteristics not found');
      }

      // Set up notifications
      await tx.monitor((error, characteristic) => {
        if (error) {
          console.error('Notification error:', error);
          return;
        }
        if (characteristic?.value) {
          const data = Buffer.from(characteristic.value, 'base64');
          console.log('Received data:', data);
          
          // Check for values response
          if (data.length > 2 && data[0] === COMM_GET_VALUES) {
            parseVescValues(data.slice(1));
          }
        }
      });

      setRxCharacteristic(rx);
      setTxCharacteristic(tx);
      setDevice(connectedDevice);
      setIsConnected(true);
      Alert.alert('Connected', `Connected to ${selectedDevice.name}`);

      // Start polling values
      startValuePolling();

      // Monitor disconnection
      connectedDevice.onDisconnected(() => {
        setIsConnected(false);
        setRxCharacteristic(null);
        setTxCharacteristic(null);
        setDevice(null);
        Alert.alert('Disconnected', 'Device disconnected');
      });

    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Error', 'Failed to connect');
      setIsConnected(false);
      setRxCharacteristic(null);
      setTxCharacteristic(null);
      setDevice(null);
    }
  };

  // Poll values periodically
  const startValuePolling = () => {
    const pollInterval = setInterval(() => {
      if (isConnected) {
        sendCommand(COMM_GET_VALUES);
      } else {
        clearInterval(pollInterval);
      }
    }, 1000); // Poll every 1000ms (1 second)

    return () => clearInterval(pollInterval);
  };

  // Start scanning
  const startScan = async () => {
    try {
      const permission = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
      const scanPermission = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);

      if (permission === RESULTS.GRANTED && scanPermission === RESULTS.GRANTED) {
        setDevices([]);
        setIsScanning(true);

        bleManager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            setIsScanning(false);
            return;
          }

          if (device?.name) {
            setDevices(prev => {
              if (!prev.find(d => d.id === device.id)) {
                return [...prev, device];
              }
              return prev;
            });
          }
        });

        setTimeout(() => {
          bleManager.stopDeviceScan();
          setIsScanning(false);
        }, 10000);
      } else {
        Alert.alert('Error', 'Bluetooth permission required');
      }
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Error', 'Failed to get permissions');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (device) {
        device.cancelConnection();
      }
    };
  }, [device]);

  const renderValue = (label, value, unit = '') => (
    <View style={styles.valueRow}>
      <Text style={styles.valueLabel}>{label}:</Text>
      <Text style={styles.valueText}>{value} {unit}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Icon name="microchip" size={75} color="black" style={styles.icon} />
      <Text style={styles.title}>VESC Monitor</Text>

      {!isConnected ? (
        <>
          <TouchableOpacity 
            style={styles.button} 
            onPress={startScan}
          >
            <Text style={styles.buttonText}>
              {isScanning ? 'Scanning...' : 'Scan for Devices'}
            </Text>
          </TouchableOpacity>

          <View style={styles.deviceList}>
            {devices.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.deviceItem}
                onPress={() => connectToDevice(item)}
              >
                <Text style={styles.deviceText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <>
          <View style={styles.valuesContainer}>
            <Text style={styles.subtitle}>Real-time Values</Text>
            
            {renderValue('Temperature MOSFET', vescValues.tempMosfet.toFixed(1), '°C')}
            {renderValue('Temperature Motor', vescValues.tempMotor.toFixed(1), '°C')}
            {renderValue('Motor Current', vescValues.currentMotor.toFixed(1), 'A')}
            {renderValue('Input Current', vescValues.currentInput.toFixed(1), 'A')}
            {renderValue('Duty Cycle', (vescValues.dutyCycleNow * 100).toFixed(1), '%')}
            {renderValue('RPM', Math.round(vescValues.rpm))}
            {renderValue('Input Voltage', vescValues.voltage.toFixed(1), 'V')}
            {renderValue('Consumed Ah', vescValues.ampHours.toFixed(2), 'Ah')}
            {renderValue('Charged Ah', vescValues.ampHoursCharged.toFixed(2), 'Ah')}
            {renderValue('Consumed Wh', vescValues.wattHours.toFixed(2), 'Wh')}
            {renderValue('Charged Wh', vescValues.wattHoursCharged.toFixed(2), 'Wh')}
            {renderValue('Tachometer', vescValues.tachometer)}
            {renderValue('Tachometer Abs', vescValues.tachometerAbs)}
          </View>

          <View style={styles.controlsContainer}>
            <Text style={styles.subtitle}>Controls</Text>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => sendCommand(COMM_GET_VALUES)}
            >
              <Text style={styles.buttonText}>Get Values</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => sendCommand(COMM_GET_MCCONF)}
            >
              <Text style={styles.buttonText}>Get Motor Config</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => sendCommand(COMM_GET_APPCONF)}
            >
              <Text style={styles.buttonText}>Get App Config</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.disconnectButton]}
            onPress={() => {
              if (device) {
                device.cancelConnection();
              }
            }}
          >
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'lightgreen',
  },
  icon: {
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  button: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
  },
  disconnectButton: {
    backgroundColor: 'red',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deviceList: {
    width: '100%',
  },
  deviceItem: {
    backgroundColor: 'lightblue',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    width: '100%',
  },
  deviceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  valuesContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  valueLabel: {
    fontSize: 14,
    color: '#333',
  },
  valueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  controlsContainer: {
    width: '100%',
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
  },
  controlButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    width: '100%',
  },
  });
  
  export default Page1;