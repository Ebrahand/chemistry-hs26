// Module 1: toy 2D molecular dynamics. Lennard-Jones particles (reduced units: σ = 1, m = 1, k_B = 1)
// in a box with weak gravity and a velocity-rescaling thermostat. Qualitative only.

import { cssColor } from '../assets/plot.js';

const N = 90, W = 28, H = 17.5, RC = 2.5, RC2 = RC * RC, DT = 0.004, G = 0.08, TAU = 0.4;
const STEPS_PER_FRAME = 14;

const $ = id => document.getElementById(id);
const canvas = $('md-box'), ctx = canvas.getContext('2d');
const epsIn = $('md-eps'), TIn = $('md-T');

let x, y, vx, vy, fx, fy, nb, playing = false, raf = 0, visible = true, started = false;

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function reset() {
  const r = rng(7);
  x = new Float64Array(N); y = new Float64Array(N); vx = new Float64Array(N); vy = new Float64Array(N);
  fx = new Float64Array(N); fy = new Float64Array(N); nb = new Uint8Array(N);
  // start as a close-packed layer on the floor; the temperature then decides what it becomes
  const a = 1.12, cols = Math.floor((W - 1) / a);
  const T = +TIn.value;
  for (let i = 0; i < N; i++) {
    const row = Math.floor(i / cols);
    x[i] = 0.6 + (i % cols) * a + (row % 2) * a / 2; y[i] = 0.6 + row * a * 0.866;
    vx[i] = (r() - 0.5) * 2 * Math.sqrt(3 * T); vy[i] = (r() - 0.5) * 2 * Math.sqrt(3 * T);
  }
  forces(+epsIn.value);
  draw();
}

function forces(eps) {
  fx.fill(0); fy.fill(0); nb.fill(0);
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const dx = x[i] - x[j], dy = y[i] - y[j];
      let r2 = dx * dx + dy * dy;
      if (r2 > RC2) continue;
      if (r2 < 2.25) { nb[i]++; nb[j]++; }          // neighbour within 1.5 σ
      if (r2 < 0.64) r2 = 0.64;                       // keep overlapping pairs from exploding
      const ir2 = 1 / r2, ir6 = ir2 * ir2 * ir2;
      const f = 24 * eps * ir2 * ir6 * (2 * ir6 - 1);   // F/r
      fx[i] += f * dx; fy[i] += f * dy; fx[j] -= f * dx; fy[j] -= f * dy;
    }
  }
  for (let i = 0; i < N; i++) fy[i] -= G;
}

function step() {
  const eps = +epsIn.value, T0 = +TIn.value;
  for (let i = 0; i < N; i++) {
    vx[i] += 0.5 * DT * fx[i]; vy[i] += 0.5 * DT * fy[i];
    x[i] += DT * vx[i]; y[i] += DT * vy[i];
    if (x[i] < 0.5) { x[i] = 0.5; vx[i] = Math.abs(vx[i]); }
    if (x[i] > W - 0.5) { x[i] = W - 0.5; vx[i] = -Math.abs(vx[i]); }
    if (y[i] < 0.5) { y[i] = 0.5; vy[i] = Math.abs(vy[i]); }
    if (y[i] > H - 0.5) { y[i] = H - 0.5; vy[i] = -Math.abs(vy[i]); }
  }
  forces(eps);
  let ke = 0;
  for (let i = 0; i < N; i++) {
    vx[i] += 0.5 * DT * fx[i]; vy[i] += 0.5 * DT * fy[i];
    ke += 0.5 * (vx[i] * vx[i] + vy[i] * vy[i]);
  }
  const T = ke / N;   // 2D: <KE> = k_B T per particle
  const lam = Math.sqrt(Math.max(0.5, Math.min(1.5, 1 + (DT / TAU) * (T0 / Math.max(T, 1e-6) - 1))));
  for (let i = 0; i < N; i++) {
    vx[i] *= lam; vy[i] *= lam;
    const v2 = vx[i] * vx[i] + vy[i] * vy[i];
    if (v2 > 64) { const s = 8 / Math.sqrt(v2); vx[i] *= s; vy[i] *= s; }
  }
}

function draw() {
  const cw = canvas.clientWidth, chh = canvas.clientHeight;
  if (!cw) return;
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(cw * dpr)) { canvas.width = Math.round(cw * dpr); canvas.height = Math.round(chh * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, chh);
  const s = cw / W, r = 0.45 * s;
  const cL = cssColor('--c1'), cV = cssColor('--c0');
  let nVap = 0;
  for (let i = 0; i < N; i++) {
    const vap = nb[i] < 2;
    if (vap) nVap++;
    ctx.beginPath();
    ctx.arc(x[i] * s, chh - y[i] * s, r, 0, Math.PI * 2);
    ctx.fillStyle = vap ? cV : cL;
    ctx.fill();
  }
  const eps = +epsIn.value, T = +TIn.value, ratio = T / eps;
  let msg;
  if (nVap > 0.85 * N) msg = 'Almost everything is in the gas phase: the molecules move too fast for the attraction to hold them together.';
  else if (ratio < 0.33) msg = 'Kinetic energy is small compared with the attraction: the molecules settle into a regular, solid-like pattern.';
  else msg = 'A condensed phase at the bottom, with vapour above it. Molecules keep leaving and re-joining it.';
  $('md-note').textContent = started ? `${nVap} of ${N} molecules are in the vapour. ${msg}`
    : 'The molecules start as a layer on the floor. Press Start and see what this temperature does to them.';
}

function sync() {
  $('md-eps-out').textContent = (+epsIn.value).toFixed(2);
  $('md-T-out').textContent = (+TIn.value).toFixed(2);
  $('md-bar-T').style.width = Math.min(100, (+TIn.value / 1.5) * 100) + '%';
  $('md-bar-eps').style.width = Math.min(100, (+epsIn.value / 2.0) * 100) + '%';
  if (!playing) draw();
}

function loop() {
  if (!playing || !visible) { raf = 0; return; }
  for (let k = 0; k < STEPS_PER_FRAME; k++) step();
  draw();
  raf = requestAnimationFrame(loop);
}
function setPlaying(p) {
  playing = p;
  if (p) started = true;
  $('md-play').textContent = p ? '⏸ Pause' : '▶ Start';
  if (p && !raf) raf = requestAnimationFrame(loop);
}

$('md-play').addEventListener('click', () => setPlaying(!playing));
$('md-reset').addEventListener('click', () => { started = playing; reset(); });
epsIn.addEventListener('input', sync);
TIn.addEventListener('input', sync);
new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && playing && !raf) raf = requestAnimationFrame(loop); }).observe(canvas);
new ResizeObserver(() => draw()).observe(canvas);

reset();
sync();
