// Movement across the lattice, big jumps, journey export, and a fresh walk.

import { S, recordStep, persist, journeySnapshot } from "./state.js";
import { downloadBlob } from "../lib/util.js";
import { neighbor, randomCoord, clampI64 } from "../lib/lattice.js";
import { render } from "./view.js";

export function resetTrail({ randomCoords = false } = {}) {
  if (randomCoords) [S.z, S.n] = randomCoord();
  S.titleEmbed = null;
  S.trail = [];
  S.startedAt = new Date().toISOString();
  recordStep(null);
}

export function step(move) {
  S.titleEmbed = null;
  [S.z, S.n] = neighbor(S.z, S.n, move);
  recordStep(move);
  render();
}

// jump to an arbitrary coordinate (big leaps across the lattice)
export function jumpTo(zStr, nStr) {
  const parse = (s) => {
    const t = String(s).trim();
    return /^-?\d+$/.test(t) ? clampI64(BigInt(t)) : null;
  };
  const zv = parse(zStr);
  const nv = parse(nStr);
  if (zv === null || nv === null) return false;
  if (zv === S.z && nv === S.n) return true; // already here; just close
  S.z = zv;
  S.n = nv;
  recordStep("jump");
  render();
  return true;
}

export function exportJourney() {
  downloadBlob(
    new Blob([JSON.stringify(journeySnapshot(), null, 2)], {
      type: "application/json",
    }),
    `babel-journey-${Date.now()}.json`,
  );
}

export async function newWalk() {
  resetTrail({ randomCoords: true });
  await persist();
  render();
}
