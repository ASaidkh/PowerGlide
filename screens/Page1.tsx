// Page1.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { TextInput } from 'react-native';
import Slider from '@react-native-community/slider';

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

const Page1 = () => {
  // State
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [device, setDevice] = useState(null);
  const [rxCharacteristic, setRxCharacteristic] = useState(null);
  const [txCharacteristic, setTxCharacteristic] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingPacket, setPendingPacket] = useState([]);
  const [dutyCycle, setDutyCycle] = useState(0);
  const [targetRpm, setTargetRpm] = useState(0);
  const [targetCurrent, setTargetCurrent] = useState(0);
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

  // Helper function to assemble packet chunks
  const assemblePacket = (chunks) => {
    let assembledData = Buffer.alloc(0);
    for (let chunk of chunks) {
      assembledData = Buffer.concat([assembledData, Buffer.from(chunk.data)]);
    }
    return assembledData;
  };

  // Parse received values
  const parseVescValues = (data) => {
    try {
      console.log('Parsing values from data:', data);
      let buffer = Buffer.from(data);
      let offset = 0;

      if (buffer.length < 44) {
        console.error('Data buffer too short:', buffer.length);
        return;
      }

      const values = {
        tempMosfet: buffer.readInt16LE(offset) / 10.0,
        tempMotor: buffer.readInt16LE(offset + 2) / 10.0,
        currentMotor: buffer.readInt32LE(offset + 4) / 100.0,
        currentInput: buffer.readInt32LE(offset + 8) / 100.0,
        dutyCycleNow: buffer.readInt16LE(offset + 12) / 1000.0,
        rpm: buffer.readInt32LE(offset + 14),
        voltage: buffer.readInt16LE(offset + 18) / 10.0,
        ampHours: buffer.readInt32LE(offset + 20) / 10000.0,
        ampHoursCharged: buffer.readInt32LE(offset + 24) / 10000.0,
        wattHours: buffer.readInt32LE(offset + 28) / 10000.0,
        wattHoursCharged: buffer.readInt32LE(offset + 32) / 10000.0,
        tachometer: buffer.readInt32LE(offset + 36),
        tachometerAbs: buffer.readInt32LE(offset + 40)
      };

      console.log('Parsed values:', values);
      setVescValues(values);
    } catch (error) {
      console.error('Error parsing VESC values:', error);
      console.error('Data that caused error:', data);
    }
  };

  const setRPM = async (rpm) => {
  await sendCommand(COMM_SET_RPM, [rpm]);
};

const setCurrent = async (current) => {
  await sendCommand(COMM_SET_CURRENT, [current], 1000);
};

const setDuty = async (duty) => {
  await sendCommand(COMM_SET_DUTY, [duty], 100000);
};
  // Send command to VESC
  const sendCommand = async (commandId, data = [], scale = 1) => {
    if (!rxCharacteristic || !isConnected) {
      Alert.alert('Error', 'Not connected to VESC');
      return;
    }
  
    try {
      // Create a packet similar to VByteArray approach
      const packet = createPacket(commandId, 
        data.map(value => {
          // If scale is provided, scale the value (similar to vbAppendDouble32)
          if (scale !== 1) {
            return Math.round(value * scale);
          }
          return value;
        })
      );
  
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
      // Set up notifications
      await tx.monitor((error, characteristic) => {
        if (error) {
          console.error('Notification error:', error);
          return;
        }
        if (characteristic?.value) {
          const data = Buffer.from(characteristic.value, 'base64');
          console.log('Received chunk:', data);
          
          const newPackets = [...pendingPacket];
          newPackets.push({data});
          setPendingPacket(newPackets);
          
          // Check if this is the end of packet
          if (data.includes(3)) {
            const fullPacket = assemblePacket(newPackets);
            console.log('Full packet:', fullPacket);
            
            // Extract command and payload
            if (fullPacket.length > 3) {
              const cmd = fullPacket[2]; // Command is after length byte
              console.log('Command received:', cmd);
              
              if (cmd === COMM_GET_VALUES) {
                // Remove packet framing (start byte, length, command, CRC, and stop byte)
                const payload = fullPacket.slice(3, -3);
                parseVescValues(payload);
              }
            }
            setPendingPacket([]);
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
      if (isConnected && rxCharacteristic) {
        console.log('Polling values...');
        sendCommand(COMM_GET_VALUES);
      } else {
        console.log('Stopping poll - disconnected');
        clearInterval(pollInterval);
      }
    }, 1000);

    // Store interval ID for cleanup
    return () => {
      console.log('Cleaning up poll interval');
      clearInterval(pollInterval);
    };
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

  <View style={styles.controlGroup}>
    <Text style={styles.controlLabel}>Duty Cycle: {(dutyCycle * 100).toFixed(1)}%</Text>
    <Slider
      style={styles.slider}
      value={dutyCycle}
      onValueChange={setDutyCycle}
      onSlidingComplete={(value) => setDuty(value)}
      minimumValue={-1}
      maximumValue={1}
      step={0.01}
      minimumTrackTintColor="#2980b9"
      maximumTrackTintColor="#bdc3c7"
    />
  </View>

  <View style={styles.controlGroup}>
    <Text style={styles.controlLabel}>RPM: {targetRpm}</Text>
    <Slider
      style={styles.slider}
      value={targetRpm}
      onValueChange={setTargetRpm}
      onSlidingComplete={(value) => setRPM(value)}
      minimumValue={-100000}
      maximumValue={100000}
      step={100}
      minimumTrackTintColor="#2980b9"
      maximumTrackTintColor="#bdc3c7"
    />
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        value={targetRpm.toString()}
        onChangeText={(text) => setTargetRpm(Number(text) || 0)}
        onSubmitEditing={(event) => setRPM(Number(event.nativeEvent.text) || 0)}
        keyboardType="numeric"
        placeholder="Enter RPM"
      />
    </View>
  </View>

  <View style={styles.controlGroup}>
    <Text style={styles.controlLabel}>Current: {targetCurrent.toFixed(1)}A</Text>
    <Slider
      style={styles.slider}
      value={targetCurrent}
      onValueChange={setTargetCurrent}
      onSlidingComplete={(value) => setCurrent(value)}
      minimumValue={-100}
      maximumValue={100}
      step={0.1}
      minimumTrackTintColor="#2980b9"
      maximumTrackTintColor="#bdc3c7"
    />
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        value={targetCurrent.toString()}
        onChangeText={(text) => setTargetCurrent(Number(text) || 0)}
        onSubmitEditing={(event) => setCurrent(Number(event.nativeEvent.text) || 0)}
        keyboardType="numeric"
        placeholder="Enter Current (A)"
      />
    </View>
  </View>

  <View style={styles.configButtons}>
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
    backgroundColor: '#f5f5f5',
  },
  icon: {
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#34495e',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
    elevation: 3,
  },
  disconnectButton: {
    backgroundColor: '#e74c3c',
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
    marginTop: 10,
  },
  deviceItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    width: '100%',
    elevation: 2,
  },
  deviceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  valuesContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  valueLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  valueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  controlsContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 5,
  },
  controlButton: {
    backgroundColor: '#2980b9',
    padding: 10,
    borderRadius: 8,
    width: '48%',
    elevation: 2,
    marginVertical: 5,
  },
  controlGroup: {
    width: '100%',
    marginVertical: 10,
  },
  controlLabel: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 5,
    padding: 5,
    width: '50%',
    textAlign: 'center',
    fontSize: 16,
  },
  configButtons: {
    marginTop: 10,
    width: '100%',
  }
});

export default Page1;