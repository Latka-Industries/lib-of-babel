// Babelgram: stamped PNG → locate → go / copy short book-image link.
// Photo mosaic: alphabet-lens project → rms/mae/corr rank → go there.

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
import { formatAlphabetSymbolLabel } from "../lib/constants.js";
import { permalink } from "../gallery/url.js";
import {
  readBabelMeta,
  parseBabelFilename,
} from "../lib/png-babel.js";
import { kvSet } from "../lib/db.js";
import {
  book_image_dims,
  book_image,
  mosaic_project_preview,
  mosaic_candidate_packs_json,
  mosaic_candidate_eval_json,
  mosaic_babel_json,
  room_accent,
  node_hash_hex,
  get_universe,
} from "../lib/wasm.js";
import {
  PHOTO_SEARCH_TAB_ENABLED,
  selectSearchTab,
} from "./search.js";
import { jumpTo } from "../gallery/nav.js";
import { openBookImage } from "./book.js";

const BABEL_EMBED_KEY = (id) => `babel-embed:${id}`;

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
 * Last Babel locate proof frames for the compare wipe.
 * reproject = stamp-accent mosaic; diff = `|upload − reproject|`.
 * @type {{ reprojectRgba: Uint8Array, diffRgba: Uint8Array, w: number, h: number, wipeOut?: Uint8Array } | null}
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

