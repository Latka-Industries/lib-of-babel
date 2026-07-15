// Colour helpers for spines, palettes, and hash accents.

import { accentHsl } from "../chrome/theme.js";

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
  const l = l_ * l_ * l_,
    m = m_ * m_ * m_,
    s = s_ * s_ * s_;
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

/** Punct arc — keep in sync with `src/color.rs`. */
const PUNCT_ARC_DEG = 52;

/** Mix alphabet index into a stable 32-bit hash (Knuth multiplicative). */
function indexHash(idx, salt) {
  return Math.imul(Math.imul(idx, 0x9e3779b1) + salt, 0x85ebca6b) >>> 0;
}

/**
 * Per-glyph colours for the page colour map.
 * Letters use index-hash OKLCH under the room accent; punct/digits sit on a
 * muted arc; space is fixed near-black.
 * @param {string[]} alpha glyph list for the active lens
 * @returns {string[]} hex colours aligned to `alpha` indices
 */
export function buildAlphabetPalette(alpha, accentHue, accentChroma, accentLight) {
  const palette = new Array(alpha.length).fill(SPACE_CELL_HEX);
  const puncts = [];
  for (let i = 0; i < alpha.length; i++) {
    const ch = alpha[i];
    if (ch === " ") {
      palette[i] = SPACE_CELL_HEX;
    } else if (/\p{L}/u.test(ch)) {
      const h = indexHash(i, 0xa11e77e5);
      const hue = (((accentHue + (h % 360)) % 360) + 360) % 360;
      const chroma = accentChroma * (0.82 + (0.18 * ((h >>> 8) & 0xff)) / 255);
      const light = Math.min(
        0.85,
        Math.max(0.35, accentLight + 0.08 * (((h >>> 16) & 0xff) / 255 - 0.5)),
      );
      palette[i] = oklchToHex(light, chroma, hue);
    } else {
      puncts.push(i);
    }
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

/** Deterministic hue 0–359 from a gallery hash prefix. */
export function hashHue(hex) {
  return parseInt(hex.slice(0, 4), 16) % 360;
}

/** Minimap / history accent colour from a hash. */
export function hashAccentColor(hex) {
  return accentHsl(hashHue(hex));
}
