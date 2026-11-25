// Module 1: collision model. Atoms A and molecules BC move in a 3D box (hard spheres, elastic collisions); drag to rotate.
// An A–BC collision "reacts" if its energy along the line of centres is at least Ea and A hits the B end of BC.

import { sig } from '../assets/format.js';
import { View3D, rgb, css, ball } from './view3d.js';

const $ = id => document.getElementById(id);
const cv = $('col-box');
const tIn = $('col-T'), eIn = $('col-Ea'), oIn = $('col-orient');

const R = 8.314;
const BX = 1.6, BY = 1, BZ = 1;      // box size (box heights); centred on the origin
const NA = 30, NBC = 30;
const RA = 0.038, RBC = 0.064;       // sphere radii (box heights)
const MA = 1, MBC = 2;
const KT300 = 0.5 * MA * 0.45 * 0.45;  // kT in sim units at 300 K (speeds of a few tenths of a box height per second)
const kT = T => KT300 * T / 300;
const TO_JMOL = R * 300 / KT300;     // sim energy → J/mol (so that kT_sim corresponds to RT)
const COS_ORIENT = 0.5;              // A must hit within ±60° of the B end: a cap covering 1/4 of the sphere

let P = [], flashes = [], T = +tIn.value;
let running = !window.matchMedia('(prefers-reduced-motion: reduce)').matches, visible = true, last = 0;
const stats = { t: 0, coll: 0, hot: 0, react: 0, hotWrong: 0 };

function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function randDir() {
  const z = 2 * Math.random() - 1, t = 2 * Math.PI * Math.random(), s = Math.sqrt(1 - z * z);
  return [s * Math.cos(t), s * Math.sin(t), z];
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function init() {
  P = [];
  const nx = 6, ny = 4, nz = 4, slots = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++)
    slots.push([((i + 0.5) / nx - 0.5) * BX, ((j + 0.5) / ny - 0.5) * BY, ((k + 0.5) / nz - 0.5) * BZ]);
  slots.sort(() => Math.random() - 0.5);
  for (let k = 0; k < NA + NBC; k++) {
    const isA = k < NA, m = isA ? MA : MBC, s = Math.sqrt(kT(T) / m), [x, y, z] = slots[k];
    const p = { A: isA, x, y, z, vx: s * gauss(), vy: s * gauss(), vz: s * gauss(), m, r: isA ? RA : RBC };
    if (!isA) {
      // axis e of the molecule and an angular velocity perpendicular to it
      p.e = randDir();
      const k2 = cross(p.e, randDir()), kl = Math.hypot(...k2) || 1;
      p.k = k2.map(c => c / kl); p.om = 0.6 + Math.random();
    }
    P.push(p);
  }
  // with only 60 particles the random sample can be noticeably hotter or colder: fix the total energy to (3/2)·N·kT exactly
  const ke = P.reduce((s, p) => s + 0.5 * p.m * (p.vx * p.vx + p.vy * p.vy + p.vz * p.vz), 0), f = Math.sqrt(1.5 * P.length * kT(T) / ke);
  for (const p of P) { p.vx *= f; p.vy *= f; p.vz *= f; }
}

function resetStats() { Object.assign(stats, { t: 0, coll: 0, hot: 0, react: 0, hotWrong: 0 }); }

function wall(p, c, v, half) {
  if (p[c] < -half + p.r) { p[c] = -half + p.r; p[v] = Math.abs(p[v]); }
  if (p[c] > half - p.r) { p[c] = half - p.r; p[v] = -Math.abs(p[v]); }
}

