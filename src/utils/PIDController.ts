/**
 * PID Controller for smoother face tracking
 * Based on the recommendation from Abiraj et al.
 */
export class PIDController {
  private kp: number; // Proportional gain
  private ki: number; // Integral gain
  private kd: number; // Derivative gain
  
  private previousError: number;
  private integral: number;
  private lastTime: number;
  private setpoint: number;
  
  private maxOutput: number;
  private minOutput: number;
  
  /**
   * Create a new PID controller
   * @param kp Proportional gain
   * @param ki Integral gain
   * @param kd Derivative gain
   * @param minOutput Minimum output value
   * @param maxOutput Maximum output value
   */
  constructor(kp: number = 0.5, ki: number = 0.1, kd: number = 0.1, minOutput: number = -1, maxOutput: number = 1) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    
    this.previousError = 0;
    this.integral = 0;
    this.lastTime = Date.now();
    this.setpoint = 0;
    
    this.maxOutput = maxOutput;
    this.minOutput = minOutput;
  }
  
  /**
   * Set the target value for the controller
   * @param setpoint The desired target value
   */
  setSetpoint(setpoint: number): void {
    this.setpoint = setpoint;
  }
  
  /**
   * Reset the controller state
   */
  reset(): void {
    this.previousError = 0;
    this.integral = 0;
    this.lastTime = Date.now();
  }
  
  /**
   * Update the controller with a new input value
   * @param input The current measured value
   * @returns The controller output
   */
  update(input: number): number {
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    
    // Calculate error
    const error = this.setpoint - input;
    
    // Calculate integral term with anti-windup
    this.integral += error * deltaTime;
    
    // Calculate derivative term
    const derivative = deltaTime > 0 ? (error - this.previousError) / deltaTime : 0;
    
    // Calculate output
    let output = this.kp * error + this.ki * this.integral + this.kd * derivative;
    
    // Clamp output to min/max
    output = Math.min(Math.max(output, this.minOutput), this.maxOutput);
    
    // Update state for next iteration
    this.previousError = error;
    this.lastTime = currentTime;
    
    return output;
  }
  
  /**
   * Update controller gains
   * @param kp New proportional gain
   * @param ki New integral gain
   * @param kd New derivative gain
   */
  updateGains(kp: number, ki: number, kd: number): void {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
  }
}