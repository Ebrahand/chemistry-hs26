// Module 2: Henry's law with a closed bottle (gas above water), and O2 solubility against temperature.

import { Plot, cssColor } from '../assets/plot.js';
import { sci, sig } from '../assets/format.js';

const $ = id => document.getElementById(id);
const GASES = {   // Henry's-law constants in water at 25 °C, mol L⁻¹ atm⁻¹; partial pressure in air (atm)
  co2: { f: 'CO₂', k: 3.4e-2, M: 44.01, air: 4.2e-4 },
  o2: { f: 'O₂', k: 1.3e-3, M: 32.00, air: 0.21 },
};
const RT = 0.08206 * 298.15;     // L atm mol⁻¹
const PER_ATM = 8;               // molecules drawn per atm of gas in the headspace
const Pin = $('hl-P'), cv = $('hl-box'), ctx = cv.getContext('2d');
let gas = 'co2', open = false, parts = [], frame = 0, visible = true;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const rand = (a, b) => a + Math.random() * (b - a);
const newP = state => ({
  x: rand(0.08, 0.92), y: state === 'g' ? rand(0.08, 0.46) : rand(0.55, 0.93),
  vx: rand(-1, 1), vy: rand(-1, 1), state,
});
const pressure = () => (open ? GASES[gas].air : +Pin.value);
const targets = () => {
  const P = pressure(), g = GASES[gas];
  return { nG: Math.round(PER_ATM * P), nL: Math.round(PER_ATM * P * g.k * RT) };
};
function fill() {   // jump straight to equilibrium (used when closing the bottle or switching gas)
  const { nG, nL } = targets();
  parts = [...Array(nG)].map(() => newP('g')).concat([...Array(nL)].map(() => newP('l')));
}

function step() {
  frame++;
  const { nG, nL } = targets();
  const G = parts.filter(p => p.state === 'g'), L = parts.filter(p => p.state === 'l');
  if (frame % 4 === 0) {
    if (L.length > nL) { const p = L[0]; p.state = 'b'; }                      // too much dissolved: a bubble forms
    else if (L.length < nL && G.length) {                                     // too little: a gas molecule dissolves
      const p = G.reduce((a, b) => (b.y > a.y ? b : a)); p.state = 'l'; p.y = 0.56;
    }
    if (!open && G.length < nG) parts.push(newP('g'));                        // the gas supply keeps P constant
    else if (!open && G.length > nG + 1) G[0].state = 'out';
  }
  for (const p of parts) {
    if (p.state === 'g') {
      p.x += 0.006 * p.vx; p.y += 0.006 * p.vy;
      if (p.y < 0.07) { if (open && Math.abs(p.x - 0.5) < 0.12) p.state = 'out'; else p.vy = Math.abs(p.vy); }
      if (p.y > 0.47) p.vy = -Math.abs(p.vy);
    } else if (p.state === 'l') {
      p.x += 0.0015 * p.vx; p.y += 0.0015 * p.vy;
      if (p.y < 0.54) p.vy = Math.abs(p.vy);
      if (p.y > 0.94) p.vy = -Math.abs(p.vy);
      if (Math.random() < 0.02) { p.vx = rand(-1, 1); p.vy = rand(-1, 1); }
    } else if (p.state === 'b') {
      p.y -= 0.006; p.x += 0.001 * Math.sin(p.y * 40);
      if (p.y < 0.5) { p.state = 'g'; p.vy = -1; }
    } else if (p.state === 'out') {
      p.y -= 0.01;
    }
    if (p.x < 0.07) p.vx = Math.abs(p.vx);
    if (p.x > 0.93) p.vx = -Math.abs(p.vx);
  }
  parts = parts.filter(p => p.y > -0.05);
}

