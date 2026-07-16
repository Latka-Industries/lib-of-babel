// URL permalinks. The hash isn't reversible to coordinates, so a shareable link
// encodes (z, n) and carries the gallery hash as a proof token.
//
// Basile rooms use unbounded BigInt coords — decimal forms are thousands of
// digits and break copy/open. Long axes are packed as base64url (`z=c…`);
// search shares prefer short `#q=&find=` links and re-locate on boot.
//
// Param order matters: short book-open flags (`bo` / `b` / `img`) come *before*
// huge `z`/`n` so clipboard / address-bar truncation still keeps “open this book”.

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

/**
 * Room / book permalink.
 *
 * Short flags first (`bo`, `img`, `b`, …), then compact `z`/`n`. Basile mosaic
 * coords are multi-KB; paste truncation used to keep z/n and drop `&b=&img=1`.
 */
export function permalink(
  zv,
  nv,
  hash,
  alpha = S.alphabetId,
  book = null,
  page = null,
  uni = S.universeName,
  searchQuery = null,
  {
    image = false,
    embedId = null,
    bookOpenId = null,
    gv = S.gv ?? generator_version(),
  } = {},
) {
  const base = `${location.origin}${location.pathname}`;
  const proof = String(hash ?? "").slice(0, 16);
  const bookIdx =
    book === null || book === undefined || book === ""
      ? null
      : Number(book);

  let frag = `#`;
  // Same-browser book-open handoff (IndexedDB) — keep early for truncation.
  if (bookOpenId) frag += `bo=${encodeURIComponent(bookOpenId)}&`;
  if (image) frag += `img=1&`;
  if (bookIdx !== null && Number.isFinite(bookIdx)) frag += `b=${bookIdx}&`;
  if (page !== null && page !== undefined) frag += `p=${page}&`;
  if (uni) frag += `u=${encodeURIComponent(uni)}&`;
  frag += `a=${alpha}&gv=${gv}&`;
  // Short-lived Babelgram print handoff (not shareable).
  if (embedId) frag += `be=${encodeURIComponent(embedId)}&`;
  const q = shareableSearchQuery(searchQuery);
  if (q) frag += `q=${encodeURIComponent(q)}&`;
  frag += `z=${encodeCoordParam(zv)}&n=${encodeCoordParam(nv)}&h=${proof}`;
  return `${base}${frag}`;
}

/**
 * Short same-browser share for mosaic / Babelgram hits.
 * Huge Basile `z`/`n` live in IndexedDB under `bo` — keeps clipboard tiny.
 */
export function bookOpenShareUrl(
  bookOpenId,
  {
    book = null,
    image = true,
    alpha = S.alphabetId,
    gv = S.gv ?? generator_version(),
  } = {},
) {
  const base = `${location.origin}${location.pathname}`;
  let frag = `#bo=${encodeURIComponent(bookOpenId)}`;
  if (image) frag += `&img=1`;
  const bookIdx = book === null || book === undefined ? null : Number(book);
  if (bookIdx !== null && Number.isFinite(bookIdx)) frag += `&b=${bookIdx}`;
  frag += `&a=${alpha}&gv=${gv}`;
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
 *   gv: number|null, img: boolean, be: string|null, bo: string|null,
 *   find: 'content'|'title'|null
 * }}
 */
export function parsePermalink() {
  const p = new URLSearchParams(location.hash.slice(1));
  const zs = p.get("z");
  const ns = p.get("n");
  const q = p.get("q");
  const bo = p.get("bo");
  const findRaw = (p.get("find") || "").toLowerCase();
  const find =
    findRaw === "title" || findRaw === "content"
      ? findRaw
      : q && (zs === null || ns === null)
        ? "content"
        : null;

  if ((zs === null || ns === null) && !q && !bo) return null;

  try {
    const bs = p.get("b");
    const ps = p.get("p");
    const as = p.get("a");
    const gvs = p.get("gv");
    const bNum = bs === null ? null : Number(bs);
    return {
      z: zs != null ? decodeCoordParam(zs) : null,
      n: ns != null ? decodeCoordParam(ns) : null,
      h: p.get("h") || "",
      a: as === null ? null : Number(as),
      b: bNum !== null && Number.isFinite(bNum) ? bNum : null,
      p: ps === null ? null : Number(ps),
      q,
      u: p.get("u"),
      gv: gvs === null ? null : Number(gvs),
      img: p.get("img") === "1",
      be: p.get("be"),
      bo,
      find,
    };
  } catch {
    return null; // malformed coordinates
  }
}
