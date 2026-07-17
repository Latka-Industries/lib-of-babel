// Babelgram: stamped PNG → locate → go / copy short handoff link.
// Photo: mosaic_find_book in a dedicated worker (main-thread fallback).

import { S, applyUniverseFromInput, syncLensControls } from "../gallery/state.js";
import {
  el,
  escapeHtml,
  copyText,
  findActionRow,
  wireFindActions,
  formatUniverseLabel,
  formatCoordDisplay,
  formatCoordFull,
  openModal,
} from "../lib/util.js";
import { t, getLocale } from "../lib/i18n.js";
import { buildAlphabetPalette, wireRollingPaletteSpin } from "../lib/color.js";
import {
  formatAlphabetSymbolLabel,
  PAGES_PER_BOOK,
  BOOK_CONTENT_SYMBOLS,
  alphabetCells,
} from "../lib/constants.js";
import { permalink, bookOpenShareUrl } from "../gallery/url.js";
import { encodeCoordParam, coordForWasm } from "../lib/coords.js";
import {
  readBabelMeta,
  readPngDims,
  parseBabelFilename,
  contentSeal,
  verifyBabelProof,
} from "../lib/png-babel.js";
import { kvSet } from "../lib/db.js";
import {
  book_image_dims,
  mosaic_project_preview,
  mosaic_babel_json,
  room_accent,
  node_hash_hex,
  get_universe,
  set_universe,
  alphabet_len,
} from "../lib/wasm.js";
import {
  mosaicFindBookAsync,
  cancelMosaicFind,
} from "./mosaic-find-pool.js";
import { PHOTO_SEARCH_TAB_ENABLED } from "./search.js";
import { createFindTrace } from "../lib/find-debug.js";

const BABEL_EMBED_KEY = (id) => `babel-embed:${id}`;
const BOOK_OPEN_KEY = (id) => `book-open:${id}`;

function newHandoffId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Same-browser handoff so paste truncation cannot drop &b=&img=1.
 * Optional `imageRgba` skips slow virgin `book_image` on open.
 * Stores compact `c…` z/n + `scope` — never megadigit decimals. */
async function stashBookOpen(
  hit,
  {
    universe = S.universeName,
    image = true,
    imageRgba = null,
    imageW = 0,
    imageH = 0,
    flat = null,
    scope = hit.scope || "book",
  } = {},
) {
  const id = newHandoffId();
  const payload = {
    z: encodeCoordParam(hit.z),
    n: encodeCoordParam(hit.n),
    b: Number(hit.book),
    a: hit.alphabet ?? S.alphabetId,
    u: universe ?? "",
    img: !!image,
    imageW: imageW || 0,
    imageH: imageH || 0,
    scope: scope === "page" ? "page" : "book",
  };
  if (typeof flat === "string" && flat.length) {
    // Letter grid from Find — source of truth for book text on open.
    payload.flat = flat;
  }
  if (imageRgba?.length) {
    // Own a JS copy before IDB clone (WASM getters already copy; stay defensive).
    payload.imageRgba =
      imageRgba instanceof Uint8Array
        ? imageRgba.slice()
        : new Uint8Array(imageRgba);
  }
  await kvSet(BOOK_OPEN_KEY(id), payload);
  return id;
}

/** @type {"photo"|"babel"} */
let mosaicMode = PHOTO_SEARCH_TAB_ENABLED ? "photo" : "babel";

/** @type {{ rgba: Uint8Array, w: number, h: number, srcW?: number, srcH?: number } | null} */
let reshaped = null;
/** Cache key for last ingest (mode + brightness/contrast). */
let ingestCacheKey = "";
/** @type {string | null} */
let sourceName = null;
/**
 * Per-tab results so photo / Babelgram do not share one output.
 * Photo: `{ hits|error|progress }`.
 * Babelgram: `{ hits, flat?, sameUniverse|error|progress }`.
 */
const modeResults = { photo: null, babel: null };
/** @type {ImageBitmap | null} */
let lastBitmap = null;
/** @type {{ u: bigint, name: string|null, a: number, z: bigint, n: bigint, b: number } | null} */
let babelMeta = null;
/** Soft parse of the upload filename (for confirmation UI). */
let babelNameMeta = null;
/**
 * Last locate proof frames for the compare wipe.
 * Babel: reproject = stamp mosaic; diff = `|upload − reproject|`.
 * Photo: reproject slot = virgin shelf; diff = `|projected − shelf|`.
 * @type {{ reprojectRgba: Uint8Array, diffRgba: Uint8Array, w: number, h: number, wipeOut?: Uint8Array, kind?: "photo"|"babel" } | null}
 */
let babelCompareFrames = null;
let babelCompareWired = false;

/** Live knob preview: coarse factor while dragging, sharper after settle. */
const PREVIEW_LIVE_FACTOR = 4;
const PREVIEW_SETTLE_FACTOR = 2;
const PREVIEW_SETTLE_MS = 90;
let previewRaf = 0;
let previewSettleTimer = 0;

function dims() {
  const d = book_image_dims();
  return { w: d[0], h: d[1] };
}

/** Room letter-colour accent for the hex you're in (same law as `book_image`). */
function letterAccentFromHere() {
  const a = room_accent(coordForWasm(S.z), coordForWasm(S.n), get_universe());
  return { hue: a[0], chroma: a[1], light: a[2] };
}

function readParams() {
  const babel = mosaicMode === "babel";
  // Letter colours = this gallery’s room accent (same law as Babelgram / book map).
  // Only brightness/contrast tweak the upload before mosaicing.
  const accent = letterAccentFromHere();
  return {
    hue: accent.hue,
    chroma: accent.chroma,
    light: accent.light,
    space: 0,
    dither: false,
    brightness: babel ? 0 : Number(el("mosaicBrightness")?.value ?? 0),
    contrast: babel ? 0 : Number(el("mosaicContrast")?.value ?? 0),
    paletteKind: 1,
  };
}

