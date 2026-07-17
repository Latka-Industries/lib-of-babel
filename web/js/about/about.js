// About guide: tabs, animated panel resize, alphabet lens browser.

import {
  listAlphabets,
  alphabetFamilyRefs,
  isTrailPunct,
} from "../lib/constants.js";
import { t, getLocale } from "../lib/i18n.js";
import { el, escapeHtml, openModal } from "../lib/util.js";
import { MBIT_SCALE_SAMPLES, mbitScaleVars } from "../lib/mbit-scale.js";

/** localStorage: first-landing guide already shown (same pattern as theme). */
export const SEEN_ABOUT_KEY = "lib-of-babel-seen-about";

export function hasSeenAbout() {
  try {
    return localStorage.getItem(SEEN_ABOUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSeenAbout() {
  try {
    localStorage.setItem(SEEN_ABOUT_KEY, "1");
  } catch {
    /* private mode — still fine in-session */
  }
}

/** Open the LIB·OF·BABEL guide (overview tab by default). */
export function openAboutGuide({ tab = "aboutTab-overview", animate = false } = {}) {
  selectAboutTab(tab, { animate });
  openModal("aboutModal");
}

const ABOUT_TAB_RESIZE_MS = 220;
/** @type {number} */
let aboutTabResizeToken = 0;

/** Active family in the About alphabets browser (registry group key). */
let aboutAlphaGroup = null;

function aboutBodyMaxHeightPx() {
  // Keep in sync with `.about-body { max-height: 74vh }`.
  return Math.round(window.innerHeight * 0.74);
}

export function selectAboutTab(tabId, { animate = true } = {}) {
  const tabs = [...document.querySelectorAll(".about-tab")];
  const panels = [...document.querySelectorAll(".about-panel")];
  const modal = el("aboutModal");
  const body = modal?.querySelector(".about-body");
  const current = tabs.find((t) => t.getAttribute("aria-selected") === "true");
  if (current?.id === tabId) return;

  const reduceMotion =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shouldAnimate = Boolean(animate && !reduceMotion && modal?.open && body);
  const fromH = shouldAnimate ? body.getBoundingClientRect().height : null;
  const token = ++aboutTabResizeToken;

  // Hold the current body height while swapping panels so the dialog cannot
  // flash to an uncapped auto height before the transition runs.
  if (fromH != null) {
    body.style.transition = "none";
    body.style.overflow = "hidden";
    body.style.height = `${fromH}px`;
  }

  for (const tab of tabs) {
    const on = tab.id === tabId;
    tab.setAttribute("aria-selected", on ? "true" : "false");
    tab.tabIndex = on ? 0 : -1;
  }
  for (const panel of panels) {
    const on = panel.getAttribute("aria-labelledby") === tabId;
    panel.classList.toggle("active", on);
    panel.hidden = !on;
  }

  if (fromH == null || !body) return;

  const styles = getComputedStyle(body);
  const padY =
    (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
  const active = panels.find((p) => !p.hidden);
  const toH = Math.min(
    Math.ceil((active?.scrollHeight || 0) + padY),
    aboutBodyMaxHeightPx(),
  );
  if (Math.abs(toH - fromH) < 2) {
    body.style.height = "";
    body.style.transition = "";
    body.style.overflow = "";
    return;
  }

  void body.offsetHeight;
  body.style.transition = `height ${ABOUT_TAB_RESIZE_MS}ms ease`;
  body.style.height = `${toH}px`;

  const clear = () => {
    if (token !== aboutTabResizeToken) return;
    body.style.height = "";
    body.style.transition = "";
    body.style.overflow = "";
    body.removeEventListener("transitionend", onEnd);
  };
  const onEnd = (ev) => {
    if (ev.target === body && ev.propertyName === "height") clear();
  };
  body.addEventListener("transitionend", onEnd);
  window.setTimeout(clear, ABOUT_TAB_RESIZE_MS + 80);
}

export function stepAboutTab(dir) {
  const tabs = [...document.querySelectorAll(".about-tab")];
  const i = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
  const next = tabs[(i + dir + tabs.length) % tabs.length];
  selectAboutTab(next.id);
  next.focus();
}

function alphabetRefsHtml(refs, className) {
  if (!refs?.length) return "";
  const items = refs
    .map(
      (r) =>
        `<li><a href="${escapeHtml(r.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title)}</a></li>`,
    )
    .join("");
  return (
    `<aside class="${className}">` +
    `<h6 class="alpha-refs-h">${escapeHtml(t("about.alphabets.refs"))}</h6>` +
    `<ul>${items}</ul>` +
    `</aside>`
  );
}

function alphabetLensHtml({ id, native, symbols, uiLocale, script, lang }) {
  const glyphs = symbols
    .map((ch) => {
      const punct = isTrailPunct(ch);
      // Space / comma / period: same tile style, literal glyphs (nbsp so space is visible).
      const shown = ch === " " ? "&nbsp;" : escapeHtml(ch);
      const title = ch === " " ? "" : escapeHtml(`“${ch}”`);
      return `<span class="alpha-glyph${punct ? " punct" : ""}"${title ? ` title="${title}"` : ""}>${shown}</span>`;
    })
    .join("");
  const meta = t("about.alphabet.meta", { n: symbols.length, id });
  const pack = uiLocale
    ? `<span class="alpha-lens-pack">${escapeHtml(
        t("about.alphabet.uiPack", { name: native }),
      )}</span>`
    : "";
  const blurb = t(`alphabet.lensBlurb.${id}`);
  const blurbHtml =
    blurb && blurb !== `alphabet.lensBlurb.${id}`
      ? `<p class="alpha-lens-blurb dim">${escapeHtml(blurb)}</p>`
      : "";
  // Per-lens script/lang so combining marks use that Noto face, not the chrome mono
  // stack (which paints Unicode dotted circles for Thai/Khmer/Indic clusters).
  const scriptAttr = escapeHtml(script || "latin");
  const langAttr = escapeHtml(lang || "en");
  return (
    `<article class="alpha-lens">` +
    `<div class="alpha-lens-head">` +
    `<strong>${escapeHtml(native)}</strong>` +
    `<span class="alpha-lens-meta">${meta}</span>` +
    pack +
    `</div>` +
    blurbHtml +
    `<div class="alpha-glyphs" data-script="${scriptAttr}" lang="${langAttr}" aria-label="${escapeHtml(native)}">${glyphs}</div>` +
    `</article>`
  );
}

export function renderAboutAlphabets() {
  const host = el("aboutAlphabetList");
  if (!host) return;
  const lenses = listAlphabets();
  const groups = [];
  const byGroup = new Map();
  for (const lens of lenses) {
    if (!byGroup.has(lens.group)) {
      byGroup.set(lens.group, []);
      groups.push(lens.group);
    }
    byGroup.get(lens.group).push(lens);
  }
  if (!aboutAlphaGroup || !byGroup.has(aboutAlphaGroup)) {
    aboutAlphaGroup = groups[0] ?? null;
  }
  if (!aboutAlphaGroup) {
    host.replaceChildren();
    return;
  }

  const active = aboutAlphaGroup;
  const activeLenses = byGroup.get(active);

  const familyButtons = groups
    .map((group) => {
      const label = escapeHtml(t(`alphabet.group.${group}`));
      const n = byGroup.get(group).length;
      const on = group === active ? ' aria-current="true"' : "";
      return (
        `<button type="button" class="alpha-family-btn" data-group="${escapeHtml(group)}"${on}>` +
        `<span class="alpha-family-name">${label}</span>` +
        `<span class="alpha-family-count">${n}</span>` +
        `</button>`
      );
    })
    .join("");

  const selectOpts = groups
    .map((group) => {
      const label = escapeHtml(t(`alphabet.group.${group}`));
      const sel = group === active ? " selected" : "";
      return `<option value="${escapeHtml(group)}"${sel}>${label}</option>`;
    })
    .join("");

  // Rebuild only when the shell is missing (locale refresh / first open). Group
  // switches patch the panel so the dialog height and rail scroll stay put.
  let browse = host.querySelector(".alpha-browse");
  if (!browse) {
    host.innerHTML =
      `<div class="alpha-browse">` +
      `<div class="alpha-family-rail">` +
      `<label class="alpha-family-select-wrap">` +
      `<span class="alpha-family-select-label">${escapeHtml(t("about.alphabets.indexLabel"))}</span>` +
      `<select class="alpha-family-select" aria-label="${escapeHtml(t("about.alphabets.indexLabel"))}">${selectOpts}</select>` +
      `</label>` +
      `<nav class="alpha-family-list" aria-label="${escapeHtml(t("about.alphabets.indexLabel"))}">${familyButtons}</nav>` +
      `</div>` +
      `<div class="alpha-family-panel" tabindex="-1">` +
      `<p class="alpha-family-blurb dim"></p>` +
      `<div class="alpha-family-refs-host"></div>` +
      `<div class="alpha-family-lenses"></div>` +
      `</div>` +
      `</div>`;
    browse = host.querySelector(".alpha-browse");
    const setGroup = (group) => {
      if (!group || group === aboutAlphaGroup) return;
      aboutAlphaGroup = group;
      renderAboutAlphabets();
    };
    host.querySelectorAll(".alpha-family-btn").forEach((btn) => {
      btn.addEventListener("click", () => setGroup(btn.getAttribute("data-group")));
    });
    const sel = host.querySelector(".alpha-family-select");
    if (sel) sel.addEventListener("change", () => setGroup(sel.value));
  } else {
    // Locale/chrome refresh: restamp family labels without remounting the shell.
    host.querySelectorAll(".alpha-family-btn").forEach((btn) => {
      const group = btn.getAttribute("data-group");
      const name = btn.querySelector(".alpha-family-name");
      const count = btn.querySelector(".alpha-family-count");
      if (name) name.textContent = t(`alphabet.group.${group}`);
      if (count && byGroup.has(group)) count.textContent = String(byGroup.get(group).length);
      if (group === active) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
    });
    const sel = host.querySelector(".alpha-family-select");
    if (sel) {
      [...sel.options].forEach((opt) => {
        opt.textContent = t(`alphabet.group.${opt.value}`);
        opt.selected = opt.value === active;
      });
    }
  }

  host.querySelectorAll(".alpha-family-btn").forEach((btn) => {
    if (btn.getAttribute("data-group") === active) btn.setAttribute("aria-current", "true");
    else btn.removeAttribute("aria-current");
  });
  const sel = host.querySelector(".alpha-family-select");
  if (sel && sel.value !== active) sel.value = active;

  const panel = host.querySelector(".alpha-family-panel");
  const blurb = host.querySelector(".alpha-family-blurb");
  const familyRefsHost = host.querySelector(".alpha-family-refs-host");
  const lensesHost = host.querySelector(".alpha-family-lenses");
  if (blurb) {
    blurb.textContent = t(`alphabet.blurb.${active}`);
  }
  if (familyRefsHost) {
    familyRefsHost.innerHTML = alphabetRefsHtml(
      alphabetFamilyRefs(active),
      "alpha-refs alpha-family-refs",
    );
  }
  if (lensesHost) {
    lensesHost.innerHTML = activeLenses.map(alphabetLensHtml).join("");
    lensesHost.scrollTop = 0;
  }
  if (panel) panel.scrollTop = 0;
}

/** Letter-analogy cell — only mid/book bands have a useful text-length compare. */
function scaleLettersCell(tier, vars) {
  if (tier === "mid" || tier === "book") {
    return escapeHtml(t(`about.scale.letters.${tier}`, vars));
  }
  return `<span class="dim">${escapeHtml(t("about.scale.letters.na"))}</span>`;
}

/** Representative Mbit bands table (same samples as the room notice / asset sheet). */
export function renderAboutScale() {
  const host = el("aboutScaleTable");
  if (!host) return;
  const locale = getLocale();
  const head = [
    t("about.scale.col.band"),
    t("about.scale.col.scalar"),
    t("about.scale.col.bytes"),
    t("about.scale.col.letters"),
    t("about.scale.col.recite"),
  ]
    .map((label) => `<th scope="col">${escapeHtml(label)}</th>`)
    .join("");
  const rows = MBIT_SCALE_SAMPLES.map(({ tier, bits }) => {
    const vars = mbitScaleVars(bits, { locale, t });
    const scalar = `≈${vars.mbit} Mbit · ${vars.mag}`;
    return (
      `<tr>` +
      `<th scope="row">${escapeHtml(t(`about.scale.band.${tier}`))}</th>` +
      `<td><code>${escapeHtml(scalar)}</code></td>` +
      `<td>${escapeHtml(vars.bytes)}</td>` +
      `<td>${scaleLettersCell(tier, vars)}</td>` +
      `<td>${escapeHtml(vars.recite)}</td>` +
      `</tr>`
    );
  }).join("");
  host.innerHTML =
    `<div class="about-scale-scroll">` +
    `<table class="about-scale-table">` +
    `<thead><tr>${head}</tr></thead>` +
    `<tbody>${rows}</tbody>` +
    `</table>` +
    `</div>`;
}

export function wireAboutTabs() {
  document.querySelectorAll(".about-tab").forEach((tab) => {
    tab.addEventListener("click", () => selectAboutTab(tab.id));
  });
  // Guide copy can deep-link to another section (ALPHABETS / BOOKS / SEARCH chips).
  el("aboutModal")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-about-tab]");
    if (!btn || !el("aboutModal")?.contains(btn)) return;
    const tabId = btn.getAttribute("data-about-tab");
    if (tabId) selectAboutTab(tabId);
  });
}
