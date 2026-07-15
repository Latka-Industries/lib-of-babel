// Shadcn-style dropdown menus (vanilla) — actions… / save…

const openMenus = new Set();

function items(menu) {
  return [...menu.querySelectorAll('[role="menuitem"]:not([disabled])')];
}

function placeMenu(root) {
  const trigger = root.querySelector(".dd-trigger");
  const menu = root.querySelector(".dd-menu");
  if (!trigger || !menu) return;
  // Fixed so dialogs with overflow:hidden don't clip the panel.
  menu.style.position = "fixed";
  menu.style.top = "0";
  menu.style.left = "0";
  menu.style.right = "auto";
  menu.style.bottom = "auto";
  menu.style.minWidth = `${Math.max(trigger.offsetWidth, 176)}px`;
  menu.hidden = false;
  const tRect = trigger.getBoundingClientRect();
  const mRect = menu.getBoundingClientRect();
  const gap = 6;
  let top = tRect.bottom + gap;
  let left = tRect.left;
  if (top + mRect.height > window.innerHeight - 8) {
    top = Math.max(8, tRect.top - mRect.height - gap);
  }
  if (left + mRect.width > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - mRect.width - 8);
  }
  menu.style.top = `${Math.round(top)}px`;
  menu.style.left = `${Math.round(left)}px`;
}

function closeMenu(root) {
  if (!root?.classList.contains("is-open")) return;
  root.classList.remove("is-open");
  const trigger = root.querySelector(".dd-trigger");
  const menu = root.querySelector(".dd-menu");
  if (trigger) trigger.setAttribute("aria-expanded", "false");
  if (menu) {
    menu.hidden = true;
    menu.style.top = "";
    menu.style.left = "";
    menu.style.minWidth = "";
  }
  openMenus.delete(root);
}

function closeAll(except = null) {
  for (const root of [...openMenus]) {
    if (root !== except) closeMenu(root);
  }
}

function openMenu(root) {
  closeAll(root);
  const trigger = root.querySelector(".dd-trigger");
  const menu = root.querySelector(".dd-menu");
  if (!trigger || !menu) return;
  root.classList.add("is-open");
  trigger.setAttribute("aria-expanded", "true");
  placeMenu(root);
  openMenus.add(root);
  const first = items(menu)[0];
  first?.focus();
}

function toggleMenu(root) {
  if (root.classList.contains("is-open")) closeMenu(root);
  else openMenu(root);
}

function focusItem(menu, delta) {
  const list = items(menu);
  if (!list.length) return;
  const i = list.indexOf(document.activeElement);
  const next = list[(i < 0 ? 0 : i + delta + list.length) % list.length];
  next.focus();
}

let docWired = false;
function ensureDocListeners() {
  if (docWired) return;
  docWired = true;
  document.addEventListener("pointerdown", (e) => {
    for (const root of [...openMenus]) {
      if (!root.contains(e.target)) closeMenu(root);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !openMenus.size) return;
    const roots = [...openMenus];
    const last = roots[roots.length - 1];
    closeMenu(last);
    last?.querySelector(".dd-trigger")?.focus();
    e.preventDefault();
  });
  document.addEventListener("lob:close-dropdowns", () => closeAll());
  const reposition = () => {
    for (const root of openMenus) placeMenu(root);
  };
  window.addEventListener("resize", reposition);
  window.addEventListener("scroll", reposition, true);
}

/**
 * Wire a `.dd` root: trigger toggles the menu; `data-action` items call handlers.
 * @param {string} rootId
 * @param {Record<string, () => void>} handlers
 * @param {{ beforeAction?: () => void }} [opts]
 */
export function wireDropdownMenu(rootId, handlers, { beforeAction } = {}) {
  ensureDocListeners();
  const root = document.getElementById(rootId);
  if (!root) return;
  const trigger = root.querySelector(".dd-trigger");
  const menu = root.querySelector(".dd-menu");
  if (!trigger || !menu) return;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu(root);
  });

  trigger.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!root.classList.contains("is-open")) openMenu(root);
      else focusItem(menu, 1);
    }
  });

  menu.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusItem(menu, 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(menu, -1);
    } else if (e.key === "Home") {
      e.preventDefault();
      items(menu)[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      const list = items(menu);
      list[list.length - 1]?.focus();
    } else if (e.key === "Tab") {
      closeMenu(root);
    }
  });

  menu.addEventListener("click", (e) => {
    const item = e.target.closest("[data-action]");
    if (!item || !menu.contains(item)) return;
    const id = item.dataset.action;
    closeMenu(root);
    trigger.focus();
    beforeAction?.();
    handlers[id]?.();
  });
}

/** Close every open dropdown (e.g. before opening a modal from the header). */
export function closeDropdownMenus() {
  closeAll();
}
