import { runIntentPidHarness } from "../harness/intentPidHarness.js";
import { StateStore } from "../runtime/stateStore.js";

export interface IntentArgs {
  intent: string;
  result: string;
}

export async function intentCommand(args: IntentArgs): Promise<void> {
  if (!args.intent.trim()) {
    throw new Error("Missing --intent. Provide target intent text.");
  }
  if (!args.result.trim()) {
    throw new Error("Missing --result. Provide current draft/result text.");
  }

  const store = new StateStore(".pid-runtime/state.json");
  const state = await store.load();

  const pidState = state.intentPid ?? {
    integral: 0,
    previousError: 0,
    filteredDerivative: 0
  };

  const output = await runIntentPidHarness({
    intent: args.intent,
    result: args.result,
    state: pidState
  });

  await store.save({
    ...state,
    runs: state.runs + 1,
    intentPid: {
      ...output.nextState,
      lastScore: output.metrics.score,
      lastControl: output.control
    },
    updatedAt: new Date().toISOString()
  });

  console.log(`intent score   : ${output.metrics.score.toFixed(3)} (1.0 is best)`);
  console.log(`distance error : ${output.error.toFixed(3)}`);
  console.log(`pid control u  : ${output.control.toFixed(3)}`);
  console.log(`mode           : ${output.mode}`);
  console.log("metrics        :");
  console.log(`  coverage     : ${output.metrics.coverage.toFixed(3)}`);
  console.log(`  precision    : ${output.metrics.precision.toFixed(3)}`);
  console.log(`  structure    : ${output.metrics.structure.toFixed(3)}`);
  console.log(`  missing terms: ${output.metrics.missingIntentTokens.slice(0, 8).join(", ") || "(none)"}`);
  console.log(`  extra terms  : ${output.metrics.extraResultTokens.slice(0, 8).join(", ") || "(none)"}`);
  console.log("guidance       :");
  for (const item of output.guidance) {
    console.log(`  - ${item}`);
  }
}
