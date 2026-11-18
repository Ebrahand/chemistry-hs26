// Module 4: the rate law d[A]/dt = −k[A]^n as an ODE.
//  - slope field with solution curves through clicked points
//  - Euler's method compared with the exact solution

import { Plot } from '../assets/plot.js';
import { sig } from '../assets/format.js';

const $ = id => document.getElementById(id);

const K_UNIT = { 0: 'M s⁻¹', 0.5: 'M¹ᐟ² s⁻¹', 1: 's⁻¹', 1.5: 'M⁻¹ᐟ² s⁻¹', 2: 'M⁻¹ s⁻¹' };

// Exact solution through the point (t1, A1), for any order n ≥ 0.
// n = 1: A = A1·exp(−k(t − t1)).  Otherwise A^(1−n) = A1^(1−n) − (1−n)·k·(t − t1).
export function solution(n, k, t1, A1, t) {
  if (n === 1) return A1 * Math.exp(-k * (t - t1));
  const base = Math.pow(A1, 1 - n) - (1 - n) * k * (t - t1);
  if (base <= 0) return n < 1 ? 0 : NaN; // n < 1: A has run out; n > 1: going back in time, [A] → ∞
  return Math.pow(base, 1 / (1 - n));
}

function pressOne(group, btn) {
  group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
}

// ---------------------------------------------------------------------------
// Slope field
// ---------------------------------------------------------------------------
const FL = { n: 1, k: 0.10, tMax: 60, yMax: 1.2, starts: [{ t: 0, A: 1.0 }] };
const COLORS = ['--c1', '--c0', '--c2'];
const flPlot = new Plot($('fl-plot'));

function drawField() {
  const { n, k, tMax, yMax, starts } = FL;
  $('fl-k-out').textContent = `${k.toFixed(2)} ${K_UNIT[n]}`;
  const series = [], markers = [];
  const small = $('fl-plot').clientWidth < 450;
  starts.forEach((s, i) => {
    const pts = [];
    for (let j = 0; j <= 300; j++) { const t = (tMax * j) / 300; pts.push([t, solution(n, k, s.t, s.A, t)]); }
    series.push({ points: pts, color: COLORS[i % COLORS.length], width: 2.6 });
    markers.push({ x: s.t, y: s.A, color: COLORS[i % COLORS.length], r: 5.5 });
  });
  flPlot.draw({
    x: { min: 0, max: tMax, label: 'time t  (s)' },
    y: { min: 0, max: yMax, label: '[A]  (M)' },
    field: { fn: (t, A) => -k * Math.pow(A, n), ...(small ? { nx: 11, ny: 8, len: 11 } : { nx: 18, ny: 12, len: 13 }), color: '--plot-axis' },
    series, markers,
  });
  const finite = n < 1
    ? 'For this order the curves reach [A] = 0 at a finite time and stop there.'
    : 'For this order the curves get flatter and flatter but never reach [A] = 0.';
  $('fl-hint').textContent = `Slope = −k[A]${n === 1 ? '' : '^' + (n === 0.5 ? '½' : n === 1.5 ? '1½' : n)}. ${finite}`;
}

$('fl-plot').addEventListener('click', e => {
  const r = e.currentTarget.getBoundingClientRect();
  const p = flPlot.invert(e.clientX - r.left, e.clientY - r.top);
  if (!p || p.y <= 0.005) return;
  FL.starts.push({ t: p.x, A: p.y });
  if (FL.starts.length > 6) FL.starts.shift();
  drawField();
});
$('fl-n').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
  pressOne($('fl-n'), btn); FL.n = +btn.dataset.v; drawField();
}));
$('fl-k').addEventListener('input', e => { FL.k = +e.target.value; drawField(); });
$('fl-clear').addEventListener('click', () => { FL.starts = [{ t: 0, A: 1.0 }]; drawField(); });

// ---------------------------------------------------------------------------
// Euler's method
// ---------------------------------------------------------------------------
const EU = { n: 1, k: 0.10, A0: 1.0, tMax: 60, dt: 5, shown: 0 };
const euPlot = new Plot($('eu-plot'));
const exact = t => solution(EU.n, EU.k, 0, EU.A0, t);

