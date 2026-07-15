// Per-gallery sigil — a deterministic radial emblem drawn from the gallery hash.
// Pure function of (hash, accent hue): same room (coordinate + universe) →
// same hash → same sigil, every time, for everyone. A "face" for each of the
// infinitely many galleries.

// small deterministic PRNG (mulberry32) so every visual choice traces back to
// the hash bytes; seeded from the hash so the sigil is reproducible.
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sigilSvg(hashHex, accentHue) {
  // fold extra hash bytes into the 32-bit seed so distant galleries diverge
  const seed =
    ((parseInt(hashHex.slice(0, 8), 16) ^ parseInt(hashHex.slice(8, 16) || "0", 16)) >>> 0) ||
    1;
  const rnd = mulberry32(seed);
  const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  const rf = (lo, hi) => lo + rnd() * (hi - lo);
  const h = accentHue;
  const pal = [
    `hsl(${h} 74% 66%)`,
    `hsl(${(h + 40) % 360} 66% 56%)`,
    `hsl(${(h + 312) % 360} 62% 68%)`,
  ];
  const pick = () => pal[Math.floor(rnd() * pal.length)];
  const C = 50;

  // an irregular set of vertices: jittered angles + wildly varying radii so the
  // outline is a bizarre, lopsided polygon (no rotational symmetry).
  const n = ri(5, 11);
  const base = ri(30, 43);
  const rot = rnd() * Math.PI * 2;
  const jit = rf(0.15, 0.55); // angular chaos
  const verts = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i * 2 * Math.PI) / n + (rnd() - 0.5) * ((2 * Math.PI) / n) * jit * 2;
    const r = base * rf(0.42, 1.0);
    verts.push([C + r * Math.cos(a), C + r * Math.sin(a)]);
  }
  const fx = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

  const ring = `<circle cx="50" cy="50" r="46.5" fill="none" stroke="hsl(${h} 60% 55%)" stroke-width="0.8" opacity="0.3"/>`;

  // the lopsided polygon body
  const poly = `<polygon points="${verts.map(fx).join(" ")}" fill="hsl(${h} 60% 52% / 0.16)" stroke="${pal[0]}" stroke-width="1.4" stroke-linejoin="round"/>`;

  // star-polygon chords: connect every k-th vertex, crossing the interior to
  // form the occult, woven look. k stays in [2, n-2] so chords actually cross.
  const k = ri(2, Math.max(2, n - 2));
  let chords = "";
  for (let i = 0; i < n; i++) {
    const a = verts[i], b = verts[(i + k) % n];
    chords += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${pick()}" stroke-width="0.8" opacity="0.7"/>`;
  }

  // a vertex node on each corner, sized irregularly
  let nodes = "";
  for (const p of verts) {
    nodes += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${rf(1.4, 3.2).toFixed(1)}" fill="${pick()}"/>`;
  }

  // off-center core spark (deliberately not at the centroid)
  const core = `<circle cx="${(C + rf(-5, 5)).toFixed(1)}" cy="${(C + rf(-5, 5)).toFixed(1)}" r="${ri(2, 4)}" fill="hsl(${(h + 40) % 360} 74% 82%)"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">${ring}${poly}${chords}${nodes}${core}</svg>`;
}
