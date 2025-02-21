export interface VescValues {
    tempMosfet: number;
    tempMotor: number;
    currentMotor: number;
    currentInput: number;
    dutyCycleNow: number;
    rpm: number;
    voltage: number;
    ampHours: number;
    ampHoursCharged: number;
    wattHours: number;
    wattHoursCharged: number;
    tachometer: number;
    tachometerAbs: number;
  }
  
  export interface LogData {
    timestamp: Date;
    fieldStart: number;
    values: number[];
  }