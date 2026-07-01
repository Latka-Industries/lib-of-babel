// Stateless prospect batch helpers — shared by main thread and workers.

export const PROSPECT_CHUNK = 50_000;
export const PROSPECT_MIN_PARALLEL = 40_000;
export const PROSPECT_MAX_WORKERS = 8;

export function prospectSeed() {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  return (BigInt(buf[0]) << 32n) | BigInt(buf[1]);
}

export function prospectWorkerCount(samples) {
  const cores = navigator.hardwareConcurrency || 4;
  const byLoad = Math.max(
    1,
    Math.min(PROSPECT_MAX_WORKERS, Math.floor(samples / 25_000)),
  );
  return Math.min(cores, byLoad);
}

export function mergeProspectBest(a, b) {
  if (!b) return a;
  if (!a) return b;
  return b.bits > a.bits ? b : a;
}

/** Chunked WASM batch scan; yields `{ best, scanned }` after each chunk. */
export function* prospectScanChunks({
  batchJson,
  samples,
  startIndex,
  seed,
  alphabetId,
  chunkSize = PROSPECT_CHUNK,
  shouldCancel = () => false,
}) {
  let best = null;
  let scanned = 0;
  while (scanned < samples) {
    if (shouldCancel()) return;
    const n = Math.min(chunkSize, samples - scanned);
    const part = JSON.parse(
      batchJson(n, BigInt(seed), BigInt(startIndex + scanned), alphabetId),
    );
    scanned += part.scanned;
    best = mergeProspectBest(best, part.best);
    yield { best, scanned };
  }
}
