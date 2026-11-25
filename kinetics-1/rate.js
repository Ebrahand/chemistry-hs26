// Module 1: what is a reaction rate? (all views 3D, assets/scene3d.js)
//  - particle simulation of A -> B (first order, stochastic) in a 3D box; every run is kept in the plot
//  - average rate (secant) versus instantaneous rate (tangent)
//  - rate and stoichiometry for 2 N2O5 -> 4 NO2 + O2

import { THREE, View, Plot3D, Swarm, glassBox, geo, col, onTheme } from '../assets/scene3d.js';
import { sig, sci } from '../assets/format.js';

const $ = id => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------------------
// Particle simulation (3D box). Every run is kept for the plot, so runs can be compared.
// ---------------------------------------------------------------------------
const SIM = { N: 150, k: 0.08, tEnd: 40, speed: 4 }; // k in s⁻¹ (simulation time); speed = sim s per real s
const simPlot = new Plot3D($('sim-plot'), { size: [1.7, 1, 0.9] });
const boxView = new View($('sim-box'), { az: -0.5, el: 0.38, radius: 1.75 });
glassBox(boxView, [2, 2, 2]);
const swA = new Swarm(boxView, SIM.N, { geometry: geo.sphere });
const swB = new Swarm(boxView, SIM.N, { geometry: geo.cube });
const swF = new Swarm(boxView, SIM.N, { material: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.4, depthWrite: false }) });
let cA = col('--c1'), cB = col('--c2');
onTheme(() => { cA = col('--c1'); cB = col('--c2'); drawBox(); });
let mols = [], history = [], simT = 0, playing = false, runNo = 0, pastRuns = [], lastPlot = 0;
const MAX_RUNS = 5;

function resetSim() {
  stopSim();
  if (simT > 0) { pastRuns.push({ no: runNo, history: thin(history) }); if (pastRuns.length > MAX_RUNS - 1) pastRuns.shift(); }
  runNo++;
  mols = Array.from({ length: SIM.N }, () => {
    // random direction, same speed spread as before
    const v = new THREE.Vector3().randomDirection().multiplyScalar(0.06 + Math.random() * 0.12);
    return { x: Math.random(), y: Math.random(), z: Math.random(), vx: v.x, vy: v.y, vz: v.z, isA: true, flash: 0,
      q: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, 0)), spin: Math.random() - 0.5 };
  });
  simT = 0;
  history = [[0, SIM.N]];
  drawSim(true);
}

// at most one point per 0.1 s of simulation time, so the curves stay light to draw
function thin(h) {
  const out = [];
  for (const p of h) if (!out.length || p[0] - out[out.length - 1][0] >= 0.1 || p === h[h.length - 1]) out.push(p);
  return out;
}

