// Babelgram: stamped PNG → locate → go / copy short book-image link.
// Photo mosaic tab: implemented but gated by PHOTO_SEARCH_TAB_ENABLED.

import { S, applyUniverseFromInput, syncLensControls } from "../gallery/state.js";
import {
  el,
  escapeHtml,
  copyText,
  findActionRow,
  wireFindActions,
  formatUniverseLabel,
} from "../lib/util.js";
import { t, getLocale } from "../lib/i18n.js";
import { formatAlphabetSymbolLabel } from "../lib/constants.js";
import { permalink } from "../gallery/url.js";
import {
  PHOTO_SEARCH_TAB_ENABLED,
  selectSearchTab,
  syncSearchKindUI,
  syncSearchCount,
} from "./search.js";
import {
  readBabelMeta,
  parseBabelFilename,
} from "../lib/png-babel.js";
import {
  book_image_dims,
  mosaic_project,
  mosaic_flat_for,
  mosaic_babel_json,
  room_accent,
  node_hash_hex,
  get_universe,
} from "../lib/wasm.js";

/** @type {"photo"|"babel"} */
let mosaicMode = PHOTO_SEARCH_TAB_ENABLED ? "photo" : "babel";

/** @type {{ rgba: Uint8Array, w: number, h: number, srcW?: number, srcH?: number } | null} */
let reshaped = null;
/** @type {string | null} */
let sourceName = null;
/**
 * Per-tab results so photo / Babelgram do not share one output.
 * Photo: `{ flat|error|progress }`. Babelgram: `{ hits, sameUniverse|error|progress }`.
 */
const modeResults = { photo: null, babel: null };
/** @type {ImageBitmap | null} */
let lastBitmap = null;
/** @type {{ u: bigint, name: string|null, a: number, z: bigint, n: bigint, b: number } | null} */
let babelMeta = null;
/** Soft parse of the upload filename (for confirmation UI). */
let babelNameMeta = null;

function dims() {
  const d = book_image_dims();
  return { w: d[0], h: d[1] };
}

function readParams() {
  const babel = mosaicMode === "babel";
  return {
    hue: Number(el("mosaicHue")?.value ?? S.accentHue),
    chroma: Number(el("mosaicChroma")?.value ?? S.accentChroma),
    light: Number(el("mosaicLight")?.value ?? S.accentLightness),
    space: babel ? 0 : Number(el("mosaicSpace")?.value ?? 28),
    dither: babel ? false : el("mosaicDither")?.checked === true,
    brightness: babel ? 0 : Number(el("mosaicBrightness")?.value ?? 0),
    contrast: babel ? 0 : Number(el("mosaicContrast")?.value ?? 0),
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
  if (lastBitmap) refreshPreview();
  else updateFileMeta();
  paintModeResult();
}

function refreshPreview() {
  if (!lastBitmap) return;
  if (mosaicMode === "babel" && !babelMeta) {
    reshaped = null;
    el("mosaicFileMeta").textContent = t("search.babel.notBabel");
    el("mosaicFitPct").textContent = "";
    clearPreviewCanvases();
    return;
  }
  const ingested = ingestBitmap(lastBitmap);
  if (!ingested.ok) {
    reshaped = null;
    el("mosaicFileMeta").textContent = ingested.error;
    el("mosaicFitPct").textContent = "";
    clearPreviewCanvases();
    return;
  }
  reshaped = ingested;
  paintCanvas(el("mosaicOriginal"), reshaped.rgba, reshaped.w, reshaped.h);
  updateFileMeta();

  // Babel exports are already library colour maps — no requantize / no preview edit.
  if (mosaicMode === "babel") {
    el("mosaicFitPct").textContent = "";
    return;
  }

  const p = readParams();
  let img = null;
  try {
    img = mosaic_project(
      reshaped.rgba,
      S.alphabetId,
      p.hue,
      p.chroma,
      p.light,
      p.space,
      p.dither,
    );
    const pixels = img.pixels;
    paintCanvas(el("mosaicPreview"), pixels, img.width, img.height);
    const pct = el("mosaicFitPct");
    if (pct) {
      pct.textContent = t("search.mosaic.fitPct", {
        n: Number(img.percent).toFixed(1),
      });
    }
  } catch (err) {
    console.error(err);
    const pct = el("mosaicFitPct");
    if (pct) pct.textContent = t("search.mosaic.previewError");
  } finally {
    img?.free?.();
  }
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
    z: String(meta.z),
    n: String(meta.n),
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
    return;
  }
  refreshPreview();
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
    box.innerHTML = "";
    box.classList.remove("show");
    return;
  }
  if (payload.progress) {
    box.innerHTML = `<p class="find-dim">${escapeHtml(payload.progress)}</p>`;
    box.classList.add("show");
    return;
  }
  if (payload.error) {
    box.innerHTML = `<p class="find-dim search-error">${escapeHtml(payload.error)}</p>`;
    box.classList.add("show");
    return;
  }
  if (mosaicMode === "babel" && payload.hits) {
    paintBabelHits(box, payload.hits, !!payload.sameUniverse);
    return;
  }
  if (payload.flat) {
    paintPhotoBookText(box, payload.flat);
    return;
  }
  box.innerHTML = "";
  box.classList.remove("show");
}

