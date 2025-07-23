// VescControlManager with Dynamic Startup Detection for RPM Changes
import { VescCommands } from './VescCommands';
import { COMMANDS } from '../constants/vescCommands';
import { Command } from '../../../App';
import { VescValues } from '../types/VescTypes';

// Define safety thresholds for auto-stop functionality
const SAFETY_THRESHOLDS = {
  // Temperature thresholds (in °C)
  TEMP_MOSFET_MAX: 80,
  TEMP_MOSFET_RATE: 10, // °C per second
  TEMP_MOTOR_MAX: 100, 
  TEMP_MOTOR_RATE: 10, // °C per second
  
  // Current thresholds (in A)
  CURRENT_MOTOR_MAX: 100, // Maximum allowed continuous current
  CURRENT_MOTOR_RATE: 20, // A per second (for non-startup conditions)
  CURRENT_INPUT_MAX: 80,  // Maximum allowed input current
  CURRENT_INPUT_RATE: 20, // A per second (for non-startup conditions)
  
  // Duty cycle threshold (0-1)
  DUTY_CYCLE_RATE: 0.6, // per second
  
  // RPM thresholds
  RPM_MAX: 10000,
  RPM_RATE: 10000, // RPM per second
  
  // Voltage thresholds (in V)
  VOLTAGE_MIN: 10,
  VOLTAGE_MAX: 60,
  VOLTAGE_RATE: 5, // V per second
  
  // Startup allowances
  STARTUP_GRACE_PERIOD_MS: 1500, // 1.5 seconds of reduced sensitivity after significant RPM change
  STARTUP_CURRENT_MULTIPLIER: 2.0, // Allow 2x normal current during startup 
  STARTUP_RATE_MULTIPLIER: 2.0, // Allow 10x normal rate-of-change during startup
  
  // New: RPM change threshold that triggers a new startup phase
  RPM_CHANGE_THRESHOLD: 200, // RPM difference that triggers a new startup phase
  RPM_DIRECTION_CHANGE_MULTIPLIER: 0.5, // Lower threshold for direction changes
};

export class VescControlManager {
  commands: any;
  state: any;
  canID: number;
  commandProcessingInterval: any;
  isStopped: boolean;
  
  // Safety monitoring system
  private safetyMonitoringInterval: any;
  private previousValues: VescValues | null = null;
  private lastCheckTime: number = 0;
  private safetyViolations: string[] = [];
  private consecutiveViolationCount: number = 0;
  private safetyAlertShown: boolean = false;
  private motorStartTime: number = 0;
  private isInStartupPhase: boolean = false;
  private tickCount: number = 0;
  
  // New: Track previous RPM values for startup detection
  private previousLeftRPM: number = 0;
  private previousRightRPM: number = 0;
  private lastStartupTime: number = 0;

  constructor(vescCommands, stateManager) {
    this.commands = vescCommands;
    this.state = stateManager;
    this.canID = 36;
    this.commandProcessingInterval = null;
    this.isStopped = true; // Start in stopped state
    this.safetyMonitoringInterval = null;
    this.motorStartTime = 0;
    this.isInStartupPhase = false;
    this.previousLeftRPM = 0;
    this.previousRightRPM = 0;
    this.lastStartupTime = 0;
  }

  updateState = (newState) => {
    this.state = newState;
  }


  // Check if we're in the motor startup grace period
  isInStartupGracePeriod = () => {
    if (!this.lastStartupTime) return false;
    
    const currentTime = Date.now();
    const timeElapsed = currentTime - this.lastStartupTime;
    return timeElapsed < SAFETY_THRESHOLDS.STARTUP_GRACE_PERIOD_MS;
  }

