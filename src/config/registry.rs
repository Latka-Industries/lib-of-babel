//! Named alphabet lenses — links [`ALPHABET_ID`](super::ids::ALPHABET_ID) to
//! [`ALPHABET_TABLE`](super::tables::ALPHABET_TABLE).

use super::DEFAULT_ALPHABET;
use super::ids::ALPHABET_ID;
use super::tables::ALPHABET_TABLE;

/// Named alphabet lens (id is what permalinks / Feistel keys use).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct AlphabetDef {
    pub id: u32,
    pub name: &'static str,
    pub symbols: &'static [&'static str],
}

/// Built-in lenses (single registry — lookup by id; unknown → Basile).
pub const ALPHABET_REGISTRY: &[AlphabetDef] = &[
    AlphabetDef {
        id: ALPHABET_ID.borges,
        name: "Borges",
        symbols: ALPHABET_TABLE.borges,
    },
    AlphabetDef {
        id: ALPHABET_ID.basile,
        name: "Basile",
        symbols: ALPHABET_TABLE.basile,
    },
    AlphabetDef {
        id: ALPHABET_ID.basile_plus,
        name: "Basile++",
        symbols: ALPHABET_TABLE.basile_plus,
    },
    AlphabetDef {
        id: ALPHABET_ID.basile_hash,
        name: "Basile#",
        symbols: ALPHABET_TABLE.basile_hash,
    },
    AlphabetDef {
        id: ALPHABET_ID.italian,
        name: "Italian",
        symbols: ALPHABET_TABLE.italian,
    },
    AlphabetDef {
        id: ALPHABET_ID.german,
        name: "German",
        symbols: ALPHABET_TABLE.german,
    },
    AlphabetDef {
        id: ALPHABET_ID.dutch,
        name: "Dutch",
        symbols: ALPHABET_TABLE.dutch,
    },
    AlphabetDef {
        id: ALPHABET_ID.danish_norwegian,
        name: "Danish/Norwegian",
        symbols: ALPHABET_TABLE.danish_norwegian,
    },
    AlphabetDef {
        id: ALPHABET_ID.swedish,
        name: "Swedish",
        symbols: ALPHABET_TABLE.swedish,
    },
    AlphabetDef {
        id: ALPHABET_ID.turkish,
        name: "Turkish",
        symbols: ALPHABET_TABLE.turkish,
    },
    AlphabetDef {
        id: ALPHABET_ID.finnish,
        name: "Finnish",
        symbols: ALPHABET_TABLE.finnish,
    },
    AlphabetDef {
        id: ALPHABET_ID.spanish,
        name: "Spanish",
        symbols: ALPHABET_TABLE.spanish,
    },
    AlphabetDef {
        id: ALPHABET_ID.romanian,
        name: "Romanian",
        symbols: ALPHABET_TABLE.romanian,
    },
    AlphabetDef {
        id: ALPHABET_ID.portuguese,
        name: "Portuguese",
        symbols: ALPHABET_TABLE.portuguese,
    },
    AlphabetDef {
        id: ALPHABET_ID.estonian,
        name: "Estonian",
        symbols: ALPHABET_TABLE.estonian,
    },
    AlphabetDef {
        id: ALPHABET_ID.hungarian,
        name: "Hungarian",
        symbols: ALPHABET_TABLE.hungarian,
    },
    AlphabetDef {
        id: ALPHABET_ID.french,
        name: "French",
        symbols: ALPHABET_TABLE.french,
    },
    AlphabetDef {
        id: ALPHABET_ID.greek,
        name: "Greek",
        symbols: ALPHABET_TABLE.greek,
    },
    AlphabetDef {
        id: ALPHABET_ID.polish,
        name: "Polish",
        symbols: ALPHABET_TABLE.polish,
    },
    AlphabetDef {
        id: ALPHABET_ID.czech,
        name: "Czech",
        symbols: ALPHABET_TABLE.czech,
    },
    AlphabetDef {
        id: ALPHABET_ID.slovak,
        name: "Slovak",
        symbols: ALPHABET_TABLE.slovak,
    },
    AlphabetDef {
        id: ALPHABET_ID.croatian_serbian,
        name: "Croatian/Serbian",
        symbols: ALPHABET_TABLE.croatian_serbian,
    },
    AlphabetDef {
        id: ALPHABET_ID.latvian,
        name: "Latvian",
        symbols: ALPHABET_TABLE.latvian,
    },
    AlphabetDef {
        id: ALPHABET_ID.lithuanian,
        name: "Lithuanian",
        symbols: ALPHABET_TABLE.lithuanian,
    },
    AlphabetDef {
        id: ALPHABET_ID.albanian,
        name: "Albanian",
        symbols: ALPHABET_TABLE.albanian,
    },
    AlphabetDef {
        id: ALPHABET_ID.russian,
        name: "Russian",
        symbols: ALPHABET_TABLE.russian,
    },
    AlphabetDef {
        id: ALPHABET_ID.ukrainian,
        name: "Ukrainian",
        symbols: ALPHABET_TABLE.ukrainian,
    },
    AlphabetDef {
        id: ALPHABET_ID.bulgarian,
        name: "Bulgarian",
        symbols: ALPHABET_TABLE.bulgarian,
    },
    AlphabetDef {
        id: ALPHABET_ID.icelandic,
        name: "Icelandic",
        symbols: ALPHABET_TABLE.icelandic,
    },
    AlphabetDef {
        id: ALPHABET_ID.slovenian,
        name: "Slovenian",
        symbols: ALPHABET_TABLE.slovenian,
    },
    AlphabetDef {
        id: ALPHABET_ID.belarusian,
        name: "Belarusian",
        symbols: ALPHABET_TABLE.belarusian,
    },
    AlphabetDef {
        id: ALPHABET_ID.macedonian,
        name: "Macedonian",
        symbols: ALPHABET_TABLE.macedonian,
    },
    AlphabetDef {
        id: ALPHABET_ID.serbian_cyrillic,
        name: "Serbian Cyrillic",
        symbols: ALPHABET_TABLE.serbian_cyrillic,
    },
    AlphabetDef {
        id: ALPHABET_ID.catalan,
        name: "Catalan",
        symbols: ALPHABET_TABLE.catalan,
    },
    AlphabetDef {
        id: ALPHABET_ID.basque,
        name: "Basque",
        symbols: ALPHABET_TABLE.basque,
    },
    AlphabetDef {
        id: ALPHABET_ID.welsh,
        name: "Welsh",
        symbols: ALPHABET_TABLE.welsh,
    },
    AlphabetDef {
        id: ALPHABET_ID.irish,
        name: "Irish",
        symbols: ALPHABET_TABLE.irish,
    },
    AlphabetDef {
        id: ALPHABET_ID.maltese,
        name: "Maltese",
        symbols: ALPHABET_TABLE.maltese,
    },
    AlphabetDef {
        id: ALPHABET_ID.armenian,
        name: "Armenian",
        symbols: ALPHABET_TABLE.armenian,
    },
    AlphabetDef {
        id: ALPHABET_ID.georgian,
        name: "Georgian",
        symbols: ALPHABET_TABLE.georgian,
    },
    AlphabetDef {
        id: ALPHABET_ID.hebrew,
        name: "Hebrew",
        symbols: ALPHABET_TABLE.hebrew,
    },
    AlphabetDef {
        id: ALPHABET_ID.arabic,
        name: "Arabic",
        symbols: ALPHABET_TABLE.arabic,
    },
    AlphabetDef {
        id: ALPHABET_ID.persian,
        name: "Persian",
        symbols: ALPHABET_TABLE.persian,
    },
    AlphabetDef {
        id: ALPHABET_ID.nko,
        name: "N'Ko",
        symbols: ALPHABET_TABLE.nko,
    },
    AlphabetDef {
        id: ALPHABET_ID.amharic,
        name: "Amharic",
        symbols: ALPHABET_TABLE.amharic,
    },
    AlphabetDef {
        id: ALPHABET_ID.swahili,
        name: "Swahili",
        symbols: ALPHABET_TABLE.swahili,
    },
    AlphabetDef {
        id: ALPHABET_ID.afrikaans,
        name: "Afrikaans",
        symbols: ALPHABET_TABLE.afrikaans,
    },
    AlphabetDef {
        id: ALPHABET_ID.hausa,
        name: "Hausa",
        symbols: ALPHABET_TABLE.hausa,
    },
    AlphabetDef {
        id: ALPHABET_ID.yoruba,
        name: "Yoruba",
        symbols: ALPHABET_TABLE.yoruba,
    },
    AlphabetDef {
        id: ALPHABET_ID.igbo,
        name: "Igbo",
        symbols: ALPHABET_TABLE.igbo,
    },
    AlphabetDef {
        id: ALPHABET_ID.wolof,
        name: "Wolof",
        symbols: ALPHABET_TABLE.wolof,
    },
    AlphabetDef {
        id: ALPHABET_ID.tifinagh,
        name: "Tifinagh",
        symbols: ALPHABET_TABLE.tifinagh,
    },
    AlphabetDef {
        id: ALPHABET_ID.japanese,
        name: "Japanese",
        symbols: ALPHABET_TABLE.japanese,
    },
    AlphabetDef {
        id: ALPHABET_ID.korean,
        name: "Korean",
        symbols: ALPHABET_TABLE.korean,
    },
    AlphabetDef {
        id: ALPHABET_ID.chinese,
        name: "Chinese",
        symbols: ALPHABET_TABLE.chinese,
    },
    AlphabetDef {
        id: ALPHABET_ID.hindi,
        name: "Hindi",
        symbols: ALPHABET_TABLE.hindi,
    },
    AlphabetDef {
        id: ALPHABET_ID.bengali,
        name: "Bengali",
        symbols: ALPHABET_TABLE.bengali,
    },
    AlphabetDef {
        id: ALPHABET_ID.tamil,
        name: "Tamil",
        symbols: ALPHABET_TABLE.tamil,
    },
    AlphabetDef {
        id: ALPHABET_ID.telugu,
        name: "Telugu",
        symbols: ALPHABET_TABLE.telugu,
    },
    AlphabetDef {
        id: ALPHABET_ID.kannada,
        name: "Kannada",
        symbols: ALPHABET_TABLE.kannada,
    },
    AlphabetDef {
        id: ALPHABET_ID.malayalam,
        name: "Malayalam",
        symbols: ALPHABET_TABLE.malayalam,
    },
    AlphabetDef {
        id: ALPHABET_ID.gujarati,
        name: "Gujarati",
        symbols: ALPHABET_TABLE.gujarati,
    },
    AlphabetDef {
        id: ALPHABET_ID.punjabi,
        name: "Punjabi",
        symbols: ALPHABET_TABLE.punjabi,
    },
    AlphabetDef {
        id: ALPHABET_ID.odia,
        name: "Odia",
        symbols: ALPHABET_TABLE.odia,
    },
    AlphabetDef {
        id: ALPHABET_ID.azerbaijani,
        name: "Azerbaijani",
        symbols: ALPHABET_TABLE.azerbaijani,
    },
    AlphabetDef {
        id: ALPHABET_ID.kazakh,
        name: "Kazakh",
        symbols: ALPHABET_TABLE.kazakh,
    },
    AlphabetDef {
        id: ALPHABET_ID.uzbek,
        name: "Uzbek",
        symbols: ALPHABET_TABLE.uzbek,
    },
    AlphabetDef {
        id: ALPHABET_ID.turkmen,
        name: "Turkmen",
        symbols: ALPHABET_TABLE.turkmen,
    },
    AlphabetDef {
        id: ALPHABET_ID.kyrgyz,
        name: "Kyrgyz",
        symbols: ALPHABET_TABLE.kyrgyz,
    },
    AlphabetDef {
        id: ALPHABET_ID.mongolian,
        name: "Mongolian",
        symbols: ALPHABET_TABLE.mongolian,
    },
    AlphabetDef {
        id: ALPHABET_ID.filipino,
        name: "Filipino",
        symbols: ALPHABET_TABLE.filipino,
    },
    AlphabetDef {
        id: ALPHABET_ID.vietnamese,
        name: "Vietnamese",
        symbols: ALPHABET_TABLE.vietnamese,
    },
    AlphabetDef {
        id: ALPHABET_ID.thai,
        name: "Thai",
        symbols: ALPHABET_TABLE.thai,
    },
    AlphabetDef {
        id: ALPHABET_ID.khmer,
        name: "Khmer",
        symbols: ALPHABET_TABLE.khmer,
    },
];

/// Built-in lenses. Unknown ids fall back to Basile (legacy `alphabet()` behavior).
#[must_use]
pub fn alphabet_def(alphabet_id: u32) -> AlphabetDef {
    ALPHABET_REGISTRY
        .iter()
        .copied()
        .find(|a| a.id == alphabet_id)
        .unwrap_or_else(|| {
            ALPHABET_REGISTRY
                .iter()
                .copied()
                .find(|a| a.id == DEFAULT_ALPHABET)
                .expect("Basile is registered")
        })
}

/// Symbol table for an alphabet id (named European lenses + Borges / Basile).
///
/// Unknown ids use the Basile symbol table (legacy behaviour).
#[inline]
#[must_use]
pub fn alphabet(alphabet_id: u32) -> &'static [&'static str] {
    alphabet_def(alphabet_id).symbols
}
