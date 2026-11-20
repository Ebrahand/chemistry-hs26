// Module 3: heating (or cooling) curve of water at 1 atm, with a segment-by-segment heat calculation.

import { Plot, cssColor } from '../assets/plot.js';
import { fix } from '../assets/format.js';

const CS = { s: 2.03, l: 4.18, g: 1.84 };   // J g⁻¹ K⁻¹
const HFUS = 6.01, HVAP = 40.67, MM = 18.02;   // kJ/mol, kJ/mol, g/mol
const $ = id => document.getElementById(id);
const plot = new Plot($('hc-plot'));
const mIn = $('hc-m'), T1in = $('hc-T1'), T2in = $('hc-T2'), qIn = $('hc-q');

// Heating segments from lo to hi (lo < hi). Start at 0 °C = ice, end at 0 °C = ice;
// start at 100 °C = liquid, end at 100 °C = liquid.
function heatingSegs(lo, hi, m) {
  const n = m / MM, segs = [];
  const warm = (phase, a, b) => {
    if (b <= a) return;
    const name = { s: 'ice', l: 'liquid water', g: 'steam' }[phase];
    segs.push({ kind: 'warm', phase, a, b, q: m * CS[phase] * (b - a) / 1000,
      what: `warm the ${name}`, formula: `${m.toFixed(2)} g × ${CS[phase].toFixed(2)} J g⁻¹ K⁻¹ × ${(b - a).toFixed(0)} K` });
  };
  if (lo < 0) warm('s', lo, Math.min(hi, 0));
  if (lo <= 0 && hi > 0) segs.push({ kind: 'fus', a: 0, b: 0, q: n * HFUS, what: 'melt the ice at 0 °C',
    formula: `${n.toFixed(3)} mol × ${HFUS} kJ/mol` });
  if (hi > 0 && lo < 100) warm('l', Math.max(lo, 0), Math.min(hi, 100));
  if (lo <= 100 && hi > 100) segs.push({ kind: 'vap', a: 100, b: 100, q: n * HVAP, what: 'boil the water at 100 °C',
    formula: `${n.toFixed(3)} mol × ${HVAP} kJ/mol` });
  if (hi > 100) warm('g', Math.max(lo, 100), hi);
  return segs;
}

function build() {
  const m = +mIn.value, T1 = +T1in.value, T2 = +T2in.value;
  const cooling = T1 > T2;
  let segs = heatingSegs(Math.min(T1, T2), Math.max(T1, T2), m);
  if (cooling) {
    segs = segs.reverse().map(s => Object.assign({}, s, {
      a: s.b, b: s.a,
      what: s.kind === 'fus' ? 'freeze the water at 0 °C' : s.kind === 'vap' ? 'condense the steam at 100 °C' : s.what.replace('warm', 'cool'),
    }));
  }
  let acc = 0;
  for (const s of segs) { s.q0 = acc; acc += s.q; }
  return { m, T1, T2, cooling, segs, total: acc };
}

// Where are we after heat q? Returns temperature and phase fractions.
function stateAt(st, q) {
  for (const s of st.segs) {
    if (q <= s.q0 + s.q + 1e-12) {
      const f = s.q > 0 ? (q - s.q0) / s.q : 1;
      if (s.kind === 'warm') return { T: s.a + f * (s.b - s.a), phase: s.phase, f: 0, seg: s };
      // during a phase change, f is the fraction already converted in the direction of travel
      if (s.kind === 'fus') return st.cooling ? { T: 0, phase: 'sl', liq: 1 - f, seg: s } : { T: 0, phase: 'sl', liq: f, seg: s };
      return st.cooling ? { T: 100, phase: 'lg', gas: 1 - f, seg: s } : { T: 100, phase: 'lg', gas: f, seg: s };
    }
  }
  const T = st.T2;
  return { T, phase: T < 0 || (T === 0 && !st.cooling) ? 's' : T <= 100 ? 'l' : 'g', seg: null };
}
const phaseOfT = (T, endIce) => (T < 0 || (T === 0 && endIce) ? 's' : T <= 100 ? 'l' : 'g');

let cur = null, here = null;

