// Module 4: osmosis across a semipermeable membrane, osmotic pressure Π = iMRT, reverse osmosis,
// and a red blood cell in the same solution.

import { cssColor } from '../assets/plot.js';
import { sig } from '../assets/format.js';

const $ = id => document.getElementById(id);
const R = 8.314, INSIDE = 0.30;   // red blood cell interior: about 0.30 mol of particles per litre
const cIn = $('os-c'), TIn = $('os-T'), PaIn = $('os-Pa');
let i = 1;
const cv = $('os-box'), ctx = cv.getContext('2d');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let visible = true, crossR = 0, crossL = 0, movers = [];

const state = () => {
  const c = +cIn.value, T = +TIn.value + 273.15, Pa = +PaIn.value;          // M, K, bar
  const Pi = i * c * 1000 * R * T;                                          // Pa
  return { c, T, Pa, Pi, piBar: Pi / 1e5, drive: Pi / 1e5 - Pa };
};

// background molecules (fixed jiggling positions)
const rnd = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const WATER = [...Array(70)].map(() => [rnd(), rnd(), rnd() * 6.28]);
const SOLUTE = [...Array(30)].map(() => [rnd(), rnd(), rnd() * 6.28]);

function draw(now) {
  const w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
  const dpr = window.devicePixelRatio || 1;
  if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  const s = state(), t = reduced ? 0 : now / 1000;
  const top = h * 0.2, bot = h * 0.95, mid = w * 0.5, L = w * 0.04, Rt = w * 0.96;
  const cW = cssColor('--c1'), cS = cssColor('--c0'), txt = cssColor('--text'), muted = cssColor('--text-muted');
  ctx.fillStyle = cssColor('--accent-soft'); ctx.fillRect(L, top, Rt - L, bot - top);
  // walls and membrane
  ctx.strokeStyle = txt; ctx.lineWidth = 2;
  ctx.strokeRect(L, top, Rt - L, bot - top);
  ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(mid, top); ctx.lineTo(mid, bot); ctx.stroke(); ctx.setLineDash([]);
  // piston on the solution side
  const pistH = Math.max(4, Math.min(16, 4 + s.Pa / 4));
  ctx.fillStyle = muted; ctx.fillRect(mid + 3, top - pistH, Rt - mid - 6, pistH);
  if (s.Pa > 0.05) {
    ctx.strokeStyle = txt; ctx.fillStyle = txt; ctx.lineWidth = 2;
    const ax = (mid + Rt) / 2; ctx.beginPath(); ctx.moveTo(ax, top - pistH - 26); ctx.lineTo(ax, top - pistH - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax - 6, top - pistH - 10); ctx.lineTo(ax, top - pistH - 2); ctx.lineTo(ax + 6, top - pistH - 10); ctx.fill();
  }
  const font = getComputedStyle(document.body).fontFamily;
  ctx.font = `12px ${font}`; ctx.fillStyle = muted; ctx.textAlign = 'center';
  ctx.fillText('pure water', (L + mid) / 2, top - 6);
  ctx.fillText(s.Pa > 0.05 ? `solution, ${s.Pa.toFixed(1)} bar applied` : 'solution', (mid + Rt) / 2 + (s.Pa > 0.05 ? 0 : 0), top - pistH - 30 > 10 ? top - pistH - 30 : 12);
  const r = Math.max(2.5, w * 0.007);
  for (const [x, y, p] of WATER) {
    const px = L + 8 + x * (Rt - L - 16) + 3 * Math.sin(2 * t + p), py = top + 8 + y * (bot - top - 16) + 3 * Math.cos(1.7 * t + p);
    if (Math.abs(px - mid) < 4) continue;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fillStyle = cW; ctx.fill();
  }
  const nS = Math.min(30, Math.round(s.c * i * 28));
  for (let k = 0; k < nS; k++) {
    const [x, y, p] = SOLUTE[k];
    const px = mid + 10 + x * (Rt - mid - 20) + 2 * Math.sin(1.1 * t + p), py = top + 10 + y * (bot - top - 20) + 2 * Math.cos(t + p);
    ctx.beginPath(); ctx.arc(px, py, r * 1.9, 0, Math.PI * 2); ctx.fillStyle = cS; ctx.fill();
  }
  for (const m of movers) {
    ctx.beginPath(); ctx.arc(mid + m.x * w * 0.12, top + m.y * (bot - top), r * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = cW; ctx.fill(); ctx.strokeStyle = txt; ctx.lineWidth = 1; ctx.stroke();
  }
  // net-flow arrow
  if (Math.abs(s.drive) > 0.05 * Math.max(1, s.piBar)) {
    const dir = Math.sign(s.drive), y = bot - 14, len = Math.min(w * 0.18, 20 + Math.abs(s.drive) * 3);
    ctx.strokeStyle = cssColor('--accent'); ctx.fillStyle = cssColor('--accent'); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(mid - dir * len / 2, y); ctx.lineTo(mid + dir * len / 2, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mid + dir * len / 2 + dir * 6, y); ctx.lineTo(mid + dir * len / 2 - dir * 4, y - 6); ctx.lineTo(mid + dir * len / 2 - dir * 4, y + 6); ctx.fill();
  }
}

function tick() {
  const s = state();
  const bias = Math.max(-0.9, Math.min(0.9, s.drive / 15));
  const base = 0.05;
  if (Math.random() < base * (1 + bias)) { movers.push({ x: -1, y: 0.1 + 0.8 * Math.random(), dir: 1 }); crossR++; }
  if (Math.random() < base * (1 - bias)) { movers.push({ x: 1, y: 0.1 + 0.8 * Math.random(), dir: -1 }); crossL++; }
  for (const m of movers) m.x += m.dir * 0.04;
  movers = movers.filter(m => Math.abs(m.x) <= 1.05);
}

function readout() {
  const s = state();
  $('os-c-out').textContent = `${s.c.toFixed(3)} M`;
  $('os-T-out').textContent = `${(+TIn.value).toFixed(0)} °C`;
  $('os-Pa-out').textContent = `${s.Pa.toFixed(1)} bar`;
  const h = s.Pi / (1000 * 9.81);
  $('os-readout').innerHTML =
    `<tr><td>Π = i·M·R·T</td><td class="num">${i} × ${(s.c * 1000).toFixed(0)} mol/m³ × 8.314 J mol⁻¹ K⁻¹ × ${s.T.toFixed(2)} K = ${sig(s.Pi / 1000, 3)} kPa</td></tr>` +
    `<tr><td>in other units</td><td class="num">${sig(s.Pi / 101325, 3)} atm = ${sig(s.piBar, 3)} bar</td></tr>` +
    `<tr><td>water column it can hold up</td><td class="num">${sig(h, 3)} m</td></tr>` +
    `<tr><td>molecules crossed (this view)</td><td class="num">into the solution ${crossR}, out of it ${crossL}</td></tr>`;
  let note;
  if (s.c === 0) note = 'Both sides are pure water. Molecules cross both ways at the same rate: no net flow.';
  else if (Math.abs(s.drive) <= 0.05 * Math.max(1, s.piBar)) note = `The applied pressure equals the osmotic pressure (${sig(s.piBar, 3)} bar). Water crosses both ways at the same rate: no net flow.`;
  else if (s.drive > 0) note = `Osmosis: net flow of water into the solution. To stop it you would have to push with Π = ${sig(s.piBar, 3)} bar, enough to hold up a column of water ${h >= 10 ? Math.round(h) : h.toFixed(1)} m high.`;
  else note = `Reverse osmosis: you push harder than Π = ${sig(s.piBar, 3)} bar, so water is squeezed out of the solution through the membrane, leaving the solute behind. Desalination plants do this with seawater.`;
  $('os-note').textContent = note;
  drawCell();
}

/* ---------- red blood cell ---------- */
const cell = $('os-cell'), cctx = cell.getContext('2d');
function drawCell() {
  const w = cell.clientWidth, h = cell.clientHeight; if (!w) return;
  const dpr = window.devicePixelRatio || 1;
  if (cell.width !== Math.round(w * dpr)) { cell.width = Math.round(w * dpr); cell.height = Math.round(h * dpr); }
  cctx.setTransform(dpr, 0, 0, dpr, 0, 0); cctx.clearRect(0, 0, w, h);
  const out = i * +cIn.value;                         // mol of particles per litre outside (ideal i)
  const ratio = INSIDE / Math.max(0.01, out);         // volume relative to normal (simple model)
  const burst = ratio > 1.7;
  const red = cssColor('--bad'), cx = w / 2, cy = h / 2, R0 = Math.min(w, h) * 0.3;
  const sc = Math.pow(Math.min(ratio, 1.7), 1 / 3);
  cctx.lineWidth = 3; cctx.strokeStyle = red; cctx.fillStyle = red + '33';
  cctx.beginPath();
  if (burst) {
    for (let k = 0; k < 9; k++) { const a0 = k / 9 * 2 * Math.PI; cctx.moveTo(cx + R0 * 1.25 * Math.cos(a0), cy + R0 * 1.25 * Math.sin(a0)); cctx.arc(cx, cy, R0 * 1.25, a0, a0 + 0.45); }
    cctx.stroke();
  } else {
    const rx = R0 * (ratio >= 1 ? sc : Math.pow(ratio, 0.5)) * 1.3, ry = R0 * (ratio >= 1 ? sc * (0.75 + 0.25 * Math.min(1, (ratio - 1) / 0.7)) : Math.pow(ratio, 0.5)) * 0.9;
    const spikes = ratio < 0.85;
    for (let k = 0; k <= 72; k++) {
      const a = k / 72 * 2 * Math.PI, bump = spikes ? 1 + 0.1 * Math.max(0, Math.sin(12 * a)) : 1;
      const x = cx + rx * bump * Math.cos(a), y = cy + ry * bump * Math.sin(a);
      k ? cctx.lineTo(x, y) : cctx.moveTo(x, y);
    }
    cctx.closePath(); cctx.fill(); cctx.stroke();
    if (ratio < 1.15 && ratio > 0.85) {   // biconcave: paler centre
      cctx.beginPath(); cctx.ellipse(cx, cy, rx * 0.4, ry * 0.4, 0, 0, Math.PI * 2); cctx.fillStyle = red + '22'; cctx.fill();
    }
  }
  let txt;
  if (Math.abs(out - INSIDE) <= 0.03) txt = `Isotonic: ${out.toFixed(2)} mol/L of particles outside, like inside. No net flow; the cell keeps its shape.`;
  else if (out < INSIDE) txt = burst ? `Strongly hypotonic (${out === 0 ? 'pure water' : out.toFixed(2) + ' mol/L'} outside): water rushed in and the cell burst (hemolysis).`
    : `Hypotonic (${out.toFixed(2)} mol/L outside): water flows in and the cell swells.`;
  else txt = `Hypertonic (${out.toFixed(2)} mol/L outside): water flows out and the cell shrivels (crenation).`;
  $('os-cell-note').textContent = txt;
}

function loop(now) {
  if (!visible) return;
  if (!reduced) tick();
  draw(now);
  if (!reduced) requestAnimationFrame(loop);
}
function sync() { readout(); draw(performance.now()); }

for (const el of [cIn, TIn, PaIn]) el.addEventListener('input', () => { crossR = crossL = 0; sync(); });
for (const b of $('os-i').querySelectorAll('button')) b.addEventListener('click', () => {
  i = +b.dataset.v; $('os-i').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
  crossR = crossL = 0; sync();
});
$('os-presets').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  cIn.value = b.dataset.c; PaIn.value = 0; i = +b.dataset.i;
  $('os-i').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === b.dataset.i));
  crossR = crossL = 0; sync();
});
new IntersectionObserver(es => { const was = visible; visible = es[0].isIntersecting; if (visible && !was) requestAnimationFrame(loop); }).observe(cv);
new ResizeObserver(() => { draw(performance.now()); drawCell(); }).observe(cv);
setInterval(() => { if (visible && !reduced) readout(); }, 500);
sync();
requestAnimationFrame(loop);
