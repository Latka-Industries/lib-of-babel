# Alphabet pack source files

One Feistel cell per line. Trailing space / comma / period are **not** listed —
`mise run gen-alphabets` appends them when emitting `src/config/generated/packs.rs`.

The web UI does **not** mirror these files; it loads cells from WASM
(`alphabet_symbols_json`) after `init()`.

```bash
mise run gen-alphabets
```

`mise run check-alphabets` (also part of `mise run check` / CI) regenerates and fails if the committed Rust output drifted.

## Currently extracted

| File | Cells (+punct) | Notes |
| --- | --- | --- |
| `chinese.txt` | 997 (1000) | Jun Da modern SC frequency pack; frozen permalink id `255` |
| `chinese_trad.txt` | 997 (1000) | Same ranking via OpenCC s2tw; id `1000` |
| `thai.txt` | 562 (565) | Grapheme clusters (C×vowel/tone); frozen id `108` |
| `khmer.txt` | 378 (381) | Grapheme clusters (C×dependent vowels); frozen id `109` |
| `korean.txt` | 247 (250) | Frequent Hangul syllables; id `250` |
| `hindi.txt` | 252 (255) | Devanagari clusters; id `99` |
| `bengali.txt` | 252 (255) | Bengali clusters; id `100` |
| `tamil.txt` | 247 (250) | Tamil clusters; id `101` |
| `telugu.txt` | 252 (255) | Telugu clusters; id `102` |
| `kannada.txt` | 252 (255) | Kannada clusters; id `103` |
| `malayalam.txt` | 252 (255) | Malayalam clusters; id `104` |
| `gujarati.txt` | 252 (255) | Gujarati clusters; id `105` |
| `punjabi.txt` | 252 (255) | Gurmukhi clusters; id `106` |
| `odia.txt` | 252 (255) | Odia clusters; id `107` |
| `amharic.txt` | 231 (234) | Ethiopic syllabary slice; id `234` |
| `vietnamese.txt` | 93 (96) | Latin + tone vowels; id `96` |
| `japanese.txt` | 92 (95) | Hiragana + katakāna gojūon (ゐ/ゑ omitted); id `95` |

Numbers are `.txt` line count, then Feistel length after gen appends ` ` `,` `.`.
