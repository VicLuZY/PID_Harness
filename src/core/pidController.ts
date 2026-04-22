export interface PidConfig {
  kp: number;
  ki: number;
  kd: number;
  dtSeconds: number;
  outputMin?: number;
  outputMax?: number;
  derivativeFilterAlpha?: number;
}

export interface PidStepResult {
  output: number;
  error: number;
  integral: number;
  derivative: number;
}

export class PidController {
  private readonly kp: number;
  private readonly ki: number;
  private readonly kd: number;
  private readonly dtSeconds: number;
  private readonly outputMin: number;
  private readonly outputMax: number;
  private readonly derivativeFilterAlpha: number;

  private previousError = 0;
  private integral = 0;
  private filteredDerivative = 0;

  constructor(config: PidConfig) {
    this.kp = config.kp;
    this.ki = config.ki;
    this.kd = config.kd;
    this.dtSeconds = config.dtSeconds;
    this.outputMin = config.outputMin ?? Number.NEGATIVE_INFINITY;
    this.outputMax = config.outputMax ?? Number.POSITIVE_INFINITY;
    this.derivativeFilterAlpha = config.derivativeFilterAlpha ?? 0.2;
  }

  reset(): void {
    this.previousError = 0;
    this.integral = 0;
    this.filteredDerivative = 0;
  }

  update(setpoint: number, measured: number): PidStepResult {
    const error = setpoint - measured;
    const derivativeRaw = (error - this.previousError) / this.dtSeconds;
    this.filteredDerivative =
      this.derivativeFilterAlpha * derivativeRaw +
      (1 - this.derivativeFilterAlpha) * this.filteredDerivative;

    const candidateIntegral = this.integral + error * this.dtSeconds;
    const unsaturatedOutput =
      this.kp * error +
      this.ki * candidateIntegral +
      this.kd * this.filteredDerivative;

    const saturatedOutput = this.clamp(unsaturatedOutput);

    // Simple anti-windup: integrate only when not saturating.
    if (saturatedOutput === unsaturatedOutput) {
      this.integral = candidateIntegral;
    }

    this.previousError = error;

    return {
      output: saturatedOutput,
      error,
      integral: this.integral,
      derivative: this.filteredDerivative
    };
  }

  private clamp(value: number): number {
    return Math.min(this.outputMax, Math.max(this.outputMin, value));
  }
}
