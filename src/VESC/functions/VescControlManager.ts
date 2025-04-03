import { VescCommands } from './VescCommands';
import { COMMANDS } from '../constants/vescCommands';
import { Command } from '../../../App';

export class VescControlManager {
  commands: any;
  state: any;
  canID: number;
  commandProcessingInterval: any;

  constructor(vescCommands, stateManager) {
    this.commands = vescCommands;
    this.state = stateManager;
    this.canID = 36;
    this.commandProcessingInterval = null;
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

  // New function to calculate motor RPM from joystick x,y values
  calculateMotorValues = (x: number, y: number) => {
    // Improved smooth control algorithm with consistent speed response
    
    // Max RPM 
    const MAX_RPM = 5000;
    
    // Apply a small deadzone to prevent drift
    const deadzone = 0.1;
    if (Math.sqrt(x*x + y*y) < deadzone) {
      return { leftRPM: 0, rightRPM: 0 };
    }
    
    // Clean the inputs to handle any numerical imprecision
    // For example, ensure that (0, 0.99) and (0, 1.0) produce similar results
    // Round to 2 decimal places for stability
    const xInput = Math.round(Math.max(-1, Math.min(1, x)) * 100) / 100;
    const yInput = Math.round(Math.max(-1, Math.min(1, y)) * 100) / 100;
    
    // Forward/reverse is controlled by Y axis (inverted)
    // Up is negative Y in joystick coordinates
    const throttle = yInput;
    
    // Turning is controlled by X axis
    // Use a reduced turn sensitivity for more stability
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
    // This ensures that small X deviations don't significantly change speed
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
    
    // Log for debugging
    console.log(`Joystick: (${xInput.toFixed(2)}, ${yInput.toFixed(2)}) → Motors: L:${leftRPM}, R:${rightRPM}`);
    
    return { leftRPM, rightRPM };
  }

  startControl = () => {
    const { setControlInterval, setIsRunning } = this.state.setters;

    // Clear any existing interval
    if (this.state.states.controlInterval) {
      clearInterval(this.state.states.controlInterval);
    }

    // Set new interval
    const newInterval = setInterval(() => {
      // Get joystick values from global state
      const { joystickX, joystickY } = this.state.states;
      
      // Calculate motor values using the new function
      const { leftRPM, rightRPM } = this.calculateMotorValues(joystickX, joystickY);
      
      // Update the state with calculated RPM values
      this.state.setters.setLeftMotorRPM(leftRPM);
      this.state.setters.setRightMotorRPM(rightRPM);
      
      console.log("Setting Left Motor RPM:", leftRPM);
      console.log("Setting Right Motor RPM:", rightRPM);

      // Send commands to VESC
      this.commands.setRpmRight(this.canID, leftRPM);  // Set left RPM
      this.commands.setRpmLeft(rightRPM);  // Set right RPM
    }, 200);

    // Store the new interval and update the running state
    setControlInterval(newInterval);
    setIsRunning(true);

    // Start processing commands from the buffer
    this.startCommandProcessing();
  };

  stopControl = () => {
    const { setControlInterval, setIsRunning } = this.state.setters;

    // Clear the interval if it exists
    if (this.state.states.controlInterval) {
      clearInterval(this.state.states.controlInterval);
    }

    // Stop the command processing
    this.stopCommandProcessing();

    // Stop the control (set rpm to 0)
    this.commands.setRpmRight(this.canID, 0);  // Set left RPM
    this.commands.setRpmLeft(0);  // Set right RPM

    // Reset state
    setControlInterval(null);
    setIsRunning(false);
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
        const values = await this.commands.getValues();  // Get the values from the VESC
        console.log("Received VESC values:", values);
        
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
    }, 2000); // Poll every 20 seconds for VESC values
  
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

  // Start processing commands from the buffer
  startCommandProcessing = () => {
    // Clear any existing command processing interval
    if (this.commandProcessingInterval) {
      clearInterval(this.commandProcessingInterval);
    }

    // Create new interval to check command buffer
    this.commandProcessingInterval = setInterval(() => {
      this.processCommandBuffer();
    }, 200); // Check buffer every 200ms
  };

  // Stop processing commands
  stopCommandProcessing = () => {
    if (this.commandProcessingInterval) {
      clearInterval(this.commandProcessingInterval);
      this.commandProcessingInterval = null;
    }
  };

  // Process commands from the buffer
  processCommandBuffer = () => {
    // Skip if no commands or not running
    if (!this.commandBuffer || this.commandBuffer.length === 0 || !this.state.states.isRunning) {
      return;
    }

    // Get the oldest command
    const command = this.commandBuffer[0];
    console.log('Processing command:', command);

    // Process based on command type
    if (command.type === 'direction') {
      this.handleDirectionCommand(command);
    } else if (command.type === 'voice') {
      this.handleVoiceCommand(command);
    }

    // Remove the processed command
    this.removeCommand(0);
  };

  // Handle direction commands (left/right with angle)
  handleDirectionCommand = (command: Command) => {
    const { value, angle = 0 } = command;
    
    // Map direction command to joystick-like input
    let x = 0;
    
    if (value === 'left') {
      // For left turns, set negative x value proportional to angle
      x = -Math.min(Math.abs(angle) / 45, 1);
    } else if (value === 'right') {
      // For right turns, set positive x value proportional to angle
      x = Math.min(Math.abs(angle) / 45, 1);
    }
    
    // Update global joystick state (y keeps its current value for forward/reverse motion)
    this.state.setters.setJoystickX(x);
    
    console.log(`Direction command processed: ${value} at ${angle}°, mapped to joystick X: ${x}`);
  };

  // Handle voice commands
  handleVoiceCommand = (command: Command) => {
    const { value } = command;
    
    switch (value) {
      case 'go':
        // Set to move forward
        this.state.setters.setJoystickY(-1); // Up is negative y
        this.state.setters.setJoystickX(0);  // Straight
        break;
        
      case 'reverse':
        // Set to move backward
        this.state.setters.setJoystickY(1);  // Down is positive y
        this.state.setters.setJoystickX(0);  // Straight
        break;
        
      case 'stop':
        // Stop both motors
        this.state.setters.setJoystickY(0);
        this.state.setters.setJoystickX(0);
        break;
        
      case 'speed one':
        // Low speed (set to 1/3 of max)
        this.state.setters.setJoystickY(this.state.states.joystickY * 0.33);
        break;
        
      case 'speed two':
        // Medium speed (set to 2/3 of max)
        this.state.setters.setJoystickY(this.state.states.joystickY * 0.66);
        break;
        
      case 'speed three':
        // High speed (full speed)
        this.state.setters.setJoystickY(this.state.states.joystickY * 1.0);
        break;
        
      case 'left':
        // Hard left turn
        this.state.setters.setJoystickX(-0.75);
        break;
        
      case 'right':
        // Hard right turn
        this.state.setters.setJoystickX(0.75);
        break;
        
      case 'help me':
        // Emergency stop and alert
        this.emergencyStop();
        break;
    }
    
    console.log(`Voice command processed: ${value}`);
  };

  // Emergency stop
  emergencyStop = () => {
    // Reset joystick state
    this.state.setters.setJoystickX(0);
    this.state.setters.setJoystickY(0);
    
    // Set motors to 0 RPM
    this.state.setters.setLeftMotorRPM(0);
    this.state.setters.setRightMotorRPM(0);
    
    // Send emergency stop commands directly
    this.commands.setRpmRight(this.canID, 0);
    this.commands.setRpmLeft(0);
    
    console.log('EMERGENCY STOP ACTIVATED');
  };
}