// lib-of-babel — the walk.
// Generation lives in WASM (deterministic). This file is just the librarian:
// render the gallery, move between coordinates, keep a 50-node window, and
// persist the trail of {z, n, move, hash} to IndexedDB. Text is never stored.

import init, {
  gallery_titles_json,
  node_hash_hex,
  book_text_for,
  book_image,
  generator_version,
  default_alphabet,
} from "./pkg/lib_of_babel.js";

const WALLS = 4;
const SHELVES_PER_WALL = 5;
const BOOKS_PER_SHELF = 35;
const WINDOW_MAX = 50; // forget rendered nodes beyond this; trail keeps hashes
const PAGES_PER_BOOK = 410;
const LINES_PER_PAGE = 40;
const CHARS_PER_LINE = 80;
const PAGE_CHARS = (CHARS_PER_LINE + 1) * LINES_PER_PAGE; // 80 chars + newline per line

// deterministic hue from a string (spine title) — stable per book
function hueFromString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

// OKLCH (L 0..1, C, H degrees) -> sRGB "#rrggbb". Converted in JS rather than
// relying on canvas oklch() support, so the heatmap renders identically on
// every browser. Math: Björn Ottosson's OKLab -> linear sRGB transform.
function oklchToHex(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  let out = "#";
  for (let c of lin) {
    c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    const v = Math.max(0, Math.min(255, Math.round(c * 255)));
    out += v.toString(16).padStart(2, "0");
  }
  return out;
}

// ---- tiny IndexedDB key/value store ---------------------------------------
const DB_NAME = "lib-of-babel";
const STORE = "kv";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function kvGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    tx.onsuccess = () => resolve(tx.result);
    tx.onerror = () => reject(tx.error);
  });
}
async function kvSet(key, val) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db
      .transaction(STORE, "readwrite")
      .objectStore(STORE)
      .put(val, key);
    tx.onsuccess = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---- state ----------------------------------------------------------------
const MOVE_NAMES = { 0: "left", 1: "right", 2: "up", 3: "down" };
let z = 0n;
let n = 0n;
let gv = 0;
let alphabetId = 29; // symbol count; 25 = Borges, 29 = Basile. An axis of the universe.
let trail = []; // [{ z:string, n:string, move:number|null, hash:string }]
let windowBuf = []; // last <=50 visited {z,n,hash}
let startedAt = new Date().toISOString();
let saveTimer = null;

// neighbor math (kept in JS to avoid BigInt/JSON round-trips through wasm)
function neighbor(z, n, mv) {
  switch (mv) {
    case 0:
      return [z, n - 1n];
    case 1:
      return [z, n + 1n];
    case 2:
      return [z + 1n, n];
    default:
      return [z - 1n, n];
  }
}

function randomCoord() {
  const buf = new BigInt64Array(2);
  crypto.getRandomValues(buf);
  // keep within a friendly range so the header stays readable
  return [buf[0] % 1_000_000_000n, buf[1] % 1_000_000_000n];
}

// ---- persistence ----------------------------------------------------------
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 250);
}
async function persist() {
  await kvSet("journey", {
    generator_version: gv,
    alphabet: alphabetId,
    started_at: startedAt,
    current: { z: z.toString(), n: n.toString() },
    trail,
  });
}

function recordStep(move) {
  const hash = node_hash_hex(z, n, alphabetId);
  trail.push({ z: z.toString(), n: n.toString(), move, hash });
  windowBuf.push({ z: z.toString(), n: n.toString(), hash });
  if (windowBuf.length > WINDOW_MAX) windowBuf.shift(); // forget beyond 50
  scheduleSave();
  return hash;
}

// ---- url permalink + clipboard --------------------------------------------
// The hash isn't reversible to coordinates, so a shareable link encodes (z, n)
// and carries the hash as a proof token. An open book adds &b=<shelf>&p=<page>.
function permalink(zv, nv, hash, alpha = alphabetId, book = null, page = null) {
  const base = `${location.origin}${location.pathname}`;
  let frag = `#z=${zv}&n=${nv}&a=${alpha}&h=${hash.slice(0, 16)}`;
  if (book !== null) frag += `&b=${book}`;
  if (page !== null) frag += `&p=${page}`;
  return `${base}${frag}`;
}

