// Search-by-content: paste a phrase → WASM reverse lookup → coordinates + go there.
// Search is scoped to the universe in the header — we never switch universes on "go there".

import { S, applyUniverseFromInput } from "./state.js";
import { alphabetDescription } from "./constants.js";
import {
  el,
  copyText,
  normalizeSearchQuery,
  validateSearchQuery,
} from "./util.js";
import { locate_page_json, node_hash_hex } from "./wasm.js";
import { jumpTo } from "./nav.js";
import { openBook } from "./book.js";
import { permalink } from "./url.js";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function invalidFromResult(result) {
  return (result.invalid || []).map((x) => ({ i: x.i, ch: x.c ?? x.ch }));
}

function formatInvalidMessage(invalid, alphabetId = S.alphabetId) {
  const seen = new Set();
  const unique = [];
  for (const { ch } of invalid) {
    if (!seen.has(ch)) {
      seen.add(ch);
      unique.push(ch);
    }
  }
  const shown = unique.slice(0, 8).map((ch) => `"${ch}"`).join(", ");
  const suffix =
    unique.length > 8 ? ` (+${unique.length - 8} more kinds)` : "";
  const allowed = alphabetDescription(alphabetId);
  return `invalid character${invalid.length > 1 ? "s" : ""} for this alphabet (${allowed} only): ${shown}${suffix}`;
}

export function parseLocateResult(jsonStr) {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return { ok: false, error: "invalid response from generator" };
  }
}

function syncSearchUniverse() {
  applyUniverseFromInput(el("universe")?.value);
}

export function syncSearchBackdropScroll() {
  const input = el("searchInput");
  const backdrop = el("searchBackdrop");
  if (input && backdrop) {
    backdrop.scrollTop = input.scrollTop;
    backdrop.scrollLeft = input.scrollLeft;
  }
}

/** Highlight invalid characters in the search field overlay. */
export function renderSearchHighlights(invalid) {
  const input = el("searchInput");
  const backdrop = el("searchBackdrop");
  const editor = el("searchEditor");
  if (!input || !backdrop) return;

  const invalidSet = new Set(invalid.map((x) => x.i));
  let html = "";
  for (let i = 0; i < input.value.length; i++) {
    const ch = escapeHtml(input.value[i]);
    if (invalidSet.has(i)) html += `<mark class="search-invalid">${ch}</mark>`;
    else html += ch;
  }
  backdrop.innerHTML = html;
  editor?.classList.toggle("search-invalid-field", invalid.length > 0);
  syncSearchBackdropScroll();
}

export function clearSearchHighlights() {
  renderSearchHighlights([]);
}

/** Lowercase the search field in place; returns the normalized query. */
export function syncSearchInput() {
  const input = el("searchInput");
  const normalized = normalizeSearchQuery(input.value);
  if (input.value !== normalized) input.value = normalized;
  return normalized;
}

export function locateText(text, alphabetId = S.alphabetId) {
  syncSearchUniverse();
  const query = normalizeSearchQuery(text);
  const invalid = validateSearchQuery(query, alphabetId);
  if (invalid.length) {
    renderSearchHighlights(invalid);
    return {
      ok: false,
      error: formatInvalidMessage(invalid, alphabetId),
      invalid,
    };
  }
  clearSearchHighlights();
  const result = parseLocateResult(locate_page_json(query, alphabetId));
  if (!result.ok) {
    const wasmInvalid = invalidFromResult(result);
    if (wasmInvalid.length) {
      renderSearchHighlights(wasmInvalid);
      result.error = formatInvalidMessage(wasmInvalid, alphabetId);
    }
  }
  return result;
}

function asBigInt(v) {
  return typeof v === "bigint" ? v : BigInt(v);
}

function currentUniverseLabel() {
  return S.universeName || "default";
}

export function searchPermalink(result, query) {
  syncSearchUniverse();
  const z = asBigInt(result.z);
  const n = asBigInt(result.n);
  const hash = node_hash_hex(z, n, result.alphabet);
  return permalink(
    z,
    n,
    hash,
    result.alphabet,
    result.book,
    result.page,
    S.universeName,
    query,
  );
}

export function renderSearchResult(result, box) {
  if (!result.ok) {
    const invalid = invalidFromResult(result);
    if (invalid.length) renderSearchHighlights(invalid);
    box.innerHTML = `<p class="find-dim search-error">${escapeHtml(result.error)}</p>`;
    box.classList.add("show");
    return;
  }

  clearSearchHighlights();
  const safe = (s) => String(s).replace(/[<>&]/g, "");
  const pageLabel =
    result.page_span > 1
      ? `pages ${result.page}–${result.page_end}`
      : `page ${result.page}`;
  const charLabel = `${Number(result.char_count).toLocaleString()} chars`;

  box.innerHTML =
    `<div class="find-big">gallery (${safe(result.z)}, ${safe(result.n)})</div>` +
    `<div class="find-dim">` +
    `universe <b>${safe(currentUniverseLabel())}</b> · ` +
    `wall ${result.wall} · shelf ${result.shelf} · book ${result.book_on_shelf} · ` +
    `${pageLabel} · ${charLabel} · alphabet ${result.alphabet}-symbol` +
    `</div>` +
    `<div class="find-row" style="margin-top:.5rem">` +
    `<button type="button" id="searchGo">go there</button>` +
    `<button type="button" id="searchLink">copy link</button>` +
    `</div>`;
  box.classList.add("show");

  const query = syncSearchInput();
  el("searchGo").onclick = () => goToSearchResult(result, query);
  el("searchLink").onclick = (ev) =>
    copyText(searchPermalink(result, query), ev.currentTarget, "copied!");
}

export function goToSearchResult(result, query) {
  syncSearchUniverse();
  if (result.alphabet !== S.alphabetId) {
    S.alphabetId = result.alphabet;
    el("alphabet").value = String(result.alphabet);
  }
  jumpTo(String(result.z), String(result.n));
  openBook(
    result.book,
    null,
    result.page,
    query || null,
    result.page_span || 1,
  );
  el("searchModal").close();
}
