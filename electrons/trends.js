// Module 5: screening picture, property map of the periodic table, successive ionization energies,
// ionic radii to scale, and a "compare two atoms" exercise.

import { Plot, cssColor } from '../assets/plot.js';
import { ELEMENTS, BY_SYM, zeffSlater } from '../assets/elements.js';
import { periodicTable } from '../assets/ptable.js';

const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';

/* ------------------------------------------------------------------ */
/* Screening picture: sodium                                           */
/* ------------------------------------------------------------------ */
{
  const svg = $('screen-svg');
  const cx = 120, cy = 120;
  let s = `<circle cx="${cx}" cy="${cy}" r="95" fill="none" stroke="var(--border)" stroke-dasharray="4 4"/>
    <circle cx="${cx}" cy="${cy}" r="58" fill="color-mix(in srgb, var(--c1) 12%, transparent)" stroke="var(--border)"/>
    <circle cx="${cx}" cy="${cy}" r="26" fill="none" stroke="var(--border)"/>`;
  const e = (r, a, col) => `<circle cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy + r * Math.sin(a)).toFixed(1)}" r="5.5" fill="var(${col})"/>`;
  for (let i = 0; i < 2; i++) s += e(26, Math.PI * i + 0.5, '--c1');
  for (let i = 0; i < 8; i++) s += e(48, Math.PI * i / 4 + 0.2, '--c1');
  s += e(95, -0.6, '--c0');
  s += `<circle cx="${cx}" cy="${cy}" r="11" fill="var(--c3)"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--bg)">+11</text>
    <text x="${cx + 95 * Math.cos(-0.6) + 10}" y="${cy + 95 * Math.sin(-0.6) - 8}" font-size="13" fill="var(--text)">3s electron</text>
    <text x="226" y="118" font-size="13" fill="var(--text)">feels about</text>
    <text x="226" y="136" font-size="13" font-weight="700" fill="var(--text)">11 − 10 = +1</text>
    <text x="${cx}" y="${cy + 78}" text-anchor="middle" font-size="12" fill="var(--text-muted)">10 core electrons</text>`;
  svg.innerHTML = s;
}

/* ------------------------------------------------------------------ */
/* Property map                                                        */
/* ------------------------------------------------------------------ */
const PROPS = {
  r: { name: 'atomic radius', unit: 'pm', get: e => e.r, shade: e => e.r, label: e => e.r ?? '',
    source: 'Bonding atomic radii in pm (Brown Fig. 7.7, as in Lecture 6; period 6 from the same source, Cordero et al. 2008).' },
  ie: { name: 'first ionization energy', unit: 'kJ/mol', get: e => e.ie, shade: e => e.ie, label: e => e.ie ?? '',
    source: 'First ionization energies in kJ/mol (NIST, rounded).' },
  ea: { name: 'electron affinity', unit: 'kJ/mol', get: e => e.ea, shade: e => (typeof e.ea === 'number' ? -e.ea : e.ea === 'pos' ? 0 : null),
    label: e => (e.ea === 'pos' ? '>0' : e.ea ?? ''),
    source: 'Electron affinities in kJ/mol (Brown Fig. 7.12, main groups up to period 5). Darker = more negative = more energy released. ">0": the anion is not stable.' },
  zeff: { name: 'effective nuclear charge', unit: '', get: e => zeffSlater(e.Z), shade: e => zeffSlater(e.Z), label: e => zeffSlater(e.Z)?.toFixed(1) ?? '',
    source: 'Z_eff felt by the outermost electron, estimated with Slater\'s rules (Z_eff = Z − S), main groups only. Rough numbers: the trend is what matters.' },
};

