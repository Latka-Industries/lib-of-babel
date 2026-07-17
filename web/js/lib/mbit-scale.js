// Mbit-notice scale bands + placeholder math (no DOM / WASM).

/**
 * @param {number} bits
 * @returns {"slim"|"mid"|"book"|"fat"|"titan"}
 */
export function mbitScaleTier(bits) {
  const m = bits / 1e6;
  if (m < 0.2) return "slim";
  if (m < 2) return "mid";
  if (m < 10) return "book";
  if (m < 100) return "fat";
  return "titan";
}

/** Representative bit-widths for each band (dev sheet / docs). */
export const MBIT_SCALE_SAMPLES = [
  { tier: "slim", bits: 80_000, note: "just past page-map (~48 kbit)" },
  { tier: "mid", bits: 1_000_000, note: "1 Mbit" },
  { tier: "book", bits: 6_400_000, note: "Basile book-map ≈6.4 Mbit" },
  { tier: "fat", bits: 40_000_000, note: "40 Mbit" },
  { tier: "titan", bits: 200_000_000, note: "200 Mbit" },
];

/**
 * @param {number} digitCount
 * @param {(key: string, vars?: Record<string, string>) => string} translate
 */
export function reciteDuration(digitCount, translate) {
  const sec = Math.max(1, digitCount);
  if (sec < 3600) {
    return translate("gallery.mbitNotice.recite.minutes", {
      n: String(Math.max(1, Math.round(sec / 60))),
    });
  }
  if (sec < 86_400) {
    const hours = sec / 3600;
    return translate("gallery.mbitNotice.recite.hours", {
      n: hours >= 10 ? String(Math.round(hours)) : hours.toFixed(1),
    });
  }
  const days = sec / 86_400;
  if (days < 14) {
    return translate("gallery.mbitNotice.recite.days", {
      n: String(Math.max(1, Math.round(days))),
    });
  }
  if (days < 60) {
    return translate("gallery.mbitNotice.recite.weeks", {
      n: String(Math.max(1, Math.round(days / 7))),
    });
  }
  if (days < 730) {
    const months = days / 30.44;
    return translate("gallery.mbitNotice.recite.months", {
      n: months >= 10 ? String(Math.round(months)) : months.toFixed(1),
    });
  }
  const years = days / 365.25;
  return translate("gallery.mbitNotice.recite.years", {
    n: years >= 10 ? String(Math.round(years)) : years.toFixed(1),
  });
}

/**
 * Human storage size for a bit-width (`≈10 KB`, `≈0.8 MB`).
 * @param {number} bits
 * @param {string} [locale]
 */
export function formatCoordBytes(bits, locale = "en") {
  const bytes = Math.max(0, bits) / 8;
  if (bytes < 1024) {
    return `≈${Math.max(1, Math.round(bytes)).toLocaleString(locale)} B`;
  }
  if (bytes < 1024 * 1024) {
    const kib = bytes / 1024;
    const n = kib >= 10 ? Math.round(kib) : Number(kib.toFixed(1));
    return `≈${n.toLocaleString(locale)} KB`;
  }
  const mib = bytes / (1024 * 1024);
  const n = mib >= 10 ? Math.round(mib) : Number(mib.toFixed(1));
  return `≈${n.toLocaleString(locale)} MB`;
}

/**
 * @param {number} bits
 * @param {{ locale?: string, t: (key: string, vars?: Record<string, string>) => string }} opts
 */
export function mbitScaleVars(bits, { locale = "en", t: translate }) {
  const n = Math.max(0, bits);
  const m = n / 1e6;
  const mbit =
    m >= 100 ? m.toFixed(0) : m >= 10 ? m.toFixed(1) : m < 0.01 ? m.toFixed(3) : m.toFixed(2);
  const log10 = n * Math.log10(2);
  let mag;
  if (log10 < 10_000) {
    mag = `≈10^${Math.round(log10).toLocaleString(locale)}`;
  } else {
    const order = Math.max(0, Math.floor(Math.log10(log10)));
    const coef = log10 / 10 ** order;
    mag = `≈10^(${coef.toFixed(1)}×10^${order})`;
  }
  const digitCount = Math.max(1, Math.round(log10));
  const digits = digitCount.toLocaleString(locale);
  const mib = n / 8 / (1024 * 1024);
  const mb = mib >= 100 ? mib.toFixed(0) : mib >= 10 ? mib.toFixed(0) : mib.toFixed(1);
  return {
    mbit,
    mag,
    digits,
    mb,
    bytes: formatCoordBytes(n, locale),
    recite: reciteDuration(digitCount, translate),
  };
}
