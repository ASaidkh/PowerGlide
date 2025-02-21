import { useState } from 'react';
import { VescValues, LogData } from './types/VescTypes';

export const useVescState = () => {
  // Device states
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [pendingPacket, setPendingPacket] = useState([]);

  // Control states
  const [dutyCycle, setDutyCycle] = useState(0);
  const [targetCurrent, setTargetCurrent] = useState(0);
  const [targetRPM, setTargetRPM] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [controlInterval, setControlInterval] = useState(null);
  const [loggingInterval, setLoggingInterval] = useState(null);

  // Logging states
  const [isLogging, setIsLogging] = useState(false);
  const [logData, setLogData] = useState([]);

  // VESC values state
  const [vescValues, setVescValues] = useState({
    tempMosfet: 0,
    tempMotor: 0,
    currentMotor: 0,
    // ... other values
  });

  return {
    states: {
      isConnected,
      isScanning,
      devices,
      dutyCycle,
      targetCurrent,
      targetRPM,
      isRunning,
      isLogging,
      logData,
      vescValues,
      pendingPacket,
      controlInterval
    },
    setters: {
      setIsConnected,
      setIsScanning,
      setDevices,
      setDutyCycle,
      setTargetCurrent,
      setTargetRPM,
      setIsRunning,
      setIsLogging,
      setLogData,
      setVescValues,
      setPendingPacket,
      setControlInterval
    }
  };
};