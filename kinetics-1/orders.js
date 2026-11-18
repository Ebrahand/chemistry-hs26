// Module 3: how zero-, first- and second-order reactions A -> products change in time.
// Integrated rate laws (Brown, Ch. 14):
//   n = 0:  [A]t = [A]0 - k t            (until [A] = 0)
//   n = 1:  [A]t = [A]0 exp(-k t)
//   n = 2:  1/[A]t = k t + 1/[A]0

import { Plot, cssColor } from '../assets/plot.js';
import { sig } from '../assets/format.js';

const ORDERS = [
  { n: 0, name: 'Zero', color: '--c0', dash: [], kUnit: 'M s⁻¹' },
  { n: 1, name: 'First', color: '--c1', dash: [9, 5], kUnit: 's⁻¹' },
  { n: 2, name: 'Second', color: '--c2', dash: [2, 4], kUnit: 'M⁻¹ s⁻¹' },
];
const STRAIGHT = { A: 0, lnA: 1, invA: 2 }; // which order gives a straight line in each view
const DEFAULTS = { A0: 1.0, k: [0.05, 0.05, 0.05], tmax: 60, t: 10 };
const N_MOLECULES = 100;

const $ = id => document.getElementById(id);
const state = {
  A0: DEFAULTS.A0, k: [...DEFAULTS.k], tmax: DEFAULTS.tmax, t: DEFAULTS.t,
  view: 'A', show: [true, true, true], half: true, tangent: true, playing: false,
};

// ---------- chemistry ----------
export function conc(n, k, A0, t) {
  if (n === 0) return Math.max(A0 - k * t, 0);
  if (n === 1) return A0 * Math.exp(-k * t);
  return A0 / (1 + k * A0 * t);
}
export function rate(n, k, c) { return c > 0 ? k * Math.pow(c, n) : 0; }

// Durations of the 1st, 2nd and 3rd half-life.
export function halfLives(n, k, A0) {
  if (n === 0) return [A0 / (2 * k), A0 / (4 * k), A0 / (8 * k)];
  if (n === 1) { const h = Math.LN2 / k; return [h, h, h]; }
  return [1 / (k * A0), 2 / (k * A0), 4 / (k * A0)];
}

const transform = {
  A: c => c,
  lnA: c => (c > 0 ? Math.log(c) : NaN),
  invA: c => (c > 0 ? 1 / c : NaN),
};

// ---------- formatting ----------
const fmtTime = t => (Number.isFinite(t) ? sig(t, 3) + ' s' : '—');

// ---------- plot ----------
const plot = new Plot($('orders-plot'));

function yRange(view) {
  const { A0, k, tmax, show } = state;
  if (view === 'A') return { min: 0, max: A0 * 1.08, label: '[A]  (M)' };
  const ref = STRAIGHT[view];
  const vals = [];
  const orders = show[ref] ? [ref] : [0, 1, 2].filter(n => show[n]);
  for (const n of orders) {
    for (let i = 0; i <= 50; i++) {
      const y = transform[view](conc(n, k[n], A0, (tmax * i) / 50));
      if (Number.isFinite(y)) vals.push(y);
    }
  }
  if (view === 'lnA') {
    const top = Math.log(A0);
    let lo = vals.length ? Math.min(...vals) : top - 3;
    lo = Math.max(lo, top - 6);
    const pad = Math.max(0.15 * (top - lo), 0.2);
    return { min: lo - pad, max: top + pad, label: 'ln [A]' };
  }
  const bottom = 1 / A0;
  let hi = vals.length ? Math.max(...vals) : bottom * 3;
  hi = Math.min(Math.max(hi, bottom * 2), bottom * 40);
  return { min: 0, max: hi * 1.1, label: '1 / [A]  (M⁻¹)' };
}

function sampleSeries(n) {
  const { A0, k, tmax, view } = state;
  const pts = [];
  const N = 400;
  for (let i = 0; i <= N; i++) {
    const t = (tmax * i) / N;
    pts.push([t, transform[view](conc(n, k[n], A0, t))]);
  }
  if (n === 0) {
    // Add the moment A runs out so the kink is sharp. In the ln and 1/[A] views the
    // curve diverges there, so draw it up to just before the end.
    const tEnd = A0 / k[0];
    if (tEnd < tmax) {
      const tLast = view === 'A' ? tEnd : tEnd * (1 - 1e-4);
      pts.push([tLast, transform[view](conc(0, k[0], A0, tLast))]);
      pts.sort((a, b) => a[0] - b[0]);
    }
  }
  return pts;
}

