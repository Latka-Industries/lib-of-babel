// Search-by-content and search-by-title — WASM reverse lookup → coordinates + go there.
// Search is scoped to the universe in the header — we never switch universes on "go there".

import { S, applyUniverseFromInput } from "./state.js";
import { alphabetDescription, TITLE_LEN } from "./constants.js";
import {
  el,
  copyText,
  escapeHtml,
  normalizeSearchQuery,
  validateSearchQuery,
  formatUniverseLabel,
  findActionRow,
  wireFindActions,
} from "./util.js";
import { locate_page_json, locate_title_json, node_hash_hex } from "./wasm.js";
import { jumpTo } from "./nav.js";
import { openBook } from "./book.js";
import { permalink } from "./url.js";

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

/** Normalized title embed for the current gallery, if any. */
export function titleEmbedFlat() {
  const hit = S.titleEmbed;
  if (!hit || hit.z !== S.z.toString() || hit.n !== S.n.toString()) return "";
  return hit.flat;
}

/** Update search field limits and copy for content vs title mode. */
export function syncSearchKindUI() {
  const kind = el("searchKind")?.value || "content";
  const isTitle = kind === "title";
  const input = el("searchInput");
  if (input) {
    input.maxLength = isTitle ? TITLE_LEN : 1_000_000;
    input.rows = isTitle ? 2 : 6;
    input.placeholder = isTitle ? "crimson spine" : "forgive me for i have sinned";
  }
  const hint = el("searchHint");
  if (hint) {
    hint.textContent = isTitle
      ? `uses the current alphabet lens · up to ${TITLE_LEN} characters (spine title)`
      : "uses the current alphabet lens · up to ~1.3M characters (one book)";
  }
  const head = el("searchHead");
  if (head) head.textContent = isTitle ? "search by title" : "search by content";
  const meta = el("searchMeta");
  if (meta) {
    meta.textContent = isTitle
      ? "Type a spine title — the library finds the gallery and shelf where it belongs."
      : "Type a phrase — the library finds where it already exists (space-padded to a full page).";
  }
}

export function searchKind() {
  return el("searchKind")?.value === "title" ? "title" : "content";
}

/** Parse WASM `locate_page_json` / `locate_title_json` response. */
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

/** Keep the search backdrop overlay scrolled in sync with the textarea. */
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

/** Remove invalid-character highlights from the search field. */
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

/**
 * Reverse lookup in the current universe. Validates locally first, then calls WASM.
 * @returns {{ ok: boolean, error?: string, invalid?: { i: number, ch: string }[], … }}
 */
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

/**
 * Reverse lookup for a spine title in the current universe.
 * @returns {{ ok: boolean, error?: string, invalid?: { i: number, ch: string }[], … }}
 */
export function locateTitle(text, alphabetId = S.alphabetId) {
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
  const result = parseLocateResult(locate_title_json(query, alphabetId));
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

/** Permalink for a search hit (content hits include `q`; title hits open book page 1). */
export function searchPermalink(result, query, kind = "content") {
  syncSearchUniverse();
  const z = asBigInt(result.z);
  const n = asBigInt(result.n);
  const hash = node_hash_hex(z, n);
  return permalink(
    z,
    n,
    hash,
    result.alphabet,
    result.book,
    kind === "title" ? 1 : result.page,
    S.universeName,
    kind === "content" ? query : null,
  );
}

/** Render hit coordinates or validation error into the search result panel. */
export function renderSearchResult(result, box, kind = "content") {
  if (!result.ok) {
    const invalid = invalidFromResult(result);
    if (invalid.length) renderSearchHighlights(invalid);
    box.innerHTML = `<p class="find-dim search-error">${escapeHtml(result.error)}</p>`;
    box.classList.add("show");
    return;
  }

  clearSearchHighlights();
  const safe = escapeHtml;
  const query = syncSearchInput();
  const charLabel = `${Number(result.char_count).toLocaleString()} chars`;
  const detail =
    kind === "title"
      ? `title <b>${safe(query)}</b> · ${charLabel} · alphabet ${result.alphabet}-symbol`
      : `${
          result.page_span > 1
            ? `pages ${result.page}–${result.page_end}`
            : `page ${result.page}`
        } · ${charLabel} · alphabet ${result.alphabet}-symbol`;

  box.innerHTML =
    `<div class="find-big">gallery (${safe(result.z)}, ${safe(result.n)})</div>` +
    `<div class="find-dim">` +
    `universe <b>${safe(formatUniverseLabel(S.universeName))}</b> · ` +
    `wall ${result.wall} · shelf ${result.shelf} · book ${result.book_on_shelf} · ` +
    detail +
    `</div>` +
    findActionRow([
      { id: "go", label: "go there" },
      { id: "link", label: "copy link" },
    ]);
  box.classList.add("show");

  wireFindActions(box, {
    go: () => goToSearchResult(result, query, kind),
    link: (ev) => copyText(searchPermalink(result, query, kind), ev.currentTarget),
  });
}

/** Navigate to a search hit without switching universe. */
export function goToSearchResult(result, query, kind = "content") {
  syncSearchUniverse();
  if (result.alphabet !== S.alphabetId) {
    S.alphabetId = result.alphabet;
    el("alphabet").value = String(result.alphabet);
  }
  if (kind === "title") {
    S.titleEmbed = {
      flat: query,
      z: String(result.z),
      n: String(result.n),
      book: result.book,
    };
  } else {
    S.titleEmbed = null;
  }
  jumpTo(String(result.z), String(result.n));
  openBook(
    result.book,
    kind === "title" ? query : null,
    kind === "title" ? 1 : result.page,
    kind === "content" ? query || null : null,
    kind === "content" ? result.page_span || 1 : 1,
  );
  el("searchModal").close();
}
