import { PidController, type PidConfig } from "../core/pidController.js";

export interface HarnessConfig {
  profileName: string;
  setpoint: number;
  ticks: number;
  initialMeasured: number;
  ambient: number;
  inertia: number;
  gain: number;
  noiseAmplitude: number;
  pid: PidConfig;
}

export interface HarnessSnapshot {
  tick: number;
  measured: number;
  control: number;
  error: number;
}

export interface HarnessResult {
  profileName: string;
  setpoint: number;
  finalMeasured: number;
  meanAbsError: number;
  snapshots: HarnessSnapshot[];
}

export function runHarness(config: HarnessConfig): HarnessResult {
  const controller = new PidController(config.pid);
  let measured = config.initialMeasured;
  let totalAbsError = 0;
  const snapshots: HarnessSnapshot[] = [];

  for (let tick = 1; tick <= config.ticks; tick += 1) {
    const { output, error } = controller.update(config.setpoint, measured);
    totalAbsError += Math.abs(error);

    const noise = (Math.random() * 2 - 1) * config.noiseAmplitude;
    const towardAmbient = (config.ambient - measured) * (1 - config.inertia);
    const controlEffect = output * config.gain;
    measured = measured + towardAmbient + controlEffect + noise;

    snapshots.push({
      tick,
      measured,
      control: output,
      error
    });
  }

  return {
    profileName: config.profileName,
    setpoint: config.setpoint,
    finalMeasured: measured,
    meanAbsError: totalAbsError / config.ticks,
    snapshots
  };
}
