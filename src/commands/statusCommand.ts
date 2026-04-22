import { StateStore } from "../runtime/stateStore.js";

export async function statusCommand(): Promise<void> {
  const store = new StateStore(".pid-runtime/state.json");
  const state = await store.load();

  console.log(`runs          : ${state.runs}`);
  console.log(`last profile  : ${state.lastProfile ?? "n/a"}`);
  console.log(
    `last MAE      : ${
      typeof state.lastMeanAbsError === "number"
        ? state.lastMeanAbsError.toFixed(3)
        : "n/a"
    }`
  );
  console.log(
    `last measured : ${
      typeof state.lastFinalMeasured === "number"
        ? state.lastFinalMeasured.toFixed(2)
        : "n/a"
    }`
  );
  console.log(`updated at    : ${state.updatedAt ?? "n/a"}`);
  console.log(
    `intent score  : ${
      typeof state.intentPid?.lastScore === "number"
        ? state.intentPid.lastScore.toFixed(3)
        : "n/a"
    }`
  );
  console.log(
    `intent ctrl u : ${
      typeof state.intentPid?.lastControl === "number"
        ? state.intentPid.lastControl.toFixed(3)
        : "n/a"
    }`
  );
}
