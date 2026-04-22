import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface RuntimeState {
  runs: number;
  lastProfile?: string;
  lastMeanAbsError?: number;
  lastFinalMeasured?: number;
  updatedAt?: string;
  intentPid?: {
    integral: number;
    previousError: number;
    filteredDerivative: number;
    lastScore?: number;
    lastControl?: number;
  };
}

export class StateStore {
  constructor(private readonly filePath: string) {}

  async load(): Promise<RuntimeState> {
    try {
      const contents = await readFile(this.filePath, "utf8");
      return JSON.parse(contents) as RuntimeState;
    } catch {
      return { runs: 0 };
    }
  }

  async save(state: RuntimeState): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(state, null, 2) + "\n", "utf8");
  }
}
