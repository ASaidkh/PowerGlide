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
// Add these with your other command constants near the top of the file
const COMM_PING_CAN = 62;
const COMM_ALIVE = 30;
const COMM_LOG_START = 145;
const COMM_LOG_STOP = 146;
const COMM_LOG_CONFIG_FIELD = 147;
const COMM_LOG_DATA_F32 = 148;
const COMM_LOG_DATA_F64 = 151;

const CRC16_TAB = [
  0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
  0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef,
  0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
  0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de,
  0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485,
  0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
  0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4,
  0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc,
  0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
  0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b,
  0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12,
  0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
  0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41,
  0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49,
  0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70,
  0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78,
  0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f,
  0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
  0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e,
  0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256,
  0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
  0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405,
  0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c,
  0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
  0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab,
  0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3,
  0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
  0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92,
  0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9,
  0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1,
  0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8,
  0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0
];

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
  const [isRunning, setIsRunning] = useState(false);

  const [isLogging, setIsLogging] = useState(false);
  const [logData, setLogData] = useState([]);
  const [controlInterval, setControlInterval] = useState<NodeJS.Timeout | null>(null);
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
  const startControl = () => {
    // Stop any existing interval
    if (controlInterval) {
      clearInterval(controlInterval);
    }

    // Start new interval to continuously send duty and current commands
    const newInterval = setInterval(() => {
      if (isConnected) {
        // Send duty cycle command
        sendCommand(COMM_SET_DUTY, [dutyCycle], 100000);
        
        // Send current command
        sendCommand(COMM_SET_CURRENT, [targetCurrent], 1000);
      }
    }, 1); // Send every 1ms

    setControlInterval(newInterval);
    setIsRunning(true);
  };

  const stopControl = () => {
    if (controlInterval) {
      clearInterval(controlInterval);
      setControlInterval(null);
    }

    // Send zero duty and current to stop
    sendCommand(COMM_SET_DUTY, [0], 100000);
    sendCommand(COMM_SET_CURRENT, [0], 1000);

    setIsRunning(false);
  };

  // Simple ping/keepalive
  const sendAlive = async () => {
    await sendCommand(COMM_ALIVE);
  };

  // Ping CAN devices
  const pingCan = async () => {
    await sendCommand(COMM_PING_CAN);
  };
  // Start logging with specified rate
const startLogging = async (rateHz = 10, appendTime = true, appendGnss = false, appendGnssTime = false) => {
  const data = [
    // Field count (16-bit)
    0, 0,  
    // Rate in Hz (32-bit float)
    ...floatToBytes(rateHz),
    // Flags
    appendTime ? 1 : 0,
    appendGnss ? 1 : 0,
    appendGnssTime ? 1 : 0
  ];
  await sendCommand(COMM_LOG_START, data);
};

// Stop logging
const stopLogging = async () => {
  await sendCommand(COMM_LOG_STOP);
};

// Configure a log field
const configureLogField = async (fieldIndex, header) => {
  const stringToBytes = (str) => {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i));
    }
    bytes.push(0); // Null terminator
    return bytes;
  };

  const data = [
    // Field index (16-bit)
    fieldIndex & 0xFF, (fieldIndex >> 8) & 0xFF,
    // Key string
    ...stringToBytes(header.key),
    // Name string
    ...stringToBytes(header.name),
    // Unit string
    ...stringToBytes(header.unit),
    // Precision (8-bit)
    header.precision & 0xFF,
    // Is relative to first (8-bit)
    header.isRelativeToFirst ? 1 : 0,
    // Is timestamp (8-bit)
    header.isTimeStamp ? 1 : 0
  ];

  await sendCommand(COMM_LOG_CONFIG_FIELD, data);
};