  // Check if RPM change triggers a new startup phase
  checkForSignificantRPMChange = (leftRPM: number, rightRPM: number): boolean => {
    // Get absolute RPM changes for both motors
    const leftRPMChange = Math.abs(leftRPM - this.previousLeftRPM);
    const rightRPMChange = Math.abs(rightRPM - this.previousRightRPM);
    
    // Check for direction changes (sign changes)
    const leftDirectionChanged = (this.previousLeftRPM * leftRPM < 0) && 
                                (Math.abs(this.previousLeftRPM) > 100) && 
                                (Math.abs(leftRPM) > 100);
    const rightDirectionChanged = (this.previousRightRPM * rightRPM < 0) && 
                                 (Math.abs(this.previousRightRPM) > 100) && 
                                 (Math.abs(rightRPM) > 100);
    
    // Modify threshold based on whether we're changing direction
    const threshold = leftDirectionChanged || rightDirectionChanged ? 
                     SAFETY_THRESHOLDS.RPM_CHANGE_THRESHOLD * SAFETY_THRESHOLDS.RPM_DIRECTION_CHANGE_MULTIPLIER : 
                     SAFETY_THRESHOLDS.RPM_CHANGE_THRESHOLD;
    
    // Check if changes exceed threshold
    const significantChange = leftRPMChange > threshold || rightRPMChange > threshold || 
                             leftDirectionChanged || rightDirectionChanged;
    
    // Special case for starting from stop
    const startingFromStop = (Math.abs(this.previousLeftRPM) < 100 && Math.abs(leftRPM) > 100) || 
                            (Math.abs(this.previousRightRPM) < 100 && Math.abs(rightRPM) > 100);
    
    // Only create a new startup phase if we haven't recently started one
    const currentTime = Date.now();
    const canStartNewPhase = (currentTime - this.lastStartupTime) > (SAFETY_THRESHOLDS.STARTUP_GRACE_PERIOD_MS / 2);
    
    console.log(` == RPM change: L: ${this.previousLeftRPM} -> ${leftRPM}, R: ${this.previousRightRPM} -> ${rightRPM}`)
    if ((significantChange || startingFromStop) && canStartNewPhase) {
      console.log(`Significant RPM change detected: L: ${this.previousLeftRPM} -> ${leftRPM}, R: ${this.previousRightRPM} -> ${rightRPM}`);
      if (leftDirectionChanged || rightDirectionChanged) {
        console.log(`Direction change detected!`);
      }
      if (startingFromStop) {
        console.log(`Starting from stop!`);
      }
      
      // Update previous values
      this.previousLeftRPM = leftRPM;
      this.previousRightRPM = rightRPM;
      
      return true;
    }
    
    // Always update previous values
    this.previousLeftRPM = leftRPM;
    this.previousRightRPM = rightRPM;
    
    return false;
  }

  // Modified: Start a new startup phase
  startNewStartupPhase = () => {
    console.log("Starting new RPM transition phase with higher safety thresholds");
    this.lastStartupTime = Date.now();
    this.isInStartupPhase = true;
    
    // Schedule end of startup phase
    setTimeout(() => {
      if (Date.now() - this.lastStartupTime >= SAFETY_THRESHOLDS.STARTUP_GRACE_PERIOD_MS) {
        this.isInStartupPhase = false;
        console.log("RPM transition phase ended, normal safety thresholds now active");
      }
    }, SAFETY_THRESHOLDS.STARTUP_GRACE_PERIOD_MS);
  }

  // Start safety monitoring system
  startSafetyMonitoring = () => {
    console.log("Starting safety monitoring system");
    
    // Clear any existing interval
    if (this.safetyMonitoringInterval) {
      clearInterval(this.safetyMonitoringInterval);
    }
    this.tickCount = 0;
    // Reset safety state
    this.previousValues = null;
    this.lastCheckTime = Date.now();
    this.safetyViolations = [];
    this.consecutiveViolationCount = 0;
    this.safetyAlertShown = false;
    
    // Initial startup phase when first starting control
    this.startNewStartupPhase();
    
    // Start monitoring interval (check every 200ms)
    this.safetyMonitoringInterval = setInterval(() => {
      this.checkSafetyParameters();
    }, 200);
  }
  
  // Stop safety monitoring system
  stopSafetyMonitoring = () => {
    console.log("Stopping safety monitoring system");
    
    if (this.safetyMonitoringInterval) {
      clearInterval(this.safetyMonitoringInterval);
      this.safetyMonitoringInterval = null;
    }
    
    // Reset startup tracking
    this.motorStartTime = 0;
    this.isInStartupPhase = false;
  }
  
