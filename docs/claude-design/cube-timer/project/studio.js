/* Studio direction — main script */
(function () {
  'use strict';
  const engine = window.CTEngine.create();
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ── Theme colors for charts (read from CSS vars) ──
  const css = getComputedStyle(document.documentElement);
  function rd(name, fallback) {
    const v = css.getPropertyValue(name).trim();
    return v || fallback;
  }
  const COL = {
    fg: rd('--fg', '#fff'),
    fgDim: rd('--fg-2', 'rgba(255,255,255,0.46)'),
    grid: rd('--chart-grid', 'rgba(255,255,255,0.06)'),
    single: rd('--chart-single', 'rgba(255,255,255,0.45)'),
    ao5: rd('--chart-ao5', '#ff6a5e'),
    ao12: rd('--chart-ao12', '#6E8BFF'),
    bar: rd('--chart-bar', rd('--accent', '#6E8BFF')),
    netStroke: rd('--chart-net-stroke', 'rgba(0,0,0,0.4)'),
    font: rd('--font-mono', "'JetBrains Mono', monospace").replace(/^['"]/, '').replace(/['"],/, ',') ||
          "'JetBrains Mono', ui-monospace, monospace",
  };
  // simpler font fallback (CSS var may include quotes which canvas font handles ok)
  COL.font = "12px " + (css.getPropertyValue('--font-mono').trim() || "'JetBrains Mono', ui-monospace, monospace");
  // canvas font expects just the family/size string when drawing; the drawer uses `${size}px ` + font
  COL.font = (css.getPropertyValue('--font-mono').trim() || "'JetBrains Mono', ui-monospace, monospace");

  // ── Event picker ──
  const pickerEl = $('#event-picker');
  function renderPicker() {
    pickerEl.innerHTML = '';
    const primary = engine.events.slice(0, 4); // 3x3, 2x2, 4x4, 5x5
    const rest = engine.events.slice(4);
    primary.forEach((e) => {
      const b = document.createElement('button');
      b.textContent = e.label;
      if (e.id === engine.state.event) b.classList.add('active');
      b.onclick = () => engine.setEvent(e.id);
      pickerEl.appendChild(b);
    });
    // overflow
    const moreWrap = document.createElement('div');
    moreWrap.className = 'more';
    const moreBtn = document.createElement('button');
    const isOther = !primary.find((e) => e.id === engine.state.event);
    moreBtn.textContent = isOther ? engine.events.find((e) => e.id === engine.state.event).label + ' ▾' : 'more ▾';
    if (isOther) moreBtn.classList.add('active');
    moreBtn.onclick = (ev) => {
      ev.stopPropagation();
      moreWrap.classList.toggle('open');
    };
    const menu = document.createElement('div');
    menu.className = 'more-menu';
    engine.events.forEach((e) => {
      const b = document.createElement('button');
      b.textContent = e.label;
      if (e.id === engine.state.event) b.classList.add('active');
      b.onclick = () => { engine.setEvent(e.id); moreWrap.classList.remove('open'); };
      menu.appendChild(b);
    });
    moreWrap.append(moreBtn, menu);
    pickerEl.appendChild(moreWrap);
    document.addEventListener('click', () => moreWrap.classList.remove('open'), { once: true });
  }

  // ── Session select ──
  function renderSessions() {
    const sel = $('#session-select');
    sel.innerHTML = '';
    Object.entries(engine.state.sessions).forEach(([id, s]) => {
      const o = document.createElement('option');
      o.value = id; o.textContent = s.name;
      if (id === engine.state.session) o.selected = true;
      sel.appendChild(o);
    });
    const o2 = document.createElement('option');
    o2.value = '__new'; o2.textContent = '+ New session…';
    sel.appendChild(o2);
    sel.onchange = (e) => {
      if (e.target.value === '__new') {
        const n = prompt('Session name?', 'New session');
        if (n) engine.addSession(n);
        else { e.target.value = engine.state.session; }
      } else {
        engine.setSession(e.target.value);
      }
    };
  }

  // ── Stats grid ──
  function renderStats() {
    const { cur, best } = engine.computeStats();
    const labels = ['single', 'ao5', 'ao12', 'ao50', 'ao100'];
    labels.forEach((k) => {
      const c = document.querySelector(`[data-cur="${k}"]`);
      const b = document.querySelector(`[data-best="${k}"]`);
      if (c) c.textContent = cur[k] != null ? window.CTEngine.fmt(cur[k] === Infinity ? null : cur[k]) : '–';
      if (cur[k] === Infinity && c) c.textContent = 'DNF';
      if (b) b.textContent = best[k] != null ? window.CTEngine.fmt(best[k]) : '–';
    });
    // session meta
    $('#meta-count').textContent = cur.count;
    $('#meta-mean').textContent = cur.mean != null ? window.CTEngine.fmt(cur.mean) : '–';
    // pb strip
    labels.forEach((k) => {
      const el = document.querySelector(`[data-pb="${k}"]`);
      if (!el) return;
      el.textContent = best[k] != null ? window.CTEngine.fmt(best[k]) : '–';
    });
  }

  // ── Solve list ──
  function renderSolves() {
    const list = $('#solves-list');
    const solves = engine.solves;
    const { best, series } = engine.computeStats();
    list.innerHTML = '';
    // newest at top
    for (let i = solves.length - 1; i >= 0; i--) {
      const s = solves[i];
      const row = document.createElement('div');
      row.className = 'solve-row';
      const isBestSingle = (s.penalty !== 'DNF') && (best.single != null) &&
        ((s.penalty === '+2' ? s.ms + 2000 : s.ms) === best.single);
      if (isBestSingle) row.classList.add('best');
      const ao5 = series.ao5[i], ao12 = series.ao12[i];
      row.innerHTML = `
        <span class="n">${i + 1}</span>
        <span class="t ${s.penalty === 'DNF' ? 'dnf' : ''}">${window.CTEngine.fmt(s.ms, s.penalty)}</span>
        <span class="a">${ao5 != null && ao5 !== Infinity ? window.CTEngine.fmt(ao5) : ao5 === Infinity ? 'DNF' : '–'}</span>
        <span class="a">${ao12 != null && ao12 !== Infinity ? window.CTEngine.fmt(ao12) : ao12 === Infinity ? 'DNF' : '–'}</span>
        <span class="actions">
          <button data-act="plus2">+2</button>
          <button data-act="dnf">DNF</button>
          <button data-act="del" class="del">✕</button>
        </span>`;
      row.onclick = (e) => {
        const act = e.target.dataset.act;
        if (act === 'plus2') { engine.updateSolve(s.id, { penalty: s.penalty === '+2' ? null : '+2' }); }
        else if (act === 'dnf') { engine.updateSolve(s.id, { penalty: s.penalty === 'DNF' ? null : 'DNF' }); }
        else if (act === 'del') { engine.deleteSolve(s.id); }
        else { openModal(s); }
      };
      list.appendChild(row);
    }
  }

  // ── Scramble + draw ──
  function renderScramble() {
    $('#scramble').textContent = engine.state.currentScramble;
    const ev = engine.events.find((e) => e.id === engine.state.event);
    $('#scr-event').textContent = ev.label + ' · WCA';
    const moves = engine.state.currentScramble.split(/\s+/).filter(Boolean).length;
    $('#scr-len').textContent = moves + ' moves';
    $('#draw-note').textContent = (ev.id === '333' || ev.id === '333oh' || ev.id === '333bld') ? '3×3 net' :
                                  ev.id === '222' ? '2×2 net' : ev.label + ' net';
    // optional decorative elements (grid direction)
    const setIf = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
    setIf('#scr-seq', '#' + String(engine.solves.length + 1).padStart(3, '0'));
    setIf('#tm-evt', ev.label);
    setIf('#tm-ssn', engine.currentSession.name);
    setIf('#tm-num', String(engine.solves.length + 1).padStart(3, '0'));
    const stats = engine.computeStats();
    setIf('#tm-ao5', stats.cur.ao5 != null && stats.cur.ao5 !== Infinity ? window.CTEngine.fmt(stats.cur.ao5) : '–');
    setIf('#ss-event', ev.label);
    setIf('#ss-time', engine.solves.length ? window.CTEngine.fmt(engine.solves[engine.solves.length-1].ms, engine.solves[engine.solves.length-1].penalty) : '–');
    setIf('#ssn-id', engine.state.session);
    window.CTEngine.drawScrambleNet($('#svg-net'), engine.state.currentScramble, ev.id, { font: COL.font, dim: COL.fgDim, netStroke: COL.netStroke });
  }

  // ── Charts ──
  function renderCharts() {
    const { series } = engine.computeStats();
    window.CTEngine.drawTrend($('#cv-graph'), series, {
      grid: COL.grid, dim: COL.fgDim, font: COL.font,
      singleColor: COL.single, ao5Color: COL.ao5, ao12Color: COL.ao12,
    });
    window.CTEngine.drawHistogram($('#cv-hist'), engine.solves, {
      grid: COL.grid, dim: COL.fgDim, font: COL.font,
      barColor: COL.bar,
    });
    // histogram summary
    const vals = engine.solves.filter((s) => s.penalty !== 'DNF').map((s) => (s.penalty === '+2' ? s.ms + 2000 : s.ms) / 1000);
    if (vals.length) {
      const min = Math.min(...vals).toFixed(2);
      const max = Math.max(...vals).toFixed(2);
      $('#hist-summary').textContent = `range ${min}–${max}s`;
    } else $('#hist-summary').textContent = '–';
  }

  // ── Timer ──
  const display = $('#timer-display');
  const area = $('#timer-area');
  function setDisplay(ms) {
    const s = ms / 1000;
    if (s >= 60) {
      const m = Math.floor(s / 60);
      const r = (s - m * 60);
      display.innerHTML = `${m}:${r.toFixed(2).padStart(5, '0')}`;
    } else {
      const whole = Math.floor(s);
      const dec = (s - whole).toFixed(2).slice(1); // ".87"
      display.innerHTML = `${whole}<span class="ms">${dec}</span>`;
    }
  }
  const timer = window.CTEngine.createTimer({
    holdMs: 350,
    onChange: ({ stage, ms }) => {
      display.classList.remove('holding','ready','running');
      area.classList.remove('holding','ready','running');
      if (stage === 'holding') { display.classList.add('holding'); area.classList.add('holding'); }
      else if (stage === 'ready') { display.classList.add('ready'); area.classList.add('ready'); }
      else if (stage === 'running') { display.classList.add('running'); area.classList.add('running'); }
      if (stage === 'running') setDisplay(ms);
      else if (stage === 'idle') setDisplay(0);
    },
    onStop: (ms) => {
      engine.addSolve(Math.round(ms));
    },
  });

  // Spacebar handling
  let spaceDown = false;
  window.addEventListener('keydown', (e) => {
    if (modalOpen()) return;
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (!spaceDown) { spaceDown = true; timer.down(); }
      return;
    }
    if (timer.stage === 'running') { e.preventDefault(); timer.down(); return; }
    if (e.key === 'n' || e.key === 'N') { engine.nextScramble(); }
    else if (e.key === '+' || e.key === '=') {
      const last = engine.solves[engine.solves.length - 1];
      if (last) engine.updateSolve(last.id, { penalty: last.penalty === '+2' ? null : '+2' });
    } else if (e.key === 'd' || e.key === 'D') {
      const last = engine.solves[engine.solves.length - 1];
      if (last) engine.updateSolve(last.id, { penalty: last.penalty === 'DNF' ? null : 'DNF' });
    } else if (e.key === '?') {
      $('#cheats').classList.toggle('on');
    } else if (e.key === 'Escape') {
      $('#cheats').classList.remove('on');
      $('#tweaks').classList.remove('on');
      closeModal();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') { e.preventDefault(); spaceDown = false; timer.up(); }
  });

  // Click-to-time
  area.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    timer.down();
  });
  area.addEventListener('pointerup', (e) => {
    if (e.target.closest('button')) return;
    timer.up();
  });

  // ── Modal ──
  let modalSolve = null;
  function openModal(s) {
    modalSolve = s;
    $('#m-time').textContent = window.CTEngine.fmt(s.ms, s.penalty);
    $('#m-meta').textContent = `${new Date(s.ts).toLocaleString()} · ${s.event}`;
    $('#m-scramble').textContent = s.scramble;
    $('#m-comment').value = s.comment || '';
    $('#m-plus2').classList.toggle('on', s.penalty === '+2');
    $('#m-dnf').classList.toggle('on', s.penalty === 'DNF');
    $('#modal-back').classList.add('on');
  }
  function closeModal() { $('#modal-back').classList.remove('on'); modalSolve = null; }
  function modalOpen() { return $('#modal-back').classList.contains('on'); }
  $('#modal-back').addEventListener('click', (e) => { if (e.target === $('#modal-back')) closeModal(); });
  $('#m-close-sec').onclick = closeModal;
  $('#m-ok').onclick = () => { engine.updateSolve(modalSolve.id, { penalty: null }); $('#m-plus2').classList.remove('on'); $('#m-dnf').classList.remove('on'); modalSolve.penalty = null; $('#m-time').textContent = window.CTEngine.fmt(modalSolve.ms, null); };
  $('#m-plus2').onclick = () => { const p = modalSolve.penalty === '+2' ? null : '+2'; engine.updateSolve(modalSolve.id, { penalty: p }); modalSolve.penalty = p; $('#m-plus2').classList.toggle('on', p === '+2'); $('#m-dnf').classList.remove('on'); $('#m-time').textContent = window.CTEngine.fmt(modalSolve.ms, p); };
  $('#m-dnf').onclick = () => { const p = modalSolve.penalty === 'DNF' ? null : 'DNF'; engine.updateSolve(modalSolve.id, { penalty: p }); modalSolve.penalty = p; $('#m-dnf').classList.toggle('on', p === 'DNF'); $('#m-plus2').classList.remove('on'); $('#m-time').textContent = window.CTEngine.fmt(modalSolve.ms, p); };
  $('#m-del').onclick = () => { engine.deleteSolve(modalSolve.id); closeModal(); };
  $('#m-save').onclick = () => { engine.updateSolve(modalSolve.id, { comment: $('#m-comment').value }); closeModal(); };

  // ── Toolbar buttons ──
  $('#btn-next-scramble').onclick = () => engine.nextScramble();
  $('#btn-copy-scramble').onclick = () => { navigator.clipboard?.writeText(engine.state.currentScramble); };
  $('#btn-shortcuts').onclick = (e) => { e.stopPropagation(); $('#cheats').classList.toggle('on'); };
  $('#btn-settings').onclick = (e) => {
    e.stopPropagation();
    const isMobile = window.matchMedia('(max-width: 880px)').matches;
    if (isMobile) openSheet('tweaks');
    else $('#tweaks').classList.toggle('on');
  };
  $('#tweaks-close').onclick = () => { $('#tweaks').classList.remove('on'); $('#sheet-back')?.classList.remove('on'); document.querySelectorAll('.m-nav-btn').forEach((b) => b.classList.remove('active')); };
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#cheats') && !e.target.closest('#btn-shortcuts')) $('#cheats').classList.remove('on');
  });
  $('#btn-export').onclick = () => engine.exportCSV();
  $('#btn-clear').onclick = () => { if (confirm('Clear all solves in this session?')) engine.clearSession(); };

  // ── Tweaks ──
  function applyTweaks() {
    const t = window.__CT_TWEAKS;
    document.body.dataset.density = t.density || 'comfortable';
    document.getElementById('mod-graph').classList.toggle('hidden', !t.showGraph);
    document.getElementById('mod-hist').classList.toggle('hidden', !t.showHist);
    document.getElementById('mod-draw').classList.toggle('hidden', !t.showDraw);
    // sync UI states
    document.querySelectorAll('[data-tweak="density"] button').forEach((b) =>
      b.classList.toggle('on', b.dataset.v === t.density));
    ['showGraph','showHist','showDraw'].forEach((k) => {
      const el = document.querySelector(`[data-tweak="${k}"]`);
      if (el) el.classList.toggle('on', !!t[k]);
    });
    // also reflect on the mobile nav buttons (if they exist)
    document.querySelectorAll('.m-nav-btn[data-needs]').forEach((b) => {
      b.classList.toggle('disabled', !t[b.dataset.needs]);
    });
  }
  function setTweak(k, v) {
    window.__CT_TWEAKS = { ...window.__CT_TWEAKS, [k]: v };
    applyTweaks();
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*'); } catch (e) {}
    // re-render charts since size changed
    requestAnimationFrame(renderCharts);
  }
  document.querySelectorAll('[data-tweak="density"] button').forEach((b) => {
    b.onclick = () => setTweak('density', b.dataset.v);
  });
  ['showGraph','showHist','showDraw'].forEach((k) => {
    const el = document.querySelector(`[data-tweak="${k}"]`);
    if (!el) return;
    el.onclick = () => setTweak(k, !window.__CT_TWEAKS[k]);
  });

  // ── Tweaks: bind to host shell ──
  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === '__activate_edit_mode') $('#tweaks').classList.add('on');
    else if (d.type === '__deactivate_edit_mode') $('#tweaks').classList.remove('on');
  });
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}

  // ── Mobile nav: open/close sheets ──
  function closeAllSheets() {
    document.querySelectorAll('.module.on, .sidebar.on, .tweaks.on').forEach((el) => el.classList.remove('on'));
    $('#sheet-back')?.classList.remove('on');
    $('#cheats')?.classList.remove('on');
    document.querySelectorAll('.m-nav-btn').forEach((b) => b.classList.remove('active'));
  }
  function openSheet(id) {
    const el = document.getElementById(id);
    if (!el) return;
    // skip if module is hidden by tweaks
    if (el.classList.contains('hidden')) return;
    const already = el.classList.contains('on');
    closeAllSheets();
    if (already) return; // toggle close
    el.classList.add('on');
    $('#sheet-back').classList.add('on');
    // mark nav button
    document.querySelectorAll(`.m-nav-btn[data-mobile-open="${id}"]`).forEach((b) => b.classList.add('active'));
    // ensure charts redraw at new size
    requestAnimationFrame(() => { renderCharts(); });
  }
  document.querySelectorAll('.m-nav-btn').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = b.dataset.mobileOpen;
      const needs = b.dataset.needs;
      if (needs && !window.__CT_TWEAKS[needs]) return;
      openSheet(target);
    });
  });
  $('#sheet-back')?.addEventListener('click', closeAllSheets);

  // Reflect tweak state on nav buttons (graph/hist/draw can be disabled)
  function syncNavDisabled() {
    const t = window.__CT_TWEAKS;
    document.querySelectorAll('.m-nav-btn[data-needs]').forEach((b) => {
      const k = b.dataset.needs;
      b.classList.toggle('disabled', !t[k]);
    });
  }
  syncNavDisabled();

  // Open a sheet via URL ?sheet=mod-draw etc (used by the design canvas
  // to preview pre-open mobile states).
  try {
    const sp = new URLSearchParams(location.search);
    const which = sp.get('sheet');
    if (which) requestAnimationFrame(() => openSheet(which));
  } catch (e) {}
  engine.subscribe(() => {
    renderPicker();
    renderSessions();
    renderStats();
    renderSolves();
    renderScramble();
    renderCharts();
  });

  // initial paint
  applyTweaks();
  setDisplay(0);

  // Re-render charts on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderCharts, 100);
  });
})();
