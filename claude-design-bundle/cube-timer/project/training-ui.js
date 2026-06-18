/* Training UI — wires up cross + alg trainers across both layout directions.
 * Defensive: uses optional chaining and `if (el)` everywhere so the same
 * script works for whichever elements happen to exist in the layout.
 */
(function () {
  'use strict';
  const T = window.TRAINING;
  const $ = (s, root) => (root || document).querySelector(s);
  const $$ = (s, root) => Array.from((root || document).querySelectorAll(s));

  const css = getComputedStyle(document.documentElement);
  const COL = {
    netStroke: css.getPropertyValue('--chart-net-stroke').trim() || 'rgba(0,0,0,0.4)',
    fontMono: css.getPropertyValue('--font-mono').trim() || "'JetBrains Mono', ui-monospace, monospace",
    dim: css.getPropertyValue('--fg-2').trim() || 'rgba(255,255,255,0.46)',
  };

  // ─── Store ───
  let store = T.loadStore();
  function persist() { T.saveStore(store); }

  // ─── Helpers ───
  function fmt(ms) {
    if (ms == null) return '–';
    const s = ms / 1000;
    if (s >= 60) {
      const m = Math.floor(s / 60); const r = (s - m * 60).toFixed(2);
      return `${m}:${r.padStart(5, '0')}`;
    }
    return s.toFixed(2);
  }
  function genScramble() {
    return store.crossSettings.shortScramble
      ? T.shortScramble()
      : window.CTEngine.EVENTS[0] && (window.CTEngine.drawScrambleNet && genStd(20));
    function genStd(n) {
      const faces = ['U','D','L','R','F','B'];
      const mods = ['', "'", '2'];
      const opp = { U:'D', D:'U', L:'R', R:'L', F:'B', B:'F' };
      const out = []; let last = '', last2 = '';
      while (out.length < n) {
        const f = faces[Math.floor(Math.random()*6)];
        if (f === last) continue;
        if (f === last2 && last === opp[f]) continue;
        out.push(f + mods[Math.floor(Math.random()*3)]);
        last2 = last; last = f;
      }
      return out.join(' ');
    }
  }

  // ─── Current trainer state ───
  let activeTrainer = 'cross'; // 'cross' | 'alg'
  let activeScramble = null;
  let currentMoves = [];      // mocked cross solution moves
  let movesRevealed = 0;
  let lastRating = null;
  let lastFlagged = false;
  let isInspecting = false;
  let inspectionId = null;
  let inspectionStart = 0;
  let inspectionMs = 15000;

  // ─── Initialize trainer state for a fresh scramble ───
  function freshScramble() {
    activeScramble = genScramble();
    const sol = T.mockCrossSolve(activeScramble, {
      color: store.crossSettings.color,
      xcross: store.crossSettings.xcross,
      target: store.crossSettings.target,
    });
    currentMoves = sol;
    movesRevealed = store.crossSettings.revealMode === 'all' ? 0 : 0;
    lastRating = null;
    lastFlagged = false;
    cancelInspection();
    renderCross();
  }

  // ─── Cross trainer rendering ───
  function renderCross() {
    if (!$('#cross-stage')) return;
    // status row
    const seqN = (store.crossHistory?.length || 0) + 1;
    setText('#cs-seq', '#' + String(seqN).padStart(3, '0'));
    // color pill
    const color = T.CROSS_COLORS.find(c => c.id === store.crossSettings.color) || T.CROSS_COLORS[0];
    const colorPill = $('#cs-color');
    if (colorPill) {
      colorPill.innerHTML = `<span class="sw" style="background:${color.swatch}"></span><span>${color.label} cross</span>`;
    }
    // target / xcross pills
    setText('#cs-target', '≤ ' + store.crossSettings.target + ' moves');
    const xPill = $('#cs-xcross'); if (xPill) xPill.style.display = store.crossSettings.xcross ? '' : 'none';
    setText('#cs-len', activeScramble.split(/\s+/).length + ' moves · ' + (store.crossSettings.shortScramble ? 'short' : 'WCA'));

    // scramble text
    setText('#cs-scramble', activeScramble);

    // net (use CTEngine renderer, ev=333)
    const net = $('#cs-net');
    if (net) {
      window.CTEngine.drawScrambleNet(net, activeScramble, '333', {
        font: COL.fontMono, dim: COL.dim, netStroke: COL.netStroke,
      });
    }

    // solution chips
    renderMoves();

    // ratings
    $$('.rate').forEach(b => {
      b.classList.toggle('active', b.dataset.rate === lastRating);
    });

    // flag
    const flagIco = $('#cs-flag-icon');
    if (flagIco) flagIco.textContent = lastFlagged ? '★' : '☆';

    // history
    renderHistory();
  }

  function renderMoves() {
    const list = $('#cs-moves');
    if (!list) return;
    list.innerHTML = '';
    const target = store.crossSettings.target;
    const overTarget = currentMoves.length > target;
    currentMoves.forEach((m, i) => {
      const span = document.createElement('span');
      span.className = 'move';
      if (i >= movesRevealed) span.classList.add('hidden');
      if (i === movesRevealed - 1) span.classList.add('cur');
      span.innerHTML = `<span class="glyph">${i < movesRevealed ? m : '•'}</span>`;
      list.appendChild(span);
    });
    setText('#cs-sol-count', `${movesRevealed} / ${currentMoves.length} moves`);
    const stateLabel = movesRevealed === 0
      ? 'Hidden — reveal to study'
      : (movesRevealed >= currentMoves.length ? 'Fully revealed' : `Revealed ${movesRevealed} of ${currentMoves.length}`);
    setText('#cs-move-state', stateLabel);
    setText('#cs-move-target', overTarget ? `over target (≤${target})` : `target ≤ ${target}`);
    const sol = $('#cs-solution');
    if (sol) sol.classList.toggle('collapsed', movesRevealed === 0);
  }

  function renderHistory() {
    const list = $('#cs-recent-list, [data-cross-history]');
    if (!list) return;
    const hist = store.crossHistory.slice(-12).reverse();
    const RATING_LABEL = { good: 'good', okay: 'okay', miss: 'missed' };
    list.innerHTML = '';
    hist.forEach((h, i) => {
      const item = document.createElement('div');
      item.className = 'item hist-item ' + (h.rating || 'good');
      if (h.flagged) item.classList.add('flagged');
      if (h.xcross) item.classList.add('x');
      item.innerHTML = `
        <span class="n">#${String(store.crossHistory.length - i).padStart(3, '0')}</span>
        <span class="mv">${h.moves}<span style="color:var(--fg-3); font-size: 10px; margin-left:3px">m</span></span>
        <span class="r"><span class="dot"></span>${RATING_LABEL[h.rating] || h.rating || 'good'}</span>
        <span class="flag">★</span>
      `;
      list.appendChild(item);
    });
    // summary
    const sum = $('#cs-recent-summary, [data-cross-summary]');
    if (sum) {
      const ratings = store.crossHistory.map(h => h.rating || 'good');
      const good = ratings.filter(r => r === 'good').length;
      const avgMoves = (store.crossHistory.reduce((a, h) => a + (h.moves || 0), 0) / Math.max(1, store.crossHistory.length)).toFixed(1);
      const flagged = store.crossHistory.filter(h => h.flagged).length;
      sum.textContent = `${store.crossHistory.length} · ${avgMoves} avg moves · ${good} good · ${flagged} flagged`;
    }
  }

  // ─── Algorithm trainer rendering ───
  let currentAlgIdx = 0;
  function currentAlgSet() { return T.ALG_SETS[store.algSettings.set]; }
  function currentAlgList() {
    const set = currentAlgSet();
    if (store.algSettings.mode === 'subset') {
      const names = store.algSettings.subsets[set.id] || [];
      return set.algs.filter(a => names.includes(a.name));
    }
    return set.algs;
  }
  function currentAlg() {
    const list = currentAlgList();
    if (!list.length) return null;
    return list[currentAlgIdx % list.length];
  }
  function renderAlgSetPicker() {
    const wrap = $('#alg-set-picker');
    if (!wrap) return;
    wrap.innerHTML = '';
    Object.values(T.ALG_SETS).forEach(set => {
      const subsetSize = (store.algSettings.subsets[set.id] || []).length;
      const b = document.createElement('button');
      b.dataset.set = set.id;
      if (set.id === store.algSettings.set) b.classList.add('active');
      b.innerHTML = `<span>${set.label}</span><span class="ct">${set.count}</span>`;
      b.title = set.label + ' · ' + set.count + ' cases';
      b.onclick = () => {
        store.algSettings.set = set.id;
        currentAlgIdx = 0;
        persist(); renderAlg();
      };
      wrap.appendChild(b);
    });
    // also populate seg in settings panel
    const seg = $('#alg-set-seg');
    if (seg) {
      seg.innerHTML = '';
      Object.values(T.ALG_SETS).forEach(set => {
        const b = document.createElement('button');
        b.textContent = set.label;
        b.dataset.v = set.id;
        if (set.id === store.algSettings.set) b.classList.add('on');
        b.onclick = () => {
          store.algSettings.set = set.id; currentAlgIdx = 0;
          persist(); renderAlg();
        };
        seg.appendChild(b);
      });
    }
  }
  function renderAlg() {
    if (!$('#alg-stage')) return;
    renderAlgSetPicker();
    const set = currentAlgSet();
    const list = currentAlgList();
    const alg = currentAlg();
    setText('#alg-set-summary', `${set.label} · ${set.count} cases · ${store.algSettings.mode === 'subset' ? list.length + ' in rotation' : 'all in rotation'}`);
    setText('#alg-set-name', set.label);
    if (!alg) {
      setText('#alg-case-id', 'NO CASES');
      setText('#alg-case-display', 'Empty subset');
      setText('#alg-sequence', 'Add cases to your subset to start');
      setText('#alg-setup', '—');
      $('#alg-recent-times') && ($('#alg-recent-times').innerHTML = '<span class="t" style="opacity:0.5">—</span>');
      return;
    }
    setText('#alg-case-id', alg.name);
    setText('#alg-case-grp', alg.group);
    setText('#alg-case-display', alg.name + (alg.name.length < 10 ? ' · ' + alg.desc : ''));
    setText('#alg-sequence', alg.alg);
    // setup = inverse of alg (mock — show alg reversed, swap prime/non-prime)
    setText('#alg-setup', invertAlg(alg.alg));
    // net — render alg as a "scramble"
    const net = $('#alg-net');
    if (net) {
      window.CTEngine.drawScrambleNet(net, invertAlg(alg.alg), '333', {
        font: COL.fontMono, dim: COL.dim, netStroke: COL.netStroke,
      });
    }
    // mode segs
    $$('#alg-mode button').forEach(b => b.classList.toggle('active', b.dataset.mode === store.algSettings.mode));
    $$('#alg-mode-seg button').forEach(b => b.classList.toggle('on', b.dataset.v === store.algSettings.mode));

    // recent times
    setText('#alg-recent-label', 'Recent · ' + alg.name);
    const times = store.algHistory[alg.name] || [];
    const tWrap = $('#alg-recent-times');
    if (tWrap) {
      tWrap.innerHTML = '';
      if (!times.length) {
        tWrap.innerHTML = '<span class="t" style="opacity:0.5">no times yet</span>';
      } else {
        const best = Math.min(...times);
        times.slice().reverse().forEach(ms => {
          const el = document.createElement('span');
          el.className = 't' + (ms === best ? ' best' : '');
          el.textContent = fmt(ms);
          tWrap.appendChild(el);
        });
      }
    }
    const stats = $('#alg-recent-stats');
    if (stats) {
      if (!times.length) {
        stats.innerHTML = 'last <b>—</b> · ao5 <b>—</b> · best <b>—</b>';
      } else {
        const last = times[times.length - 1];
        const best = Math.min(...times);
        const ao5 = times.length >= 5
          ? (() => {
              const w = times.slice(-5).slice().sort((a,b)=>a-b);
              return (w[1]+w[2]+w[3])/3;
            })()
          : null;
        stats.innerHTML = `last <b>${fmt(last)}</b> · ao5 <b>${ao5 ? fmt(ao5) : '—'}</b> · best <b>${fmt(best)}</b>`;
      }
    }
  }
  function invertAlg(s) {
    // Simple inverse for visual mock: reverse tokens, flip prime/non-prime
    return s.split(/\s+/).reverse().map(t => {
      if (!t) return t;
      if (t.endsWith("'")) return t.slice(0, -1);
      if (t.endsWith('2')) return t;
      return t + "'";
    }).join(' ');
  }

  // ─── Inspection countdown ───
  function startInspection() {
    cancelInspection();
    const display = $('#cs-inspection') || $('#cs-inspection-b');
    if (!display) return;
    display.classList.add('on');
    display.classList.remove('warn', 'bad');
    inspectionStart = performance.now();
    isInspecting = true;
    const fg = $('#cs-insp-fg, [data-insp-fg]');
    const num = $('#cs-insp-num, [data-insp-num]');
    const tick = () => {
      const elapsed = performance.now() - inspectionStart;
      const remaining = Math.max(0, inspectionMs - elapsed);
      const sec = (remaining / 1000);
      if (num) num.textContent = sec >= 10 ? Math.ceil(sec) : sec.toFixed(1);
      const pct = remaining / inspectionMs;
      if (fg) fg.setAttribute('stroke-dashoffset', String(100 * (1 - pct)));
      // colour states: > 8s normal, 5-8s warn, < 5s bad
      display.classList.toggle('warn', sec <= 7 && sec > 4);
      display.classList.toggle('bad', sec <= 4);
      if (remaining > 0) inspectionId = requestAnimationFrame(tick);
      else { isInspecting = false; }
    };
    inspectionId = requestAnimationFrame(tick);
  }
  function cancelInspection() {
    if (inspectionId) cancelAnimationFrame(inspectionId);
    isInspecting = false;
    const display = $('#cs-inspection');
    if (display) display.classList.remove('on', 'warn', 'bad');
  }

  // ─── Reveal moves ───
  function revealOne() {
    if (movesRevealed < currentMoves.length) {
      movesRevealed++;
      renderMoves();
    }
  }
  function revealAll() {
    movesRevealed = currentMoves.length;
    renderMoves();
  }

  // ─── Rating + history ───
  function rate(r) {
    lastRating = r;
    $$('.rate').forEach(b => b.classList.toggle('active', b.dataset.rate === r));
    // record into history
    const entry = {
      id: 'cs-' + Date.now(),
      scramble: activeScramble,
      moves: currentMoves.length,
      rating: r,
      flagged: lastFlagged,
      xcross: store.crossSettings.xcross,
      ts: Date.now(),
    };
    store.crossHistory.push(entry);
    if (store.crossHistory.length > 100) store.crossHistory = store.crossHistory.slice(-100);
    persist();
    renderHistory();
  }
  function toggleFlag() {
    lastFlagged = !lastFlagged;
    const flagIco = $('#cs-flag-icon, [data-flag-icon]');
    if (flagIco) flagIco.textContent = lastFlagged ? '★' : '☆';
    // also update the most-recent history if it matches this scramble
    const last = store.crossHistory[store.crossHistory.length - 1];
    if (last && last.scramble === activeScramble) {
      last.flagged = lastFlagged;
      persist();
      renderHistory();
    }
  }

  // ─── Trainer switch ───
  function setTrainer(which) {
    activeTrainer = which;
    $$('#trainer-picker button, [data-trainer-picker] button').forEach(b => {
      b.classList.toggle('active', b.dataset.trainer === which);
    });
    const cross = $('#cross-stage');
    const alg = $('#alg-stage');
    if (cross) cross.style.display = which === 'cross' ? '' : 'none';
    if (alg)   alg.style.display = which === 'alg' ? 'flex' : 'none';
    // Settings panel content switch
    if ($('#cross-settings')) $('#cross-settings').style.display = which === 'cross' ? '' : 'none';
    if ($('#alg-settings-panel')) $('#alg-settings-panel').style.display = which === 'alg' ? '' : 'none';
    setText('#settings-title', (which === 'cross' ? 'Cross trainer' : 'Algorithm trainer') + ' · settings');
    if (which === 'alg') renderAlg();
    else renderCross();
    // persist tweak
    window.__CT_TWEAKS = { ...(window.__CT_TWEAKS || {}), trainer: which };
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { trainer: which } }, '*'); } catch(e) {}
  }

  // ─── Settings drawer ───
  function setupSettings() {
    // Color picker
    const cp = $('#color-picker');
    if (cp) {
      cp.innerHTML = '';
      T.CROSS_COLORS.forEach(c => {
        const sw = document.createElement('div');
        sw.className = 'c';
        sw.style.background = c.swatch;
        sw.title = c.label;
        if (c.id === store.crossSettings.color) sw.classList.add('on');
        sw.onclick = () => {
          store.crossSettings.color = c.id;
          $$('#color-picker .c').forEach(x => x.classList.remove('on'));
          sw.classList.add('on');
          // recompute solution (deterministic by scramble+color)
          currentMoves = T.mockCrossSolve(activeScramble, {
            color: store.crossSettings.color,
            xcross: store.crossSettings.xcross,
            target: store.crossSettings.target,
          });
          movesRevealed = 0;
          persist(); renderCross();
        };
        cp.appendChild(sw);
      });
    }

    // Target slider
    const ts = $('#target-slider');
    if (ts) {
      ts.value = store.crossSettings.target;
      $('#target-val') && ($('#target-val').textContent = '≤ ' + ts.value);
      ts.oninput = () => {
        store.crossSettings.target = +ts.value;
        $('#target-val') && ($('#target-val').textContent = '≤ ' + ts.value);
        persist(); renderCross();
      };
    }

    // Toggles
    const wireToggle = (sel, key, onChange) => {
      const el = $(sel);
      if (!el) return;
      el.classList.toggle('on', !!store.crossSettings[key]);
      el.onclick = () => {
        store.crossSettings[key] = !store.crossSettings[key];
        el.classList.toggle('on', store.crossSettings[key]);
        persist();
        if (onChange) onChange();
        renderCross();
      };
    };
    wireToggle('#t-xcross', 'xcross', () => {
      currentMoves = T.mockCrossSolve(activeScramble, {
        color: store.crossSettings.color, xcross: store.crossSettings.xcross, target: store.crossSettings.target,
      });
      movesRevealed = 0;
    });
    wireToggle('#t-short', 'shortScramble', () => { freshScramble(); });
    wireToggle('#t-inspection', 'inspection');

    // Reveal mode seg
    $$('#seg-reveal button').forEach(b => {
      b.classList.toggle('on', b.dataset.v === store.crossSettings.revealMode);
      b.onclick = () => {
        store.crossSettings.revealMode = b.dataset.v;
        $$('#seg-reveal button').forEach(x => x.classList.toggle('on', x.dataset.v === store.crossSettings.revealMode));
        persist();
      };
    });

    // Alg mode seg
    $$('#alg-mode button, #alg-mode-seg button').forEach(b => {
      b.onclick = () => {
        const v = b.dataset.mode || b.dataset.v;
        store.algSettings.mode = v;
        currentAlgIdx = 0;
        persist();
        renderAlg();
      };
    });

    // Open subset modal
    $('#alg-edit-subset')?.addEventListener('click', openSubsetModal);
    $('#alg-open-subset')?.addEventListener('click', openSubsetModal);

    // Settings open/close
    $('#btn-settings')?.addEventListener('click', () => $('#settings').classList.toggle('on'));
    $('#settings-close')?.addEventListener('click', () => $('#settings').classList.remove('on'));
  }

  // ─── Subset modal ───
  function openSubsetModal() {
    const set = currentAlgSet();
    const back = $('#subset-modal-back');
    if (!back) return;
    setText('#subset-set-label', set.label);
    setText('#subset-info-set', set.label);
    setText('#subset-total', set.count);
    let selected = new Set(store.algSettings.subsets[set.id] || []);
    const updateCount = () => {
      setText('#subset-count', selected.size);
      setText('#subset-info-count', `${selected.size} of ${set.count}`);
    };
    updateCount();

    const grid = $('#subset-grid');
    grid.innerHTML = '';
    // group cases
    const byGroup = {};
    set.algs.forEach(a => { (byGroup[a.group] = byGroup[a.group] || []).push(a); });
    Object.entries(byGroup).forEach(([g, items]) => {
      const head = document.createElement('div');
      head.className = 'group-head';
      head.textContent = g + ' · ' + items.length;
      grid.appendChild(head);
      items.forEach(a => {
        const cell = document.createElement('div');
        cell.className = 'case-cell';
        if (selected.has(a.name)) cell.classList.add('on');
        cell.innerHTML = `<span class="nm">${a.name}</span><span class="al">${a.alg}</span>`;
        cell.onclick = () => {
          if (selected.has(a.name)) selected.delete(a.name);
          else selected.add(a.name);
          cell.classList.toggle('on', selected.has(a.name));
          updateCount();
        };
        grid.appendChild(cell);
      });
    });

    $('#subset-all').onclick = () => {
      selected = new Set(set.algs.map(a => a.name));
      $$('.case-cell', grid).forEach(c => c.classList.add('on'));
      updateCount();
    };
    $('#subset-none').onclick = () => {
      selected.clear();
      $$('.case-cell', grid).forEach(c => c.classList.remove('on'));
      updateCount();
    };
    $('#subset-save').onclick = () => {
      store.algSettings.subsets[set.id] = Array.from(selected);
      persist();
      back.classList.remove('on');
      renderAlg();
    };
    $('#subset-cancel').onclick = () => back.classList.remove('on');
    back.addEventListener('click', (e) => { if (e.target === back) back.classList.remove('on'); });

    back.classList.add('on');
  }

  // ─── Buttons + keyboard ───
  function wireActions() {
    // Trainer toggle
    $$('#trainer-picker button, [data-trainer-picker] button').forEach(b => {
      b.onclick = () => setTrainer(b.dataset.trainer);
    });

    // Cross actions
    $('#cs-reveal-one')?.addEventListener('click', revealOne);
    $('#cs-reveal-all')?.addEventListener('click', revealAll);
    $('#cs-next')?.addEventListener('click', freshScramble);
    $('#cs-flag')?.addEventListener('click', toggleFlag);
    $('#cs-copy')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(activeScramble);
      const b = $('#cs-copy'); if (b) { const t = b.textContent; b.textContent = '✓ Copied'; setTimeout(()=>b.textContent = t, 1200); }
    });
    $('#cs-inspect')?.addEventListener('click', startInspection);

    $$('.rate').forEach(b => b.onclick = () => rate(b.dataset.rate));

    // Alg actions
    $('#alg-next')?.addEventListener('click', () => {
      const list = currentAlgList();
      if (!list.length) return;
      currentAlgIdx = Math.floor(Math.random() * list.length);
      renderAlg();
    });
    $('#alg-skip')?.addEventListener('click', () => {
      currentAlgIdx++;
      renderAlg();
    });

    // Alg timer (simple press-and-release)
    const algArea = $('#alg-timer-area');
    const algDisp = $('#alg-timer-display');
    if (algArea && algDisp) {
      const timer = window.CTEngine.createTimer({
        holdMs: 300,
        onChange: ({ stage, ms }) => {
          algArea.classList.remove('holding', 'ready', 'running');
          if (stage === 'holding') algArea.classList.add('holding');
          else if (stage === 'ready') algArea.classList.add('ready');
          else if (stage === 'running') algArea.classList.add('running');
          if (stage === 'running') setAlgDisplay(ms);
          else if (stage === 'idle') setAlgDisplay(0);
        },
        onStop: (ms) => {
          const alg = currentAlg();
          if (!alg) return;
          (store.algHistory[alg.name] = store.algHistory[alg.name] || []).push(Math.round(ms));
          if (store.algHistory[alg.name].length > 50) store.algHistory[alg.name] = store.algHistory[alg.name].slice(-50);
          persist();
          renderAlg();
        },
      });
      algArea.addEventListener('pointerdown', () => timer.down());
      algArea.addEventListener('pointerup', () => timer.up());
      // expose so space handler can use it
      window.__algTimer = timer;
    }
    function setAlgDisplay(ms) {
      const s = ms / 1000;
      if (s >= 60) {
        const m = Math.floor(s/60); const r = (s - m*60).toFixed(2);
        algDisp.innerHTML = `${m}:${r.padStart(5,'0')}`;
      } else {
        const whole = Math.floor(s);
        const dec = (s-whole).toFixed(2).slice(1);
        algDisp.innerHTML = `${whole}<span class="ms">${dec}</span>`;
      }
    }
  }

  // Keyboard
  let spaceDown = false;
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    // Space — different behavior per trainer
    if (e.code === 'Space') {
      e.preventDefault();
      if (activeTrainer === 'cross') {
        if (!spaceDown) {
          spaceDown = true;
          // if reveal mode 'one', reveal next; if 'all', reveal all
          if (store.crossSettings.revealMode === 'one') revealOne();
          else revealAll();
        }
      } else if (activeTrainer === 'alg') {
        if (!spaceDown) { spaceDown = true; window.__algTimer?.down(); }
      }
      return;
    }
    if (e.key === 'n' || e.key === 'N') {
      if (activeTrainer === 'cross') freshScramble();
      else {
        const list = currentAlgList();
        if (list.length) { currentAlgIdx = Math.floor(Math.random() * list.length); renderAlg(); }
      }
    } else if (e.key === 'f' || e.key === 'F') {
      if (activeTrainer === 'cross') toggleFlag();
    } else if (e.key === 'r' || e.key === 'R') {
      if (activeTrainer === 'cross') revealAll();
    } else if (e.key === 'i' || e.key === 'I') {
      if (activeTrainer === 'cross') startInspection();
    } else if (e.key === 'Escape') {
      $('#settings')?.classList.remove('on');
      $('#subset-modal-back')?.classList.remove('on');
      cancelInspection();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      spaceDown = false;
      if (activeTrainer === 'alg') window.__algTimer?.up();
    }
  });

  function setText(sel, v) {
    const el = typeof sel === 'string' ? $(sel) : sel;
    if (el) el.textContent = v;
  }

  // ─── Tweaks protocol ───
  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === '__activate_edit_mode') $('#settings')?.classList.add('on');
    else if (d.type === '__deactivate_edit_mode') $('#settings')?.classList.remove('on');
  });
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch(e) {}

  // ─── Init ───
  function init() {
    setupSettings();
    wireActions();
    // Determine initial trainer from URL or tweaks
    const sp = new URLSearchParams(location.search);
    const initial = sp.get('trainer') || (window.__CT_TWEAKS && window.__CT_TWEAKS.trainer) || 'cross';
    freshScramble(); // sets activeScramble + renderCross
    renderAlg();     // pre-render alg view so set picker exists when switched
    setTrainer(initial);
  }
  // Wait for DOM
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
