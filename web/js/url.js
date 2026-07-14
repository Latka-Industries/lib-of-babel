// URL permalinks. The hash isn't reversible to coordinates, so a shareable link
// encodes (z, n) and carries the gallery hash as a proof token.

import { S } from "./state.js";
import { el } from "./util.js";
import { node_hash_hex } from "./wasm.js";

// An open book adds &b=<shelf>&p=<page>. &q=<search phrase> when opened via search.
// &u=<universe> is omitted for the default universe so canonical links stay clean.
export function permalink(
  zv,
  nv,
  hash,
  alpha = S.alphabetId,
  book = null,
  page = null,
  uni = S.universeName,
  searchQuery = null,
) {
  const base = `${location.origin}${location.pathname}`;
  let frag = `#z=${zv}&n=${nv}&h=${hash.slice(0, 16)}`;
  if (book !== null) frag += `&b=${book}`;
  if (page !== null) frag += `&p=${page}`;
  if (searchQuery) frag += `&q=${encodeURIComponent(searchQuery)}`;
  if (uni) frag += `&u=${encodeURIComponent(uni)}`;
  frag += `&a=${alpha}`;
  return `${base}${frag}`;
}

// the link to wherever we are right now (gallery, or gallery + open book/page)
export function currentUrl() {
  const hash = node_hash_hex(S.z, S.n);
  if (S.currentBook && el("bookModal").open) {
    return permalink(
      S.z,
      S.n,
      hash,
      S.alphabetId,
      S.currentBook.index,
      S.currentBook.page + 1,
      S.universeName,
      S.currentBook.searchHighlight,
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
    };
  } catch {
    return null; // malformed coordinates
  }
}
