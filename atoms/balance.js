// Module 4: balance an equation with coefficient steppers and live atom counts; the systematic (algebra) way.

import { parseFormula, formulaHTML, gcd, lcm } from '../assets/formula.js';

const $ = id => document.getElementById(id);

// [reactants, products, balanced coefficients]
const RXNS = [
  ['Burning hydrogen', ['H2', 'O2'], ['H2O'], [2, 1, 2]],
  ['Burning methane (natural gas)', ['CH4', 'O2'], ['CO2', 'H2O'], [1, 2, 1, 2]],
  ['Making ammonia (Haber)', ['N2', 'H2'], ['NH3'], [1, 3, 2]],
  ['Burning propane', ['C3H8', 'O2'], ['CO2', 'H2O'], [1, 5, 3, 4]],
  ['Rusting iron', ['Fe', 'O2'], ['Fe2O3'], [4, 3, 2]],
  ['Aluminium in hydrochloric acid', ['Al', 'HCl'], ['AlCl3', 'H2'], [2, 6, 2, 3]],
  ['Heating potassium chlorate', ['KClO3'], ['KCl', 'O2'], [2, 2, 3]],
  ['Burning ethane', ['C2H6', 'O2'], ['CO2', 'H2O'], [2, 7, 4, 6]],
  ['Oxidizing ammonia', ['NH3', 'O2'], ['NO', 'H2O'], [4, 5, 4, 6]],
  ['Iron from iron ore', ['Fe2O3', 'CO'], ['Fe', 'CO2'], [1, 3, 2, 3]],
  ['Respiration of glucose', ['C6H12O6', 'O2'], ['CO2', 'H2O'], [1, 6, 6, 6]],
  ['Making lime for cement', ['CaCO3'], ['CaO', 'CO2'], [1, 1, 1]],
];

const sel = $('bal-rxn');
sel.innerHTML = RXNS.map((r, i) => `<option value="${i}">${r[0]}</option>`).join('');
let coef = [];

function species() {
  const [, re, pr] = RXNS[+sel.value];
  return [...re.map(f => ({ f, side: 0 })), ...pr.map(f => ({ f, side: 1 }))].map(s => ({ ...s, c: parseFormula(s.f) }));
}

function renderEqn() {
  const sp = species();
  const nR = RXNS[+sel.value][1].length;
  $('bal-eqn').innerHTML = sp.map((s, i) =>
    (i === nR ? '<span class="arrow">⟶</span>' : i > 0 ? '<span class="times">+</span>' : '') +
    `<span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap"><span class="stepper"><button type="button" data-i="${i}" data-d="-1" aria-label="Fewer ${s.f}">▾</button><b>${coef[i]}</b><button type="button" data-i="${i}" data-d="1" aria-label="More ${s.f}">▴</button></span><span>${formulaHTML(s.f)}</span></span>`
  ).join('');
  renderCounts();
}