function applyBrightnessContrast(ctx, w, h, brightness, contrast) {
  if (!brightness && !contrast) return;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const b = (brightness / 100) * 255;
  const c = contrast / 100;
  const factor = (259 * (c * 255 + 255)) / (255 * (259 - c * 255));
  for (let i = 0; i < d.length; i += 4) {
    for (let k = 0; k < 3; k++) {
      let v = d[i + k];
      v = factor * (v - 128) + 128 + b;
      d[i + k] = Math.max(0, Math.min(255, Math.round(v)));
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Photo: stretch to book grid. Babel: require exact WxH, copy pixels 1:1.
 * @returns {{ ok: true, rgba: Uint8Array, w: number, h: number, srcW: number, srcH: number }
 *   | { ok: false, error: string }}
 */
function ingestBitmap(bitmap) {
  const { w, h } = dims();
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (mosaicMode === "babel") {
    if (bitmap.width !== w || bitmap.height !== h) {
      return {
        ok: false,
        error: t("search.babel.sizeMismatch", {
          sw: String(bitmap.width),
          sh: String(bitmap.height),
          w: String(w),
          h: String(h),
        }),
      };
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bitmap, 0, 0);
  } else {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const p = readParams();
    ctx.drawImage(bitmap, 0, 0, w, h);
    applyBrightnessContrast(ctx, w, h, p.brightness, p.contrast);
  }

  const data = ctx.getImageData(0, 0, w, h);
  return {
    ok: true,
    rgba: new Uint8Array(data.data),
    w,
    h,
    srcW: bitmap.width,
    srcH: bitmap.height,
  };
}

function paintCanvas(canvasEl, rgba, w, h, maxCss = 280) {
  if (!canvasEl || !rgba) return;
  const scale = Math.min(1, maxCss / Math.max(w, h));
  const dw = Math.max(1, Math.round(w * scale));
  const dh = Math.max(1, Math.round(h * scale));
  canvasEl.width = dw;
  canvasEl.height = dh;
  const ctx = canvasEl.getContext("2d");
  const img = ctx.createImageData(w, h);
  img.data.set(rgba);
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  off.getContext("2d").putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, dw, dh);
  ctx.drawImage(off, 0, 0, dw, dh);
}

/** Horizontal wipe: left of split = reproject, right = diff. t∈[0,1] moves the cut. */
function paintBabelCompareWipe(t) {
  const frames = babelCompareFrames;
  const canvasEl = el("babelCompareCanvas");
  if (!frames || !canvasEl) return;
  const { reprojectRgba, diffRgba, w, h } = frames;
  if (
    !reprojectRgba?.length ||
    !diffRgba?.length ||
    reprojectRgba.length !== diffRgba.length
  ) {
    return;
  }
  const u = Math.max(0, Math.min(1, Number(t) || 0));
  // Slider left = reproject, right = diff.
  const cut = Math.round((1 - u) * w);
  if (!frames.wipeOut || frames.wipeOut.length !== reprojectRgba.length) {
    frames.wipeOut = new Uint8Array(reprojectRgba.length);
  }
  const out = frames.wipeOut;
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      const i = row + x * 4;
      const src = x < cut ? reprojectRgba : diffRgba;
      out[i] = src[i];
      out[i + 1] = src[i + 1];
      out[i + 2] = src[i + 2];
      out[i + 3] = 255;
    }
  }
  // Hairline at the wipe edge so the cut stays visible on near-black diffs.
  if (cut > 0 && cut < w) {
    for (let y = 0; y < h; y++) {
      const i = (y * w + cut) * 4;
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = 255;
    }
  }
  paintCanvas(canvasEl, out, w, h, 420);
}

function ensureBabelCompareWired() {
  if (babelCompareWired) return;
  const range = el("babelCompareRange");
  if (!range) return;
  babelCompareWired = true;
  const onInput = () => paintBabelCompareWipe(Number(range.value) / 100);
  range.addEventListener("input", onInput);
  range.addEventListener("change", onInput);
}

function applyCompareDialogCopy(kind = "babel") {
  const photo = kind === "photo";
  const setText = (id, key) => {
    const node = el(id);
    if (!node) return;
    node.dataset.i18n = key;
    node.textContent = t(key);
  };
  setText(
    "babelCompareTitle",
    photo ? "search.mosaic.compare.title" : "search.babel.compare.title",
  );
  setText(
    "babelCompareHint",
    photo ? "search.mosaic.compare.hint" : "search.babel.compare.hint",
  );
  setText(
    "babelCompareResultLabel",
    photo ? "search.mosaic.compare.shelf" : "search.babel.compare.result",
  );
  setText(
    "babelCompareDiffLabel",
    photo ? "search.mosaic.compare.diff" : "search.babel.compare.diff",
  );
  const range = el("babelCompareRange");
  if (range) {
    const ariaKey = photo
      ? "search.mosaic.compare.sliderAria"
      : "search.babel.compare.sliderAria";
    range.dataset.i18nAriaLabel = ariaKey;
    range.setAttribute("aria-label", t(ariaKey));
  }
}

function openBabelCompare() {
  if (!babelCompareFrames) return;
  ensureBabelCompareWired();
  applyCompareDialogCopy(babelCompareFrames.kind || "babel");
  const range = el("babelCompareRange");
  // Start mid-wipe so both sides are obvious.
  if (range) range.value = "50";
  paintBabelCompareWipe(0.5);
  openModal("babelCompareModal");
}

function clearPreviewCanvases() {
  const o = el("mosaicOriginal");
  const p = el("mosaicPreview");
  if (o) {
    o.width = 1;
    o.height = 1;
  }
  if (p) {
    p.width = 1;
    p.height = 1;
  }
}

/** No-op kept for callers — photo Find always uses this gallery’s room accent. */
export function syncMosaicKnobsFromGallery() {
  paintFindPaletteStrip();
}

/** Apply photo vs babel copy / knobs visibility. */
export function syncMosaicModeUI(mode = mosaicMode) {
  const prev = mosaicMode;
  mosaicMode =
    mode === "babel" || !PHOTO_SEARCH_TAB_ENABLED ? "babel" : "photo";
  if (prev === "photo" && mosaicMode !== "photo") {
    cancelMosaicFind();
  }
  const babel = mosaicMode === "babel";
  document.querySelectorAll(".mosaic-photo-only").forEach((node) => {
    node.classList.toggle("hidden", babel);
  });
  el("mosaicCompare")?.classList.toggle("mosaic-compare-solo", babel);
  const size = findSizeVars();
  const slow = t("search.canTakeAFew");
  const setI18nText = (node, key, vars = {}) => {
    if (!node) return;
    node.dataset.i18n = key;
    delete node.dataset.i18nHtml;
    node.textContent = t(key, vars);
  };
  const setI18nHtml = (node, key, vars = {}) => {
    if (!node) return;
    node.dataset.i18nHtml = key;
    delete node.dataset.i18n;
    node.innerHTML = t(key, vars);
  };
  if (babel) {
    setI18nHtml(el("mosaicHonesty"), "search.babel.honesty", {
      go: t("search.go"),
      copy: t("actions.copy"),
    });
  } else {
    setI18nHtml(el("mosaicHonesty"), "search.mosaic.honesty", {
      find: t("search.mosaic.find"),
      go: t("search.go"),
      copy: t("actions.copy"),
    });
  }
  const photoHint = el("mosaicHint");
  const babelHint = el("mosaicHintBabel");
  if (photoHint) {
    photoHint.hidden = babel;
    photoHint.classList.toggle("hidden", babel);
    if (!babel) {
      setI18nHtml(photoHint, "search.hintMosaic", {
        ...size,
        find: t("search.find"),
        slow,
      });
    }
  }
  if (babelHint) {
    babelHint.hidden = !babel;
    babelHint.classList.toggle("hidden", !babel);
    if (babel) {
      setI18nText(babelHint, "search.hintBabel");
    }
  }
  setI18nText(
    el("mosaicUploadLabel"),
    babel ? "search.babel.upload" : "search.mosaic.upload",
  );
  setI18nText(
    el("mosaicOriginalCaption"),
    babel ? "search.babel.original" : "search.mosaic.original",
  );
  setI18nText(
    el("mosaicPaletteNote"),
    "search.mosaic.progressPalette",
  );
  const findBtn = el("mosaicFind");
  if (findBtn && !findBtn.disabled) {
    setI18nText(findBtn, babel ? "search.babel.find" : "search.mosaic.find");
  }
  const panel = el("searchPanel-mosaic");
  if (panel) {
    panel.setAttribute(
      "aria-labelledby",
      babel ? "searchTab-babel" : "searchTab-photo",
    );
  }
  const fileInput = el("mosaicFile");
  if (fileInput) {
    fileInput.accept = babel ? "image/png" : "image/png,image/*";
  }
  paintFindPaletteStrip();
  // Babel needs a stamped PNG. A leftover photo bitmap is not a failed Babelgram —
  // clear it so the empty state shows the grid hint, not "Not a Babelgram PNG".
  if (babel && !babelMeta && lastBitmap) {
    lastBitmap.close?.();
    lastBitmap = null;
    reshaped = null;
    ingestCacheKey = "";
    sourceName = "";
    babelNameMeta = null;
    if (fileInput) fileInput.value = "";
    clearPreviewCanvases();
  }
  if (lastBitmap) schedulePreview({ immediate: true });
  else updateFileMeta();
  paintModeResult();
}

