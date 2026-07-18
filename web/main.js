// lib-of-babel — the librarian (boot).
// Generation lives in WASM (deterministic); this file loads it, restores the
// session, and hands off to ./js/chrome/controls.js for DOM wiring.
// Modules: lib/{constants,wasm,util,db,color,lattice,i18n} · gallery/{state,url,view,nav,migrate}
//          · reader/{book,search,verify} · about · chrome/{controls,dropdown,theme}
// Text is never stored — only the trail of {z, n, move, hash} in IndexedDB.

import {
  init,
  generator_version,
  default_alphabet,
  search_page_span_for,
  locate_page_json,
  locate_title_json,
} from "./js/lib/wasm.js";
import { TOTAL_BOOKS, WINDOW_MAX } from "./js/lib/constants.js";
import { kvGet, kvDel } from "./js/lib/db.js";
import { S, hydrateTrail, persist, applyUniverse } from "./js/gallery/state.js";
import { parsePermalink } from "./js/gallery/url.js";
import {
  decodeCoordParam,
  normalizeCoordValue,
  isHugeCoordValue,
  coordForWasm,
} from "./js/lib/coords.js";
import {
  isLegacyPermalink,
  isStaleJourney,
  migrateLegacyLink,
  showLegacyMigrateModal,
} from "./js/gallery/migrate.js";
import { render } from "./js/gallery/view.js";
import { newWalk, resetTrail } from "./js/gallery/nav.js";
import { openBook, openBookImage } from "./js/reader/book.js";
import { wireControls } from "./js/chrome/controls.js";
import { startLoadingTypewriter, ensureLoadingMinLoops } from "./js/chrome/loading-wave.js";
import "./js/lib/find-debug.js";
import {
  openAboutGuide,
  hasSeenAbout,
  markSeenAbout,
} from "./js/about/about.js";

/**
 * Resolve `#q=&find=` (or legacy `#q=` with coords) by re-locating under the
 * live generator. Basile addresses are too large for reliable hash URLs.
 */
function resolveSearchPermalink(link) {
  if (!link?.q) return link;
  const kind = link.find === "title" ? "title" : "content";
  const alphabetId = link.a != null ? link.a : S.alphabetId;
  try {
    const raw =
      kind === "title"
        ? locate_title_json(link.q, alphabetId)
        : locate_page_json(link.q, alphabetId);
    const hit = JSON.parse(raw);
    if (!hit?.ok) return link;
    if (kind === "title") {
      S.titleEmbed = {
        flat: link.q,
        z: hit.z,
        n: hit.n,
        book: hit.book,
      };
    } else {
      S.titleEmbed = null;
    }
    return {
      ...link,
      z: decodeCoordParam(hit.z),
      n: decodeCoordParam(hit.n),
      b: hit.book,
      p: kind === "title" ? 1 : hit.page,
      a: hit.alphabet ?? alphabetId,
      q: kind === "content" ? link.q : null,
      find: kind,
      scope: hit.scope === "book" ? "book" : "page",
      img: false,
    };
  } catch {
    return link;
  }
}

async function openBookFromPermalink(link) {
  if (link.img) {
    if (link.be) {
      const key = `babel-embed:${link.be}`;
      const payload = await kvGet(key);
      await kvDel(key).catch(() => {});
      if (payload?.flat) {
        const rgba = payload.imageRgba
          ? payload.imageRgba instanceof Uint8Array
            ? payload.imageRgba
            : new Uint8Array(payload.imageRgba)
          : null;
        // Letter flat is identity — pass as contentFlat, not searchHighlight
        // (normalizeSearchQuery would lowercase / mis-handle multi-cell alphabets).
        openBookImage(link.b, null, null, 1, {
          contentFlat: payload.flat,
          imageRgba: rgba,
          imageW: payload.imageW || 0,
          imageH: payload.imageH || 0,
        });
        return;
      }
    }
    // Photo Find / Babelgram `&bo=` — letter flat is identity; RGBA is book-scope paint.
    if (link.flat || link.imageRgba?.length) {
      openBookImage(link.b, null, null, 1, {
        contentFlat: link.flat || null,
        imageRgba: link.imageRgba || null,
        imageW: link.imageW || 0,
        imageH: link.imageH || 0,
      });
      return;
    }
    openBookImage(link.b);
    return;
  }
  // Whole-book text Find `#bo=` — flat without opening the Babelgram modal.
  if (link.flat || link.imageRgba?.length) {
    openBook(link.b, null, link.p || 1, null, 1, {
      contentFlat: link.flat || null,
      imageRgba: link.imageRgba || null,
      imageW: link.imageW || 0,
      imageH: link.imageH || 0,
    });
    return;
  }
  openBook(
    link.b,
    null,
    link.p || 1,
    link.q || null,
    link.q ? search_page_span_for(link.q, S.alphabetId) : 1,
  );
}

