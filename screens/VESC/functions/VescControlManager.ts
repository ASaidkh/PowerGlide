import { VescCommands } from './VescCommands';
import { COMMANDS } from '../constants/vescCommands';
import { Command } from '../../App';

export class VescControlManager {
  commands: any;
  state: any;
  canID: number;
  commandBuffer: Command[];
  removeCommand: (index: number) => void;
  commandProcessingInterval: any;

  constructor(vescCommands, stateManager, commandBuffer = [], removeCommand = () => {}) {
    this.commands = vescCommands;
    this.state = stateManager;
    this.canID = 36;
    this.commandBuffer = commandBuffer;
    this.removeCommand = removeCommand;
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

  startControl = () => {
    const { setControlInterval, setIsRunning } = this.state.setters;

    // Clear any existing interval
    if (this.state.states.controlInterval) {
      clearInterval(this.state.states.controlInterval);
    }

    // Set new interval
    const newInterval = setInterval(() => {
      console.log("Setting Right Motor RPM:", this.state.states.RightMotorRPM);
      console.log("Setting Left Motor RPM:", this.state.states.LeftMotorRPM);

      this.commands.setRpmRight(this.canID, this.state.states.LeftMotorRPM);  // Set left RPM
      this.commands.setRpmLeft(this.state.states.RightMotorRPM);  // Set right RPM
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
    }, 20000); // Poll every 200ms for more responsive feedback
  
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
    
    // Get current RPM values
    let leftRPM = this.state.states.LeftMotorRPM;
    let rightRPM = this.state.states.RightMotorRPM;
    
    // Calculate turn factor based on angle (0-45 degrees)
    // Normalize to a value between 0 and 1
    const turnFactor = Math.min(Math.abs(angle) / 45, 1);
    
    // Calculate differential based on direction and angle
    if (value === 'left') {
      // For left turns, reduce right motor speed
      rightRPM = this.state.states.RightMotorRPM * (1 - turnFactor * 0.7);
    } else if (value === 'right') {
      // For right turns, reduce left motor speed
      leftRPM = this.state.states.LeftMotorRPM * (1 - turnFactor * 0.7);
    }
    
    // Update motor RPMs
    this.state.setters.setLeftMotorRPM(Math.round(leftRPM));
    this.state.setters.setRightMotorRPM(Math.round(rightRPM));
    
    console.log(`Direction command processed: ${value} at ${angle}°, Left RPM: ${leftRPM}, Right RPM: ${rightRPM}`);
  };

  // Handle voice commands
  handleVoiceCommand = (command: Command) => {
    const { value } = command;
    
    switch (value) {
      case 'go':
        // Set both motors to a moderate forward speed
        this.state.setters.setLeftMotorRPM(1000);
        this.state.setters.setRightMotorRPM(1000);
        break;
        
      case 'reverse':
        // Set both motors to a moderate reverse speed
        this.state.setters.setLeftMotorRPM(-1000);
        this.state.setters.setRightMotorRPM(-1000);
        break;
        
      case 'stop':
        // Stop both motors
        this.state.setters.setLeftMotorRPM(0);
        this.state.setters.setRightMotorRPM(0);
        break;
        
      case 'speed one':
        // Low speed
        this.setSpeedLevel(1);
        break;
        
      case 'speed two':
        // Medium speed
        this.setSpeedLevel(2);
        break;
        
      case 'speed three':
        // High speed
        this.setSpeedLevel(3);
        break;
        
      case 'left':
        // Hard left turn
        this.turnDirection('left');
        break;
        
      case 'right':
        // Hard right turn
        this.turnDirection('right');
        break;
        
      case 'help me':
        // Emergency stop and alert
        this.emergencyStop();
        break;
    }
    
    console.log(`Voice command processed: ${value}`);
  };

  // Set speed level (1, 2, or 3)
  setSpeedLevel = (level: number) => {
    // Get the direction (forward or reverse)
    const currentLeftRPM = this.state.states.LeftMotorRPM;
    const currentRightRPM = this.state.states.RightMotorRPM;
    const isForward = Math.max(currentLeftRPM, currentRightRPM) >= 0;
    
    // Define speed levels
    const speedLevels = {
      1: 2000,  // Low speed
      2: 4000,  // Medium speed
      3: 6000   // High speed
    };
    
    // Get the speed value for the given level
    const speedValue = speedLevels[level] || speedLevels[1];
    
    // Apply direction
    const actualSpeed = isForward ? speedValue : -speedValue;
    
    // Update motor RPMs
    this.state.setters.setLeftMotorRPM(actualSpeed);
    this.state.setters.setRightMotorRPM(actualSpeed);
    
    console.log(`Speed set to level ${level}: ${actualSpeed} RPM`);
  };

  // Turn in a specific direction
  turnDirection = (direction: 'left' | 'right') => {
    // Get current RPM values
    const baseRPM = Math.max(
      Math.abs(this.state.states.LeftMotorRPM), 
      Math.abs(this.state.states.RightMotorRPM)
    );
    
    // If not moving, set a default RPM
    const speedToUse = baseRPM > 0 ? baseRPM : 2000;
    
    if (direction === 'left') {
      this.state.setters.setLeftMotorRPM(speedToUse / 2);
      this.state.setters.setRightMotorRPM(speedToUse);
    } else {
      this.state.setters.setLeftMotorRPM(speedToUse);
      this.state.setters.setRightMotorRPM(speedToUse / 2);
    }
    
    console.log(`Turned ${direction}, Left RPM: ${this.state.states.LeftMotorRPM}, Right RPM: ${this.state.states.RightMotorRPM}`);
  };

  // Emergency stop
  emergencyStop = () => {
    // Immediately stop both motors
    this.state.setters.setLeftMotorRPM(0);
    this.state.setters.setRightMotorRPM(0);
    
    // Send emergency stop commands directly
    this.commands.setRpmRight(this.canID, 0);
    this.commands.setRpmLeft(0);
    
    console.log('EMERGENCY STOP ACTIVATED');
  };
}