function drawPlot() {
  const { A0, k, tmax, t, view, show, half, tangent } = state;
  const spec = {
    x: { min: 0, max: tmax, label: 'time t  (s)' },
    y: yRange(view),
    series: [], segments: [], markers: [], hlines: [], vlines: [],
  };

  if (view === 'A' && half) {
    spec.hlines.push({ y: A0 / 2, label: '½ [A]₀' }, { y: A0 / 4, label: '¼ [A]₀' }, { y: A0 / 8, label: '⅛ [A]₀' });
  }
  spec.vlines.push({ x: t, color: '--text-muted', dash: [2, 3] });

  for (const o of ORDERS) {
    if (!show[o.n]) continue;
    spec.series.push({ points: sampleSeries(o.n), color: o.color, dash: o.dash, width: STRAIGHT[view] === o.n ? 3.2 : 2.4 });

    if (view === 'A' && half) {
      let tc = 0;
      for (const h of halfLives(o.n, k[o.n], A0)) {
        tc += h;
        if (tc <= tmax) spec.markers.push({ x: tc, y: conc(o.n, k[o.n], A0, tc), color: o.color, r: 4.5, hollow: true });
      }
    }

    const c = conc(o.n, k[o.n], A0, t);
    const y = transform[view](c);
    if (Number.isFinite(y)) spec.markers.push({ x: t, y, color: o.color, r: 5 });

    if (view === 'A' && tangent && c > 0) {
      const slope = -rate(o.n, k[o.n], c);
      const dt = tmax * 0.12;
      spec.segments.push({ x1: t - dt, y1: c - slope * dt, x2: t + dt, y2: c + slope * dt, color: '--text', width: 1.5 });
    }
  }
  plot.draw(spec);
}

// ---------- notes under the plot ----------
function drawNote() {
  const { view, show, k, A0 } = state;
  const n = STRAIGHT[view];
  const o = ORDERS[n];
  const note = $('view-note');
  note.className = 'callout o' + n;
  const slope = n === 2 ? `+k = ${sig(k[2])} M⁻¹ s⁻¹` : `−k = −${sig(k[n])} ${o.kUnit}`;
  const law = { 0: '[A]ₜ = −kt + [A]₀', 1: 'ln[A]ₜ = −kt + ln[A]₀', 2: '1/[A]ₜ = kt + 1/[A]₀' }[n];
  let txt = `In this plot the <strong>${o.name.toLowerCase()}-order</strong> line is straight, because ${law}. Slope = ${slope}.`;
  if (view === 'A') txt += ' The short lines through the dots show the slope at time t: that slope is −rate.';
  if (!show[n]) txt += ` (Turn on “${o.name}” to see it.)`;
  if (view === 'A' && show[0] && A0 / k[0] < state.tmax) {
    txt += ` The zero-order reaction runs out of A at t = [A]₀/k = ${fmtTime(A0 / k[0])} and stops.`;
  }
  note.innerHTML = txt;
}

// ---------- readout table ----------
function drawTable() {
  const { A0, k, t, show } = state;
  const rows = ORDERS.map(o => {
    const c = conc(o.n, k[o.n], A0, t);
    const r = rate(o.n, k[o.n], c);
    const hl = halfLives(o.n, k[o.n], A0);
    return `<tr class="${show[o.n] ? '' : 'off'}">
      <td><span class="swatch o${o.n}"></span> ${o.name}</td>
      <td class="num">${sig(k[o.n])} ${o.kUnit}</td>
      <td class="num">${sig(c)} M</td>
      <td class="num">${sig(r)} M s⁻¹</td>
      ${hl.map(h => `<td class="num">${fmtTime(h)}</td>`).join('')}
    </tr>`;
  });
  $('readout').querySelector('tbody').innerHTML = rows.join('');
}

// ---------- particle boxes ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const boxes = ORDERS.map(o => {
  const rnd = mulberry32(1234 + o.n * 77);
  const dots = [];
  for (let i = 0; i < N_MOLECULES; i++) {
    const gx = i % 10, gy = Math.floor(i / 10);
    dots.push({ x: (gx + 0.5 + (rnd() - 0.5) * 0.55) / 10, y: (gy + 0.5 + (rnd() - 0.5) * 0.55) / 10, rank: rnd() });
  }
  // the order in which molecules react: lowest rank reacts first
  const sorted = [...dots].sort((a, b) => a.rank - b.rank);
  sorted.forEach((d, i) => (d.order = i));
  const el = $('box' + o.n);
  return { o, dots, el, canvas: el.querySelector('canvas'), label: el.querySelector('p') };
});