function paintPhotoBookText(box, flat) {
  const n = flat.length.toLocaleString(getLocale());
  box.innerHTML = `
    <p class="find-dim">${escapeHtml(t("search.mosaic.bookTextIntro", { n }))}</p>
    <textarea id="mosaicBookText" class="mosaic-book-text" rows="8" readonly></textarea>
    <div class="find-row find-actions" id="mosaicBookActions">
      <button type="button" data-find-action="copy">${escapeHtml(t("actions.copy"))}</button>
      <button type="button" data-find-action="paste">${escapeHtml(t("search.mosaic.toSearch"))}</button>
    </div>`;
  const ta = el("mosaicBookText");
  if (ta) ta.value = flat;
  box.classList.add("show");
  const actions = el("mosaicBookActions");
  actions?.querySelector('[data-find-action="copy"]')?.addEventListener("click", (ev) => {
    copyText(flat, ev.currentTarget, t("common.copied"));
  });
  actions?.querySelector('[data-find-action="paste"]')?.addEventListener("click", () => {
    putFlatInContentSearch(flat);
  });
}

function babelPermalink(hit, { sameUniverse = false } = {}) {
  const z = BigInt(hit.z);
  const n = BigInt(hit.n);
  const hash = node_hash_hex(z, n);
  // Prefer stamped export name on same-universe round-trip; else current session.
  const uni =
    sameUniverse && babelMeta?.name != null ? babelMeta.name : S.universeName;
  return permalink(z, n, hash, hit.alphabet, hit.book, 1, uni, null, {
    image: true,
  });
}

