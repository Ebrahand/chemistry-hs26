// Module 3: Arrhenius explorer (k against T, ln k against 1/T) and a virtual lab: find Ea from measured rate constants.

import { Plot } from '../assets/plot.js';
import { sig, sci, parseNumber, superscript } from '../assets/format.js';

const $ = id => document.getElementById(id);
const R = 8.314;
const rows = (el, list) => { $(el).innerHTML = list.map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal">${b}</td></tr>`).join(''); };
function setSeg(group, view) { for (const b of $(group).querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.view === view)); }

// ---------- explorer ----------
const eIn = $('ar-Ea'), aIn = $('ar-A'), tIn = $('ar-T');
const plot = new Plot($('ar-plot'));
let view = 'k';
const T_MIN = 250, T_MAX = 450;

function render() {
  const Ea = +eIn.value * 1000, A = Math.pow(10, +aIn.value), T = +tIn.value;
  $('ar-Ea-out').textContent = `${eIn.value} kJ/mol`;
  $('ar-A-out').textContent = `${sci(A, 2)} s⁻¹`;
  $('ar-T-out').textContent = `${T} K (${T - 273} °C)`;
  const k = t => A * Math.exp(-Ea / (R * t));
  const n = 160;
  if (view === 'k') {
    const kmax = k(T_MAX);
    // scale the y axis in a power of ten so the tick labels stay short
    const p = Math.floor(Math.log10(kmax)), sc = Math.pow(10, p);
    plot.draw({
      x: { min: T_MIN, max: T_MAX, label: 'temperature T (K)' },
      y: { min: 0, max: kmax / sc * 1.05, label: p === 0 ? 'k (s⁻¹)' : `k (10${superscript(p)} s⁻¹)` },
      series: [{ points: Array.from({ length: n + 1 }, (_, i) => { const t = T_MIN + i / n * (T_MAX - T_MIN); return [t, k(t) / sc]; }), color: '--c1' }],
      markers: [{ x: T, y: k(T) / sc, color: '--c0', r: 6 }],
    });
  } else {
    const x1 = 1000 / T_MAX, x2 = 1000 / T_MIN;
    const y = x => Math.log(A) - Ea / R * x / 1000;
    const ylo = y(x2), yhi = y(x1), pad = (yhi - ylo) * 0.08;
    plot.draw({
      x: { min: x1, max: x2, label: '1/T (10⁻³ K⁻¹)' },
      y: { min: ylo - pad, max: yhi + pad, label: 'ln k' },
      series: [{ points: [[x1, y(x1)], [x2, y(x2)]], color: '--c1' }],
      markers: [{ x: 1000 / T, y: Math.log(k(T)), color: '--c0', r: 6 }],
      texts: [{ x: x1 + (x2 - x1) * 0.55, y: y(x1 + (x2 - x1) * 0.55), dy: -14, text: `slope = −Eₐ/R = −${sig(Ea / R, 3)} K`, bold: true }],
    });
  }
  const r10 = k(T + 10) / k(T);
  rows('ar-readout', [
    [`k at ${T} K`, `${sci(k(T), 3)} s⁻¹`],
    ['k(T + 10 K) / k(T)', `<strong>× ${sig(r10, 3)}</strong>`],
    ['Slope of ln k vs 1/T', `−E<sub>a</sub>/R = −${sig(Ea / R, 4)} K`],
    ['Intercept', `ln A = ${(+aIn.value * Math.LN10).toFixed(2)}`],
  ]);
  const thumb = r10 > 1.8 && r10 < 2.2 ? ' That is the rule of thumb: about twice as fast per +10 °C.' : '';
  $('ar-note').innerHTML = view === 'k'
    ? `k climbs steeply, not in a straight line: the exponential. Here +10 K multiplies k by ${sig(r10, 3)}.${thumb} A shifts the whole curve up or down; E<sub>a</sub> sets how steep it is.`
    : `Plotted as ln k against 1/T, the same data fall on a straight line. Hot is on the left (small 1/T). A steeper line means a larger E<sub>a</sub>; changing A only moves the line up or down.${thumb}`;
}
for (const el of [eIn, aIn, tIn]) el.addEventListener('input', render);
$('ar-view').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; view = b.dataset.view; setSeg('ar-view', view); render(); });
render();

// ---------- virtual lab ----------
const fitPlot = new Plot($('fit-plot'));
let data = [], truth = null, fitView = 'ln', brown = false;
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

function linfit(pts) {
  const n = pts.length, sx = pts.reduce((s, p) => s + p[0], 0), sy = pts.reduce((s, p) => s + p[1], 0);
  const sxx = pts.reduce((s, p) => s + p[0] * p[0], 0), sxy = pts.reduce((s, p) => s + p[0] * p[1], 0);
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { m, b: (sy - m * sx) / n };
}
const fitEa = () => -linfit(data.map(([T, k]) => [1 / T, Math.log(k)])).m * R / 1000;   // kJ/mol

