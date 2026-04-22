import { evaluateIntentDistance, type IntentMetrics } from "./intentDistance.js";
import { generateGuidanceWithSubagents, type GuidanceMode } from "./intentGuidanceSubagents.js";

export interface IntentPidState {
  integral: number;
  previousError: number;
  filteredDerivative: number;
}

export interface IntentPidConfig {
  kp: number;
  ki: number;
  kd: number;
  dtSeconds: number;
  derivativeFilterAlpha: number;
  outputMin: number;
  outputMax: number;
  deadband: number;
}

export interface IntentPidInput {
  intent: string;
  result: string;
  state: IntentPidState;
  config?: Partial<IntentPidConfig>;
}

export interface IntentPidOutput {
  metrics: IntentMetrics;
  error: number;
  control: number;
  mode: GuidanceMode;
  guidance: string[];
  nextState: IntentPidState;
}

const DEFAULT_CONFIG: IntentPidConfig = {
  kp: 1.4,
  ki: 0.3,
  kd: 0.2,
  dtSeconds: 1,
  derivativeFilterAlpha: 0.25,
  outputMin: -1.5,
  outputMax: 1.5,
  deadband: 0.03
};

export async function runIntentPidHarness(input: IntentPidInput): Promise<IntentPidOutput> {
  const merged = { ...DEFAULT_CONFIG, ...input.config };
  const config = normalizeConfig(merged);
  const metrics = await evaluateIntentDistance({
    intent: input.intent,
    result: input.result
  });
  const error = metrics.distance;

  const derivativeRaw = (error - input.state.previousError) / config.dtSeconds;
  const filteredDerivative =
    config.derivativeFilterAlpha * derivativeRaw +
    (1 - config.derivativeFilterAlpha) * input.state.filteredDerivative;

  const integralMin = config.ki > 0 ? config.outputMin / config.ki : Number.NEGATIVE_INFINITY;
  const integralMax = config.ki > 0 ? config.outputMax / config.ki : Number.POSITIVE_INFINITY;
  const candidateIntegral = clamp(input.state.integral + error * config.dtSeconds, integralMin, integralMax);
  const unsaturated =
    config.kp * error + config.ki * candidateIntegral + config.kd * filteredDerivative;
  const control = clamp(unsaturated, config.outputMin, config.outputMax);
  const saturationError = unsaturated - control;
  const saturationIncreasing =
    Math.abs(saturationError) > 1e-9 && Math.sign(saturationError) === Math.sign(error);
  const shouldIntegrate = !saturationIncreasing;
  const integral = shouldIntegrate ? candidateIntegral : input.state.integral;

  const effectiveControl = Math.abs(error) < config.deadband ? 0 : control;
  const mode = chooseMode(effectiveControl);
  const guidance = await generateGuidanceWithSubagents({
    mode,
    control: effectiveControl,
    error,
    metrics
  });

  return {
    metrics,
    error,
    control: effectiveControl,
    mode,
    guidance,
    nextState: {
      integral,
      previousError: error,
      filteredDerivative
    }
  };
}

function chooseMode(control: number): GuidanceMode {
  const magnitude = Math.abs(control);
  if (magnitude > 0.9) {
    return "aggressive";
  }
  if (magnitude > 0.35) {
    return "balanced";
  }
  return "fine";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeConfig(config: IntentPidConfig): IntentPidConfig {
  const dtSeconds = Number.isFinite(config.dtSeconds) && config.dtSeconds > 0 ? config.dtSeconds : 1;
  const derivativeFilterAlpha = clamp(
    Number.isFinite(config.derivativeFilterAlpha) ? config.derivativeFilterAlpha : 0.25,
    0.01,
    1
  );
  const outputMin = Number.isFinite(config.outputMin) ? config.outputMin : -1.5;
  const outputMax = Number.isFinite(config.outputMax) ? config.outputMax : 1.5;
  const [minBound, maxBound] = outputMin <= outputMax ? [outputMin, outputMax] : [outputMax, outputMin];
  return {
    ...config,
    dtSeconds,
    derivativeFilterAlpha,
    outputMin: minBound,
    outputMax: maxBound
  };
}
