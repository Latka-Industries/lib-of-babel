// Shared Find result formatting (text + photo / Babelgram).

import { t } from "../lib/i18n.js";

/** Human elapsed for Find results (`took 4m 57s`). */
export function formatFindElapsed(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return t("search.mosaic.elapsedSec", { n: String(sec) });
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return t("search.mosaic.elapsedMinSec", { m: String(m), s: String(s) });
}
