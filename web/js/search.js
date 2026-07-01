// Search-by-content: paste a phrase → WASM reverse lookup → coordinates + go there.

import { S, applyUniverse, applyUniverseSeed } from "./state.js";
import { el } from "./util.js";
import { locate_page_json, get_universe } from "./wasm.js";
import { jumpTo } from "./nav.js";
import { openBook } from "./book.js";
import { permalink } from "./url.js";
import { node_hash_hex } from "./wasm.js";

export function parseLocateResult(jsonStr) {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return { ok: false, error: "invalid response from generator" };
  }
}

export function locateText(text, alphabetId = S.alphabetId) {
  return parseLocateResult(locate_page_json(text, alphabetId));
}

function universeLabel(seed) {
  if (seed === 0) return "default";
  if (seed === get_universe() && S.universeName) return S.universeName;
  return `0x${BigInt(seed).toString(16)}`;
}

export function renderSearchResult(result, box) {
  if (!result.ok) {
    box.innerHTML = `<p class="find-dim">${String(result.error).replace(/[<>&]/g, "")}</p>`;
    box.classList.add("show");
    return;
  }

  const uni = BigInt(result.universe_seed);
  const z = BigInt(result.z);
  const n = BigInt(result.n);
  const safe = (s) => String(s).replace(/[<>&]/g, "");

  box.innerHTML =
    `<div class="find-big">gallery (${safe(result.z)}, ${safe(result.n)})</div>` +
    `<div class="find-dim">` +
    `universe <b>${safe(universeLabel(result.universe_seed))}</b> · ` +
    `wall ${result.wall} · shelf ${result.shelf} · book ${result.book_on_shelf} · ` +
    `page ${result.page} · alphabet ${result.alphabet}-symbol` +
    `</div>` +
    `<div class="find-row" style="margin-top:.5rem">` +
    `<button id="searchGo">go there</button>` +
    `<button id="searchLink">copy link</button>` +
    `</div>`;
  box.classList.add("show");

  el("searchGo").onclick = () => goToSearchResult(result);
  el("searchLink").onclick = (ev) => {
    const hash = node_hash_hex(z, n, result.alphabet);
    const uni =
      uni === 0n
        ? ""
        : uni === BigInt(get_universe()) && S.universeName
          ? S.universeName
          : null;
    const url = permalink(z, n, hash, result.alphabet, result.book, result.page, uni ?? "");
    navigator.clipboard.writeText(url).then(
      () => {
        ev.currentTarget.textContent = "copied!";
        setTimeout(() => (ev.currentTarget.textContent = "copy link"), 1200);
      },
      () => {},
    );
  };
}

export function goToSearchResult(result) {
  const targetSeed = BigInt(result.universe_seed);
  const current = BigInt(get_universe());

  if (result.alphabet !== S.alphabetId) {
    S.alphabetId = result.alphabet;
    el("alphabet").value = String(result.alphabet);
  }

  if (targetSeed !== current) {
    if (targetSeed === 0n) applyUniverse("");
    else applyUniverseSeed(targetSeed);
    el("universe").value = S.universeName;
  }

  jumpTo(result.z, result.n);
  openBook(result.book, null, result.page);
  el("searchModal").close();
}
