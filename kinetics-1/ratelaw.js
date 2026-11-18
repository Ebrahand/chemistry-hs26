// Module 2: the rate law, rate = k[A]^m [B]^n.
//  - order explorer: what happens to the rate when a concentration is multiplied by x
//  - virtual lab: find m, n and k of a hidden rate law by the method of initial rates
// Everything runs in the browser; nothing is stored or sent.

import { Plot } from '../assets/plot.js';
import { sig, sci, superscript, kUnit, parseNumber } from '../assets/format.js';

const $ = id => document.getElementById(id);

function pressOne(group, btn) {
  group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
}
function pressedValue(group) {
  const b = group.querySelector('button[aria-pressed="true"]');
  return b ? +b.dataset.v : null;
}

// rate-law text with the exponent written out unless it is 1; order-0 terms greyed
function lawHTML(m, n) {
  const term = (sp, p) => {
    if (p === 0) return `<span class="muted">[${sp}]<sup>0</sup></span>`;
    return p === 1 ? `[${sp}]` : `[${sp}]<sup>${p}</sup>`;
  };
  return `rate = k${term('A', m)}${term('B', n)}`;
}

// ---------------------------------------------------------------------------
// Order explorer
// ---------------------------------------------------------------------------
const ex = { m: 1, n: 2, fA: 2, fB: 1 };

const factorText = f => (f === 0.5 ? '½' : String(f));
function fraction(x) {
  for (const den of [1, 2, 4, 8, 16]) {
    const num = x * den;
    if (Math.abs(num - Math.round(num)) < 1e-9) return den === 1 ? String(Math.round(num)) : `${Math.round(num)}/${den}`;
  }
  return sig(x);
}
function powerText(f, p) {
  const base = factorText(f);
  return (f === 0.5 ? `(${base})` : base) + superscript(p);
}

// 24 places in a 6 × 4 grid, filled in a fixed scrambled order so molecules look spread out
const SLOTS = [8, 21, 3, 14, 18, 1, 11, 23, 6, 16, 0, 13, 20, 4, 9, 22, 2, 15, 19, 7, 12, 5, 17, 10];

function flaskSVG(nA, nB, label) {
  const cols = 6, r = 6, w = 120, h = 92;
  const dots = [];
  // interleave A and B so the flask looks mixed
  const mixed = [];
  for (let a = nA, b = nB; a > 0 || b > 0; a--, b--) {
    if (a > 0) mixed.push('A');
    if (b > 0) mixed.push('B');
  }
  mixed.forEach((kind, i) => {
    const slot = SLOTS[i];
    const cx = 14 + (slot % cols) * 18.4, cy = 15 + Math.floor(slot / cols) * 20.5;
    dots.push(kind === 'A'
      ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--c1)"/>`
      : `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" rx="2" fill="var(--c2)"/>`);
  });
  return `<div class="flask">
    <svg viewBox="0 0 ${w} ${h}" aria-hidden="true">
      <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="10" fill="var(--bg)" stroke="var(--border)" stroke-width="1.5"/>
      ${dots.join('')}
    </svg>${label}</div>`;
}

function renderExplorer() {
  const { m, n, fA, fB } = ex;
  const ratio = Math.pow(fA, m) * Math.pow(fB, n);
  $('ex-law').innerHTML = lawHTML(m, n);
  $('ex-ratio').textContent = '×' + fraction(ratio);
  $('ex-how').textContent =
    `${powerText(fA, m)} × ${powerText(fB, n)} = ${fraction(Math.pow(fA, m))} × ${fraction(Math.pow(fB, n))} = ${fraction(ratio)}`;
  const base = 4;
  $('ex-flasks').innerHTML =
    flaskSVG(base, base, 'before') +
    '<span class="flask-arrow" aria-hidden="true">→</span>' +
    flaskSVG(Math.round(base * fA), Math.round(base * fB), `after: [A] ×${factorText(fA)}, [B] ×${factorText(fB)}`);
  const total = m + n;
  $('ex-units').innerHTML =
    `<span class="swatch o1"></span> A &nbsp; <span class="swatch o2" style="border-radius:2px"></span> B &nbsp;·&nbsp; ` +
    `Overall order ${m} + ${n} = ${total}, so k has units of <strong>${kUnit(total)}</strong>.`;
}

