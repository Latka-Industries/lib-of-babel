// Stamp / read lib-of-babel book-image PNG provenance (tEXt `lob:babel`).
//
// v3 stamps bind address + print: `seal` = SHA-256 prefix of letter flat,
// `h` = room BLAKE3 prefix under the stamped universe. Locate verifies both
// before trusting stamp coords for go / “exact book”.

import { encodeCoordParam, isCompactCoord, isHugeCoordValue } from "./coords.js";

const PNG_SIG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const TEXT_KEY = "lob:babel";
/** Books per gallery — stamp book index must be in range. */
const BOOKS_PER_GALLERY = 700;

/** Hex length of content seal in the stamp (SHA-256 prefix). */
export const BABEL_SEAL_LEN = 12;
/** Hex length of room-hash prefix in the stamp (`node_hash_hex`). */
export const BABEL_HASH_LEN = 16;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function u32be(n) {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
}

function readU32be(bytes, off) {
  return (
    ((bytes[off] << 24) | (bytes[off + 1] << 16) | (bytes[off + 2] << 8) | bytes[off + 3]) >>> 0
  );
}

/** Valid coord field: short decimal or compact `c…` (never empty). */
function isValidCoordField(raw) {
  if (typeof raw !== "string" || !raw) return false;
  if (isCompactCoord(raw)) return raw.length > 2;
  return /^-?\d+$/.test(raw);
}

function isHexLen(raw, len) {
  return typeof raw === "string" && raw.length === len && /^[0-9a-fA-F]+$/.test(raw);
}

/** Short SHA-256 of the decoded letter flat — print identity. */
export async function contentSeal(flat) {
  if (!flat || !globalThis.crypto?.subtle) return null;
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(flat),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, BABEL_SEAL_LEN);
}

/**
 * Compare stamped seal/h to recomputed values from the upload.
 * @returns {{ sealed: boolean, ok: boolean|null, sealOk: boolean|null, hashOk: boolean|null }}
 */
export function verifyBabelProof(meta, { seal = null, roomHash = null } = {}) {
  const hasSeal = isHexLen(meta?.seal, BABEL_SEAL_LEN);
  const hasHash = isHexLen(meta?.h, BABEL_HASH_LEN);
  if (!hasSeal && !hasHash) {
    return { sealed: false, ok: null, sealOk: null, hashOk: null };
  }
  const sealOk = hasSeal ? meta.seal.toLowerCase() === String(seal || "").toLowerCase() : null;
  const hashOk = hasHash
    ? meta.h.toLowerCase() === String(roomHash || "").toLowerCase()
    : null;
  const checks = [sealOk, hashOk].filter((x) => x !== null);
  const ok = checks.length > 0 && checks.every(Boolean);
  return { sealed: true, ok, sealOk, hashOk };
}

/**
 * @param {{
 *   u: bigint|number|string,
 *   name?: string|null,
 *   a: number,
 *   z: bigint|number|string,
 *   n: bigint|number|string,
 *   b: number,
 *   scope?: "page"|"book",
 *   seal?: string|null,
 *   h?: string|null,
 * }} meta
 */
export function encodeBabelPayload(meta) {
  const u = BigInt(meta.u).toString();
  const z = encodeCoordParam(meta.z);
  const n = encodeCoordParam(meta.n);
  const scope = meta.scope === "book" ? "book" : "page";
  const name =
    typeof meta.name === "string" ? meta.name : meta.name == null ? "" : String(meta.name);
  const base = `u=${u}|a=${Number(meta.a) >>> 0}|z=${z}|n=${n}|b=${Number(meta.b) >>> 0}|scope=${scope}|name=${encodeURIComponent(name)}`;
  if (isHexLen(meta.seal, BABEL_SEAL_LEN) && isHexLen(meta.h, BABEL_HASH_LEN)) {
    return `v3|${base}|seal=${meta.seal.toLowerCase()}|h=${meta.h.toLowerCase()}`;
  }
  return `v2|${base}`;
}

/**
 * @returns {{
 *   u: bigint,
 *   name: string|null,
 *   a: number,
 *   z: string,
 *   n: string,
 *   b: number,
 *   scope: "page"|"book",
 *   seal: string|null,
 *   h: string|null,
 *   version: 1|2|3,
 *   huge: boolean,
 * } | null}
 * `z`/`n` stay as stamped strings (compact or decimal) — never expand huge axes.
 * Legacy `v1` (no scope) → `scope=page`. v3 requires seal + h.
 */
