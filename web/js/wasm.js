// Single entry point for the deterministic WASM generator core. The rest of the
// app imports its functions from here; init() must be awaited once (see main.js).
export { default as init } from "../pkg/lib_of_babel.js";
export {
  gallery_titles_json,
  node_hash_hex,
  node_hash_full_hex,
  book_text_for,
  page_text_for,
  search_page_span_for,
  search_page_embed_for,
  book_image,
  locate_page_json,
  generator_version,
  default_alphabet,
  set_universe,
  get_universe,
  universe_seed_for,
  prospect_batch_json,
} from "../pkg/lib_of_babel.js";