function stepSim(dt) {
  const p = 1 - Math.exp(-SIM.k * dt); // chance that one A molecule reacts during dt
  for (const m of mols) {
    if (!reduceMotion) {
      m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt;
      if (m.x < 0) { m.x = -m.x; m.vx *= -1; } if (m.x > 1) { m.x = 2 - m.x; m.vx *= -1; }
      if (m.y < 0) { m.y = -m.y; m.vy *= -1; } if (m.y > 1) { m.y = 2 - m.y; m.vy *= -1; }
      if (m.z < 0) { m.z = -m.z; m.vz *= -1; } if (m.z > 1) { m.z = 2 - m.z; m.vz *= -1; }
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

const spinQ = new THREE.Quaternion(), spinAxis = new THREE.Vector3(0.3, 1, 0.2).normalize();
function drawBox(dt = 0) {
  const r = 0.055, L = 0.92;   // molecules stay inside the walls of the 2 × 2 × 2 box
  swA.begin(); swB.begin(); swF.begin();
  for (const m of mols) {
    const x = (m.x * 2 - 1) * L, y = (m.y * 2 - 1) * L, z = (m.z * 2 - 1) * L;
    if (m.isA) swA.put(x, y, z, r, cA);
    else {
      if (dt && !reduceMotion) m.q.multiply(spinQ.setFromAxisAngle(spinAxis, m.spin * dt * 2));
      swB.put(x, y, z, r * 1.7, cB, m.q);
    }
    if (m.flash > 0) swF.put(x, y, z, r * (1 + 3 * m.flash), cB);
  }
  swA.end(); swB.end(); swF.end();
  boxView.invalidate();
}

function drawPlot() {
  const runs = [...pastRuns, { no: runNo, history: thin(history) }];
  const z = { min: runs[0].no - 0.5, max: runNo + 0.5, reverse: true, label: 'run',
    tickValues: runs.map(r => r.no), tickFormat: v => 'run ' + v };
  const curves = [];
  for (const r of runs) {
    const cur = r.no === runNo, w = cur ? 1.25 : 0.75;
    curves.push({ points: r.history.map(([t, a]) => [t, a, r.no]), color: '--c1', width: w, curtain: cur ? 0.14 : 0 });
    curves.push({ points: r.history.map(([t, a]) => [t, SIM.N - a, r.no]), color: '--c2', width: w * 0.9, dash: true });
  }
  simPlot.draw({
    x: { min: 0, max: SIM.tEnd, label: 'time t  (s)' },
    y: { min: 0, max: SIM.N * 1.05, label: 'number of molecules' },
    z, curves,
  });
}

function drawSim(force = false) {
  drawBox();
  // the plot is rebuilt at most ~12 times a second while the simulation runs
  const now = performance.now();
  if (force || now - lastPlot > 80) { drawPlot(); lastPlot = now; }
  const nA = countA(), r = recentRate();
  let txt = `t = ${simT.toFixed(1)} s · A: ${nA} · B: ${SIM.N - nA}. `;
  if (Number.isFinite(r)) {
    txt += `Over the last 4 s, about <strong>${r.toFixed(1)} molecules of A per second</strong> reacted. `;
    txt += nA > SIM.N * 0.6
      ? 'Plenty of A is left, so many molecules react per second.'
      : 'Less A is left now, so fewer molecules react per second: the rate drops as A is used up.';
  } else {
    txt += runNo > 1 ? 'Press Start. Earlier runs stay behind this one in the plot: no two runs are exactly the same.' : 'Press Start.';
  }
  $('sim-note').innerHTML = txt;
}

// the simulation runs in the view's frame loop (it pauses while the box is scrolled off screen)
function tick(dt) {
  if (!playing) return false;
  const d = dt * SIM.speed;
  for (let i = 0; i < 4; i++) stepSim(d / 4);   // a few sub-steps keep the motion smooth
  drawSim();
  drawBox(dt);
  if (simT >= SIM.tEnd) { stopSim(); drawSim(true); return false; }
  return true;
}
function stopSim() {
  playing = false; boxView.stop();
  $('sim-play').textContent = simT > 0 && simT < SIM.tEnd ? '▶ Continue' : '▶ Start';
}
$('sim-play').addEventListener('click', () => {
  if (playing) { stopSim(); drawSim(true); return; }
  if (simT >= SIM.tEnd) resetSim();
  playing = true;
  $('sim-play').textContent = '❚❚ Pause';
  boxView.animate(tick);
});
$('sim-reset').addEventListener('click', resetSim);

// ---------------------------------------------------------------------------
// Average versus instantaneous rate: [A] = [A]0 exp(−kt), illustrative values
// ---------------------------------------------------------------------------
const SEC = { A0: 0.100, k: 2.0e-3, tMax: 1000 };
const A = t => SEC.A0 * Math.exp(-SEC.k * t);
// depth axis: log10 of the interval length, from Δt = 1 s (front, almost the tangent) to 400 s (back)
const secPlot = new Plot3D($('sec-plot'), { size: [1.7, 1, 1] });
// slider 0…100 → Δt from 1 s to 400 s on a log scale
const dtFromSlider = v => Math.pow(10, (v / 100) * Math.log10(400));
const LOGMAX = Math.log10(400);

function drawSecant() {
  const t = +$('sec-t').value;
  const dt = dtFromSlider(+$('sec-dt').value);
  const showTan = $('sec-tan').checked;
  const a1 = A(t), a2 = A(t + dt);
  const avg = -(a2 - a1) / dt;
  const inst = SEC.k * a1; // −d[A]/dt at t
  $('sec-t-out').textContent = t + ' s';
  $('sec-dt-out').textContent = sig(dt, 2) + ' s';

  const z = Math.log10(dt);
  const curve = [];
  for (let i = 0; i <= 200; i++) { const x = (SEC.tMax * i) / 200; curve.push([x, A(x), z]); }
  const ext = 0.25 * SEC.tMax;
  // the secant drawn a bit beyond both points so its slope is easy to see
  const sSlope = -avg, pad = Math.min(dt * 0.3, 60);
  const spec = {
    x: { min: 0, max: SEC.tMax, label: 'time t  (s)' },
    y: { min: 0, max: SEC.A0 * 1.08, label: '[A]  (M)' },
    z: { min: 0, max: LOGMAX, label: 'interval Δt', tickValues: [0, 1, 2], tickFormat: v => ['1 s', '10 s', '100 s'][v] },
    surfaces: [
      // the [A] curve, the same for every Δt: a faint sheet
      { fn: x => A(x), nx: 80, nz: 2, color: '--c1', opacity: 0.1, lines: 0 },
      // every secant from t, for every Δt: they sweep down to the tangent at the front
      { param: (u, w) => { const d = Math.pow(10, w * LOGMAX), x = t + u * d; return [x, a1 + u * (A(t + d) - a1), w * LOGMAX]; },
        nx: 12, nz: 48, color: '--c0', opacity: 0.22, lines: 0 },
    ],
    curves: [
      { points: curve, color: '--c1', width: 1.2 },
      // where the end of the secant travels as Δt changes
      { points: Array.from({ length: 61 }, (_, i) => { const w = i / 60 * LOGMAX, d = Math.pow(10, w); return [t + d, A(t + d), w]; }), color: '--c0', width: 0.6, dash: true },
    ],
    segs: [{ a: [t - pad, a1 - sSlope * pad, z], b: [t + dt + pad, a2 + sSlope * pad, z], color: '--c0', width: 1.8 }],
    points: [{ at: [t, a1, z], color: '--c0' }, { at: [t + dt, a2, z], color: '--c0' }],
    labels: [{ at: [t + dt, a2, z], text: 'Δt = ' + sig(dt, 2) + ' s', color: '--c0', anchor: 'l', dx: 10, dy: -10 }],
  };
  if (showTan) spec.segs.push({ a: [t - ext / 2, a1 + inst * ext / 2, 0], b: [t + ext / 2, a1 - inst * ext / 2, 0], color: '--text', width: 1.3, dash: true });
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
const stPlot = new Plot3D($('st-plot'), { size: [1.7, 1, 1] });

// one ribbon per substance, one behind the other
function drawStoich() {
  const t = +$('st-t').value;
  $('st-t-out').textContent = t + ' s';
  const ext = ST.tMax * 0.12;
  stPlot.draw({
    x: { min: 0, max: ST.tMax, label: 'time t  (s)' },
    y: { min: 0, max: 2 * ST.c0 * 1.05, label: 'concentration  (M)' },
    z: { min: -0.5, max: 2.5, tickValues: [0, 1, 2], tickFormat: i => SPECIES[i].name },
    curves: SPECIES.map((s, i) => ({ points: Array.from({ length: 201 }, (_, j) => { const x = ST.tMax * j / 200; return [x, s.c(x), i]; }), color: s.color, width: 1.1, curtain: 0.16 })),
    segs: SPECIES.map((s, i) => ({ a: [t - ext, s.c(t) - s.d(t) * ext, i], b: [t + ext, s.c(t) + s.d(t) * ext, i], color: '--text', width: 1.2 })),
    points: SPECIES.map((s, i) => ({ at: [t, s.c(t), i], color: s.color })),
    planes: [{ x: t, color: '--text-muted', opacity: 0.08 }],
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
