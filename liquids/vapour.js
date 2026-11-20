// Module 2: vapour pressure against temperature, boiling at a given outside pressure, Clausius–Clapeyron view.

import { Plot } from '../assets/plot.js';
import { liquids, solveT, K0, R } from '../assets/chem.js';

const $ = id => document.getElementById(id);
const plot = new Plot($('vp-plot'));
const Pin = $('vp-P'), Tin = $('vp-T');
let view = 'P';

const kPa = (L, tC) => L.P(tC + K0) / 1000;
const bpAt = (L, PkPa) => solveT(T => L.P(T) / 1000, PkPa, 200, 520) - K0;
// local Clausius–Clapeyron slope around the normal boiling point
const dHvap = L => {
  const Tb = bpAt(L, 101.325) + K0, T1 = Tb - 10, T2 = Tb + 10;
  return R * Math.log(L.P(T2) / L.P(T1)) / (1 / T1 - 1 / T2) / 1000;
};

$('vp-legend').innerHTML = liquids.map(L =>
  `<span><i style="border-color:var(${L.color});border-top-style:${L.dash.length ? (L.dash[0] < 4 ? 'dotted' : 'dashed') : 'solid'}"></i>${L.name}</span>`).join('');

function render() {
  const P = +Pin.value, T = +Tin.value;
  $('vp-P-out').textContent = `${P.toFixed(1)} kPa`;
  $('vp-T-out').textContent = `${T.toFixed(1)} °C`;

  const series = [], markers = [];
  if (view === 'P') {
    for (const L of liquids) {
      const pts = [];
      for (let t = 0; t <= 200; t += 0.5) { const p = kPa(L, t); pts.push([t, p > 300 ? NaN : p]); }
      series.push({ points: pts, color: L.color, dash: L.dash });
      const tb = bpAt(L, P);
      if (tb >= 0 && tb <= 200) markers.push({ x: tb, y: P, color: L.color, r: 5 });
      const pv = kPa(L, T);
      if (pv <= 250) markers.push({ x: T, y: pv, color: L.color, r: 4, hollow: true });
    }
    plot.draw({
      x: { min: 0, max: 200, label: 'temperature (°C)' },
      y: { min: 0, max: 250, label: 'vapour pressure (kPa)' },
      series, markers,
      hlines: [{ y: P, label: `${P.toFixed(0)} kPa`, color: '--text' }],
      vlines: [{ x: T, color: '--plot-axis', dash: [3, 3] }],
    });
  } else {
    const X = tC => 1000 / (tC + K0);
    for (const L of liquids) {
      const pts = [];
      for (let t = 0; t <= 200; t += 1) pts.push([X(t), Math.log(kPa(L, t))]);
      series.push({ points: pts, color: L.color, dash: L.dash });
      const tb = bpAt(L, P);
      if (tb >= 0 && tb <= 200) markers.push({ x: X(tb), y: Math.log(P), color: L.color, r: 5 });
    }
    plot.draw({
      x: { min: 2.1, max: 3.7, label: '1000 / T  (K⁻¹)' },
      y: { min: -7, max: 7, label: 'ln (P / kPa)' },
      series, markers,
      hlines: [{ y: Math.log(P), label: `ln ${P.toFixed(0)}`, color: '--text' }],
      vlines: [{ x: X(T), color: '--plot-axis', dash: [3, 3] }],
    });
  }

  $('vp-col-T').textContent = `Vapour pressure at ${T.toFixed(0)} °C`;
  $('vp-col-P').textContent = `Boils at ${P.toFixed(1)} kPa`;
  $('vp-table').innerHTML = liquids.map(L => {
    const pv = kPa(L, T), tb = bpAt(L, P), tn = bpAt(L, 101.325);
    const boiling = pv >= P;
    return `<tr><td><span class="swatch" style="background:var(${L.color})"></span> ${L.name}</td><td class="small">${L.forces}</td>` +
      `<td class="num">${pv < 0.1 ? pv.toPrecision(2) : pv.toPrecision(3)} kPa${boiling ? ' <strong>boiling</strong>' : ''}</td>` +
      `<td class="num">${Number.isFinite(tb) ? tb.toFixed(1) + ' °C' : '—'}</td><td class="num">${tn.toFixed(1)} °C</td>` +
      `<td class="num">≈ ${dHvap(L).toFixed(0)} kJ/mol</td></tr>`;
  }).join('');

  const boilingNow = liquids.filter(L => kPa(L, T) >= P).map(L => L.name.toLowerCase());
  const w = liquids.find(L => L.id === 'water');
  let note = `At ${P.toFixed(1)} kPa, water boils at ${bpAt(w, P).toFixed(1)} °C. `;
  note += boilingNow.length
    ? `At ${T.toFixed(0)} °C, the vapour pressure of ${boilingNow.join(' and ')} is above the outside pressure, so ${boilingNow.length > 1 ? 'they boil' : 'it boils'}.`
    : `At ${T.toFixed(0)} °C none of the four liquids boils: every vapour pressure is below ${P.toFixed(0)} kPa.`;
  if (view === 'ln') note += ' In this view each curve is almost a straight line with slope −ΔHvap / R: the steeper, the stronger the intermolecular forces.';
  $('vp-note').textContent = note;
}

Pin.addEventListener('input', render);
Tin.addEventListener('input', render);
$('vp-presets').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { Pin.value = b.dataset.p; render(); } });
for (const b of $('vp-view').querySelectorAll('button')) b.addEventListener('click', () => {
  view = b.dataset.view;
  $('vp-view').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
  render();
});
render();
