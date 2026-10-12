import { TypeSafeClient, type EntryType, type Questions } from "@typesafe-ai/sdk";

// Pinned, not "jev-latest": thresholds are tuned against this exact version and aliases move without notice.
// TYPESAFE_MODEL (with TYPESAFE_BASE_URL) lets the pilot ask another Jev-compatible server, such as laya-serve.
export const JEV_MODEL = process.env.TYPESAFE_MODEL ?? "jev-1.13.0";

// Built on first call: the SDK throws without TYPESAFE_API_KEY, and a run without the key must still reach the keyword fallback.
let client: TypeSafeClient | undefined;

// The run budget and the 3-failure fallback live in the caller (judge.ts).
export async function judge<const Q extends Questions>(state: EntryType, questions: Q) {
  client ??= new TypeSafeClient({ defaultModel: JEV_MODEL, timeout: 5_000, retry: { maxRetries: 1 } });
  const started = performance.now();
  const res = await client.systemOne({ state, questions });
  return { answers: res.answers, usage: res.usage, model: res.model, ms: Math.round(performance.now() - started) };
}