{
  let prop = 'r', dir = 'period', sel = BY_SYM.Na;
  const table = periodicTable($('tr-table'), {
    value: PROPS.r.shade, label: PROPS.r.label,
    onSelect: e => { sel = e; update(); }, selected: 'Na',
  });
  const plot = new Plot($('tr-plot'));
  const fmt = (p, v) => (v === 'pos' ? '> 0' : v === null || v === undefined ? 'no data' : `${p === 'zeff' ? v.toFixed(2) : v}${PROPS[p].unit ? ' ' + PROPS[p].unit : ''}`);

  function note() {
    const P = PROPS[prop], v = P.get(sel);
    let t = `<strong>${sel.name}</strong> (${sel.sym}): ${P.name} ${fmt(prop, v)}. `;
    if (v === null || v === undefined) {
      t += prop === 'zeff' ? 'Slater\'s estimate is only shown for main-group elements here.' : 'The lecture figure does not give a value for this element.';
      return t;
    }
    const why = {
      r: 'Down a group the valence shell n grows, so atoms get bigger. Across a period Z_eff grows, so atoms shrink.',
      ie: 'Small atoms with a high Z_eff hold their electrons tightly (high I₁). Big atoms with one electron in a new shell lose it easily (low I₁).',
      ea: 'Halogens release the most energy: one more electron completes their p subshell. Noble gases would have to start a new shell (EA > 0).',
      zeff: 'Across a period Z_eff rises by about 0.65 per step; down a group it rises only slightly.',
    }[prop];
    t += why;
    if (prop === 'ie') {
      const g = sel.group;
      if (sel.period <= 5 && g === 13) t += ' Group 13 dips below group 2: the first p electron is higher in energy than the s electrons before it.';
      if (sel.period <= 5 && g === 16) t += ' Group 16 dips below group 15: the fourth p electron has to pair up, and the repulsion makes it easier to remove.';
    }
    if (prop === 'r' && sel.group === 18) t += ' Careful: noble-gas radii are estimated differently (they do not bond easily). Compare them with care.';
    return t;
  }

  function drawPlot() {
    const P = PROPS[prop];
    let row, xLabel, xOf, texts = [];
    if (dir === 'period' || sel.fblock) {
      row = ELEMENTS.filter(e => e.period === sel.period && (sel.fblock ? e.fblock : !e.fblock));
      xOf = e => (sel.fblock ? e.Z : e.group); xLabel = sel.fblock ? 'atomic number' : `group (period ${sel.period})`;
    } else {
      row = ELEMENTS.filter(e => e.group === sel.group && !e.fblock);
      xOf = e => e.period; xLabel = `period (group ${sel.group})`;
    }
    const pts = row.map(e => [xOf(e), P.get(e) === 'pos' ? 0 : P.get(e), e]).filter(p => typeof p[1] === 'number');
    if (pts.length === 0) { plot.draw({ x: { min: 0, max: 1, label: xLabel }, y: { min: 0, max: 1, label: P.name }, texts: [{ x: 0.5, y: 0.5, text: 'no data', align: 'center' }] }); return; }
    const ys = pts.map(p => p[1]);
    let ymin = Math.min(0, ...ys), ymax = Math.max(...ys);
    if (prop === 'ea') { ymin = Math.min(...ys) * 1.15; ymax = Math.max(40, ...ys); }
    else ymax *= 1.15;
    const xs = pts.map(p => p[0]);
    const xmin = Math.min(...xs) - 0.7, xmax = Math.max(...xs) + 0.7;
    // break the line where the d block is missing (periods 2–3 jump from group 2 to 13)
    const series = [];
    let cur = [];
    pts.forEach((p, i) => { if (i && p[0] - pts[i - 1][0] > 1 && dir === 'period' && !sel.fblock) { series.push(cur); cur = []; } cur.push([p[0], p[1]]); });
    series.push(cur);
    texts = pts.map(p => ({ x: p[0], y: p[1], text: p[2].sym + (P.get(p[2]) === 'pos' ? ' (>0)' : ''), align: 'center', dy: prop === 'ea' ? 14 : -12,
      color: p[2] === sel ? '--text' : '--text-muted', bold: p[2] === sel }));
    plot.draw({
      x: { min: xmin, max: xmax, label: xLabel, tickValues: xs, tickFormat: v => String(v) },
      y: { min: ymin, max: ymax, label: `${P.name}${P.unit ? ' (' + P.unit + ')' : ''}` },
      series: series.map(s => ({ points: s, color: '--c1', dots: true })),
      markers: pts.filter(p => p[2] === sel).map(p => ({ x: p[0], y: p[1], color: '--c0', r: 7 })),
      hlines: prop === 'ea' ? [{ y: 0 }] : [],
      texts,
    });
  }

  function update() {
    const P = PROPS[prop];
    table.update({ value: P.shade, label: P.label });
    table.select(sel.sym);
    $('tr-prop').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === prop));
    $('tr-dir').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === dir));
    $('tr-note').innerHTML = note();
    $('tr-source').textContent = P.source;
    drawPlot();
  }
  $('tr-prop').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { prop = b.dataset.v; update(); }));
  $('tr-dir').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { dir = b.dataset.v; update(); }));
  update();
}

