// Generator-version migrate — soft landing when a permalink/`gv` or IndexedDB trail is stale.

import { S, persist } from "../gallery/state.js";
import { el, openModal } from "../lib/util.js";
import { t, applyI18n } from "../lib/i18n.js";
import { wipeLocalDataAndReload } from "../lib/db.js";
import { generator_version, locate_page_json, node_hash_hex } from "../lib/wasm.js";
import { permalink, syncUrl } from "../gallery/url.js";
import { resetTrail } from "../gallery/nav.js";
import { render } from "../gallery/view.js";

let skipThisSession = false;

/**
 * @param {ReturnType<import("../gallery/url.js").parsePermalink>} link
 * @param {number} curGv
 */
export function isLegacyPermalink(link, curGv) {
  if (!link) return false;
  if (skipThisSession) return false;
  if (link.gv == null || link.gv === "") return true;
  const g = Number(link.gv);
  return Number.isFinite(g) && g !== curGv;
}

/** Saved wanderings trail from an older generator build. */
export function isStaleJourney(saved, curGv) {
  if (skipThisSession) return false;
  if (!saved || saved.generator_version == null) return false;
  return saved.generator_version !== curGv;
}

/**
 * Closest-equivalent migrate, then stamp current `gv` on the URL.
 * @returns {Promise<{ z: bigint, n: bigint, b: number|null, p: number|null, q: string|null, relocated: boolean }>}
 */
export async function migrateLegacyLink(link) {
  const curGv = generator_version();
  let z = link.z;
  let n = link.n;
  let b = link.b;
  let p = link.p;
  let q = link.q;
  let relocated = false;

  if (q) {
    // Content query → re-locate under the live generator.
    try {
      const raw = locate_page_json(q, S.alphabetId);
      const hit = JSON.parse(raw);
      if (hit?.ok) {
        z = BigInt(hit.z);
        n = BigInt(hit.n);
        b = hit.book;
        p = hit.page;
        relocated = true;
      }
    } catch {
      /* keep address-only fallback */
    }
  }

  S.z = z;
  S.n = n;
  resetTrail();
  await persist();
  render();

  const hash = node_hash_hex(String(S.z), String(S.n));
  const url = permalink(
    S.z,
    S.n,
    hash,
    S.alphabetId,
    b,
    p,
    S.universeName,
    q,
    { image: !!link.img },
  );
  history.replaceState(null, "", url.slice(url.indexOf("#")));

  return { z, n, b, p, q, relocated, gv: curGv };
}

/**
 * Show the legacy / stale-data warning.
 * Resolves `{ action: "continue"|"skip"|"wipe" }` (wipe reloads the page).
 *
 * @param {{
 *   kind?: "link"|"journey",
 *   relocated?: boolean,
 *   hasQuery?: boolean,
 *   oldGv?: number|null,
 *   curGv?: number|null,
 * }} opts
 */
export function showLegacyMigrateModal(opts = {}) {
  return new Promise((resolve) => {
    const dlg = el("legacyGvModal");
    if (!dlg) {
      resolve({ action: "continue" });
      return;
    }
    const body = el("legacyGvBody");
    if (body) {
      let key = "legacy.gv.bodyAddress";
      if (opts.kind === "journey") {
        key = "legacy.gv.bodyJourney";
      } else if (opts.hasQuery) {
        key = opts.relocated
          ? "legacy.gv.bodyRelocated"
          : "legacy.gv.bodyQuery";
      }
      body.textContent = t(key, {
        old: opts.oldGv != null ? String(opts.oldGv) : "?",
        cur: opts.curGv != null ? String(opts.curGv) : String(generator_version()),
      });
    }
    applyI18n(dlg);

    const onDone = (action) => {
      if (action === "skip") skipThisSession = true;
      dlg.close();
      cleanup();
      resolve({ action });
    };
    const cont = el("legacyGvContinue");
    const skip = el("legacyGvSkip");
    const wipe = el("legacyGvWipe");
    const close = el("closeLegacyGv");
    const onCont = () => onDone("continue");
    const onSkip = () => onDone("skip");
    const onWipe = () => {
      cleanup();
      // Does not resolve — page navigates away.
      void wipeLocalDataAndReload();
    };
    const cleanup = () => {
      cont?.removeEventListener("click", onCont);
      skip?.removeEventListener("click", onSkip);
      wipe?.removeEventListener("click", onWipe);
      close?.removeEventListener("click", onSkip);
      dlg.removeEventListener("cancel", onCancel);
    };
    const onCancel = (e) => {
      e.preventDefault();
      onDone("continue");
    };
    cont?.addEventListener("click", onCont);
    skip?.addEventListener("click", onSkip);
    wipe?.addEventListener("click", onWipe);
    close?.addEventListener("click", onSkip);
    dlg.addEventListener("cancel", onCancel);
    openModal("legacyGvModal");
  });
}

/** Journey verify helper: open last trail room under the live generator. */
export async function openLastRoomFromJourney(j) {
  const trail = j?.trail;
  if (!Array.isArray(trail) || trail.length === 0) return false;
  const last = trail[trail.length - 1];
  try {
    S.z = BigInt(last.z);
    S.n = BigInt(last.n);
  } catch {
    return false;
  }
  resetTrail();
  await persist();
  render();
  syncUrl();
  return true;
}
