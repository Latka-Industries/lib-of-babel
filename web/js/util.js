// Stateless helpers: DOM, clipboard, colour, and lattice math. No app state.

import { I64_MIN, I64_MAX } from "./constants.js";

export const el = (id) => document.getElementById(id);

// copy text to the clipboard; optionally flash a button label as feedback.
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

export function randomCoord() {
  const buf = new BigInt64Array(2);
  crypto.getRandomValues(buf);
  // keep within a friendly range so the header stays readable
  return [buf[0] % 1_000_000_000n, buf[1] % 1_000_000_000n];
}

export const clampI64 = (v) => (v < I64_MIN ? I64_MIN : v > I64_MAX ? I64_MAX : v);
