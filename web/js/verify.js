// Journey verifier — re-walk an exported path in WASM and prove every hash.
//
// Because content is a pure function of (universe, z, n, alphabet), anyone can
// re-derive a gallery's BLAKE3 fingerprint and confirm a journey is genuine:
//   - generator_version must match this build (the frozen content contract),
//   - every step's hash must equal node_hash_hex recomputed at its coordinate,
//   - hallway/stair moves must actually connect consecutive coordinates.
// Editing a hash, a coordinate, or a move is therefore detectable.

import { neighbor } from "./util.js";
import {
  node_hash_hex,
  generator_version,
  get_universe,
  set_universe,
  universe_seed_for,
} from "./wasm.js";

// returns { ok, reason, total, checked, gv, universe, alphabet, badStep? }
export function verifyJourney(j) {
  const base = { total: 0, checked: 0 };
  if (!j || typeof j !== "object") {
    return { ...base, ok: false, reason: "not a journey file" };
  }
  base.gv = j.generator_version;
  base.universe = typeof j.universe === "string" ? j.universe : "";
  base.alphabet = j.alphabet;

  const trail = j.trail;
  if (!Array.isArray(trail) || trail.length === 0) {
    return { ...base, ok: false, reason: "no trail in this file" };
  }
  base.total = trail.length;

  const curGv = generator_version();
  if (j.generator_version !== curGv) {
    return {
      ...base,
      ok: false,
      reason: `generator version mismatch — file is v${j.generator_version}, this build is v${curGv}`,
    };
  }

  const alphabet = Number(j.alphabet);
  if (!Number.isFinite(alphabet)) {
    return { ...base, ok: false, reason: "missing or invalid alphabet" };
  }

  // recompute under the file's universe, then always restore the live one so
  // verifying never disturbs the walk the user is on.
  const savedUniverse = get_universe();
  try {
    set_universe(universe_seed_for(base.universe));
    let prev = null;
    for (let i = 0; i < trail.length; i++) {
      const e = trail[i];
      let z, n;
      try {
        z = BigInt(e.z);
        n = BigInt(e.n);
      } catch {
        return { ...base, ok: false, badStep: i, reason: `step ${i}: bad coordinate` };
      }

      // a hallway/stair move (0–3) must connect the previous coordinate to this
      // one; null (start) and "jump" legitimately break continuity.
      if (prev && typeof e.move === "number") {
        const [pz, pn] = neighbor(prev.z, prev.n, e.move);
        if (pz !== z || pn !== n) {
          return {
            ...base,
            ok: false,
            badStep: i,
            reason: `step ${i}: move "${e.move}" doesn't lead from (${prev.z}, ${prev.n}) to (${z}, ${n})`,
          };
        }
      }

      const h = node_hash_hex(z, n, alphabet);
      if (h !== e.hash) {
        return {
          ...base,
          ok: false,
          badStep: i,
          reason: `step ${i}: hash mismatch at (${z}, ${n}) — recomputed ${h.slice(0, 12)}…, file claims ${String(e.hash).slice(0, 12)}…`,
        };
      }

      base.checked++;
      prev = { z, n };
    }
  } finally {
    set_universe(savedUniverse);
  }

  return { ...base, ok: true, reason: `all ${base.total} steps verified` };
}
