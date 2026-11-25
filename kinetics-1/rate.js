// Module 1: what is a reaction rate?
//  - particle simulation of A -> B (first order, stochastic)
//  - average rate (secant) versus instantaneous rate (tangent)
//  - rate and stoichiometry for 2 N2O5 -> 4 NO2 + O2

import { Plot, cssColor } from '../assets/plot.js';
import { sig, sci } from '../assets/format.js';

const $ = id => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------------------
// Particle simulation
// ---------------------------------------------------------------------------
const SIM = { N: 150, k: 0.08, tEnd: 40, speed: 4 }; // k in s⁻¹ (simulation time); speed = sim s per real s
const simPlot = new Plot($('sim-plot'));
const box = $('sim-box');
let mols = [], history = [], simT = 0, playing = false, raf = 0, lastTs = 0;

function resetSim() {
  stopSim();
  mols = Array.from({ length: SIM.N }, () => ({
    x: Math.random(), y: Math.random(),
    vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
    isA: true, flash: 0,
  }));
  simT = 0;
  history = [[0, SIM.N]];
  drawSim();
}

function stepSim(dt) {
  const p = 1 - Math.exp(-SIM.k * dt); // chance that one A molecule reacts during dt
  for (const m of mols) {
    if (!reduceMotion) {
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.x < 0) { m.x = -m.x; m.vx *= -1; } if (m.x > 1) { m.x = 2 - m.x; m.vx *= -1; }
      if (m.y < 0) { m.y = -m.y; m.vy *= -1; } if (m.y > 1) { m.y = 2 - m.y; m.vy *= -1; }
    }
    if (m.isA && Math.random() < p) { m.isA = false; m.flash = 1; }
    m.flash = Math.max(0, m.flash - dt * 0.8);
  }
  simT += dt;
  history.push([simT, mols.filter(m => m.isA).length]);
}

function countA() { return history[history.length - 1][1]; }

function recentRate(window = 4) {
  // molecules of A used up per second over the last `window` seconds of simulation time
  const now = history[history.length - 1];
  let i = history.length - 1;
  while (i > 0 && now[0] - history[i][0] < window) i--;
  const then = history[i];
  const dt = now[0] - then[0];
  return dt > 0.5 ? (then[1] - now[1]) / dt : NaN;
}