function draw() {
  const w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
  const dpr = window.devicePixelRatio || 1;
  if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  const X = v => v * w, Y = v => v * h;
  ctx.fillStyle = cssColor('--accent-soft'); ctx.fillRect(X(0.05), Y(0.5), X(0.9), Y(0.47));
  ctx.strokeStyle = cssColor('--text'); ctx.lineWidth = 2.5; ctx.beginPath();
  ctx.moveTo(X(0.05), Y(0.05)); ctx.lineTo(X(0.05), Y(0.97)); ctx.lineTo(X(0.95), Y(0.97)); ctx.lineTo(X(0.95), Y(0.05));
  if (open) { ctx.lineTo(X(0.62), Y(0.05)); ctx.moveTo(X(0.38), Y(0.05)); ctx.lineTo(X(0.05), Y(0.05)); }
  else ctx.lineTo(X(0.05), Y(0.05));
  ctx.stroke();
  ctx.strokeStyle = cssColor('--accent'); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(X(0.05), Y(0.5)); ctx.lineTo(X(0.95), Y(0.5)); ctx.stroke();
  const col = cssColor(gas === 'co2' ? '--c0' : '--c2');
  for (const p of parts) {
    ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), Math.max(3.5, w * 0.009), 0, Math.PI * 2);
    if (p.state === 'b') { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke(); }
    else { ctx.fillStyle = col; ctx.fill(); }
  }
  ctx.fillStyle = cssColor('--text-muted'); ctx.font = `12px ${getComputedStyle(document.body).fontFamily}`;
  ctx.textAlign = 'left'; ctx.fillText(open ? 'open: gas escapes into the air' : 'gas', X(0.07), Y(0.12) - 12 > 10 ? Y(0.12) - 12 : 12);
  ctx.fillText('water', X(0.07), Y(0.95) - 2);
}

function readout() {
  const g = GASES[gas], P = pressure(), S = g.k * P;
  $('hl-P-out').textContent = open ? `${sig(P, 2)} atm (air)` : `${P.toFixed(2)} atm (${(P * 101.325).toFixed(0)} kPa)`;
  const mass = S * g.M;   // g/L
  $('hl-readout').innerHTML =
    `<tr><td>k</td><td class="num">${sci(g.k, 2)} mol L⁻¹ atm⁻¹</td></tr>` +
    `<tr><td>S = k·P</td><td class="num">${S === 0 ? '0' : sig(S, 2)} mol/L</td></tr>` +
    `<tr><td>in mass</td><td class="num">${mass >= 0.1 ? mass.toFixed(2) + ' g/L' : (mass * 1000).toPrecision(2) + ' mg/L'}</td></tr>`;
  let note;
  if (open) note = gas === 'co2'
    ? 'The bottle is open. The partial pressure of CO₂ above the soda drops to that of air, about 0.0004 atm, so the equilibrium solubility drops 10 000-fold. The extra CO₂ leaves as bubbles: the soda fizzes and slowly goes flat.'
    : 'The bottle is open to air, where the partial pressure of O₂ is 0.21 atm. Water in contact with air holds about 9 mg/L of O₂ at 20 °C, 8 mg/L at 25 °C: enough for fish, but not much.';
  else note = gas === 'co2'
    ? `Double the pressure and you double the solubility. A soda is bottled under a few atm of CO₂: at ${P.toFixed(1)} atm, ${sig(S, 2)} mol/L (about ${(S * g.M).toFixed(1)} g/L) is dissolved.`
    : 'O₂ is about 26 times less soluble than CO₂. Both molecules are non-polar, but CO₂ is larger and more polarisable, and its polar C=O bonds attract water molecules, so it interacts more strongly with water.';
  $('hl-note').textContent = note;
}

function loop() {
  if (!visible || reduced) return;
  step(); draw();
  requestAnimationFrame(loop);
}
function sync() { readout(); if (reduced || !visible) { fill(); draw(); } }

Pin.addEventListener('input', () => { open = false; sync(); });
$('hl-open').addEventListener('click', () => { open = true; sync(); });
$('hl-close').addEventListener('click', () => { open = false; fill(); sync(); });
for (const b of $('hl-gas').querySelectorAll('button')) b.addEventListener('click', () => {
  gas = b.dataset.v; open = false;
  $('hl-gas').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
  fill(); sync();
});
new IntersectionObserver(es => { const was = visible; visible = es[0].isIntersecting; if (visible && !was) requestAnimationFrame(loop); }).observe(cv);
new ResizeObserver(() => draw()).observe(cv);
fill(); readout(); draw();
requestAnimationFrame(loop);

// ---- O2 from air dissolved in fresh water at 1 atm (mg/L), standard saturation table
const O2 = [[0, 14.62], [5, 12.77], [10, 11.29], [15, 10.08], [20, 9.09], [25, 8.26], [30, 7.56], [35, 6.95], [40, 6.41]];
new Plot($('o2-plot')).draw({
  x: { min: 0, max: 40, label: 'water temperature (°C)' },
  y: { min: 0, max: 16, label: 'dissolved O₂ (mg/L)' },
  series: [{ points: O2, color: '--c2', dots: true }],
});
