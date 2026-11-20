// Module 2: gas in a cylinder with a piston. Boyle (change V at fixed n, T), Charles (change T at fixed n, P),
// Avogadro (change n at fixed P, T). Dots move with speeds ∝ √T; the numbers come from PV = nRT.

import { Plot, cssColor } from '../assets/plot.js';
import { R } from './data.js';

const $ = id => document.getElementById(id);
const canvas = $('gl-sim'), ctx = canvas.getContext('2d');
const plot = new Plot($('gl-plot'));
const Vin = $('gl-V'), Tin = $('gl-T'), nin = $('gl-n');
const VMAX = 60, P0 = 100, DOTS_PER_MOL = 40;

let mode = 'boyle';
let st = { n: 1, T: 300, V: 24.94 };
const P = () => (st.n * R * st.T) / st.V;   // kPa

/* ---------- particles ---------- */
let px = [], py = [], vx = [], vy = [], Tdots = st.T;
function gauss() { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); }
const SIG = 60;   // px/s per component at 300 K
function addDot() {
  const g = geom();
  px.push(g.x0 + 4 + Math.random() * (g.x1 - g.x0 - 8));
  py.push(g.top + 4 + Math.random() * (g.bot - g.top - 8));
  const s = SIG * Math.sqrt(st.T / 300);
  vx.push(s * gauss()); vy.push(s * gauss());
}
function syncCount() {
  const N = Math.round(st.n * DOTS_PER_MOL);
  while (px.length < N) addDot();
  px.length = py.length = vx.length = vy.length = Math.min(px.length, N);
}
function syncTemp() {
  const f = Math.sqrt(st.T / Tdots);
  for (let i = 0; i < vx.length; i++) { vx[i] *= f; vy[i] *= f; }
  Tdots = st.T;
}
function geom() {
  const w = canvas.clientWidth || 300, h = canvas.clientHeight || 400;
  const x0 = 14, x1 = w - 14, bot = h - 12, usable = h - 64;
  return { w, h, x0, x1, bot, top: bot - (st.V / VMAX) * usable };
}

function step(dt) {
  const g = geom(), r = 3.5;
  for (let i = 0; i < px.length; i++) {
    px[i] += vx[i] * dt; py[i] += vy[i] * dt;
    if (px[i] < g.x0 + r) { px[i] = g.x0 + r; vx[i] = Math.abs(vx[i]); }
    if (px[i] > g.x1 - r) { px[i] = g.x1 - r; vx[i] = -Math.abs(vx[i]); }
    if (py[i] > g.bot - r) { py[i] = g.bot - r; vy[i] = -Math.abs(vy[i]); }
    if (py[i] < g.top + r) { py[i] = g.top + r; vy[i] = Math.abs(vy[i]); }
  }
}

function draw() {
  const g = geom();
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(g.w * dpr)) { canvas.width = Math.round(g.w * dpr); canvas.height = Math.round(g.h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, g.w, g.h);
  const text = cssColor('--text'), muted = cssColor('--text-muted');
  // cylinder walls
  ctx.strokeStyle = text; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(g.x0 - 2, 34); ctx.lineTo(g.x0 - 2, g.bot + 2); ctx.lineTo(g.x1 + 2, g.bot + 2); ctx.lineTo(g.x1 + 2, 34); ctx.stroke();
  // piston and rod
  ctx.fillStyle = muted;
  ctx.fillRect(g.x0, g.top - 10, g.x1 - g.x0, 10);
  ctx.fillRect(g.w / 2 - 3, 0, 6, g.top - 10);
  // dots
  ctx.fillStyle = cssColor('--c1');
  for (let i = 0; i < px.length; i++) { ctx.beginPath(); ctx.arc(px[i], py[i], 3.5, 0, Math.PI * 2); ctx.fill(); }
  // labels
  ctx.fillStyle = text; ctx.font = '600 13px ' + getComputedStyle(document.body).fontFamily;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`P = ${P().toFixed(0)} kPa`, 8, 6);
  ctx.textAlign = 'right';
  ctx.fillText(`${(st.T - 273.15).toFixed(0)} °C`, g.w - 8, 6);
}

let playing = true, raf = 0, last = 0, visible = true;
function loop(t) {
  if (!playing || !visible) { raf = 0; return; }
  const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
  step(dt); draw();
  raf = requestAnimationFrame(loop);
}
function kick() { if (playing && visible && !raf) { last = 0; raf = requestAnimationFrame(loop); } }
$('gl-play').addEventListener('click', () => { playing = !playing; $('gl-play').textContent = playing ? '⏸ Pause' : '▶ Play'; kick(); if (!playing) draw(); });
new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); }).observe(canvas);
new ResizeObserver(() => draw()).observe(canvas);

