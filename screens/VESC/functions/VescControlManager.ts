import { VescCommands } from './VescCommands';
import { COMMANDS } from '../constants/vescCommands';

export class VescControlManager {
  commands : any;
  state : any;
  canID : number;

  constructor(vescCommands, stateManager) {
    this.commands = vescCommands;
    this.state = stateManager;
    this.canID = 36;
  }

  startControl = () => {

    const { setControlInterval, setIsRunning } = this.state.setters;

    // Clear any existing interval
    if (this.state.states.controlInterval) {
      clearInterval(this.state.states.controlInterval);
    }

    // Set new interval
    const newInterval = setInterval(() => {
      // Always use the latest state value for dutyCycle
     // const latestDutyCycle = this.state.states.dutyCycle;
      //console.log("Duty Cycle:", this.state.states.dutyCycle);
     // this.commands.setDuty(latestDutyCycle);  // Send the updated duty cycle

      //const latestCurrent = this.state.states.targetCurrent;
     // console.log("Current:", this.state.states.targetCurrent);
      //this.commands.setCurrent(latestCurrent);  // Send the current

      
      console.log("Setting Right Motor RPM:", this.state.states.RightMotorRPM);
      console.log("Setting Left Motor RPM:", this.state.states.LeftMotorRPM);

      this.commands.setRpmLeft(this.canID, this.state.states.LeftMotorRPM);  // Set left RPM
      this.commands.setRpmRight(this.state.states.RightMotorRPM);  // Set left RPM
    }, 1000);

    // Store the new interval and update the running state
    setControlInterval(newInterval);
    setIsRunning(true);
  };

  stopControl = () => {
    const { setControlInterval, setIsRunning } = this.state.setters;

    // Clear the interval if it exists
    if (this.state.states.controlInterval) {
      clearInterval(this.state.states.controlInterval);
    }

    // Stop the control (set duty rpm to 0)
    this.commands.setRpmLeft(this.canID, 0);  // Set left RPM
    this.commands.setRpmRight(0);  // Set left RPM

    // Reset state
    setControlInterval(null);
    setIsRunning(false);
  };

  startLogging = () => {
    const { setLoggingInterval, setIsLogging } = this.state.setters;
  
    // Clear any existing logging interval
    if (this.state.states.loggingInterval) {
      clearInterval(this.state.states.loggingInterval);
    }
  
    // Set new logging interval
    const newLoggingInterval = setInterval(() => {
      // Always use the latest state value for isLogging
      const latestIsLogging = this.state.states.isLogging;
      console.log("Logging:", latestIsLogging);
  
      // Send the updated getValues command if logging is enabled
      if (latestIsLogging) {
        this.commands.getValues();  // Send the getValues command to fetch the data
      }
    }, 1000);
  
    // Store the new interval and update the logging state
    setLoggingInterval(newLoggingInterval);
    setIsLogging(true);
  };
  
  stopLogging = () => {
    const { setLoggingInterval, setIsLogging } = this.state.setters;
  
    // Clear the logging interval if it exists
    if (this.state.states.loggingInterval) {
      clearInterval(this.state.states.loggingInterval);
    }
  
    // Reset logging state
    setLoggingInterval(null);
    setIsLogging(false);
  
    // Optionally stop logging and clear any active values or commands
    this.commands.getValues();  // Optionally stop fetching values
  };
  
  // Method to update state dynamically
    updateState = (newState) => {
        this.state = newState; // Update the state in the control manager
    };
}