/**
 * Stretch / BC ingest. Cached while brightness+contrast unchanged.
 * @returns {{ ok: true, rgba: Uint8Array, w: number, h: number, srcW: number, srcH: number, fresh: boolean }
 *   | { ok: false, error: string }}
 */
function ensureIngested() {
  if (!lastBitmap) {
    return { ok: false, error: t("search.mosaic.needImage") };
  }
  if (mosaicMode === "babel" && !babelMeta) {
    reshaped = null;
    ingestCacheKey = "";
    return { ok: false, error: t("search.babel.notBabel") };
  }
  const p = readParams();
  const key = `${mosaicMode}|${p.brightness}|${p.contrast}|${lastBitmap.width}x${lastBitmap.height}`;
  if (reshaped && ingestCacheKey === key) {
    return { ok: true, ...reshaped, fresh: false };
  }
  const ingested = ingestBitmap(lastBitmap);
  if (!ingested.ok) {
    reshaped = null;
    ingestCacheKey = "";
    return ingested;
  }
  reshaped = ingested;
  ingestCacheKey = key;
  return { ok: true, ...ingested, fresh: true };
}

/**
 * @param {{ factor?: number, dither?: boolean } | undefined} opts
 */
function refreshPreview(opts = {}) {
  if (!lastBitmap) return;
  const factor = opts.factor ?? PREVIEW_SETTLE_FACTOR;
  const ingested = ensureIngested();
  if (!ingested.ok) {
    el("mosaicFileMeta").textContent = ingested.error;
    el("mosaicFitPct").textContent = "";
    clearPreviewCanvases();
    return;
  }
  if (ingested.fresh) {
    paintCanvas(el("mosaicOriginal"), ingested.rgba, ingested.w, ingested.h);
  }
  updateFileMeta();

  // Babel exports are already library colour maps — no requantize / no preview edit.
  if (mosaicMode === "babel") {
    el("mosaicFitPct").textContent = "";
    return;
  }

  const p = readParams();
  const dither = opts.dither !== undefined ? opts.dither : p.dither;
  let img = null;
  try {
    img = mosaic_project_preview(
      ingested.rgba,
      S.alphabetId,
      p.hue,
      p.chroma,
      p.light,
      p.space,
      dither,
      p.paletteKind,
      factor,
    );
    paintCanvas(el("mosaicPreview"), img.pixels, img.width, img.height);
    const pct = el("mosaicFitPct");
    if (pct) pct.textContent = "";
  } catch (err) {
    console.error(err);
    const pct = el("mosaicFitPct");
    if (pct) pct.textContent = t("search.mosaic.previewError");
  } finally {
    img?.free?.();
  }
}

/** Coalesce rapid knob `input` into one coarse paint/frame; settle to sharper. */
function schedulePreview(opts = {}) {
  const immediate = opts.immediate === true;
  if (previewRaf) {
    cancelAnimationFrame(previewRaf);
    previewRaf = 0;
  }
  clearTimeout(previewSettleTimer);

  if (immediate) {
    refreshPreview({ factor: PREVIEW_SETTLE_FACTOR });
    return;
  }

  previewRaf = requestAnimationFrame(() => {
    previewRaf = 0;
    // Skip dither while dragging — Floyd–Steinberg dominates cost at any size.
    refreshPreview({ factor: PREVIEW_LIVE_FACTOR, dither: false });
  });
  previewSettleTimer = setTimeout(() => {
    refreshPreview({ factor: PREVIEW_SETTLE_FACTOR });
  }, PREVIEW_SETTLE_MS);
}

function formatOriginLine(meta) {
  if (!meta) return "";
  const seed = meta.u === 0n ? "0" : `0x${meta.u.toString(16)}`;
  const universe =
    meta.name != null
      ? formatUniverseLabel(meta.name)
      : t("search.babel.universeUnknown", { seed });
  return t("search.babel.originLine", {
    universe,
    u: seed,
    coords: formatCoordDisplay(meta.z, meta.n),
    book: String(Number(meta.b) + 1),
    alphabet: formatAlphabetSymbolLabel(meta.a, t),
  });
}

function updateFileMeta() {
  const meta = el("mosaicFileMeta");
  if (!meta) return;
  const { w, h } = dims();
  if (!lastBitmap) {
    meta.textContent =
      mosaicMode === "babel"
        ? t("search.babel.gridHint", { w: String(w), h: String(h) })
        : t("search.mosaic.gridHint", { w: String(w), h: String(h) });
    return;
  }
  if (mosaicMode === "babel" && !babelMeta) {
    meta.textContent = t("search.babel.notBabel");
    return;
  }
  if (!reshaped) return;
  if (mosaicMode === "babel") {
    const bits = [
      t("search.babel.fileMeta", {
        name: sourceName || "image",
        w: String(w),
        h: String(h),
      }),
      babelMeta.version === 3
        ? t("search.babel.stampV3")
        : babelMeta.version === 2
          ? t("search.babel.stampV2")
          : t("search.babel.stampV1"),
      formatOriginLine(babelMeta),
    ];
    if (
      babelNameMeta &&
      (babelNameMeta.u !== babelMeta.u ||
        encodeCoordParam(babelNameMeta.z) !== encodeCoordParam(babelMeta.z) ||
        encodeCoordParam(babelNameMeta.n) !== encodeCoordParam(babelMeta.n) ||
        babelNameMeta.b !== babelMeta.b ||
        babelNameMeta.a !== babelMeta.a)
    ) {
      bits.push(t("search.babel.nameMismatch"));
    }
    meta.textContent = bits.filter(Boolean).join(" · ");
  } else {
    meta.textContent = t("search.mosaic.fileMeta", {
      name: sourceName || "image",
      sw: String(reshaped.srcW ?? lastBitmap.width),
      sh: String(reshaped.srcH ?? lastBitmap.height),
      w: String(w),
      h: String(h),
    });
  }
}

