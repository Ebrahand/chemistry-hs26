// Modules 3 and 4: table of standard molar entropies, and the "predict the sign of ΔS" exercise.

import { SPECIES, fmtS } from '../assets/thermo.js';

const $ = id => document.getElementById(id);

// ---- S° comparison (Brown Appendix C)
const GROUPS = [
  ['Liquid → gas', ['H2O(l)', 'H2O(g)', 'CH3OH(l)', 'CH3OH(g)', 'Br2(l)', 'Br2(g)']],
  ['More atoms', ['CH4(g)', 'C2H6(g)', 'C3H8(g)', 'C4H10(g)']],
  ['Solids', ['C(diamond)', 'C(graphite)']],
];
$('s-table').innerHTML = GROUPS.map(([g, list]) =>
  `<tr><td colspan="3" class="small muted" style="padding-top:12px"><strong>${g}</strong></td></tr>` +
  list.map(sp => {
    const d = SPECIES[sp];
    return `<tr><td>${d.f}</td><td class="num">${fmtS(d.S)}</td><td><div class="hbar"><i style="width:${(d.S / 320 * 100).toFixed(1)}%"></i></div></td></tr>`;
  }).join('')).join('');

// ---- predict the sign. ΔS° values computed from Brown Appendix C.
const ITEMS = [
  { p: 'H₂O(l) → H₂O(g) at 25 °C', a: '+', fb: 'Liquid to gas: the molecules get far more room. ΔS° = 188.83 − 69.91 = +118.9 J/K.' },
  { p: '2 SO₂(g) + O₂(g) → 2 SO₃(g)', a: '−', fb: 'Three moles of gas become two. ΔS° = 2(256.2) − 2(248.5) − 205.0 = −189.6 J/K.' },
  { p: 'CaCO₃(s) → CaO(s) + CO₂(g)', a: '+', fb: 'A gas is made from a solid. ΔS° = 39.75 + 213.6 − 92.88 = +160.5 J/K.' },
  { p: 'N₂ gas cooled from 80 °C to 20 °C', a: '−', fb: 'Less energy to share out, fewer ways to share it: the entropy falls with temperature.' },
  { p: 'C₂H₄(g) + H₂(g) → C₂H₆(g)', a: '−', fb: 'Two gas molecules become one. ΔS° = 229.5 − 219.4 − 130.58 = −120.5 J/K.' },
  { p: 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)', a: '+', fb: 'The ions leave the ordered crystal and move about in the solution. ΔS° = 59.0 + 56.5 − 72.33 = +43.2 J/K. (Some water molecules get ordered around the ions, so for small, highly charged ions it can even be negative.)' },
  { p: 'H₂(g) + Cl₂(g) → 2 HCl(g)', a: '0', alt: '+', fb: 'Two moles of gas on each side, so the change is small. ΔS° = 2(186.69) − 130.58 − 222.96 = +19.8 J/K, ten times less than when the moles of gas change.' },
  { p: 'O₂(g) dissolving in water', a: '−', fb: 'A gas molecule that dissolves loses most of its freedom to move. That is also why gases dissolve less in warm water (week 9).' },
  { p: 'An ideal gas expands into a vacuum (constant T)', a: '+', fb: 'More volume, more places for each molecule: ΔS = R ln(V₂/V₁) per mole. This process is driven by entropy alone (ΔH = 0).' },
];
const LBL = { '+': 'ΔS > 0', '−': 'ΔS < 0', '0': 'ΔS ≈ 0' };
const done = new Map();

$('ps-list').innerHTML = ITEMS.map((it, i) =>
  `<div class="quiz" data-custom data-i="${i}" style="border-top:1px solid var(--border);padding-top:12px">
     <p class="q" style="font-weight:500">${i + 1}. ${it.p}</p>
     <div class="opts" role="group" aria-label="Sign of ΔS">${['+', '−', '0'].map(v => `<button type="button" data-v="${v}">${LBL[v]}</button>`).join('')}</div>
     <p class="feedback" aria-live="polite"></p>
   </div>`).join('');

$('ps-list').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const box = b.closest('.quiz'), it = ITEMS[+box.dataset.i], v = b.dataset.v;
  const right = v === it.a, half = v === it.alt;
  box.querySelectorAll('button').forEach(x => x.classList.remove('right', 'wrong'));
  b.classList.add(right || half ? 'right' : 'wrong');
  const fb = box.querySelector('.feedback');
  fb.className = 'feedback ' + (right || half ? 'right' : 'wrong');
  fb.textContent = (right ? 'Correct. ' : half ? 'Yes, slightly positive. ' : 'Not quite. ') + it.fb;
  if (!done.has(box.dataset.i)) done.set(box.dataset.i, right || half);
  const n = done.size, k = [...done.values()].filter(Boolean).length;
  $('ps-score').textContent = `${k} of ${n} right at the first try${n === ITEMS.length ? ' (all done)' : ''}.`;
});
