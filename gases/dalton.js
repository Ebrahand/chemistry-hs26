// Module 4: a mixture of N₂, O₂ and Ar in one box (V = 24.5 L, 25 °C). Partial pressures and mole fractions.

import { cssColor } from '../assets/plot.js';
import { R } from './data.js';

const $ = id => document.getElementById(id);
const V = 24.5, T = 298.15, PER_MOL = 60;
const SP = [
  { id: 'dal-a', f: 'N₂', col: '--c1' },
  { id: 'dal-b', f: 'O₂', col: '--c0' },
  { id: 'dal-c', f: 'Ar', col: '--c2' },
];
const canvas = $('dal-sim'), ctx = canvas.getContext('2d');
const dots = SP.map(() => []);   // per species: [{x, y, vx, vy}] in unit-square coordinates

function sync() {
  SP.forEach((s, i) => {
    const N = Math.round(+$(s.id).value * PER_MOL), list = dots[i];
    while (list.length < N) {
      const a = Math.random() * Math.PI * 2, sp = 0.12 + Math.random() * 0.12;
      list.push({ x: Math.random(), y: Math.random(), vx: sp * Math.cos(a), vy: sp * Math.sin(a) });
    }
    list.length = N;
  });
}

function draw() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w) return;
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  SP.forEach((s, i) => {
    ctx.fillStyle = cssColor(s.col);
    for (const d of dots[i]) { ctx.beginPath(); ctx.arc(4 + d.x * (w - 8), 4 + d.y * (h - 8), 3.2, 0, Math.PI * 2); ctx.fill(); }
  });
}
let raf = 0, last = 0, visible = false;
function loop(t) {
  if (!visible) { raf = 0; return; }
  const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
  for (const list of dots) for (const d of list) {
    d.x += d.vx * dt; d.y += d.vy * dt;
    if (d.x < 0) { d.x = 0; d.vx = Math.abs(d.vx); } if (d.x > 1) { d.x = 1; d.vx = -Math.abs(d.vx); }
    if (d.y < 0) { d.y = 0; d.vy = Math.abs(d.vy); } if (d.y > 1) { d.y = 1; d.vy = -Math.abs(d.vy); }
  }
  draw();
  raf = requestAnimationFrame(loop);
}
new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) { last = 0; raf = requestAnimationFrame(loop); } }).observe(canvas);
new ResizeObserver(draw).observe(canvas);

function render() {
  sync();
  const n = SP.map(s => +$(s.id).value);
  const ntot = n.reduce((a, b) => a + b, 0);
  const Pi = n.map(x => (x * R * T) / V), Ptot = Pi.reduce((a, b) => a + b, 0);
  SP.forEach((s, i) => { $(`${s.id}-out`).textContent = `${n[i].toFixed(2)} mol`; });
  // stacked bar
  const W = 520, H = 56, max = (6 * R * T) / V;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  let x = 0;
  SP.forEach((sp, i) => {
    const w = (Pi[i] / max) * (W - 90);
    if (w > 0) s += `<rect x="${x}" y="8" width="${w}" height="26" fill="var(${sp.col})"/>`;
    if (w > 34) s += `<text x="${x + w / 2}" y="26" text-anchor="middle" font-size="11" fill="var(--bg)">${sp.f}</text>`;
    x += w;
  });
  s += `<text x="${x + 6}" y="26" font-size="13" font-weight="700" fill="var(--text)">${Ptot.toFixed(1)} kPa</text>`;
  s += `<text x="0" y="50" font-size="11" fill="var(--text-muted)">P<tspan baseline-shift="sub" font-size="8">total</tspan> = P(N₂) + P(O₂) + P(Ar)</text>`;
  $('dal-bar').innerHTML = s + '</svg>';
  $('dal-table').innerHTML = SP.map((sp, i) =>
    `<tr><td><span class="swatch" style="background:var(${sp.col})"></span> ${sp.f}</td><td class="num">${n[i].toFixed(2)}</td><td class="num">${ntot ? (n[i] / ntot).toFixed(3) : '—'}</td><td class="num">${Pi[i].toFixed(1)}</td></tr>`
  ).join('') + `<tr><td><strong>total</strong></td><td class="num">${ntot.toFixed(2)}</td><td class="num">${ntot ? '1.000' : '—'}</td><td class="num"><strong>${Ptot.toFixed(1)}</strong></td></tr>`;
  const air = Math.abs(n[0] - 0.78) < 0.03 && Math.abs(n[1] - 0.21) < 0.03 && n[2] < 0.05;
  $('dal-note').innerHTML = !ntot ? 'An empty box: no molecules, no pressure.'
    : `Each gas pushes on the walls as if it were alone: P(O₂) = X(O₂) × P<sub>total</sub> = ${ntot ? (n[1] / ntot).toFixed(3) : 0} × ${Ptot.toFixed(1)} kPa = ${Pi[1].toFixed(1)} kPa. ` +
      (air ? 'These are the proportions of dry air at 1 atm.' : 'Add argon: the pressures of N₂ and O₂ do not change, only the total grows.');
  if (!raf) draw();
}
SP.forEach(s => $(s.id).addEventListener('input', render));
render();