/* ---------- controls and plot ---------- */
function setMode(m) {
  mode = m;
  $('gl-mode').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
  st = { n: 1, T: 300, V: (1 * R * 300) / P0 };
  Vin.value = st.V; Tin.value = st.T; nin.value = st.n;
  Vin.disabled = m !== 'boyle'; Tin.disabled = m !== 'charles'; nin.disabled = m !== 'avogadro';
  ['V', 'T', 'n'].forEach(k => { $(`gl-${k}-c`).style.opacity = $(`gl-${k}`).disabled ? 0.55 : 1; });
  syncCount(); syncTemp();
  render();
}
function render() {
  const p = P();
  $('gl-V-out').textContent = `${st.V.toFixed(1)} L`;
  $('gl-T-out').textContent = `${st.T.toFixed(0)} K = ${(st.T - 273.15).toFixed(0)} °C`;
  $('gl-n-out').textContent = `${st.n.toFixed(2)} mol`;
  let spec, note;
  if (mode === 'boyle') {
    const k = st.n * R * st.T, pts = [];
    for (let V = 4; V <= VMAX; V += 0.25) pts.push([V, k / V]);
    spec = { x: { min: 0, max: VMAX, label: 'V (L)' }, y: { min: 0, max: k / 5 * 1.05, label: 'P (kPa)' }, series: [{ points: pts, color: '--c0', width: 2 }], markers: [{ x: st.V, y: p, color: '--c0', r: 6 }] };
    note = `n and T fixed. P × V = ${p.toFixed(1)} kPa × ${st.V.toFixed(1)} L = <strong>${(p * st.V).toFixed(0)} kPa L</strong>, whatever the volume. Halve V and the molecules hit the walls twice as often: P doubles.`;
  } else if (mode === 'charles') {
    const k = (st.n * R) / P0, real = [], extra = [];
    for (let t = -273.15; t <= 330; t += 2) (t + 273.15 < 100 ? extra : real).push([t, k * (t + 273.15)]);
    real.unshift(extra[extra.length - 1]);
    spec = { x: { min: -300, max: 330, label: 'T (°C)' }, y: { min: 0, max: 55, label: 'V (L)' },
      series: [{ points: extra, color: '--c1', dash: [5, 4] }, { points: real, color: '--c1', width: 2 }],
      vlines: [{ x: -273.15, color: '--plot-axis', dash: [3, 3] }], markers: [{ x: st.T - 273.15, y: st.V, color: '--c1', r: 6 }],
      texts: [{ x: -273.15, y: 51, text: '−273.15 °C = 0 K', dx: 6, align: 'left', color: '--text-muted' }] };
    note = `n and P = ${P0} kPa fixed. V / T = ${st.V.toFixed(1)} L / ${st.T.toFixed(0)} K = <strong>${(st.V / st.T).toFixed(4)} L/K</strong>. Hotter molecules hit harder, so the piston moves out until the pressure is ${P0} kPa again. The dashed part is extrapolated: every real gas liquefies before it gets there.`;
  } else {
    const k = (R * st.T) / P0;
    spec = { x: { min: 0, max: 2.1, label: 'n (mol)' }, y: { min: 0, max: 55, label: 'V (L)' }, series: [{ points: [[0, 0], [2.1, 2.1 * k]], color: '--c2', width: 2 }], markers: [{ x: st.n, y: st.V, color: '--c2', r: 6 }] };
    note = `T = ${st.T} K and P = ${P0} kPa fixed. V / n = <strong>${(st.V / st.n).toFixed(2)} L/mol</strong>, the same for any gas at this T and P (at 0 °C and 1 atm it would be 22.41 L/mol).`;
  }
  plot.draw(spec);
  $('gl-note').innerHTML = note;
  if (!playing || !visible) draw();
}
$('gl-mode').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.m); });
Vin.addEventListener('input', () => { st.V = +Vin.value; render(); });
Tin.addEventListener('input', () => { st.T = +Tin.value; st.V = (st.n * R * st.T) / P0; Vin.value = st.V; syncTemp(); render(); });
nin.addEventListener('input', () => { st.n = +nin.value; st.V = (st.n * R * st.T) / P0; Vin.value = st.V; syncCount(); render(); });
setMode('boyle');
kick();