function eulerPoints() {
  const { n, k, A0, tMax, dt } = EU;
  const steps = Math.ceil(tMax / dt - 1e-9);
  const pts = [{ t: 0, A: A0 }];
  for (let i = 0; i < steps; i++) {
    const { t, A } = pts[i];
    // zero order: once A is used up the reaction stops
    const slope = n === 0 ? (A > 0 ? -k : 0) : -k * Math.pow(A, n);
    let next = A + slope * dt;
    if (n === 0) next = Math.max(0, next);
    pts[i].slope = slope;
    pts.push({ t: t + dt, A: next });
  }
  const last = pts[pts.length - 1];
  last.slope = n === 0 ? (last.A > 0 ? -k : 0) : -k * Math.pow(last.A, n);
  return pts;
}

function drawEuler() {
  const { n, k, dt, tMax } = EU;
  $('eu-dt-out').textContent = `${dt.toFixed(1)} s`;
  const all = eulerPoints();
  const shown = all.slice(0, EU.shown + 1);
  const curve = Array.from({ length: 301 }, (_, j) => { const t = (tMax * j) / 300; return [t, exact(t)]; });
  euPlot.draw({
    x: { min: 0, max: tMax, label: 'time t  (s)' },
    y: { min: -0.6, max: 1.1, label: '[A]  (M)' },
    hlines: [{ y: 0 }],
    series: [
      { points: curve, color: '--c1', width: 2.6 },
      { points: shown.map(p => [p.t, p.A]), color: '--c0', width: 2.2, dash: [7, 4] },
    ],
    markers: shown.map(p => ({ x: p.t, y: p.A, color: '--c0', r: 4.5 })),
  });

  const first = Math.max(0, shown.length - 12);
  $('eu-table').innerHTML = shown.slice(first).map((p, idx) => {
    const ex = exact(p.t);
    return `<tr${idx + first === EU.shown ? ' class="latest"' : ''}><td class="num">${idx + first}</td><td class="num">${sig(p.t, 3)}</td>
      <td class="num">${sig(p.A, 3)} M</td><td class="num">${sig(p.slope, 3)} M s⁻¹</td>
      <td class="num">${sig(ex, 3)} M</td><td class="num">${sig(p.A - ex, 2)} M</td></tr>`;
  }).join('');

  const note = $('eu-note');
  const kdt = k * dt;
  if (EU.shown === 0) {
    note.innerHTML = 'Press <strong>Take one step</strong>. Euler takes the slope at the start, −k[A]₀<sup>n</sup>, and walks Δt along it.';
    return;
  }
  const cur = shown[shown.length - 1];
  const err = cur.A - exact(cur.t);
  let txt = `After ${EU.shown} step${EU.shown > 1 ? 's' : ''} (t = ${sig(cur.t, 3)} s): Euler gives ${sig(cur.A, 3)} M, the exact value is ${sig(exact(cur.t), 3)} M.`;
  if (shown.some(p => p.A < 0)) {
    txt += ` <strong>[A] went negative</strong>: the step is far too large. ${n === 1 ? `Here kΔt = ${kdt.toFixed(2)}; for first order Euler goes below zero as soon as kΔt > 1.` : ''}`;
  } else if (n === 0) {
    txt += ' For zero order the slope is constant, so Euler follows the exact straight line.';
  } else {
    txt += ` Error: ${sig(err, 2)} M. Halve Δt and the error roughly halves.`;
  }
  note.innerHTML = txt;
}

$('eu-n').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
  pressOne($('eu-n'), btn); EU.n = +btn.dataset.v; EU.shown = eulerPoints().length - 1; drawEuler();
}));
$('eu-dt').addEventListener('input', e => { EU.dt = +e.target.value; EU.shown = eulerPoints().length - 1; drawEuler(); });
$('eu-step').addEventListener('click', () => { EU.shown = Math.min(EU.shown + 1, eulerPoints().length - 1); drawEuler(); });
$('eu-all').addEventListener('click', () => { EU.shown = eulerPoints().length - 1; drawEuler(); });
$('eu-reset').addEventListener('click', () => { EU.shown = 0; drawEuler(); });

drawField();
drawEuler();
