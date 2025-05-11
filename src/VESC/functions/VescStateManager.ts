// Updated VescStateManager with safety violations tracking
import { useState } from 'react';

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
  const [MaxRPM, setMaxRPM] = useState(3000);
  const [MaxSafetyCount, setMaxSafetyCount] = useState(2);
  const [controlInterval, setControlInterval] = useState(null);
  const [MaxMotorCurrentRate, setMaxMotorCurrentRate] = useState(20);

  
  // Joystick states
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
  
  // Safety states
  const [safetyViolations, setSafetyViolations] = useState<string[]>([]);
  const [safetyStopTime, setSafetyStopTime] = useState<Date | null>(null);
  const [safetyAlertVisible, setSafetyAlertVisible] = useState(false);

  return {
    states: {
      isConnected,
      isScanning,
      devices,
      dutyCycle,
      targetCurrent,
      RightMotorRPM,
      LeftMotorRPM,
      MaxRPM,
      MaxSafetyCount,
      MaxMotorCurrentRate,
      isRunning,
      isLogging,
      logData,
      vescValues,
      pendingPacket,
      controlInterval,
      joystickX,
      joystickY,
      // Safety states
      safetyViolations,
      safetyStopTime,
      safetyAlertVisible
    },
    setters: {
      setIsConnected,
      setIsScanning,
      setDevices,
      setDutyCycle,
      setTargetCurrent,
      setRightMotorRPM,
      setLeftMotorRPM,
      setMaxRPM,
      setMaxMotorCurrentRate,
      setMaxSafetyCount,
      setIsRunning,
      setIsLogging,
      setLogData,
      setVescValues,
      setPendingPacket,
      setControlInterval,
      setJoystickX,
      setJoystickY,
      // Safety setters
      setSafetyViolations,
      setSafetyStopTime,
      setSafetyAlertVisible
    }
  };
};