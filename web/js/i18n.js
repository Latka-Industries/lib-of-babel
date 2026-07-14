// UI locale follows alphabet lens (THI-118). English is the fallback source of truth.

import { alphabetEntry } from "./constants.js";
import { en } from "./locales/en.js";
import { de } from "./locales/de.js";
import { nl } from "./locales/nl.js";

const CATALOGS = { en, de, nl };

/** @type {keyof typeof CATALOGS} */
let locale = "en";

/** Alphabet id → UI locale (`uiLocale` on the registry; else English). */
export function localeForAlphabet(alphabetId) {
  return alphabetEntry(alphabetId).uiLocale || "en";
}

export function getLocale() {
  return locale;
}

/** Translate a key; falls back to English, then the key itself. Supports `{name}` vars. */
export function t(key, vars = {}) {
  const primary = CATALOGS[locale]?.[key];
  const fallback = CATALOGS.en?.[key];
  let s = primary ?? fallback ?? key;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

function applyAttr(el, attr, key, vars) {
  if (!key) return;
  const val = t(key, vars);
  if (attr === "text") el.textContent = val;
  else if (attr === "html") el.innerHTML = val;
  else el.setAttribute(attr, val);
}

/** Refresh all marked chrome in `root` from the active catalog. */
export function applyI18n(root = document, vars = {}) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    applyAttr(el, "text", el.getAttribute("data-i18n"), vars);
  });
  root.querySelectorAll("[data-i18n-html]").forEach((el) => {
    applyAttr(el, "html", el.getAttribute("data-i18n-html"), vars);
  });
  root.querySelectorAll("[data-i18n-title]").forEach((el) => {
    applyAttr(el, "title", el.getAttribute("data-i18n-title"), vars);
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    applyAttr(el, "placeholder", el.getAttribute("data-i18n-placeholder"), vars);
  });
  root.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    applyAttr(el, "aria-label", el.getAttribute("data-i18n-aria-label"), vars);
  });
}

/** Set locale from alphabet lens and repaint static chrome. */
export function setLocaleFromAlphabet(alphabetId, vars = {}) {
  locale = localeForAlphabet(alphabetId);
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
    applyI18n(document, vars);
  }
  return locale;
}
