// "Data detective": find the order and k of a reaction A -> products from simulated measurements.
// Data are generated in the browser; answers are never sent anywhere.

import { Plot } from '../assets/plot.js';
import { conc } from './orders.js';
import { sig, parseNumber } from '../assets/format.js';

const $ = id => document.getElementById(id);
const TIMES = [0, 20, 40, 60, 80, 100, 120]; // s
const UNITS = ['M s⁻¹', 's⁻¹', 'M⁻¹ s⁻¹'];
const NAMES = ['zero', 'first', 'second'];
const VIEWS = {
  A: { f: c => c, label: '[A]  (M)', slopeUnit: 'M s⁻¹' },
  lnA: { f: c => Math.log(c), label: 'ln [A]', slopeUnit: 's⁻¹' },
  invA: { f: c => 1 / c, label: '1 / [A]  (M⁻¹)', slopeUnit: 'M⁻¹ s⁻¹' },
};

const round2 = x => +x.toPrecision(2);
const round3 = x => +x.toPrecision(3);

let data = null;
let view = 'A';
let solvedOrder = false;

function linearFit(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx, r2: (sxy * sxy) / (sxx * syy) };
}

function newDataset() {
  const n = Math.floor(Math.random() * 3);
  const A0 = round2(0.5 + Math.random());              // 0.50–1.5 M
  const f = 0.15 + Math.random() * 0.15;               // fraction left at the last time point
  const tEnd = TIMES[TIMES.length - 1];
  let k;
  if (n === 0) k = (A0 * (1 - f)) / tEnd;
  else if (n === 1) k = -Math.log(f) / tEnd;
  else k = (1 / f - 1) / (A0 * tEnd);
  k = round2(k);
  const rows = TIMES.map((t, i) => {
    const exact = conc(n, k, A0, t);
    const noise = i === 0 ? 1 : 1 + (Math.random() - 0.5) * 0.02; // ±1 %
    return [t, round3(exact * noise)];
  });
  const ts = rows.map(r => r[0]), cs = rows.map(r => r[1]);
  const fit = linearFit(ts, cs.map(VIEWS[Object.keys(VIEWS)[n]].f));
  const kFit = n === 2 ? fit.slope : -fit.slope;
  data = { n, A0, k, rows, kFit };
  solvedOrder = false;

  $('det-table').querySelector('tbody').innerHTML =
    rows.map(([t, c]) => `<tr><td class="num">${t}</td><td class="num">${c.toFixed(3)}</td></tr>`).join('');
  $('det-order-fb').textContent = ''; $('det-order-fb').className = 'feedback';
  $('det-k-fb').textContent = ''; $('det-k-fb').className = 'feedback';
  $('det-k').value = '';
  $('det-k-step').hidden = true;
  document.querySelectorAll('#det-order button').forEach(b => b.classList.remove('primary'));
  draw();
}

const plot = new Plot($('det-plot'));

function draw() {
  const v = VIEWS[view];
  const pts = data.rows.map(([t, c]) => [t, v.f(c)]);
  const ys = pts.map(p => p[1]);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  const pad = (hi - lo) * 0.12 || 0.1;
  lo = view === 'lnA' ? lo - pad : Math.max(0, lo - pad);
  hi += pad;
  if (view !== 'lnA') lo = 0;
  const spec = {
    x: { min: 0, max: 130, label: 'time t  (s)' },
    y: { min: lo, max: hi, label: v.label },
    markers: pts.map(([x, y]) => ({ x, y, color: '--accent', r: 5 })),
    segments: [],
  };
  const note = $('det-fit-note');
  if ($('det-fit').checked) {
    const fit = linearFit(pts.map(p => p[0]), ys);
    spec.segments.push({ x1: 0, y1: fit.intercept, x2: 130, y2: fit.intercept + fit.slope * 130, color: '--text-muted', width: 1.5, dash: [6, 4] });
    note.textContent = `Best straight line: slope = ${sig(fit.slope)} ${v.slopeUnit}, intercept = ${sig(fit.intercept)}, R² = ${fit.r2.toFixed(4)}.`;
  } else {
    note.textContent = '';
  }
  plot.draw(spec);
}

document.querySelectorAll('#det-views button').forEach(btn => btn.addEventListener('click', () => {
  view = btn.dataset.view;
  document.querySelectorAll('#det-views button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  draw();
}));
$('det-fit').addEventListener('change', draw);
$('det-new').addEventListener('click', newDataset);

document.querySelectorAll('#det-order button').forEach(btn => btn.addEventListener('click', () => {
  const n = +btn.dataset.n;
  const fb = $('det-order-fb');
  document.querySelectorAll('#det-order button').forEach(b => b.classList.toggle('primary', b === btn));
  if (n === data.n) {
    const plotName = ['[A]', 'ln [A]', '1 / [A]'][n];
    fb.className = 'feedback right';
    fb.textContent = `Correct: ${NAMES[n]} order. Only the ${plotName} plot is a straight line.`;
    solvedOrder = true;
    $('det-k-unit').textContent = UNITS[n];
    $('det-k-step').hidden = false;
  } else {
    fb.className = 'feedback wrong';
    fb.textContent = `Not ${NAMES[n]} order. If it were, which plot would be straight? Check that plot.`;
  }
}));

$('det-check').addEventListener('click', () => {
  if (!solvedOrder) return;
  const fb = $('det-k-fb');
  const v = parseNumber($('det-k').value);
  if (!Number.isFinite(v)) { fb.className = 'feedback wrong'; fb.textContent = 'Type a number, for example 0.012.'; return; }
  if (v < 0) { fb.className = 'feedback wrong'; fb.textContent = 'k is always positive. Look at the sign of the slope: for zero and first order the slope is −k.'; return; }
  const ok = [data.k, data.kFit].some(ref => Math.abs(v - ref) / ref < 0.06);
  fb.className = 'feedback ' + (ok ? 'right' : 'wrong');
  fb.textContent = ok
    ? `Correct: k ≈ ${sig(data.kFit, 2)} ${UNITS[data.n]}.`
    : 'Not quite. Use the plot that is straight: its slope is −k (zero and first order) or +k (second order).';
});
$('det-show').addEventListener('click', () => {
  const fb = $('det-k-fb');
  const slopeWord = data.n === 2 ? 'slope = +k' : 'slope = −k';
  fb.className = 'feedback';
  fb.textContent = `The data were made with k = ${sig(data.k, 2)} ${UNITS[data.n]} and [A]₀ = ${data.A0.toFixed(2)} M. `
    + `The best straight line gives ${slopeWord}, so k ≈ ${sig(data.kFit, 3)} ${UNITS[data.n]}.`;
});

newDataset();