/* ------------------------------------------------------------------ */
/* Successive ionization energies, period 3                            */
/* ------------------------------------------------------------------ */
{
  // kJ/mol, NIST ASD, rounded. Valence electrons: Na 1 … Ar 8.
  const SIE = {
    Na: [496, 4562, 6910, 9543, 13354, 16613, 20117],
    Mg: [738, 1451, 7733, 10543, 13630, 18020, 21711],
    Al: [578, 1817, 2745, 11577, 14842, 18379, 23326],
    Si: [787, 1577, 3232, 4356, 16091, 19805, 23780],
    P: [1012, 1907, 2914, 4964, 6274, 21267, 25431],
    S: [1000, 2252, 3357, 4556, 7004, 8496, 27107],
    Cl: [1251, 2298, 3822, 5159, 6542, 9362, 11018],
    Ar: [1521, 2666, 3931, 5771, 7238, 8781, 11995],
  };
  const VAL = { Na: 1, Mg: 2, Al: 3, Si: 4, P: 5, S: 6, Cl: 7, Ar: 8 };
  let el = 'Mg';
  const plot = new Plot($('sie-plot'));
  for (const k of Object.keys(SIE)) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = k; b.dataset.v = k;
    b.addEventListener('click', () => { el = k; update(); });
    $('sie-el').appendChild(b);
  }
  const L = Math.log10;
  function update() {
    $('sie-el').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === el));
    const d = SIE[el], v = VAL[el];
    const segments = d.map((I, i) => ({ x1: i + 1, y1: L(300), x2: i + 1, y2: L(I), color: i < v ? '--c1' : '--c0', width: 22 }));
    const texts = d.map((I, i) => ({ x: i + 1, y: L(I), text: I.toLocaleString('en-US').replace(/,/g, ' '), align: 'center', dy: -10, size: 11, color: '--text-muted' }));
    plot.draw({
      x: { min: 0.3, max: 7.7, label: 'electron removed (I₁, I₂, …)', tickValues: [1, 2, 3, 4, 5, 6, 7], tickFormat: v => `I${'₀₁₂₃₄₅₆₇'[v]}` },
      y: { min: L(300), max: L(40000), label: 'ionization energy (kJ/mol)', tickValues: [500, 1000, 2000, 5000, 10000, 20000].map(L), tickFormat: x => String(Math.round(Math.pow(10, x))) },
      segments, texts,
    });
    $('sie-note').innerHTML = v < 8
      ? `${el} has ${v} valence electron${v > 1 ? 's' : ''} (blue). Removing electron ${v + 1} means breaking into the noble-gas core [Ne] (orange): ` +
        `I${'₀₁₂₃₄₅₆₇₈'[v + 1]} is ${(d[v] / d[v - 1]).toFixed(1)} times I${'₀₁₂₃₄₅₆₇₈'[v]}. This is why ${el} forms ${el === 'Na' ? 'Na⁺' : el === 'Mg' ? 'Mg²⁺' : el === 'Al' ? 'Al³⁺' : 'bonds using ' + v + ' electrons'} and never ${el === 'Na' ? 'Na²⁺' : el === 'Mg' ? 'Mg³⁺' : el === 'Al' ? 'Al⁴⁺' : 'gives up its core'}.`
      : 'Argon: all seven electrons shown come from the eight valence electrons (3s² 3p⁶), so there is no big jump here yet. It would come at the ninth. Each step is still larger than the last: the ion left behind is more and more positive.';
  }
  update();
}

