# Alphabet pack source files

One Feistel cell per line. Trailing space / comma / period are **not** listed —
`mise run gen-alphabets` appends them when emitting `src/config/generated/packs.rs`.

The web UI does **not** mirror these files; it loads cells from WASM
(`alphabet_symbols_json`) after `init()`.

```bash
mise run gen-alphabets
```

`mise run check-alphabets` (also part of `mise run check` / CI) regenerates and fails if the committed Rust output drifted.

Currently extracted: `chinese`, `chinese_trad`, `thai`, `khmer`, `amharic`, `japanese`, `korean`, `hindi`, `bengali`, `tamil`, `telugu`, `kannada`, `malayalam`, `gujarati`, `punjabi`, `odia`, `vietnamese`.
