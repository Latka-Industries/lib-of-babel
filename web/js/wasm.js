// Single entry point for the deterministic WASM generator core. The rest of the
// app imports its functions from here; init() must be awaited once (see main.js).
export { default as init } from "../pkg/lib_of_babel.js";
export {
  gallery_titles_json,
  node_hash_hex,
  book_text_for,
  book_image,
  generator_version,
  default_alphabet,
  set_universe,
  universe_seed_for,
} from "../pkg/lib_of_babel.js";