async function onFileChosen(file) {
  if (!file) return;
  sourceName = file.name || "image";
  babelMeta = null;
  babelNameMeta = parseBabelFilename(sourceName);
  reshaped = null;
  ingestCacheKey = "";

  // Stamped book-image PNG → Babelgram tab (auto-switch from photo / any mosaic tab).
  try {
    const buf = await file.arrayBuffer();
    const stamped = await readBabelMeta(buf);
    if (stamped) {
      babelMeta = stamped;
      modeResults.babel = null;
      if (mosaicMode !== "babel") {
        selectSearchTab("babel");
        syncMosaicModeUI("babel");
      } else {
        paintModeResult();
      }
      const pngDims = readPngDims(buf);
      const { w, h } = dims();
      const exactGrid =
        pngDims != null && pngDims.w === w && pngDims.h === h;
      if (!exactGrid) {
        if (lastBitmap) lastBitmap.close?.();
        lastBitmap = null;
        el("mosaicFileMeta").textContent = t("search.babel.sizeMismatch", {
          sw: String(pngDims?.w ?? "?"),
          sh: String(pngDims?.h ?? "?"),
          w: String(w),
          h: String(h),
        });
        clearPreviewCanvases();
        return;
      }
    } else {
      babelMeta = null;
      modeResults[mosaicMode] = null;
      paintModeResult();
      if (mosaicMode === "babel") {
        if (lastBitmap) lastBitmap.close?.();
        lastBitmap = null;
        el("mosaicFileMeta").textContent = t("search.babel.notBabel");
        clearPreviewCanvases();
        return;
      }
    }
  } catch (err) {
    console.error(err);
    babelMeta = null;
    modeResults[mosaicMode] = null;
    paintModeResult();
    if (mosaicMode === "babel") {
      el("mosaicFileMeta").textContent = t("search.babel.notBabel");
      clearPreviewCanvases();
      return;
    }
  }

  try {
    if (lastBitmap) lastBitmap.close?.();
    lastBitmap = await createImageBitmap(file);
  } catch (err) {
    console.error(err);
    el("mosaicFileMeta").textContent = t("search.mosaic.badImage");
    reshaped = null;
    ingestCacheKey = "";
    return;
  }
  schedulePreview({ immediate: true });
}

/** Hex list for the live letter mosaic palette (same as the strip). */
function findPaletteHexes(accent = null, alphabetId = S.alphabetId) {
  try {
    const a = accent || letterAccentFromHere();
    const alpha = alphabetCells(alphabetId);
    if (!alpha?.length) return [];
    return buildAlphabetPalette(alpha, a.hue, a.chroma, a.light);
  } catch {
    return [];
  }
}

function wireFindProgressSpin(root) {
  const spin = root?.querySelector?.(".find-progress-spin");
  if (!spin) return;
  wireRollingPaletteSpin(spin, findPaletteHexes());
}

/**
 * Alphabet colours as a CSS linear gradient.
 * @param {{ hue: number, chroma: number, light: number } | null} accent
 * @param {number} alphabetId
 */
function findPaletteGradientCss(accent = null, alphabetId = S.alphabetId) {
  try {
    const a = accent || letterAccentFromHere();
    const alpha = alphabetCells(alphabetId);
    if (!alpha?.length) return "";
    const palette = buildAlphabetPalette(alpha, a.hue, a.chroma, a.light);
    if (!palette.length) return "";
    if (palette.length === 1) {
      return `linear-gradient(90deg, ${palette[0]} 0%, ${palette[0]} 100%)`;
    }
    // Cap stops so huge lenses (thousands of glyphs) stay cheap to paint.
    const maxStops = 96;
    const step = Math.max(1, Math.ceil(palette.length / maxStops));
    const sampled = [];
    for (let i = 0; i < palette.length; i += step) sampled.push(palette[i]);
    if (sampled[sampled.length - 1] !== palette[palette.length - 1]) {
      sampled.push(palette[palette.length - 1]);
    }
    const stops = sampled.map((hex, i) => {
      const pct = (i / (sampled.length - 1)) * 100;
      return `${hex} ${pct.toFixed(2)}%`;
    });
    return `linear-gradient(90deg, ${stops.join(", ")})`;
  } catch (err) {
    console.warn("find palette gradient failed", err);
    return "";
  }
}

/** Room accent for a hit gallery (same universe as the search). */
function letterAccentForHit(hit) {
  try {
    if (
      hit &&
      typeof hit.hue === "number" &&
      typeof hit.chroma === "number" &&
      typeof hit.light === "number"
    ) {
      return { hue: hit.hue, chroma: hit.chroma, light: hit.light };
    }
    const a = room_accent(
      coordForWasm(hit.z),
      coordForWasm(hit.n),
      get_universe(),
    );
    return { hue: a[0], chroma: a[1], light: a[2] };
  } catch {
    return letterAccentFromHere();
  }
}

/** Paint the alphabet palette strip (photo tab — under the Find copy). */
export function paintFindPaletteStrip() {
  const block = el("mosaicPaletteBlock");
  const strip = el("mosaicPaletteStrip");
  const note = el("mosaicPaletteNote");
  const photo = mosaicMode === "photo" && PHOTO_SEARCH_TAB_ENABLED;
  if (block) {
    block.hidden = !photo;
    block.classList.toggle("hidden", !photo);
  }
  if (!photo || !strip) return;
  const label = t("search.mosaic.progressPalette");
  if (note) note.textContent = label;
  strip.setAttribute("aria-label", label);
  const grad = findPaletteGradientCss();
  strip.style.backgroundImage = grad || "none";
  strip.style.backgroundColor = grad ? "transparent" : "";
}

function setModeResult(payload) {
  modeResults[mosaicMode] = payload;
  paintModeResult();
}

function paintModeResult() {
  const box = el("mosaicResult");
  if (!box) return;
  const payload = modeResults[mosaicMode];
  if (!payload) {
    babelCompareFrames = null;
    box.innerHTML = "";
    box.classList.remove("show");
    return;
  }
  if (payload.progressPhase || payload.progress) {
    babelCompareFrames = null;
    const phase = payload.progressPhase || "invert";
    const base = payload.progress || findProgressText(phase);
    // Palette strip lives under the Find row (always visible in photo mode).
    paintFindPaletteStrip();
    const existing = box.querySelector(".find-progress");
    if (existing) {
      const label = existing.querySelector(".find-progress-label");
      if (label) label.textContent = base;
      wireFindProgressSpin(existing);
      box.classList.add("show");
      return;
    }
    box.innerHTML = `<div class="find-progress">
      <div class="find-progress-row">
        <span class="find-progress-label">${escapeHtml(base)}</span>
        <span class="find-progress-track" aria-hidden="true">
          <span class="find-progress-run">
            <span class="find-progress-spin"></span>
          </span>
        </span>
      </div>
    </div>`;
    wireFindProgressSpin(box);
    box.classList.add("show");
    return;
  }
  if (payload.error) {
    babelCompareFrames = null;
    box.innerHTML = `<p class="find-dim search-error">${escapeHtml(payload.error)}</p>`;
    box.classList.add("show");
    return;
  }
  if (mosaicMode === "babel" && payload.hits) {
    paintBabelHits(box, payload.hits, !!payload.sameUniverse, payload.flat || null, {
      seal: payload.seal || null,
      verify: payload.verify || null,
      reprojectRgba: payload.reprojectRgba || null,
      diffRgba: payload.diffRgba || null,
      diffW: payload.diffW || 0,
      diffH: payload.diffH || 0,
    });
    return;
  }
  if (mosaicMode === "photo" && payload.hits) {
    paintPhotoHits(box, payload.hits, {
      flat: payload.flat || null,
      bookRgba: payload.bookRgba || null,
      mosaicRgba: payload.mosaicRgba || null,
      diffRgba: payload.diffRgba || null,
      diffW: payload.diffW || 0,
      diffH: payload.diffH || 0,
      elapsedMs: payload.elapsedMs,
    });
    return;
  }
  box.innerHTML = "";
  box.classList.remove("show");
}

