// Mbit-range notice — opened from the footer gallery coords control.

import { S } from "./state.js";
import { el, openModal, formatCoordDisplay } from "../lib/util.js";
import { getLocale, t } from "../lib/i18n.js";
import { openAboutGuide } from "../about/about.js";
import { approxCoordMagnitude, coordForWasm } from "../lib/coords.js";
import { mbitScaleTier, mbitScaleVars } from "../lib/mbit-scale.js";
import { node_hash_hex, node_hash_full_hex } from "../lib/wasm.js";

const MUTE_KEY = "lib-of-babel-mute-mbit-notice";

/** @type {boolean} */
let wired = false;

function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function setMuted() {
  try {
    localStorage.setItem(MUTE_KEY, "1");
  } catch {
    /* private mode */
  }
}

/** Max bit-width across gallery axes (length-only for huge `c…`). */
function axisBits() {
  return Math.max(
    approxCoordMagnitude(S.z).bits,
    approxCoordMagnitude(S.n).bits,
  );
}

export { mbitScaleTier };

function paintNotice() {
  const zW = coordForWasm(S.z);
  const nW = coordForWasm(S.n);
  let shortHash = "";
  let fullHash = "";
  try {
    shortHash = node_hash_hex(zW, nW);
    fullHash = node_hash_full_hex(zW, nW);
  } catch (err) {
    console.warn("mbit notice hash failed", err);
  }
  const body = el("mbitNoticeBody");
  if (body) body.innerHTML = t("gallery.mbitNotice.body");

  const bits = axisBits();
  const tier = mbitScaleTier(bits);
  const scale = el("mbitNoticeScale");
  if (scale) {
    scale.innerHTML = t(
      `gallery.mbitNotice.scale.${tier}`,
      mbitScaleVars(bits, { locale: getLocale(), t }),
    );
  }

  const hashEl = el("mbitNoticeHash");
  if (hashEl) {
    hashEl.textContent = fullHash || shortHash || "—";
    hashEl.title = shortHash ? `prefix ${shortHash}` : "";
  }
  const coordsEl = el("mbitNoticeCoords");
  if (coordsEl) {
    coordsEl.textContent = formatCoordDisplay(S.z, S.n);
  }
}

function closeNotice() {
  el("mbitNoticeModal")?.close();
}

function ensureWired() {
  if (wired) return;
  wired = true;
  el("mbitNoticeGotIt")?.addEventListener("click", closeNotice);
  el("mbitNoticeMute")?.addEventListener("click", () => {
    setMuted();
    closeNotice();
  });
  el("mbitNoticeEngines")?.addEventListener("click", () => {
    closeNotice();
    openAboutGuide({ tab: "aboutTab-scale", animate: true });
  });
}

/**
 * Open the Mbit-range notice (footer gallery coords). No-op outside Mbit.
 * Honors “Don't show again” unless `force` is set.
 */
export function showMbitNotice({ force = false } = {}) {
  ensureWired();
  if (!S.coordsHuge) return false;
  if (!force && isMuted()) return false;
  paintNotice();
  openModal("mbitNoticeModal");
  return true;
}
