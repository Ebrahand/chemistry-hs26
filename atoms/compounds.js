// Module 3: periodic table coloured by metal / metalloid / nonmetal; ionic-compound builder; name → formula practice.

import { periodicTable } from '../assets/ptable.js';
import { BY_SYM } from '../assets/elements.js';
import { AW, RADIOACTIVE, parseFormula } from '../assets/formula.js';
import { CATIONS, ANIONS, compound, ionHTML } from '../assets/ions.js';

const $ = id => document.getElementById(id);

/* ---------- periodic table ---------- */
const METALLOIDS = new Set(['B', 'Si', 'Ge', 'As', 'Sb', 'Te']);   // Brown Fig. 2.13
const NONMETALS = new Set(['H', 'He', 'C', 'N', 'O', 'F', 'Ne', 'P', 'S', 'Cl', 'Ar', 'Se', 'Br', 'Kr', 'I', 'Xe', 'At', 'Rn']);
const cls = e => (METALLOIDS.has(e.sym) ? 'metalloid' : NONMETALS.has(e.sym) ? 'nonmetal' : 'metal');
const COL = { metal: '--c0', metalloid: '--c3', nonmetal: '--c1' };
const awText = sym => (RADIOACTIVE.has(sym) ? `[${AW[sym]}]` : AW[sym] >= 100 ? AW[sym].toFixed(1) : AW[sym].toFixed(2));

function familyOf(e) {
  if (e.Z >= 57 && e.Z <= 71) return 'lanthanides';
  if (e.group === 1 && e.sym !== 'H') return 'group 1, the alkali metals';
  if (e.group === 2) return 'group 2, the alkaline-earth metals';
  if (e.group >= 3 && e.group <= 12) return `group ${e.group}, the transition metals`;
  if (e.group === 16) return 'group 16, the chalcogens';
  if (e.group === 17) return 'group 17, the halogens';
  if (e.group === 18) return 'group 18, the noble gases';
  return `group ${e.group}`;
}
function ionOf(e) {
  if (e.sym === 'H') return 'H⁺ (and H⁻ with metals)';
  if (e.sym === 'Al') return 'Al³⁺';
  if (e.group === 1) return `${e.sym}⁺`;
  if (e.group === 2) return `${e.sym}²⁺`;
  if (['N', 'P'].includes(e.sym)) return `${e.sym}³⁻`;
  if (['O', 'S', 'Se'].includes(e.sym)) return `${e.sym}²⁻`;
  if (e.group === 17 && e.sym !== 'At') return `${e.sym}⁻`;
  return null;
}

const pt = periodicTable($('pt-table'), {
  value: () => 1,
  colour: e => COL[cls(e)],
  label: e => awText(e.sym),
  selected: 'Na',
  onSelect: e => notePT(e),
});
function notePT(e) {
  const ion = ionOf(e);
  $('pt-note').innerHTML = `<strong>${e.name}</strong>, ${e.sym}: Z = ${e.Z}, atomic weight ${awText(e.sym)} u, so one mole weighs ${awText(e.sym)} g. ` +
    `A ${cls(e)} in period ${e.period}${e.fblock ? '' : ', ' + familyOf(e)}.` + (ion ? ` Usually forms the ion ${ion}.` : '') +
    (RADIOACTIVE.has(e.sym) ? ' No stable isotope: the bracket gives the mass number of the longest-lived one.' : '');
}
notePT(BY_SYM.Na);

/* ---------- ionic-compound builder ---------- */
const catSel = $('ic-cat'), anSel = $('ic-an');
const SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const ionLabel = i => `${i.f.replace(/\d/g, d => SUB[d])}${Math.abs(i.q) > 1 ? SUP[Math.abs(i.q)] : ''}${i.q > 0 ? '⁺' : '⁻'}  ${i.name}`;
catSel.innerHTML = CATIONS.map((c, i) => `<option value="${i}">${ionLabel(c)}</option>`).join('');
anSel.innerHTML = ANIONS.map((a, i) => `<option value="${i}">${ionLabel(a)}</option>`).join('');
catSel.value = String(CATIONS.findIndex(c => c.f === 'Al'));
anSel.value = String(ANIONS.findIndex(a => a.f === 'SO4'));

