import { useState, useCallback } from 'react';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

export const useVescState = () => {
  // Connection states
  const [isConnected, setIsConnected] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState(null);
  
  // Motor control states
  const [leftMotorRPM, setLeftMotorRPM] = useState(0);
  const [rightMotorRPM, setRightMotorRPM] = useState(0);
  const [controlInterval, setControlInterval] = useState(null);
  
  // Joystick values
  const [joystickX, setJoystickX] = useState(0);
  const [joystickY, setJoystickY] = useState(0);
  
  // Connection retry state
  const [connectionRetries, setConnectionRetries] = useState(0);
  const MAX_RETRIES = 3;
  
  // Bluetooth communication functions
  const sendDataToBluetooth = useCallback(async (data) => {
    if (!bluetoothDevice || !isConnected) {
      console.warn('No device connected, cannot send data');
      return false;
    }
    
    try {
      // Check if device is actually connected before sending
      const isActuallyConnected = await RNBluetoothClassic.isDeviceConnected(
        bluetoothDevice.address
      );
      
      if (!isActuallyConnected) {
        // Try to reconnect if not connected
        if (connectionRetries < MAX_RETRIES) {
          console.log(`Connection lost, attempting reconnect (retry ${connectionRetries + 1}/${MAX_RETRIES})...`);
          
          try {
            const reconnected = await RNBluetoothClassic.connectToDevice(
              bluetoothDevice.address
            );
            
            if (reconnected) {
              console.log('Reconnection successful');
              setConnectionRetries(0);
            } else {
              setConnectionRetries(prev => prev + 1);
              setIsConnected(false);
              return false;
            }
          } catch (reconnectError) {
            console.error('Reconnection failed:', reconnectError);
            setConnectionRetries(prev => prev + 1);
            setIsConnected(false);
            return false;
          }
        } else {
          console.error('Max reconnection attempts reached');
          setIsConnected(false);
          return false;
        }
      }
      
      // Format data as JSON string with proper termination
      const dataString = JSON.stringify(data) + '\r\n';
      
      // Send data to connected device
      const success = await RNBluetoothClassic.writeToDevice(
        bluetoothDevice.address, 
        dataString
      );
      
      // Reset retry count on successful send
      if (success) {
        console.log("Writing Data:", dataString);
        setConnectionRetries(0);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending data over Bluetooth:', error);
      
      // Handle connection errors
      if (
        error.message?.includes('socket closed') || 
        error.message?.includes('not connected')
      ) {
        console.warn('Connection appears lost, marking as disconnected');
        setIsConnected(false);
      }
      
      return false;
    }
  }, [bluetoothDevice, isConnected, connectionRetries]);
  
  // Send joystick values via Bluetooth
  const sendJoystickValues = useCallback(async () => {
    const data = {
      type: 'joystick',
      x: joystickX,
      y: joystickY,
      timestamp: Date.now()
    };

    console.log("Data preparing to send in Joystick Func:", data);
    
    return await sendDataToBluetooth(data);
  }, [joystickX, joystickY, sendDataToBluetooth]);
  
  // Update connection with device from Page1
  const updateBluetoothConnection = useCallback((device) => {
    setBluetoothDevice(device);
    setIsConnected(device !== null);
    setConnectionRetries(0);
    
    // When device is disconnected, reset motor values
    if (device === null) {
      setLeftMotorRPM(0);
      setRightMotorRPM(0);
      setJoystickX(0);
      setJoystickY(0);
    }
  }, []);

  return {
    states: {
      isConnected,
      bluetoothDevice,
      leftMotorRPM,
      rightMotorRPM,
      controlInterval,
      joystickX,
      joystickY
    },
    setters: {
      setIsConnected,
      setBluetoothDevice,
      setLeftMotorRPM,
      setRightMotorRPM,
      setControlInterval,
      setJoystickX,
      setJoystickY
    },
    actions: {
      updateBluetoothConnection,
      sendDataToBluetooth,
      sendJoystickValues
    }
  };
};