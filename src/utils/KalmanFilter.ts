// utils/KalmanFilter.ts
export default class KalmanFilter {
  private R: number;  // Measurement noise
  private Q: number;  // Process noise
  private A: number;  // State transition
  private B: number;  // Control input model
  private C: number;  // Measurement model

  private cov: number = NaN;
  private x: number = NaN;

  constructor(R = 0.01, Q = 3) {
    this.R = R;
    this.Q = Q;
    this.A = 1;
    this.B = 0;
    this.C = 1;
  }

  public filter(z: number, u = 0): number {
    if (isNaN(this.x)) {
      this.x = (1 / this.C) * z;
      this.cov = (1 / this.C) * this.R * (1 / this.C);
    } else {
      // Prediction
      const predX = this.A * this.x + this.B * u;
      const predCov = this.A * this.cov * this.A + this.Q;

      // Kalman gain
      const K = predCov * this.C / (this.C * predCov * this.C + this.R);

      // Correction
      this.x = predX + K * (z - this.C * predX);
      this.cov = predCov - K * this.C * predCov;
    }

    return this.x;
  }

  public lastMeasurement(): number {
    return this.x;
  }

  public reset(): void {
    this.cov = NaN;
    this.x = NaN;
  }
}
