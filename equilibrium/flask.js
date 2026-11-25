// Module 3: N₂O₄(g) ⇌ 2 NO₂(g) in a flask. Q against K on a log scale, "let it react", disturbances, and the ICE table.

import { sig, sci } from '../assets/format.js';
import { Kof } from './eqdata.js';

const $ = id => document.getElementById(id);
const R = 8.314, DH = 58.02e3;                     // J/mol, Brown Appendix C: 2(33.84) − 9.66
const K25 = Kof({ 'N2O4(g)': -1, 'NO2(g)': 2 });   // 0.113
const Kat = Tc => K25 * Math.exp(-DH / R * (1 / (Tc + 273.15) - 1 / 298.15));
const aIn = $('fl-a'), bIn = $('fl-b'), tIn = $('fl-T');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let st = { a: +aIn.value, b: +bIn.value };   // partial pressures now (bar)
let ice = null;                              // { a0, b0, K, x }
let anim = null, lastMsg = '';

const fmtP = p => (p < 1e-3 && p > 0 ? sci(p, 2) : p.toFixed(3));
const fmtK = x => (x === Infinity ? '∞' : x === 0 ? '0' : x >= 0.01 && x < 1000 ? sig(x, 3) : sci(x, 2));
const Q = s => (s.a > 0 ? s.b * s.b / s.a : s.b > 0 ? Infinity : NaN);

function solve(a, b, K) {   // (b + 2x)² = K (a − x)  →  4x² + (4b + K)x + (b² − K a) = 0
  return (-(4 * b + K) + Math.sqrt(K * K + 8 * b * K + 16 * K * a)) / 8;
}

// fixed pseudo-random spots in the flask so the picture does not jump around
const SPOTS = Array.from({ length: 70 }, (_, i) => { const r = Math.sqrt(((i * 0.618034) % 1)) * 58, th = i * 2.39996; return [110 + r * Math.cos(th), 150 + r * Math.sin(th) * 0.9]; });

function diagram() {
  const K = Kat(+tIn.value), q = Q(st);
  const W = 480, H = 240;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  // flask
  const op = Math.min(0.85, st.b / 1.6);
  s += `<path d="M95,22 h30 v58 a64,64 0 1 1 -30,0 z" fill="#9c4a12" fill-opacity="${op.toFixed(3)}" stroke="var(--text-muted)" stroke-width="2"/>`;
  const nA = Math.min(25, Math.round(st.a * 12)), nB = Math.min(45, Math.round(st.b * 12));
  SPOTS.slice(0, nA).forEach(([x, y]) => { s += `<circle cx="${x - 3}" cy="${y}" r="3.2" fill="var(--surface)" stroke="var(--text-muted)"/><circle cx="${x + 3}" cy="${y}" r="3.2" fill="var(--surface)" stroke="var(--text-muted)"/>`; });
  SPOTS.slice(nA, nA + nB).forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="3.4" fill="#6b2a05" stroke="var(--surface)" stroke-width="0.8"/>`; });
  s += `<text x="110" y="234" font-size="12" text-anchor="middle" fill="var(--text-muted)">○○ N₂O₄   ● NO₂</text>`;
  // log scale for Q and K
  const x0 = 250, x1 = 466, lo = -3, hi = 2, X = v => x0 + (v - lo) / (hi - lo) * (x1 - x0), y = 120;
  s += `<text x="${x0}" y="40" font-size="12" fill="var(--text-muted)">Q and K (log scale)</text>`;
  s += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="var(--plot-axis)" stroke-width="2"/>`;
  for (let e = lo; e <= hi; e++) {
    s += `<line x1="${X(e)}" y1="${y - 5}" x2="${X(e)}" y2="${y + 5}" stroke="var(--plot-axis)"/>`;
    s += `<text x="${X(e)}" y="${y + 20}" font-size="11" text-anchor="middle" fill="var(--text-muted)">${e === 0 ? '1' : e === 1 ? '10' : `10${e < 0 ? '⁻' : ''}${'⁰¹²³'[Math.abs(e)]}`}</text>`;
  }
  const lk = Math.max(lo, Math.min(hi, Math.log10(K)));
  s += `<path d="M${X(lk)},${y - 8} l-7,-13 h14 z" fill="var(--c1)"/><text x="${X(lk)}" y="${y - 26}" font-size="13" font-weight="700" text-anchor="middle" fill="var(--c1)">K</text>`;
  if (Number.isFinite(q) || q === Infinity) {
    const lq = q === Infinity ? hi : q <= 0 ? lo : Math.max(lo, Math.min(hi, Math.log10(q)));
    s += `<circle cx="${X(lq)}" cy="${y + 40}" r="7" fill="var(--c0)"/><text x="${X(lq)}" y="${y + 62}" font-size="13" font-weight="700" text-anchor="middle" fill="var(--c0)">Q${q === Infinity ? ' = ∞' : q === 0 ? ' = 0' : ''}</text>`;
    if (Math.abs(lq - lk) > 0.08) {
      const xa = X(lq), xb = X(lk), d = xb > xa ? 1 : -1;
      s += `<line x1="${xa + d * 10}" y1="${y + 40}" x2="${xb - d * 6}" y2="${y + 40}" stroke="var(--c0)" stroke-width="2" stroke-dasharray="4 3"/>` +
        `<path d="M${xb},${y + 40} l${-d * 9},-5 v10 z" fill="var(--c0)"/>`;
      s += `<text x="${(x0 + x1) / 2}" y="${y + 92}" font-size="13" text-anchor="middle" fill="var(--text)">${d > 0 ? 'Q &lt; K: reaction runs →' : 'Q &gt; K: reaction runs ←'}</text>`;
    } else s += `<text x="${(x0 + x1) / 2}" y="${y + 92}" font-size="13" text-anchor="middle" fill="var(--good)">Q = K: equilibrium</text>`;
  }
  $('fl-diagram').innerHTML = s + '</svg>';
}

