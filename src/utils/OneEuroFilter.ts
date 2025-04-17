// utils/OneEuroFilter.ts
export default class OneEuroFilter {
   private lastTime: number;
   private lastValue: number;
   private lastDerivative: number;
   private minCutoff: number;
   private beta: number;
   private derivateCutoff: number;
 
   constructor(
     initialValue: number = 0,
     minCutoff: number = 0.5,
     beta: number = 0.05,
     derivateCutoff: number = 1.0
   ) {
     this.lastTime = Date.now();
     this.lastValue = initialValue;
     this.lastDerivative = 0;
     this.minCutoff = minCutoff;
     this.beta = beta;
     this.derivateCutoff = derivateCutoff;
   }
 
   filter(value: number): number {
     const currentTime = Date.now();
     const dt = Math.max(1, currentTime - this.lastTime) / 1000;
     this.lastTime = currentTime;
 
     const alpha = this.calculateAlpha(dt, this.minCutoff);
     const derivativeAlpha = this.calculateAlpha(dt, this.derivateCutoff);
 
     const derivative = (value - this.lastValue) / dt;
     const smoothedDerivative =
       this.lastDerivative +
       derivativeAlpha * (derivative - this.lastDerivative);
 
     const cutoff = this.minCutoff + this.beta * Math.abs(smoothedDerivative);
     const dynamicAlpha = this.calculateAlpha(dt, cutoff);
 
     const smoothedValue = this.lastValue + dynamicAlpha * (value - this.lastValue);
 
     this.lastValue = smoothedValue;
     this.lastDerivative = smoothedDerivative;
 
     return smoothedValue;
   }
 
   private calculateAlpha(dt: number, cutoff: number): number {
     const tau = 1.0 / (2.0 * Math.PI * cutoff);
     return 1.0 / (1.0 + tau / dt);
   }
}
 