/* ------------------------------------------------------------------ */
/* Ionic radii to scale                                                */
/* ------------------------------------------------------------------ */
{
  // pm. Ions: Brown Fig. 7.8 (crystal radii); atoms: bonding atomic radii as in the map.
  const SETS = [
    { label: 'Na → Na⁺', items: [['Na', 166, 'atom'], ['Na⁺', 116, 'cation']],
      note: 'Na⁺ has lost its only 3s electron, the whole n = 3 shell. What is left is the [Ne] core, pulled in by 11 protons.' },
    { label: 'Cl → Cl⁻', items: [['Cl', 102, 'atom'], ['Cl⁻', 167, 'anion']],
      note: 'Cl⁻ has one more electron but the same 17 protons. The extra electron–electron repulsion makes the cloud spread out.' },
    { label: '10 electrons each', items: [['O²⁻', 126, 'anion'], ['F⁻', 119, 'anion'], ['Na⁺', 116, 'cation'], ['Mg²⁺', 86, 'cation'], ['Al³⁺', 68, 'cation']],
      note: 'An isoelectronic series (Lecture 6): all have the configuration of Ne. From O²⁻ (8 protons) to Al³⁺ (13 protons) the same 10 electrons are pulled in harder and harder.' },
    { label: 'Group 1 ions', items: [['Li⁺', 90, 'cation'], ['Na⁺', 116, 'cation'], ['K⁺', 152, 'cation'], ['Rb⁺', 166, 'cation'], ['Cs⁺', 181, 'cation']],
      note: 'Ions with the same charge get bigger down a group, just like atoms: each has one more occupied shell.' },
    { label: 'Group 2 ions', items: [['Be²⁺', 59, 'cation'], ['Mg²⁺', 86, 'cation'], ['Ca²⁺', 114, 'cation'], ['Sr²⁺', 132, 'cation']],
      note: 'Problem set 6, question 11(b): Ca²⁺ > Mg²⁺ > Be²⁺, one more shell each time.' },
    { label: 'Group 17 ions', items: [['F⁻', 119, 'anion'], ['Cl⁻', 167, 'anion'], ['Br⁻', 182, 'anion'], ['I⁻', 206, 'anion']],
      note: 'The same trend for anions. Iodide is almost twice as wide as fluoride.' },
  ];
  let k = 0;
  SETS.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'btn'; b.type = 'button'; b.textContent = s.label;
    b.addEventListener('click', () => { k = i; draw(); });
    $('ion-sets').appendChild(b);
  });
  function draw() {
    const set = SETS[k], svg = $('ion-svg');
    [...$('ion-sets').children].forEach((b, i) => b.classList.toggle('primary', i === k));
    const scale = 0.42;   // px per pm: 206 pm → 87 px radius
    const total = set.items.reduce((a, [, r]) => a + 2 * r * scale, 0);
    const gap = Math.min(40, (640 - total) / (set.items.length + 1));
    let x = (640 - total - gap * (set.items.length - 1)) / 2;
    let s = '';
    for (const [name, r, kind] of set.items) {
      const R = r * scale, cx = x + R;
      const col = kind === 'atom' ? '--cB' : kind === 'cation' ? '--c1' : '--c0';
      s += `<circle cx="${cx}" cy="105" r="${R}" fill="color-mix(in srgb, var(${col}) 35%, transparent)" stroke="var(${col})" stroke-width="2"/>
        <text x="${cx}" y="110" text-anchor="middle" font-size="16" font-weight="700" fill="var(--text)">${name}</text>
        <text x="${cx}" y="212" text-anchor="middle" font-size="13" fill="var(--text-muted)">${r} pm</text>`;
      x += 2 * R + gap;
    }
    svg.innerHTML = s;
    $('ion-note').textContent = set.note;
  }
  draw();
}