function paintBabelHits(box, hits, sameUniverse) {
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
  const origin = babelMeta
    ? `<p class="find-dim">${escapeHtml(formatOriginLine(babelMeta))}</p>
       <p class="find-dim">${escapeHtml(
         t(
           sameUniverse
             ? "search.babel.originNoteSame"
             : "search.babel.originNoteOther",
         ),
       )}</p>`
    : "";
  const rows = hits
    .map((r, i) => {
      const pct = Number(r.percent).toLocaleString(getLocale(), {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      });
      return `<div class="mosaic-hit" data-i="${i}">
        <div class="mosaic-hit-body">
          <div class="mosaic-hit-main">
            <span class="mosaic-hit-pct">${escapeHtml(pct)}%</span>
            <span class="mosaic-hit-label">${escapeHtml(r.label || "")}</span>
          </div>
          <div class="find-dim">${escapeHtml(
            t("search.result.gallery", { z: r.z, n: r.n }),
          )} · ${escapeHtml(
            t("search.mosaic.hitBook", { book: String(Number(r.book) + 1) }),
          )} · ${escapeHtml(formatAlphabetSymbolLabel(r.alphabet, t))}</div>
          ${findActionRow([
            { id: "go", label: t("search.go") },
            { id: "link", label: t("actions.copy") },
          ]).replace(
            'class="find-row find-actions"',
            `class="find-row find-actions" data-i="${i}"`,
          )}
        </div>
      </div>`;
    })
    .join("");
  box.innerHTML = `<p class="find-dim">${escapeHtml(intro)}</p>${origin}${rows}`;
  box.classList.add("show");
  box.querySelectorAll(".mosaic-hit").forEach((row) => {
    const i = Number(row.dataset.i);
    const hit = hits[i];
    wireFindActions(row, {
      go: () => goToBabelHit(hit, sameUniverse),
      link: (_ev, btn) => {
        try {
          copyText(babelPermalink(hit, { sameUniverse }), btn, t("common.copied"));
        } catch (err) {
          console.error(err);
        }
      },
    });
  });
}

function goToBabelHit(hit, sameUniverse = false) {
  if (!hit) return;
  let url;
  try {
    url = babelPermalink(hit, { sameUniverse });
  } catch (err) {
    console.error(err);
    return;
  }
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.click();
}

/** Clear photo + babel result caches (e.g. when opening search fresh). */
export function clearMosaicResults() {
  modeResults.photo = null;
  modeResults.babel = null;
  paintModeResult();
}

function putFlatInContentSearch(flat) {
  if (!flat) return;
  selectSearchTab("text");
  const kind = el("searchKind");
  if (kind) kind.value = "content";
  syncSearchKindUI();
  const input = el("searchInput");
  if (input) {
    input.value = flat;
    input.focus();
    input.select();
  }
  syncSearchCount();
}

function runPhotoBookText(modeAtStart, findBtn) {
  try {
    if (mosaicMode !== modeAtStart) return;
    const p = readParams();
    const flat = mosaic_flat_for(
      reshaped.rgba,
      S.alphabetId,
      p.hue,
      p.chroma,
      p.light,
      p.space,
      p.dither,
    );
    if (mosaicMode !== modeAtStart) return;
    setModeResult(flat ? { flat } : { error: t("search.mosaic.noText") });
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
}

function runBabelLocate(modeAtStart, findBtn) {
  try {
    if (mosaicMode !== modeAtStart || !babelMeta) return;
    applyUniverseFromInput(el("universe")?.value);
    const alphabetId = babelMeta.a;
    if (alphabetId !== S.alphabetId) {
      S.alphabetId = alphabetId;
      syncLensControls();
    }
    const accent = room_accent(babelMeta.z, babelMeta.n, babelMeta.u);
    const decoded = JSON.parse(
      mosaic_babel_json(
        reshaped.rgba,
        alphabetId,
        accent[0],
        accent[1],
        accent[2],
      ),
    );
    if (mosaicMode !== modeAtStart) return;
    if (!decoded?.ok || !decoded.results?.length) {
      setModeResult({
        error: decoded?.error || t("search.mosaic.noText"),
      });
      return;
    }
    const sameUniverse = BigInt(get_universe()) === BigInt(babelMeta.u);
    if (sameUniverse) {
      const base = decoded.results[0];
      setModeResult({
        sameUniverse: true,
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
  if (!reshaped) {
    const { w, h } = dims();
    let err = t("search.mosaic.needImage");
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
      if (modeAtStart === "babel") runBabelLocate(modeAtStart, findBtn);
      else runPhotoBookText(modeAtStart, findBtn);
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
  ].forEach((id) => {
    el(id)?.addEventListener("input", refreshPreview);
    el(id)?.addEventListener("change", refreshPreview);
  });

  el("mosaicFind")?.addEventListener("click", runMosaicSearch);
}

export { updateFileMeta as syncMosaicGridHint };
