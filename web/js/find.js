// Proof-of-find — rarity as proof-of-work. A gallery's BLAKE3 node hash with N
// leading zero bits is exponentially rare (P = 2^-N for a random gallery), so
// finding one is hard but verifying it is trivial: anyone can recompute the hash
// at (universe, z, n, alphabet) and count the zeros. Claims are self-verifying;
// trophies live in IndexedDB and share as ordinary permalinks.
//
// (The "notable-text" find category waits on a distinct needle-in-haystack generator — see THI-76.)

import { S } from "./state.js";
import { kvGet, kvSet } from "./db.js";
import { permalink } from "./url.js";
import {
  node_hash_hex,
  node_hash_full_hex,
  get_universe,
  set_universe,
  universe_seed_for,
} from "./wasm.js";
import { randomCoord } from "./util.js";

// count leading zero bits of a lowercase hex string
export function leadingZeroBits(hex) {
  let bits = 0;
  for (const ch of hex) {
    const v = parseInt(ch, 16);
    if (v === 0) {
      bits += 4;
      continue;
    }
    bits += v < 2 ? 3 : v < 4 ? 2 : v < 8 ? 1 : 0;
    break;
  }
  return bits;
}

// rarity tiers by leading-zero bits. hue gives each tier an on-theme colour.
const TIERS = [
  { min: 24, name: "mythic", hue: 330 },
  { min: 20, name: "legendary", hue: 42 },
  { min: 16, name: "epic", hue: 280 },
  { min: 12, name: "rare", hue: 205 },
  { min: 8, name: "uncommon", hue: 140 },
  { min: 0, name: "common", hue: 0, dim: true },
];

export function rarityTier(bits) {
  return TIERS.find((t) => bits >= t.min);
}

// odds of a random gallery being at least this rare (1 in 2^bits)
export function rarityOdds(bits) {
  if (bits <= 0) return "1 in 1";
  if (bits < 30) return `1 in ${(2 ** bits).toLocaleString()}`;
  const exp = (bits * Math.log10(2)).toFixed(1);
  return `1 in ~10^${exp}`;
}

// rarity of the gallery we're standing in (uses the cheap 16-hex prefix)
export function currentRarity() {
  const hash = node_hash_hex(S.z, S.n, S.alphabetId);
  return { hash, bits: leadingZeroBits(hash) };
}

// scan many random galleries in the current universe + alphabet for the rarest
// one. Chunked so the UI stays responsive; reports progress + best-so-far.
export async function prospect({ samples = 20000, onProgress } = {}) {
  let best = null;
  let scanned = 0;
  const chunk = 800;
  while (scanned < samples) {
    const end = Math.min(scanned + chunk, samples);
    for (; scanned < end; scanned++) {
      const [z, n] = randomCoord();
      const hash = node_hash_hex(z, n, S.alphabetId);
      const bits = leadingZeroBits(hash);
      if (!best || bits > best.bits)
        best = { z: z.toString(), n: n.toString(), hash, bits };
    }
    onProgress?.(scanned, samples, best);
    await new Promise((r) => setTimeout(r, 0)); // yield to the event loop
  }
  return { best, scanned };
}

// build a self-verifying claim for a coordinate in the CURRENT library
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

// recompute a claim's hash (in its own universe) and confirm it still holds
export function verifyClaim(c) {
  const saved = get_universe();
  try {
    set_universe(universe_seed_for(c.universe || ""));
    const full = node_hash_full_hex(BigInt(c.z), BigInt(c.n), c.alphabet);
    const bits = leadingZeroBits(full);
    return {
      ok: full === c.hash_full && bits === c.bits && c.generator_version === S.gv,
      full,
      bits,
      hashMatch: full === c.hash_full,
      gvMatch: c.generator_version === S.gv,
    };
  } catch {
    return { ok: false, full: "", bits: 0, hashMatch: false, gvMatch: false };
  } finally {
    set_universe(saved);
  }
}

export function claimPermalink(c) {
  return permalink(c.z, c.n, c.hash_full, c.alphabet, null, null, c.universe);
}

// ---- trophy cabinet (IndexedDB) -------------------------------------------
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