function step(dt) {
  const Ea = +eIn.value * 1000, orient = oIn.checked;
  for (const p of P) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (!p.A) {
      // rotate e about k (k ⟂ e, so e stays a unit vector)
      const a = p.om * dt, c = Math.cos(a), s = Math.sin(a), kx = cross(p.k, p.e);
      p.e = p.e.map((x, i) => x * c + kx[i] * s);
    }
    wall(p, 'x', 'vx', BX / 2); wall(p, 'y', 'vy', BY / 2); wall(p, 'z', 'vz', BZ / 2);
  }
  for (let i = 0; i < P.length; i++) {
    for (let j = i + 1; j < P.length; j++) {
      const a = P[i], b = P[j];
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d2 = dx * dx + dy * dy + dz * dz, rr = a.r + b.r;
      if (d2 >= rr * rr || d2 === 0) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, nz = dz / d;
      const vn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny + (a.vz - b.vz) * nz;     // > 0: approaching
      const ov = (rr - d) / 2;
      a.x -= nx * ov; a.y -= ny * ov; a.z -= nz * ov; b.x += nx * ov; b.y += ny * ov; b.z += nz * ov;
      if (vn <= 0) continue;
      const mu = a.m * b.m / (a.m + b.m), J = 2 * mu * vn;
      a.vx -= J / a.m * nx; a.vy -= J / a.m * ny; a.vz -= J / a.m * nz;
      b.vx += J / b.m * nx; b.vy += J / b.m * ny; b.vz += J / b.m * nz;
      if (a.A === b.A) continue;                               // only A–BC collisions count
      const atom = a.A ? a : b, mol = a.A ? b : a;
      const u = [atom.x - mol.x, atom.y - mol.y, atom.z - mol.z], ul = Math.hypot(...u) || 1;
      const right = dot(u, mol.e) / ul >= COS_ORIENT;
      const E = 0.5 * mu * vn * vn * TO_JMOL;
      stats.coll++;
      const hot = E >= Ea;
      if (hot) stats.hot++;
      const at = [mol.x + u[0] / ul * mol.r, mol.y + u[1] / ul * mol.r, mol.z + u[2] / ul * mol.r];
      if (hot && (right || !orient)) { stats.react++; flashes.push({ p: at, t: 0, c: '--good' }); }
      else if (hot) { stats.hotWrong++; flashes.push({ p: at, t: 0, c: '--c3' }); }
    }
  }
  stats.t += dt;
}

const EDGES = [];
{
  const c = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) c.push([x * BX / 2, y * BY / 2, z * BZ / 2]);
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
    const n = c[i].reduce((s, x, k) => s + (x !== c[j][k]), 0);
    if (n === 1) EDGES.push([c[i], c[j]]);
  }
}

function draw(view) {
  const { ctx, w, h } = view.frame();
  if (!w) return;
  const vp = { cx: w / 2, cy: h / 2, S: Math.min(w / 2.05, h / 1.45), D: 4.5 };
  const cA = rgb('--c0'), cB = rgb('--c1'), cC = rgb('--cB'), edge = rgb('--plot-axis');
  const items = [];
  // box edges: split each into pieces so that particles in front of or behind an edge are drawn in the right order
  for (const [p, q] of EDGES) {
    for (let s = 0; s < 4; s++) {
      const a = p.map((x, k) => x + (q[k] - x) * s / 4), b = p.map((x, k) => x + (q[k] - x) * (s + 1) / 4);
      const A = view.project(a, vp), B = view.project(b, vp);
      items.push({ d: (A[2] + B[2]) / 2, fn: c => { c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.strokeStyle = css(edge, 0.55); c.lineWidth = 1.2; c.stroke(); } });
    }
  }
  for (const p of P) {
    if (p.A) {
      const [x, y, d, s] = view.project([p.x, p.y, p.z], vp);
      items.push({ d, fn: c => ball(c, x, y, p.r * s, cA) });
    } else {
      const off = p.r * 0.42, rr = p.r * 0.6;
      for (const [sgn, col] of [[1, cB], [-1, cC]]) {
        const [x, y, d, s] = view.project([p.x + sgn * off * p.e[0], p.y + sgn * off * p.e[1], p.z + sgn * off * p.e[2]], vp);
        items.push({ d, fn: c => ball(c, x, y, rr * s, col) });
      }
    }
  }
  view.paint(items);
  flashes = flashes.filter(f => f.t < 0.6);
  for (const f of flashes) {
    const [x, y, , s] = view.project(f.p, vp);
    ctx.beginPath(); ctx.arc(x, y, (0.03 + f.t * 0.12) * s, 0, 2 * Math.PI);
    ctx.strokeStyle = css(rgb(f.c), 1 - f.t / 0.6); ctx.lineWidth = 3; ctx.stroke();
  }
}

