// Stateless helpers: DOM, clipboard, colour, and lattice math. No app state.

import {
  I64_MIN,
  I64_MAX,
  ALPHABETS,
  LINES_PER_PAGE,
  CHARS_PER_LINE,
  PAGE_CONTENT_SYMBOLS,
} from "./constants.js";

/** Shorthand for `document.getElementById`. */
export const el = (id) => document.getElementById(id);

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

/** Find characters outside the active alphabet. Returns `{ i, ch }` (string index). */
export function validateSearchQuery(text, alphabetId = 29) {
  const alpha = ALPHABETS[alphabetId] || ALPHABETS[29];
  const invalid = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\n" || ch === "\r") continue;
    if (!alpha.includes(ch)) invalid.push({ i, ch });
  }
  return invalid;
}

/** Flatten search text for chunking — must match Rust flatten_search_text. */
export function flattenSearchQuery(text, alphabetId = 29) {
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
export function padPageText(text, alphabetId = 29) {
  const alpha = ALPHABETS[alphabetId] || ALPHABETS[29];
  const symbols = [];
  for (const ch of text) {
    if (ch === "\n" || ch === "\r") continue;
    if (!alpha.includes(ch)) {
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

/** Copy text to clipboard; briefly flash `okMsg` on the button. */
export async function copyText(text, btn, okMsg = "copied") {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return; // clipboard blocked (e.g. insecure context) — fail quietly
  }
  if (!btn) return;
  const prev = btn.textContent;
  btn.textContent = okMsg;
  setTimeout(() => (btn.textContent = prev), 1000);
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

/** Deterministic hue 0–359 from a gallery hash prefix. */
export function hashHue(hex) {
  return parseInt(hex.slice(0, 4), 16) % 360;
}

/** Minimap / history accent colour from a hash. */
export function hashAccentColor(hex) {
  return `hsl(${hashHue(hex)} 60% 62%)`;
}

/** Wire `[closeId, modalId]` pairs to close their dialogs. */
export function wireModalCloses(pairs) {
  for (const [closeId, modalId] of pairs) {
    el(closeId).addEventListener("click", () => el(modalId).close());
  }
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