function renderIC() {
  const cat = CATIONS[+catSel.value], an = ANIONS[+anSel.value];
  const c = compound(cat, an);
  const bw = 66, gap = 8, total = c.nc + c.na;
  const W = Math.max(360, total * (bw + gap) + 40), H = 120;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  let x = (W - (total * (bw + gap) - gap + 24)) / 2;
  const box = (ion, col) => {
    s += `<rect x="${x}" y="22" width="${bw}" height="46" rx="8" fill="color-mix(in srgb, var(${col}) 22%, var(--surface))" stroke="var(${col})"/>`;
    s += `<text x="${x + bw / 2}" y="51" text-anchor="middle" font-size="16" fill="var(--text)">${ion.f.replace(/(\d+)/g, '<tspan font-size="11" baseline-shift="sub">$1</tspan>')}<tspan font-size="11" baseline-shift="super">${Math.abs(ion.q) > 1 ? Math.abs(ion.q) : ''}${ion.q > 0 ? '+' : '−'}</tspan></text>`;
    s += `<text x="${x + bw / 2}" y="90" text-anchor="middle" font-size="13" fill="var(${col})">${ion.q > 0 ? '+' : '−'}${Math.abs(ion.q)}</text>`;
    x += bw + gap;
  };
  for (let i = 0; i < c.nc; i++) box(cat, '--c0');
  x += 24;
  for (let i = 0; i < c.na; i++) box(an, '--c1');
  s += `<text x="${W / 2}" y="113" text-anchor="middle" font-size="13" fill="var(--text-muted)">${c.nc} × (${cat.q > 0 ? '+' : ''}${cat.q}) + ${c.na} × (${an.q}) = 0</text>`;
  $('ic-diagram').innerHTML = s + '</svg>';
  $('ic-formula').innerHTML = `${c.html} <span style="font-weight:400;font-size:17px">· ${c.name}</span>`;
  let note = `${ionHTML(cat)} has charge ${cat.q > 0 ? '+' : ''}${cat.q} and ${ionHTML(an)} has ${String(an.q).replace("-", "−")}. The smallest numbers that cancel the charges: ${c.nc} and ${c.na}.`;
  if (an.poly && c.na > 1) note += ` The anion is polyatomic, so it goes in brackets: (${an.f.replace(/(\d+)/g, '<sub>$1</sub>')})<sub>${c.na}</sub> means ${c.na} whole ${an.name} ions.`;
  if (cat.f === 'Hg2') note += ' Hg₂²⁺ is two Hg⁺ bound together, so the subscript 2 stays even when it could be cancelled.';
  if (cat.old) note += ` Older name: ${cat.old} ${an.name}.`;
  if (cat.f === 'H') note += ' With H⁺ as the cation this is an acid, not a salt (named differently, see below).';
  $('ic-note').innerHTML = note;
}
catSel.addEventListener('change', renderIC);
anSel.addEventListener('change', renderIC);
renderIC();

/* ---------- name → formula practice ---------- */
// Leave out the compounds of Problem Set 1, question 4.
const SKIP = new Set(['KCN', 'NaBrO2', 'Sr(OH)2', 'CoTe', 'Fe2(CO3)3', 'Cr(NO3)3', '(NH4)2SO3', 'NaH2PO4', 'KMnO4', 'Ag2Cr2O7']);
const POOL = [];
for (const c of CATIONS) for (const a of ANIONS) {
  if (c.f === 'H' || a.f === 'O2' || c.f === 'Hg2') continue;
  const k = compound(c, a);
  if (!SKIP.has(k.text)) POOL.push(k);
}
let cur;
function nextName() {
  cur = POOL[Math.floor(Math.random() * POOL.length)];
  $('nm-name').textContent = cur.name;
  $('nm-in').value = '';
  $('nm-fb').className = 'feedback';
  $('nm-fb').textContent = '';
}
function same(a, b) {
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k => a[k] === b[k]);
}
function check() {
  const fb = $('nm-fb');
  let mine;
  try { mine = parseFormula($('nm-in').value); } catch (err) { fb.className = 'feedback wrong'; fb.textContent = err.message; return; }
  const ok = same(mine, parseFormula(cur.text));
  fb.className = 'feedback ' + (ok ? 'right' : 'wrong');
  const written = $('nm-in').value.trim();
  if (ok && written !== cur.text) { fb.innerHTML = `Right atoms. Written the usual way: ${cur.html}.`; return; }
  fb.innerHTML = ok ? `Correct: ${cur.html}.` : `Not quite. Find the two ions and their charges, then make the total charge zero. Answer: ${cur.html}.`;
}
$('nm-check').addEventListener('click', check);
$('nm-in').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
$('nm-next').addEventListener('click', nextName);
nextName();
