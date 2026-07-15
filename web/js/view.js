// Rendering: the gallery walls, the hexagon minimap, and wanderings.

import {
  S,
  isLastPickedUp,
  historyWindow,
  applyUniverse,
  stepUniverse,
  stepAlphabet,
  syncLensControls,
} from "./state.js";
import { el, copyText, hueFromString, neighbor, formatCoordDisplay, hashHue, hashAccentColor, formatUniverseLabel, galleryIsTouch } from "./util.js";
import {
  WALLS,
  SHELVES_PER_WALL,
  BOOKS_PER_SHELF,
  WINDOW_MAX,
  MOVE_ARROW,
  alphabetShortLabel,
  formatAlphabetSymbolLabel,
  alphabetIsRtl,
  alphabetScript,
} from "./constants.js";
import { syncUrl, permalink } from "./url.js";
import { node_hash_hex, gallery_titles_json } from "./wasm.js";
import { titleEmbedFlat } from "./search.js";
import { sigilSvg } from "./sigil.js";
import { setAccentFavicon } from "./favicon.js";
import { step } from "./nav.js";
import { openBook } from "./book.js";
import { t } from "./i18n.js";
import { accentHsl } from "./theme.js";

/** Spine glyphs for the live `--book-h` — dense type, generous so titles aren’t over-cut. */
function spineCharBudget() {
  const h =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--book-h"),
    ) || 52;
  const fontPx = Math.min(8, Math.max(6.5, h * 0.088));
  // Generous vs exact glyph height — prefer more title over empty spine.
  return Math.max(10, Math.min(22, Math.round((h - 2) / (fontPx * 0.78))));
}

// Hexagon minimap: current gallery in the middle, the hash awaiting down each
// of the four exits (two hallways + stairs up/down). Click an exit to walk it.
function renderMinimap(curHash, accentHue) {
  const accent = accentHsl(accentHue);
  const exit = (mv) => {
    const [nz, nn] = neighbor(S.z, S.n, mv);
    const h = node_hash_hex(nz, nn);
    return { h, color: hashAccentColor(h) };
  };
  const up = exit(2), down = exit(3), left = exit(0), right = exit(1);
  const hex = "110,30 179,70 179,150 110,190 41,150 41,70";
  const fill =
    getComputedStyle(document.documentElement).getPropertyValue("--mm-fill").trim() ||
    "transparent";

  el("minimap").innerHTML = `
    <svg viewBox="0 0 220 222" width="100%">
      <polygon points="${hex}" fill="${fill}"
        stroke="${accent}" stroke-width="1.5"/>
      <text x="110" y="112" text-anchor="middle" font-size="11" fill="${accent}">${curHash.slice(0, 8)}</text>
      <g id="mm-2" class="mm-exit"><text x="110" y="15" text-anchor="middle" font-size="11" fill="${up.color}">▲ ${up.h.slice(0, 6)}</text></g>
      <g id="mm-3" class="mm-exit"><text x="110" y="213" text-anchor="middle" font-size="11" fill="${down.color}">▼ ${down.h.slice(0, 6)}</text></g>
      <g id="mm-0" class="mm-exit"><text x="3" y="114" text-anchor="start" font-size="11" fill="${left.color}">◁ ${left.h.slice(0, 6)}</text></g>
      <g id="mm-1" class="mm-exit"><text x="217" y="114" text-anchor="end" font-size="11" fill="${right.color}">${right.h.slice(0, 6)} ▷</text></g>
    </svg>`;
  [0, 1, 2, 3].forEach((mv) => {
    const g = el(`mm-${mv}`);
    g.style.cursor = "pointer";
    g.addEventListener("click", () => step(mv));
  });
}

