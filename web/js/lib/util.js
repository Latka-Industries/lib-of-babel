// DOM / clipboard / chrome helpers. No app state.

import {
  isCompactCoord,
  isHugeCoordValue,
  decodeCoordParam,
  formatHugeCoordPreview,
  formatHugeCoordDetail,
  approxCoordMagnitude,
  PAGE_MAP_MAX_BITS,
} from "./coords.js";

/** Shorthand for `document.getElementById`. */
export const el = (id) => document.getElementById(id);

/** Local mise serve / forced `?dev=1` — layout debug chrome only. */
export function isDevMode() {
  const host = location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
  return new URLSearchParams(location.search).has("dev");
}

/** Touch / no-hover — single shelf scroll row; skip wall-title hover. */
export function galleryIsTouch() {
  return (
    window.matchMedia("(hover: none)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

/**
 * Set footer dim text + hover tip (text lives in .dim-clip so the tip isn’t clipped).
 */
export function setFooterDim(node, text) {
  if (!node) return;
  const clip = node.querySelector(".dim-clip") || node;
  const value = text ?? "";
  clip.textContent = value;
  if (value) node.dataset.tip = value;
  else delete node.dataset.tip;
}

/** Escape text for safe HTML insertion. */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Long integer → scientific form for UI (`-1.234×10^312`).
 * Short values stay decimal.
 * Page-map range (`|Σ|^3200`, ≤ {@link PAGE_MAP_MAX_BITS}) → scientific.
 * Above that (book-linked) → first/last 5 digits (`12345…67890`); never expand.
 */
export function formatBigIntScientific(
  value,
  { digits = 4, minLen = 12 } = {},
) {
  if (
    isHugeCoordValue(value) ||
    approxCoordMagnitude(value).bits > PAGE_MAP_MAX_BITS
  ) {
    return formatHugeCoordPreview(value);
  }
  let bi;
  try {
    if (typeof value === "bigint") bi = value;
    else if (typeof value === "string" && isCompactCoord(value)) {
      bi = decodeCoordParam(value);
    } else {
      bi = BigInt(value);
    }
  } catch {
    return formatHugeCoordPreview(value);
  }
  const neg = bi < 0n;
  const mag = neg ? -bi : bi;
  const s = mag.toString();
  if (!/^\d+$/.test(s) || s.length < minLen) {
    return `${neg ? "-" : ""}${s}`;
  }
  const exp = s.length - 1;
  const frac = s.slice(1, digits).replace(/0+$/, "");
  const mant = frac ? `${s[0]}.${frac}` : s[0];
  return `${neg ? "-" : ""}${mant}×10^${exp}`;
}

/** Gallery `(z, n)` — scientific in page range; head…tail when book-scale. */
export function formatCoordDisplay(z, n) {
  return `(${formatBigIntScientific(z)}, ${formatBigIntScientific(n)})`;
}

/**
 * Tooltip coords — page-map same as display; Mbit adds scientific + bit magnitude
 * (`12345…67890 · 1.2345×10^1901234 · ≈6.4 Mbit`).
 */
export function formatCoordFull(z, n) {
  const axis = (v) => {
    if (
      isHugeCoordValue(v) ||
      approxCoordMagnitude(v).bits > PAGE_MAP_MAX_BITS
    ) {
      return formatHugeCoordDetail(v);
    }
    return formatBigIntScientific(v);
  };
  return `(${axis(z)}, ${axis(n)})`;
}

/** Fallback when `navigator.clipboard` is missing or blocked (file://, some dialogs). */
function copyViaExecCommand(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;left:-9999px;top:0";
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, ta.value.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

/** Flash short copy feedback without wiping icon/label child structure. */
function flashButtonLabel(btn, msg, ms) {
  if (!btn || btn.nodeType !== 1) return;
  // Never collapse a whole action row into plain text (delegation pitfall).
  if (btn.matches?.(".find-actions") || btn.querySelector?.("[data-action]")) return;
  const label = btn.querySelector(".btn-label");
  if (label) {
    const prev = label.textContent;
    label.textContent = msg;
    btn.classList.add("is-feedback");
    setTimeout(() => {
      label.textContent = prev;
      btn.classList.remove("is-feedback");
    }, ms);
    return;
  }
  const prev = btn.textContent;
  btn.textContent = msg;
  setTimeout(() => {
    btn.textContent = prev;
  }, ms);
}

/**
 * Copy text to clipboard; briefly flash feedback on the button.
 *
 * Plain HTTP (e.g. http://latkastation:8777 over Tailscale) is not a secure
 * context: clipboard.writeText is unavailable, and execCommand("copy") often
 * returns true without putting anything on the system clipboard. In that case
 * we always surface a prompt instead of pretending ✓ worked.
 */
export async function copyText(text, btn, okMsg = "copied") {
  const value = String(text ?? "");
  if (!value) {
    if (btn) flashButtonLabel(btn, "failed", 1200);
    return false;
  }

  const secure = Boolean(window.isSecureContext);
  let ok = false;
  let viaPrompt = false;

  if (secure && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      ok = false;
    }
  }

  // Only trust execCommand on secure contexts — elsewhere it's a false ✓.
  if (!ok && secure) ok = copyViaExecCommand(value);

  if (!ok) {
    window.prompt("Copy this link (Ctrl/Cmd+C, then Enter):", value);
    ok = true;
    viaPrompt = true;
  }

  if (!btn) return ok;
  flashButtonLabel(btn, viaPrompt ? "shown" : okMsg, viaPrompt ? 1800 : 1200);
  return ok;
}

/** Trigger a file download from a Blob. */
export function downloadBlob(blob, filename, { revokeDelay = 0 } = {}) {
  const a = document.createElement("a");
  const href = URL.createObjectURL(blob);
  a.href = href;
  a.download = filename;
  a.click();
  if (revokeDelay > 0) setTimeout(() => URL.revokeObjectURL(href), revokeDelay);
  else URL.revokeObjectURL(href);
}

/** Blank universe name → display label. */
export function formatUniverseLabel(name = "") {
  return name || "default";
}

/** Join verify-fact values as bold chips, or an em dash when empty. */
export function formatVerifyList(values, formatFn) {
  if (!Array.isArray(values) || !values.length) return "<b>—</b>";
  return values.map((v) => `<b>${formatFn(v)}</b>`).join(", ");
}

/** Wire `[closeId, modalId]` pairs; stamp ×/label close chrome once. */
export function wireModalCloses(pairs) {
  for (const [closeId, modalId] of pairs) {
    const btn = el(closeId);
    stampDialogClose(btn);
    btn.addEventListener("click", () => el(modalId).close());
  }
}

/** Expand a plain close button into label + × (mobile shows × only). */
function stampDialogClose(btn) {
  if (!btn || btn.querySelector(".dialog-close-x")) return;
  btn.classList.add("dialog-close");
  const text = (btn.textContent || "close").trim();
  btn.removeAttribute("data-i18n");
  btn.textContent = "";
  if (!btn.getAttribute("aria-label")) btn.setAttribute("aria-label", text);
  if (!btn.hasAttribute("data-i18n-aria-label")) {
    btn.setAttribute("data-i18n-aria-label", "common.close");
  }
  const lab = document.createElement("span");
  lab.className = "dialog-close-label";
  lab.setAttribute("data-i18n", "common.close");
  lab.textContent = text;
  const x = document.createElement("span");
  x.className = "dialog-close-x";
  x.setAttribute("aria-hidden", "true");
  x.textContent = "×";
  btn.append(lab, x);
}

/** Call `fn` on Enter; optional meta/ctrl modifier. */
export function wireEnter(target, fn, { modKey = false } = {}) {
  const nodes = (Array.isArray(target) ? target : [target]).map((t) =>
    typeof t === "string" ? el(t) : t,
  );
  for (const node of nodes) {
    node.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (modKey && !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      fn(e);
    });
  }
}

/** Open a dialog only if it is not already open. */
export function openModal(id) {
  document.dispatchEvent(new Event("lob:close-dropdowns"));
  const dlg = el(id);
  if (!dlg.open) dlg.showModal();
}

/** Action buttons for search result panels. */
export function findActionRow(actions) {
  const html = actions
    .map((a) => `<button type="button" data-action="${a.id}">${a.label}</button>`)
    .join("");
  return `<div class="find-row find-actions" style="margin-top:.5rem">${html}</div>`;
}

/** Delegate clicks on `.find-actions` buttons to handler map.
 * Handlers receive `(event, button)` — use `button` for copy feedback, not
 * `event.currentTarget` (that is the row under delegation). */
export function wireFindActions(box, handlers) {
  box.querySelector(".find-actions")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    const id = btn?.dataset.action;
    if (!id || !handlers[id]) return;
    handlers[id](e, btn);
  });
}
