// Same-browser `#bo=` handoff for book-map Find hits (photo + whole-book text).

import { S } from "../gallery/state.js";
import { encodeCoordParam } from "../lib/coords.js";
import { kvSet } from "../lib/db.js";

const BOOK_OPEN_KEY = (id) => `book-open:${id}`;

function newHandoffId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Optional `imageRgba` skips slow virgin `book_image` on open.
 * Stores compact `c…` z/n + `scope` — never megadigit decimals.
 */
export async function stashBookOpen(
  hit,
  {
    universe = S.universeName,
    image = true,
    imageRgba = null,
    imageW = 0,
    imageH = 0,
    flat = null,
    scope = hit.scope || "book",
  } = {},
) {
  const id = newHandoffId();
  const payload = {
    z: encodeCoordParam(hit.z),
    n: encodeCoordParam(hit.n),
    b: Number(hit.book),
    a: hit.alphabet ?? S.alphabetId,
    u: universe ?? "",
    img: !!image,
    imageW: imageW || 0,
    imageH: imageH || 0,
    scope: scope === "page" ? "page" : "book",
  };
  if (typeof flat === "string" && flat.length) {
    payload.flat = flat;
  }
  if (imageRgba?.length) {
    payload.imageRgba =
      imageRgba instanceof Uint8Array
        ? imageRgba.slice()
        : new Uint8Array(imageRgba);
  }
  await kvSet(BOOK_OPEN_KEY(id), payload);
  return id;
}
