// Proof-of-find — rarity tiers, trophies, and parallel prospecting.

import { S, withUniverse } from "./state.js";
import { kvGet, kvSet } from "./db.js";
import { permalink } from "./url.js";
import {
  node_hash_hex,
  node_hash_full_hex,
  get_universe,
  set_universe,
  universe_seed_for,
  prospect_batch_json,
} from "./wasm.js";
import { leadingZeroBits, trailEntryBits } from "./util.js";
import {
  PROSPECT_CHUNK,
  PROSPECT_MIN_PARALLEL,
  mergeProspectBest,
  prospectScanChunks,
  prospectSeed,
  prospectWorkerCount,
} from "./prospect-batch.js";

export { leadingZeroBits, trailEntryBits };

const WORKER_URL = new URL("./prospect-worker.js", import.meta.url);

const TIERS = [
  { min: 24, name: "mythic", hue: 330 },
  { min: 20, name: "legendary", hue: 42 },
  { min: 16, name: "epic", hue: 280 },
  { min: 12, name: "rare", hue: 205 },
  { min: 8, name: "uncommon", hue: 140 },
  { min: 0, name: "common", hue: 0, dim: true },
];

export const TROPHY_MIN_BITS = 8;

export function rarityTier(bits) {
  return TIERS.find((t) => bits >= t.min);
}

export function tierColor(tier) {
  return tier.dim ? "var(--muted)" : `hsl(${tier.hue} 75% 62%)`;
}

export function formatTierDisplay(bits) {
  const tier = rarityTier(bits);
  const color = tierColor(tier);
  return {
    tier,
    color,
    badgeHtml: `<span class="tier-badge" style="background:${color}">${tier.name}</span>`,
  };
}

export function rarityOdds(bits) {
  if (bits <= 0) return "1 in 1";
  if (bits < 30) return `1 in ${(2 ** bits).toLocaleString()}`;
  const exp = (bits * Math.log10(2)).toFixed(1);
  return `1 in ~10^${exp}`;
}

export function currentRarity() {
  const hash = node_hash_hex(S.z, S.n, S.alphabetId);
  return { hash, bits: leadingZeroBits(hash) };
}

async function prospectMainThread({ samples, seed, alphabetId, onProgress, signal, t0 }) {
  let best = null;
  let scanned = 0;
  for (const state of prospectScanChunks({
    batchJson: prospect_batch_json,
    samples,
    startIndex: 0,
    seed,
    alphabetId,
    shouldCancel: () => signal?.aborted,
  })) {
    best = state.best;
    scanned = state.scanned;
    onProgress?.(scanned, samples, best, { workers: 1, t0 });
    await new Promise((r) => setTimeout(r, 0));
  }
  return { best, scanned, cancelled: signal?.aborted };
}

function spawnWorker(payload) {
  const w = new Worker(WORKER_URL, { type: "module" });
  w.postMessage(payload);
  return w;
}

