// Module 3: neutralization. Mix an acid and a base (amounts in mmol); what reacts, what is left, which salt forms.

import { CATIONS, ANIONS, compound, solubility, ionHTML } from '../assets/ions.js';
import { formulaHTML, gcd } from '../assets/formula.js';

const $ = id => document.getElementById(id);
const ACIDS = [
  { f: 'HCl', name: 'hydrochloric acid', nH: 1, strong: true, an: 'Cl' },
  { f: 'HNO3', name: 'nitric acid', nH: 1, strong: true, an: 'NO3' },
  { f: 'H2SO4', name: 'sulfuric acid', nH: 2, strong: true, an: 'SO4' },
  { f: 'CH3COOH', name: 'acetic acid', nH: 1, strong: false, an: 'CH3COO' },
];
const BASES = [
  { f: 'NaOH', name: 'sodium hydroxide', nOH: 1, cat: 'Na' },
  { f: 'KOH', name: 'potassium hydroxide', nOH: 1, cat: 'K' },
  { f: 'Ca(OH)2', name: 'calcium hydroxide', nOH: 2, cat: 'Ca' },
  { f: 'Ba(OH)2', name: 'barium hydroxide', nOH: 2, cat: 'Ba' },
];
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const uni = f => f.replace(/\d/g, d => SUB[d]);
$('neu-acid').innerHTML = ACIDS.map((a, i) => `<option value="${i}">${uni(a.f)}  ${a.name}${a.strong ? '' : ' (weak)'}</option>`).join('');
$('neu-base').innerHTML = BASES.map((b, i) => `<option value="${i}">${uni(b.f)}  ${b.name}</option>`).join('');
const H = { f: 'H', q: 1 }, OH = { f: 'OH', q: -1 };
const c = n => (n > 1 ? `${n} ` : '');

function render() {
  const A = ACIDS[+$('neu-acid').value], B = BASES[+$('neu-base').value];
  const na = +$('neu-na').value, nb = +$('neu-nb').value;
  $('neu-na-out').textContent = `${na.toFixed(1)} mmol`; $('neu-nb-out').textContent = `${nb.toFixed(1)} mmol`;
  const hPlus = na * A.nH, ohMinus = nb * B.nOH, reacted = Math.min(hPlus, ohMinus);
  const cation = CATIONS.find(x => x.f === B.cat), anion = ANIONS.find(x => x.f === A.an);
  const salt = compound(cation, anion), sol = solubility(cation, anion);

  // diagram: amounts before and after
  const W = 520, Hh = 150, x0 = 120, bw = 300, max = 20;
  let s = `<svg viewBox="0 0 ${W} ${Hh}" xmlns="http://www.w3.org/2000/svg">`;
  const bar = (y, label, v, col) => {
    s += `<text x="${x0 - 8}" y="${y + 13}" text-anchor="end" font-size="12" fill="var(--text)">${label}</text>`;
    s += `<rect x="${x0}" y="${y}" width="${(v / max) * bw}" height="17" rx="3" fill="var(${col})"/>`;
    s += `<text x="${x0 + (v / max) * bw + 5}" y="${y + 13}" font-size="11" fill="var(--text-muted)">${v.toFixed(1)} mmol</text>`;
  };
  s += `<text x="0" y="12" font-size="12" font-weight="700" fill="var(--text)">Before</text>`;
  bar(18, A.strong ? 'H⁺ available' : 'acid H available', hPlus, '--c0');
  bar(40, 'OH⁻', ohMinus, '--c1');
  s += `<text x="0" y="80" font-size="12" font-weight="700" fill="var(--text)">After</text>`;
  bar(86, 'H₂O formed', reacted, '--c2');
  bar(108, hPlus >= ohMinus ? (A.strong ? 'H⁺ left' : 'acid left') : 'OH⁻ left', Math.abs(hPlus - ohMinus), hPlus >= ohMinus ? '--c0' : '--c1');
  $('neu-diagram').innerHTML = s + '</svg>';

  // equations for complete neutralization
  const g = gcd(A.nH, B.nOH), a = B.nOH / g, b = A.nH / g, w = a * A.nH, k = b / salt.nc;
  const saltState = sol.soluble ? '(aq)' : '(s)';
  let eqs = `${c(a)}${formulaHTML(A.f)}(aq) + ${c(b)}${formulaHTML(B.f)}(aq) ⟶ ${c(k)}${salt.html}${saltState} + ${c(w)}H<sub>2</sub>O(l)<br>`;
  let net;
  if (!sol.soluble) net = `${c(w)}${ionHTML(H)}(aq) + ${ionHTML(anion)}(aq) + ${ionHTML(cation)}(aq) + ${c(w)}${ionHTML(OH)}(aq) ⟶ ${salt.html}(s) + ${c(w)}H<sub>2</sub>O(l)`;
  else if (!A.strong) net = `${formulaHTML(A.f)}(aq) + ${ionHTML(OH)}(aq) ⟶ ${ionHTML(anion)}(aq) + H<sub>2</sub>O(l)`;
  else net = `${ionHTML(H)}(aq) + ${ionHTML(OH)}(aq) ⟶ H<sub>2</sub>O(l)`;
  eqs += `<span class="small muted">net ionic:</span> <strong>${net}</strong>`;
  $('neu-eqs').innerHTML = eqs;

  let note;
  if (!hPlus && !ohMinus) note = 'Nothing in the beaker yet.';
  else if (Math.abs(hPlus - ohMinus) < 1e-9) note = `Exactly enough base for all the acid: the solution contains only ${salt.name} and water.` + (A.strong ? ' It is neutral.' : ' It is actually slightly basic: the acetate ion is itself a weak base (week 13).');
  else if (hPlus > ohMinus) note = `${ohMinus.toFixed(1)} mmol OH⁻ react with ${ohMinus.toFixed(1)} mmol H⁺. ${(hPlus - ohMinus).toFixed(1)} mmol ${A.strong ? 'H⁺' : 'acetic acid'} are left over: the solution is <strong>acidic</strong>.`;
  else note = `All ${hPlus.toFixed(1)} mmol ${A.strong ? 'H⁺' : 'acid'} react. ${(ohMinus - hPlus).toFixed(1)} mmol OH⁻ are left over: the solution is <strong>basic</strong>.`;
  if (A.nH === 2) note += ' Each H₂SO₄ gives two H⁺ to a strong base, so it neutralizes twice as much base as HCl.';
  if (B.nOH === 2) note += ` Each ${uni(B.f)} gives two OH⁻.`;
  if (!A.strong) note += ' Acetic acid is weak, so it is written as a molecule in the net ionic equation: the OH⁻ pulls the H⁺ off it.';
  if (!sol.soluble) note += ` Here the salt, ${salt.name}, is insoluble: neutralization and precipitation at the same time, and no ion is left as a spectator.`;
  $('neu-note').innerHTML = note;
}
['neu-acid', 'neu-base', 'neu-na', 'neu-nb'].forEach(id => $(id).addEventListener('input', render));
render();
