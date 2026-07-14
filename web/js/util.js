// Stateless helpers: DOM, clipboard, colour, and lattice math. No app state.

import {
  I64_MIN,
  I64_MAX,
  alphabetString,
  DEFAULT_ALPHABET_ID,
  LINES_PER_PAGE,
  CHARS_PER_LINE,
  PAGE_CONTENT_SYMBOLS,
} from "./constants.js";
import { accentHsl } from "./theme.js";

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

/** Long integer → `1234…789` for compact header display (full value in title). */
export function truncateMiddle(value, { head = 4, tail = 3, minLen = 10 } = {}) {
  const s = String(value);
  if (s.length < minLen) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

/** Gallery coordinate label for the header — middle-truncates each axis when long. */
export function formatCoordDisplay(z, n) {
  return `(${truncateMiddle(z)}, ${truncateMiddle(n)})`;
}

/** Lowercase only — punctuation is not auto-corrected. */
export function normalizeSearchQuery(text) {
  return text.toLowerCase();
}

/** Find characters outside the active alphabet. Returns `{ i, ch }` (UTF-16 string index). */
export function validateSearchQuery(text, alphabetId = DEFAULT_ALPHABET_ID) {
  const allowed = new Set([...alphabetString(alphabetId)]);
  const invalid = [];
  for (let i = 0; i < text.length; ) {
    const ch = String.fromCodePoint(text.codePointAt(i));
    if (ch !== "\n" && ch !== "\r" && !allowed.has(ch)) invalid.push({ i, ch });
    i += ch.length;
  }
  return invalid;
}

/** Flatten search text for chunking — must match Rust flatten_search_text. */
export function flattenSearchQuery(text, alphabetId = DEFAULT_ALPHABET_ID) {
  const invalid = validateSearchQuery(text, alphabetId);
  if (invalid.length) {
    throw new Error(
      `invalid character${invalid.length > 1 ? "s" : ""} for this alphabet`,
    );
  }
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\n" || ch === "\r") continue;
    if (ch === " " && out.endsWith(" ")) continue;
    out += ch;
  }
  return out.trim();
}