function readout() {
  const T = +tIn.value, K = Kat(T), q = Q(st);
  $('fl-a-out').textContent = `${(+aIn.value).toFixed(2)} bar`;
  $('fl-b-out').textContent = `${(+bIn.value).toFixed(2)} bar`;
  $('fl-T-out').textContent = `${T} °C`;
  $('fl-readout').innerHTML = [
    ['Now: P(N₂O₄), P(NO₂)', `${fmtP(st.a)} bar, ${fmtP(st.b)} bar`],
    ['Q = P(NO₂)² / P(N₂O₄)', fmtK(q)],
    [`K<sub>p</sub> at ${T} °C`, `<strong>${fmtK(K)}</strong>`],
  ].map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal">${b}</td></tr>`).join('');
  let note;
  if (!(st.a > 0 || st.b > 0)) note = 'The flask is empty. Put some N₂O₄ or NO₂ in.';
  else if (Math.abs(Math.log(q / K)) < 0.02) note = lastMsg || 'Q = K: the mixture is at equilibrium. Now disturb it with the buttons, or change the temperature.';
  else note = (lastMsg ? lastMsg + ' ' : '') + (q < K
    ? 'Q &lt; K: too little NO₂ for this temperature. Some N₂O₄ will split, the flask gets browner. Press "Let it react".'
    : 'Q &gt; K: too much NO₂. Some NO₂ will pair up into N₂O₄, the flask gets paler. Press "Let it react".');
  $('fl-note').innerHTML = note;
}

