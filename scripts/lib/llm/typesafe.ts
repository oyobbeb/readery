import { TypeSafeClient, type EntryType, type Questions } from "@typesafe-ai/sdk";

// Pinned, not "jev-latest": thresholds are tuned against this exact version and aliases move without notice.
export const JEV_MODEL = "jev-1.13.0";

const client = new TypeSafeClient({ defaultModel: JEV_MODEL, timeout: 5_000, retry: { maxRetries: 1 } });

// ponytail: no circuit breaker or run budget yet — add both with the hourly collector
// (60s wall-clock budget, 3 consecutive failures → keyword fallback for the rest of the run).
export async function judge<const Q extends Questions>(state: EntryType, questions: Q) {
  const started = performance.now();
  const res = await client.systemOne({ state, questions });
  return { answers: res.answers, usage: res.usage, model: res.model, ms: Math.round(performance.now() - started) };
}
