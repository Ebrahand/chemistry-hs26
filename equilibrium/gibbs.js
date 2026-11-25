// Module 5: G of an A(g)/B(g) mixture against composition (the free-energy valley), ΔG = ΔG° + RT ln Q,
// and K = e^(−ΔG°/RT) for reactions from Brown Appendix C.

import { Plot } from '../assets/plot.js';
import { sig, sci } from '../assets/format.js';
import { eqText } from '../assets/thermo.js';
import { EQUILIBRIA, dG, Kof } from './eqdata.js';

const $ = id => document.getElementById(id);
const R = 8.314;
const gIn = $('gv-G'), tIn = $('gv-T'), xIn = $('gv-x');
const plot = new Plot($('gv-plot'));
const sgn = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
const fmtK = k => (k >= 0.01 && k < 1e4 ? sig(k, 3) : sci(k, 2));

function render() {
  const G0 = +gIn.value, T = +tIn.value, x0 = +xIn.value, RT = R * T / 1000;   // kJ/mol
  $('gv-G-out').textContent = `${sgn(G0)} kJ/mol`;
  $('gv-T-out').textContent = `${T} K`;
  $('gv-x-out').textContent = `${Math.round(x0 * 100)} % B`;
  const mix = x => (x <= 0 || x >= 1 ? 0 : RT * ((1 - x) * Math.log(1 - x) + x * Math.log(x)));
  const g = x => x * G0 + mix(x);
  const K = Math.exp(-G0 / RT), xe = K / (1 + K);
  const Qn = x0 / (1 - x0), dGnow = G0 + RT * Math.log(Qn);
  const n = 300, pts = Array.from({ length: n + 1 }, (_, i) => { const x = i / n; return [x, g(x)]; });
  const ys = pts.map(p => p[1]).concat([0, G0]);
  let lo = Math.min(...ys), hi = Math.max(...ys); const pad = (hi - lo) * 0.12 || 1; lo -= pad; hi += pad;
  const h = 0.13;
  plot.draw({
    x: { min: 0, max: 1, label: 'composition: fraction of B (0 = pure A, 1 = pure B)' },
    y: { min: lo, max: hi, label: 'G − G°(A)  (kJ per mol)' },
    series: [
      { points: [[0, 0], [1, G0]], color: '--text-muted', width: 1.5, dash: [6, 5] },
      { points: pts, color: '--c1' },
      { points: [[x0 - h, g(x0) - h * dGnow], [x0 + h, g(x0) + h * dGnow]], color: '--c0', width: 2.5 },
    ],
    vlines: [{ x: xe, color: '--good', dash: [4, 4] }],
    markers: [{ x: xe, y: g(xe), color: '--good', r: 6 }, { x: x0, y: g(x0), color: '--c0', r: 6 }],
    texts: [{ x: xe, y: lo, dy: -10, text: ' equilibrium', color: '--good', align: xe > 0.75 ? 'right' : 'left', bold: true }],
  });
  $('gv-readout').innerHTML = [
    ['K = e<sup>−ΔG°/RT</sup>', `<strong>${fmtK(K)}</strong>`],
    ['Equilibrium: fraction B = K/(1 + K)', `${sig(100 * xe, 3)} %`],
    ['Now: Q = P<sub>B</sub>/P<sub>A</sub>', fmtK(Qn)],
    ['ΔG = ΔG° + RT ln Q', `${sgn(G0)} + ${RT.toFixed(2)} × ln(${fmtK(Qn)}) = <strong>${sgn(dGnow, 2)} kJ/mol</strong>`],
  ].map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal">${b}</td></tr>`).join('');
  const dir = Math.abs(dGnow) < 0.05 ? 'ΔG ≈ 0: the present mixture is at the bottom of the valley, at equilibrium.'
    : dGnow < 0 ? 'ΔG &lt; 0: downhill towards more B. The reaction runs forward (Q &lt; K).'
      : 'ΔG &gt; 0: forming more B would go uphill, so the reverse reaction runs (Q &gt; K).';
  $('gv-note').innerHTML = `${dir} The orange line is the slope of G at the present mixture: that slope is ΔG. ` +
    (G0 === 0 ? 'With ΔG° = 0, K = 1: the valley bottom is at 50 : 50.'
      : `Even though ${G0 < 0 ? 'pure B lies lower than pure A' : 'pure A lies lower than pure B'}, the minimum is a mixture: mixing always lowers G a little at both ends. Raise T and the mixing term grows, pulling the minimum towards the middle.`);
}
for (const el of [gIn, tIn, xIn]) el.addEventListener('input', render);
render();

// ---------- table of K from Appendix C ----------
const MEANING = {
  water: 'K = P(H₂O) = 0.0316 bar = 3.16 kPa: the vapour pressure of water at 25 °C (measured: 3.17 kPa).',
  haber: 'NH₃ is favoured at 25 °C, yet nothing happens: far too slow (week 11).',
  n2o4: 'Both gases present in similar amounts: the flask of module 3.',
  nacl: 'K<sub>sp</sub> = [Na⁺][Cl⁻] ≈ 39, so a saturated solution has about √39 ≈ 6 M of each ion (real: about 6.1 mol per kg of water).',
  lime: 'P(CO₂) of about 10⁻²³ bar: limestone is perfectly stable at room temperature.',
  ozone: 'Ozone should turn completely into O₂. It survives only because the decomposition is slow.',
  reform: 'No hydrogen from methane at 25 °C. Run at 700–1000 °C, where the large ΔS wins.',
};
$('gk-table').innerHTML = ['water', 'haber', 'n2o4', 'nacl', 'lime', 'ozone', 'reform'].map(id => {
  const r = EQUILIBRIA.find(e => e.id === id), g0 = dG(r.eq), K = Kof(r.eq);
  return `<tr><td>${eqText(r.eq).replace('→', '⇌')}</td><td class="num">${sgn(g0, 2)}</td><td class="num">${fmtK(K)}</td><td class="small">${MEANING[id]}</td></tr>`;
}).join('');
