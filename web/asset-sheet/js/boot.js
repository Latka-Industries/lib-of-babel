import { THEME_KEY, getTheme, toggleTheme, syncThemeToggle } from "../../js/chrome/theme.js";
import { wireDropdownMenu } from "../../js/chrome/dropdown.js";
import { loadSections } from "./includes.js";
import {
  paintInventory,
  paintMbit,
  paintSwatches,
  paintSheetCompare,
  collectThemeCustomProps,
  discoverChipVariants,
} from "./paint.js";

const SHEET_NAV = {
  tokens: "tokens",
  type: "type",
  controls: "controls",
  chrome: "chrome",
  stage: "stage",
  find: "find",
  searchBands: "search",
  compare: "compare",
  dialogs: "dialogs",
  reader: "reader",
  history: "history",
  mbit: "mbit copy",
};

function jumpSheetSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
  const label = document.getElementById("sheetNavLabel");
  if (label) label.textContent = SHEET_NAV[id] || "sections…";
}

function wireTheme() {
  const themeBtn = document.getElementById("themeToggle");
  themeBtn?.addEventListener("click", () => {
    toggleTheme();
    syncThemeToggle((k) =>
      k === "header.themeToLight"
        ? "switch to light mode"
        : k === "header.themeToDark"
          ? "switch to dark mode"
          : k,
    );
    paintSwatches();
  });
  syncThemeToggle((k) =>
    k === "header.themeToLight"
      ? "switch to light mode"
      : k === "header.themeToDark"
        ? "switch to dark mode"
        : k,
  );
}

function wireNav() {
  wireDropdownMenu(
    "sheetNavDd",
    Object.fromEntries(
      Object.keys(SHEET_NAV).map((id) => [id, () => jumpSheetSection(id)]),
    ),
  );
  const hash = location.hash.replace(/^#/, "");
  if (hash && SHEET_NAV[hash]) jumpSheetSection(hash);
}

function wireDemoDropdowns() {
  wireDropdownMenu("sheetDd", {
    copy: () => {},
    search: () => {},
    export: () => {},
    verify: () => {},
    reset: () => {},
  });
  wireDropdownMenu("sheetSaveDd", {
    txt: () => {},
    img: () => {},
  });
  wireDropdownMenu("sheetBookSaveDd", {
    txt: () => {},
    img: () => {},
  });
}

function wireCompare() {
  const compareRange = document.getElementById("sheetCompareRange");
  const onCompare = () =>
    paintSheetCompare(Number(compareRange?.value || 50) / 100);
  compareRange?.addEventListener("input", onCompare);
  compareRange?.addEventListener("change", onCompare);
  onCompare();
}

function wireLocale() {
  let locale = "en";
  document.querySelectorAll(".sheet-locale-tabs [data-locale]").forEach((btn) => {
    btn.addEventListener("click", () => {
      locale = btn.getAttribute("data-locale") || "en";
      document.querySelectorAll(".sheet-locale-tabs [data-locale]").forEach((b) => {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      paintMbit(locale);
      paintInventory(locale);
    });
  });
  paintMbit(locale);
}

async function main() {
  try {
    await loadSections();
  } catch (err) {
    console.error(err);
    const mainEl = document.getElementById("sheetMain");
    if (mainEl) {
      mainEl.insertAdjacentHTML(
        "afterbegin",
        `<p class="find-dim search-error" style="padding:1rem 0">${String(err.message || err)}</p>`,
      );
    }
    return;
  }

  wireTheme();
  paintSwatches();
  paintInventory("en");
  wireNav();
  wireDemoDropdowns();
  wireCompare();
  wireLocale();

  console.info(
    `asset-sheet · theme key ${THEME_KEY} · ${getTheme()} · tokens ${collectThemeCustomProps().length} · chips ${discoverChipVariants().length}`,
  );
}

void main();