function yieldToUi() {
  return new Promise((resolve) => {
    if (typeof scheduler !== "undefined" && scheduler.yield) {
      scheduler.yield().then(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/** Size labels for Find progress / honesty (`{pages}`, `{cells}`, `{mbit}`). */
function findSizeVars(alphabetId = S.alphabetId) {
  let alphaLen = 0;
  try {
    alphaLen = Number(alphabet_len(alphabetId)) || 0;
  } catch {
    alphaLen = 0;
  }
  if (!alphaLen) {
    try {
      alphaLen = alphabetCells(alphabetId)?.length || 29;
    } catch {
      alphaLen = 29;
    }
  }
  const bits = BOOK_CONTENT_SYMBOLS * Math.log2(Math.max(2, alphaLen));
  const mbit = (bits / 1e6).toFixed(1);
  // Decimal magnitude of a B-bit integer: ~10^(B · log10 2).
  const log10 = bits * Math.log10(2);
  const exp = Math.round(log10);
  return {
    pages: String(PAGES_PER_BOOK),
    cells: BOOK_CONTENT_SYMBOLS.toLocaleString(getLocale()),
    mbit: `≈${mbit}`,
    mag: `≈10^${exp.toLocaleString(getLocale())}`,
  };
}

function findProgressText(phase) {
  const key =
    phase === "project"
      ? "search.mosaic.progressProject"
      : phase === "warm"
        ? "search.mosaic.progressWarm"
        : phase === "construct"
          ? "search.mosaic.progressConstruct"
          : phase === "score"
            ? "search.mosaic.progressScoreProof"
            : "search.mosaic.progressInvert";
  if (phase === "warm") {
    return t(key, { slow: t("search.canTakeAFew") });
  }
  return t(key);
}

/** Human elapsed for Find results (`took 4m 57s`). */
function formatFindElapsed(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return t("search.mosaic.elapsedSec", { n: String(sec) });
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return t("search.mosaic.elapsedMinSec", { m: String(m), s: String(s) });
}

/**
 * Letter mosaic → book-linked invert → proof RGBA.
 * Runs in a dedicated WASM worker so the UI thread stays responsive;
 * falls back to main-thread WASM if workers are unavailable.
 */
function runPhotoCandidates(modeAtStart, findBtn) {
  void (async () => {
    const t0 = performance.now();
    const uiTrace = createFindTrace("ui", {
      alphabetId: S.alphabetId,
      ...findSizeVars(),
      rgbaBytes: reshaped?.rgba?.byteLength ?? 0,
    });
    try {
      if (mosaicMode !== modeAtStart || !reshaped) return;
      applyUniverseFromInput(el("universe")?.value);
      const p = readParams();
      const universe = get_universe();

      setModeResult({ progressPhase: "project" });
      uiTrace.phase("project", { universe: String(universe) });
      if (findBtn) findBtn.textContent = t("search.mosaic.searching");
      await yieldToUi();
      if (mosaicMode !== modeAtStart) return;

      let located;
      try {
        uiTrace.phase("await-pool");
        located = await mosaicFindBookAsync(
          reshaped.rgba,
          S.alphabetId,
          p.hue,
          p.chroma,
          p.light,
          universe,
          {
            onProgress: (phase) => {
              if (mosaicMode !== modeAtStart) return;
              uiTrace.note(`ui progress: ${phase}`);
              setModeResult({ progressPhase: phase });
            },
          },
        );
      } catch (err) {
        const msg = typeof err === "string" ? err : err?.message || String(err);
        if (/cancelled/i.test(msg)) {
          uiTrace.fail(err);
          return;
        }
        uiTrace.fail(err);
        setModeResult({ error: msg || t("search.mosaic.noHits") });
        return;
      }
      if (mosaicMode !== modeAtStart) return;

      let decoded;
      try {
        decoded = JSON.parse(located.resultsJson);
      } catch {
        uiTrace.fail("results JSON parse failed");
        setModeResult({ error: t("search.mosaic.noHits") });
        return;
      }
      const hit = decoded?.results?.[0];
      if (!decoded?.ok || !hit || !located.bookRgba?.length || !located.flat) {
        uiTrace.fail(decoded?.error || "no hit / missing proof");
        setModeResult({
          error: decoded?.error || t("search.mosaic.noHits"),
        });
        return;
      }

      const elapsedMs = performance.now() - t0;
      uiTrace.done({
        book: hit.book,
        flatLen: located.flat.length,
        w: located.width,
        h: located.height,
        elapsedMs: Math.round(elapsedMs),
      });
      setModeResult({
        hits: [{ ...hit, alphabet: hit.alphabet ?? S.alphabetId }],
        flat: located.flat,
        bookRgba: located.bookRgba,
        mosaicRgba: located.mosaicRgba || null,
        diffRgba: located.diffRgba,
        diffW: located.width,
        diffH: located.height,
        elapsedMs,
      });
    } catch (err) {
      console.error(err);
      uiTrace.fail(err);
      if (mosaicMode === modeAtStart) {
        setModeResult({ error: t("search.error.unknown") });
      }
    } finally {
      if (findBtn) {
        findBtn.disabled = false;
        findBtn.textContent = t("search.mosaic.find");
      }
    }
  })();
}

/** Full address fallback when IndexedDB handoff is unavailable. */
function photoPermalink(hit) {
  const zW = coordForWasm(hit.z);
  const nW = coordForWasm(hit.n);
  const alphabet = hit.alphabet ?? S.alphabetId;
  const hash = node_hash_hex(zW, nW);
  return permalink(zW, nW, hash, alphabet, Number(hit.book), 1, S.universeName, null, {
    image: true,
  });
}

/** Prefer short `&bo=` share — full Basile z/n blow past clipboard / paste limits. */
async function photoShareUrl(hit, proof = {}) {
  const d = dims();
  const bookOpenId = await stashBookOpen(hit, {
    flat: proof.flat || null,
    imageRgba: proof.bookRgba || null,
    imageW: proof.diffW || d.w,
    imageH: proof.diffH || d.h,
  });
  return bookOpenShareUrl(bookOpenId, {
    book: hit.book,
    image: true,
    alpha: hit.alphabet ?? S.alphabetId,
  });
}

async function goToPhotoHit(hit, proof = {}) {
  if (!hit) return;
  const box = el("findResults");
  const prev = box?.querySelector(".find-busy");
  if (prev) prev.remove();
  const busy = document.createElement("p");
  busy.className = "find-dim find-busy";
  busy.textContent = t("search.mosaic.handoff");
  box?.prepend(busy);
  try {
    await yieldToUi();
    const url = await photoShareUrl(hit, proof);
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (err) {
    console.error(err);
    try {
      window.open(photoPermalink(hit), "_blank", "noopener,noreferrer");
    } catch (err2) {
      console.error(err2);
    }
  } finally {
    busy.remove();
  }
}

function paintPhotoHits(box, hits, proof = {}) {
  const hit = hits?.[0];
  if (!hit) {
    box.innerHTML = `<p class="find-dim search-error">${escapeHtml(
      t("search.mosaic.noHits"),
    )}</p>`;
    box.classList.add("show");
    return;
  }
  const canCompare = !!(
    proof.bookRgba?.length &&
    proof.diffRgba?.length &&
    proof.diffW &&
    proof.diffH &&
    proof.bookRgba.length === proof.diffRgba.length
  );
  const elapsed = formatFindElapsed(proof.elapsedMs);
  const intro = elapsed
    ? `${t("search.mosaic.resultsIntroBest")} · ${elapsed}`
    : t("search.mosaic.resultsIntroBest");
  const { rms, mae, corr, isExact } = formatMetricTriplet(hit);
  const exact = isExact
    ? `<span class="mosaic-hit-ok" tabindex="0" data-tip="${escapeHtml(
        t("search.mosaic.tip.exactOk"),
      )}">${escapeHtml(t("search.mosaic.exactOk"))}</span>`
    : "";
  const label = !isExact && hit.label
    ? `<span class="mosaic-hit-label">${escapeHtml(hit.label)}</span>`
    : "";
  const metrics = `<span class="mosaic-hit-metrics">
        <span class="mosaic-hit-metric" role="note" tabindex="0" data-tip="${escapeHtml(
          t("search.mosaic.tip.rms"),
        )}">${escapeHtml(t("search.babel.metric.rms", { n: rms }))}</span>
        <span class="mosaic-hit-metric" role="note" tabindex="0" data-tip="${escapeHtml(
          t("search.mosaic.tip.mae"),
        )}">${escapeHtml(t("search.babel.metric.mae", { n: mae }))}</span>
        <span class="mosaic-hit-metric" role="note" tabindex="0" data-tip="${escapeHtml(
          t("search.mosaic.tip.corr"),
        )}">${escapeHtml(t("search.babel.metric.corr", { n: corr }))}</span>
      </span>`;
  const thumbRgba = proof.bookRgba?.length
    ? proof.bookRgba
    : proof.mosaicRgba?.length
      ? proof.mosaicRgba
      : null;
  const thumbHtml = thumbRgba
    ? `<div class="mosaic-hit-thumbs">
        <div class="mosaic-hit-thumb-wrap">
          <canvas class="mosaic-hit-thumb mosaic-hit-thumb-found" width="72" height="58" aria-label="${escapeHtml(
            t("search.mosaic.thumbMosaicAlt"),
          )}"></canvas>
          <span class="mosaic-hit-thumb-cap">${escapeHtml(t("search.mosaic.thumbMosaic"))}</span>
        </div>
      </div>`
    : "";
  box.innerHTML = `<p class="find-dim">${escapeHtml(intro)}</p>
    <div class="mosaic-hit" data-i="0">
      ${thumbHtml}
      <div class="mosaic-hit-body">
        <div class="mosaic-hit-main">
          ${metrics}
          ${label}
          ${exact}
        </div>
        <div class="find-dim" title="${escapeHtml(formatCoordFull(hit.z, hit.n))}">${escapeHtml(
          t("search.result.gallery", {
            coords: formatCoordDisplay(hit.z, hit.n),
          }),
        )} · ${escapeHtml(
          t("search.mosaic.hitBook", { book: String(Number(hit.book) + 1) }),
        )} · ${escapeHtml(formatAlphabetSymbolLabel(hit.alphabet ?? S.alphabetId, t))}</div>
        ${findActionRow([
          { id: "go", label: t("search.go") },
          { id: "link", label: t("actions.copy") },
          ...(canCompare
            ? [{ id: "diff", label: t("search.mosaic.compare.checkDiff") }]
            : []),
        ]).replace(
          'class="find-row find-actions"',
          'class="find-row find-actions" data-i="0"',
        )}
        <div class="mosaic-palette-block mosaic-hit-palette">
          <p class="find-dim mosaic-palette-note">${escapeHtml(
            t("search.mosaic.resultPalette"),
          )}</p>
          <div
            class="find-palette-gradient mosaic-hit-palette-strip"
            role="img"
            aria-label="${escapeHtml(t("search.mosaic.resultPalette"))}"
          ></div>
        </div>
      </div>
    </div>`;
  box.classList.add("show");
  babelCompareFrames = canCompare
    ? {
        reprojectRgba: proof.bookRgba,
        diffRgba: proof.diffRgba,
        w: proof.diffW,
        h: proof.diffH,
        kind: "photo",
      }
    : null;
  const row = box.querySelector(".mosaic-hit");
  const foundThumb = row?.querySelector("canvas.mosaic-hit-thumb-found");
  if (foundThumb && thumbRgba && proof.diffW && proof.diffH) {
    paintCanvas(foundThumb, thumbRgba, proof.diffW, proof.diffH, 72);
  }
  const hitStrip = row?.querySelector(".mosaic-hit-palette-strip");
  if (hitStrip) {
    const hitAccent = letterAccentForHit(hit);
    const hitAlpha = hit.alphabet ?? S.alphabetId;
    const grad = findPaletteGradientCss(hitAccent, hitAlpha);
    hitStrip.style.backgroundImage = grad || "none";
    hitStrip.style.backgroundColor = grad ? "transparent" : "";
  }
  const handlers = {
    go: () => {
      void goToPhotoHit(hit, proof);
    },
    link: (_ev, btn) => {
      void (async () => {
        const box = el("findResults");
        const busy = document.createElement("p");
        busy.className = "find-dim find-busy";
        busy.textContent = t("search.mosaic.handoff");
        box?.prepend(busy);
        try {
          await yieldToUi();
          await copyText(await photoShareUrl(hit, proof), btn, t("common.copied"));
        } catch (err) {
          console.error(err);
          try {
            await copyText(photoPermalink(hit), btn, t("common.copied"));
          } catch (err2) {
            console.error(err2);
          }
        } finally {
          busy.remove();
        }
      })();
    },
  };
  if (canCompare) {
    handlers.diff = () => openBabelCompare();
  }
  if (row) wireFindActions(row, handlers);
}

function formatMetricTriplet(r) {
  const pctNum = Number(r.percent);
  const maeNum = Number(r.mae);
  const corrNum = Number(r.corr);
  const rms = pctNum.toLocaleString(getLocale(), {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  const mae = Number.isFinite(maeNum)
    ? maeNum.toLocaleString(getLocale(), {
        maximumFractionDigits: 3,
        minimumFractionDigits: 3,
      })
    : "—";
  const corr = Number.isFinite(corrNum)
    ? corrNum.toLocaleString(getLocale(), {
        maximumFractionDigits: 4,
        minimumFractionDigits: 4,
      })
    : "—";
  const isExact =
    pctNum >= 99.9 &&
    Number.isFinite(maeNum) &&
    maeNum < 0.5 &&
    Number.isFinite(corrNum) &&
    corrNum >= 0.999;
  return { rms, mae, corr, isExact };
}

/** Full address fallback when IndexedDB handoff is unavailable. */
function babelPermalink(hit, { sameUniverse = false, embedId = null } = {}) {
  const zW = coordForWasm(hit.z);
  const nW = coordForWasm(hit.n);
  const hash = node_hash_hex(zW, nW);
  // Prefer stamped export name on same-universe round-trip; else current session.
  const uni =
    sameUniverse && babelMeta?.name != null ? babelMeta.name : S.universeName;
  return permalink(zW, nW, hash, hit.alphabet, Number(hit.book), 1, uni, null, {
    image: true,
    embedId,
  });
}

async function stashBabelEmbed({ flat, pageSpan, imageRgba, imageW, imageH }) {
  const id = newHandoffId();
  await kvSet(BABEL_EMBED_KEY(id), {
    flat,
    pageSpan,
    imageRgba, // Uint8Array — structured-clone into IndexedDB
    imageW,
    imageH,
  });
  return id;
}

/** Short SHA-256 of the decoded flat — identity check when mosaics look like noise. */
// contentSeal imported from png-babel.js

function paintBabelHits(box, hits, sameUniverse, flat, proof = {}) {
  if (!hits?.length) {
    box.innerHTML = `<p class="find-dim search-error">${escapeHtml(
      t("search.mosaic.noText"),
    )}</p>`;
    box.classList.add("show");
    return;
  }
  const seed =
    BigInt(get_universe()) === 0n
      ? "0"
      : `0x${BigInt(get_universe()).toString(16)}`;
  const universeLabel =
    sameUniverse && babelMeta?.name != null
      ? formatUniverseLabel(babelMeta.name)
      : formatUniverseLabel(S.universeName);
  const intro = t(
    sameUniverse
      ? "search.babel.resultsIntroSame"
      : "search.babel.resultsIntroOther",
    {
      universe: universeLabel,
      seed,
    },
  );
  const verify = proof.verify || { sealed: false, ok: null };
  let verifyLine = "";
  if (verify.sealed && verify.ok) {
    verifyLine = `<div class="find-dim mosaic-hit-ok">${escapeHtml(
      t("search.babel.verifyOk"),
    )}</div>`;
  } else if (verify.sealed && verify.ok === false) {
    verifyLine = `<div class="find-dim search-error">${escapeHtml(
      t("search.babel.verifyFail"),
    )}</div>`;
  } else {
    verifyLine = `<div class="find-dim">${escapeHtml(
      t("search.babel.verifyLegacy"),
    )}</div>`;
  }
  const sealLine = proof.seal
    ? `<div class="find-dim mosaic-hit-seal">${escapeHtml(
        t("search.babel.seal", { seal: proof.seal }),
      )}</div>`
    : "";
  const canCompare = !!(
    proof.reprojectRgba?.length &&
    proof.diffRgba?.length &&
    proof.diffW &&
    proof.diffH &&
    proof.reprojectRgba.length === proof.diffRgba.length
  );
  /** Trust stamp coords only when sealed proof passes (or legacy unsealed). */
  const trustStamp = !verify.sealed || verify.ok === true;
  const rows = hits
    .map((r, i) => {
      const { rms, mae, corr, isExact } = formatMetricTriplet(r);
      const showExact = isExact && trustStamp && (sameUniverse ? verify.ok !== false : true);
      const exact = showExact
        ? `<span class="mosaic-hit-ok" tabindex="0" data-tip="${escapeHtml(
            t("search.babel.tip.exactOk"),
          )}">${escapeHtml(t("search.babel.exactOk"))}</span>`
        : "";
      const label = !showExact && r.label
        ? `<span class="mosaic-hit-label">${escapeHtml(r.label)}</span>`
        : "";
      const metrics = `<span class="mosaic-hit-metrics">
            <span class="mosaic-hit-metric" role="note" tabindex="0" data-tip="${escapeHtml(
              t("search.babel.tip.rms"),
            )}">${escapeHtml(t("search.babel.metric.rms", { n: rms }))}</span>
            <span class="mosaic-hit-metric" role="note" tabindex="0" data-tip="${escapeHtml(
              t("search.babel.tip.mae"),
            )}">${escapeHtml(t("search.babel.metric.mae", { n: mae }))}</span>
            <span class="mosaic-hit-metric" role="note" tabindex="0" data-tip="${escapeHtml(
              t("search.babel.tip.corr"),
            )}">${escapeHtml(t("search.babel.metric.corr", { n: corr }))}</span>
          </span>`;
      const actions = trustStamp
        ? findActionRow([
            { id: "go", label: t("search.go") },
            { id: "link", label: t("actions.copy") },
            ...(canCompare
              ? [{ id: "diff", label: t("search.babel.compare.checkDiff") }]
              : []),
          ]).replace(
            'class="find-row find-actions"',
            `class="find-row find-actions" data-i="${i}"`,
          )
        : `<p class="find-dim search-error">${escapeHtml(t("search.babel.verifyBlocked"))}</p>${
            canCompare
              ? findActionRow([
                  { id: "diff", label: t("search.babel.compare.checkDiff") },
                ]).replace(
                  'class="find-row find-actions"',
                  `class="find-row find-actions" data-i="${i}"`,
                )
              : ""
          }`;
      return `<div class="mosaic-hit" data-i="${i}">
        <div class="mosaic-hit-thumbs">
          <div class="mosaic-hit-thumb-wrap">
            <canvas class="mosaic-hit-thumb mosaic-hit-thumb-src" width="72" height="58" aria-label="${escapeHtml(
              t("search.babel.thumbAlt"),
            )}"></canvas>
          </div>
        </div>
        <div class="mosaic-hit-body">
          <div class="mosaic-hit-main">
            ${metrics}
            ${label}
            ${exact}
          </div>
          <div class="find-dim" title="${escapeHtml(formatCoordFull(r.z, r.n))}">${escapeHtml(
            t("search.result.gallery", {
              coords: formatCoordDisplay(r.z, r.n),
            }),
          )} · ${escapeHtml(
            t("search.mosaic.hitBook", { book: String(Number(r.book) + 1) }),
          )} · ${escapeHtml(formatAlphabetSymbolLabel(r.alphabet, t))}</div>
          ${verifyLine}
          ${sealLine}
          ${actions}
        </div>
      </div>`;
    })
    .join("");
  box.innerHTML = `<p class="find-dim">${escapeHtml(intro)}</p>${rows}`;
  box.classList.add("show");
  babelCompareFrames = canCompare
    ? {
        reprojectRgba: proof.reprojectRgba,
        diffRgba: proof.diffRgba,
        w: proof.diffW,
        h: proof.diffH,
        kind: "babel",
      }
    : null;
  box.querySelectorAll(".mosaic-hit").forEach((row) => {
    const i = Number(row.dataset.i);
    const hit = hits[i];
    const srcThumb = row.querySelector("canvas.mosaic-hit-thumb-src");
    if (srcThumb && reshaped?.rgba) {
      paintCanvas(srcThumb, reshaped.rgba, reshaped.w, reshaped.h, 72);
    }
    const handlers = {};
    if (trustStamp) {
      handlers.go = () => {
        void goToBabelHit(hit, sameUniverse, flat);
      };
      handlers.link = (_ev, btn) => {
        void (async () => {
          try {
            await copyText(
              await babelShareUrl(hit, { sameUniverse, flat }),
              btn,
              t("common.copied"),
            );
          } catch (err) {
            console.error(err);
            try {
              await copyText(
                babelPermalink(hit, { sameUniverse }),
                btn,
                t("common.copied"),
              );
            } catch (err2) {
              console.error(err2);
            }
          }
        })();
      };
    }
    if (canCompare) {
      handlers.diff = () => {
        openBabelCompare();
      };
    }
    if (Object.keys(handlers).length) wireFindActions(row, handlers);
  });
}

async function babelShareUrl(
  hit,
  { sameUniverse = false, embedId = null, flat = null } = {},
) {
  const uni =
    sameUniverse && babelMeta?.name != null ? babelMeta.name : S.universeName;
  // Cache upload pixels + locate flat so open/save can seal without re-projecting
  // (upload was painted with the export gallery’s accent, not the destination’s).
  const bookOpenId = await stashBookOpen(hit, {
    universe: uni,
    imageRgba: reshaped?.rgba || null,
    imageW: reshaped?.w || 0,
    imageH: reshaped?.h || 0,
    flat: typeof flat === "string" && flat.length ? flat : null,
    scope:
      hit.scope === "page" || hit.scope === "book"
        ? hit.scope
        : babelMeta?.scope === "page"
          ? "page"
          : "book",
  });
  // Prefer short handoff — full Basile address is multi-KB.
  let url = bookOpenShareUrl(bookOpenId, {
    book: hit.book,
    image: true,
    alpha: hit.alphabet ?? S.alphabetId,
  });
  // Other-universe print payload still needs &be= on the short link.
  if (embedId) url += `&be=${encodeURIComponent(embedId)}`;
  return url;
}

async function goToBabelHit(hit, sameUniverse = false, flat = null) {
  if (!hit) return;
  try {
    let embedId = null;
    if (!sameUniverse) {
      if (!flat || !reshaped?.rgba) return;
      embedId = await stashBabelEmbed({
        flat,
        pageSpan: Number(hit.page_span) || 1,
        imageRgba: reshaped.rgba,
        imageW: reshaped.w,
        imageH: reshaped.h,
      });
    }
    window.open(
      await babelShareUrl(hit, { sameUniverse, embedId, flat }),
      "_blank",
      "noopener,noreferrer",
    );
  } catch (err) {
    console.error(err);
    try {
      window.open(
        babelPermalink(hit, { sameUniverse }),
        "_blank",
        "noopener,noreferrer",
      );
    } catch (err2) {
      console.error(err2);
    }
  }
}

/** Clear photo + babel result caches (e.g. when opening search fresh). */
export function clearMosaicResults() {
  modeResults.photo = null;
  modeResults.babel = null;
  babelCompareFrames = null;
  paintModeResult();
}

async function runBabelLocate(modeAtStart, findBtn) {
  try {
    if (mosaicMode !== modeAtStart || !babelMeta) return;
    applyUniverseFromInput(el("universe")?.value);
    const alphabetId = babelMeta.a;
    if (alphabetId !== S.alphabetId) {
      S.alphabetId = alphabetId;
      syncLensControls();
    }
    const accent = room_accent(
      coordForWasm(babelMeta.z),
      coordForWasm(babelMeta.n),
      babelMeta.u,
    );
    await yieldToUi();
    let locate;
    try {
      locate = mosaic_babel_json(
        reshaped.rgba,
        alphabetId,
        accent[0],
        accent[1],
        accent[2],
      );
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || String(err);
      setModeResult({ error: msg || t("search.mosaic.noText") });
      return;
    }
    if (mosaicMode !== modeAtStart) {
      locate?.free?.();
      return;
    }
    const flat = locate.flat;
    const resultsJson = locate.results_json;
    const reprojectRgba = locate.reproject_pixels;
    const diffRgba = locate.diff_pixels;
    const diffW = locate.width;
    const diffH = locate.height;
    locate.free?.();
    locate = null;
    let decoded;
    try {
      decoded = JSON.parse(resultsJson);
    } catch {
      setModeResult({ error: t("search.mosaic.noText") });
      return;
    }
    if (!decoded?.ok || !decoded.results?.length) {
      setModeResult({
        error: decoded?.error || t("search.mosaic.noText"),
      });
      return;
    }
    if (typeof flat !== "string" || !flat) {
      setModeResult({ error: t("search.mosaic.noText") });
      return;
    }
    const seal = await contentSeal(flat);
    if (mosaicMode !== modeAtStart) return;
    const sameUniverse = BigInt(get_universe()) === BigInt(babelMeta.u);
    const savedU = get_universe();
    let roomHash;
    try {
      set_universe(
        typeof babelMeta.u === "bigint" ? babelMeta.u : BigInt(babelMeta.u),
      );
      roomHash = node_hash_hex(
        coordForWasm(babelMeta.z),
        coordForWasm(babelMeta.n),
      );
    } finally {
      set_universe(savedU);
    }
    const verify = verifyBabelProof(babelMeta, { seal, roomHash });
    const proof = {
      flat,
      seal,
      verify,
      reprojectRgba,
      diffRgba,
      diffW,
      diffH,
    };
    // Same-universe: go to stamp coords only when seal+hash pass (or legacy unsealed).
    const trustStamp = !verify.sealed || verify.ok === true;
    if (sameUniverse && trustStamp) {
      const base = decoded.results[0];
      const scope = babelMeta.scope === "book" ? "book" : "page";
      setModeResult({
        sameUniverse: true,
        ...proof,
        hits: [
          {
            ...base,
            z: encodeCoordParam(babelMeta.z),
            n: encodeCoordParam(babelMeta.n),
            book: babelMeta.b,
            page: 1,
            page_span: base.page_span ?? 1,
            label: "export origin",
            alphabet: alphabetId,
            scope,
          },
        ],
      });
    } else if (sameUniverse && !trustStamp) {
      // Tampered: show rematch hit for metrics, but go/link stay blocked.
      setModeResult({
        sameUniverse: true,
        ...proof,
        hits: decoded.results.map((h) => ({
          ...h,
          scope: babelMeta.scope === "book" ? "book" : "page",
          alphabet: alphabetId,
          label: "untrusted stamp",
        })),
      });
    } else {
      setModeResult({
        sameUniverse: false,
        ...proof,
        hits: decoded.results.map((h) => ({ ...h, scope: h.scope || "page" })),
      });
    }
  } catch (err) {
    console.error(err);
    if (mosaicMode === modeAtStart) {
      setModeResult({ error: t("search.error.unknown") });
    }
  } finally {
    if (findBtn) {
      findBtn.disabled = false;
      findBtn.textContent = t("search.babel.find");
    }
  }
}

function runMosaicSearch() {
  const modeAtStart = mosaicMode;
  const ingested = ensureIngested();
  if (!ingested.ok) {
    const { w, h } = dims();
    let err = ingested.error || t("search.mosaic.needImage");
    if (mosaicMode === "babel") {
      if (!lastBitmap) {
        err = t("search.babel.needExact", { w: String(w), h: String(h) });
      } else if (!babelMeta) {
        err = t("search.babel.notBabel");
      } else {
        err = t("search.babel.needExact", { w: String(w), h: String(h) });
      }
    }
    setModeResult({ error: err });
    return;
  }
  const findBtn = el("mosaicFind");
  if (findBtn) {
    findBtn.disabled = true;
    findBtn.textContent = t("search.mosaic.searching");
  }
  if (mosaicMode === "babel") {
    setModeResult({ progress: t("search.babel.progress") });
  } else {
    setModeResult({ progressPhase: "project" });
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (modeAtStart === "babel") void runBabelLocate(modeAtStart, findBtn);
      else runPhotoCandidates(modeAtStart, findBtn);
    });
  });
}

/** Wire mosaic UI (call once from controls). */
export function wireMosaicSearch() {
  syncMosaicModeUI(PHOTO_SEARCH_TAB_ENABLED ? "photo" : "babel");

  el("mosaicFile")?.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (file) await onFileChosen(file);
  });

  ["mosaicBrightness", "mosaicContrast"].forEach((id) => {
    const node = el(id);
    if (!node) return;
    node.addEventListener("input", () => schedulePreview());
    node.addEventListener("change", () => schedulePreview({ immediate: true }));
  });

  el("mosaicFind")?.addEventListener("click", runMosaicSearch);
}

export { updateFileMeta as syncMosaicGridHint };
