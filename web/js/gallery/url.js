// URL permalinks. The hash isn't reversible to coordinates, so a shareable link
// encodes (z, n) and carries the gallery hash as a proof token.
//
// Basile rooms use unbounded BigInt coords — decimal forms are thousands of
// digits and break copy/open. Long axes are packed as base64url (`z=c…`);
// search shares prefer short `#q=&find=` links and re-locate on boot.

import { S } from "./state.js";
import { el } from "../lib/util.js";
import { node_hash_hex, generator_version } from "../lib/wasm.js";

/** Soft cap so &q= never dumps a multi-page / full-book flat into the hash. */
const MAX_SHARE_Q_CHARS = 256;

/** Decimal digit length above which coords use compact `c…` encoding. */
const COMPACT_COORD_DIGITS = 24;

/**
 * Pack a BigInt as `c` + base64url(sign byte + big-endian magnitude).
 * Sign byte: 0 = non-negative, 1 = negative.
 */
export function encodeCoordParam(value) {
  const bi = typeof value === "bigint" ? value : BigInt(value);
  const dec = bi.toString();
  if (dec.length <= COMPACT_COORD_DIGITS) return dec;

  const neg = bi < 0n;
  let mag = neg ? -bi : bi;
  const bytes = [];
  bytes.push(neg ? 1 : 0);
  if (mag === 0n) {
    bytes.push(0);
  } else {
    const hex = mag.toString(16);
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

/** @returns {bigint} */
export function decodeCoordParam(raw) {
  const s = String(raw);
  if (!s.startsWith("c") || s.length < 2) return BigInt(s);
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
 * Short search share: `#q=…&find=content|title&a=&gv=` (no huge z/n).
 * Boot re-locates via WASM.
 */
export function findPermalink(
  query,
  kind = "content",
  alpha = S.alphabetId,
  uni = S.universeName,
  { gv = S.gv ?? generator_version() } = {},
) {
  const q = shareableSearchQuery(query);
  if (!q) return null;
  const base = `${location.origin}${location.pathname}`;
  const find = kind === "title" ? "title" : "content";
  let frag = `#q=${encodeURIComponent(q)}&find=${find}&a=${alpha}&gv=${gv}`;
  if (uni) frag += `&u=${encodeURIComponent(uni)}`;
  return `${base}${frag}`;
}

// An open book adds &b=<shelf>&p=<page>. &q=<search phrase> when opened via search
// (short phrases only — mosaic / full-book embeds stay out of the URL).
// &u=<universe> is omitted for the default universe so canonical links stay clean.
// &gv=<GENERATOR_VERSION> stamps the content contract (THI-142).
// Mosaic / book-image: &img=1 with book id — no glyph payload.
export function permalink(
  zv,
  nv,
  hash,
  alpha = S.alphabetId,
  book = null,
  page = null,
  uni = S.universeName,
  searchQuery = null,
  { image = false, embedId = null, gv = S.gv ?? generator_version() } = {},
) {
  const base = `${location.origin}${location.pathname}`;
  const proof = String(hash ?? "").slice(0, 16);
  let frag = `#z=${encodeCoordParam(zv)}&n=${encodeCoordParam(nv)}&h=${proof}`;
  if (book !== null) frag += `&b=${book}`;
  if (page !== null) frag += `&p=${page}`;
  const q = shareableSearchQuery(searchQuery);
  if (q) frag += `&q=${encodeURIComponent(q)}`;
  if (uni) frag += `&u=${encodeURIComponent(uni)}`;
  frag += `&a=${alpha}`;
  frag += `&gv=${gv}`;
  if (image) frag += `&img=1`;
  // Short-lived same-browser handoff for full-book Babelgram embed (not shareable).
  if (embedId) frag += `&be=${encodeURIComponent(embedId)}`;
  return `${base}${frag}`;
}

/** @returns {string|null} */
export function shareableSearchQuery(query) {
  if (query == null || query === "") return null;
  const s = String(query);
  if (s.length > MAX_SHARE_Q_CHARS) return null;
  return s;
}

// the link to wherever we are right now (gallery, or gallery + open book/page)
export function currentUrl() {
  const imageOpen = el("imageModal")?.open;
  if (imageOpen && S.currentBook) {
    const hash = node_hash_hex(String(S.z), String(S.n));
    return permalink(
      S.z,
      S.n,
      hash,
      S.alphabetId,
      S.currentBook.index,
      1,
      S.universeName,
      null,
      { image: true },
    );
  }
  if (S.currentBook && el("bookModal").open) {
    const q = shareableSearchQuery(S.currentBook.searchHighlight);
    // Search hits: short find-link (Basile coords are too large for the hash).
    if (q) {
      return findPermalink(q, "content", S.alphabetId, S.universeName);
    }
    const hash = node_hash_hex(String(S.z), String(S.n));
    return permalink(
      S.z,
      S.n,
      hash,
      S.alphabetId,
      S.currentBook.index,
      S.currentBook.page + 1,
      S.universeName,
      null,
    );
  }
  const hash = node_hash_hex(String(S.z), String(S.n));
  return permalink(S.z, S.n, hash);
}

export function syncUrl() {
  const base = currentUrl();
  history.replaceState(null, "", base.slice(base.indexOf("#")));
}

/**
 * Read `#z=&n=` room links or `#q=&find=` search shares.
 * @returns {null | {
 *   z: bigint|null, n: bigint|null, h: string, a: number|null,
 *   b: number|null, p: number|null, q: string|null, u: string|null,
 *   gv: number|null, img: boolean, be: string|null,
 *   find: 'content'|'title'|null
 * }}
 */
export function parsePermalink() {
  const p = new URLSearchParams(location.hash.slice(1));
  const zs = p.get("z");
  const ns = p.get("n");
  const q = p.get("q");
  const findRaw = (p.get("find") || "").toLowerCase();
  const find =
    findRaw === "title" || findRaw === "content"
      ? findRaw
      : q && (zs === null || ns === null)
        ? "content"
        : null;

  if ((zs === null || ns === null) && !q) return null;

  try {
    const bs = p.get("b");
    const ps = p.get("p");
    const as = p.get("a");
    const gvs = p.get("gv");
    return {
      z: zs != null ? decodeCoordParam(zs) : null,
      n: ns != null ? decodeCoordParam(ns) : null,
      h: p.get("h") || "",
      a: as === null ? null : Number(as),
      b: bs === null ? null : Number(bs),
      p: ps === null ? null : Number(ps),
      q,
      u: p.get("u"),
      gv: gvs === null ? null : Number(gvs),
      img: p.get("img") === "1",
      be: p.get("be"),
      find,
    };
  } catch {
    return null; // malformed coordinates
  }
}