function readParams() {
  const babel = mosaicMode === "babel";
  const paletteKind = Number(el("mosaicPaletteKind")?.value ?? 1);
  return {
    hue: Number(el("mosaicHue")?.value ?? S.accentHue),
    chroma: Number(el("mosaicChroma")?.value ?? S.accentChroma),
    light: Number(el("mosaicLight")?.value ?? S.accentLightness),
    space: babel ? 0 : Number(el("mosaicSpace")?.value ?? 28),
    dither: babel ? false : el("mosaicDither")?.checked === true,
    brightness: babel ? 0 : Number(el("mosaicBrightness")?.value ?? 0),
    contrast: babel ? 0 : Number(el("mosaicContrast")?.value ?? 0),
    /** 0 = luma ramp, 1 = glyph / letter colours */
    paletteKind: babel ? 1 : paletteKind === 0 ? 0 : 1,
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

function openBabelCompare() {
  if (!babelCompareFrames) return;
  ensureBabelCompareWired();
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

export function syncMosaicKnobsFromGallery() {
  const hue = el("mosaicHue");
  const chroma = el("mosaicChroma");
  const light = el("mosaicLight");
  if (hue) hue.value = String(Math.round(S.accentHue));
  if (chroma) chroma.value = String(S.accentChroma.toFixed(3));
  if (light) light.value = String(S.accentLightness.toFixed(3));
}

/** Apply photo vs babel copy / knobs visibility. */
export function syncMosaicModeUI(mode = mosaicMode) {
  mosaicMode =
    mode === "babel" || !PHOTO_SEARCH_TAB_ENABLED ? "babel" : "photo";
  const babel = mosaicMode === "babel";
  document.querySelectorAll(".mosaic-photo-only").forEach((node) => {
    node.classList.toggle("hidden", babel);
  });
  el("mosaicCompare")?.classList.toggle("mosaic-compare-solo", babel);
  const setI18nText = (node, key) => {
    if (!node) return;
    node.dataset.i18n = key;
    node.textContent = t(key);
  };
  setI18nText(el("mosaicHonesty"), babel ? "search.babel.honesty" : "search.mosaic.honesty");
  setI18nText(
    el("mosaicUploadLabel"),
    babel ? "search.babel.upload" : "search.mosaic.upload",
  );
  setI18nText(
    el("mosaicOriginalCaption"),
    babel ? "search.babel.original" : "search.mosaic.original",
  );
  setI18nText(el("mosaicHint"), babel ? "search.hintBabel" : "search.hintMosaic");
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
      formatOriginLine(babelMeta),
    ];
    if (
      babelNameMeta &&
      (babelNameMeta.u !== babelMeta.u ||
        babelNameMeta.z !== babelMeta.z ||
        babelNameMeta.n !== babelMeta.n ||
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

  // Stamped book-image PNG → Babelgram tab (auto-switch from photo).
  try {
    const buf = await file.arrayBuffer();
    const stamped = readBabelMeta(buf);
    if (stamped) {
      babelMeta = stamped;
      modeResults.babel = null;
      if (mosaicMode !== "babel") {
        selectSearchTab("babel");
        syncMosaicModeUI("babel");
      } else {
        paintModeResult();
      }
    } else {
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
  if (payload.progress) {
    babelCompareFrames = null;
    box.innerHTML = `<p class="find-dim">${escapeHtml(payload.progress)}</p>`;
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
      reprojectRgba: payload.reprojectRgba || null,
      diffRgba: payload.diffRgba || null,
      diffW: payload.diffW || 0,
      diffH: payload.diffH || 0,
    });
    return;
  }
  if (mosaicMode === "photo" && payload.hits) {
    paintPhotoHits(box, payload.hits, {
      bookRgba: payload.bookRgba || null,
      diffRgba: payload.diffRgba || null,
      diffW: payload.diffW || 0,
      diffH: payload.diffH || 0,
    });
    return;
  }
  box.innerHTML = "";
  box.classList.remove("show");
}

function rgbaAbsDiff(src, other) {
  const n = Math.min(src.length, other.length);
  const out = new Uint8Array(n);
  for (let i = 0; i + 3 < n; i += 4) {
    out[i] = Math.abs(src[i] - other[i]);
    out[i + 1] = Math.abs(src[i + 1] - other[i + 1]);
    out[i + 2] = Math.abs(src[i + 2] - other[i + 2]);
    out[i + 3] = 255;
  }
  return out;
}

/** Same ideals as Babelgram confirm — score upload vs book colour map. */
function rgbFitTriple(src, other) {
  const n = Math.min(src.length, other.length) / 4;
  if (!n) return { percent: 0, mae: 0, corr: 1, rank: 0 };
  let sumSq = 0;
  let sumAbs = 0;
  let sumSrc = 0;
  let sumOth = 0;
  let sumSrcSq = 0;
  let sumOthSq = 0;
  let sumCross = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    for (let c = 0; c < 3; c++) {
      const x = src[o + c];
      const y = other[o + c];
      const d = x - y;
      sumSq += d * d;
      sumAbs += Math.abs(d);
      sumSrc += x;
      sumOth += y;
      sumSrcSq += x * x;
      sumOthSq += y * y;
      sumCross += x * y;
      count += 1;
    }
  }
  const rmsNorm = Math.sqrt(sumSq / count / (255 * 255));
  const percent = Math.max(0, Math.min(100, 100 * (1 - Math.min(1, rmsNorm))));
  const mae = sumAbs / count;
  const meanSrc = sumSrc / count;
  const meanOth = sumOth / count;
  const cov = sumCross / count - meanSrc * meanOth;
  const varSrc = sumSrcSq / count - meanSrc * meanSrc;
  const varOth = sumOthSq / count - meanOth * meanOth;
  let corr = 1;
  if (varSrc > 1e-12 && varOth > 1e-12) {
    corr = Math.max(-1, Math.min(1, cov / (Math.sqrt(varSrc) * Math.sqrt(varOth))));
  } else if (Math.abs(cov) > 1e-12) {
    corr = 0;
  }
  const rmsTerm = Math.max(0, Math.min(1, percent / 100));
  const maeTerm = Math.max(0, Math.min(1, 1 - mae / 255));
  const corrTerm = Math.max(0, Math.min(1, corr));
  const rank = 100 * (0.4 * rmsTerm + 0.3 * maeTerm + 0.3 * corrTerm);
  return { percent, mae, corr, rank };
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

function photoPermalink(hit) {
  const z = BigInt(hit.z);
  const n = BigInt(hit.n);
  const alphabet = hit.alphabet ?? S.alphabetId;
  const hash = node_hash_hex(String(z), String(n));
  return permalink(z, n, hash, alphabet, hit.book, 1, S.universeName, null, {
    image: true,
  });
}

function goToPhotoHit(hit) {
  if (!hit) return;
  applyUniverseFromInput(el("universe")?.value);
  const alphabet = hit.alphabet ?? S.alphabetId;
  if (alphabet !== S.alphabetId) {
    S.alphabetId = alphabet;
    syncLensControls();
  }
  jumpTo(String(hit.z), String(hit.n));
  openBookImage(hit.book, null);
  el("searchModal")?.close();
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
  const intro = t("search.mosaic.resultsIntroBest");
  const { rms, mae, corr, isExact } = formatMetricTriplet(hit);
  const exact = isExact
    ? `<span class="mosaic-hit-ok" tabindex="0" data-tip="${escapeHtml(
        t("search.babel.tip.exactOk"),
      )}">${escapeHtml(t("search.babel.exactOk"))}</span>`
    : "";
  const label = !isExact && hit.label
    ? `<span class="mosaic-hit-label">${escapeHtml(hit.label)}</span>`
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
  box.innerHTML = `<p class="find-dim">${escapeHtml(intro)}</p>
    <div class="mosaic-hit" data-i="0">
      <div class="mosaic-hit-thumbs">
        <div class="mosaic-hit-thumb-wrap">
          <canvas class="mosaic-hit-thumb mosaic-hit-thumb-book" width="72" height="58" aria-label="${escapeHtml(
            t("search.mosaic.thumbAlt"),
          )}"></canvas>
        </div>
      </div>
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
            ? [{ id: "diff", label: t("search.babel.compare.checkDiff") }]
            : []),
        ]).replace(
          'class="find-row find-actions"',
          'class="find-row find-actions" data-i="0"',
        )}
      </div>
    </div>`;
  box.classList.add("show");
  babelCompareFrames = canCompare
    ? {
        reprojectRgba: proof.bookRgba,
        diffRgba: proof.diffRgba,
        w: proof.diffW,
        h: proof.diffH,
      }
    : null;
  const row = box.querySelector(".mosaic-hit");
  const bookThumb = row?.querySelector("canvas.mosaic-hit-thumb-book");
  if (bookThumb && proof.bookRgba) {
    paintCanvas(bookThumb, proof.bookRgba, proof.diffW, proof.diffH, 72);
  }
  const handlers = {
    go: () => goToPhotoHit(hit),
    link: (_ev, btn) => {
      try {
        copyText(photoPermalink(hit), btn, t("common.copied"));
      } catch (err) {
        console.error(err);
      }
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

function babelPermalink(hit, { sameUniverse = false, embedId = null } = {}) {
  const z = BigInt(hit.z);
  const n = BigInt(hit.n);
  const hash = node_hash_hex(String(z), String(n));
  // Prefer stamped export name on same-universe round-trip; else current session.
  const uni =
    sameUniverse && babelMeta?.name != null ? babelMeta.name : S.universeName;
  return permalink(z, n, hash, hit.alphabet, hit.book, 1, uni, null, {
    image: true,
    embedId,
  });
}

async function stashBabelEmbed({ flat, pageSpan, imageRgba, imageW, imageH }) {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
async function contentSeal(flat) {
  if (!flat || !globalThis.crypto?.subtle) return null;
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(flat),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

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
  // Only prose besides the numeric/visual report: the results intro line.
  const sealLine = proof.seal
    ? `<div class="find-dim mosaic-hit-seal" tabindex="0" data-tip="${escapeHtml(
        t("search.babel.tip.seal"),
      )}">${escapeHtml(t("search.babel.seal", { seal: proof.seal }))}</div>`
    : "";
  const canCompare = !!(
    proof.reprojectRgba?.length &&
    proof.diffRgba?.length &&
    proof.diffW &&
    proof.diffH &&
    proof.reprojectRgba.length === proof.diffRgba.length
  );
  const rows = hits
    .map((r, i) => {
      const { rms, mae, corr, isExact } = formatMetricTriplet(r);
      const exact = isExact
        ? `<span class="mosaic-hit-ok" tabindex="0" data-tip="${escapeHtml(
            t("search.babel.tip.exactOk"),
          )}">${escapeHtml(t("search.babel.exactOk"))}</span>`
        : "";
      const label = !isExact && r.label
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
          ${sealLine}
          ${findActionRow([
            { id: "go", label: t("search.go") },
            { id: "link", label: t("actions.copy") },
            ...(canCompare
              ? [{ id: "diff", label: t("search.babel.compare.checkDiff") }]
              : []),
          ]).replace(
            'class="find-row find-actions"',
            `class="find-row find-actions" data-i="${i}"`,
          )}
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
      }
    : null;
  box.querySelectorAll(".mosaic-hit").forEach((row) => {
    const i = Number(row.dataset.i);
    const hit = hits[i];
    const srcThumb = row.querySelector("canvas.mosaic-hit-thumb-src");
    if (srcThumb && reshaped?.rgba) {
      paintCanvas(srcThumb, reshaped.rgba, reshaped.w, reshaped.h, 72);
    }
    const handlers = {
      go: () => {
        void goToBabelHit(hit, sameUniverse, flat);
      },
      link: (_ev, btn) => {
        try {
          // Address-only — no embed handoff (shareable / durable).
          copyText(babelPermalink(hit, { sameUniverse }), btn, t("common.copied"));
        } catch (err) {
          console.error(err);
        }
      },
    };
    if (canCompare) {
      handlers.diff = () => {
        openBabelCompare();
      };
    }
    wireFindActions(row, handlers);
  });
}

/** Open hit in a new tab. Other-universe embeds use a short-lived IndexedDB handoff. */
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
    const url = babelPermalink(hit, { sameUniverse, embedId });
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (err) {
    console.error(err);
  }
}

/** Clear photo + babel result caches (e.g. when opening search fresh). */
export function clearMosaicResults() {
  modeResults.photo = null;
  modeResults.babel = null;
  babelCompareFrames = null;
  paintModeResult();
}

function runPhotoCandidates(modeAtStart, findBtn) {
  void (async () => {
    try {
      if (mosaicMode !== modeAtStart || !reshaped) return;
      const p = readParams();

      setModeResult({ progress: t("search.mosaic.progressPacks") });
      await yieldToUi();
      if (mosaicMode !== modeAtStart) return;

      let packsDecoded;
      try {
        packsDecoded = JSON.parse(
          mosaic_candidate_packs_json(
            reshaped.rgba,
            S.alphabetId,
            p.hue,
            p.chroma,
            p.light,
            p.space,
            p.dither,
            p.paletteKind,
          ),
        );
      } catch {
        setModeResult({ error: t("search.mosaic.noHits") });
        return;
      }
      const packs = packsDecoded?.packs;
      if (!packsDecoded?.ok || !packs?.length) {
        setModeResult({
          error: packsDecoded?.error || t("search.mosaic.noHits"),
        });
        return;
      }

      /** @type {object[]} */
      const located = [];
      for (let i = 0; i < packs.length; i++) {
        if (mosaicMode !== modeAtStart) return;
        setModeResult({
          progress: t("search.mosaic.progressLocate", {
            i: String(i + 1),
            n: String(packs.length),
          }),
        });
        await yieldToUi();
        if (mosaicMode !== modeAtStart) return;
        const pack = packs[i];
        let ev;
        try {
          ev = JSON.parse(
            mosaic_candidate_eval_json(
              reshaped.rgba,
              S.alphabetId,
              pack.hue,
              pack.chroma,
              pack.light,
              pack.space_threshold,
              !!pack.dither,
              p.paletteKind,
              pack.label || "",
            ),
          );
        } catch {
          continue;
        }
        const hit = ev?.results?.[0];
        if (!ev?.ok || !hit) continue;
        const key = `${hit.z}|${hit.n}|${hit.book}`;
        if (located.some((h) => `${h.z}|${h.n}|${h.book}` === key)) continue;
        located.push(hit);
      }

      if (!located.length) {
        setModeResult({ error: t("search.mosaic.noHits") });
        return;
      }

      // Re-rank by virgin book colour map ↔ upload (matches thumb + check-diff).
      let best = null;
      let bestBookRgba = null;
      let bestDiff = null;
      let bestW = 0;
      let bestH = 0;
      for (let i = 0; i < located.length; i++) {
        if (mosaicMode !== modeAtStart) return;
        setModeResult({
          progress: t("search.mosaic.progressScore", {
            i: String(i + 1),
            n: String(located.length),
          }),
        });
        await yieldToUi();
        if (mosaicMode !== modeAtStart) return;
        const hit = located[i];
        const alphabet = hit.alphabet ?? S.alphabetId;
        let bookImg = null;
        try {
          bookImg = book_image(String(hit.z), String(hit.n), hit.book, alphabet);
          const bookRgba = bookImg.pixels;
          const fit = rgbFitTriple(reshaped.rgba, bookRgba);
          const scored = {
            ...hit,
            percent: fit.percent,
            mae: fit.mae,
            corr: fit.corr,
            _rank: fit.rank,
          };
          if (!best || fit.rank > best._rank) {
            best = scored;
            bestBookRgba = bookRgba;
            bestW = bookImg.width;
            bestH = bookImg.height;
            bestDiff = rgbaAbsDiff(reshaped.rgba, bookRgba);
          }
        } finally {
          bookImg?.free?.();
        }
      }

      if (!best || !bestBookRgba) {
        setModeResult({ error: t("search.mosaic.noHits") });
        return;
      }
      if (mosaicMode !== modeAtStart) return;
      setModeResult({
        hits: [best],
        bookRgba: bestBookRgba,
        diffRgba: bestDiff,
        diffW: bestW,
        diffH: bestH,
      });
    } catch (err) {
      console.error(err);
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

async function runBabelLocate(modeAtStart, findBtn) {
  try {
    if (mosaicMode !== modeAtStart || !babelMeta) return;
    applyUniverseFromInput(el("universe")?.value);
    const alphabetId = babelMeta.a;
    if (alphabetId !== S.alphabetId) {
      S.alphabetId = alphabetId;
      syncLensControls();
    }
    const accent = room_accent(String(babelMeta.z), String(babelMeta.n), babelMeta.u);
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
    const proof = { flat, seal, reprojectRgba, diffRgba, diffW, diffH };
    if (sameUniverse) {
      const base = decoded.results[0];
      setModeResult({
        sameUniverse: true,
        ...proof,
        hits: [
          {
            ...base,
            z: String(babelMeta.z),
            n: String(babelMeta.n),
            book: babelMeta.b,
            page: 1,
            page_span: base.page_span ?? 1,
            label: "export origin",
            alphabet: alphabetId,
          },
        ],
      });
    } else {
      setModeResult({
        sameUniverse: false,
        ...proof,
        hits: decoded.results,
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
      err = !babelMeta
        ? t("search.babel.notBabel")
        : t("search.babel.needExact", { w: String(w), h: String(h) });
    }
    setModeResult({ error: err });
    return;
  }
  const findBtn = el("mosaicFind");
  if (findBtn) {
    findBtn.disabled = true;
    findBtn.textContent = t("search.mosaic.searching");
  }
  setModeResult({
    progress:
      mosaicMode === "babel"
        ? t("search.babel.progress")
        : t("search.mosaic.progress"),
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (modeAtStart === "babel") void runBabelLocate(modeAtStart, findBtn);
      else runPhotoCandidates(modeAtStart, findBtn);
    });
  });
}

/** Wire mosaic UI (call once from controls). */
export function wireMosaicSearch() {
  syncMosaicKnobsFromGallery();
  syncMosaicModeUI(PHOTO_SEARCH_TAB_ENABLED ? "photo" : "babel");

  el("mosaicFile")?.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (file) await onFileChosen(file);
  });

  [
    "mosaicHue",
    "mosaicChroma",
    "mosaicLight",
    "mosaicSpace",
    "mosaicBrightness",
    "mosaicContrast",
    "mosaicDither",
    "mosaicPaletteKind",
  ].forEach((id) => {
    const node = el(id);
    if (!node) return;
    node.addEventListener("input", () => schedulePreview());
    node.addEventListener("change", () => schedulePreview({ immediate: true }));
  });

  el("mosaicFind")?.addEventListener("click", runMosaicSearch);
}

export { updateFileMeta as syncMosaicGridHint };
