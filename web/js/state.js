// Shared mutable app state + the operations that touch it (universe selection
// and the persisted trail). One object so every module can read and mutate the
// same state; ES module bindings can't be reassigned across files, but object
// properties can.

import { WINDOW_MAX } from "./constants.js";
import { kvSet } from "./db.js";
import { node_hash_hex, get_universe, set_universe, universe_seed_for } from "./wasm.js";
import { leadingZeroBits } from "./util.js";

/** Called after each recorded step — wired at boot to auto-capture rare finds. */
let onRecordStep = null;

export function setOnRecordStep(fn) {
  onRecordStep = fn;
}

export const S = {
  z: 0n,
  n: 0n,
  gv: 0,
  alphabetId: 29, // symbol count; 25 = Borges, 29 = Basile. An axis of the universe.
  universeName: "", // "" = default/canonical universe (seed 0)
  trail: [], // [{ z:string, n:string, move:number|null|"jump", hash:string, bits:number }]
  windowBuf: [], // last <=50 visited {z,n,hash,bits}
  startedAt: new Date().toISOString(),
  saveTimer: null,
  currentBook: null, // { index, title, text, page, searchHighlight?, searchStartPage?, searchPageSpan? }
  lastPickedUp: null, // { z, n, universe, alphabet, bookIndex } — last closed book in this gallery
  viewMode: "text", // "text" | "color" — how the open page is shown
  // current gallery's palette, derived from its hash (set in render). hue spaces
  // the letters; chroma + lightness give each gallery its own mood in OKLCH.
  accentHue: 0,
  accentChroma: 0.15,
  accentLightness: 0.66,
};

// select a universe by name and push its seed into WASM (global there). Must be
// called before any generation so hashes/text reflect the right library. Empty
// name → the default universe (seed 0).
export function applyUniverse(name) {
  S.universeName = (name || "").trim();
  set_universe(universe_seed_for(S.universeName));
}

// when reverse lookup returns a seed with no known name (non-default, unnamed).
export function applyUniverseSeed(seed) {
  const s = typeof seed === "bigint" ? seed : BigInt(seed);
  S.universeName = s === 0n ? "" : `0x${s.toString(16)}`;
  set_universe(s);
}

/** Push the active universe name into WASM (no coordinate jump). */
export function syncUniverseToWasm() {
  set_universe(universe_seed_for(S.universeName));
}

/** Run `fn` under a temporary universe; always restores the live one. */
export function withUniverse(name, fn) {
  const saved = get_universe();
  try {
    set_universe(universe_seed_for(name || ""));
    return fn();
  } finally {
    set_universe(saved);
  }
}

export function markLastPickedUp(bookIndex) {
  S.lastPickedUp = {
    z: S.z.toString(),
    n: S.n.toString(),
    universe: S.universeName,
    alphabet: S.alphabetId,
    bookIndex,
  };
}

export function isLastPickedUp(bookIndex) {
  const p = S.lastPickedUp;
  if (!p) return false;
  return (
    p.z === S.z.toString() &&
    p.n === S.n.toString() &&
    p.universe === S.universeName &&
    p.alphabet === S.alphabetId &&
    p.bookIndex === bookIndex
  );
}

/** Apply the header universe input if it differs; always re-sync WASM before search. */
export function applyUniverseFromInput(raw) {
  const next = (raw ?? S.universeName).trim();
  if (next !== S.universeName) {
    applyUniverse(next);
  } else {
    syncUniverseToWasm();
  }
}

// a short, pronounceable-ish random universe name (memorable + shareable)
export function randomUniverseName() {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  return (
    buf[0].toString(36).slice(0, 4) + buf[1].toString(36).slice(0, 4)
  ).slice(0, 8);
}

function scheduleSave() {
  clearTimeout(S.saveTimer);
  S.saveTimer = setTimeout(persist, 250);
}

export async function persist() {
  await kvSet("journey", {
    generator_version: S.gv,
    alphabet: S.alphabetId,
    universe: S.universeName,
    started_at: S.startedAt,
    current: { z: S.z.toString(), n: S.n.toString() },
    trail: S.trail,
  });
}

export function recordStep(move) {
  const hash = node_hash_hex(S.z, S.n, S.alphabetId);
  const bits = leadingZeroBits(hash);
  const entry = { z: S.z.toString(), n: S.n.toString(), move, hash, bits };
  S.trail.push(entry);
  S.windowBuf.push({ z: entry.z, n: entry.n, hash, bits });
  if (S.windowBuf.length > WINDOW_MAX) S.windowBuf.shift(); // forget beyond 50
  scheduleSave();
  onRecordStep?.(S.z, S.n, bits);
  return { hash, bits };
}
