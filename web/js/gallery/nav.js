// Movement across the lattice, big jumps, journey export, and a fresh walk.

import {
  S,
  recordStep,
  persist,
  journeySnapshot,
  clearBookIdentityCache,
} from "./state.js";
import { downloadBlob } from "../lib/util.js";
import { neighbor, randomCoord } from "../lib/lattice.js";
import { render } from "./view.js";
import { normalizeCoordValue, isHugeCoordValue } from "../lib/coords.js";

export function resetTrail({ randomCoords = false, scope = null } = {}) {
  if (randomCoords) [S.z, S.n] = randomCoord();
  S.titleEmbed = null;
  if (scope === "page" || scope === "book") S.bijectionScope = scope;
  clearBookIdentityCache();
  S.trail = [];
  S.startedAt = new Date().toISOString();
  recordStep(null);
}

export function step(move) {
  if (S.coordsHuge) return; // book-linked Find coords are not lattice-walkable in JS
  S.titleEmbed = null;
  S.bijectionScope = "page";
  clearBookIdentityCache();
  [S.z, S.n] = neighbor(S.z, S.n, move);
  recordStep(move);
  render();
}

// jump to an arbitrary coordinate (big leaps across the lattice).
// Accepts decimal or compact `c…`. Huge book-linked axes stay as compact strings.
export function jumpTo(zStr, nStr, { scope = null } = {}) {
  let zv;
  let nv;
  try {
    zv = normalizeCoordValue(String(zStr).trim());
    nv = normalizeCoordValue(String(nStr).trim());
  } catch {
    return false;
  }
  if (zv === S.z && nv === S.n) {
    if (scope === "page") {
      S.bijectionScope = "page";
      S.coordsHuge = false;
      S.bookOpenId = null;
      clearBookIdentityCache();
    } else if (scope === "book") {
      S.bijectionScope = "book";
      S.coordsHuge = true;
    }
    return true; // already here; just close
  }
  S.z = zv;
  S.n = nv;
  clearBookIdentityCache();
  if (scope === "page") {
    // Text / wander: page-map coords must stay lattice-walkable.
    S.bijectionScope = "page";
    S.coordsHuge = false;
  } else if (scope === "book") {
    S.bijectionScope = "book";
    S.coordsHuge = true;
  } else {
    S.coordsHuge = isHugeCoordValue(zv) || isHugeCoordValue(nv);
    S.bijectionScope = S.coordsHuge ? "book" : "page";
  }
  if (!S.coordsHuge) S.bookOpenId = null;
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
  S.coordsHuge = false;
  S.bijectionScope = "page";
  S.bookOpenId = null;
  clearBookIdentityCache();
  resetTrail({ randomCoords: true });
  await persist();
  render();
}
