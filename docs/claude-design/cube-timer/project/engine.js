/* Cube Timer — shared engine
 * Vanilla JS. Hosts: studio.html, grid.html, floating.html
 * Each host calls Engine.mount(refs) with DOM nodes for the slots it cares about.
 * Tweaks (density, show/hide modules) post __edit_mode_set_keys to the host shell.
 */
(function () {
  'use strict';

  // ─────────── Events + placeholder scramble generators ───────────
  const EVENTS = [
    { id: '333',     label: '3x3',        len: 20, puzzle: 'cube'  },
    { id: '222',     label: '2x2',        len: 11, puzzle: 'cube'  },
    { id: '444',     label: '4x4',        len: 44, puzzle: 'cube4' },
    { id: '555',     label: '5x5',        len: 60, puzzle: 'cube4' },
    { id: '666',     label: '6x6',        len: 80, puzzle: 'cube4' },
    { id: '777',     label: '7x7',        len: 100, puzzle: 'cube4' },
    { id: '333oh',   label: '3x3 OH',     len: 20, puzzle: 'cube'  },
    { id: '333bld',  label: '3x3 BLD',    len: 20, puzzle: 'cube'  },
    { id: 'pyra',    label: 'Pyraminx',   len: 10, puzzle: 'pyra'  },
    { id: 'skewb',   label: 'Skewb',      len: 9,  puzzle: 'skewb' },
    { id: 'mega',    label: 'Megaminx',   len: 7,  puzzle: 'mega'  },
    { id: 'sq1',     label: 'Square-1',   len: 11, puzzle: 'sq1'   },
    { id: 'clock',   label: 'Clock',      len: 1,  puzzle: 'clock' },
  ];

  const rng = (a) => a[Math.floor(Math.random() * a.length)];

  function genScramble(eventId) {
    const ev = EVENTS.find((e) => e.id === eventId) || EVENTS[0];
    switch (ev.puzzle) {
      case 'cube':  return genCube(ev.len);
      case 'cube4': return genBigCube(ev.len, ev.id);
      case 'pyra':  return genPyra();
      case 'skewb': return genSkewb();
      case 'mega':  return genMega();
      case 'sq1':   return genSq1();
      case 'clock': return genClock();
      default:      return '';
    }
  }
  function genCube(n) {
    const faces = ['U','D','L','R','F','B'];
    const mods = ['', "'", '2'];
    const out = []; let last = '', last2 = '';
    while (out.length < n) {
      const f = rng(faces);
      if (f === last) continue;
      // avoid opposite-pair lock (e.g. U then D then U) for visual realism
      const pair = { U:'D', D:'U', L:'R', R:'L', F:'B', B:'F' }[f];
      if (f === last2 && last === pair) continue;
      out.push(f + rng(mods));
      last2 = last; last = f;
    }
    return out.join(' ');
  }
  function genBigCube(n, id) {
    const faces = ['U','D','L','R','F','B'];
    const wide = id === '444' || id === '555' || id === '666' || id === '777';
    const widthMax = id === '777' ? 3 : id === '666' ? 3 : id === '555' ? 2 : 2;
    const mods = ['', "'", '2'];
    const out = []; let last = '';
    while (out.length < n) {
      const f = rng(faces);
      if (f === last) continue;
      let mv = f;
      if (wide && Math.random() < 0.45) {
        const w = 2 + Math.floor(Math.random() * (widthMax)); // 2 or 3
        mv = w + f + 'w';
      }
      out.push(mv + rng(mods));
      last = f;
    }
    return out.join(' ');
  }
  function genPyra() {
    const faces = ['U','L','R','B'];
    const tips = ['u','l','r','b'];
    const mods = ['', "'"];
    const out = []; let last = '';
    for (let i = 0; i < 10; i++) {
      let f; do { f = rng(faces); } while (f === last);
      out.push(f + rng(mods)); last = f;
    }
    // optional tip rotations
    const tipsShuffled = tips.slice().sort(() => Math.random() - 0.5);
    tipsShuffled.forEach((t) => { if (Math.random() < 0.6) out.push(t + rng(mods)); });
    return out.join(' ');
  }
  function genSkewb() {
    const faces = ['R','L','U','B'];
    const mods = ['', "'"];
    const out = []; let last = '';
    for (let i = 0; i < 9; i++) {
      let f; do { f = rng(faces); } while (f === last);
      out.push(f + rng(mods)); last = f;
    }
    return out.join(' ');
  }
  function genMega() {
    const lines = [];
    for (let i = 0; i < 7; i++) {
      const row = [];
      for (let j = 0; j < 10; j++) {
        const f = j % 2 === 0 ? 'R' : 'D';
        row.push(f + (Math.random() < 0.5 ? '++' : '--'));
      }
      row.push(Math.random() < 0.5 ? "U" : "U'");
      lines.push(row.join(' '));
    }
    return lines.join('\n');
  }
  function genSq1() {
    const out = [];
    for (let i = 0; i < 11; i++) {
      const a = Math.floor(Math.random() * 13) - 6;
      const b = Math.floor(Math.random() * 13) - 6;
      out.push(`(${a},${b})`);
      if (i < 10) out.push('/');
    }
    return out.join(' ');
  }
  function genClock() {
    const pins = ['UR','DR','DL','UL','U','R','D','L','ALL'];
    const out = [];
    for (let i = 0; i < 9; i++) {
      const v = Math.floor(Math.random() * 13) - 6;
      const sign = v >= 0 ? '+' : '';
      out.push(`${pins[i]}${sign}${v}`);
    }
    out.push('y2');
    for (let i = 0; i < 4; i++) {
      const v = Math.floor(Math.random() * 13) - 6;
      const sign = v >= 0 ? '+' : '';
      out.push(`${pins[i]}${sign}${v}`);
    }
    return out.join(' ');
  }

  // ─────────── Time formatting ───────────
  function fmt(ms, penalty) {
    if (penalty === 'DNF') return 'DNF';
    if (ms == null || isNaN(ms)) return '–';
    const eff = penalty === '+2' ? ms + 2000 : ms;
    const s = eff / 1000;
    let str;
    if (s >= 60) {
      const m = Math.floor(s / 60);
      const r = (s - m * 60).toFixed(2);
      str = `${m}:${r.padStart(5, '0')}`;
    } else {
      str = s.toFixed(2);
    }
    return penalty === '+2' ? str + '+' : str;
  }
  // big-display variant: 1234.56 or 1:23.45
  function fmtBig(ms) {
    if (ms == null) return '0.00';
    const s = ms / 1000;
    if (s >= 60) {
      const m = Math.floor(s / 60);
      const r = (s - m * 60).toFixed(2);
      return `${m}:${r.padStart(5, '0')}`;
    }
    return s.toFixed(2);
  }

  // ─────────── Stats ───────────
  function eff(s) {
    if (s.penalty === 'DNF') return Infinity;
    return s.penalty === '+2' ? s.ms + 2000 : s.ms;
  }
  function avgOf(solves, n) {
    if (solves.length < n) return null;
    const win = solves.slice(-n).map(eff);
    const trim = n <= 5 ? 1 : Math.ceil(n / 20); // ao5 trims best+worst; for bigger use ~5%
    const trimT = trim, trimB = trim;
    const sorted = win.slice().sort((a, b) => a - b);
    const dnfCount = sorted.filter((x) => x === Infinity).length;
    if (dnfCount > trimT) return Infinity; // DNF average
    const middle = sorted.slice(trimB, sorted.length - trimT);
    const sum = middle.reduce((a, b) => a + b, 0);
    return sum / middle.length;
  }
  function meanOf(solves, n) {
    if (n && solves.length < n) return null;
    const win = (n ? solves.slice(-n) : solves).map(eff).filter((x) => x !== Infinity);
    if (!win.length) return null;
    return win.reduce((a, b) => a + b, 0) / win.length;
  }
  function bestOf(arr) {
    const v = arr.filter((x) => x != null && x !== Infinity);
    return v.length ? Math.min(...v) : null;
  }
  function computeStats(solves) {
    const cur = {
      single: solves.length ? eff(solves[solves.length - 1]) : null,
      ao5:    avgOf(solves, 5),
      ao12:   avgOf(solves, 12),
      ao50:   avgOf(solves, 50),
      ao100:  avgOf(solves, 100),
      mo3:    meanOf(solves, 3),
      mean:   meanOf(solves),
      count:  solves.length,
    };
    // bests over the whole session: rolling values at every endpoint
    const series = { single: [], ao5: [], ao12: [], ao50: [], ao100: [] };
    for (let i = 0; i < solves.length; i++) {
      const sub = solves.slice(0, i + 1);
      series.single.push(eff(sub[sub.length - 1]));
      series.ao5.push(avgOf(sub, 5));
      series.ao12.push(avgOf(sub, 12));
      series.ao50.push(avgOf(sub, 50));
      series.ao100.push(avgOf(sub, 100));
    }
    const best = {
      single: bestOf(series.single),
      ao5:    bestOf(series.ao5),
      ao12:   bestOf(series.ao12),
      ao50:   bestOf(series.ao50),
      ao100:  bestOf(series.ao100),
    };
    return { cur, best, series };
  }

  // ─────────── Seed: realistic 50 solves (3x3, mid teens, slight upward drift) ───────────
  function seed() {
    const out = [];
    const N = 50;
    const base = 12.5; // seconds
    let trend = 0;
    const now = Date.now();
    for (let i = 0; i < N; i++) {
      trend += (Math.random() - 0.48) * 0.15;
      const noise = (Math.random() - 0.5) * 3.4;
      const spike = Math.random() < 0.06 ? (Math.random() * 4 + 2) : 0;
      let s = base + trend + noise + spike;
      s = Math.max(8.6, Math.min(s, 22));
      let penalty = null;
      const r = Math.random();
      if (r < 0.02) penalty = 'DNF';
      else if (r < 0.06) penalty = '+2';
      out.push({
        id: 'seed-' + i,
        ms: Math.round(s * 1000),
        scramble: genCube(20),
        ts: now - (N - i) * 35000,
        penalty,
        comment: null,
        event: '333',
      });
    }
    return out;
  }

  // ─────────── Persistence ───────────
  const STORAGE_KEY = 'ct-state-v3-' + (window.__CT_STORE || 'default');
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }
  function saveState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  function defaultState() {
    return {
      event: '333',
      session: 'main',
      sessions: { main: { name: 'Main', solves: seed() }, gan: { name: 'Gan', solves: [] }, oh: { name: 'OH', solves: [] } },
      inspection: false,
      currentScramble: null,
    };
  }

  // ─────────── Engine instance ───────────
  function create(refs) {
    let state = loadState() || defaultState();
    if (!state.currentScramble) state.currentScramble = genScramble(state.event);

    const listeners = new Set();
    function emit() { listeners.forEach((fn) => fn(state)); }
    function persist() { saveState(state); emit(); }

    function currentSession() { return state.sessions[state.session]; }
    function solves() { return currentSession().solves; }

    function nextScramble() {
      state.currentScramble = genScramble(state.event);
      persist();
    }
    function setEvent(eId) {
      state.event = eId;
      state.currentScramble = genScramble(eId);
      persist();
    }
    function setSession(sId) {
      if (!state.sessions[sId]) return;
      state.session = sId;
      persist();
    }
    function addSession(name) {
      const id = 's' + Date.now();
      state.sessions[id] = { name, solves: [] };
      state.session = id;
      persist();
    }
    function renameSession(id, name) {
      if (state.sessions[id]) { state.sessions[id].name = name; persist(); }
    }
    function deleteSession(id) {
      if (Object.keys(state.sessions).length <= 1) return;
      delete state.sessions[id];
      if (state.session === id) state.session = Object.keys(state.sessions)[0];
      persist();
    }
    function clearSession() {
      currentSession().solves = [];
      persist();
    }
    function addSolve(ms) {
      const solve = {
        id: 'sv-' + Date.now(),
        ms, scramble: state.currentScramble, ts: Date.now(),
        penalty: null, comment: null, event: state.event,
      };
      currentSession().solves.push(solve);
      state.currentScramble = genScramble(state.event);
      persist();
      return solve;
    }
    function updateSolve(id, patch) {
      const ss = solves();
      const idx = ss.findIndex((s) => s.id === id);
      if (idx >= 0) { ss[idx] = { ...ss[idx], ...patch }; persist(); }
    }
    function deleteSolve(id) {
      currentSession().solves = solves().filter((s) => s.id !== id);
      persist();
    }
    function exportCSV() {
      const rows = [['#','time(ms)','penalty','scramble','comment','ts']];
      solves().forEach((s, i) => rows.push([i+1, s.ms, s.penalty||'', s.scramble.replace(/\n/g,' '), s.comment||'', new Date(s.ts).toISOString()]));
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `session-${state.session}-${Date.now()}.csv`;
      a.click();
    }

    return {
      get state() { return state; },
      get solves() { return solves(); },
      get currentSession() { return currentSession(); },
      events: EVENTS,
      subscribe(fn) { listeners.add(fn); fn(state); return () => listeners.delete(fn); },
      nextScramble, setEvent, setSession, addSession, renameSession, deleteSession, clearSession,
      addSolve, updateSolve, deleteSolve, exportCSV,
      computeStats: () => computeStats(solves()),
      fmt, fmtBig,
    };
  }

  // ─────────── Timer state machine ───────────
  // Stages: idle → holding (down, red) → ready (held >= holdMs, green) → running → idle
  function createTimer(opts) {
    const holdMs = opts.holdMs ?? 300;
    let stage = 'idle';
    let startedAt = 0, holdStartedAt = 0, lastMs = 0, displayMs = 0;
    let raf = null, holdTimer = null;
    const cb = opts.onChange || (() => {});

    function setStage(s) { stage = s; cb({ stage, ms: displayMs }); }
    function tick() {
      displayMs = performance.now() - startedAt;
      cb({ stage, ms: displayMs });
      raf = requestAnimationFrame(tick);
    }
    function down() {
      if (stage === 'running') {
        // stop
        cancelAnimationFrame(raf); raf = null;
        lastMs = performance.now() - startedAt;
        displayMs = lastMs;
        setStage('stopped');
        if (opts.onStop) opts.onStop(lastMs);
        return;
      }
      if (stage === 'idle' || stage === 'stopped') {
        holdStartedAt = performance.now();
        setStage('holding');
        clearTimeout(holdTimer);
        holdTimer = setTimeout(() => {
          if (stage === 'holding') setStage('ready');
        }, holdMs);
      }
    }
    function up() {
      clearTimeout(holdTimer);
      if (stage === 'ready') {
        startedAt = performance.now();
        displayMs = 0;
        setStage('running');
        raf = requestAnimationFrame(tick);
      } else if (stage === 'holding') {
        setStage('idle');
      }
    }
    function reset() {
      cancelAnimationFrame(raf); raf = null;
      clearTimeout(holdTimer);
      stage = 'idle'; displayMs = 0;
      cb({ stage, ms: 0 });
    }
    return { down, up, reset, get stage() { return stage; } };
  }

  // ─────────── Chart drawers (canvas) ───────────
  function clearCanvas(c, bg) {
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== w * dpr || c.height !== h * dpr) {
      c.width = w * dpr; c.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
    else ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }
  function drawTrend(canvas, series, opts) {
    const { ctx, w, h } = clearCanvas(canvas);
    const pad = { l: 36, r: 12, t: 12, b: 20 };
    // convert ms → seconds for display
    const toS = (v) => v === Infinity || v == null ? null : v / 1000;
    const single = series.single.map(toS);
    const ao5 = series.ao5.map(toS);
    const ao12 = series.ao12.map(toS);
    const all = [...single, ...ao5, ...ao12].filter((v) => v != null);
    if (!all.length) {
      ctx.fillStyle = opts.dim; ctx.font = '12px ' + opts.font;
      ctx.fillText('No data yet', pad.l, h/2); return;
    }
    const min = Math.min(...all) * 0.95, max = Math.max(...all) * 1.05;
    const n = single.length;
    const x = (i) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * (w - pad.l - pad.r));
    const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);

    // gridlines
    ctx.strokeStyle = opts.grid; ctx.lineWidth = 1;
    ctx.font = '10px ' + opts.font; ctx.fillStyle = opts.dim;
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const v = min + (max - min) * (i / steps);
      const yy = y(v);
      ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(w - pad.r, yy); ctx.stroke();
      ctx.fillText(v.toFixed(1), 4, yy + 3);
    }

    function plot(arr, color, width) {
      ctx.strokeStyle = color; ctx.lineWidth = width;
      ctx.beginPath(); let started = false;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] == null) { started = false; continue; }
        if (!started) { ctx.moveTo(x(i), y(arr[i])); started = true; }
        else ctx.lineTo(x(i), y(arr[i]));
      }
      ctx.stroke();
    }
    plot(single, opts.singleColor, 1);
    plot(ao12, opts.ao12Color, 1.5);
    plot(ao5, opts.ao5Color, 1.5);

    // last point dot
    const lastIdx = single.length - 1;
    if (single[lastIdx] != null) {
      ctx.fillStyle = opts.singleColor;
      ctx.beginPath(); ctx.arc(x(lastIdx), y(single[lastIdx]), 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawHistogram(canvas, solves, opts) {
    const { ctx, w, h } = clearCanvas(canvas);
    const pad = { l: 28, r: 8, t: 12, b: 22 };
    const vals = solves.map(eff).filter((v) => v !== Infinity).map((v) => v / 1000);
    if (vals.length < 2) {
      ctx.fillStyle = opts.dim; ctx.font = '12px ' + opts.font;
      ctx.fillText('No data yet', pad.l, h/2); return;
    }
    const min = Math.floor(Math.min(...vals));
    const max = Math.ceil(Math.max(...vals));
    const bucket = Math.max(0.5, (max - min) / 12);
    const buckets = [];
    for (let b = min; b < max; b += bucket) buckets.push({ lo: b, hi: b + bucket, n: 0 });
    vals.forEach((v) => {
      const idx = Math.min(buckets.length - 1, Math.floor((v - min) / bucket));
      if (idx >= 0) buckets[idx].n++;
    });
    const maxN = Math.max(...buckets.map((b) => b.n));
    const bw = (w - pad.l - pad.r) / buckets.length;
    ctx.font = '10px ' + opts.font; ctx.fillStyle = opts.dim;
    // y grid
    ctx.strokeStyle = opts.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yy = pad.t + (h - pad.t - pad.b) * (i / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(w - pad.r, yy); ctx.stroke();
    }
    // bars
    buckets.forEach((b, i) => {
      const x = pad.l + i * bw;
      const bh = (b.n / maxN) * (h - pad.t - pad.b);
      const y = h - pad.b - bh;
      ctx.fillStyle = opts.barColor;
      ctx.fillRect(x + 1, y, bw - 2, bh);
    });
    // x labels
    ctx.fillStyle = opts.dim;
    for (let i = 0; i < buckets.length; i += Math.ceil(buckets.length / 5)) {
      const x = pad.l + i * bw;
      ctx.fillText(buckets[i].lo.toFixed(1), x, h - 6);
    }
  }

  // 3x3 cube net renderer (simulates applying scramble to a solved cube).
  // For non-3x3 events we render a generic placeholder.
  function drawScrambleNet(svg, scramble, eventId, opts) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (eventId === '333' || eventId === '333oh' || eventId === '333bld' || eventId === '222') {
      const n = eventId === '222' ? 2 : 3;
      const state = simulateCube(scramble, n);
      drawCubeNet(svg, state, n, opts);
    } else {
      // generic puzzle silhouette
      drawGenericPuzzle(svg, eventId, opts);
    }
  }
  // colors for cube net
  const STICKER = {
    U: '#f3f3ef', // white (off-white to fit dark theme)
    D: '#f7c948', // yellow
    F: '#3c7d3a', // green
    B: '#2563cf', // blue
    L: '#e8702a', // orange
    R: '#cc3232', // red
  };
  function makeSolved(n) {
    const s = {};
    ['U','D','F','B','L','R'].forEach((f) => {
      s[f] = Array.from({ length: n * n }, () => f);
    });
    return s;
  }
  // rotate a face's stickers clockwise n=2,3 supported
  function rotFaceCW(face, n) {
    const out = new Array(n * n);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) out[c * n + (n - 1 - r)] = face[r * n + c];
    return out;
  }
  // helper: get/set row or column of a face
  function getRow(face, n, r) { return face.slice(r * n, r * n + n); }
  function setRow(face, n, r, vals) { for (let i = 0; i < n; i++) face[r * n + i] = vals[i]; }
  function getCol(face, n, c) { const out = []; for (let i = 0; i < n; i++) out.push(face[i * n + c]); return out; }
  function setCol(face, n, c, vals) { for (let i = 0; i < n; i++) face[i * n + c] = vals[i]; }

  function applyMove(s, n, face, mod) {
    // turn face CW (mod handled by repetition)
    let times = 1;
    if (mod === "'") times = 3;
    else if (mod === '2') times = 2;
    for (let t = 0; t < times; t++) turnCW(s, n, face);
  }
  function turnCW(s, n, face) {
    s[face] = rotFaceCW(s[face], n);
    // cycle adjacent stickers
    // mappings: when face F turns CW, the surrounding strip rotates
    const last = n - 1;
    let strips;
    switch (face) {
      case 'U': strips = [
        ['B', 'row', 0],
        ['R', 'row', 0],
        ['F', 'row', 0],
        ['L', 'row', 0],
      ]; break;
      case 'D': strips = [
        ['F', 'row', last],
        ['R', 'row', last],
        ['B', 'row', last],
        ['L', 'row', last],
      ]; break;
      case 'F': strips = [
        ['U', 'row', last],
        ['R', 'col', 0, true],
        ['D', 'row', 0, true],
        ['L', 'col', last],
      ]; break;
      case 'B': strips = [
        ['U', 'row', 0, true],
        ['L', 'col', 0],
        ['D', 'row', last],
        ['R', 'col', last, true],
      ]; break;
      case 'L': strips = [
        ['U', 'col', 0],
        ['F', 'col', 0],
        ['D', 'col', 0],
        ['B', 'col', last, true],
      ]; break;
      case 'R': strips = [
        ['U', 'col', last, true],
        ['B', 'col', 0],
        ['D', 'col', last, true],
        ['F', 'col', last],
      ]; break;
    }
    // For L and the second-pattern faces, we need an inverted cycle in some cases.
    // Simpler approach: rebuild via correct mapping table below.
    // We'll override 'strips' with a known-good table per face.
  }
  // The above is fiddly; do a clean rewrite using a known-good cube model.
  // Recompute applyMove + turnCW using a face-adjacency table.

  // --- clean cube model rewrite ---
  // For each face, list 4 strips of n stickers (face, indices). Rotating face CW
  // cycles strip[0] → strip[1] → strip[2] → strip[3] → strip[0].
  function adjStrips(face, n) {
    const last = n - 1;
    const idx = (r, c) => r * n + c;
    const row = (r) => Array.from({ length: n }, (_, c) => idx(r, c));
    const col = (c) => Array.from({ length: n }, (_, r) => idx(r, c));
    switch (face) {
      case 'U': return [
        ['B', row(0)],            // back top
        ['R', row(0)],            // right top
        ['F', row(0)],            // front top
        ['L', row(0)],            // left top
      ];
      case 'D': return [
        ['F', row(last)],
        ['R', row(last)],
        ['B', row(last)],
        ['L', row(last)],
      ];
      case 'F': return [
        ['U', row(last)],
        ['R', col(0)],
        ['D', row(0).slice().reverse()],
        ['L', col(last).slice().reverse()],
      ];
      case 'B': return [
        ['U', row(0).slice().reverse()],
        ['L', col(0)],
        ['D', row(last)],
        ['R', col(last).slice().reverse()],
      ];
      case 'L': return [
        ['U', col(0)],
        ['F', col(0)],
        ['D', col(0)],
        ['B', col(last).slice().reverse()],
      ];
      case 'R': return [
        ['U', col(last).slice().reverse()],
        ['B', col(0)],
        ['D', col(last).slice().reverse()],
        ['F', col(last)],
      ];
    }
  }
  function turnCW2(s, n, face) {
    s[face] = rotFaceCW(s[face], n);
    const strips = adjStrips(face, n);
    const tmp = strips[3][1].map((i) => s[strips[3][0]][i]);
    for (let k = 3; k > 0; k--) {
      const [fDest, iDest] = strips[k];
      const [fSrc, iSrc] = strips[k - 1];
      for (let j = 0; j < n; j++) s[fDest][iDest[j]] = s[fSrc][iSrc[j]];
    }
    const [f0, i0] = strips[0];
    for (let j = 0; j < n; j++) s[f0][i0[j]] = tmp[j];
  }
  function applyMove2(s, n, face, mod) {
    let times = 1;
    if (mod === "'") times = 3;
    else if (mod === '2') times = 2;
    for (let t = 0; t < times; t++) turnCW2(s, n, face);
  }
  function simulateCube(scramble, n) {
    const s = makeSolved(n);
    const moves = scramble.split(/\s+/).filter(Boolean);
    moves.forEach((m) => {
      // strip wide notation for 3x3 net (still render the outer face) — moves like "Rw" or "2R" treated as R
      const cleaned = m.replace(/^\d/, '').replace(/w/, '');
      const face = cleaned[0];
      const mod = cleaned.slice(1);
      if ('UDFBLR'.includes(face)) applyMove2(s, n, face, mod);
    });
    return s;
  }
  function drawCubeNet(svg, state, n, opts) {
    const ns = 'http://www.w3.org/2000/svg';
    const W = svg.clientWidth || 240;
    const H = svg.clientHeight || 180;
    // net layout: 4 wide × 3 tall units, each unit = n×n stickers
    const unitW = W / 4.2, unitH = H / 3.2;
    const u = Math.min(unitW, unitH);
    const cellSize = u / n;
    const totalW = u * 4, totalH = u * 3;
    const ox = (W - totalW) / 2, oy = (H - totalH) / 2;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    function drawFace(face, gx, gy) {
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('x', ox + gx * u + c * cellSize);
        rect.setAttribute('y', oy + gy * u + r * cellSize);
        rect.setAttribute('width', cellSize - 1.2);
        rect.setAttribute('height', cellSize - 1.2);
        rect.setAttribute('rx', cellSize * 0.12);
        rect.setAttribute('fill', STICKER[state[face][r * n + c]]);
        rect.setAttribute('stroke', opts.netStroke || 'rgba(0,0,0,0.35)');
        rect.setAttribute('stroke-width', '0.5');
        svg.appendChild(rect);
      }
    }
    // layout: U (1,0), L(0,1), F(1,1), R(2,1), B(3,1), D(1,2)
    drawFace('U', 1, 0);
    drawFace('L', 0, 1);
    drawFace('F', 1, 1);
    drawFace('R', 2, 1);
    drawFace('B', 3, 1);
    drawFace('D', 1, 2);
  }
  function drawGenericPuzzle(svg, eventId, opts) {
    const ns = 'http://www.w3.org/2000/svg';
    const W = svg.clientWidth || 240, H = svg.clientHeight || 180;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', W / 2); t.setAttribute('y', H / 2);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('fill', opts.dim || 'rgba(255,255,255,0.4)');
    t.setAttribute('font-family', opts.font || 'monospace');
    t.setAttribute('font-size', '12');
    t.textContent = 'scramble draw N/A for ' + eventId;
    svg.appendChild(t);
  }

  // ─────────── Public API ───────────
  window.CTEngine = {
    create, createTimer, fmt, fmtBig, EVENTS,
    drawTrend, drawHistogram, drawScrambleNet,
    computeStats,
  };
})();
