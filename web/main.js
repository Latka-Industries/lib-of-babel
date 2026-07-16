// lib-of-babel — the librarian (boot).
// Generation lives in WASM (deterministic); this file loads it, restores the
// session, and hands off to ./js/chrome/controls.js for DOM wiring.
// Modules: lib/{constants,wasm,util,db,color,lattice,i18n} · gallery/{state,url,view,nav}
//          · reader/{book,search,verify} · about · chrome/{controls,dropdown,theme}
// Text is never stored — only the trail of {z, n, move, hash} in IndexedDB.

import { init, generator_version, default_alphabet, search_page_span_for } from "./js/lib/wasm.js";
import { TOTAL_BOOKS, WINDOW_MAX } from "./js/lib/constants.js";
import { kvGet } from "./js/lib/db.js";
import { S, hydrateTrail, persist, applyUniverse } from "./js/gallery/state.js";
import { parsePermalink } from "./js/gallery/url.js";
import { render } from "./js/gallery/view.js";
import { newWalk, resetTrail } from "./js/gallery/nav.js";
import { openBook, openBookImage } from "./js/reader/book.js";
import { wireControls } from "./js/chrome/controls.js";
import {
  openAboutGuide,
  hasSeenAbout,
  markSeenAbout,
} from "./js/about/about.js";

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
    if (link.img) {
      openBookImage(link.b);
    } else {
      openBook(
        link.b,
        null,
        link.p || 1,
        link.q || null,
        link.q ? search_page_span_for(link.q, S.alphabetId) : 1,
      );
    }
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
