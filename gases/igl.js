// Module 3: ideal-gas calculator (solve PV = nRT for any variable, with units) and gas densities ρ = PM/RT.

import { R, GASES, AIR_M, fHTML } from './data.js';
import { parseNumber, sig } from '../assets/format.js';

const $ = id => document.getElementById(id);

/* ---------- calculator ---------- */
// factor to convert to the working units (kPa, L, mol, K); T in °C is an offset
const UNITS = {
  P: [['kPa', 1], ['Pa', 0.001], ['atm', 101.325], ['bar', 100], ['torr', 101.325 / 760]],
  V: [['L', 1], ['mL', 0.001], ['m³', 1000]],
  n: [['mol', 1], ['mmol', 0.001]],
  T: [['°C', 'C'], ['K', 1]],
};
const LABEL = { P: 'Pressure P', V: 'Volume V', n: 'Amount n', T: 'Temperature T' };
const vals = { P: '101.325', V: '24.5', n: '1.00', T: '25' };
let find = 'V';

$('gc-inputs').innerHTML = ['P', 'V', 'n', 'T'].map(k => `<div class="control" style="margin:0">
  <label class="ctl-label" for="gc-${k}">${LABEL[k]}</label>
  <div class="answer-row" style="margin-top:0">
    <input id="gc-${k}" class="text-input" style="width:7.5em" type="text" inputmode="decimal" value="${vals[k]}">
    <select id="gc-${k}-u" aria-label="Unit of ${k}">${UNITS[k].map(([u], i) => `<option value="${i}">${u}</option>`).join('')}</select>
  </div></div>`).join('');

const toWork = (k, x) => { const f = UNITS[k][+$(`gc-${k}-u`).value][1]; return f === 'C' ? x + 273.15 : x * f; };
const fromWork = (k, x) => { const f = UNITS[k][+$(`gc-${k}-u`).value][1]; return f === 'C' ? x - 273.15 : x / f; };
const unitOf = k => UNITS[k][+$(`gc-${k}-u`).value][0];

function calc() {
  const w = {};
  for (const k of ['P', 'V', 'n', 'T']) if (k !== find) {
    const x = parseNumber($(`gc-${k}`).value);
    if (!Number.isFinite(x)) { $('gc-note').textContent = `Type a number for ${LABEL[k]}.`; return; }
    w[k] = toWork(k, x);
  }
  if (find !== 'T' && w.T <= 0) { $('gc-note').innerHTML = 'The absolute temperature must be above 0 K.'; return; }
  if (Object.entries(w).some(([k, v]) => k !== 'T' && v <= 0)) { $('gc-note').textContent = 'P, V and n must be positive.'; return; }
  let res, eq;
  if (find === 'P') { res = (w.n * R * w.T) / w.V; eq = `P = nRT / V = ${sig(w.n, 4)} mol × 8.314 × ${sig(w.T, 5)} K / ${sig(w.V, 4)} L`; }
  if (find === 'V') { res = (w.n * R * w.T) / w.P; eq = `V = nRT / P = ${sig(w.n, 4)} mol × 8.314 × ${sig(w.T, 5)} K / ${sig(w.P, 5)} kPa`; }
  if (find === 'n') { res = (w.P * w.V) / (R * w.T); eq = `n = PV / RT = ${sig(w.P, 5)} kPa × ${sig(w.V, 4)} L / (8.314 × ${sig(w.T, 5)} K)`; }
  if (find === 'T') { res = (w.P * w.V) / (w.n * R); eq = `T = PV / nR = ${sig(w.P, 5)} kPa × ${sig(w.V, 4)} L / (${sig(w.n, 4)} mol × 8.314)`; }
  const wu = { P: 'kPa', V: 'L', n: 'mol', T: 'K' }[find];
  const shown = fromWork(find, res);
  $(`gc-${find}`).value = sig(shown, 4).replace('−', '-');
  const conv = Object.keys(w).filter(k => unitOf(k) !== { P: 'kPa', V: 'L', n: 'mol', T: 'K' }[k]);
  $('gc-note').innerHTML = (conv.length ? `First convert to kPa, L, mol and K (so R = 8.314 L kPa mol⁻¹ K⁻¹): ${conv.map(k => `${k} = ${sig(w[k], 5)} ${{ P: 'kPa', V: 'L', n: 'mol', T: 'K' }[k]}`).join(', ')}. ` : 'All in kPa, L, mol and K, so R = 8.314 L kPa mol⁻¹ K⁻¹. ') +
    `${eq} = <strong>${sig(res, 4)} ${wu}</strong>${unitOf(find) !== wu ? ` = ${sig(shown, 4)} ${unitOf(find)}` : ''}.`;
}
function setFind(k) {
  find = k;
  $('gc-find').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === k)));
  for (const x of ['P', 'V', 'n', 'T']) { $(`gc-${x}`).disabled = x === k; $(`gc-${x}`).style.fontWeight = x === k ? '700' : ''; }
  calc();
}
$('gc-find').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setFind(b.dataset.v); });
for (const k of ['P', 'V', 'n', 'T']) { $(`gc-${k}`).addEventListener('input', calc); $(`gc-${k}-u`).addEventListener('change', calc); }
$('gc-stp').addEventListener('click', () => {
  $('gc-P').value = '1'; $('gc-P-u').value = '2'; $('gc-n').value = '1'; $('gc-n-u').value = '0';
  $('gc-T').value = '0'; $('gc-T-u').value = '0'; $('gc-V-u').value = '0';
  setFind('V');
});
setFind('V');

