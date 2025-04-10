// Modified VescControlManager.ts with focused fixes for stopping issues
import { VescCommands } from './VescCommands';
import { COMMANDS } from '../constants/vescCommands';
import { Command } from '../../../App';

export class VescControlManager {
  commands: any;
  state: any;
  canID: number;
  commandProcessingInterval: any;
  isStopped: boolean; // Add explicit internal stopped state

  constructor(vescCommands, stateManager) {
    this.commands = vescCommands;
    this.state = stateManager;
    this.canID = 36;
    this.commandProcessingInterval = null;
    this.isStopped = true; // Start in stopped state
  }

  updateState = (newState) => {
    this.state = newState;
  }

  updateCommandBuffer = (newBuffer, newRemoveCommand) => {
    this.commandBuffer = newBuffer;
    if (newRemoveCommand) {
      this.removeCommand = newRemoveCommand;
    }
  }

  // Calculate motor RPM from joystick x,y values
  calculateMotorValues = (x: number, y: number) => {
    // If explicitly stopped, always return zero RPM regardless of inputs
    if (this.isStopped) {
      return { leftRPM: 0, rightRPM: 0 };
    }
    
    // Max RPM 
    const MAX_RPM = 5000;
    
    // Apply a small deadzone to prevent drift
    const deadzone = 0.1;
    if (Math.sqrt(x*x + y*y) < deadzone) {
      return { leftRPM: 0, rightRPM: 0 };
    }
    
    // Clean the inputs to handle any numerical imprecision
    const xInput = Math.round(Math.max(-1, Math.min(1, x)) * 100) / 100;
    const yInput = Math.round(Math.max(-1, Math.min(1, y)) * 100) / 100;
    
    // Forward/reverse is controlled by Y axis
    const throttle = yInput;
    
    // Turning is controlled by X axis
    const turn = xInput * 0.7; // Only use 70% of turn input for smoother control
    
    // Basic arcade drive formula
    let leftMotor = throttle + turn;
    let rightMotor = throttle - turn;
    
    // Normalize if needed to prevent exceeding limits
    const maxMagnitude = Math.max(Math.abs(leftMotor), Math.abs(rightMotor));
    if (maxMagnitude > 1.0) {
      leftMotor = leftMotor / maxMagnitude;
      rightMotor = rightMotor / maxMagnitude;
    }
    
    // Special case handling for pure forward/backward motion
    if (Math.abs(xInput) < 0.15) {
      // When moving almost straight, prioritize consistent speed over turning
      leftMotor = throttle;
      rightMotor = throttle;
    }
    
    // Apply reverse speed limit
    if (leftMotor < 0 && Math.abs(x) < 0.1) leftMotor *= 0.5;  // 50% speed in reverse
    if (rightMotor < 0 && Math.abs(x) < 0.1) rightMotor *= 0.5;  // 50% speed in reverse
    
    // Convert to RPM
    const leftRPM = Math.round(leftMotor * MAX_RPM);
    const rightRPM = Math.round(rightMotor * MAX_RPM);
    
    return { leftRPM, rightRPM };
  }

  startControl = () => {
    const { setControlInterval, setIsRunning } = this.state.setters;

    // Clear any existing interval first
    if (this.state.states.controlInterval) {
      clearInterval(this.state.states.controlInterval);
    }
    
    // Update internal state
    this.isStopped = false;
    
    // Update global state
    setIsRunning(true);

    // Set new interval for motor control
    const newInterval = setInterval(() => {
      // Add safety check - if we were stopped externally, respect that
      if (this.isStopped) {
        console.log("Control loop found isStopped=true, stopping motors");
        this.commands.setRpmRight(this.canID, 0);
        this.commands.setRpmLeft(0);
        return;
      }
      
      // Get joystick values from global state
      const { joystickX, joystickY } = this.state.states;
      
      // Calculate motor values using the new function
      const { leftRPM, rightRPM } = this.calculateMotorValues(joystickX, joystickY);
      
      // Update UI state with calculated values
      this.state.setters.setLeftMotorRPM(leftRPM);
      this.state.setters.setRightMotorRPM(rightRPM);
      
      // Only send non-zero commands if not stopped
      if (!this.isStopped) {
        // Send commands to VESC
        this.commands.setRpmRight(this.canID, leftRPM);
        this.commands.setRpmLeft(rightRPM);
      } else {
        // Ensure motors are stopped if isStopped is true
        this.commands.setRpmRight(this.canID, 0);
        this.commands.setRpmLeft(0);
      }
    }, 200);

    // Store the new interval and update the running state
    setControlInterval(newInterval);
    
    console.log("Motor control started");
  };