async function prospectParallel({
  samples,
  seed,
  universeSeed,
  alphabetId,
  onProgress,
  signal,
  t0,
}) {
  const nWorkers = prospectWorkerCount(samples);
  const base = Math.floor(samples / nWorkers);
  const rem = samples % nWorkers;
  let best = null;
  let pending = nWorkers;
  let cancelled = false;

  return new Promise((resolve) => {
    const workers = [];
    const workerScanned = [];
    let offset = 0;

    const totalScanned = () =>
      workerScanned.reduce((sum, n) => sum + (n || 0), 0);

    const finish = () => {
      for (const w of workers) w.terminate();
      resolve({ best, scanned: totalScanned(), cancelled });
    };

    const onAbort = () => {
      cancelled = true;
      for (const w of workers) w.postMessage({ type: "cancel" });
      setTimeout(finish, 50);
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    const onWorkerMessage = (msg) => {
      if (cancelled) return;
      workerScanned[msg.workerId] = msg.scanned;
      best = mergeProspectBest(best, msg.best);
      onProgress?.(totalScanned(), samples, best, { workers: nWorkers, t0 });
    };

    for (let i = 0; i < nWorkers; i++) {
      const count = base + (i < rem ? 1 : 0);
      workerScanned[i] = 0;
      if (count === 0) {
        pending -= 1;
        if (pending === 0) finish();
        continue;
      }
      const startIndex = offset;
      offset += count;
      const w = spawnWorker({
        type: "run",
        workerId: i,
        samples: count,
        startIndex,
        seed: seed.toString(),
        universeSeed: universeSeed.toString(),
        alphabetId,
        chunkSize: PROSPECT_CHUNK,
      });
      workers.push(w);

      w.onmessage = (ev) => {
        const msg = ev.data;
        if (msg.type === "progress") onWorkerMessage(msg);
        else if (msg.type === "done") {
          onWorkerMessage(msg);
          pending -= 1;
          if (pending === 0) {
            signal?.removeEventListener("abort", onAbort);
            finish();
          }
        }
      };

      w.onerror = () => {
        pending -= 1;
        if (pending === 0) finish();
      };
    }
  });
}

export async function prospect({ samples = 20_000, onProgress, signal } = {}) {
  const alphabetId = S.alphabetId;
  const universeSeed = get_universe();
  const seed = prospectSeed();
  const t0 = performance.now();
  const useWorkers =
    typeof Worker !== "undefined" &&
    samples >= PROSPECT_MIN_PARALLEL &&
    prospectWorkerCount(samples) > 1;

  if (useWorkers) {
    return prospectParallel({
      samples,
      seed,
      universeSeed,
      alphabetId,
      onProgress,
      signal,
      t0,
    });
  }
  return prospectMainThread({ samples, seed, alphabetId, onProgress, signal, t0 });
}

export function formatProspectProgress(done, total, best, { workers = 1, t0 } = {}) {
  const bits = best ? best.bits : 0;
  let eta = "";
  if (t0 && done > 0 && done < total) {
    const rate = done / ((performance.now() - t0) / 1000);
    const sec = Math.ceil((total - done) / rate);
    eta = sec >= 60 ? ` · ~${Math.ceil(sec / 60)}m left` : ` · ~${sec}s left`;
  }
  const par = workers > 1 ? ` · ${workers} workers` : "";
  return `scanned ${done.toLocaleString()} / ${total.toLocaleString()} · best ${bits} bits${eta}${par}`;
}

export function claimFor(z, n, finder = "") {
  const full = node_hash_full_hex(BigInt(z), BigInt(n), S.alphabetId);
  return {
    universe: S.universeName,
    z: z.toString(),
    n: n.toString(),
    alphabet: S.alphabetId,
    generator_version: S.gv,
    hash_full: full,
    bits: leadingZeroBits(full),
    finder: finder || "",
    found_at: new Date().toISOString(),
  };
}

export function verifyClaim(c) {
  try {
    return withUniverse(c.universe || "", () => {
      const full = node_hash_full_hex(BigInt(c.z), BigInt(c.n), c.alphabet);
      const bits = leadingZeroBits(full);
      return {
        ok: full === c.hash_full && bits === c.bits && c.generator_version === S.gv,
        full,
        bits,
        hashMatch: full === c.hash_full,
        gvMatch: c.generator_version === S.gv,
      };
    });
  } catch {
    return { ok: false, full: "", bits: 0, hashMatch: false, gvMatch: false };
  }
}

export function claimPermalink(c) {
  return permalink(c.z, c.n, c.hash_full, c.alphabet, null, null, c.universe);
}

async function saveTrophyFor(z, n) {
  const finder = await getFinder();
  await addTrophy(claimFor(z, n, finder));
}

export function autoTrophy(z, n, bits) {
  if (bits < TROPHY_MIN_BITS) return;
  saveTrophyFor(z, n).catch(() => {});
}

export async function backfillTrophiesFromTrail(trail) {
  for (const e of trail) {
    if (trailEntryBits(e) >= TROPHY_MIN_BITS) {
      await saveTrophyFor(e.z, e.n);
    }
  }
}

export async function getTrophies() {
  return (await kvGet("trophies")) || [];
}

const trophyKey = (c) => `${c.universe}|${c.alphabet}|${c.z}|${c.n}`;

export async function addTrophy(claim) {
  const list = await getTrophies();
  if (list.some((c) => trophyKey(c) === trophyKey(claim)))
    return { list, added: false };
  list.push(claim);
  await kvSet("trophies", list);
  return { list, added: true };
}

export async function removeTrophy(claim) {
  const list = (await getTrophies()).filter(
    (c) => trophyKey(c) !== trophyKey(claim),
  );
  await kvSet("trophies", list);
  return list;
}

export async function getFinder() {
  return (await kvGet("finder")) || "";
}

export async function setFinder(handle) {
  await kvSet("finder", (handle || "").trim().slice(0, 32));
}