function drawBox() {
  const ctx = box.getContext('2d');
  const w = box.clientWidth, h = box.clientHeight;
  if (!w) return;
  const dpr = window.devicePixelRatio || 1;
  if (box.width !== Math.round(w * dpr)) { box.width = Math.round(w * dpr); box.height = Math.round(h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const cA = cssColor('--c1'), cB = cssColor('--c2'), pad = 8, r = Math.max(3, w / 75);
  for (const m of mols) {
    const x = pad + m.x * (w - 2 * pad), y = pad + m.y * (h - 2 * pad);
    if (m.flash > 0) {
      ctx.beginPath(); ctx.arc(x, y, r * (1 + 2.5 * m.flash), 0, Math.PI * 2);
      ctx.fillStyle = cB; ctx.globalAlpha = 0.25 * m.flash; ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.beginPath();
    if (m.isA) { ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = cA; }
    else { ctx.rect(x - r, y - r, 2 * r, 2 * r); ctx.fillStyle = cB; }
    ctx.fill();
  }
}

function drawSim() {
  drawBox();
  simPlot.draw({
    x: { min: 0, max: SIM.tEnd, label: 'time t  (s)' },
    y: { min: 0, max: SIM.N * 1.05, label: 'number of molecules' },
    series: [
      { points: history, color: '--c1', width: 2.6 },
      { points: history.map(([t, a]) => [t, SIM.N - a]), color: '--c2', width: 2.2, dash: [8, 5] },
    ],
  });
  const nA = countA(), r = recentRate();
  let txt = `t = ${simT.toFixed(1)} s · A: ${nA} · B: ${SIM.N - nA}. `;
  if (Number.isFinite(r)) {
    txt += `Over the last 4 s, about <strong>${r.toFixed(1)} molecules of A per second</strong> reacted. `;
    txt += nA > SIM.N * 0.6
      ? 'Plenty of A is left, so many molecules react per second.'
      : 'Less A is left now, so fewer molecules react per second: the rate drops as A is used up.';
  } else {
    txt += 'Press Start.';
  }
  $('sim-note').innerHTML = txt;
}

function loop(ts) {
  if (!playing) return;
  const dtReal = lastTs ? Math.min((ts - lastTs) / 1000, 0.1) : 0;
  lastTs = ts;
  const dt = dtReal * SIM.speed;
  // a few sub-steps keep the motion smooth
  for (let i = 0; i < 4; i++) stepSim(dt / 4);
  drawSim();
  if (simT >= SIM.tEnd) { stopSim(); $('sim-play').textContent = '▶ Start'; return; }
  raf = requestAnimationFrame(loop);
}
function stopSim() {
  playing = false; cancelAnimationFrame(raf); lastTs = 0;
  $('sim-play').textContent = simT > 0 && simT < SIM.tEnd ? '▶ Continue' : '▶ Start';
}
$('sim-play').addEventListener('click', () => {
  if (playing) { stopSim(); return; }
  if (simT >= SIM.tEnd) resetSim();
  playing = true;
  $('sim-play').textContent = '❚❚ Pause';
  raf = requestAnimationFrame(loop);
});
$('sim-reset').addEventListener('click', resetSim);
new ResizeObserver(drawBox).observe(box);

// ---------------------------------------------------------------------------
// Average versus instantaneous rate: [A] = [A]0 exp(−kt), illustrative values
// ---------------------------------------------------------------------------
const SEC = { A0: 0.100, k: 2.0e-3, tMax: 1000 };
const A = t => SEC.A0 * Math.exp(-SEC.k * t);
const secPlot = new Plot($('sec-plot'));
// slider 0…100 → Δt from 1 s to 400 s on a log scale
const dtFromSlider = v => Math.pow(10, (v / 100) * Math.log10(400));

function drawSecant() {
  const t = +$('sec-t').value;
  const dt = dtFromSlider(+$('sec-dt').value);
  const showTan = $('sec-tan').checked;
  const a1 = A(t), a2 = A(t + dt);
  const avg = -(a2 - a1) / dt;
  const inst = SEC.k * a1; // −d[A]/dt at t
  $('sec-t-out').textContent = t + ' s';
  $('sec-dt-out').textContent = sig(dt, 2) + ' s';

  const curve = [];
  for (let i = 0; i <= 200; i++) { const x = (SEC.tMax * i) / 200; curve.push([x, A(x)]); }
  const ext = 0.25 * SEC.tMax;
  const spec = {
    x: { min: 0, max: SEC.tMax, label: 'time t  (s)' },
    y: { min: 0, max: SEC.A0 * 1.08, label: '[A]  (M)' },
    series: [{ points: curve, color: '--c1', width: 2.6 }],
    segments: [],
    markers: [{ x: t, y: a1, color: '--c0', r: 5 }, { x: t + dt, y: a2, color: '--c0', r: 5 }],
  };
  // secant drawn a bit beyond both points so its slope is easy to see
  const sSlope = -avg, pad = Math.min(dt * 0.3, 60);
  spec.segments.push({ x1: t - pad, y1: a1 - sSlope * pad, x2: t + dt + pad, y2: a2 + sSlope * pad, color: '--c0', width: 2 });
  if (showTan) spec.segments.push({ x1: t - ext / 2, y1: a1 + inst * ext / 2, x2: t + ext / 2, y2: a1 - inst * ext / 2, color: '--text', width: 1.5, dash: [6, 4] });
  secPlot.draw(spec);

  const diff = (avg - inst) / inst * 100;
  $('sec-readout').innerHTML = `
    <tr><td>Δ[A]</td><td class="num">${sci(a2 - a1)} M</td></tr>
    <tr><td>Δt</td><td class="num">${sig(dt, 3)} s</td></tr>
    <tr><td>average rate</td><td class="num">${sci(avg)} M s⁻¹</td></tr>
    <tr><td>instantaneous rate at t</td><td class="num">${sci(inst)} M s⁻¹</td></tr>`;
  $('sec-note').innerHTML = Math.abs(diff) < 1
    ? `With Δt = ${sig(dt, 2)} s the average rate is within ${Math.abs(diff).toFixed(1)} % of the instantaneous rate: the secant has almost become the tangent.`
    : `The average rate is ${Math.abs(diff).toFixed(0)} % ${diff < 0 ? 'lower' : 'higher'} than the instantaneous rate at t, because the curve flattens during the interval. Make Δt smaller.`;
}
['sec-t', 'sec-dt'].forEach(id => $(id).addEventListener('input', drawSecant));
$('sec-tan').addEventListener('change', drawSecant);

// ---------------------------------------------------------------------------
// Rate and stoichiometry: 2 N2O5 -> 4 NO2 + O2 (illustrative numbers)
// [N2O5] = c0·exp(−k't);  [NO2] = 2(c0 − [N2O5]);  [O2] = ½(c0 − [N2O5])
// ---------------------------------------------------------------------------
const ST = { c0: 0.0200, kp: 1.0e-3, tMax: 3000 };
const N2O5 = t => ST.c0 * Math.exp(-ST.kp * t);
const SPECIES = [
  { name: 'N₂O₅', coef: 2, sign: -1, color: '--c1', dash: [], c: t => N2O5(t), d: t => -ST.kp * N2O5(t) },
  { name: 'NO₂', coef: 4, sign: +1, color: '--c0', dash: [8, 5], c: t => 2 * (ST.c0 - N2O5(t)), d: t => 2 * ST.kp * N2O5(t) },
  { name: 'O₂', coef: 1, sign: +1, color: '--c2', dash: [2, 4], c: t => 0.5 * (ST.c0 - N2O5(t)), d: t => 0.5 * ST.kp * N2O5(t) },
];
const stPlot = new Plot($('st-plot'));

function drawStoich() {
  const t = +$('st-t').value;
  $('st-t-out').textContent = t + ' s';
  const ext = ST.tMax * 0.12;
  stPlot.draw({
    x: { min: 0, max: ST.tMax, label: 'time t  (s)' },
    y: { min: 0, max: 2 * ST.c0 * 1.05, label: 'concentration  (M)' },
    series: SPECIES.map(s => ({ points: Array.from({ length: 201 }, (_, i) => { const x = ST.tMax * i / 200; return [x, s.c(x)]; }), color: s.color, dash: s.dash, width: 2.5 })),
    segments: SPECIES.map(s => ({ x1: t - ext, y1: s.c(t) - s.d(t) * ext, x2: t + ext, y2: s.c(t) + s.d(t) * ext, color: '--text', width: 1.4 })),
    markers: SPECIES.map(s => ({ x: t, y: s.c(t), color: s.color, r: 5 })),
    vlines: [{ x: t, color: '--text-muted', dash: [2, 3] }],
  });
  const rate = -SPECIES[0].d(t) / 2;
  $('st-table').innerHTML = SPECIES.map(s => {
    const term = s.sign < 0 ? `−(1/${s.coef}) × (${sci(s.d(t))})` : `(1/${s.coef}) × ${sci(s.d(t))}`;
    return `<tr><td><span class="swatch" style="background:var(${s.color})"></span> ${s.name}</td><td class="num">${s.coef}</td>
      <td class="num">${s.d(t) < 0 ? '' : '+'}${sci(s.d(t))} M s⁻¹</td>
      <td class="num">${term} = <strong>${sci(s.sign * s.d(t) / s.coef)}</strong> M s⁻¹</td></tr>`;
  }).join('');
  $('st-note').innerHTML = `Three different slopes, but after dividing by the coefficients all three give the same number:
    <strong>rate = ${sci(rate)} M s⁻¹</strong> at t = ${t} s.`;
}
$('st-t').addEventListener('input', drawStoich);

resetSim();
drawSecant();
drawStoich();