  stopControl = () => {
    const { setControlInterval, setIsRunning } = this.state.setters;

    // Set internal stopped state FIRST
    this.isStopped = true;
    
    // IMPORTANT: Immediately send stop commands to the motors
    // Don't wait for the next interval or state updates
    this.commands.setRpmRight(this.canID, 0);
    this.commands.setRpmLeft(0);
    
    // Reset joystick values
    this.state.setters.setJoystickX(0);
    this.state.setters.setJoystickY(0);
    
    // Reset RPM display values
    this.state.setters.setLeftMotorRPM(0);
    this.state.setters.setRightMotorRPM(0);

    // Clear the interval if it exists
    if (this.state.states.controlInterval) {
      clearInterval(this.state.states.controlInterval);
    }

    // Update global state
    setControlInterval(null);
    setIsRunning(false);
    
    console.log("Motor control stopped - motors set to 0 RPM");
  };

  // Start continuous logging of VESC values
  startContinuousLogging = () => {
    const { setLoggingInterval, setVescValues } = this.state.setters;
  
    // Clear any existing logging interval
    if (this.state.states.loggingInterval) {
      clearInterval(this.state.states.loggingInterval);
    }
  
    // Set new logging interval that continuously polls values
    const newLoggingInterval = setInterval(async () => {
      try {
        const values = await this.commands.getValues();
        
        // Format the values for the state
        const formattedValues = {
          tempMosfet: values.temp_mos || 0,
          tempMotor: values.temp_motor || 0,
          currentMotor: values.current_motor || 0,
          currentInput: values.current_in || 0,
          dutyCycleNow: values.duty_now || 0,
          rpm: values.rpm || 0,
          voltage: values.v_in || 0,
          ampHours: values.amp_hours || 0,
          ampHoursCharged: values.amp_hours_charged || 0,
          wattHours: values.watt_hours || 0,
          wattHoursCharged: values.watt_hours_charged || 0,
          tachometer: values.tachometer || 0,
          tachometerAbs: values.tachometer_abs || 0
        };
        
        // Update the global state with the received values
        setVescValues(formattedValues);
        
        // Add to log data for historical tracking if needed
        const logEntry = {
          timestamp: new Date(),
          fieldStart: 0,
          values: Object.values(formattedValues)
        };
        this.state.setters.setLogData(prev => [...prev, logEntry]);
      } catch (error) {
        console.error("Error getting VESC values:", error);
      }
    }, 500);
  
    // Store the new interval
    setLoggingInterval(newLoggingInterval);
  };
  
  // Stop logging
  stopLogging = () => {
    const { setLoggingInterval } = this.state.setters;
  
    // Clear the logging interval if it exists
    if (this.state.states.loggingInterval) {
      clearInterval(this.state.states.loggingInterval);
    }
  
    // Reset logging state
    setLoggingInterval(null);
  };


  // Emergency stop
  emergencyStop = () => {
    // Set internal stopped state
    this.isStopped = true;
    
    // Reset joystick values
    this.state.setters.setJoystickX(0);
    this.state.setters.setJoystickY(0);
    
    // Reset RPM display values
    this.state.setters.setLeftMotorRPM(0);
    this.state.setters.setRightMotorRPM(0);
    
    // Send stop commands directly
    this.commands.setRpmRight(this.canID, 0);
    this.commands.setRpmLeft(0);
    
    // Update global state
    this.state.setters.setIsRunning(false);
    
    console.log('EMERGENCY STOP ACTIVATED');
  };
}