// the link to wherever we are right now (gallery, or gallery + open book/page)
function currentUrl() {
  const hash = node_hash_hex(z, n, alphabetId);
  if (currentBook && el("bookModal").open) {
    return permalink(z, n, hash, alphabetId, currentBook.index, currentBook.page + 1);
  }
  return permalink(z, n, hash);
}

function syncUrl() {
  const base = currentUrl();
  history.replaceState(null, "", base.slice(base.indexOf("#")));
}

// read #z=..&n=..(&h=..&b=..&p=..) from the URL
function parsePermalink() {
  const p = new URLSearchParams(location.hash.slice(1));
  const zs = p.get("z");
  const ns = p.get("n");
  if (zs === null || ns === null) return null;
  try {
    const bs = p.get("b");
    const ps = p.get("p");
    const as = p.get("a");
    return {
      z: BigInt(zs),
      n: BigInt(ns),
      h: p.get("h") || "",
      a: as === null ? null : Number(as),
      b: bs === null ? null : Number(bs),
      p: ps === null ? null : Number(ps),
    };
  } catch {
    return null; // malformed coordinates
  }
}

async function copyText(text, btn, okMsg = "copied") {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return; // clipboard blocked (e.g. insecure context) — fail quietly
  }
  if (!btn) return;
  const prev = btn.textContent;
  btn.textContent = okMsg;
  setTimeout(() => (btn.textContent = prev), 1000);
}

// ---- rendering ------------------------------------------------------------
const el = (id) => document.getElementById(id);

