// Module 6: molarity of a solution made from a weighed solute, and dilution M₁V₁ = M₂V₂.

import { molarMass, formulaHTML } from '../assets/formula.js';
import { sig } from '../assets/format.js';

const $ = id => document.getElementById(id);
// colour: tint of the solution; k: concentration (M) at which the tint is fully saturated in the picture
const SOLUTES = [
  { f: 'CuSO4', name: 'copper(II) sulfate', ions: ['Cu²⁺', 'SO₄²⁻'], colour: '#2f7fd8', k: 0.8 },
  { f: 'NaCl', name: 'sodium chloride', ions: ['Na⁺', 'Cl⁻'], colour: null },
  { f: 'KMnO4', name: 'potassium permanganate', ions: ['K⁺', 'MnO₄⁻'], colour: '#8e1f8e', k: 0.02 },
  { f: 'C12H22O11', name: 'sucrose (sugar)', ions: null, colour: null },
];
SOLUTES.forEach(s => { s.M = molarMass(s.f); });
$('mol-sol').innerHTML = SOLUTES.map((s, i) => `<option value="${i}">${s.f.replace(/\d/g, d => '₀₁₂₃₄₅₆₇₈₉'[d])}  ${s.name}</option>`).join('');

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// A flask drawn at (x, y) with width w and max height h, filled to V/Vmax, tinted by concentration.
function flask(x, y, w, h, V, Vmax, conc, sol, label) {
  const fill = h * (V / Vmax), top = y + h - fill;
  const tint = sol.colour ? Math.min(0.9, 0.08 + 0.82 * Math.min(1, conc / sol.k)) : 0.1;
  let s = `<rect x="${x}" y="${top}" width="${w}" height="${fill}" fill="${sol.colour || 'var(--c1)'}" opacity="${tint}"/>`;
  // dots: particle density ∝ concentration
  const nDots = Math.round(Math.min(1, conc / 1.5) * (fill * w) / 140);
  const r = rng(Math.round(conc * 1000) + Math.round(V));
  for (let i = 0; i < nDots; i++) s += `<circle cx="${x + 4 + r() * (w - 8)}" cy="${top + 4 + r() * Math.max(0, fill - 8)}" r="2" fill="var(--text)" opacity=".55"/>`;
  s += `<path d="M ${x} ${y - 6} L ${x} ${y + h} L ${x + w} ${y + h} L ${x + w} ${y - 6}" fill="none" stroke="var(--text)" stroke-width="2"/>`;
  s += `<text x="${x + w / 2}" y="${y + h + 18}" text-anchor="middle" font-size="12" fill="var(--text)">${label}</text>`;
  return s;
}

let M1 = 0;
function render() {
  const sol = SOLUTES[+$('mol-sol').value];
  const m = +$('mol-m').value, V = +$('mol-V').value;
  const n = m / sol.M, c = n / (V / 1000);
  M1 = c;
  $('mol-m-out').textContent = `${m.toFixed(1)} g`;
  $('mol-V-out').textContent = `${V} mL`;
  const rows = [
    [`n = m / M`, `${m.toFixed(1)} g ÷ ${sol.M.toFixed(2)} g/mol = ${sig(n, 3)} mol`],
    ['V', `${V} mL = ${(V / 1000).toFixed(3)} L`],
    [`M = n / V`, `<strong>${sig(c, 3)} M</strong>`],
  ];
  if (sol.ions) rows.push([`[${sol.ions[0]}], [${sol.ions[1]}]`, `${sig(c, 3)} M each`]);
  $('mol-readout').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal">${b}</td></tr>`).join('');
  $('mol-diagram').innerHTML = `<svg viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg">${flask(80, 20, 140, 170, V, 1000, c, sol, `${V} mL, ${sig(c, 3)} M`)}</svg>`;
  let note = `${m.toFixed(1)} g of ${sol.name} is ${sig(n, 3)} mol. In ${V} mL of solution that makes ${sig(c, 3)} mol per litre.`;
  note += sol.ions ? ` It is a strong electrolyte, so the solution contains ${sig(c, 3)} M ${sol.ions[0]} and ${sig(c, 3)} M ${sol.ions[1]}.` : ' Sugar is a nonelectrolyte: the molecules stay whole, and there are no ions.';
  note += ' Double the volume with the same mass and the concentration halves.';
  $('mol-note').innerHTML = note;
  renderDil();
}

function renderDil() {
  const sol = SOLUTES[+$('mol-sol').value];
  const V1 = +$('dil-V1').value;
  let V2 = +$('dil-V2').value;
  if (V2 < V1) { V2 = Math.ceil(V1 / 10) * 10; $('dil-V2').value = V2; }
  const n = M1 * V1 / 1000, M2 = n / (V2 / 1000);
  $('dil-stock').innerHTML = `${sig(M1, 3)} M ${formulaHTML(sol.f)}`;
  $('dil-V1-out').textContent = `${V1} mL`;
  $('dil-V2-out').textContent = `${V2} mL`;
  const s = `<svg viewBox="0 0 520 230" xmlns="http://www.w3.org/2000/svg">` +
    flask(40, 90, 60, 100, V1, 100, M1, sol, `${V1} mL of ${sig(M1, 3)} M`) +
    `<text x="200" y="150" text-anchor="middle" font-size="13" fill="var(--text-muted)">+ ${V2 - V1} mL water</text><text x="200" y="172" text-anchor="middle" font-size="22" fill="var(--text-muted)">⟶</text>` +
    flask(300, 20, 150, 170, V2, 1000, M2, sol, `${V2} mL of ${sig(M2, 3)} M`) + '</svg>';
  $('dil-diagram').innerHTML = s;
  $('dil-note').innerHTML = `The pipette holds n = M₁V₁ = ${sig(M1, 3)} M × ${(V1 / 1000).toFixed(3)} L = ${sig(n, 3)} mol. Water adds volume, not solute: M₂ = n / V₂ = ${sig(n, 3)} mol ÷ ${(V2 / 1000).toFixed(3)} L = <strong>${sig(M2, 3)} M</strong>, ${sig(V2 / V1, 3)} times more dilute.` +
    (sol.colour ? ' You can see it: the colour fades by the same factor.' : '');
}
['mol-sol', 'mol-m', 'mol-V'].forEach(id => $(id).addEventListener('input', render));
['dil-V1', 'dil-V2'].forEach(id => $(id).addEventListener('input', renderDil));
render();