/** Merge same-browser `&bo=` book-open handoff (survives paste truncation). */
async function applyBookOpenHandoff(link) {
  if (!link?.bo) return link;
  const key = `book-open:${link.bo}`;
  try {
    const payload = await kvGet(key);
    await kvDel(key).catch(() => {});
    if (!payload || payload.b == null) return link;
    const rgba = payload.imageRgba
      ? payload.imageRgba instanceof Uint8Array
        ? payload.imageRgba
        : new Uint8Array(payload.imageRgba)
      : null;
    const flat =
      typeof payload.flat === "string" && payload.flat.length
        ? payload.flat
        : null;
    // Handoff is authoritative — full Basile z/n never fit reliably in the hash.
    if (link.bo) S.bookOpenId = link.bo;
    const scope = payload.scope === "page" ? "page" : "book";
    S.bijectionScope = scope;
    // Keep huge book-linked coords as compact strings — never decodeCoordParam
    // (megabit BigInt freezes the tab for seconds).
    const z =
      payload.z != null ? normalizeCoordValue(payload.z) : link.z;
    const n =
      payload.n != null ? normalizeCoordValue(payload.n) : link.n;
    S.coordsHuge = isHugeCoordValue(z) || isHugeCoordValue(n);
    return {
      ...link,
      z,
      n,
      b: Number(payload.b),
      a: payload.a ?? link.a ?? null,
      u: payload.u ?? link.u ?? null,
      img: payload.img !== false,
      p: link.p ?? 1,
      flat,
      imageRgba: rgba,
      imageW: payload.imageW || 0,
      imageH: payload.imageH || 0,
      scope,
    };
  } catch {
    return link;
  }
}

async function boot() {
  startLoadingTypewriter();
  await init();
  S.gv = generator_version();
  document.querySelectorAll("[data-window-max]").forEach((node) => {
    node.textContent = String(WINDOW_MAX);
  });

  const saved = await kvGet("journey");
  const savedOk =
    saved && saved.current && Array.isArray(saved.trail) && saved.trail.length;

  // Permalink (#z=..&n=.. or #q=&find=) takes priority — unless it's our own
  // session refresh (coords + universe already match the saved trail).
  let link = parsePermalink();
  link = await applyBookOpenHandoff(link);

  S.alphabetId =
    link && link.a != null
      ? link.a
      : savedOk && saved.alphabet
        ? saved.alphabet
        : default_alphabet();

  applyUniverse(
    link && link.u != null ? link.u : savedOk && saved.universe ? saved.universe : "",
  );

  // Search shares (and any &q= link): re-locate — Basile z/n in the hash are
  // huge and often truncate; the query is the source of truth.
  if (link?.q) {
    link = resolveSearchPermalink(link);
    if (link.a != null) S.alphabetId = link.a;
  }

  const isOwnRefresh =
    link &&
    link.z != null &&
    link.n != null &&
    savedOk &&
    !isHugeCoordValue(link.z) &&
    !isHugeCoordValue(link.n) &&
    saved.current.z === coordForWasm(link.z) &&
    saved.current.n === coordForWasm(link.n) &&
    (saved.universe || "") === S.universeName &&
    (saved.generator_version == null || saved.generator_version === S.gv);

  // Let the stage loading animation play one typewriter loop before first paint.
  await ensureLoadingMinLoops(1);

  if (link && isLegacyPermalink(link, S.gv) && !isOwnRefresh) {
    const migrated = await migrateLegacyLink(link);
    const choice = await showLegacyMigrateModal({
      kind: "link",
      hasQuery: !!link.q,
      relocated: migrated.relocated,
      oldGv: link.gv != null ? Number(link.gv) : null,
      curGv: S.gv,
    });
    if (choice?.action === "wipe") return; // page reloads
    link = {
      ...link,
      z: migrated.z,
      n: migrated.n,
      b: migrated.b,
      p: migrated.p,
      q: migrated.q,
      gv: S.gv,
    };
  } else if (link && link.z != null && link.n != null && !isOwnRefresh) {
    S.z = link.z;
    S.n = link.n;
    if (link.scope === "book" || link.scope === "page") {
      S.bijectionScope = link.scope;
    }
    resetTrail({ scope: S.bijectionScope });
    await persist();
    render();
  } else if (savedOk && isStaleJourney(saved, S.gv)) {
    const choice = await showLegacyMigrateModal({
      kind: "journey",
      oldGv: saved.generator_version,
      curGv: S.gv,
    });
    if (choice?.action === "wipe") return; // page reloads
    // Continue / skip: keep shelf address, drop the old trail hashes.
    S.z = decodeCoordParam(saved.current.z);
    S.n = decodeCoordParam(saved.current.n);
    S.bijectionScope = "page";
    if (saved.universe) applyUniverse(saved.universe);
    if (saved.alphabet != null) S.alphabetId = saved.alphabet;
    resetTrail({ scope: "page" });
    await persist();
    render();
  } else if (savedOk) {
    S.z = decodeCoordParam(saved.current.z);
    S.n = decodeCoordParam(saved.current.n);
    S.bijectionScope = "page";
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
    link.z != null &&
    link.n != null &&
    Number.isInteger(link.b) &&
    link.b >= 0 &&
    link.b < TOTAL_BOOKS
  ) {
    // Prefer link coords when present (handoff / truncated paste may disagree
    // with an older IndexedDB shelf until we jump).
    if (link.scope === "book" || link.scope === "page") {
      S.bijectionScope = link.scope;
    }
    if (S.z !== link.z || S.n !== link.n) {
      S.z = link.z;
      S.n = link.n;
      resetTrail({ scope: S.bijectionScope });
      await persist();
      render();
    }
    await openBookFromPermalink(link);
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
