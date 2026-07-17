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
    const b64Len = s.length - 1;
    // Unpadded base64url → floor(n×3/4) decoded bytes (includes 1 sign byte).
    const decoded = Math.floor((b64Len * 3) / 4);
    const magBytes = Math.max(0, decoded - 1);
    return { bits: magBytes * 8, neg: false };
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
