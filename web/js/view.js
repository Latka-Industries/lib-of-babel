// Rendering: the gallery walls, the hexagon minimap, and the history window.

import { S } from "./state.js";
import { el, copyText, hueFromString, neighbor } from "./util.js";
import {
  WALLS,
  SHELVES_PER_WALL,
  BOOKS_PER_SHELF,
  WINDOW_MAX,
  MOVE_ARROW,
} from "./constants.js";
import { syncUrl, permalink } from "./url.js";
import { node_hash_hex, gallery_titles_json } from "./wasm.js";
import { sigilSvg } from "./sigil.js";
import { leadingZeroBits, rarityTier } from "./find.js";
import { step } from "./nav.js";
import { openBook } from "./book.js";

// Hexagon minimap: current gallery in the middle, the hash awaiting down each
// of the four exits (two hallways + stairs up/down). Click an exit to walk it.
function renderMinimap(curHash, accentHue) {
  const accent = `hsl(${accentHue} 70% 58%)`;
  const exit = (mv) => {
    const [nz, nn] = neighbor(S.z, S.n, mv);
    const h = node_hash_hex(nz, nn, S.alphabetId);
    return { h, color: `hsl(${parseInt(h.slice(0, 4), 16) % 360} 60% 62%)` };
  };
  const up = exit(2), down = exit(3), left = exit(0), right = exit(1);
  const hex = "110,30 179,70 179,150 110,190 41,150 41,70";

  el("minimap").innerHTML = `
    <svg viewBox="0 0 220 222" width="100%">
      <polygon points="${hex}" fill="rgba(255,255,255,0.025)"
        stroke="${accent}" stroke-width="1.5"/>
      <text x="110" y="105" text-anchor="middle" font-size="9" fill="#6f6a5e">(${S.z}, ${S.n})</text>
      <text x="110" y="119" text-anchor="middle" font-size="11" fill="${accent}">${curHash.slice(0, 8)}</text>
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
  const titles = JSON.parse(gallery_titles_json(S.z, S.n, S.alphabetId));
  const hash = node_hash_hex(S.z, S.n, S.alphabetId);
  el("coord").textContent = `(${S.z}, ${S.n})`;
  el("hash").textContent = hash;
  el("hash").dataset.full = hash;
  el("steps").textContent = String(Math.max(0, S.trail.length - 1));

  // rarity = leading zero bits of the hash (proof-of-find). Colour by tier.
  const bits = leadingZeroBits(hash);
  const tier = rarityTier(bits);
  const rarityEl = el("rarity");
  rarityEl.textContent = `${bits} bits · ${tier.name}`;
  rarityEl.style.setProperty(
    "--tier",
    tier.dim ? "var(--muted)" : `hsl(${tier.hue} 75% 62%)`,
  );

  syncUrl();

  // gallery accent colour derived from its hash (deterministic per node).
  // separate hex slices seed hue / chroma / lightness so each gallery's
  // heatmap has a distinct mood, not just a rotated copy of the same ring.
  S.accentHue = parseInt(hash.slice(0, 4), 16) % 360;
  S.accentChroma = 0.08 + 0.14 * (parseInt(hash.slice(4, 8), 16) / 0xffff);
  S.accentLightness = 0.55 + 0.23 * (parseInt(hash.slice(8, 12), 16) / 0xffff);
  document.documentElement.style.setProperty(
    "--accent",
    `hsl(${S.accentHue} 70% 58%)`,
  );

  el("sigil").innerHTML = sigilSvg(hash, S.accentHue);
  renderMinimap(hash, S.accentHue);

  const wallsEl = el("walls");
  wallsEl.innerHTML = "";
  let idx = 0;
  for (let w = 0; w < WALLS; w++) {
    const wall = document.createElement("div");
    wall.className = "wall";
    const h = document.createElement("h2");
    h.textContent = `Wall ${w + 1}`;
    wall.appendChild(h);
    for (let s = 0; s < SHELVES_PER_WALL; s++) {
      const shelf = document.createElement("div");
      shelf.className = "shelf";
      for (let b = 0; b < BOOKS_PER_SHELF; b++) {
        const bookIndex = idx++;
        const title = titles[bookIndex] || `book ${bookIndex}`;
        const hue = hueFromString(title);
        const book = document.createElement("div");
        book.className = "book";
        book.title = title;
        book.style.background = `linear-gradient(180deg, hsl(${hue} 48% 44%), hsl(${hue} 52% 22%))`;
        book.textContent = title
          .replace(/[^a-z]/gi, "")
          .slice(0, 6)
          .toUpperCase();
        book.addEventListener("click", () => openBook(bookIndex, title));
        shelf.appendChild(book);
      }
      wall.appendChild(shelf);
    }
    wallsEl.appendChild(wall);
  }

  el("historyBtn").textContent = `window · last ${S.windowBuf.length}/${WINDOW_MAX}`;
  el("trailNote").textContent = `trail ${S.trail.length} nodes · universe ${S.universeName || "default"} · ${S.alphabetId}-symbol · gen v${S.gv}`;
  if (el("historyModal").open) renderHistory();
}

// last-50 window, newest first, vertically — click a row to jump back to it.
export function renderHistory() {
  const win = S.trail.slice(-WINDOW_MAX); // {z,n,move,hash}; oldest→newest
  el("historyMeta").textContent =
    `${win.length} galleries (of ${S.trail.length} walked) · newest first`;
  const startIdx = S.trail.length - win.length; // global step number offset
  const list = el("historyList");
  list.innerHTML = "";
  for (let i = win.length - 1; i >= 0; i--) {
    const e = win[i];
    const isCurrent = i === win.length - 1;
    const hue = parseInt(e.hash.slice(0, 4), 16) % 360;
    const row = document.createElement("div");
    row.className = "hrow" + (isCurrent ? " current" : "");
    row.innerHTML =
      `<span class="step">${startIdx + i}</span>` +
      `<span class="coord">(${e.z}, ${e.n})</span>` +
      `<span class="move">${MOVE_ARROW[e.move]}</span>` +
      `<span class="hh" style="color:hsl(${hue} 60% 62%)">${e.hash.slice(0, 12)}${isCurrent ? ' <span class="you">you</span>' : ""}</span>`;
    row.title = `gallery (${e.z}, ${e.n}) — ${e.hash}`;
    row.addEventListener("click", () => {
      S.z = BigInt(e.z);
      S.n = BigInt(e.n);
      el("historyModal").close();
      render();
    });
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy";
    copyBtn.textContent = "link";
    copyBtn.title = "copy a shareable link to this gallery";
    copyBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      copyText(permalink(e.z, e.n, e.hash), copyBtn, "✓");
    });
    row.appendChild(copyBtn);
    list.appendChild(row);
  }
}
