// Compact gallery coordinates — binary packing, never megadigit decimals.

/** Decimal digit length above which coords use compact `c…` encoding. */
const COMPACT_COORD_DIGITS = 24;

/**
 * Compact `c…` payload long enough that decoding to BigInt freezes the tab.
 * Page-linked `|Σ|^3200` packs are a few KB; book-linked `|Σ|^BOOK` is ~MB.
 * Threshold sits between those so text-search coords stay walkable BigInts.
 */
const HUGE_COMPACT_LEN = 32_000;

/**
 * Bit-length ceiling for page-linked addresses (`|Σ|^3200`, α ≤ 4096 ≈ 38.4 kbit).
 * At or below → scientific / decimal UI; above → opaque bit-magnitude labels.
 */
export const PAGE_MAP_MAX_BITS = 48_000;

/** True when `raw` is already a compact (`c…`) coord string. */
export function isCompactCoord(raw) {
  return typeof raw === "string" && raw.startsWith("c") && raw.length > 1;
}

/**
 * True when the value is above the page-map range — keep opaque, never
 * decimal-expand / fully decode in JS (book-linked Find axes).
 */
export function isHugeCoordValue(value) {
  if (typeof value === "string") {
    if (isCompactCoord(value)) return value.length >= HUGE_COMPACT_LEN;
    const s = value.replace(/^-/, "");
    // ~page-map decimal digit budget; longer → treat as book-scale.
    return /^\d+$/.test(s) && s.length > 20_000;
  }
  // Book-linked axes stay compact strings in JS — a live bigint is page-scale.
  if (typeof value === "bigint") return false;
  return false;
}

/**
 * Pack a BigInt as `c` + base64url(sign byte + big-endian magnitude).
 * Sign byte: 0 = non-negative, 1 = negative.
 * Pass-through if already compact (`c…`). Never decimal-expand huge axes.
 */
export function encodeCoordParam(value) {
  if (typeof value === "string") {
    const s = value.trim();
    if (isCompactCoord(s)) return s;
    if (/^-?\d+$/.test(s) && s.replace(/^-/, "").length <= COMPACT_COORD_DIGITS) {
      return s;
    }
    // Long decimal — unavoidable BigInt once; pack immediately.
    return encodeCoordParam(BigInt(s));
  }
  const bi = typeof value === "bigint" ? value : BigInt(value);
  const neg = bi < 0n;
  let mag = neg ? -bi : bi;
  const hex = mag.toString(16);
  if (hex.length <= 20) {
    return bi.toString();
  }
  const bytes = [];
  bytes.push(neg ? 1 : 0);
  if (mag === 0n) {
    bytes.push(0);
  } else {
    const padded = hex.length % 2 ? `0${hex}` : hex;
    for (let i = 0; i < padded.length; i += 2) {
      bytes.push(Number.parseInt(padded.slice(i, i + 2), 16));
    }
  }
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return `c${b64}`;
}

/**
 * Decode to BigInt. **Do not call on huge book-linked `c…` strings** — that
 * freezes the tab. Prefer keeping compact form and passing to WASM as-is.
 * @returns {bigint}
 */
export function decodeCoordParam(raw) {
  const s = String(raw);
  if (!isCompactCoord(s)) return BigInt(s);
  if (s.length >= HUGE_COMPACT_LEN) {
    throw new RangeError("huge compact coord — keep as string for WASM");
  }
  let b64 = s.slice(1).replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if (bytes.length < 1) throw new SyntaxError("empty compact coord");
  const neg = bytes[0] === 1;
  let mag = 0n;
  for (let i = 1; i < bytes.length; i++) {
    mag = (mag << 8n) | BigInt(bytes[i]);
  }
  return neg ? -mag : mag;
}

/**
 * Normalize for state: short coords → bigint; huge compact → string (never decode).
 * @returns {bigint|string}
 */
