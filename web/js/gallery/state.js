// Shared mutable app state + the operations that touch it (universe selection
// and the persisted trail). One object so every module can read and mutate the
// same state; ES module bindings can't be reassigned across files, but object
// properties can.

import { WINDOW_MAX, DEFAULT_ALPHABET_ID, ALPHABET_REGISTRY } from "../lib/constants.js";
import { kvSet } from "../lib/db.js";
import { node_hash_hex, get_universe, set_universe, universe_seed_for } from "../lib/wasm.js";

export const S = {
  z: 0n,
  n: 0n,
  gv: 0,
  alphabetId: DEFAULT_ALPHABET_ID, // view lens; room hash ignores this.
  universeName: "", // "" = default/canonical universe (seed 0)
  trail: [], // [{ z, n, move, hash, alphabet, universe }]
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
  /** Normalized title string shown on its canonical spine after a title search. */
  titleEmbed: null, // { flat, z, n, book } | null
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
  // Same room slot — highlight survives alphabet lens switches.
  return (
    p.z === S.z.toString() &&
    p.n === S.n.toString() &&
    p.universe === S.universeName &&
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

/** Journey JSON shared by IndexedDB persist and file export. */
export function journeySnapshot({ includeCurrent = false } = {}) {
  const body = {
    generator_version: S.gv,
    alphabet: S.alphabetId,
    universe: S.universeName,
    started_at: S.startedAt,
    trail: S.trail,
  };
  if (includeCurrent) {
    body.current = { z: S.z.toString(), n: S.n.toString() };
  }
  return body;
}

export async function persist() {
  await kvSet("journey", journeySnapshot({ includeCurrent: true }));
}

/** Last `WINDOW_MAX` trail steps (oldest → newest). Single source for wanderings UI. */
export function historyWindow() {
  return S.trail.slice(-WINDOW_MAX);
}

/** Read a step's universe string (trimmed), or `fallback` when missing / not a string. */
export function stepUniverse(e, fallback = null) {
  if (e && typeof e.universe === "string") return e.universe.trim();
  return fallback;
}

/** Read a step's alphabet id, or `fallback` when missing / not finite. */
export function stepAlphabet(e, fallback = null) {
  if (e != null && e.alphabet != null && Number.isFinite(Number(e.alphabet))) {
    return Number(e.alphabet);
  }
  return fallback;
}

/**
 * Freeze universe/alphabet onto legacy trail steps that lack them.
 * Call once when hydrating from IndexedDB so wanderings never fall back to the live UI.
 */
export function hydrateTrail(trail, { universe = "", alphabet = 29 } = {}) {
  const uni = typeof universe === "string" ? universe : "";
  const alpha = Number.isFinite(Number(alphabet)) ? Number(alphabet) : 29;
  return (Array.isArray(trail) ? trail : []).map((e) => ({
    ...e,
    universe: stepUniverse(e, uni),
    alphabet: stepAlphabet(e, alpha),
  }));
}

/** Stamp missing universe/alphabet on current trail using live header values (before a switch). */
export function freezeTrailLenses() {
  S.trail = hydrateTrail(S.trail, {
    universe: S.universeName,
    alphabet: S.alphabetId,
  });
}

/** Mirror live `S` into the header universe control (alphabet button synced via picker). */
export function syncLensControls() {
  const uni = document.getElementById("universe");
  if (uni) uni.value = S.universeName;
  if (!ALPHABET_REGISTRY.some((e) => e.id === S.alphabetId)) {
    S.alphabetId = DEFAULT_ALPHABET_ID;
  }
  const label = document.getElementById("alphabetBtnLabel");
  const btn = document.getElementById("alphabetBtn");
  if (label || btn) {
    const entry =
      ALPHABET_REGISTRY.find((e) => e.id === S.alphabetId) ||
      ALPHABET_REGISTRY.find((e) => e.id === DEFAULT_ALPHABET_ID);
    const text = `${entry.short} · ${entry.native || entry.name}`;
    if (label) label.textContent = text;
    else if (btn) btn.textContent = text;
  }
}

export function recordStep(move) {
  const hash = node_hash_hex(String(S.z), String(S.n));
  const entry = {
    z: S.z.toString(),
    n: S.n.toString(),
    move,
    hash,
    alphabet: S.alphabetId, // lens at visit (room hash ignores this)
    universe: S.universeName, // library at visit (room hash includes this)
  };
  S.trail.push(entry);
  scheduleSave();
  return { hash };
}
