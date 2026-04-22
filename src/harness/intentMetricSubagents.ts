import type { IntentEvaluationInput } from "./intentDistance.js";

export interface IntentTokenContext {
  intentSet: Set<string>;
  resultSet: Set<string>;
  intentBullets: number;
  resultBullets: number;
}

export interface MetricSubagent {
  name: "coverage" | "precision" | "structure";
  evaluate(input: IntentEvaluationInput, context: IntentTokenContext): Promise<number>;
}

export async function evaluateMetricsWithSubagents(
  input: IntentEvaluationInput,
  context: IntentTokenContext
): Promise<{ coverage: number; precision: number; structure: number }> {
  const subagents: MetricSubagent[] = [
    new CoverageSubagent(),
    new PrecisionSubagent(),
    new StructureSubagent()
  ];

  const values = await Promise.all(subagents.map((subagent) => subagent.evaluate(input, context)));
  return {
    coverage: values[0],
    precision: values[1],
    structure: values[2]
  };
}

class CoverageSubagent implements MetricSubagent {
  readonly name = "coverage";

  async evaluate(_input: IntentEvaluationInput, context: IntentTokenContext): Promise<number> {
    const overlap = countOverlap(context.intentSet, context.resultSet);
    return safeRatio(overlap, context.intentSet.size);
  }
}

class PrecisionSubagent implements MetricSubagent {
  readonly name = "precision";

  async evaluate(_input: IntentEvaluationInput, context: IntentTokenContext): Promise<number> {
    const overlap = countOverlap(context.intentSet, context.resultSet);
    return safeRatio(overlap, context.resultSet.size);
  }
}

class StructureSubagent implements MetricSubagent {
  readonly name = "structure";

  async evaluate(_input: IntentEvaluationInput, context: IntentTokenContext): Promise<number> {
    if (context.intentBullets === 0) {
      return 1;
    }
    return 1 - Math.min(1, Math.abs(context.intentBullets - context.resultBullets) / context.intentBullets);
  }
}

function countOverlap(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const token of a) {
    if (b.has(token)) {
      count += 1;
    }
  }
  return count;
}

function safeRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return clamp01(numerator / denominator);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
