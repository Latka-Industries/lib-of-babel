// Build web/og.svg + web/og.png — 1200×630 share card from a real gallery
// sigil on the README contact mat (assets/sigils.json). Needs ImageMagick
// (`magick`) on PATH to write the PNG crawlers fetch.
//
//   node scripts/make-og.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { sigilSvg } from "../web/js/gallery/sigil.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const { tiles } = JSON.parse(
  readFileSync(join(root, "assets/sigils.json"), "utf8"),
);

// First mat tile — hash 0d0cade51e8d694f (plan default).
const tile = tiles[0];
const inner = sigilSvg(tile.hash, tile.hue)
  .replace(/^<svg[^>]*>/, "")
  .replace(/<\/svg>$/, "");

const W = 1200;
const H = 630;
const SIGIL = 420;
const sx = 90;
const sy = Math.round((H - SIGIL) / 2);

const title = "LIB·OF·BABEL";

const out =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
  `<rect width="${W}" height="${H}" fill="#0b0b0d"/>` +
  `<rect x="${sx}" y="${sy}" width="${SIGIL}" height="${SIGIL}" rx="28" fill="#141318" stroke="#2a2832" stroke-width="2"/>` +
  `<svg x="${sx}" y="${sy}" width="${SIGIL}" height="${SIGIL}" viewBox="0 0 100 100">${inner}</svg>` +
  `<g transform="translate(580, 250)">` +
  `<text x="0" y="0" fill="#e8e6e3" font-family="JetBrains Mono, DejaVu Sans Mono, ui-monospace, monospace" ` +
  `font-size="42" font-weight="600" letter-spacing="0.18em">${title}</text>` +
  `<text x="0" y="56" fill="#9a968c" font-family="JetBrains Mono, DejaVu Sans Mono, ui-monospace, monospace" ` +
  `font-size="20" font-weight="400">` +
  `<tspan x="0" dy="0">An infinite gallery of books —</tspan>` +
  `<tspan x="0" dy="28">every page already written.</tspan>` +
  `</text>` +
  `</g>` +
  `</svg>\n`;

const svgPath = join(root, "web/og.svg");
const pngPath = join(root, "web/og.png");
writeFileSync(svgPath, out);
console.log(
  `wrote web/og.svg (${W}×${H}, sigil ${tile.hash} hue ${tile.hue})`,
);

const magick = spawnSync("magick", [svgPath, "-strip", pngPath], {
  encoding: "utf8",
});
if (magick.status !== 0) {
  console.error(
    magick.stderr || "magick failed — install ImageMagick, then re-run",
  );
  process.exit(magick.status ?? 1);
}
console.log("wrote web/og.png");