export function normalizeCoordValue(raw) {
  if (typeof raw === "bigint") return raw;
  const s = String(raw).trim();
  if (isHugeCoordValue(s)) return isCompactCoord(s) ? s : encodeCoordParam(s);
  return decodeCoordParam(s);
}

/** String form for WASM `parse_coord` — compact when huge, never megadigit decimal. */
export function coordForWasm(value) {
  if (typeof value === "string" && isCompactCoord(value)) return value;
  return encodeCoordParam(value);
}

/**
 * Approximate bit-length of a coord’s magnitude — never expands huge `c…` to BigInt.
 * Compact form is `c` + base64url(sign ‖ BE mag); estimate from string length only.
 * @returns {{ bits: number, neg: boolean }}
 */
export function approxCoordMagnitude(value) {
  if (typeof value === "bigint") {
    const neg = value < 0n;
    const mag = neg ? -value : value;
    if (mag === 0n) return { bits: 0, neg: false };
    return { bits: mag.toString(2).length, neg };
  }
  const s = String(value ?? "").trim();
  if (isCompactCoord(s)) {
    const packed = compactMagBytes(s);
    if (!packed) return { bits: 0, neg: false };
    const { neg, mag } = packed;
    let start = 0;
    while (start < mag.length && mag[start] === 0) start++;
    if (start >= mag.length) return { bits: 0, neg: false };
    const m = mag.subarray(start);
    const clz8 = Math.clz32(m[0]) - 24;
    return { bits: m.length * 8 - clz8, neg };
  }
  if (/^-?\d+$/.test(s)) {
    const neg = s.startsWith("-");
    const digits = s.replace(/^-/, "").length;
    if (digits === 0) return { bits: 0, neg: false };
    // log2(10) ≈ 3.321928
    return { bits: Math.max(1, Math.ceil(digits * 3.321928)), neg };
  }
  return { bits: 0, neg: false };
}

/** Human magnitude label from bit count (`≈6.4 Mbit`). */
export function formatBitMagnitude(bits, { neg = false } = {}) {
  const n = Math.max(0, Number(bits) || 0);
  const sign = neg ? "−" : "";
  if (n < 10_000) return `${sign}≈${n.toLocaleString("en-US")} bit`;
  if (n < 1_000_000) {
    const k = n / 1_000;
    return `${sign}≈${k >= 100 ? k.toFixed(0) : k.toFixed(1)} kbit`;
  }
  const m = n / 1_000_000;
  return `${sign}≈${m >= 100 ? m.toFixed(0) : m.toFixed(1)} Mbit`;
}

/** Per-axis UI label for opaque / huge coords (from length only). */
export function formatCoordMagnitudeLabel(value) {
  const { bits, neg } = approxCoordMagnitude(value);
  return formatBitMagnitude(bits, { neg });
}

const LOG10_2 = Math.log10(2);

/**
 * Decode compact `c…` to sign + big-endian magnitude bytes (no BigInt).
 * @returns {{ neg: boolean, mag: Uint8Array } | null}
 */
function compactMagBytes(raw) {
  const s = String(raw ?? "").trim();
  if (!isCompactCoord(s)) return null;
  let b64 = s.slice(1).replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  let bin;
  try {
    bin = atob(b64);
  } catch {
    return null;
  }
  if (bin.length < 1) return null;
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { neg: bytes[0] === 1, mag: bytes.subarray(1) };
}

/**
 * Magnitude bytes for a coord without decimal-expanding huge values.
 * @returns {{ neg: boolean, mag: Uint8Array } | null}
 */