/* ---------- densities ---------- */
const LIST = ['H2', 'He', 'CH4', 'NH3', 'Ne', 'N2', 'air', 'O2', 'Ar', 'CO2'];
function renderRho() {
  const Tout = +$('rho-T').value + 273.15, Thot = +$('rho-hot').value + 273.15, P = +$('rho-P').value;
  $('rho-T-out').textContent = `${$('rho-T').value} °C`;
  $('rho-hot-out').textContent = `${$('rho-hot').value} °C`;
  $('rho-P-out').textContent = `${P.toFixed(1)} kPa`;
  const rho = (M, T) => (P * M) / (R * T);   // g/L
  const air = rho(AIR_M, Tout);
  const rows = LIST.map(k => k === 'air' ? { k, label: 'air (outside)', M: AIR_M, r: air } : { k, label: GASES[k].name, f: k, M: GASES[k].M, r: rho(GASES[k].M, Tout) });
  rows.push({ k: 'hot', label: `hot air, ${$('rho-hot').value} °C`, M: AIR_M, r: rho(AIR_M, Thot) });
  rows.sort((a, b) => a.r - b.r);
  const W = 520, rowH = 24, x0 = 160, bw = 290, H = rows.length * rowH + 30;
  const max = Math.max(...rows.map(r => r.r)) * 1.05;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  rows.forEach((r, i) => {
    const y = 6 + i * rowH;
    const col = r.k === 'air' ? '--plot-axis' : r.r < air ? '--c2' : '--c0';
    const nm = r.f ? `${r.label} (${r.f.replace(/(\d)/g, '<tspan baseline-shift="sub" font-size="9">$1</tspan>')})` : r.label;
    s += `<text x="${x0 - 8}" y="${y + 15}" text-anchor="end" font-size="12" fill="var(--text)">${nm}</text>`;
    s += `<rect x="${x0}" y="${y + 3}" width="${(r.r / max) * bw}" height="16" rx="3" fill="var(${col})"/>`;
    s += `<text x="${x0 + (r.r / max) * bw + 5}" y="${y + 15}" font-size="11" fill="var(--text-muted)">${r.r.toFixed(3)} g/L</text>`;
  });
  const ax = x0 + (air / max) * bw;
  s += `<line x1="${ax}" y1="2" x2="${ax}" y2="${H - 22}" stroke="var(--text)" stroke-dasharray="4 3"/>`;
  s += `<text x="${ax}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--text-muted)">density of the air around the balloon</text>`;
  $('rho-plot').innerHTML = s + '</svg>';
  const he = rho(GASES.He.M, Tout), hot = rho(AIR_M, Thot);
  const liftHot = air - hot;
  $('rho-note').innerHTML = `Green floats, orange sinks. Each cubic metre of helium lifts ${(air - he).toFixed(2)} kg (ρ in g/L is the same number as kg/m³). ` +
    (liftHot > 0 ? `Hot air at ${$('rho-hot').value} °C lifts only ${liftHot.toFixed(2)} kg per m³: same gas, so only the temperature helps, ρ ∝ 1/T.`
      : 'The air inside is not warmer than outside, so the hot-air balloon does not lift.') +
    ' Lowering the pressure lowers every density in the same ratio.';
}
['rho-T', 'rho-hot', 'rho-P'].forEach(id => $(id).addEventListener('input', renderRho));
renderRho();
