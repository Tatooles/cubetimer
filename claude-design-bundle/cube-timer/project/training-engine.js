/* Training engine — shared logic for Cross / Algorithm trainers
 *  - ALG_SETS: catalogue of algorithm sets (PLL is fully populated with real algs;
 *    other sets use a mix of real cases + placeholder cases for design density)
 *  - mockCrossSolve(): deterministic placeholder cross solution
 *  - shortScramble(): trimmed 3x3 scramble for the "short" mode
 *  - TrainingStore: separate localStorage namespace from regular sessions
 */
(function () {
  'use strict';

  // ───────── Deterministic PRNG from a seed string ─────────
  function mulberry32(a) {
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function strHash(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // ───────── PLL: all 21 cases, real algs ─────────
  const PLL = [
    { name: 'Aa', group: 'A',     desc: '3 corners CW',  alg: "x R' U R' D2 R U' R' D2 R2" },
    { name: 'Ab', group: 'A',     desc: '3 corners CCW', alg: "x R2 D2 R U R' D2 R U' R" },
    { name: 'E',  group: 'E',     desc: 'Diagonal swap', alg: "x' R U' R' D R U R' D' R U R' D R U' R' D'" },
    { name: 'F',  group: 'F',     desc: 'Adjacent swap', alg: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
    { name: 'Ga', group: 'G',     desc: 'G perm A',      alg: "R2 U R' U R' U' R U' R2 U' D R' U R D'" },
    { name: 'Gb', group: 'G',     desc: 'G perm B',      alg: "R' U' R U D' R2 U R' U R U' R U' R2 D" },
    { name: 'Gc', group: 'G',     desc: 'G perm C',      alg: "R2 U' R U' R U R' U R2 U D' R U' R' D" },
    { name: 'Gd', group: 'G',     desc: 'G perm D',      alg: "R U R' U' D R2 U' R U' R' U R' U R2 D'" },
    { name: 'H',  group: 'Edges', desc: 'Opposite swap', alg: "M2 U M2 U2 M2 U M2" },
    { name: 'Ja', group: 'J',     desc: 'J perm A',      alg: "R' U L' U2 R U' R' U2 R L" },
    { name: 'Jb', group: 'J',     desc: 'J perm B',      alg: "R U R' F' R U R' U' R' F R2 U' R'" },
    { name: 'Na', group: 'N',     desc: 'N perm A',      alg: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
    { name: 'Nb', group: 'N',     desc: 'N perm B',      alg: "R' U R U' R' F' U' F R U R' F R' F' R U' R" },
    { name: 'Ra', group: 'R',     desc: 'R perm A',      alg: "R U' R' U' R U R D R' U' R D' R' U2 R'" },
    { name: 'Rb', group: 'R',     desc: 'R perm B',      alg: "R' U2 R U2 R' F R U R' U' R' F' R2" },
    { name: 'T',  group: 'T',     desc: 'T perm',        alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
    { name: 'Ua', group: 'U',     desc: 'U perm A',      alg: "M2 U M U2 M' U M2" },
    { name: 'Ub', group: 'U',     desc: 'U perm B',      alg: "M2 U' M U2 M' U' M2" },
    { name: 'V',  group: 'V',     desc: 'V perm',        alg: "R' U R' U' y R' F' R2 U' R' U R' F R F" },
    { name: 'Y',  group: 'Y',     desc: 'Y perm',        alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
    { name: 'Z',  group: 'Z',     desc: 'Z perm',        alg: "M2 U M2 U M' U2 M2 U2 M'" },
  ];

  // ───────── OLL: 57 cases, names + a representative subset of real algs ─────────
  // Where the alg is not known to me with certainty I supply a plausible
  // OLL-shaped sequence — this is a design mock, not a solver.
  const OLL_REAL = {
    21: "R U2 R' U' R U R' U' R U' R'",       // Sune family / OCLL
    22: "R U2 R2 U' R2 U' R2 U2 R",
    23: "R2 D R' U2 R D' R' U2 R'",
    24: "r U R' U' r' F R F'",
    25: "F' r U R' U' r' F R",
    26: "R U2 R' U' R U' R'",                 // Anti-Sune
    27: "R U R' U R U2 R'",                   // Sune
    28: "r U R' U' M U R U' R'",
    33: "R U R' U' R' F R F'",
    34: "R U R2 U' R' F R U R U' F'",
    37: "F R' F' R U R U' R'",
    38: "R U R' U R U' R' U' R' F R F'",
    44: "f R U R' U' f'",
    45: "F R U R' U' F'",                     // T-OLL
    49: "R B' R2 F R2 B R2 F' R",
    50: "R' F R2 B' R2 F' R2 B R'",
    51: "f R U R' U' R U R' U' f'",
    52: "R U R' U R U' B U' B' R'",
    55: "R' F R U R U' R2 F' R2 U' R' U R U R'",
    56: "r U r' U R U' R' U R U' R' r U' r'",
    57: "R U R' U' M' U R U' r'",
  };
  function pad(n, w = 2) { return String(n).padStart(w, '0'); }
  function makeOLL() {
    // shape groups roughly follow the standard OLL classification
    const groups = [
      ['Dot',   [1, 2, 3, 4, 17, 18, 19, 20]],
      ['I',     [51, 52, 55, 56]],
      ['Big-L', [13, 14, 15, 16]],
      ['Lightning', [7, 8, 11, 12]],
      ['P',     [31, 32, 43, 44]],
      ['T',     [33, 45]],
      ['C',     [34, 46]],
      ['W',     [36, 38]],
      ['Z',     [49, 50]],
      ['Sune-like (OCLL)', [21, 22, 23, 24, 25, 26, 27]],
      ['Awkward', [29, 30, 41, 42]],
      ['Squeeze', [5, 6, 9, 10, 35, 37, 39, 40, 47, 48, 53, 54, 28, 57]],
    ];
    const out = [];
    groups.forEach(([g, ids]) => {
      ids.forEach((id) => {
        out.push({
          name: 'OLL ' + pad(id),
          group: g,
          desc: g + ' shape',
          alg: OLL_REAL[id] || generateOLLAlg(id),
        });
      });
    });
    // sort by id ascending
    out.sort((a, b) => +a.name.slice(4) - +b.name.slice(4));
    return out;
  }
  function generateOLLAlg(id) {
    // deterministic plausible alg based on id
    const rng = mulberry32(strHash('OLL' + id));
    const triggers = ["R U R' U'", "R U R'", "R' F R F'", "F R U R' U' F'", "L' U' L U",
                      "r U R' U' r' F R F'", "R U2 R' U' R U' R'", "M U R U' r'"];
    const out = [];
    const n = 1 + Math.floor(rng() * 2);
    for (let i = 0; i < n; i++) out.push(triggers[Math.floor(rng() * triggers.length)]);
    return out.join(' ');
  }
  const OLL = makeOLL();

  // ───────── COLL: 40 cases organized by OCLL ─────────
  function makeCOLL() {
    const groups = [
      { g: 'H',      n: 4 },
      { g: 'Pi',     n: 6 },
      { g: 'U',      n: 6 },
      { g: 'T',      n: 6 },
      { g: 'L',      n: 6 },
      { g: 'Sune',   n: 6 },
      { g: 'AntiSune', n: 6 },
    ];
    const out = [];
    groups.forEach(({ g, n }) => {
      for (let i = 1; i <= n; i++) {
        const seed = strHash('COLL ' + g + i);
        const rng = mulberry32(seed);
        const triggers = ["R U R' U R U2 R'", "R' F R F'", "R U2 R' U' R U' R'", "R U R' U'", "L' U L"];
        const len = 2 + Math.floor(rng() * 2);
        const alg = Array.from({ length: len }, () => triggers[Math.floor(rng() * triggers.length)]).join(' ');
        out.push({ name: `${g}${i}`, group: g, desc: `${g} corner permutation #${i}`, alg });
      }
    });
    return out;
  }
  const COLL = makeCOLL();

  // ───────── ZBLL: shown as groups (493 total is impractical) ─────────
  function makeZBLL() {
    const groups = [
      ['T',  72],
      ['U',  72],
      ['L',  72],
      ['Pi', 72],
      ['H',  40],
      ['S',  72],
      ['AS', 72],
      ['OCLL', 21],
    ];
    const out = [];
    groups.forEach(([g, n]) => {
      for (let i = 1; i <= n; i++) {
        const seed = strHash('ZBLL' + g + i);
        const rng = mulberry32(seed);
        const triggers = ["R U R' U'", "R U2 R' U' R U' R'", "R U R' U R U2 R'",
                          "F R U R' U' F'", "R U R' F'", "L' U' L U' L' U2 L"];
        const len = 2 + Math.floor(rng() * 3);
        const alg = Array.from({ length: len }, () => triggers[Math.floor(rng() * triggers.length)]).join(' ');
        out.push({ name: `ZBLL-${g}-${pad(i)}`, group: g, desc: `${g} subset case ${i}`, alg });
      }
    });
    return out;
  }
  const ZBLL = makeZBLL();

  // ───────── 2x2 CLL: 42 cases (Sune/Antisune/L/T/U/H/Pi for each OCLL) ─────────
  const CLL2 = (function () {
    const ocll = ['H', 'Pi', 'U', 'T', 'L', 'S', 'AS'];
    const ocllReal = {
      Sune: "R U R' U R U2 R'",
      AS:   "R U2 R' U' R U' R'",
      H:    "F (R U R' U')3 F'",
    };
    const out = [];
    ocll.forEach((g) => {
      for (let i = 1; i <= 6; i++) {
        const seed = strHash('CLL2 ' + g + i);
        const rng = mulberry32(seed);
        const triggers = ["R U R' U R U2 R'", "R U2 R' U' R U' R'", "F R U' R' U' R U R' F'",
                          "R U' L' U R' U' L", "R2 U' R2 U' R2 U R2", "R U R' F' R U R' U' R' F R2 U' R'"];
        const len = 1 + Math.floor(rng() * 2);
        const alg = Array.from({ length: len }, () => triggers[Math.floor(rng() * triggers.length)]).join(' ');
        out.push({ name: `${g}${i}`, group: g, desc: `${g} CLL #${i}`, alg });
      }
    });
    return out;
  })();

  // ───────── Last slot + last layer (Winter Variation, VLS, etc.) ─────────
  const LSLL = (function () {
    const cats = [
      { g: 'WV',    n: 27, label: 'Winter Variation' },
      { g: 'SV',    n: 27, label: 'Summer Variation' },
      { g: 'VHLS',  n: 32, label: 'VHLS' },
      { g: 'OLS',   n: 104, label: 'OLS' },
      { g: 'COLS',  n: 24, label: 'COLS' },
      { g: 'ZBLS',  n: 302, label: 'ZBLS / ZBF2L' },
    ];
    const out = [];
    cats.forEach(({ g, n, label }) => {
      const cap = Math.min(n, 12); // cap per category for the design list
      for (let i = 1; i <= cap; i++) {
        const seed = strHash('LSLL' + g + i);
        const rng = mulberry32(seed);
        const triggers = ["R U R' U R U2 R'", "R U' R' U' F' U2 F", "R U' R' U2 R U R'",
                          "U' R U2 R' U2 R U' R'", "y' R U R' U' R U R'", "R U R' U2 L' U R U' L"];
        const len = 1 + Math.floor(rng() * 2);
        const alg = Array.from({ length: len }, () => triggers[Math.floor(rng() * triggers.length)]).join(' ');
        out.push({ name: `${g} ${pad(i)}`, group: g, desc: label + ' case ' + i, alg });
      }
    });
    return out;
  })();

  // ───────── 4x4 PLL parity (real cases) ─────────
  const PLL4 = [
    { name: 'OLL parity', group: 'OLL',  desc: 'Single edge flip', alg: "r U2 x r U2 r U2 r' U2 l U2 r' U2 r U2 r' U2 r'" },
    { name: 'PLL parity', group: 'PLL',  desc: 'Two-edge swap',    alg: "r2 U2 r2 Uw2 r2 Uw2" },
    { name: 'OLL+PLL',    group: 'Both', desc: 'Combined',         alg: "(OLL parity) U' (PLL parity)" },
    { name: 'Opposite Edges', group: 'PLL', desc: 'Diagonal-edge swap', alg: "Uw2 Rw2 U2 2R2 U2 Rw2 Uw2" },
  ];

  // ───────── Master catalogue ─────────
  const ALG_SETS = {
    OLL:  { id: 'OLL',  label: 'OLL',         puzzle: '3x3', count: OLL.length,  algs: OLL  },
    PLL:  { id: 'PLL',  label: 'PLL',         puzzle: '3x3', count: PLL.length,  algs: PLL  },
    COLL: { id: 'COLL', label: 'COLL',        puzzle: '3x3', count: COLL.length, algs: COLL },
    ZBLL: { id: 'ZBLL', label: 'ZBLL',        puzzle: '3x3', count: ZBLL.length, algs: ZBLL },
    CLL2: { id: 'CLL2', label: '2x2 CLL',     puzzle: '2x2', count: CLL2.length, algs: CLL2 },
    LSLL: { id: 'LSLL', label: 'LS + LL',     puzzle: '3x3', count: LSLL.length, algs: LSLL },
    PLL4: { id: 'PLL4', label: '4x4 parity',  puzzle: '4x4', count: PLL4.length, algs: PLL4 },
  };

  // ───────── Cross color choices ─────────
  const CROSS_COLORS = [
    { id: 'white',  label: 'White',  swatch: '#f3f3ef', face: 'U' },
    { id: 'yellow', label: 'Yellow', swatch: '#f7c948', face: 'D' },
    { id: 'green',  label: 'Green',  swatch: '#3c7d3a', face: 'F' },
    { id: 'blue',   label: 'Blue',   swatch: '#2563cf', face: 'B' },
    { id: 'red',    label: 'Red',    swatch: '#cc3232', face: 'R' },
    { id: 'orange', label: 'Orange', swatch: '#e8702a', face: 'L' },
  ];

  // ───────── Mocked cross solver ─────────
  // Returns a deterministic plausible move sequence for the cross/xcross.
  function mockCrossSolve(scramble, opts) {
    opts = opts || {};
    const xcross = !!opts.xcross;
    const target = opts.target || (xcross ? 9 : 8);
    const rng = mulberry32(strHash((scramble || '') + ':' + (opts.color || 'white') + ':' + (xcross ? 'x' : 'c')));
    const minLen = xcross ? 6 : 4;
    const maxLen = Math.min(target + (xcross ? 1 : 0), xcross ? 10 : 9);
    const len = minLen + Math.floor(rng() * (maxLen - minLen + 1));
    const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
    const mods = ['', "'", '2'];
    const opp = { U: 'D', D: 'U', L: 'R', R: 'L', F: 'B', B: 'F' };
    const out = [];
    let last = '', last2 = '';
    while (out.length < len) {
      const f = faces[Math.floor(rng() * 6)];
      if (f === last) continue;
      if (f === last2 && last === opp[f]) continue;
      out.push(f + mods[Math.floor(rng() * 3)]);
      last2 = last; last = f;
    }
    return out;
  }

  // ───────── Short scramble — 14-16 moves (compared to default 20) ─────────
  function shortScramble() {
    const len = 14 + Math.floor(Math.random() * 3);
    const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
    const mods = ['', "'", '2'];
    const opp = { U: 'D', D: 'U', L: 'R', R: 'L', F: 'B', B: 'F' };
    const out = [];
    let last = '', last2 = '';
    while (out.length < len) {
      const f = faces[Math.floor(Math.random() * 6)];
      if (f === last) continue;
      if (f === last2 && last === opp[f]) continue;
      out.push(f + mods[Math.floor(Math.random() * 3)]);
      last2 = last; last = f;
    }
    return out.join(' ');
  }

  // ───────── Storage ─────────
  // Keyed independently of solve sessions so training data never collides
  // with the studio.html session graph.
  const STORE_KEY = 'ct-training-v1';
  function defaultStore() {
    return {
      // Cross trainer
      crossSettings: {
        color: 'white',
        target: 8,        // ≤ N moves
        xcross: false,
        shortScramble: false,
        inspection: false, // 15s countdown
        revealMode: 'one', // 'one' | 'all'
      },
      crossHistory: seedCrossHistory(),
      // Alg trainer
      algSettings: {
        set: 'PLL',
        mode: 'drill',    // 'drill' | 'subset'
        // per-set chosen subsets (alg names)
        subsets: {
          PLL:  ['T', 'Ua', 'Ub', 'Aa', 'Ab', 'Ja', 'Jb'],
          OLL:  ['OLL 21', 'OLL 22', 'OLL 23', 'OLL 24', 'OLL 25', 'OLL 26', 'OLL 27'],
          COLL: ['Sune1', 'Sune2', 'AntiSune1', 'H1', 'H2'],
          ZBLL: ['ZBLL-T-01', 'ZBLL-U-01', 'ZBLL-L-01'],
          CLL2: ['H1', 'Sune1', 'AS1'],
          LSLL: ['WV 01', 'WV 02', 'SV 01'],
          PLL4: ['OLL parity', 'PLL parity'],
        },
      },
      algHistory: seedAlgHistory(),
    };
  }

  function seedCrossHistory() {
    // 8 fake recent scrambles with ratings
    const ratings = ['good', 'good', 'okay', 'good', 'miss', 'okay', 'good', 'good'];
    const moves = [6, 7, 6, 8, 9, 7, 6, 5];
    const flagged = [false, false, true, false, true, false, false, false];
    const samples = [
      "F2 R B' L2 F2 R2 U F U' B L F2 D' R2 D' F2 D B2 U2",
      "R U2 L' D F2 U' R B' L2 F L2 U2 R2 F' R2 B2 L2 D2",
      "U2 B' L D2 F' R2 U' B' L2 U' F2 U2 R2 D' R2 U L2 U' B2",
      "L2 U' R2 D2 F' R B' F2 L' U2 B2 R F' L' U2 R2 D2 F",
      "D2 R' B2 L2 F' R2 U2 B2 D' L' F U' R F2 L U' B'",
      "F U2 B' L2 D2 B' U2 F2 D2 F' L2 D2 U' R' B' D' L2 D'",
      "B' L2 D2 F' R2 B L2 U2 F2 D2 U R B' D' F R' U F L'",
      "U2 L2 D2 R F2 R2 D2 L' D' B' F2 L' U' R2 F2 D2 L2",
    ];
    const now = Date.now();
    return samples.map((s, i) => ({
      id: 'cs-' + i,
      scramble: s,
      moves: moves[i],
      rating: ratings[i],
      flagged: flagged[i],
      xcross: i === 3 || i === 4,
      ts: now - (samples.length - i) * 92000,
    }));
  }
  function seedAlgHistory() {
    // map alg name → recent times (ms)
    return {
      'T':  [2120, 1980, 2230, 1840, 1720, 2080, 1910, 1660],
      'Ua': [1840, 1720, 1980, 1610, 2050, 1830, 1740, 1690],
      'Ub': [1980, 2130, 1820, 1750, 1900, 2010, 1860, 1720],
      'Aa': [2410, 2280, 2630, 2150, 2360, 2480, 2210, 2090],
      'Ja': [2150, 2360, 2010, 2240, 2090, 2480, 2160, 2050],
      'Jb': [2280, 2120, 2050, 2310, 2180, 2240, 2010, 2160],
      'Ab': [2530, 2410, 2680, 2350, 2440, 2280, 2160, 2090],
    };
  }
  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // merge defaults for forward-compat
        const d = defaultStore();
        return {
          crossSettings: { ...d.crossSettings, ...(parsed.crossSettings || {}) },
          crossHistory: parsed.crossHistory || d.crossHistory,
          algSettings: { ...d.algSettings, ...(parsed.algSettings || {}),
            subsets: { ...d.algSettings.subsets, ...((parsed.algSettings || {}).subsets || {}) } },
          algHistory: { ...d.algHistory, ...(parsed.algHistory || {}) },
        };
      }
    } catch (e) {}
    return defaultStore();
  }
  function saveStore(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  // ───────── Expose ─────────
  window.TRAINING = {
    ALG_SETS, CROSS_COLORS,
    mockCrossSolve, shortScramble,
    loadStore, saveStore,
    pad,
  };
})();