document.querySelectorAll('#explorer .seg').forEach(group => {
  group.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
    pressOne(group, btn);
    ex[group.dataset.key] = +btn.dataset.v;
    renderExplorer();
  }));
});
renderExplorer();

// ---------------------------------------------------------------------------
// Virtual lab: method of initial rates for A + B -> C
// ---------------------------------------------------------------------------
const MAX_RUNS = 12;
const plot = new Plot($('ir-plot'));
let mystery = null;
let runs = [];

function newMystery() {
  const pairs = [];
  for (let m = 0; m <= 2; m++) for (let n = 0; n <= 2; n++) if (m + n >= 1 && m + n <= 3) pairs.push([m, n]);
  const [m, n] = pairs[Math.floor(Math.random() * pairs.length)];
  // aim for an initial rate of roughly 10^-3.5 … 10^-2.5 M/s at [A]0 = [B]0 = 0.10 M
  const target = Math.pow(10, -3.5 + Math.random());
  const k = +(target / Math.pow(0.1, m + n)).toPrecision(2);
  mystery = { m, n, k };
  runs = [];
  ['ir-m', 'ir-n'].forEach(id => $(id).querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false')));
  $('ir-k').value = '';
  $('ir-unit').value = '';
  setFeedback('', '');
  renderTable();
  drawRun(null);
}

const trueRate = (A, B) => (A > 0 && B > 0 ? mystery.k * Math.pow(A, mystery.m) * Math.pow(B, mystery.n) : 0);

// [A](t) for one run: RK4 on d[A]/dt = −k[A]^m[B]^n with [B] = [B]0 − ([A]0 − [A]) (1:1 stoichiometry)
function simulate(A0, B0, T, steps = 300) {
  const f = A => -trueRate(A, B0 - (A0 - A));
  const h = T / steps;
  const pts = [[0, A0]];
  let A = A0;
  for (let i = 1; i <= steps; i++) {
    const k1 = f(A), k2 = f(A + (h / 2) * k1), k3 = f(A + (h / 2) * k2), k4 = f(A + h * k3);
    A = Math.max(0, A + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4));
    pts.push([i * h, A]);
  }
  return pts;
}

function drawRun(run) {
  if (!run) {
    plot.draw({ x: { min: 0, max: 100, label: 'time t  (s)' }, y: { min: 0, max: 0.2, label: '[A]  (M)' } });
    $('ir-plot-note').textContent = 'Set [A]₀ and [B]₀, then press “Run experiment”.';
    return;
  }
  const r0 = trueRate(run.A0, run.B0);
  const T = 1.25 * run.A0 / r0; // the tangent at t = 0 reaches [A] = 0 at t = [A]0 / rate0
  plot.draw({
    x: { min: 0, max: T, label: 'time t  (s)' },
    y: { min: 0, max: run.A0 * 1.08, label: '[A]  (M)' },
    series: [{ points: simulate(run.A0, run.B0, T), color: '--c1', width: 2.8 }],
    segments: [{ x1: 0, y1: run.A0, x2: run.A0 / r0, y2: 0, color: '--text', width: 1.5, dash: [6, 4] }],
    markers: [{ x: 0, y: run.A0, color: '--c1', r: 5 }],
  });
  $('ir-plot-note').textContent =
    `Run ${run.i}: [A]₀ = ${run.A0.toFixed(3)} M, [B]₀ = ${run.B0.toFixed(3)} M. ` +
    `The dashed line is the slope at t = 0, so the initial rate = ${sci(run.rate)} M s⁻¹.`;
}

