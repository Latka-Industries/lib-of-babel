// Tab icon: static assets/favicon.svg / .png are the cold fallback; once a gallery
// renders we swap the SVG link to a data-URI tinted with the room accent.

import { accentHsl, getTheme } from "./theme.js";

const ALEPH_D =
  "M14.24 0L2.08 0L4-12.88Q4.64-16.88 5.88-20.48Q7.12-24.08 9.64-27Q12.16-29.92 16.48-31.76L16.48-31.76Q14.24-34.48 11.72-37.72Q9.20-40.96 6.96-43.84Q4.72-46.72 3.44-48.24L3.44-48.24L18.32-48.24Q19.84-46.40 21.68-43.88Q23.52-41.36 25.40-38.76Q27.28-36.16 28.72-34.16L28.72-34.16Q29.76-32.64 30.80-31.08Q31.84-29.52 32.88-28L32.88-28Q36-29.68 37.08-32.96Q38.16-36.24 38.56-40L38.56-40L39.60-48.24L51.68-48.24L50.72-39.28Q50.16-33.44 47.28-28.40Q44.40-23.36 38-20.64L38-20.64Q41.52-15.68 45.08-10.52Q48.64-5.36 52 0L52 0L37.84 0Q33.76-7.04 29.96-13Q26.16-18.96 22-24.56L22-24.56Q18.80-23.04 17.72-19.64Q16.64-16.24 16.08-12.16L16.08-12.16L14.24 0Z";

/** Last paint key (hue + theme) — skip no-op swaps when re-rendering the same room. */
let lastKey = null;

/**
 * Point the SVG favicon at a data-URI aleph filled with the gallery accent.
 * Leaves assets/favicon.png alone as a static fallback for browsers that prefer it.
 * @param {number} hue gallery accent hue degrees (same as `--accent`)
 */
export function setAccentFavicon(hue) {
  const h = Math.round(hue);
  const key = `${h}:${getTheme()}`;
  if (key === lastKey) return;
  lastKey = key;
  const link = document.getElementById("faviconSvg");
  if (!link) return;
  const fill = accentHsl(h);
  const bg =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--bg-deep")
      .trim() || "#07060a";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 61.92 60.24">` +
    `<rect width="100%" height="100%" rx="10.84" fill="${bg}"/>` +
    `<g transform="translate(3.92, 54.24)">` +
    `<path fill="${fill}" d="${ALEPH_D}"/>` +
    `</g></svg>`;
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
