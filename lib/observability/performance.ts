import "server-only";

type TimingMetadata = Record<string, string | number | boolean | null | undefined>;

const DEFAULT_SLOW_OPERATION_MS = 350;

function readThreshold() {
  const configured = Number(process.env.SAHIBASH_PERF_LOG_THRESHOLD_MS);
  return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_SLOW_OPERATION_MS;
}

function sanitizeMetadata(metadata?: TimingMetadata) {
  if (!metadata) return undefined;
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined)
  );
}

export function startDataTimer() {
  return performance.now();
}

export function logDataTiming(
  operation: string,
  startedAt: number,
  metadata?: TimingMetadata
) {
  const durationMs = Math.round((performance.now() - startedAt) * 10) / 10;
  const thresholdMs = readThreshold();
  const forceLogs = process.env.SAHIBASH_PERF_LOGS === "1";

  if (!forceLogs && durationMs < thresholdMs) {
    return;
  }

  console.info(JSON.stringify({
    event: "sahibash.data_timing",
    operation,
    duration_ms: durationMs,
    threshold_ms: thresholdMs,
    region: process.env.VERCEL_REGION ?? "local",
    ...sanitizeMetadata(metadata),
  }));
}

export async function withDataTiming<T>(
  operation: string,
  run: () => Promise<T>,
  metadata?: TimingMetadata
): Promise<T> {
  const startedAt = startDataTimer();
  try {
    const result = await run();
    logDataTiming(operation, startedAt, { ...metadata, ok: true });
    return result;
  } catch (error) {
    logDataTiming(operation, startedAt, { ...metadata, ok: false });
    throw error;
  }
}