/* ------------------------------------------------------------------ */
/* Compare two atoms                                                   */
/* ------------------------------------------------------------------ */
{
  const MAIN = ELEMENTS.filter(e => !e.fblock && (e.group <= 2 || e.group >= 13) && e.group !== 18 && e.period >= 2);
  // the problem-set pairs first (PS 6, questions 6, 7 and 12)
  const FIXED = [['ie', 'Br', 'Kr'], ['ie', 'C', 'Ca'], ['ie', 'Li', 'Rb'], ['ie', 'Pb', 'Si'], ['ie', 'Al', 'B'], ['r', 'Rb', 'Te'], ['ie', 'Cs', 'Cl']];
  let q = 0, score = 0, tried = 0, cur = null, answered = false;

  function verdict(type, a, b) {
    // returns { pick, why } or null when the simple rules do not decide
    // For both questions (larger radius, smaller I₁) the answer is the atom further down and/or further left.
    const da = a.period - b.period, dg = a.group - b.group;
    let cand = null, why = '';
    if (da === 0) {
      const left = dg < 0 ? a : b;
      cand = left;
      why = `Same period (n = ${a.period}). ${left.sym} is further left: its valence electrons feel a lower Z_eff`;
    } else if (dg === 0) {
      const low = da > 0 ? a : b;
      cand = low;
      why = `Same group. ${low.sym} is further down: its valence electrons are in shell n = ${low.period}, further from the nucleus`;
    } else if (Math.sign(da) === -Math.sign(dg)) {
      const low = da > 0 ? a : b;   // further down AND further left
      cand = low;
      why = `${low.sym} is both further down and further left, and both trends point the same way`;
    } else return null;
    return { pick: cand, why };
  }

  function make() {
    answered = false;
    let type, a, b, v;
    if (q < FIXED.length) {
      [type, a, b] = FIXED[q]; a = BY_SYM[a]; b = BY_SYM[b];
      v = verdict(type, a, b);
    } else {
      for (let guard = 0; guard < 500; guard++) {
        type = Math.random() < 0.5 ? 'r' : 'ie';
        a = MAIN[Math.floor(Math.random() * MAIN.length)]; b = MAIN[Math.floor(Math.random() * MAIN.length)];
        if (a === b || !a[type] || !b[type]) continue;
        v = verdict(type, a, b);
        if (!v) continue;
        const dataPick = type === 'r' ? (a.r > b.r ? a : b) : (a.ie < b.ie ? a : b);
        const anomaly = type === 'ie' && a.period === b.period && [[2, 13], [15, 16]].some(([x, y]) => (a.group === x && b.group === y) || (a.group === y && b.group === x));
        if (dataPick !== v.pick && !anomaly) continue;
        if (Math.abs(a[type] - b[type]) < 8 && !anomaly) continue;   // too close to call from the trends
        break;
      }
    }
    q++;
    cur = { type, a, b, v };
    $('cmp-q').textContent = type === 'r' ? `Which atom is larger: ${a.name} or ${b.name}?` : `Which atom has the smaller first ionization energy: ${a.name} or ${b.name}?`;
    $('cmp-opts').innerHTML = '';
    for (const e of [a, b]) {
      const btn = document.createElement('button');
      btn.className = 'btn'; btn.type = 'button'; btn.textContent = e.sym;
      btn.addEventListener('click', () => answer(e));
      $('cmp-opts').appendChild(btn);
    }
    $('cmp-fb').textContent = ''; $('cmp-fb').className = 'feedback';
  }

  function answer(e) {
    const { type, a, b, v } = cur;
    const right = type === 'r' ? (a.r > b.r ? a : b) : (a.ie < b.ie ? a : b);
    const ok = e === right;
    if (!answered) { tried++; if (ok) score++; answered = true; }
    const data = type === 'r' ? `${a.sym} ${a.r} pm, ${b.sym} ${b.r} pm.` : `${a.sym} ${a.ie} kJ/mol, ${b.sym} ${b.ie} kJ/mol.`;
    let why;
    if (v && v.pick === right) why = `${v.why}, so ${right.sym} ${type === 'r' ? 'is larger' : 'loses an electron more easily'}.`;
    else {
      const lo = a.group < b.group ? a : b, hi = lo === a ? b : a;
      why = lo.group === 2
        ? `An exception to the trend: ${hi.sym} (group 13) starts a new p subshell. Its p electron is higher in energy than the s electrons of ${lo.sym}, so it is easier to remove.`
        : `An exception to the trend: in ${hi.sym} (group 16) the fourth p electron has to share a box with another one. The repulsion makes it easier to remove than an electron from the half-filled p subshell of ${lo.sym}.`;
    }
    const fb = $('cmp-fb');
    fb.className = 'feedback ' + (ok ? 'right' : 'wrong');
    fb.textContent = `${ok ? 'Correct.' : `Not quite: it is ${right.sym}.`} ${why} Data: ${data}`;
    $('cmp-score').textContent = `${score} / ${tried} right`;
  }
  $('cmp-next').addEventListener('click', make);
  make();
}
