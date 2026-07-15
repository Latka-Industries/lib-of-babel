// lib-of-babel — the librarian (boot).
// Generation lives in WASM (deterministic); this file loads it, restores the
// session, and hands off to ./js/controls.js for DOM wiring.
// Modules: constants · wasm · util · db · state · url · book · view · nav ·
//          about · search · verify · controls
// Text is never stored — only the trail of {z, n, move, hash} in IndexedDB.

import { init, generator_version, default_alphabet, search_page_span_for } from "./js/wasm.js";
import { TOTAL_BOOKS, WINDOW_MAX } from "./js/constants.js";
import { kvGet } from "./js/db.js";
import { S, hydrateTrail, persist, applyUniverse } from "./js/state.js";
import { parsePermalink } from "./js/url.js";
import { render } from "./js/view.js";
import { newWalk, resetTrail } from "./js/nav.js";
import { openBook } from "./js/book.js";
import { wireControls } from "./js/controls.js";
import {
  openAboutGuide,
  hasSeenAbout,
  markSeenAbout,
} from "./js/about.js";

async function boot() {
  await init();
  S.gv = generator_version();
  document.querySelectorAll("[data-window-max]").forEach((node) => {
    node.textContent = String(WINDOW_MAX);
  });

  const saved = await kvGet("journey");
  const savedOk =
    saved && saved.current && Array.isArray(saved.trail) && saved.trail.length;

  // Permalink (#z=..&n=..) takes priority — unless it's our own session refresh
  // (coords + universe already match the saved trail).
  const link = parsePermalink();

  S.alphabetId =
    link && link.a != null
      ? link.a
      : savedOk && saved.alphabet
        ? saved.alphabet
        : default_alphabet();

  applyUniverse(
    link && link.u != null ? link.u : savedOk && saved.universe ? saved.universe : "",
  );

  const isOwnRefresh =
    link &&
    savedOk &&
    saved.current.z === link.z.toString() &&
    saved.current.n === link.n.toString() &&
    (saved.universe || "") === S.universeName;

  if (link && !isOwnRefresh) {
    S.z = link.z;
    S.n = link.n;
    resetTrail();
    await persist();
    render();
  } else if (savedOk) {
    S.z = BigInt(saved.current.z);
    S.n = BigInt(saved.current.n);
    S.trail = hydrateTrail(saved.trail, {
      universe: saved.universe,
      alphabet: saved.alphabet,
    });
    S.startedAt = saved.started_at || S.startedAt;
    render();
  } else {
    await newWalk();
  }

  let openedBook = false;
  if (
    link &&
    Number.isInteger(link.b) &&
    link.b >= 0 &&
    link.b < TOTAL_BOOKS &&
    S.z === link.z &&
    S.n === link.n
  ) {
    openBook(
      link.b,
      null,
      link.p || 1,
      link.q || null,
      link.q ? search_page_span_for(link.q, S.alphabetId) : 1,
    );
    openedBook = true;
  }

  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

  wireControls();

  // First landing: open the guide (skip if a deep-linked book already owns the stage).
  if (!hasSeenAbout() && !openedBook) {
    openAboutGuide();
    markSeenAbout();
  }
}

boot().catch((err) => {
  console.error(err);
  const stage = document.getElementById("stage");
  if (stage) {
    stage.innerHTML =
      `<p class="error">Failed to boot: ${String(err?.message || err)}</p>`;
  }
});
