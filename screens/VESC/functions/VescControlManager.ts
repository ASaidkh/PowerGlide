import { VescCommands } from './VescCommands';
import { COMMANDS } from '../constants/vescCommands';

export class VescControlManager {
  constructor(vescCommands, stateManager) {
    this.commands = vescCommands;
    this.state = stateManager;
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
      const latestDutyCycle = this.state.states.dutyCycle;
      console.log("Duty Cycle:", this.state.states.dutyCycle);
      this.commands.setDuty(latestDutyCycle);  // Send the updated duty cycle
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

    // Stop the control (set duty cycle to 0)
    this.commands.setDuty(0); 

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