  // Check safety parameters for all critical values
  checkSafetyParameters = () => {
    // Get current values
    const currentValues = this.state.states.vescValues;
    const currentTime = Date.now();
    
    // Skip if no previous values to compare with
    if (!this.previousValues || !currentValues) {
      this.previousValues = {...currentValues};
      this.lastCheckTime = currentTime;
      return;
    }
    


    // Check if we're in startup grace period
    const inStartup = this.isInStartupGracePeriod();
    console.log(`Startup Status: ${inStartup}`)
    
    // Calculate time delta in seconds
    const deltaTime = Math.max(1, currentTime - this.lastCheckTime) / 1000;
    if (deltaTime <= 0) return; // Avoid division by zero
    
    // Reset violations for this check
    const violations: string[] = [];
    
  

    // Check current thresholds - adjust for startup
    this.checkThreshold(
      'Motor Current', 
      currentValues.currentMotor,
      this.previousValues.currentMotor,
      deltaTime,
      inStartup ? 
        SAFETY_THRESHOLDS.CURRENT_MOTOR_MAX * SAFETY_THRESHOLDS.STARTUP_CURRENT_MULTIPLIER : 
        SAFETY_THRESHOLDS.CURRENT_MOTOR_MAX,
      inStartup ? 
        this.state.states.MaxMotorCurrentRate * SAFETY_THRESHOLDS.STARTUP_RATE_MULTIPLIER : 
        this.state.states.MaxMotorCurrentRate,
      'A',
      violations,
      inStartup // Flag that we're using adjusted startup values
    );
    
    this.checkThreshold(
      'Input Current', 
      currentValues.currentInput,
      this.previousValues.currentInput,
      deltaTime,
      inStartup ? 
        SAFETY_THRESHOLDS.CURRENT_INPUT_MAX * SAFETY_THRESHOLDS.STARTUP_CURRENT_MULTIPLIER : 
        SAFETY_THRESHOLDS.CURRENT_INPUT_MAX,
      inStartup ? 
        SAFETY_THRESHOLDS.CURRENT_INPUT_RATE * SAFETY_THRESHOLDS.STARTUP_RATE_MULTIPLIER : 
        SAFETY_THRESHOLDS.CURRENT_INPUT_RATE,
      'A',
      violations,
      inStartup
    );
    
    // Check duty cycle rate of change - adjust for startup
    this.checkRateOnly(
      'Duty Cycle', 
      currentValues.dutyCycleNow,
      this.previousValues.dutyCycleNow,
      deltaTime,
      inStartup ? 
        SAFETY_THRESHOLDS.DUTY_CYCLE_RATE * SAFETY_THRESHOLDS.STARTUP_RATE_MULTIPLIER : 
        SAFETY_THRESHOLDS.DUTY_CYCLE_RATE,
      '',
      violations,
      inStartup
    );
    
    // Check RPM thresholds - adjust rate for startup
    this.checkThreshold(
      'RPM', 
      currentValues.rpm,
      this.previousValues.rpm,
      deltaTime,
      SAFETY_THRESHOLDS.RPM_MAX, // Max RPM stays the same
      inStartup ? 
        SAFETY_THRESHOLDS.RPM_RATE * SAFETY_THRESHOLDS.STARTUP_RATE_MULTIPLIER : 
        SAFETY_THRESHOLDS.RPM_RATE,
      'RPM',
      violations,
      inStartup
    );
    
    
    // If violations occurred, track them
    if (violations.length > 0) {
      this.safetyViolations = violations;
      this.consecutiveViolationCount++;
      
   
      
      // If multiple consecutive violations, trigger emergency stop
      // Require more violations during startup to account for normal spikes
      const requiredViolations = inStartup ? this.state.states.MaxSafetyCount + 4 : this.state.states.MaxSafetyCount;
      
    // Log violations with additional startup info
      console.warn(
        `Safety Violation Threshold: ${requiredViolations}\n
        Safety violations detected (${this.consecutiveViolationCount})${inStartup ? ' [STARTUP PHASE]' : ''}:`, 
        violations.join(', ')
      );

      if (this.consecutiveViolationCount >= requiredViolations) {
        this.triggerSafetyStop(violations);
      }
    } else {
      this.safetyViolations = [];
      this.tickCount += 1;

      if (this.tickCount > 5) {
        this.consecutiveViolationCount = 0;
        this.tickCount = 0;
      }
    }
    
    // Update previous values for next check
    this.previousValues = {...currentValues};
    this.lastCheckTime = currentTime;
  }
  