const view = new View3D(cv, draw, { az: -1.25, el: 0.38 });

const pc = x => (x >= 10 ? x.toFixed(0) : sig(x, 2));
const pct = (n, d) => (d ? `${pc(100 * n / d)} %` : '—');
let lastReadout = 0;
function readout(force) {
  if (!force && performance.now() - lastReadout < 400) return;
  lastReadout = performance.now();
  const Ea = +eIn.value * 1000, f = Math.exp(-Ea / (R * T)), orient = oIn.checked;
  const rows = [
    ['Time counted', `${stats.t.toFixed(0)} s`],
    ['A–BC collisions per second', stats.t > 0.5 ? sig(stats.coll / stats.t, 3) : '—'],
    ['Collisions with E ≥ E<sub>a</sub>', `${pct(stats.hot, stats.coll)} <span class="muted">(${stats.hot} of ${stats.coll})</span>`],
    ['Brown: f = e<sup>−E<sub>a</sub>/RT</sup>', `${pc(100 * f)} %`],
    ['… of those, hit on the B end', orient ? pct(stats.react, stats.hot) : 'not needed'],
    ['Reactions per second', stats.t > 0.5 ? sig(stats.react / stats.t, 2) : '—'],
  ];
  $('col-readout').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal">${b}</td></tr>`).join('');
  let note;
  if (Ea === 0) note = orient ? 'With E<sub>a</sub> = 0 every collision is hard enough. Only the orientation filters them now: about one in four collisions hits the B end.'
    : 'No energy barrier and no orientation rule: every A–BC collision reacts. Real reactions are never like this.';
  else note = `At ${T} K, RT = ${(R * T / 1000).toFixed(2)} kJ/mol. E<sub>a</sub> is ${(Ea / (R * T)).toFixed(1)} times RT, so only about ${pc(100 * f)} % of the collisions are hard enough` +
    (orient ? ', and of those only about one in four hits the right end (green flashes; pink ones were hard enough but hit the C end).' : ' (green flashes).');
  $('col-note').innerHTML = note;
}

function loop(t) {
  const dt = Math.min(1 / 30, (t - last) / 1000 || 0); last = t;
  if (visible) {
    if (running) { const n = 4; for (let i = 0; i < n; i++) step(dt / n); for (const f of flashes) f.t += dt; }
    draw(view); readout();
  }
  requestAnimationFrame(loop);
}

function setT() {
  const Tn = +tIn.value, f = Math.sqrt(Tn / T);
  for (const p of P) { p.vx *= f; p.vy *= f; p.vz *= f; }
  T = Tn;
  $('col-T-out').textContent = `${T} K (${T - 273} °C)`;
  resetStats(); readout(true);
}
tIn.addEventListener('input', setT);
eIn.addEventListener('input', () => { $('col-Ea-out').textContent = `${(+eIn.value).toFixed(1)} kJ/mol`; resetStats(); readout(true); });
oIn.addEventListener('change', () => { resetStats(); readout(true); });
$('col-reset').addEventListener('click', () => { resetStats(); readout(true); });
$('col-pause').addEventListener('click', () => { running = !running; $('col-pause').textContent = running ? 'Pause' : 'Run'; });
new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(cv);

$('col-T-out').textContent = `${T} K (${T - 273} °C)`;
$('col-Ea-out').textContent = `${(+eIn.value).toFixed(1)} kJ/mol`;
$('col-pause').textContent = running ? 'Pause' : 'Run';
init();
readout(true);
requestAnimationFrame(loop);