export function parseBabelPayload(text) {
  if (typeof text !== "string") return null;
  const isV3 = text.startsWith("v3|");
  const isV2 = text.startsWith("v2|");
  const isV1 = text.startsWith("v1|");
  if (!isV1 && !isV2 && !isV3) return null;
  const version = isV3 ? 3 : isV2 ? 2 : 1;
  const parts = Object.create(null);
  for (const piece of text.split("|").slice(1)) {
    const eq = piece.indexOf("=");
    if (eq < 0) return null;
    const key = piece.slice(0, eq);
    if (!key) return null;
    // `name=` may be empty; other fields must have a value after `=`.
    if (key !== "name" && eq + 1 >= piece.length) return null;
    parts[key] = piece.slice(eq + 1);
  }
  if (!parts.u || !parts.a || !parts.z || !parts.n || parts.b == null) return null;
  if (!/^\d+$/.test(parts.u)) return null;
  if (!/^\d+$/.test(parts.a)) return null;
  if (!/^\d+$/.test(parts.b)) return null;
  if (!isValidCoordField(parts.z) || !isValidCoordField(parts.n)) return null;
  // v2/v3 must declare scope; v1 has no scope field.
  if ((isV2 || isV3) && parts.scope !== "page" && parts.scope !== "book") return null;
  let seal = null;
  let h = null;
  if (parts.seal != null) {
    if (!isHexLen(parts.seal, BABEL_SEAL_LEN)) return null;
    seal = parts.seal.toLowerCase();
  }
  if (parts.h != null) {
    if (!isHexLen(parts.h, BABEL_HASH_LEN)) return null;
    h = parts.h.toLowerCase();
  }
  if (isV3 && (!seal || !h)) return null;
  try {
    const a = Number(parts.a) >>> 0;
    const b = Number(parts.b) >>> 0;
    if (a === 0 || a > 4096) return null;
    if (b >= BOOKS_PER_GALLERY) return null;
    let name = null;
    if (Object.prototype.hasOwnProperty.call(parts, "name")) {
      try {
        name = decodeURIComponent(parts.name);
      } catch {
        name = parts.name;
      }
    }
    const scope = parts.scope === "book" ? "book" : "page";
    return {
      u: BigInt(parts.u),
      name,
      a,
      z: parts.z,
      n: parts.n,
      b,
      scope,
      seal,
      h,
      version,
      huge: isHugeCoordValue(parts.z) || isHugeCoordValue(parts.n),
    };
  } catch {
    return null;
  }
}

/**
 * Read PNG IHDR width/height, or null if not a PNG.
 * @returns {{ w: number, h: number } | null}
 */
export function readPngDims(png) {
  const buf =
    png instanceof Uint8Array
      ? png
      : png instanceof ArrayBuffer
        ? new Uint8Array(png)
        : null;
  if (!buf || buf.length < 24) return null;
  for (let i = 0; i < 8; i++) {
    if (buf[i] !== PNG_SIG[i]) return null;
  }
  // First chunk should be IHDR (len=13).
  const len = readU32be(buf, 8);
  const type = String.fromCharCode(buf[12], buf[13], buf[14], buf[15]);
  if (type !== "IHDR" || len < 8) return null;
  return { w: readU32be(buf, 16), h: readU32be(buf, 20) };
}

/**
 * Parse provenance from a standard export name.
 * @returns {{ u: bigint, a: number, z: string, n: string, b: number, scope: "page"|"book" } | null}
 */
export function parseBabelFilename(name) {
  if (!name || typeof name !== "string") return null;
  // Optional leading `-` on z/n (page-map negatives). Huge axes use `c…` (no dashes).
  const m = name.match(
    /^babel-u([0-9a-fA-F]+)-z(-?[^-]+)-n(-?[^-]+)-b(\d+)-a(\d+)(?:-s(page|book))?-colors\.png$/i,
  );
  if (!m) return null;
  if (!isValidCoordField(m[2]) || !isValidCoordField(m[3])) return null;
  try {
    const a = Number(m[5]) >>> 0;
    const b = Number(m[4]) >>> 0;
    if (a === 0 || a > 4096 || b >= BOOKS_PER_GALLERY) return null;
    return {
      u: BigInt(`0x${m[1]}`),
      z: m[2],
      n: m[3],
      b,
      a,
      scope: m[6] === "book" ? "book" : "page",
    };
  } catch {
    return null;
  }
}