export function render() {
  const titles = JSON.parse(gallery_titles_json(S.z, S.n, S.alphabetId, titleEmbedFlat()));
  const hash = node_hash_hex(S.z, S.n);
  const fullCoord = `(${S.z}, ${S.n})`;
  el("coord").textContent = formatCoordDisplay(S.z, S.n);
  el("coord").title = `${fullCoord} — click to jump`;
  el("hash").textContent = hash;
  el("hash").dataset.full = hash;
  el("steps").textContent = String(Math.max(0, S.trail.length - 1));

  syncUrl();

  // gallery accent colour derived from its hash (deterministic per node).
  // separate hex slices seed hue / chroma / lightness so each gallery's
  // heatmap has a distinct mood, not just a rotated copy of the same ring.
  S.accentHue = hashHue(hash);
  S.accentChroma = 0.08 + 0.14 * (parseInt(hash.slice(4, 8), 16) / 0xffff);
  S.accentLightness = 0.55 + 0.23 * (parseInt(hash.slice(8, 12), 16) / 0xffff);
  document.documentElement.style.setProperty("--accent", accentHsl(S.accentHue));
  setAccentFavicon(S.accentHue);

  el("sigil").innerHTML = sigilSvg(hash, S.accentHue);
  renderMinimap(hash, S.accentHue);

  const wallsEl = el("walls");
  const prevScroll = [...wallsEl.querySelectorAll(".shelf-track")].map(
    (node) => node.scrollLeft,
  );
  wallsEl.innerHTML = "";
  const spineBudget = spineCharBudget();
  const touch = galleryIsTouch();
  const booksPerWall = SHELVES_PER_WALL * BOOKS_PER_SHELF;
  let idx = 0;
  for (let w = 0; w < WALLS; w++) {
    const wall = document.createElement("div");
    wall.className = "wall";
    const h = document.createElement("h2");
    const wallNum = w + 1;
    h.textContent = t("book.wall", { n: wallNum });
    h.dataset.wallLabel = h.textContent;
    wall.appendChild(h);

    const track = document.createElement("div");
    track.className = "shelf-track";
    for (let b = 0; b < booksPerWall; b++) {
      const bookIndex = idx++;
      const title = titles[bookIndex] || `book ${bookIndex}`;
      const hue = hueFromString(title);
      const book = document.createElement("div");
      book.className = "book";
      if (isLastPickedUp(bookIndex)) book.classList.add("last-picked-up");
      book.title = title;
      book.style.background = `linear-gradient(180deg, hsl(${hue} 48% 44%), hsl(${hue} 52% 22%))`;
      // Spine stub: letters/digits from any script (not ASCII a–z only — Greek/Cyrillic
      // titles would otherwise render blank). Cap to what `--book-h` can show.
      const script = alphabetScript(S.alphabetId);
      let stub = [...title]
        .filter((ch) => /\p{L}|\p{N}/u.test(ch))
        .slice(0, spineBudget)
        .join("");
      // Case fold only Latin-ish spines — RTL / fidel / Tifinagh / CJK / Indic stay as generated.
      if (script === "latin" || !script) stub = stub.toLocaleUpperCase();
      book.textContent = stub;
      if (alphabetIsRtl(S.alphabetId)) book.dir = "rtl";
      else book.removeAttribute("dir");
      if (!touch) {
        book.addEventListener("mouseenter", () => {
          // Meta on line 1, title on line 2 — avoids mid-string wrap / shelf jump.
          const meta = t("book.wallBook", {
            n: wallNum,
            book: bookIndex + 1,
          });
          h.replaceChildren(meta, document.createElement("br"), title);
        });
        book.addEventListener("mouseleave", () => {
          h.textContent = h.dataset.wallLabel;
        });
      }
      book.addEventListener("click", () => openBook(bookIndex, title));
      track.appendChild(book);
    }
    wall.appendChild(track);
    wallsEl.appendChild(wall);
  }
  wallsEl.querySelectorAll(".shelf-track").forEach((track, i) => {
    if (prevScroll[i] != null) track.scrollLeft = prevScroll[i];
  });

  const win = historyWindow();
  el("historyBtn").textContent = t("footer.wanderings", {
    n: win.length,
    max: WINDOW_MAX,
  });
  if (el("historyModal").open) renderHistory();
}

// Bounded wanderings, newest first — click a row to jump back to that visit.
// Each row uses the step's frozen universe/alphabet — never the live header values.
export function renderHistory() {
  const win = historyWindow(); // {z,n,move,hash,alphabet,universe}; oldest→newest
  el("historyMeta").textContent = t("history.meta", {
    shown: win.length,
    total: S.trail.length,
  });
  const startIdx = S.trail.length - win.length;
  const list = el("historyList");
  list.innerHTML = "";
  for (let i = win.length - 1; i >= 0; i--) {
    const e = win[i];
    const isCurrent = i === win.length - 1;
    const alpha = stepAlphabet(e, null);
    const uni = stepUniverse(e, null);
    const uniLabel = uni === null ? "—" : formatUniverseLabel(uni);
    const alphaLabel = alpha === null ? "—" : alphabetShortLabel(alpha);
    const row = document.createElement("div");
    row.className = "hrow" + (isCurrent ? " current" : "");
    row.innerHTML =
      `<span class="step">${startIdx + i}</span>` +
      `<span class="coord">(${e.z}, ${e.n})</span>` +
      `<span class="move">${MOVE_ARROW[e.move] ?? e.move}</span>` +
      `<span class="uni" title="universe at visit">${uniLabel}</span>` +
      `<span class="alpha" title="alphabet lens at visit">${alphaLabel}</span>` +
      `<span class="hh" style="color:${hashAccentColor(e.hash)}">${e.hash.slice(0, 12)}${isCurrent ? ` <span class="you">${t("common.you")}</span>` : ""}</span>`;
    row.title =
      `gallery (${e.z}, ${e.n}) · ${uniLabel}` +
      (alpha !== null ? ` · ${formatAlphabetSymbolLabel(alpha)}` : "") +
      ` — ${e.hash}`;
    row.addEventListener("click", () => {
      if (uni !== null) applyUniverse(uni);
      if (alpha !== null) S.alphabetId = alpha;
      syncLensControls();
      S.z = BigInt(e.z);
      S.n = BigInt(e.n);
      el("historyModal").close();
      render();
    });
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy";
    copyBtn.type = "button";
    copyBtn.textContent = t("common.link");
    copyBtn.title = "copy a shareable link to this gallery";
    copyBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const url = permalink(
        e.z,
        e.n,
        e.hash || "",
        alpha ?? S.alphabetId,
        null,
        null,
        uni ?? S.universeName,
      );
      void copyText(url, copyBtn, "✓");
    });
    row.appendChild(copyBtn);
    list.appendChild(row);
  }
}