  // Helper method to check value against max and rate thresholds
  checkThreshold = (
    paramName: string,
    currentValue: number,
    previousValue: number,
    deltaTime: number,
    maxThreshold: number | null,
    rateThreshold: number | null,
    unit: string,
    violations: string[],
    isStartupValue: boolean = false
  ) => {

    // Check for absolute threshold violation
    if (maxThreshold !== null && Math.abs(currentValue) > maxThreshold) {
      violations.push(
        `${paramName} exceeds maximum ${isStartupValue ? '[STARTUP]' : ''} ` +
        `(${currentValue.toFixed(2)}${unit}, Threshold: ${maxThreshold.toFixed(2)}${unit})`
      );
      return;
    }
    


    // Check for rate of change violation
    if (rateThreshold !== null) {
      const changeRate = Math.abs(currentValue - previousValue) / deltaTime;

          console.log(`${paramName} rate: ${changeRate.toFixed(2)}${unit}/s. Threshold: ${rateThreshold.toFixed(2)}${unit}/s`); // Temporary debug remove

      if (changeRate > rateThreshold) {
        violations.push(
          `${paramName} changing too rapidly ${isStartupValue ? '[STARTUP]' : ''} ` +
          `(${changeRate.toFixed(2)}${unit}/s > ${rateThreshold.toFixed(2)}${unit}/s)`
        );
      }
    }
  }
  
  // Helper method to check value against range and rate thresholds
  checkRange = (
    paramName: string,
    currentValue: number,
    previousValue: number,
    deltaTime: number,
    minThreshold: number,
    maxThreshold: number,
    rateThreshold: number | null,
    unit: string,
    violations: string[],
    isStartupValue: boolean = false
  ) => {
    // Check for range violation
    if (currentValue < minThreshold) {
      violations.push(
        `${paramName} below minimum ${isStartupValue ? '[STARTUP]' : ''} ` +
        `(${currentValue.toFixed(2)}${unit} < ${minThreshold.toFixed(2)}${unit})`
      );
      return;
    }
    
    if (currentValue > maxThreshold) {
      violations.push(
        `${paramName} exceeds maximum ${isStartupValue ? '[STARTUP]' : ''} ` +
        `(${currentValue.toFixed(2)}${unit} > ${maxThreshold.toFixed(2)}${unit})`
      );
      return;
    }
    
    // Check for rate of change violation
    if (rateThreshold !== null) {
      const changeRate = Math.abs(currentValue - previousValue) / deltaTime;
      if (changeRate > rateThreshold) {
        violations.push(
          `${paramName} changing too rapidly ${isStartupValue ? '[STARTUP]' : ''} ` +
          `(${changeRate.toFixed(2)}${unit}/s > ${rateThreshold.toFixed(2)}${unit}/s)`
        );
      }
    }
  }
  
  // Helper method to check only rate of change
  checkRateOnly = (
    paramName: string,
    currentValue: number,
    previousValue: number,
    deltaTime: number,
    rateThreshold: number,
    unit: string,
    violations: string[],
    isStartupValue: boolean = false
  ) => {
    const changeRate = Math.abs(currentValue - previousValue) / deltaTime;
    if (changeRate > rateThreshold) {
      violations.push(
        `${paramName} changing too rapidly ${isStartupValue ? '[STARTUP]' : ''} ` +
        `(${changeRate.toFixed(2)}${unit}/s > ${rateThreshold.toFixed(2)}${unit}/s)`
      );
    }
  }
  
  // Trigger safety stop when violations are detected
  triggerSafetyStop = (violations: string[]) => {
    // Only trigger if not already stopped
    if (!this.isStopped) {
      console.error("SAFETY STOP TRIGGERED:", violations);
      
      // Perform emergency stop
      this.emergencyStop();
      
      // Store stop time
      this.state.setters.setSafetyStopTime?.(new Date());
      
      // Store violations for display
      this.state.setters.setSafetyViolations?.(violations);
      
      // Show alert UI if available
      this.state.setters.setSafetyAlertVisible?.(true);
      
      // Show alert to user if we haven't already
      if (!this.safetyAlertShown && global.Alert) {
        const message = `Safety stop triggered: ${violations.join(', ')}`;
        
        global.Alert.alert(
          "SAFETY STOP ACTIVATED",
          message,
          [{ text: "OK" }]
        );
        
        this.safetyAlertShown = true;
      }
    }
  }