function iceTable() {
  if (!ice) { $('ice-table').innerHTML = ''; $('ice-steps').innerHTML = '<p class="small muted" style="margin:0">Press "Let it react" to fill in the table.</p>'; return; }
  const { a0, b0, K, x } = ice, ax = a0 - x, bx = b0 + 2 * x;
  $('ice-table').innerHTML = `<thead><tr><th></th><th>N₂O₄ (bar)</th><th>⇌</th><th>2 NO₂ (bar)</th></tr></thead><tbody>
    <tr><td><strong>I</strong>nitial</td><td class="num">${fmtP(a0)}</td><td></td><td class="num">${fmtP(b0)}</td></tr>
    <tr><td><strong>C</strong>hange</td><td class="num">−x</td><td></td><td class="num">+2x</td></tr>
    <tr><td><strong>E</strong>quilibrium</td><td class="num">${fmtP(a0)} − x</td><td></td><td class="num">${fmtP(b0)} + 2x</td></tr></tbody>`;
  const B = 4 * b0 + K, C = b0 * b0 - K * a0;
  $('ice-steps').innerHTML = `<p style="margin:0 0 6px">Put the E row into K<sub>p</sub> = ${fmtK(K)}:
    <span class="frac"><span>(${fmtP(b0)} + 2x)²</span><span>${fmtP(a0)} − x</span></span> = ${fmtK(K)}
    &nbsp;⟹&nbsp; 4x² + ${fmtP(B)}x ${C < 0 ? '−' : '+'} ${fmtP(Math.abs(C))} = 0</p>
    <p style="margin:0 0 6px">The quadratic formula gives x = ${x >= 0 ? fmtP(x) : '−' + fmtP(-x)} bar (the other root would make a pressure negative).
    ${x < 0 ? 'x is negative: the reaction ran in reverse, as Q &gt; K predicted.' : ''}</p>
    <p style="margin:0">Equilibrium: P(N₂O₄) = ${fmtP(ax)} bar, P(NO₂) = ${fmtP(bx)} bar. Check: ${fmtP(bx)}² / ${fmtP(ax)} = ${fmtK(bx * bx / ax)} ✓</p>`;
}

function render() { diagram(); readout(); }

function react() {
  if (!(st.a > 0 || st.b > 0)) return;
  const K = Kat(+tIn.value), x = solve(st.a, st.b, K);
  ice = { a0: st.a, b0: st.b, K, x };
  iceTable();
  const from = { ...st }, to = { a: st.a - x, b: st.b + 2 * x };
  lastMsg = '';
  if (anim) cancelAnimationFrame(anim);
  if (reduce) { st = to; render(); return; }
  const t0 = performance.now();
  const stepA = now => {
    const u = Math.min(1, (now - t0) / 1200), e = 1 - Math.pow(1 - u, 3);
    st = { a: from.a + (to.a - from.a) * e, b: from.b + (to.b - from.b) * e };
    render();
    if (u < 1) anim = requestAnimationFrame(stepA); else { st = to; render(); }
  };
  anim = requestAnimationFrame(stepA);
}

function setStart() { if (anim) cancelAnimationFrame(anim); st = { a: +aIn.value, b: +bIn.value }; ice = null; lastMsg = ''; iceTable(); render(); }
aIn.addEventListener('input', setStart);
bIn.addEventListener('input', setStart);
tIn.addEventListener('input', () => {
  const T = +tIn.value;
  lastMsg = `Temperature now ${T} °C. The forward reaction is endothermic (ΔH° = +58 kJ), so warming raises K and cooling lowers it.`;
  render();
});
$('fl-go').addEventListener('click', react);
$('fl-dist').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (anim) cancelAnimationFrame(anim);
  const d = b.dataset.d;
  if (d === 'addA') { st = { a: st.a + 0.5, b: st.b }; lastMsg = 'You added N₂O₄: Q fell.'; }
  if (d === 'remB') { st = { a: st.a, b: st.b / 2 }; lastMsg = 'You removed half the NO₂: Q fell to a quarter (NO₂ is squared).'; }
  if (d === 'halfV') { st = { a: st.a * 2, b: st.b * 2 }; lastMsg = 'Half the volume doubles every pressure. Q = (2P<sub>NO₂</sub>)²/(2P<sub>N₂O₄</sub>) doubles. The reaction shifts to the side with fewer moles of gas, N₂O₄.'; }
  if (d === 'dblV') { st = { a: st.a / 2, b: st.b / 2 }; lastMsg = 'Double the volume halves every pressure, so Q halves. The reaction shifts to the side with more moles of gas, NO₂.'; }
  render();
});
iceTable();
render();
