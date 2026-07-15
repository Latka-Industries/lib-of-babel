//! Longest-prefix match of text against an alphabet's string cells.

/// Find the longest alphabet cell that is a prefix of `text[from..]`.
///
/// Returns `(cell_index, cell_byte_len)` or `None` if no cell matches.
#[must_use]
pub fn match_cell_at(ab: &[&str], text: &str, from: usize) -> Option<(usize, usize)> {
    let rest = &text[from..];
    if rest.is_empty() {
        return None;
    }
    let mut best: Option<(usize, usize)> = None;
    for (i, cell) in ab.iter().enumerate() {
        if rest.starts_with(cell) {
            let len = cell.len();
            if best.is_none_or(|(_, bl)| len > bl) {
                best = Some((i, len));
            }
        }
    }
    best
}

/// Walk `text`, skipping newlines, yielding matched cell indices.
///
/// On the first unmatched scalar, returns `Err` with the byte offset and a
/// one-scalar sample of the invalid text.
pub fn text_to_cell_indices(text: &str, ab: &[&str]) -> Result<Vec<u8>, (usize, String)> {
    let mut out = Vec::new();
    let mut i = 0;
    let bytes = text.as_bytes();
    while i < bytes.len() {
        let ch = text[i..].chars().next().unwrap();
        let ch_len = ch.len_utf8();
        if ch == '\n' || ch == '\r' {
            i += ch_len;
            continue;
        }
        match match_cell_at(ab, text, i) {
            Some((idx, cell_len)) => {
                out.push(idx as u8);
                i += cell_len;
            }
            None => {
                return Err((i, ch.to_string()));
            }
        }
    }
    Ok(out)
}

/// Flatten search text: longest-match cells, collapse runs of space cells,
/// trim. Invalid → list of `(byte_offset, sample)`.
pub fn flatten_to_cells(text: &str, ab: &[&str]) -> Result<String, Vec<(usize, String)>> {
    let mut out = String::new();
    let mut invalid = Vec::new();
    let mut i = 0;
    let bytes = text.as_bytes();
    while i < bytes.len() {
        let ch = text[i..].chars().next().unwrap();
        let ch_len = ch.len_utf8();
        if ch == '\n' || ch == '\r' {
            i += ch_len;
            continue;
        }
        match match_cell_at(ab, text, i) {
            Some((idx, cell_len)) => {
                let cell = ab[idx];
                if cell == " " && out.ends_with(' ') {
                    i += cell_len;
                    continue;
                }
                out.push_str(cell);
                i += cell_len;
            }
            None => {
                invalid.push((i, ch.to_string()));
                i += ch_len;
            }
        }
    }
    if !invalid.is_empty() {
        return Err(invalid);
    }
    Ok(out.trim().to_string())
}

/// Count how many alphabet cells are encoded in `flat` (concatenated cells).
#[must_use]
pub fn count_cells(flat: &str, ab: &[&str]) -> usize {
    let mut n = 0;
    let mut i = 0;
    while i < flat.len() {
        match match_cell_at(ab, flat, i) {
            Some((_, cell_len)) => {
                n += 1;
                i += cell_len;
            }
            None => break,
        }
    }
    n
}

/// Take a slice of `flat` covering `start..start+len` **cells** (not bytes).
#[must_use]
pub fn slice_cells(flat: &str, ab: &[&str], start: usize, len: usize) -> String {
    let mut out = String::new();
    let mut i = 0;
    let mut cell_i = 0;
    while i < flat.len() && cell_i < start + len {
        match match_cell_at(ab, flat, i) {
            Some((_, cell_len)) => {
                if cell_i >= start {
                    out.push_str(&flat[i..i + cell_len]);
                }
                i += cell_len;
                cell_i += 1;
            }
            None => break,
        }
    }
    out
}
