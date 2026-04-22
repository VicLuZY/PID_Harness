import { evaluateMetricsWithSubagents } from "./intentMetricSubagents.js";

export interface IntentEvaluationInput {
  intent: string;
  result: string;
}

export interface IntentMetrics {
  coverage: number;
  precision: number;
  structure: number;
  score: number;
  distance: number;
  missingIntentTokens: string[];
  extraResultTokens: string[];
  intentTokenCount: number;
  resultTokenCount: number;
}

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "is",
  "are",
  "be",
  "this",
  "that",
  "it",
  "as",
  "at",
  "by"
]);

export async function evaluateIntentDistance(input: IntentEvaluationInput): Promise<IntentMetrics> {
  const intentTokens = tokenize(input.intent);
  const resultTokens = tokenize(input.result);
  const intentSet = new Set(intentTokens);
  const resultSet = new Set(resultTokens);

  const intentBullets = countPattern(input.intent, /^[\-\*\d]+\s+/gm);
  const resultBullets = countPattern(input.result, /^[\-\*\d]+\s+/gm);
  const { coverage, precision, structure } = await evaluateMetricsWithSubagents(input, {
    intentSet,
    resultSet,
    intentBullets,
    resultBullets
  });

  // Weighted objective J in [0, 1], higher is better.
  const score = clamp01(0.5 * coverage + 0.35 * precision + 0.15 * structure);
  const missingIntentTokens = diffTokens(intentSet, resultSet);
  const extraResultTokens = diffTokens(resultSet, intentSet);
  return {
    coverage,
    precision,
    structure,
    score,
    distance: 1 - score,
    missingIntentTokens,
    extraResultTokens,
    intentTokenCount: intentSet.size,
    resultTokenCount: resultSet.size
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function diffTokens(source: Set<string>, remove: Set<string>): string[] {
  const output: string[] = [];
  for (const token of source) {
    if (!remove.has(token)) {
      output.push(token);
    }
  }
  return output.sort();
}

function countPattern(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