function newData() {
  brown = false;
  const Ea = 40 + Math.round(Math.random() * 140);              // kJ/mol
  const T0 = 280 + 5 * Math.round(Math.random() * 40);          // K
  const dT = 10 + 5 * Math.round(Math.random() * 2);
  // choose A so that k is about 10⁻³ … 10⁻¹ s⁻¹ at the first temperature
  const k0 = Math.pow(10, -3 + 2 * Math.random());
  const A = k0 * Math.exp(Ea * 1000 / (R * T0));
  data = Array.from({ length: 5 }, (_, i) => { const T = T0 + i * dT; return [T, A * Math.exp(-Ea * 1000 / (R * T)) * (1 + 0.03 * gauss())]; });
  truth = Ea;
  start();
}
function brownData() {
  brown = true;
  data = [[189.7, 2.52e-5], [198.9, 5.25e-5], [230.3, 6.30e-4], [251.2, 3.16e-3]].map(([c, k]) => [c + 273.15, k]);
  truth = 160;
  start();
}
function start() {
  $('fit-table').querySelector('tbody').innerHTML = data.map(([T, k]) => `<tr><td class="num">${T.toFixed(1)}</td><td class="num">${sci(k, 3)}</td></tr>`).join('');
  $('fit-q').textContent = brown ? 'What is the activation energy of CH₃NC → CH₃CN?' : 'What is the activation energy?';
  $('fit-Ea').value = '';
  $('fit-fb').textContent = ''; $('fit-fb').className = 'feedback';
  drawFit();
}
function drawFit() {
  const showLine = $('fit-line').checked;
  if (fitView === 'k') {
    const kmax = Math.max(...data.map(d => d[1])), p = Math.floor(Math.log10(kmax)), sc = Math.pow(10, p);
    const T1 = data[0][0], T2 = data[data.length - 1][0], pad = (T2 - T1) * 0.08;
    fitPlot.draw({
      x: { min: T1 - pad, max: T2 + pad, label: 'temperature T (K)' },
      y: { min: 0, max: kmax / sc * 1.12, label: p === 0 ? 'k (s⁻¹)' : `k (10${superscript(p)} s⁻¹)` },
      series: [{ points: data.map(([T, k]) => [T, k / sc]), color: '--c1', width: 0.01, dots: 5 }],
    });
    $('fit-line-note').textContent = 'Curved: hard to read Eₐ from this. Switch to ln k against 1/T.';
    return;
  }
  const pts = data.map(([T, k]) => [1000 / T, Math.log(k)]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const xlo = Math.min(...xs), xhi = Math.max(...xs), ylo = Math.min(...ys), yhi = Math.max(...ys);
  const px = (xhi - xlo) * 0.1, py = (yhi - ylo) * 0.12;
  const f = linfit(pts);
  fitPlot.draw({
    x: { min: xlo - px, max: xhi + px, label: '1/T (10⁻³ K⁻¹)' },
    y: { min: ylo - py, max: yhi + py, label: 'ln k' },
    series: [{ points: pts, color: '--c1', width: 0.01, dots: 5 }]
      .concat(showLine ? [{ points: [[xlo - px, f.m * (xlo - px) + f.b], [xhi + px, f.m * (xhi + px) + f.b]], color: '--c0', width: 2, dash: [6, 4] }] : []),
  });
  $('fit-line-note').innerHTML = showLine
    ? `Best line: slope = ${sig(f.m * 1000, 4).replace('-', '−')} K (the x axis is in 10⁻³ K⁻¹, so multiply its slope by 1000). E<sub>a</sub> = −slope × R.`
    : 'Tick "Best straight line" to see the fit, or estimate the slope from two points yourself.';
}
$('fit-view').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; fitView = b.dataset.view; setSeg('fit-view', fitView); drawFit(); });
$('fit-line').addEventListener('change', drawFit);
$('fit-new').addEventListener('click', newData);
$('fit-brown').addEventListener('click', brownData);
$('fit-check').addEventListener('click', () => {
  const v = parseNumber($('fit-Ea').value), fb = $('fit-fb'), best = fitEa();
  if (!Number.isFinite(v)) { fb.className = 'feedback wrong'; fb.textContent = 'Type a number in kJ/mol, e.g. 85.'; return; }
  const ok = Math.abs(v - best) / best <= 0.05 || Math.abs(v - truth) / truth <= 0.05;
  if (ok) { fb.className = 'feedback right'; fb.textContent = `Correct. The best line through these points gives Eₐ = ${best.toFixed(0)} kJ/mol${brown ? ' (Brown reads 160 kJ/mol off his graph)' : ''}.`; return; }
  fb.className = 'feedback wrong';
  if (Math.abs(v * 1000 - best) / best < 0.05) fb.textContent = 'Check the units: the answer is asked in kJ/mol, not J/mol.';
  else if (Math.abs(v - best * 1000 / R) / (best * 1000 / R) < 0.08 || Math.abs(v - best / R) / (best / R) < 0.08) fb.textContent = 'That looks like the slope (Eₐ/R, in K). Multiply by R = 8.314 J mol⁻¹ K⁻¹.';
  else fb.textContent = 'Not quite. Use ln k against 1/T (in K⁻¹): Eₐ = −slope × R.';
});
$('fit-show').addEventListener('click', () => {
  const [T1, k1] = data[0], [T2, k2] = data[data.length - 1], two = R * Math.log(k2 / k1) / (1 / T1 - 1 / T2) / 1000;
  $('fit-fb').className = 'feedback';
  $('fit-fb').innerHTML = `With the first and last points: E<sub>a</sub> = R ln(k₂/k₁) / (1/T₁ − 1/T₂) = 8.314 × ln(${sci(k2, 3)}/${sci(k1, 3)}) / (1/${T1.toFixed(1)} − 1/${T2.toFixed(1)}) = ${two.toFixed(0)} kJ/mol. ` +
    `The best line through all points gives ${fitEa().toFixed(0)} kJ/mol.` + (brown ? ' Brown: 160 kJ/mol.' : '');
  $('fit-line').checked = true; fitView = 'ln'; setSeg('fit-view', 'ln'); drawFit();
});
newData();