function renderCounts() {
  const sp = species();
  const els = [];
  for (const s of sp) for (const el of Object.keys(s.c)) if (!els.includes(el)) els.push(el);
  const tally = els.map(el => {
    const L = sp.filter(s => s.side === 0).reduce((t, s) => t + (s.c[el] || 0) * coef[sp.indexOf(s)], 0);
    const R = sp.filter(s => s.side === 1).reduce((t, s) => t + (s.c[el] || 0) * coef[sp.indexOf(s)], 0);
    return { el, L, R };
  });
  const max = Math.max(...tally.flatMap(t => [t.L, t.R]), 1);
  $('bal-counts').innerHTML = tally.map(t =>
    `<div class="count-row"><strong>${t.el}</strong>` +
    `<div style="display:flex;gap:6px;align-items:center"><span class="num" style="min-width:1.6em;text-align:right">${t.L}</span><div class="hbar left" style="flex:1"><i style="width:${(t.L / max) * 100}%;background:var(--c0)"></i></div></div>` +
    `<div style="display:flex;gap:6px;align-items:center"><div class="hbar" style="flex:1"><i style="width:${(t.R / max) * 100}%;background:var(--c1)"></i></div><span class="num" style="min-width:1.6em">${t.R}</span></div>` +
    `<span class="${t.L === t.R ? 'ok' : 'no'}">${t.L === t.R ? '✓' : '✗'}</span></div>`
  ).join('');
  const bad = tally.filter(t => t.L !== t.R);
  const g = coef.reduce((a, b) => gcd(a, b));
  let msg;
  if (!bad.length && g > 1) msg = `Balanced, but every coefficient can be divided by ${g}. Use the smallest whole numbers.`;
  else if (!bad.length) msg = '<strong>Balanced.</strong> Every type of atom appears equally often on both sides: mass is conserved.';
  else {
    msg = `Not balanced yet: ${bad.map(t => `${t.el} (${t.L} left, ${t.R} right)`).join(', ')}.`;
    const single = bad.find(t => sp.filter(s => s.c[t.el]).length === 2);
    if (single) msg += ` Tip: ${single.el} appears in only one formula on each side, so it is a good place to start.`;
  }
  $('bal-note').innerHTML = msg;
}

function systematic() {
  const sp = species();
  const ans = RXNS[+sel.value][3];
  const v = 'abcdefgh';
  const els = [];
  for (const s of sp) for (const el of Object.keys(s.c)) if (!els.includes(el)) els.push(el);
  const term = (s, i, el) => `${s.c[el] > 1 ? s.c[el] : ''}${v[i]}`;
  const lines = els.map(el => {
    const L = sp.map((s, i) => [s, i]).filter(([s]) => s.side === 0 && s.c[el]).map(([s, i]) => term(s, i, el)).join(' + ');
    const R = sp.map((s, i) => [s, i]).filter(([s]) => s.side === 1 && s.c[el]).map(([s, i]) => term(s, i, el)).join(' + ');
    return `<li>${el}:  ${L} = ${R}</li>`;
  });
  // fractions relative to a = 1
  const frac = ans.map(x => { const g = gcd(x, ans[0]); return [x / g, ans[0] / g]; });
  const fracStr = frac.map(([n, d], i) => `${v[i]} = ${d === 1 ? n : `${n}/${d}`}`).join(', ');
  const L = frac.reduce((m, [, d]) => lcm(m, d), 1);
  const termOf = i => `<em>${v[i]}</em> ${formulaHTML(sp[i].f)}`;
  const idx = sp.map((_, i) => i);
  const eq = idx.filter(i => sp[i].side === 0).map(termOf).join(' + ') + ' ⟶ ' + idx.filter(i => sp[i].side === 1).map(termOf).join(' + ');
  $('bal-sys').innerHTML = `<p style="margin:10px 0 4px">Write unknown coefficients: ${eq}. Each element gives one equation:</p>` +
    `<ul style="margin:0 0 6px">${lines.join('')}</ul>` +
    `<p style="margin:0">Set a = 1 and solve: ${fracStr}.${L > 1 ? ` Multiply everything by ${L} to clear the fraction${frac.filter(([, d]) => d > 1).length > 1 ? 's' : ''}` : ''}: ${ans.join(', ')}.</p>`;
}

$('bal-eqn').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const i = +b.dataset.i;
  coef[i] = Math.max(1, Math.min(12, coef[i] + +b.dataset.d));
  b.parentElement.querySelector('b').textContent = coef[i];
  renderCounts();
});
function reset() { coef = species().map(() => 1); renderEqn(); if (!$('bal-sys').hidden) systematic(); }
sel.addEventListener('change', reset);
$('bal-reset').addEventListener('click', reset);
$('bal-show').addEventListener('click', () => {
  const box = $('bal-sys');
  box.hidden = !box.hidden;
  $('bal-show').textContent = box.hidden ? 'Show the systematic way' : 'Hide the systematic way';
  if (!box.hidden) systematic();
});
reset();