// Helper function to convert float to bytes
const floatToBytes = (float) => {
  const buffer = Buffer.alloc(4);
  buffer.writeFloatLE(float);
  return [...buffer];
};

  // Then modify the CRC calculation to match the firmware:
  const crc16 = (buffer) => {
      let cksum = 0;
      for (let i = 0; i < buffer.length; i++) {
          cksum = CRC16_TAB[((cksum >> 8) ^ buffer[i]) & 0xFF] ^ (cksum << 8);
      }
      return cksum & 0xFFFF;
  };
  // Create VESC packet
  const createPacket = (commandId, data = []) => {
    const payload = [commandId, ...data];
    const payloadBuffer = Buffer.from(payload);
    const crc = crc16(payloadBuffer);
    
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
              } else if (cmd === COMM_LOG_DATA_F32 || cmd === COMM_LOG_DATA_F64) {
                // Handle log data
                const payload = fullPacket.slice(3, -3);
                handleLogData(cmd, payload);
              }
            }
            setPendingPacket([]);
          }
        }
      });

      const handleLogData = (cmd, data) => {
        const buffer = Buffer.from(data);
        const values = [];
        const fieldStart = buffer.readInt16LE(0);
        const dataStart = 2;
        
        if (cmd === COMM_LOG_DATA_F32) {
          for (let i = dataStart; i < buffer.length; i += 4) {
            values.push(buffer.readFloatLE(i));
          }
        } else if (cmd === COMM_LOG_DATA_F64) {
          for (let i = dataStart; i < buffer.length; i += 8) {
            values.push(buffer.readDoubleLE(i));
          }
        }
        
        setLogData(prev => [...prev, {
          timestamp: new Date(),
          fieldStart,
          values
        }]);
      };

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
  // Add with other useEffect hooks
useEffect(() => {
  let aliveInterval;
  if (isConnected) {
    aliveInterval = setInterval(() => {
      sendAlive().catch(console.error);
    }, 1000);
  }
  return () => {
    if (aliveInterval) {
      clearInterval(aliveInterval);
    }
  };
}, [isConnected]);

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
        minimumValue={-1}
        maximumValue={1}
        step={0.01}
        minimumTrackTintColor="#2980b9"
        maximumTrackTintColor="#bdc3c7"
      />
    </View>

    <View style={styles.controlGroup}>
      <Text style={styles.controlLabel}>Current: {targetCurrent.toFixed(1)}A</Text>
      <Slider
        style={styles.slider}
        value={targetCurrent}
        onValueChange={setTargetCurrent}
        minimumValue={-100}
        maximumValue={100}
        step={0.1}
        minimumTrackTintColor="#2980b9"
        maximumTrackTintColor="#bdc3c7"
      />
    </View>

    <TouchableOpacity 
      style={[
        styles.controlButton, 
        isRunning ? styles.stopButton : styles.goButton
      ]}
      onPress={isRunning ? stopControl : startControl}
    >
      <Text style={styles.buttonText}>
        {isRunning ? 'STOP' : 'GO'}
      </Text>
    </TouchableOpacity>

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

    {/* Add after other controls */}
<View style={styles.loggingContainer}>
  <Text style={styles.subtitle}>Logging</Text>
  
  <TouchableOpacity 
    style={[styles.controlButton, isLogging ? styles.stopButton : styles.goButton]}
    onPress={async () => {
      if (!isLogging) {
        // Configure some example log fields
        await configureLogField(0, {
          key: "temp_mot",
          name: "Motor Temperature",
          unit: "°C",
          precision: 1,
          isRelativeToFirst: false,
          isTimeStamp: false
        });
        await configureLogField(1, {
          key: "curr_mot",
          name: "Motor Current",
          unit: "A",
          precision: 2,
          isRelativeToFirst: false,
          isTimeStamp: false
        });
        await startLogging(10, true);
      } else {
        await stopLogging();
      }
    }}
  >
    <Text style={styles.buttonText}>
      {isLogging ? 'Stop Logging' : 'Start Logging'}
    </Text>
  </TouchableOpacity>

  {/* Display last few log entries */}
  {logData.slice(-5).map((entry, index) => (
    <View key={index} style={styles.logEntry}>
      <Text style={styles.logText}>
        Field {entry.fieldStart}: {entry.values.join(', ')}
      </Text>
    </View>
  ))}
</View>

  {/* Add ping controls */}
  <View style={styles.pingContainer}>
    <TouchableOpacity 
      style={styles.controlButton}
      onPress={sendAlive}
    >
      <Text style={styles.buttonText}>Send Alive</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={styles.controlButton}
      onPress={pingCan}
    >
      <Text style={styles.buttonText}>Ping CAN</Text>
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
  },
  goButton: {
    backgroundColor: '#2ecc71', // Green for Go
  },
  stopButton: {
    backgroundColor: '#e74c3c', // Red for Stop
  },
  // Add to your styles
loggingContainer: {
  marginTop: 20,
  width: '100%',
  padding: 10,
  backgroundColor: '#f5f5f5',
  borderRadius: 8,
},
logEntry: {
  padding: 5,
  marginTop: 5,
  backgroundColor: 'white',
  borderRadius: 4,
},
logText: {
  fontSize: 12,
  color: '#2c3e50',
},
pingContainer: {
  marginTop: 10,
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
}
});

export default Page1;