function coordMagBytes(value) {
  if (typeof value === "bigint") {
    const neg = value < 0n;
    let mag = neg ? -value : value;
    if (mag === 0n) return { neg: false, mag: new Uint8Array([0]) };
    const hex = mag.toString(16);
    const padded = hex.length % 2 ? `0${hex}` : hex;
    const out = new Uint8Array(padded.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = Number.parseInt(padded.slice(i * 2, i * 2 + 2), 16);
    }
    return { neg, mag: out };
  }
  const s = String(value ?? "").trim();
  if (isCompactCoord(s)) return compactMagBytes(s);
  if (/^-?\d+$/.test(s)) {
    // Short / medium decimals only — never call with megadigit strings.
    if (s.replace(/^-/, "").length > 20_000) return null;
    try {
      return coordMagBytes(BigInt(s));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * First/last decimal digits + digit count for UI — never builds a full decimal
 * string for huge `c…` axes (uses magnitude bytes + log10 of the top limb).
 *
 * @returns {{
 *   neg: boolean,
 *   head: string,
 *   tail: string,
 *   digits: number,
 *   bits: number,
 *   scientific: string,
 *   preview: string,
 * } | null}
 */
export function peekHugeCoordDigits(value, { headLen = 5, tailLen = 5 } = {}) {
  const packed = coordMagBytes(value);
  if (!packed) return null;
  const { neg, mag } = packed;
  let start = 0;
  while (start < mag.length && mag[start] === 0) start++;
  if (start >= mag.length) {
    return {
      neg: false,
      head: "0",
      tail: "0",
      digits: 1,
      bits: 0,
      scientific: "0",
      preview: "0",
    };
  }
  const m = mag.subarray(start);
  const clz8 = Math.clz32(m[0]) - 24;
  const bits = m.length * 8 - clz8;

  // Trailing digits: fold all mag bytes mod 10^tailLen (limb stays < 1e5 — safe in Number).
  const tailMod = 10 ** tailLen;
  let last = 0;
  for (let i = 0; i < m.length; i++) {
    last = (last * 256 + m[i]) % tailMod;
  }
  const tail = String(last).padStart(tailLen, "0");

  // Leading digits + digit count from top ≤7 bytes (safe in Number) + bit shift.
  const topN = Math.min(7, m.length);
  let top = 0;
  for (let i = 0; i < topN; i++) top = top * 256 + m[i];
  const topBits = Math.floor(Math.log2(top)) + 1;
  const log10m = Math.log10(top) + (bits - topBits) * LOG10_2;
  let digits = Math.floor(log10m) + 1;
  if (!Number.isFinite(digits) || digits < 1) digits = 1;
  let frac = log10m - Math.floor(log10m);
  if (frac < 0) frac = 0;
  let lead = Math.floor(10 ** (frac + headLen - 1) + 1e-8);
  const powHead = 10 ** headLen;
  if (lead >= powHead) {
    lead = 10 ** (headLen - 1);
    digits += 1;
  }
  if (lead < 10 ** (headLen - 1)) {
    // Guard float undershoot (e.g. 9999 instead of 10000).
    lead = 10 ** (headLen - 1);
  }
  const head = String(lead);

  const mantFrac = head.slice(1).replace(/0+$/, "");
  const mant = mantFrac ? `${head[0]}.${mantFrac}` : head[0];
  const exp = Math.max(0, digits - 1);
  const scientific = `${neg ? "-" : ""}${mant}×10^${exp}`;
  const preview = `${neg ? "-" : ""}${head}…${tail}`;

  return { neg, head, tail, digits, bits, scientific, preview };
}

/** Gallery label for book-scale axes: `12345…67890`. */
export function formatHugeCoordPreview(value, opts) {
  const peek = peekHugeCoordDigits(value, opts);
  if (!peek) return formatCoordMagnitudeLabel(value);
  return peek.preview;
}

/**
 * Tooltip-style label: `12345…67890 · 1.2345×10^1901234 · ≈6.4 Mbit`.
 */
export function formatHugeCoordDetail(value, opts) {
  const peek = peekHugeCoordDigits(value, opts);
  if (!peek) return formatCoordMagnitudeLabel(value);
  const mag = formatBitMagnitude(peek.bits, { neg: peek.neg });
  return `${peek.preview} · ${peek.scientific} · ${mag}`;
}