  // Calculate motor RPM from joystick x,y values
  calculateMotorValues = (x: number, y: number) => {
    // If explicitly stopped, always return zero RPM regardless of inputs
    if (this.isStopped) {
      return { leftRPM: 0, rightRPM: 0 };
    }
    
    
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
    const leftRPM = Math.round(leftMotor * this.state.states.MaxRPM);
    const rightRPM = Math.round(rightMotor * this.state.states.MaxRPM);
    
    return { leftRPM, rightRPM };
  }

  sendSynchronizedMotorCommands = async (leftRPM, rightRPM) => {
    try {
      // Adjust UART delay based on calibration
      await Promise.all([
        this.commands.setRpmRight(this.canID, leftRPM),
        new Promise(resolve => setTimeout(async () => {
          await this.commands.setRpmLeft(rightRPM);
          resolve();
        }, this.canDelayCompensation || 20)) // fallback to 20ms if not calibrated
      ]);
    } catch (err) {
      console.error("Synchronized motor command failed:", err);
    }
  };

  sendSynchronizedStopCommands = async () => {
    try {
      await Promise.all([
        this.commands.setRpmRight(this.canID, 0),
        this.commands.setRpmLeft(0)
      ]);
    } catch (err) {
      console.error("Failed to send stop commands:", err);
    }
  };

  startControl = async () => {
    const { setControlInterval, setIsRunning } = this.state.setters;

    // Clear existing interval
    if (this.state.states.controlInterval) {
      clearInterval(this.state.states.controlInterval);
    }

    // Calibrate CAN delay once
    if (!this.isDelayCalibrated) {
      await this.calibrateCANDelay();
    }

    // Update internal state
    this.isStopped = false;
    this.safetyAlertShown = false;

    // Start safety monitoring and control loop
    this.startSafetyMonitoring();
    setIsRunning(true);

    const controlLoop = async () => {
      if (this.isStopped) {
        await this.sendSynchronizedStopCommands();
        return;
      }

      const { joystickX, joystickY } = this.state.states;
      const { leftRPM, rightRPM } = this.calculateMotorValues(joystickX, joystickY);

      if (this.checkForSignificantRPMChange(leftRPM, rightRPM)) {
        console.log("==Detected Significant RPM Change, starting startup phase==");
        this.startNewStartupPhase();
      }

      this.state.setters.setLeftMotorRPM(leftRPM);
      this.state.setters.setRightMotorRPM(rightRPM);

      if (!this.isStopped) {
        await this.sendSynchronizedMotorCommands(leftRPM, rightRPM);
      } else {
        await this.sendSynchronizedStopCommands();
      }

      // Reschedule the loop
      if (!this.isStopped) {
        this.controlTimeout = setTimeout(controlLoop, 100);
        this.state.setters.setControlInterval(this.controlTimeout);
      }
    };

    // Start first loop
    controlLoop();

    console.log(`Motor control started with ${this.canDelayCompensation}ms CAN delay compensation`);
  };


  stopControl = () => {
    const { setControlInterval, setIsRunning } = this.state.setters;

    this.isStopped = true;
    this.stopSafetyMonitoring();

    // Immediate motor stop
    this.commands.setRpmRight(this.canID, 0);
    this.commands.setRpmLeft(0);

    // Reset joystick and display states
    this.state.setters.setJoystickX(0);
    this.state.setters.setJoystickY(0);
    this.state.setters.setLeftMotorRPM(0);
    this.state.setters.setRightMotorRPM(0);

    // Clear control timeout
    if (this.controlTimeout) {
      clearTimeout(this.controlTimeout);
      this.controlTimeout = null;
    }

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
    }, 400);
  
    // Store the new interval
    setLoggingInterval(newLoggingInterval);
    setIsLogging(true);
  };
  
  // Start logging
  startLogging = () => {
    // Set logging state
    this.state.setters.setIsLogging(true);
    console.log("Logging started");
  };
  
  // Stop logging
  stopLogging = () => {
    // Set logging state
    this.state.setters.setIsLogging(false);
    console.log("Logging stopped");
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