// Space-pad to a full page (phrase at start) — used by notable-text find (THI-76).
/** Pad a phrase to one page width with spaces (not used by main search embed). */
export function padPageText(text, alphabetId = DEFAULT_ALPHABET_ID) {
  const allowed = new Set([...alphabetString(alphabetId)]);
  const symbols = [];
  for (const ch of text) {
    if (ch === "\n" || ch === "\r") continue;
    if (!allowed.has(ch)) {
      throw new Error(`invalid character '${ch}' for this alphabet`);
    }
    symbols.push(ch);
  }
  if (symbols.length > PAGE_CONTENT_SYMBOLS) {
    throw new Error(`text too long (max ${PAGE_CONTENT_SYMBOLS} characters)`);
  }
  while (symbols.length < PAGE_CONTENT_SYMBOLS) symbols.push(" ");

  let out = "";
  for (let row = 0; row < LINES_PER_PAGE; row++) {
    for (let col = 0; col < CHARS_PER_LINE; col++) {
      out += symbols[row * CHARS_PER_LINE + col];
    }
    out += "\n";
  }
  return out;
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

// deterministic hue from a string (spine title) — stable per book
/** Deterministic hue 0–360 from a string (sigil / spine accents). */
export function hueFromString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

// OKLCH (L 0..1, C, H degrees) -> sRGB "#rrggbb". Converted in JS rather than
// relying on canvas oklch() support, so the heatmap renders identically on
// every browser. Math: Björn Ottosson's OKLab -> linear sRGB transform.
export function oklchToHex(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  let out = "#";
  for (let c of lin) {
    c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    const v = Math.max(0, Math.min(255, Math.round(c * 255)));
    out += v.toString(16).padStart(2, "0");
  }
  return out;
}

/** Near-black cell for space — keep in sync with `src/color.rs`. */
export const SPACE_CELL_HEX = "#15131a";

/** Min letter hue step (°) and punct arc — keep in sync with `src/color.rs`. */
const MIN_LETTER_HUE_STEP = 10;
const PUNCT_ARC_DEG = 52;

/**
 * Per-glyph colours for the page colour map.
 * Letters share a hue wheel (step floored at ~10°, overflow → lower-chroma rings);
 * punct/digits sit on a muted arc; space is fixed near-black.
 * @param {string[]} alpha glyph list for the active lens
 * @returns {string[]} hex colours aligned to `alpha` indices
 */
export function buildAlphabetPalette(alpha, accentHue, accentChroma, accentLight) {
  const palette = new Array(alpha.length).fill(SPACE_CELL_HEX);
  const letters = [];
  const puncts = [];
  for (let i = 0; i < alpha.length; i++) {
    const ch = alpha[i];
    if (ch === " ") {
      palette[i] = SPACE_CELL_HEX;
    } else if (/\p{L}/u.test(ch)) {
      letters.push(i);
    } else {
      puncts.push(i);
    }
  }

  const n = Math.max(letters.length, 1);
  const perRing = Math.floor(360 / MIN_LETTER_HUE_STEP); // 36
  const equalSpace = n <= perRing;
  const step = equalSpace ? 360 / n : MIN_LETTER_HUE_STEP;

  for (let k = 0; k < letters.length; k++) {
    const ring = equalSpace ? 0 : Math.floor(k / perRing);
    const pos = equalSpace ? k : k % perRing;
    const hue = (((pos * step + accentHue) % 360) + 360) % 360;
    const chroma = accentChroma * (1 - 0.2 * Math.min(ring, 3));
    const light = Math.min(0.85, Math.max(0.35, accentLight + 0.05 * ring));
    palette[letters[k]] = oklchToHex(light, chroma, hue);
  }

  if (puncts.length > 0) {
    const base = (((accentHue + 168) % 360) + 360) % 360;
    const pstep = PUNCT_ARC_DEG / puncts.length;
    const light = Math.min(0.75, Math.max(0.35, accentLight * 0.78));
    const chroma = accentChroma * 0.4;
    for (let k = 0; k < puncts.length; k++) {
      const hue = (((base + k * pstep) % 360) + 360) % 360;
      palette[puncts[k]] = oklchToHex(light, chroma, hue);
    }
  }

  return palette;
}

// neighbor math (kept in JS to avoid BigInt/JSON round-trips through wasm)
/** Lattice neighbor for move `mv`: 0=left, 1=right, 2=up, 3=down. */
export function neighbor(z, n, mv) {
  switch (mv) {
    case 0:
      return [z, n - 1n]; // left hallway
    case 1:
      return [z, n + 1n]; // right hallway
    case 2:
      return [z + 1n, n]; // stairs up
    default:
      return [z - 1n, n]; // stairs down
  }
}

/** Random `(z, n)` within safe i64 range for a new walk. */
export function randomCoord() {
  const buf = new BigInt64Array(2);
  crypto.getRandomValues(buf);
  // keep within a friendly range so the header stays readable
  return [buf[0] % 1_000_000_000n, buf[1] % 1_000_000_000n];
}

export const clampI64 = (v) => (v < I64_MIN ? I64_MIN : v > I64_MAX ? I64_MAX : v);

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

/** Deterministic hue 0–359 from a gallery hash prefix. */
export function hashHue(hex) {
  return parseInt(hex.slice(0, 4), 16) % 360;
}

/** Minimap / history accent colour from a hash. */
export function hashAccentColor(hex) {
  return accentHsl(hashHue(hex));
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

/** `<select>` that resets after each choice and dispatches to handlers. */
export function wireActionMenu(selectId, handlers) {
  el(selectId).addEventListener("change", (ev) => {
    const choice = ev.currentTarget.value;
    ev.currentTarget.selectedIndex = 0;
    handlers[choice]?.();
  });
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

/** Delegate clicks on `.find-actions` buttons to handler map. */
export function wireFindActions(box, handlers) {
  box.querySelector(".find-actions")?.addEventListener("click", (e) => {
    const id = e.target.closest("[data-action]")?.dataset.action;
    handlers[id]?.(e);
  });
}
