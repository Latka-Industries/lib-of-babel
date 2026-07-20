// Mbit-range notice — opened from the footer gallery coords control.

import { S } from "./state.js";
import { el, openModal, formatCoordDisplay } from "../lib/util.js";
import { getLocale, t } from "../lib/i18n.js";
import { openAboutGuide } from "../about/about.js";
import { approxCoordMagnitude, coordForWasm, peekHugeCoordDigits } from "../lib/coords.js";
import { mbitScaleTier, mbitScaleVars } from "../lib/mbit-scale.js";
import { node_hash_hex, node_hash_full_hex } from "../lib/wasm.js";
import { jumpToNearestPageScope } from "./nav.js";

/** @type {boolean} */
let wired = false;

/** Max bit-width across gallery axes (length-only for huge `c…`). */
function axisBits() {
  return Math.max(
    approxCoordMagnitude(S.z).bits,
    approxCoordMagnitude(S.n).bits,
  );
}

export { mbitScaleTier };

/** Locale-formatted decimal digit width for one axis (`—` if unknown). */
function axisDigitCount(value) {
  const peek = peekHugeCoordDigits(value);
  if (!peek?.digits) return "—";
  return peek.digits.toLocaleString(getLocale());
}

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
  const setHtml = (id, html) => {
    const node = el(id);
    if (node) node.innerHTML = html;
  };
  const setText = (id, text, title) => {
    const node = el(id);
    if (!node) return;
    node.textContent = text;
    if (title !== undefined) node.title = title;
  };

  setHtml("mbitNoticeBody", t("gallery.mbitNotice.body"));
  const title = el("mbitNoticeModal")?.querySelector(".book-head-text h3");
  if (title) title.innerHTML = t("gallery.mbitNotice.title");

  const bits = axisBits();
  setHtml(
    "mbitNoticeScale",
    t(
      `gallery.mbitNotice.scale.${mbitScaleTier(bits)}`,
      mbitScaleVars(bits, { locale: getLocale(), t }),
    ),
  );
  setText(
    "mbitNoticeHash",
    fullHash || shortHash || "—",
    shortHash ? `prefix ${shortHash}` : "",
  );
  setText("mbitNoticeCoords", formatCoordDisplay(S.z, S.n));
  setText(
    "mbitNoticeDigits",
    `(${axisDigitCount(S.z)}, ${axisDigitCount(S.n)})`,
  );
}

function closeNotice() {
  el("mbitNoticeModal")?.close();
}

function ensureWired() {
  if (wired) return;
  wired = true;
  el("mbitNoticeGotIt")?.addEventListener("click", closeNotice);
  el("mbitNoticeToPage")?.addEventListener("click", () => {
    jumpToNearestPageScope();
    closeNotice();
  });
  el("mbitNoticeEngines")?.addEventListener("click", () => {
    closeNotice();
    openAboutGuide({ tab: "aboutTab-scale", animate: true });
  });
}

/** Open the Mbit-range notice (footer gallery coords). No-op outside Mbit. */
export function showMbitNotice() {
  ensureWired();
  if (!S.coordsHuge) return false;
  paintNotice();
  openModal("mbitNoticeModal");
  return true;
}
