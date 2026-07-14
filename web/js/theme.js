// Color theme: light | dark. Preference lives in localStorage; first paint is
// applied by the inline script in index.html so we don't flash the wrong skin.

export const THEME_KEY = "lib-of-babel-theme";

/** @returns {"light" | "dark"} */
export function getTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** Gallery accent tuned for contrast on the active skin. */
export function accentHsl(hue) {
  return getTheme() === "light"
    ? `hsl(${hue} 62% 38%)`
    : `hsl(${hue} 70% 58%)`;
}

/** @param {"light" | "dark"} mode */
export function setTheme(mode) {
  const next = mode === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* private mode / blocked storage — still apply in-session */
  }
}

export function toggleTheme() {
  setTheme(getTheme() === "light" ? "dark" : "light");
  return getTheme();
}

/** Keep the header control’s glyph / pressed / title in sync. */
export function syncThemeToggle(t = (k) => k) {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const light = getTheme() === "light";
  btn.setAttribute("aria-pressed", light ? "true" : "false");
  // Dark skin → sun (go light). Light skin → moon (go dark).
  btn.textContent = light ? "☾" : "☀";
  btn.title = light ? t("header.themeToDark") : t("header.themeToLight");
  btn.setAttribute("aria-label", btn.title);
}
