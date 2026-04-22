import { runHarness, type HarnessConfig } from "../harness/pidHarness.js";
import { StateStore } from "../runtime/stateStore.js";

export interface RunArgs {
  ticks: number;
  setpoint: number;
  profile: string;
}

export async function runCommand(args: RunArgs): Promise<void> {
  const config = buildConfig(args);
  const result = runHarness(config);

  const store = new StateStore(".pid-runtime/state.json");
  const state = await store.load();
  await store.save({
    runs: state.runs + 1,
    lastProfile: result.profileName,
    lastMeanAbsError: result.meanAbsError,
    lastFinalMeasured: result.finalMeasured,
    updatedAt: new Date().toISOString()
  });

  const lastFive = result.snapshots.slice(-5);
  console.log(`profile      : ${result.profileName}`);
  console.log(`setpoint     : ${result.setpoint.toFixed(2)}`);
  console.log(`final value  : ${result.finalMeasured.toFixed(2)}`);
  console.log(`mean|error|  : ${result.meanAbsError.toFixed(3)}`);
  console.log("tail samples :");
  for (const row of lastFive) {
    console.log(
      `  t=${row.tick.toString().padStart(3, " ")} measured=${row.measured.toFixed(2)} control=${row.control.toFixed(2)} error=${row.error.toFixed(2)}`
    );
  }
}

function buildConfig(args: RunArgs): HarnessConfig {
  if (args.profile === "fast") {
    return {
      profileName: "fast",
      setpoint: args.setpoint,
      ticks: args.ticks,
      initialMeasured: 0,
      ambient: 0,
      inertia: 0.92,
      gain: 0.15,
      noiseAmplitude: 0.05,
      pid: {
        kp: 1.1,
        ki: 0.5,
        kd: 0.18,
        dtSeconds: 0.1,
        outputMin: -4,
        outputMax: 4,
        derivativeFilterAlpha: 0.2
      }
    };
  }

  return {
    profileName: "stable",
    setpoint: args.setpoint,
    ticks: args.ticks,
    initialMeasured: 0,
    ambient: 0,
    inertia: 0.97,
    gain: 0.08,
    noiseAmplitude: 0.02,
    pid: {
      kp: 0.9,
      ki: 0.35,
      kd: 0.12,
      dtSeconds: 0.1,
      outputMin: -3,
      outputMax: 3,
      derivativeFilterAlpha: 0.15
    }
  };
}
