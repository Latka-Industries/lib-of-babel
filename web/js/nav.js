// Movement across the lattice, big jumps, journey export, and a fresh walk.

import { S, recordStep, persist } from "./state.js";
import { neighbor, randomCoord, clampI64 } from "./util.js";
import { render } from "./view.js";

export function step(move) {
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
  const blob = new Blob(
    [
      JSON.stringify(
        {
          generator_version: S.gv,
          universe: S.universeName,
          alphabet: S.alphabetId,
          started_at: S.startedAt,
          trail: S.trail,
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `babel-journey-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function newWalk() {
  [S.z, S.n] = randomCoord();
  S.trail = [];
  S.windowBuf = [];
  S.startedAt = new Date().toISOString();
  recordStep(null); // the starting node
  await persist();
  render();
}
