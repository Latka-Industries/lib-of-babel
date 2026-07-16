// Journey verifier — re-walk an exported path in WASM and prove every room hash.
//
// Room identity is a pure function of (universe, z, n). Alphabet is a view lens
// recorded per step (and on the journey root) but does not enter the hash:
//   - generator_version must match this build (the frozen content contract),
//   - every step's hash must equal node_hash_hex at its coordinate *under that step's universe*,
//   - hallway/stair moves must actually connect consecutive coordinates.
// Editing a hash, a coordinate, or a move is therefore detectable.

import { formatUniverseLabel, formatVerifyList, escapeHtml, el, openModal } from "../lib/util.js";
import { neighbor } from "../lib/lattice.js";
import { withUniverse, stepUniverse } from "../gallery/state.js";
import {
  node_hash_hex,
  generator_version,
} from "../lib/wasm.js";
import { alphabetShortLabel, formatAlphabetSymbolLabel } from "../lib/constants.js";
import { t } from "../lib/i18n.js";

/**
 * Collect unique values from journey root + each trail step.
 * @param {"number"|"string"} kind
 * @returns {{ ok: true, values: any[] } | { ok: false, values: [] }}
 */
function collectField(j, trail, key, kind) {
  const ids = new Set();
  const add = (v) => {
    if (v === undefined || v === null) return null;
    if (kind === "number") {
      if (v === "") return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return false;
      ids.add(n);
      return true;
    }
    // string (universe names): blank → ""
    ids.add(typeof v === "string" ? v.trim() : String(v));
    return true;
  };
  if (add(j[key]) === false) return { ok: false, values: [] };
  for (const e of trail) {
    if (e && add(e[key]) === false) return { ok: false, values: [] };
  }
  const values = [...ids];
  if (kind === "number") values.sort((a, b) => a - b);
  else values.sort((a, b) => a.localeCompare(b));
  return { ok: true, values };
}

// returns { ok, reason, total, checked, gv, universes, alphabets, badStep? }
export function verifyJourney(j) {
  const base = { total: 0, checked: 0, universes: [], alphabets: [] };
  if (!j || typeof j !== "object") {
    return { ...base, ok: false, reason: "not a journey file" };
  }
  base.gv = j.generator_version;
  const rootUniverse = typeof j.universe === "string" ? j.universe.trim() : "";

  const trail = j.trail;
  if (!Array.isArray(trail) || trail.length === 0) {
    return { ...base, ok: false, reason: "no trail in this file" };
  }
  base.total = trail.length;

  const alphabets = collectField(j, trail, "alphabet", "number");
  if (!alphabets.ok) {
    return { ...base, ok: false, reason: "missing or invalid alphabet" };
  }
  base.alphabets = alphabets.values;

  const universes = collectField(j, trail, "universe", "string");
  if (!universes.ok) {
    return { ...base, ok: false, reason: "missing or invalid universe" };
  }
  // Root may omit universe while steps carry it (or vice versa).
  if (universes.values.length === 0) universes.values.push(rootUniverse);
  base.universes = universes.values;

  const curGv = generator_version();
  if (j.generator_version !== curGv) {
    return {
      ...base,
      ok: false,
      reason: `generator version mismatch — file is v${j.generator_version}, this build is v${curGv}`,
    };
  }

  // Recompute each step under its recorded universe; always restore live state.
  try {
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

      const uni = stepUniverse(e, rootUniverse) ?? rootUniverse;
      const h = withUniverse(uni, () => node_hash_hex(String(z), String(n)));
      if (h !== e.hash) {
        return {
          ...base,
          ok: false,
          badStep: i,
          reason: `step ${i}: hash mismatch at (${z}, ${n}) in ${formatUniverseLabel(uni)} — recomputed ${h.slice(0, 12)}…, file claims ${String(e.hash).slice(0, 12)}…`,
        };
      }

      base.checked++;
      prev = { z, n };
    }
    return { ...base, ok: true, reason: `all ${base.total} steps verified` };
  } catch {
    return { ...base, ok: false, reason: "verification failed" };
  }
}

/** @type {object|null} */
let lastJourneyForMigrate = null;

/** Render a verifyJourney result into #verifyModal. */
export function showVerify(r, fileName, journey = null) {
  lastJourneyForMigrate = journey;
  el("verifyMeta").textContent = fileName
    ? fileName
    : "re-walked in WASM against this build";
  const multiAlpha = (r.alphabets?.length ?? 0) > 1;
  const alphabetList = formatVerifyList(r.alphabets, (a) =>
    escapeHtml(
      multiAlpha ? alphabetShortLabel(a) : formatAlphabetSymbolLabel(a, t),
    ),
  );
  const universeList = formatVerifyList(r.universes, (u) =>
    escapeHtml(formatUniverseLabel(u)),
  );
  const facts =
    r.total != null
      ? `<ul class="verify-facts">
           <li>universe(s): ${universeList}</li>
           <li>alphabet(s): ${alphabetList}</li>
           <li>generator: <b>v${r.gv ?? "—"}</b></li>
           <li>steps checked: <b>${r.checked} / ${r.total}</b></li>
         </ul>`
      : "";
  el("verifyBody").innerHTML =
    `<div class="verify-verdict ${r.ok ? "verify-ok" : "verify-bad"}">` +
    `<span class="badge">${r.ok ? "✓" : "✕"}</span>` +
    `<span>${r.ok ? "verified" : "rejected"}</span></div>` +
    `<p class="verify-reason">${escapeHtml(r.reason)}</p>` +
    facts +
    (r.ok
      ? ""
      : String(r.reason || "").includes("generator version mismatch")
        ? `<p class="verify-migrate find-row find-actions">
             <button type="button" id="verifyOpenLastRoom">${escapeHtml(t("verify.openLastRoom"))}</button>
             <button type="button" id="verifyWipeLocal">${escapeHtml(t("legacy.gv.wipe"))}</button>
           </p>`
        : "");
  openModal("verifyModal");
  const migrateBtn = el("verifyOpenLastRoom");
  if (migrateBtn && lastJourneyForMigrate) {
    migrateBtn.onclick = async () => {
      const { openLastRoomFromJourney } = await import("../gallery/migrate.js");
      await openLastRoomFromJourney(lastJourneyForMigrate);
      el("verifyModal")?.close();
    };
  }
  const wipeBtn = el("verifyWipeLocal");
  if (wipeBtn) {
    wipeBtn.onclick = async () => {
      const { wipeLocalDataAndReload } = await import("../lib/db.js");
      await wipeLocalDataAndReload();
    };
  }
}