/** @param {{ u: bigint|number|string, a: number, z: bigint|number|string, n: bigint|number|string, b: number, scope?: "page"|"book" }} meta */
export function babelExportFilename(meta) {
  const seedHex = BigInt(meta.u).toString(16);
  const z = encodeCoordParam(meta.z);
  const n = encodeCoordParam(meta.n);
  const scope = meta.scope === "book" ? "book" : "page";
  // Compact / long coords blow past OS filename limits — stamp holds the real axes.
  const zPart = filenameCoordPart(z);
  const nPart = filenameCoordPart(n);
  return `babel-u${seedHex}-z${zPart}-n${nPart}-b${meta.b}-a${meta.a}-s${scope}-colors.png`;
}

/** Shorten anything that isn't a short decimal for the download name. */
function filenameCoordPart(raw) {
  const s = String(raw);
  if (isCompactCoord(s) || isHugeCoordValue(s) || s.length > 24) return "c…";
  return s;
}

function buildTextChunk(keyword, text) {
  const enc = new TextEncoder();
  const key = enc.encode(keyword);
  const val = enc.encode(text);
  const data = new Uint8Array(key.length + 1 + val.length);
  data.set(key, 0);
  data[key.length] = 0;
  data.set(val, key.length + 1);
  const type = enc.encode("tEXt");
  const len = u32be(data.length);
  const crcBuf = new Uint8Array(type.length + data.length);
  crcBuf.set(type, 0);
  crcBuf.set(data, type.length);
  const crc = u32be(crc32(crcBuf));
  const out = new Uint8Array(4 + 4 + data.length + 4);
  out.set(len, 0);
  out.set(type, 4);
  out.set(data, 8);
  out.set(crc, 8 + data.length);
  return out;
}

/**
 * Insert / replace `tEXt lob:babel` before IEND.
 * @param {Blob|ArrayBuffer|Uint8Array} png
 * @param {Parameters<typeof encodeBabelPayload>[0]} meta
 */
export async function injectBabelChunk(png, meta) {
  const buf =
    png instanceof Uint8Array
      ? png
      : png instanceof ArrayBuffer
        ? new Uint8Array(png)
        : new Uint8Array(await png.arrayBuffer());
  if (buf.length < 8) throw new Error("not a PNG");
  for (let i = 0; i < 8; i++) {
    if (buf[i] !== PNG_SIG[i]) throw new Error("not a PNG");
  }
  const payload = encodeBabelPayload(meta);
  const chunk = buildTextChunk(TEXT_KEY, payload);
  const parts = [buf.slice(0, 8)];
  let off = 8;
  while (off + 8 <= buf.length) {
    const len = readU32be(buf, off);
    const type = String.fromCharCode(buf[off + 4], buf[off + 5], buf[off + 6], buf[off + 7]);
    const next = off + 12 + len;
    if (next > buf.length) break;
    if (type === "IEND") {
      parts.push(chunk);
      parts.push(buf.slice(off));
      break;
    }
    if (type === "tEXt") {
      const data = buf.slice(off + 8, off + 8 + len);
      const nul = data.indexOf(0);
      if (nul > 0) {
        const key = new TextDecoder().decode(data.slice(0, nul));
        if (key === TEXT_KEY) {
          off = next;
          continue; // drop old lob:babel
        }
      }
    }
    parts.push(buf.slice(off, next));
    off = next;
  }
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let w = 0;
  for (const p of parts) {
    out.set(p, w);
    w += p.length;
  }
  return new Blob([out], { type: "image/png" });
}

/**
 * @param {Blob|ArrayBuffer|Uint8Array} png
 * @returns {Promise<ReturnType<typeof parseBabelPayload>>}
 */
export async function readBabelMeta(png) {
  const buf =
    png instanceof Uint8Array
      ? png
      : png instanceof ArrayBuffer
        ? new Uint8Array(png)
        : new Uint8Array(await png.arrayBuffer());
  if (buf.length < 8) return null;
  for (let i = 0; i < 8; i++) {
    if (buf[i] !== PNG_SIG[i]) return null;
  }
  let off = 8;
  while (off + 8 <= buf.length) {
    const len = readU32be(buf, off);
    const type = String.fromCharCode(buf[off + 4], buf[off + 5], buf[off + 6], buf[off + 7]);
    const next = off + 12 + len;
    if (next > buf.length) break;
    if (type === "tEXt") {
      const data = buf.slice(off + 8, off + 8 + len);
      const nul = data.indexOf(0);
      if (nul > 0) {
        const key = new TextDecoder().decode(data.slice(0, nul));
        if (key === TEXT_KEY) {
          const text = new TextDecoder().decode(data.slice(nul + 1));
          return parseBabelPayload(text);
        }
      }
    }
    if (type === "IEND") break;
    off = next;
  }
  return null;
}
