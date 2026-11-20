// Module 4: oxidation-number practice. The rules of Lecture 3 p. 24 (Brown 4.4) are applied in order and shown step by step.

import { parseFormula } from '../assets/formula.js';

const $ = id => document.getElementById(id);
// Species for practice (the ones in Problem Set 3, question 4 are left out). peroxide: O is −1.
const SPECIES = [
  { f: 'CO2', q: 0, ask: 'C' }, { f: 'CH4', q: 0, ask: 'C' }, { f: 'CO', q: 0, ask: 'C' },
  { f: 'NH3', q: 0, ask: 'N' }, { f: 'NO2', q: 0, ask: 'N' }, { f: 'N2O5', q: 0, ask: 'N' }, { f: 'NH4', q: 1, ask: 'N' },
  { f: 'N2H4', q: 0, ask: 'N' }, { f: 'SO2', q: 0, ask: 'S' }, { f: 'SO4', q: -2, ask: 'S' },
  { f: 'H2O2', q: 0, ask: 'O', peroxide: true }, { f: 'Na2O2', q: 0, ask: 'O', peroxide: true },
  { f: 'NaH', q: 0, ask: 'H' }, { f: 'CaH2', q: 0, ask: 'H' },
  { f: 'ClO4', q: -1, ask: 'Cl' }, { f: 'ClO', q: -1, ask: 'Cl' }, { f: 'KClO3', q: 0, ask: 'Cl' }, { f: 'Cl2', q: 0, ask: 'Cl' },
  { f: 'Cr2O7', q: -2, ask: 'Cr' }, { f: 'MnO4', q: -1, ask: 'Mn' }, { f: 'Fe2O3', q: 0, ask: 'Fe' },
  { f: 'PCl5', q: 0, ask: 'P' }, { f: 'H3PO4', q: 0, ask: 'P' },
];
const G1 = ['Li', 'Na', 'K', 'Rb', 'Cs'], G2 = ['Be', 'Mg', 'Ca', 'Sr', 'Ba'];
const METALS = [...G1, ...G2, 'Al', 'Fe', 'Cr', 'Mn'];
const sgn = v => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0');
const qText = q => (q === 0 ? '' : (Math.abs(q) === 1 ? '' : Math.abs(q)) + (q > 0 ? '+' : '−'));

export function solve(sp) {
  const n = parseFormula(sp.f), els = Object.keys(n), on = {}, steps = [];
  if (els.length === 1) {
    const el = els[0];
    if (sp.q === 0) { on[el] = 0; steps.push(`${el}${n[el] > 1 ? n[el] : ''} is an element: every atom has oxidation number 0.`); }
    else { on[el] = sp.q / n[el]; steps.push(`A monatomic ion: the oxidation number is its charge, ${sgn(sp.q)}.`); }
    return { on, steps };
  }
  const hasMetal = els.some(e => METALS.includes(e));
  for (const el of els) {
    if (el === 'F') { on.F = -1; steps.push('F is always −1.'); }
    else if (G1.includes(el)) { on[el] = 1; steps.push(`${el} is a group 1 metal: +1 in compounds.`); }
    else if (G2.includes(el)) { on[el] = 2; steps.push(`${el} is a group 2 metal: +2 in compounds.`); }
    else if (el === 'Al') { on.Al = 3; steps.push('Al is +3 in compounds.'); }
  }
  if ('H' in n) {
    const hydride = hasMetal && els.length === 2;
    on.H = hydride ? -1 : 1;
    steps.push(hydride ? 'H is bonded to a metal (a metal hydride): −1.' : 'H is bonded to nonmetals: +1.');
  }
  if ('O' in n && !('O' in on)) {
    on.O = sp.peroxide ? -1 : -2;
    steps.push(sp.peroxide ? 'This is a peroxide (an O–O bond, O₂²⁻): O is −1, not −2.' : 'O is −2.');
  }
  for (const el of ['Cl', 'Br', 'I']) if (el in n) {
    if ('O' in n) steps.push(`${el} is combined with O, so it is not −1 here: work it out from the sum.`);
    else { on[el] = -1; steps.push(`${el} is −1 (no oxygen in the formula).`); }
  }
  const unknown = els.filter(e => !(e in on));
  if (unknown.length === 1) {
    const u = unknown[0];
    const known = els.filter(e => e !== u);
    const sumKnown = known.reduce((t, e) => t + on[e] * n[e], 0);
    on[u] = (sp.q - sumKnown) / n[u];
    const terms = [`${n[u] > 1 ? n[u] + '·' : ''}${u}`, ...known.map(e => `${n[e] > 1 ? n[e] + ' × ' : ''}(${sgn(on[e])})`)].join(' + ');
    steps.push(`The sum must equal the ${sp.q === 0 ? 'charge of a neutral compound, 0' : `charge of the ion, ${sgn(sp.q)}`}: ${terms} = ${sgn(sp.q)}, so ${u} = <strong>${sgn(on[u])}</strong>.`);
  } else if (!unknown.length) {
    const terms = els.map(e => `${n[e] > 1 ? n[e] + ' × ' : ''}(${sgn(on[e])})`).join(' + ');
    steps.push(`Check: ${terms} = ${sgn(sp.q)}, the overall charge.`);
  }
  return { on, steps };
}

function display(sp) {
  const body = sp.f.replace(/([A-Z][a-z]?)(\d*)/g, (m, el, k) => (el === sp.ask ? `<span style="color:var(--accent);text-decoration:underline;text-decoration-thickness:3px">${el}</span>` : el) + (k ? `<sub>${k}</sub>` : ''));
  return sp.q ? `${body}<sup>${qText(sp.q)}</sup>` : body;
}

let cur, last = -1;
function next() {
  let i;
  do { i = Math.floor(Math.random() * SPECIES.length); } while (i === last);
  last = i; cur = SPECIES[i];
  $('ox-species').innerHTML = display(cur);
  $('ox-in').value = '';
  $('ox-fb').className = 'feedback'; $('ox-fb').textContent = '';
  const st = solve(cur);
  $('ox-steps').innerHTML = st.steps.map(s => `<li>${s}</li>`).join('');
  $('ox-steps').hidden = true;
  $('ox-show').textContent = 'Show the rules step by step';
}
function check() {
  const raw = $('ox-in').value.trim().replace(/[−–]/g, '-').replace(/^\+/, '');
  const v = Number(raw);
  const fb = $('ox-fb');
  if (raw === '' || !Number.isFinite(v)) { fb.className = 'feedback wrong'; fb.textContent = 'Type a whole number such as +5, −3 or 0.'; return; }
  const ans = solve(cur).on[cur.ask];
  const ok = Math.abs(v - ans) < 1e-9;
  fb.className = 'feedback ' + (ok ? 'right' : 'wrong');
  fb.innerHTML = ok ? `Correct: ${cur.ask} is ${sgn(ans)}.` : `Not quite. ${cur.q ? 'Remember the sum must equal the charge of the ion, not 0. ' : ''}Open the steps to see the rules applied in order.`;
}
$('ox-check').addEventListener('click', check);
$('ox-in').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
$('ox-next').addEventListener('click', next);
$('ox-show').addEventListener('click', () => {
  const o = $('ox-steps'); o.hidden = !o.hidden;
  $('ox-show').textContent = o.hidden ? 'Show the rules step by step' : 'Hide the steps';
});
next();
