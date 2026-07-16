// Generator-version migrate — soft landing when a permalink/`gv` is stale or missing.

import { S, persist } from "../gallery/state.js";
import { el, openModal } from "../lib/util.js";
import { t, applyI18n } from "../lib/i18n.js";
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
 * Show the legacy warning; always resolves after Continue / dismiss.
 * @param {{ relocated: boolean, hasQuery: boolean }} opts
 */
export function showLegacyMigrateModal(opts) {
  return new Promise((resolve) => {
    const dlg = el("legacyGvModal");
    if (!dlg) {
      resolve();
      return;
    }
    const body = el("legacyGvBody");
    if (body) {
      const key = opts.hasQuery
        ? opts.relocated
          ? "legacy.gv.bodyRelocated"
          : "legacy.gv.bodyQuery"
        : "legacy.gv.bodyAddress";
      body.textContent = t(key);
    }
    applyI18n(dlg);

    const onDone = (skip) => {
      if (skip) skipThisSession = true;
      dlg.close();
      cleanup();
      resolve();
    };
    const cont = el("legacyGvContinue");
    const skip = el("legacyGvSkip");
    const close = el("closeLegacyGv");
    const onCont = () => onDone(false);
    const onSkip = () => onDone(true);
    const cleanup = () => {
      cont?.removeEventListener("click", onCont);
      skip?.removeEventListener("click", onSkip);
      close?.removeEventListener("click", onSkip);
      dlg.removeEventListener("cancel", onCancel);
    };
    const onCancel = (e) => {
      e.preventDefault();
      onDone(false);
    };
    cont?.addEventListener("click", onCont);
    skip?.addEventListener("click", onSkip);
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
