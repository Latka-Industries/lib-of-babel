// URL permalinks. The hash isn't reversible to coordinates, so a shareable link
// encodes (z, n) and carries the gallery hash as a proof token.

import { S } from "./state.js";
import { el } from "../lib/util.js";
import { node_hash_hex } from "../lib/wasm.js";

/** Soft cap so &q= never dumps a multi-page / full-book flat into the hash. */
const MAX_SHARE_Q_CHARS = 256;

// An open book adds &b=<shelf>&p=<page>. &q=<search phrase> when opened via search
// (short phrases only — mosaic / full-book embeds stay out of the URL).
// &u=<universe> is omitted for the default universe so canonical links stay clean.
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
  { image = false, embedId = null } = {},
) {
  const base = `${location.origin}${location.pathname}`;
  const proof = String(hash ?? "").slice(0, 16);
  let frag = `#z=${zv}&n=${nv}&h=${proof}`;
  if (book !== null) frag += `&b=${book}`;
  if (page !== null) frag += `&p=${page}`;
  const q = shareableSearchQuery(searchQuery);
  if (q) frag += `&q=${encodeURIComponent(q)}`;
  if (uni) frag += `&u=${encodeURIComponent(uni)}`;
  frag += `&a=${alpha}`;
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
  const hash = node_hash_hex(S.z, S.n);
  const imageOpen = el("imageModal")?.open;
  if (imageOpen && S.currentBook) {
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
    return permalink(
      S.z,
      S.n,
      hash,
      S.alphabetId,
      S.currentBook.index,
      S.currentBook.page + 1,
      S.universeName,
      shareableSearchQuery(S.currentBook.searchHighlight),
    );
  }
  return permalink(S.z, S.n, hash);
}

export function syncUrl() {
  const base = currentUrl();
  history.replaceState(null, "", base.slice(base.indexOf("#")));
}

// read #z=..&n=..(&h=..&b=..&p=..&u=..&a=..) from the URL
export function parsePermalink() {
  const p = new URLSearchParams(location.hash.slice(1));
  const zs = p.get("z");
  const ns = p.get("n");
  if (zs === null || ns === null) return null;
  try {
    const bs = p.get("b");
    const ps = p.get("p");
    const as = p.get("a");
    return {
      z: BigInt(zs),
      n: BigInt(ns),
      h: p.get("h") || "",
      a: as === null ? null : Number(as),
      b: bs === null ? null : Number(bs),
      p: ps === null ? null : Number(ps),
      q: p.get("q"), // search phrase (search-by-content permalinks)
      u: p.get("u"), // universe name, or null for the default universe
      img: p.get("img") === "1",
      be: p.get("be"), // babel embed handoff id (IndexedDB; same browser only)
    };
  } catch {
    return null; // malformed coordinates
  }
}
