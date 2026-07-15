// Stamp / read lib-of-babel book-image PNG provenance (tEXt `lob:babel`).

const PNG_SIG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const TEXT_KEY = "lob:babel";

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

/**
 * @param {{
 *   u: bigint|number|string,
 *   name?: string|null,
 *   a: number,
 *   z: bigint|number|string,
 *   n: bigint|number|string,
 *   b: number,
 * }} meta
 */
export function encodeBabelPayload(meta) {
  const u = BigInt(meta.u).toString();
  const z = BigInt(meta.z).toString();
  const n = BigInt(meta.n).toString();
  const name =
    typeof meta.name === "string" ? meta.name : meta.name == null ? "" : String(meta.name);
  // `name` is URI-encoded so `|` / `=` in universe names cannot break the field list.
  return `v1|u=${u}|a=${Number(meta.a) >>> 0}|z=${z}|n=${n}|b=${Number(meta.b) >>> 0}|name=${encodeURIComponent(name)}`;
}

/**
 * @returns {{
 *   u: bigint,
 *   name: string|null,
 *   a: number,
 *   z: bigint,
 *   n: bigint,
 *   b: number,
 * } | null}
 * `name` is `null` on legacy stamps that predate the field; `""` = default universe.
 */
export function parseBabelPayload(text) {
  if (typeof text !== "string" || !text.startsWith("v1|")) return null;
  const parts = Object.create(null);
  for (const piece of text.split("|").slice(1)) {
    const eq = piece.indexOf("=");
    if (eq < 0) return null;
    parts[piece.slice(0, eq)] = piece.slice(eq + 1);
  }
  if (!parts.u || !parts.a || !parts.z || !parts.n || !parts.b) return null;
  try {
    let name = null;
    if (Object.prototype.hasOwnProperty.call(parts, "name")) {
      try {
        name = decodeURIComponent(parts.name);
      } catch {
        name = parts.name;
      }
    }
    return {
      u: BigInt(parts.u),
      name,
      a: Number(parts.a) >>> 0,
      z: BigInt(parts.z),
      n: BigInt(parts.n),
      b: Number(parts.b) >>> 0,
    };
  } catch {
    return null;
  }
}

/**
 * Parse provenance from a standard export name:
 * `babel-u{seedHex}-z{z}-n{n}-b{book}-a{alphabet}-colors.png`
 * @returns {{ u: bigint, a: number, z: bigint, n: bigint, b: number } | null}
 */
export function parseBabelFilename(name) {
  if (!name || typeof name !== "string") return null;
  const m = name.match(
    /^babel-u([0-9a-fA-F]+)-z(-?\d+)-n(-?\d+)-b(\d+)-a(\d+)-colors\.png$/i,
  );
  if (!m) return null;
  try {
    return {
      u: BigInt(`0x${m[1]}`),
      z: BigInt(m[2]),
      n: BigInt(m[3]),
      b: Number(m[4]) >>> 0,
      a: Number(m[5]) >>> 0,
    };
  } catch {
    return null;
  }
}

/** @param {{ u: bigint|number|string, a: number, z: bigint|number|string, n: bigint|number|string, b: number }} meta */
export function babelExportFilename(meta) {
  const seedHex = BigInt(meta.u).toString(16);
  return `babel-u${seedHex}-z${meta.z}-n${meta.n}-b${meta.b}-a${meta.a}-colors.png`;
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
  const body = new Uint8Array(4 + data.length);
  body.set(type, 0);
  body.set(data, 4);
  const crc = crc32(body);
  const out = new Uint8Array(4 + 4 + data.length + 4);
  out.set(u32be(data.length), 0);
  out.set(body, 4);
  out.set(u32be(crc), 8 + data.length);
  return out;
}

function isPng(bytes) {
  if (bytes.length < 8) return false;
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIG[i]) return false;
  }
  return true;
}

/**
 * Insert / replace `tEXt lob:babel` before IEND.
 * @param {Blob|ArrayBuffer|Uint8Array} png
 * @param {{
 *   u: bigint|number|string,
 *   name?: string|null,
 *   a: number,
 *   z: bigint|number|string,
 *   n: bigint|number|string,
 *   b: number,
 * }} meta
 * @returns {Promise<Blob>}
 */
export async function injectBabelChunk(png, meta) {
  const bytes =
    png instanceof Uint8Array
      ? png
      : new Uint8Array(png instanceof ArrayBuffer ? png : await png.arrayBuffer());
  if (!isPng(bytes)) throw new Error("not a PNG");
  const payload = encodeBabelPayload(meta);
  const chunk = buildTextChunk(TEXT_KEY, payload);

  let iend = -1;
  let off = 8;
  const kept = [];
  while (off + 12 <= bytes.length) {
    const len = readU32be(bytes, off);
    const type = String.fromCharCode(
      bytes[off + 4],
      bytes[off + 5],
      bytes[off + 6],
      bytes[off + 7],
    );
    const next = off + 12 + len;
    if (next > bytes.length) break;
    if (type === "IEND") {
      iend = off;
      break;
    }
    if (type === "tEXt") {
      const data = bytes.subarray(off + 8, off + 8 + len);
      const nul = data.indexOf(0);
      const key = nul >= 0 ? new TextDecoder().decode(data.subarray(0, nul)) : "";
      if (key === TEXT_KEY) {
        off = next;
        continue; // drop old lob:babel
      }
    }
    kept.push(bytes.subarray(off, next));
    off = next;
  }
  if (iend < 0) throw new Error("PNG missing IEND");

  const before = bytes.subarray(0, 8);
  let total = before.length + chunk.length + (bytes.length - iend);
  for (const part of kept) total += part.length;
  const out = new Uint8Array(total);
  let w = 0;
  out.set(before, w);
  w += before.length;
  for (const part of kept) {
    out.set(part, w);
    w += part.length;
  }
  out.set(chunk, w);
  w += chunk.length;
  out.set(bytes.subarray(iend), w);
  return new Blob([out], { type: "image/png" });
}

/**
 * @param {ArrayBuffer|Uint8Array} buf
 * @returns {{
 *   u: bigint,
 *   name: string|null,
 *   a: number,
 *   z: bigint,
 *   n: bigint,
 *   b: number,
 * } | null}
 */
export function readBabelMeta(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (!isPng(bytes)) return null;
  let off = 8;
  while (off + 12 <= bytes.length) {
    const len = readU32be(bytes, off);
    const type = String.fromCharCode(
      bytes[off + 4],
      bytes[off + 5],
      bytes[off + 6],
      bytes[off + 7],
    );
    const next = off + 12 + len;
    if (next > bytes.length) break;
    if (type === "tEXt") {
      const data = bytes.subarray(off + 8, off + 8 + len);
      const nul = data.indexOf(0);
      if (nul >= 0) {
        const key = new TextDecoder().decode(data.subarray(0, nul));
        if (key === TEXT_KEY) {
          const text = new TextDecoder().decode(data.subarray(nul + 1));
          return parseBabelPayload(text);
        }
      }
    }
    if (type === "IEND") break;
    off = next;
  }
  return null;
}