// Hexagon minimap: current gallery in the middle, the hash awaiting down each
// of the four exits (two hallways + stairs up/down). Click an exit to walk it.
function renderMinimap(curHash, accentHue) {
  const accent = `hsl(${accentHue} 70% 58%)`;
  const exit = (mv) => {
    const [nz, nn] = neighbor(z, n, mv);
    const h = node_hash_hex(nz, nn, alphabetId);
    return { h, color: `hsl(${parseInt(h.slice(0, 4), 16) % 360} 60% 62%)` };
  };
  const up = exit(2), down = exit(3), left = exit(0), right = exit(1);
  const hex = "110,30 179,70 179,150 110,190 41,150 41,70";

  el("minimap").innerHTML = `
    <svg viewBox="0 0 220 222" width="100%">
      <polygon points="${hex}" fill="rgba(255,255,255,0.025)"
        stroke="${accent}" stroke-width="1.5"/>
      <text x="110" y="105" text-anchor="middle" font-size="9" fill="#6f6a5e">(${z}, ${n})</text>
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

function render() {
  const titles = JSON.parse(gallery_titles_json(z, n, alphabetId));
  const hash = node_hash_hex(z, n, alphabetId);
  el("coord").textContent = `(${z}, ${n})`;
  el("hash").textContent = hash;
  el("hash").dataset.full = hash;
  el("steps").textContent = String(Math.max(0, trail.length - 1));
  syncUrl();

  // gallery accent colour derived from its hash (deterministic per node).
  // separate hex slices seed hue / chroma / lightness so each gallery's
  // heatmap has a distinct mood, not just a rotated copy of the same ring.
  accentHue = parseInt(hash.slice(0, 4), 16) % 360;
  accentChroma = 0.08 + 0.14 * (parseInt(hash.slice(4, 8), 16) / 0xffff);
  accentLightness = 0.55 + 0.23 * (parseInt(hash.slice(8, 12), 16) / 0xffff);
  document.documentElement.style.setProperty(
    "--accent",
    `hsl(${accentHue} 70% 58%)`,
  );

  renderMinimap(hash, accentHue);

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

  el("historyBtn").textContent = `window · last ${windowBuf.length}/${WINDOW_MAX}`;
  el("trailNote").textContent = `trail ${trail.length} nodes · ${alphabetId}-symbol · gen v${gv}`;
  if (el("historyModal").open) renderHistory();
}

const MOVE_ARROW = { 0: "◁", 1: "▷", 2: "▲", 3: "▼", null: "•", jump: "⤳" };

// last-50 window, newest first, vertically — click a row to jump back to it.
function renderHistory() {
  const win = trail.slice(-WINDOW_MAX); // {z,n,move,hash}; oldest→newest
  el("historyMeta").textContent =
    `${win.length} galleries (of ${trail.length} walked) · newest first`;
  const startIdx = trail.length - win.length; // global step number offset
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
      z = BigInt(e.z);
      n = BigInt(e.n);
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

let currentBook = null; // { index, title, text, page }
let viewMode = "text"; // "text" | "color" — how the open page is shown
// current gallery's palette, derived from its hash (set in render). hue spaces
// the letters; chroma + lightness give each gallery its own mood in OKLCH.
let accentHue = 0;
let accentChroma = 0.15;
let accentLightness = 0.66;

// alphabets mirror src/lib.rs; index is used to spread heatmap hues evenly
const ALPHABETS = {
  25: "abcdefghijklmnopqrstuv ,.",
  29: "abcdefghijklmnopqrstuvwxyz ,.",
};

// the page's 3200 characters, rewrapped into the near-square divisor pair
// (64×50) so the colour map reads as a block rather than a 2:1 sliver. Looks
// like colour noise, since the text is maximum-entropy.
function pageGrid(total) {
  let rows = Math.floor(Math.sqrt(total));
  while (total % rows !== 0) rows--;
  return { cols: total / rows, rows };
}

function renderBookCanvas(pageText) {
  const chars = pageText.replace(/\n/g, "");
  const { cols, rows } = pageGrid(chars.length);
  const cell = 10;
  const cv = el("bookCanvas");
  cv.width = cols * cell;
  cv.height = rows * cell;
  const ctx = cv.getContext("2d");
  // OKLCH so the spread is perceptually even (HSL clumps greens, crushes blues).
  // hue = letter's position in the alphabet, evenly spaced and rotated by the
  // gallery's accent hue; chroma + lightness are seeded per gallery so each
  // one reads as a distinct mood while staying a faithful per-page content map.
  // precompute one sRGB swatch per symbol so each cell is just an array lookup.
  const alpha = ALPHABETS[alphabetId] || ALPHABETS[29];
  const step = 360 / alpha.length;
  const palette = new Array(alpha.length);
  for (let i = 0; i < alpha.length; i++) {
    palette[i] = oklchToHex(accentLightness, accentChroma, (i * step + accentHue) % 360);
  }
  for (let k = 0; k < chars.length; k++) {
    const ch = chars[k];
    const i = alpha.indexOf(ch);
    ctx.fillStyle = ch === " " || i < 0 ? "#15131a" : palette[i];
    ctx.fillRect((k % cols) * cell, Math.floor(k / cols) * cell, cell, cell);
  }
}

function titleForIndex(i) {
  try {
    return JSON.parse(gallery_titles_json(z, n, alphabetId))[i] || null;
  } catch {
    return null;
  }
}

function openBook(bookIndex, title, startPage = 1) {
  // generate the whole 410-page book once, then page through it from the cache
  const text = book_text_for(z, n, bookIndex, alphabetId);
  const page = Math.min(PAGES_PER_BOOK, Math.max(1, startPage)) - 1;
  currentBook = {
    index: bookIndex,
    title: title || titleForIndex(bookIndex) || `book ${bookIndex}`,
    text,
    page,
  };
  el("bookTitle").textContent = currentBook.title;
  renderBookPage();
  if (!el("bookModal").open) el("bookModal").showModal();
}

function renderBookPage() {
  if (!currentBook) return;
  const p = currentBook.page;
  el("bookMeta").textContent =
    `gallery (${z}, ${n}) · shelf index ${currentBook.index}`;
  el("pageInd").textContent = `page ${p + 1} / ${PAGES_PER_BOOK}`;
  const pageText = currentBook.text.slice(p * PAGE_CHARS, (p + 1) * PAGE_CHARS);
  if (viewMode === "color") {
    el("bookPage").hidden = true;
    el("bookCanvas").hidden = false;
    renderBookCanvas(pageText);
  } else {
    el("bookCanvas").hidden = true;
    el("bookPage").hidden = false;
    el("bookPage").textContent = pageText;
    el("bookPage").scrollTop = 0;
  }
  el("prevPage").disabled = p <= 0;
  el("nextPage").disabled = p >= PAGES_PER_BOOK - 1;
  syncUrl();
}

function turnPage(delta) {
  if (!currentBook) return;
  const next = currentBook.page + delta;
  if (next < 0 || next >= PAGES_PER_BOOK) return;
  currentBook.page = next;
  renderBookPage();
}

function jumpPage() {
  if (!currentBook) return;
  const v = parseInt(el("pageJump").value, 10);
  if (!Number.isFinite(v)) return;
  currentBook.page = Math.min(PAGES_PER_BOOK, Math.max(1, v)) - 1;
  renderBookPage();
}

function downloadBook() {
  if (!currentBook) return;
  const safe =
    currentBook.title
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "book";
  const name = `babel-${z}_${n}-shelf${currentBook.index}-${safe}.txt`;
  const blob = new Blob([currentBook.text], {
    type: "text/plain;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

// whole-book color map: WASM returns an RGBA contact sheet of all 410 pages,
// we blit it straight to a canvas (one putImageData, no per-cell JS work).
function renderBookImage() {
  if (!currentBook) return;
  const img = book_image(z, n, currentBook.index, alphabetId);
  const cv = el("bookImageCanvas");
  cv.width = img.width;
  cv.height = img.height;
  const data = new ImageData(
    new Uint8ClampedArray(img.pixels),
    img.width,
    img.height,
  );
  cv.getContext("2d").putImageData(data, 0, 0);
  el("imageTitle").textContent = currentBook.title;
  el("imageMeta").textContent =
    `gallery (${z}, ${n}) · shelf ${currentBook.index} · whole book · ${img.width}×${img.height}`;
}

function saveBookImage() {
  if (!currentBook) return;
  el("bookImageCanvas").toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `babel-${z}_${n}-shelf${currentBook.index}-colors.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

// ---- movement -------------------------------------------------------------
function step(move) {
  [z, n] = neighbor(z, n, move);
  recordStep(move);
  render();
}

// ---- jump to an arbitrary coordinate (big leaps across the lattice) --------
const I64_MIN = -9223372036854775808n;
const I64_MAX = 9223372036854775807n;
const clampI64 = (v) => (v < I64_MIN ? I64_MIN : v > I64_MAX ? I64_MAX : v);

function jumpTo(zStr, nStr) {
  const parse = (s) => {
    const t = String(s).trim();
    return /^-?\d+$/.test(t) ? clampI64(BigInt(t)) : null;
  };
  const zv = parse(zStr);
  const nv = parse(nStr);
  if (zv === null || nv === null) return false;
  if (zv === z && nv === n) return true; // already here; just close
  z = zv;
  n = nv;
  recordStep("jump");
  render();
  return true;
}

// ---- export ---------------------------------------------------------------
function exportJourney() {
  const blob = new Blob(
    [
      JSON.stringify(
        { generator_version: gv, alphabet: alphabetId, started_at: startedAt, trail },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `babel-journey-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function newWalk() {
  [z, n] = randomCoord();
  trail = [];
  windowBuf = [];
  startedAt = new Date().toISOString();
  recordStep(null); // the starting node
  await persist();
  render();
}

// ---- boot -----------------------------------------------------------------
async function main() {
  await init();
  gv = generator_version();

  const saved = await kvGet("journey");
  const savedOk =
    saved &&
    saved.current &&
    Array.isArray(saved.trail) &&
    saved.trail.length;

  // a permalink (#z=..&n=..) takes priority — unless it's just our own
  // session being refreshed (coords already match the saved trail).
  const link = parsePermalink();

  // alphabet is an axis of the universe: permalink wins, else saved, else default
  alphabetId =
    link && link.a != null
      ? link.a
      : savedOk && saved.alphabet
        ? saved.alphabet
        : default_alphabet();

  const isOwnRefresh =
    link &&
    savedOk &&
    saved.current.z === link.z.toString() &&
    saved.current.n === link.n.toString();

  if (link && !isOwnRefresh) {
    z = link.z;
    n = link.n;
    trail = [];
    windowBuf = [];
    startedAt = new Date().toISOString();
    recordStep(null);
    await persist();
    render();
  } else if (savedOk) {
    z = BigInt(saved.current.z);
    n = BigInt(saved.current.n);
    trail = saved.trail;
    startedAt = saved.started_at || startedAt;
    windowBuf = trail
      .slice(-WINDOW_MAX)
      .map((e) => ({ z: e.z, n: e.n, hash: e.hash }));
    render();
  } else {
    await newWalk();
  }

  // a permalink can also point at a specific book + page — open it
  const TOTAL_BOOKS = WALLS * SHELVES_PER_WALL * BOOKS_PER_SHELF;
  if (
    link &&
    Number.isInteger(link.b) &&
    link.b >= 0 &&
    link.b < TOTAL_BOOKS &&
    z === link.z &&
    n === link.n
  ) {
    openBook(link.b, null, link.p || 1);
  }

  // ask the browser not to evict the trail under disk pressure
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

  document
    .querySelectorAll(".moves button")
    .forEach((btn) =>
      btn.addEventListener("click", () => step(Number(btn.dataset.move))),
    );
  el("aboutBtn").addEventListener("click", () => el("aboutModal").showModal());
  el("closeAbout").addEventListener("click", () => el("aboutModal").close());

  // click the (z, n) coordinate to jump anywhere on the lattice
  const doJump = () => {
    if (jumpTo(el("jumpZ").value, el("jumpN").value)) el("jumpModal").close();
  };
  el("coord").addEventListener("click", () => {
    el("jumpZ").value = z.toString();
    el("jumpN").value = n.toString();
    el("jumpModal").showModal();
    el("jumpZ").focus();
    el("jumpZ").select();
  });
  el("goJump").addEventListener("click", doJump);
  el("closeJump").addEventListener("click", () => el("jumpModal").close());
  ["jumpZ", "jumpN"].forEach((id) =>
    el(id).addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doJump();
      }
    }),
  );
  el("historyBtn").addEventListener("click", () => {
    renderHistory();
    el("historyModal").showModal();
  });
  el("closeHistory").addEventListener("click", () => el("historyModal").close());
  el("copyLink").addEventListener("click", (ev) =>
    copyText(currentUrl(), ev.currentTarget, "copied!"),
  );
  el("hash").addEventListener("click", (ev) =>
    copyText(ev.currentTarget.dataset.full || "", ev.currentTarget),
  );
  el("copyBookLink").addEventListener("click", (ev) =>
    copyText(currentUrl(), ev.currentTarget, "copied!"),
  );
  el("bookModal").addEventListener("close", () => {
    currentBook = null;
    syncUrl();
  });
  el("export").addEventListener("click", exportJourney);
  el("reset").addEventListener("click", newWalk);

  // switching alphabet steps into a different library (same coordinate, new
  // text + new hash), so it starts a fresh walk there.
  el("alphabet").value = String(alphabetId);
  el("alphabet").addEventListener("change", (ev) => {
    alphabetId = Number(ev.target.value);
    trail = [];
    windowBuf = [];
    startedAt = new Date().toISOString();
    recordStep(null);
    persist();
    render();
  });
  el("closeBook").addEventListener("click", () => el("bookModal").close());
  el("saveMenu").addEventListener("change", (ev) => {
    const choice = ev.currentTarget.value;
    ev.currentTarget.selectedIndex = 0; // reset to the "save…" label
    if (choice === "txt") downloadBook();
    else if (choice === "img") {
      renderBookImage();
      if (!el("imageModal").open) el("imageModal").showModal();
    }
  });
  el("viewToggle").addEventListener("click", (ev) => {
    viewMode = viewMode === "color" ? "text" : "color";
    ev.currentTarget.textContent = viewMode === "color" ? "text" : "color";
    renderBookPage();
  });
  el("saveImage").addEventListener("click", saveBookImage);
  el("closeImage").addEventListener("click", () => el("imageModal").close());
  el("prevPage").addEventListener("click", () => turnPage(-1));
  el("nextPage").addEventListener("click", () => turnPage(1));
  el("goPage").addEventListener("click", jumpPage);
  el("pageJump").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      jumpPage();
    }
  });

  window.addEventListener("keydown", (e) => {
    // inside an open book, arrows turn pages instead of walking
    if (el("bookModal").open) {
      if (e.target === el("pageJump")) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        turnPage(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        turnPage(1);
      }
      return;
    }
    const map = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3 };
    if (e.key in map) {
      e.preventDefault();
      step(map[e.key]);
    }
  });
}

main().catch((err) => {
  document.getElementById("walls").innerHTML =
    `<div class="loading">failed to load: ${err}</div>`;
  console.error(err);
});
