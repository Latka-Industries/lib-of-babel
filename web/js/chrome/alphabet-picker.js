// Header alphabet lens picker — button + dialog (replaces the overflowing <select>).

import {
  ALPHABET_REGISTRY,
  DEFAULT_ALPHABET_ID,
  alphabetEntry,
  listAlphabets,
} from "../lib/constants.js";
import { t } from "../lib/i18n.js";
import { el, escapeHtml, openModal } from "../lib/util.js";

/** Active family key in the picker dialog. */
let pickerGroup = null;
/** Last selected lens id (for highlight / open focusing). */
let pickerSelectedId = DEFAULT_ALPHABET_ID;

/** Compact label for the header button (short · endonym). */
export function alphabetPickerLabel(alphabetId = DEFAULT_ALPHABET_ID) {
  const e = alphabetEntry(alphabetId);
  return `${e.short} · ${e.native || e.name}`;
}

/** Stamp the header button from the live lens id. */
export function syncAlphabetPickerLabel(alphabetId = DEFAULT_ALPHABET_ID) {
  pickerSelectedId = ensureKnownAlphabetId(alphabetId);
  const btn = el("alphabetBtn");
  const label = el("alphabetBtnLabel");
  const text = alphabetPickerLabel(pickerSelectedId);
  if (label) label.textContent = text;
  else if (btn) btn.textContent = text;
  if (btn) {
    btn.setAttribute("aria-label", `${t("alphabet.picker.h")}: ${text}`);
  }
}

/**
 * Ensure `alphabetId` is a known registry id; returns Basile when unknown.
 */
export function ensureKnownAlphabetId(alphabetId = DEFAULT_ALPHABET_ID) {
  if (ALPHABET_REGISTRY.some((e) => e.id === alphabetId)) return alphabetId;
  return DEFAULT_ALPHABET_ID;
}

function groupMap() {
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
  return { groups, byGroup };
}

function groupForId(alphabetId, byGroup) {
  for (const [group, lenses] of byGroup) {
    if (lenses.some((l) => l.id === alphabetId)) return group;
  }
  return null;
}

/** Rebuild / refresh the picker body for the active family. */
export function renderAlphabetPicker(selectedId = pickerSelectedId) {
  const host = el("alphabetPickerList");
  if (!host) return;

  const { groups, byGroup } = groupMap();
  const currentId = ensureKnownAlphabetId(selectedId);
  pickerSelectedId = currentId;
  const selectedGroup = groupForId(currentId, byGroup);

  if (!pickerGroup || !byGroup.has(pickerGroup)) {
    pickerGroup = selectedGroup ?? groups[0] ?? null;
  }
  if (!pickerGroup) {
    host.replaceChildren();
    return;
  }

  const active = pickerGroup;
  const activeLenses = byGroup.get(active) || [];

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

  const lensButtons = activeLenses
    .map((lens) => {
      const name = escapeHtml(lens.native);
      const short = escapeHtml(
        alphabetEntry(lens.id).short || String(lens.id),
      );
      const on =
        lens.id === currentId
          ? ' aria-current="true" class="alphabet-pick-lens is-current"'
          : ' class="alphabet-pick-lens"';
      return (
        `<button type="button"${on} data-alphabet-id="${lens.id}">` +
        `<span class="alphabet-pick-short">${short}</span>` +
        `<span class="alphabet-pick-native">${name}</span>` +
        `<span class="alphabet-pick-meta">${lens.symbols.length}</span>` +
        `</button>`
      );
    })
    .join("");

  let browse = host.querySelector(".alpha-browse");
  if (!browse) {
    host.innerHTML =
      `<div class="alpha-browse alphabet-picker-browse">` +
      `<div class="alpha-family-rail">` +
      `<label class="alpha-family-select-wrap">` +
      `<span class="alpha-family-select-label">${escapeHtml(t("about.alphabets.indexLabel"))}</span>` +
      `<select class="alpha-family-select" aria-label="${escapeHtml(t("about.alphabets.indexLabel"))}">${selectOpts}</select>` +
      `</label>` +
      `<nav class="alpha-family-list" aria-label="${escapeHtml(t("about.alphabets.indexLabel"))}">${familyButtons}</nav>` +
      `</div>` +
      `<div class="alphabet-pick-panel" tabindex="-1">` +
      `<div class="alphabet-pick-lenses"></div>` +
      `</div>` +
      `</div>`;
    browse = host.querySelector(".alpha-browse");
    const setGroup = (group) => {
      if (!group || group === pickerGroup) return;
      pickerGroup = group;
      renderAlphabetPicker(pickerSelectedId);
    };
    host.querySelectorAll(".alpha-family-btn").forEach((btn) => {
      btn.addEventListener("click", () => setGroup(btn.getAttribute("data-group")));
    });
    const sel = host.querySelector(".alpha-family-select");
    if (sel) sel.addEventListener("change", () => setGroup(sel.value));
  } else {
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
      if (sel.value !== active) sel.value = active;
    }
  }

  const lensesHost = host.querySelector(".alphabet-pick-lenses");
  if (lensesHost) {
    lensesHost.innerHTML = lensButtons;
    const current = lensesHost.querySelector(".is-current");
    if (current) {
      requestAnimationFrame(() => {
        current.scrollIntoView({ block: "nearest" });
      });
    }
  }
}

/** Open the picker focused on the family that owns `selectedId`. */
export function openAlphabetPicker(selectedId = pickerSelectedId) {
  const { byGroup } = groupMap();
  const currentId = ensureKnownAlphabetId(selectedId);
  pickerSelectedId = currentId;
  pickerGroup = groupForId(currentId, byGroup) ?? pickerGroup;
  renderAlphabetPicker(currentId);
  openModal("alphabetModal");
  const current = el("alphabetPickerList")?.querySelector(".is-current");
  if (current) current.focus();
}

/**
 * @param {() => number} getSelectedId live alphabet id
 * @param {(id: number) => void} onPick called with the chosen alphabet id
 */
export function wireAlphabetPicker(getSelectedId, onPick) {
  el("alphabetBtn")?.addEventListener("click", () =>
    openAlphabetPicker(getSelectedId()),
  );
  el("alphabetPickerList")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-alphabet-id]");
    if (!btn) return;
    const id = Number(btn.getAttribute("data-alphabet-id"));
    if (!Number.isFinite(id)) return;
    el("alphabetModal")?.close();
    onPick(id);
  });
}