function renderTable() {
  const body = $('ir-table').querySelector('tbody');
  if (!runs.length) {
    body.innerHTML = '<tr><td colspan="4" class="muted">No experiments yet.</td></tr>';
    return;
  }
  body.innerHTML = runs.map((r, idx) => `<tr${idx === runs.length - 1 ? ' class="latest"' : ''}>
    <td class="num">${r.i}</td><td class="num">${r.A0.toFixed(3)}</td><td class="num">${r.B0.toFixed(3)}</td>
    <td class="num">${sci(r.rate)}</td></tr>`).join('');
}

function syncLabOutputs() {
  $('ir-A-out').textContent = (+$('ir-A').value).toFixed(3) + ' M';
  $('ir-B-out').textContent = (+$('ir-B').value).toFixed(3) + ' M';
}

$('ir-A').addEventListener('input', syncLabOutputs);
$('ir-B').addEventListener('input', syncLabOutputs);
$('ir-run').addEventListener('click', () => {
  if (runs.length >= MAX_RUNS) {
    setFeedback('wrong', `The table is full (${MAX_RUNS} runs). Clear it to run more experiments.`);
    return;
  }
  const A0 = +$('ir-A').value, B0 = +$('ir-B').value;
  const noise = 1 + (Math.random() - 0.5) * 0.04; // ±2 % measurement error
  const run = { i: runs.length + 1, A0, B0, rate: +(trueRate(A0, B0) * noise).toPrecision(3) };
  runs.push(run);
  renderTable();
  drawRun(run);
});
$('ir-clear').addEventListener('click', () => { runs = []; renderTable(); drawRun(null); setFeedback('', ''); });
$('ir-new').addEventListener('click', newMystery);

['ir-m', 'ir-n'].forEach(id => {
  const group = $(id);
  group.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => pressOne(group, btn)));
});

function setFeedback(kind, html) {
  const fb = $('ir-fb');
  fb.className = 'feedback' + (kind ? ' ' + kind : '');
  fb.innerHTML = html;
}

$('ir-check').addEventListener('click', () => {
  const m = pressedValue($('ir-m')), n = pressedValue($('ir-n'));
  const k = parseNumber($('ir-k').value);
  const unit = $('ir-unit').value;
  if (runs.length < 3) {
    setFeedback('wrong', 'Run at least three experiments first: one reference run, one with only [A]₀ changed, and one with only [B]₀ changed.');
    return;
  }
  if (m === null || n === null) { setFeedback('wrong', 'Choose an order for A and for B.'); return; }

  const problems = [];
  const ordersRight = m === mystery.m && n === mystery.n;
  if (m !== mystery.m) problems.push('The order in A is not right. Find two runs with the same [B]₀: by what factor did [A]₀ change, and by what factor did the rate change?');
  if (n !== mystery.n) problems.push('The order in B is not right. Find two runs with the same [A]₀ and compare them the same way.');
  if (ordersRight) {
    if (!Number.isFinite(k) || k <= 0) problems.push('Enter a positive value for k. Take any run and solve k = rate / ([A]₀<sup>m</sup>[B]₀<sup>n</sup>).');
    else if (Math.abs(k - mystery.k) / mystery.k > 0.08) problems.push('Your orders are right, but k is off. Take any run and solve k = rate / ([A]₀<sup>m</sup>[B]₀<sup>n</sup>).');
    if (unit !== kUnit(m + n)) problems.push(`Check the units of k. The overall order is ${m + n}, and the rate is always in M s⁻¹.`);
  }
  if (!problems.length) {
    setFeedback('right', `Correct: ${lawHTML(m, n)} with k = ${sig(mystery.k, 2)} ${kUnit(m + n)}. Press “New mystery” for another one.`);
  } else {
    setFeedback('wrong', problems.length === 1 ? problems[0] : `<ul>${problems.map(p => `<li>${p}</li>`).join('')}</ul>`);
  }
});

$('ir-show').addEventListener('click', () => {
  const { m, n, k } = mystery;
  setFeedback('', `The hidden rate law was ${lawHTML(m, n)}, with k = ${sig(k, 2)} ${kUnit(m + n)} `
    + `(overall order ${m + n}). Your k may differ by a few percent because the measured rates have about 2 % error.`);
});

syncLabOutputs();
newMystery();
