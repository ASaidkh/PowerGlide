import { useState } from 'react';
import { VescValues, LogData } from '../types/VescTypes';

export const useVescState = () => {
  // Device states
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [pendingPacket, setPendingPacket] = useState([]);

  // Control states
  const [dutyCycle, setDutyCycle] = useState(0);
  const [targetCurrent, setTargetCurrent] = useState(0);
  const [RightMotorRPM, setRightMotorRPM] = useState(0);
  const [LeftMotorRPM, setLeftMotorRPM] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [controlInterval, setControlInterval] = useState(null);
  const [loggingInterval, setLoggingInterval] = useState(null);
  
  // Joystick states (added for centralized joystick control)
  const [joystickX, setJoystickX] = useState(0);
  const [joystickY, setJoystickY] = useState(0);

  // Logging states
  const [isLogging, setIsLogging] = useState(false);
  const [logData, setLogData] = useState([]);

  // VESC values state
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
    tachometerAbs: 0
  });

  return {
    states: {
      isConnected,
      isScanning,
      devices,
      dutyCycle,
      targetCurrent,
      RightMotorRPM,
      LeftMotorRPM,
      isRunning,
      isLogging,
      logData,
      vescValues,
      pendingPacket,
      controlInterval,
      joystickX,
      joystickY
    },
    setters: {
      setIsConnected,
      setIsScanning,
      setDevices,
      setDutyCycle,
      setTargetCurrent,
      setRightMotorRPM,
      setLeftMotorRPM,
      setIsRunning,
      setIsLogging,
      setLogData,
      setVescValues,
      setPendingPacket,
      setControlInterval,
      setJoystickX,
      setJoystickY
    }
  };
};