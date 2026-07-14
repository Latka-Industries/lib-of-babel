// Search-by-content and search-by-title — WASM reverse lookup → coordinates + go there.
// Search is scoped to the universe in the header — we never switch universes on "go there".

import { S, applyUniverseFromInput, syncLensControls } from "./state.js";
import { TITLE_LEN, formatAlphabetSymbolLabel } from "./constants.js";
import { t, getLocale } from "./i18n.js";
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
  let shown = unique.slice(0, 8).map((ch) => `"${ch}"`).join(", ");
  if (unique.length > 8) {
    shown += t("search.error.moreKinds", { n: unique.length - 8 });
  }
  const key =
    invalid.length > 1 ? "search.error.invalidPlural" : "search.error.invalid";
  return t(key, {
    alphabet: formatAlphabetSymbolLabel(alphabetId, t),
    shown,
  });
}

/** Map English WASM / client locate errors into the active UI locale. */
function localizeLocateError(error) {
  if (!error) return t("search.error.unknown");
  if (error === "search text is empty") return t("search.error.empty");
  if (error === "invalid characters for this alphabet") {
    return t("search.error.invalidGeneric");
  }
  if (error === "invalid response from generator") {
    return t("search.error.badResponse");
  }
  let m = /^text too long \(max (\d+) characters — one book\)$/.exec(error);
  if (m) return t("search.error.tooLong", { n: m[1] });
  m = /^title too long \(max (\d+) characters\)$/.exec(error);
  if (m) return t("search.error.titleTooLong", { n: m[1] });
  m =
    /^text needs (\d+) pages but only (\d+) remain in this book — try a shorter phrase$/.exec(
      error,
    );
  if (m) return t("search.error.pageRoom", { need: m[1], room: m[2] });
  return error;
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
    input.placeholder = isTitle
      ? t("search.placeholderTitle")
      : t("search.placeholderContent");
  }
  const hint = el("searchHint");
  if (hint) {
    hint.textContent = isTitle
      ? t("search.hintTitle", { n: TITLE_LEN })
      : t("search.hintContent");
  }
  const head = el("searchHead");
  if (head) head.textContent = isTitle ? t("search.headTitle") : t("search.headContent");
  const meta = el("searchMeta");
  if (meta) {
    meta.textContent = isTitle ? t("search.metaTitle") : t("search.metaContent");
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
    return { ok: false, error: t("search.error.badResponse") };
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

function locateWith(jsonFn, text, alphabetId = S.alphabetId) {
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
  const result = parseLocateResult(jsonFn(query, alphabetId));
  if (!result.ok) {
    const wasmInvalid = invalidFromResult(result);
    if (wasmInvalid.length) {
      renderSearchHighlights(wasmInvalid);
      result.error = formatInvalidMessage(wasmInvalid, alphabetId);
    } else if (result.error) {
      result.error = localizeLocateError(result.error);
    }
  }
  return result;
}

/** Reverse lookup (content) in the current universe. */
export function locateText(text, alphabetId = S.alphabetId) {
  return locateWith(locate_page_json, text, alphabetId);
}

/** Reverse lookup (spine title) in the current universe. */
export function locateTitle(text, alphabetId = S.alphabetId) {
  return locateWith(locate_title_json, text, alphabetId);
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
    const msg = invalid.length
      ? result.error
      : localizeLocateError(result.error);
    box.innerHTML = `<p class="find-dim search-error">${escapeHtml(msg)}</p>`;
    box.classList.add("show");
    return;
  }

  clearSearchHighlights();
  const safe = escapeHtml;
  const query = syncSearchInput();
  const charLabel = t("search.result.chars", {
    n: Number(result.char_count).toLocaleString(getLocale()),
  });
  const alphabet = formatAlphabetSymbolLabel(result.alphabet, t);
  const pages =
    result.page_span > 1
      ? t("search.result.pages", {
          start: result.page,
          end: result.page_end,
        })
      : t("search.result.page", { n: result.page });
  const detail =
    kind === "title"
      ? t("search.result.detailTitle", {
          query: `<b>${safe(query)}</b>`,
          chars: charLabel,
          alphabet,
        })
      : t("search.result.detailContent", {
          pages,
          chars: charLabel,
          alphabet,
        });

  box.innerHTML =
    `<div class="find-big">${safe(
      t("search.result.gallery", { z: result.z, n: result.n }),
    )}</div>` +
    `<div class="find-dim">` +
    t("search.result.coords", {
      universe: `<b>${safe(formatUniverseLabel(S.universeName))}</b>`,
      wall: result.wall,
      shelf: result.shelf,
      book: result.book_on_shelf,
      detail,
    }) +
    `</div>` +
    findActionRow([
      { id: "go", label: t("search.go") },
      { id: "link", label: t("actions.copy") },
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
    syncLensControls();
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
