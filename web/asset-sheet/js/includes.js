/** Fetch section HTML partials into `[data-section]` mounts. */

const SECTIONS = [
  "tokens",
  "type",
  "controls",
  "chrome",
  "stage",
  "find",
  "compare",
  "dialogs",
  "mbit",
];

/**
 * Load every `[data-section]` mount. Throws if a partial is missing.
 * @param {ParentNode} [root=document]
 */
export async function loadSections(root = document) {
  const mounts = [...root.querySelectorAll("[data-section]")];
  if (!mounts.length) {
    throw new Error("asset-sheet: no [data-section] mounts found");
  }
  await Promise.all(
    mounts.map(async (el) => {
      const name = el.getAttribute("data-section");
      if (!name) throw new Error("asset-sheet: empty data-section");
      const url = new URL(`../sections/${name}.html`, import.meta.url);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`asset-sheet: failed to load ${url.pathname} (${res.status})`);
      }
      el.outerHTML = await res.text();
    }),
  );
  // Sanity: expected section ids present after inject
  for (const id of SECTIONS) {
    if (!document.getElementById(id)) {
      throw new Error(`asset-sheet: section #${id} missing after include`);
    }
  }
}
