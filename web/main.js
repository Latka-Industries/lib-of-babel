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
  isLegacyPermalink,
  isStaleJourney,
  migrateLegacyLink,
  showLegacyMigrateModal,
} from "./js/gallery/migrate.js";
import { render } from "./js/gallery/view.js";
import { newWalk, resetTrail } from "./js/gallery/nav.js";
import { openBook, openBookImage } from "./js/reader/book.js";
import { wireControls } from "./js/chrome/controls.js";
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
        z: String(hit.z),
        n: String(hit.n),
        book: hit.book,
      };
    } else {
      S.titleEmbed = null;
    }
    return {
      ...link,
      z: BigInt(hit.z),
      n: BigInt(hit.n),
      b: hit.book,
      p: kind === "title" ? 1 : hit.page,
      a: hit.alphabet ?? alphabetId,
      q: kind === "content" ? link.q : null,
      find: kind,
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
        openBookImage(link.b, null, payload.flat, payload.pageSpan || 1, {
          imageRgba: rgba,
          imageW: payload.imageW || 0,
          imageH: payload.imageH || 0,
        });
        return;
      }
    }
    openBookImage(link.b);
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

async function boot() {
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
    saved.current.z === link.z.toString() &&
    saved.current.n === link.n.toString() &&
    (saved.universe || "") === S.universeName &&
    (saved.generator_version == null || saved.generator_version === S.gv);

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
    resetTrail();
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
    S.z = BigInt(saved.current.z);
    S.n = BigInt(saved.current.n);
    if (saved.universe) applyUniverse(saved.universe);
    if (saved.alphabet != null) S.alphabetId = saved.alphabet;
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
    link.z != null &&
    link.n != null &&
    Number.isInteger(link.b) &&
    link.b >= 0 &&
    link.b < TOTAL_BOOKS &&
    S.z === link.z &&
    S.n === link.n
  ) {
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