function render() {
  cur = build();
  const { m, T1, T2, segs, total, cooling } = cur;
  $('hc-m-out').textContent = `${m.toFixed(2)} g (${(m / MM).toFixed(3)} mol)`;
  $('hc-T1-out').textContent = `${fix(T1)} °C`;
  $('hc-T2-out').textContent = `${fix(T2)} °C`;
  const q = (+qIn.value / 1000) * total;
  $('hc-q-out').textContent = `${q.toFixed(2)} of ${total.toFixed(2)} kJ`;

  if (!segs.length) here = { T: T1, phase: phaseOfT(T1, true), seg: null };
  else here = stateAt(cur, q);

  const pts = [[0, T1]];
  for (const s of segs) pts.push([s.q0 + s.q, s.b]);
  const segColor = s => s.kind === 'warm' ? '--c1' : '--c0';
  const segLines = segs.map(s => ({ x1: s.q0, y1: s.a, x2: s.q0 + s.q, y2: s.b, color: segColor(s), width: s.kind === 'warm' ? 3 : 4 }));
  const texts = segs.filter(s => s.kind !== 'warm' && s.q > total * 0.04).map(s => ({
    x: s.q0 + s.q / 2, y: s.a, text: s.kind === 'fus' ? (cooling ? 'freezing' : 'melting') : (cooling ? 'condensing' : 'boiling'),
    align: 'center', dy: -12, color: '--c0', bold: true,
  }));
  const ymin = Math.min(-50, T1, T2) - 5, ymax = Math.max(150, T1, T2) + 5;
  plot.draw({
    x: { min: 0, max: Math.max(total, 0.01) * 1.02, label: cooling ? 'heat removed (kJ)' : 'heat added (kJ)' },
    y: { min: ymin, max: ymax, label: 'temperature (°C)' },
    segments: segLines, texts,
    hlines: [{ y: 0, color: '--plot-axis' }, { y: 100, color: '--plot-axis' }],
    markers: [{ x: q, y: here.T, color: '--text', r: 6 }],
  });

  $('hc-table').innerHTML = segs.length
    ? segs.map((s, i) => `<tr${here.seg === s ? ' class="latest"' : ''}><td>${i + 1}</td><td>${s.what}</td><td class="num">${s.formula}</td><td class="num">${fix(cooling ? -s.q : s.q, 2)}</td></tr>`).join('') +
      `<tr><td></td><td><strong>total</strong></td><td></td><td class="num"><strong>${fix(cooling ? -total : total, 2)}</strong></td></tr>`
    : '<tr><td colspan="4" class="muted">Start and end temperature are the same: no heat needed.</td></tr>';

  const big = segs.slice().sort((a, b) => b.q - a.q)[0];
  let note;
  if (!here.seg) note = 'Move the "heat added" slider to follow the curve.';
  else if (here.seg.kind === 'warm') note = `The temperature is changing: the heat ${cooling ? 'comes out of' : 'goes into'} the motion of the molecules, so they move ${cooling ? 'more slowly' : 'faster'}.`;
  else note = `The temperature stays at ${here.T} °C: the heat ${cooling ? 'released comes from molecules settling into' : 'goes into pulling molecules out of'} ${here.seg.kind === 'fus' ? 'the ice structure' : 'the liquid'}, not into speeding them up.`;
  if (big && segs.length > 1) note += ` The biggest step here: "${big.what}", ${(100 * big.q / total).toFixed(0)} % of the total.`;
  $('hc-note').textContent = note;

  const names = { s: 'Ice', l: 'Liquid water', g: 'Steam' };
  $('hc-state').textContent = here.phase === 'sl' ? `Ice and water at 0 °C: ${(100 * here.liq).toFixed(0)} % liquid`
    : here.phase === 'lg' ? `Water and steam at 100 °C: ${(100 * here.gas).toFixed(0)} % vapour`
    : `${names[here.phase]} at ${fix(here.T, 1)} °C`;
  if (!playing) drawBox(performance.now());
}

/* ---------- molecule picture ---------- */
const box = $('hc-box'), bctx = box.getContext('2d');
const NM = 36;
const rnd = (() => { let s = 3; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const lattice = [...Array(NM)].map((_, i) => [0.18 + 0.128 * (i % 6) + (Math.floor(i / 6) % 2) * 0.064, 0.88 - 0.1 * Math.floor(i / 6)]);
// liquid: still packed (same density as the lattice, roughly) but disordered
const liquidPos = lattice.map(([x, y]) => [x + 0.09 * (rnd() - 0.5), y + 0.07 * (rnd() - 0.5)]);
const phaseSeed = [...Array(NM)].map(() => [rnd() * 6.28, rnd() * 6.28, 0.6 + rnd()]);
let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches, visible = true;

function drawBox(now) {
  const w = box.clientWidth, h = box.clientHeight; if (!w || !here) return;
  const dpr = window.devicePixelRatio || 1;
  if (box.width !== Math.round(w * dpr)) { box.width = Math.round(w * dpr); box.height = Math.round(h * dpr); }
  bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, w, h);
  const t = playing ? now / 1000 : 0;
  const T = here.T, col = cssColor('--c1'), colG = cssColor('--c0');
  let nLiq = 0, nGas = 0;
  if (here.phase === 'l') nLiq = NM;
  else if (here.phase === 'g') nGas = NM;
  else if (here.phase === 'sl') nLiq = Math.round(here.liq * NM);
  else if (here.phase === 'lg') { nLiq = NM; nGas = Math.round(here.gas * NM); }
  for (let i = 0; i < NM; i++) {
    const [p1, p2, sp] = phaseSeed[i];
    let x, y, c = col;
    if (i >= NM - nGas) {        // vapour: anywhere in the box, fast
      const v = 0.6 + 0.004 * Math.max(0, T - 100);
      const top = here.phase === 'lg';   // with liquid still present, the vapour stays above it
      x = 0.5 + 0.42 * Math.sin(sp * v * t + p1);
      y = top ? 0.19 + 0.13 * Math.sin(sp * v * 1.3 * t + p2) : 0.5 + 0.42 * Math.sin(sp * v * 1.3 * t + p2); c = colG;
    } else if (i < nLiq) {       // liquid: packed but disordered, slow wandering
      const a = 0.03 + 0.0006 * Math.max(0, T);
      x = liquidPos[i][0] + a * Math.sin(sp * 1.1 * t + p1); y = liquidPos[i][1] + a * Math.sin(sp * 0.9 * t + p2);
    } else {                     // ice: lattice, vibration grows with temperature
      const a = 0.006 + 0.0003 * Math.max(0, T + 50);
      x = lattice[i][0] + a * Math.sin(9 * sp * t + p1); y = lattice[i][1] + a * Math.sin(8 * sp * t + p2);
    }
    bctx.beginPath(); bctx.arc(x * w, y * h, w * 0.033, 0, Math.PI * 2); bctx.fillStyle = c; bctx.fill();
  }
}
function loop(now) { drawBox(now); if (playing && visible) requestAnimationFrame(loop); }
new IntersectionObserver(es => { const was = visible; visible = es[0].isIntersecting; if (visible && !was && playing) requestAnimationFrame(loop); }).observe(box);
new ResizeObserver(() => drawBox(performance.now())).observe(box);

for (const el of [mIn, T1in, T2in, qIn]) el.addEventListener('input', render);
render();
if (playing) requestAnimationFrame(loop);
