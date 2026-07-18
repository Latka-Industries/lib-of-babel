// Stage loading: typewriter copy loop for `loading.building`.

import { t } from "../lib/i18n.js";

let typeGen = 0;
/** `performance.now()` when the current typewriter generation started. */
let loadingStartedAt = 0;

export const LOADING_TYPE_MS = 55;
export const LOADING_HOLD_MS = 1100;
export const LOADING_GAP_MS = 380;

/** One full type → hold → clear cycle for `text`. */
export function loadingLoopMs(text = t("loading.building")) {
  return String(text).length * LOADING_TYPE_MS + LOADING_HOLD_MS + LOADING_GAP_MS;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function prefersReducedMotion() {
  return (
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Hold until ~`loops` typewriter cycles have elapsed since
 * {@link startLoadingTypewriter} (boot can finish work in parallel).
 * No-op under reduced motion or if loading is already gone.
 * @param {number} [loops=1]
 * @param {string} [text]
 */
export async function ensureLoadingMinLoops(loops = 1, text) {
  if (prefersReducedMotion()) return;
  if (!document.getElementById("loadingCopy")?.isConnected) return;
  const cycle = loadingLoopMs(text ?? t("loading.building"));
  const need = cycle * loops;
  const started = loadingStartedAt || performance.now();
  const remaining = Math.max(0, need - (performance.now() - started));
  if (remaining > 0) await sleep(remaining);
}

/**
 * Loop: type the building-library line, pause, clear, repeat.
 * No-ops once `#loadingCopy` is gone (first gallery paint clears `#walls`).
 * @param {string} [fullText]
 */
export function startLoadingTypewriter(fullText) {
  const el = document.getElementById("loadingCopy");
  const wrap = document.getElementById("loadingWave");
  if (!el) return;
  const gen = ++typeGen;
  const text = String(fullText ?? t("loading.building"));
  loadingStartedAt = performance.now();
  if (wrap) wrap.setAttribute("aria-label", text);

  if (prefersReducedMotion()) {
    el.textContent = text;
    return;
  }

  void (async () => {
    while (gen === typeGen) {
      if (!el.isConnected) return;
      el.textContent = "";
      for (let i = 1; i <= text.length; i++) {
        if (gen !== typeGen || !el.isConnected) return;
        el.textContent = text.slice(0, i);
        await sleep(LOADING_TYPE_MS);
      }
      if (gen !== typeGen || !el.isConnected) return;
      await sleep(LOADING_HOLD_MS);
      if (gen !== typeGen || !el.isConnected) return;
      el.textContent = "";
      await sleep(LOADING_GAP_MS);
    }
  })();
}

/** Stop any in-flight typewriter (e.g. before replacing walls). */
export function stopLoadingTypewriter() {
  typeGen += 1;
}
