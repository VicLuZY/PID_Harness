import type { IntentMetrics } from "./intentDistance.js";

export type GuidanceMode = "aggressive" | "balanced" | "fine";

export interface GuidanceContext {
  mode: GuidanceMode;
  control: number;
  error: number;
  metrics: IntentMetrics;
}

interface GuidanceSubagent {
  name: "coverage-steering" | "precision-steering" | "structure-steering";
  steer(context: GuidanceContext): Promise<string>;
}

class CoverageSteeringSubagent implements GuidanceSubagent {
  readonly name = "coverage-steering";

  async steer(context: GuidanceContext): Promise<string> {
    const missing = context.metrics.missingIntentTokens.slice(0, 4);
    if (missing.length === 0) {
      return "Coverage is near-complete; keep edits focused on reinforcing existing intent terms.";
    }
    const urgency = context.mode === "aggressive" ? "immediately" : "next pass";
    return `Add explicit coverage for missing intent terms ${urgency}: ${missing.join(", ")}.`;
  }
}

class PrecisionSteeringSubagent implements GuidanceSubagent {
  readonly name = "precision-steering";

  async steer(context: GuidanceContext): Promise<string> {
    const extras = context.metrics.extraResultTokens.slice(0, 4);
    if (extras.length === 0) {
      return "Precision is stable; avoid introducing new off-intent terms.";
    }
    return `Remove or rewrite off-intent content to improve precision: ${extras.join(", ")}.`;
  }
}

class StructureSteeringSubagent implements GuidanceSubagent {
  readonly name = "structure-steering";

  async steer(context: GuidanceContext): Promise<string> {
    if (context.metrics.structure >= 0.95) {
      return "Keep current structure and tighten wording to improve score without reformat churn.";
    }
    return "Realign structure to the intent format (lists/sections/order) before adding more detail.";
  }
}

export async function generateGuidanceWithSubagents(context: GuidanceContext): Promise<string[]> {
  const subagents: GuidanceSubagent[] = [
    new CoverageSteeringSubagent(),
    new PrecisionSteeringSubagent(),
    new StructureSteeringSubagent()
  ];
  return Promise.all(subagents.map((subagent) => subagent.steer(context)));
}