function drawBoxes() {
  const { A0, k, t, show } = state;
  const empty = cssColor('--cB');
  for (const b of boxes) {
    const cv = b.canvas, ctx = cv.getContext('2d');
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w) continue;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const frac = conc(b.o.n, k[b.o.n], A0, t) / A0;
    const nA = Math.round(frac * N_MOLECULES);
    const reacted = N_MOLECULES - nA;
    const col = cssColor(b.o.color);
    const r = Math.max(2.5, w / 34);
    for (const d of b.dots) {
      ctx.beginPath();
      ctx.arc(d.x * w, d.y * h, r, 0, Math.PI * 2);
      if (d.order < reacted) {
        ctx.strokeStyle = empty; ctx.lineWidth = 1.3; ctx.stroke();
      } else {
        ctx.fillStyle = col; ctx.fill();
      }
    }
    b.label.textContent = `A left: ${nA} of ${N_MOLECULES}`;
    b.el.classList.toggle('off', !show[b.o.n]);
  }
}

// ---------- controls ----------
function syncOutputs() {
  $('A0-out').textContent = state.A0.toFixed(2) + ' M';
  ORDERS.forEach(o => ($('k' + o.n + '-out').textContent = state.k[o.n].toFixed(3) + ' ' + o.kUnit));
  $('tmax-out').textContent = state.tmax + ' s';
  $('t-out').textContent = 't = ' + state.t.toFixed(1) + ' s';
  const tIn = $('t');
  tIn.max = state.tmax;
  tIn.value = state.t;
}

function render() {
  syncOutputs();
  drawPlot();
  drawNote();
  drawTable();
  drawBoxes();
}

function setRangeValue(id, v) {
  const el = $(id);
  const lo = +el.min, hi = +el.max;
  const clamped = Math.min(hi, Math.max(lo, v));
  el.value = clamped;
  return { value: +el.value, clamped: Math.abs(clamped - v) > 1e-12 };
}

$('A0').addEventListener('input', e => { state.A0 = +e.target.value; $('match-note').textContent = ''; render(); });
ORDERS.forEach(o => $('k' + o.n).addEventListener('input', e => {
  state.k[o.n] = +e.target.value; $('match-note').textContent = ''; render();
}));
$('tmax').addEventListener('input', e => {
  state.tmax = +e.target.value;
  state.t = Math.min(state.t, state.tmax);
  render();
});
$('t').addEventListener('input', e => { state.t = +e.target.value; stop(); render(); });
[0, 1, 2].forEach(n => $('show' + n).addEventListener('change', e => { state.show[n] = e.target.checked; render(); }));
$('showHalf').addEventListener('change', e => { state.half = e.target.checked; render(); });
$('showTangent').addEventListener('change', e => { state.tangent = e.target.checked; render(); });

document.querySelectorAll('#orders-lab .seg button').forEach(btn => btn.addEventListener('click', () => {
  state.view = btn.dataset.view;
  document.querySelectorAll('#orders-lab .seg button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  render();
}));

// Initial rate of each order: k0, k1[A]0, k2[A]0². Match them to the zero-order rate.
$('match').addEventListener('click', () => {
  const r0 = state.k[0], A0 = state.A0;
  const a = setRangeValue('k1', r0 / A0);
  const b = setRangeValue('k2', r0 / (A0 * A0));
  state.k[1] = a.value; state.k[2] = b.value;
  $('match-note').textContent = a.clamped || b.clamped
    ? 'A slider hit its limit, so the initial rates are only roughly equal. Try a different [A]₀ or zero-order k.'
    : `All three now start at rate = ${sig(r0)} M s⁻¹.`;
  render();
});
$('reset').addEventListener('click', () => {
  stop();
  Object.assign(state, { A0: DEFAULTS.A0, k: [...DEFAULTS.k], tmax: DEFAULTS.tmax, t: DEFAULTS.t });
  $('A0').value = state.A0; $('tmax').value = state.tmax;
  ORDERS.forEach(o => ($('k' + o.n).value = state.k[o.n]));
  $('match-note').textContent = '';
  render();
});

// ---------- play ----------
let raf = 0, last = 0;
function step(ts) {
  if (!state.playing) return;
  const dt = last ? (ts - last) / 1000 : 0;
  last = ts;
  state.t = Math.min(state.tmax, state.t + (dt * state.tmax) / 12); // whole window in 12 s
  render();
  if (state.t >= state.tmax) { stop(); return; }
  raf = requestAnimationFrame(step);
}
function stop() {
  state.playing = false; cancelAnimationFrame(raf); last = 0;
  $('play').textContent = '▶ Play';
}
$('play').addEventListener('click', () => {
  if (state.playing) { stop(); return; }
  if (state.t >= state.tmax - 1e-9) state.t = 0;
  state.playing = true;
  $('play').textContent = '❚❚ Pause';
  raf = requestAnimationFrame(step);
});

new ResizeObserver(() => drawBoxes()).observe($('box0'));
window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', render);
render();
