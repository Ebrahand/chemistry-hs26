// Module 2: K expression builder. Pick a reaction, reverse it or multiply it; see Kc, Kp, Δn and the new value of K.

import { eqText } from '../assets/thermo.js';
import { sig, sci } from '../assets/format.js';
import { EQUILIBRIA, phase, formula, Kof, dn, RL, T0 } from './eqdata.js';

const $ = id => document.getElementById(id);
const sel = $('k-rxn');
sel.innerHTML = EQUILIBRIA.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
let dir = 1, mult = 1;

const num = x => (x >= 0.01 && x < 1e4 ? sig(x, 3) : sci(x, 2));
const expo = c => (c === 1 ? '' : `<sup>${{ 0.5: '½', 1.5: '3/2', 2.5: '5/2' }[c] || +c.toFixed(3)}</sup>`);
const MULT_TXT = { 0.5: '½', 1: '1', 2: '2' };

function side(eq, sign, term) {
  const parts = Object.entries(eq).filter(([sp, c]) => Math.sign(c) === sign && ['g', 'aq'].includes(phase(sp)))
    .map(([sp, c]) => term(sp) + expo(Math.abs(c)));
  return parts.join(' ') || '1';
}
const frac = (n, d) => (d === '1' ? n : `<span class="frac"><span>${n}</span><span>${d}</span></span>`);

function render() {
  const base = EQUILIBRIA.find(r => r.id === sel.value);
  const f = dir * mult;
  const eq = Object.fromEntries(Object.entries(base.eq).map(([sp, c]) => [sp, c * f]));
  $('k-eq').textContent = eqText(eq).replace('→', '⇌');

  const K0 = Kof(base.eq), K = Math.pow(K0, f);
  const phases = Object.keys(eq).map(phase);
  const hasAq = phases.includes('aq'), hasG = phases.includes('g');
  const left = Object.keys(eq).filter(sp => ['s', 'l'].includes(phase(sp))).map(sp => `${formula(sp)}(${phase(sp)})`);
  const homo = new Set(phases).size === 1;
  const d = dn(eq);
  const conc = sp => `[${formula(sp)}]`, pres = sp => `P<sub>${formula(sp)}</sub>`;
  const Kc = hasAq ? K : K / Math.pow(RL * T0, d);

  const rows = [
    ['K<sub>c</sub> =', frac(side(eq, 1, conc), side(eq, -1, conc))],
  ];
  if (hasG && !hasAq) rows.push(['K<sub>p</sub> =', frac(side(eq, 1, pres), side(eq, -1, pres))]);
  rows.push(['Type', homo ? 'homogeneous (one phase)' : `heterogeneous; left out: ${left.join(', ')}`]);
  if (hasG && !hasAq) rows.push(['Δn (gas)', `${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(+d.toFixed(2))}`]);
  if (hasG && !hasAq) rows.push(['K<sub>p</sub> at 25 °C', `<strong>${num(K)}</strong>`], ['K<sub>c</sub> = K<sub>p</sub>/(RT)<sup>Δn</sup>', num(Kc)]);
  else rows.push(['K<sub>c</sub> at 25 °C', `<strong>${num(K)}</strong>`]);
  $('k-readout').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal;font-size:16px">${b}</td></tr>`).join('');

  let rule;
  if (f === 1) rule = `As written, K = ${num(K0)}.`;
  else {
    const steps = [];
    if (dir < 0) steps.push(`reversed: 1/K`);
    if (mult !== 1) steps.push(`multiplied by ${MULT_TXT[mult]}: raised to the power ${MULT_TXT[mult]}`);
    rule = `Original K = ${num(K0)}; ${steps.join('; ')}. New K = ${dir < 0 ? '(1/K)' : 'K'}${mult !== 1 ? `<sup>${MULT_TXT[mult]}</sup>` : ''} = <strong>${num(K)}</strong>. The equilibrium mixture itself is the same; only the number describing it changed.`;
  }
  const lies = K > 1e3 ? 'K ≫ 1: the equilibrium lies far to the right (as written).' : K < 1e-3 ? 'K ≪ 1: the equilibrium lies far to the left (as written).' : 'K is neither huge nor tiny: both sides are present in comparable amounts.';
  const NOTES = {
    haber: 'At 25 °C the equilibrium favours NH₃, but the reaction is far too slow. At 450 °C, where it is fast enough, K<sub>p</sub> has fallen to 4.4 × 10⁻⁵ (module 4).',
    n2o4: 'The flask in module 3.',
    lime: 'K<sub>p</sub> = P<sub>CO₂</sub>: the CO₂ pressure over limestone at 25 °C is immeasurably small. Kilns heat it to about 900 °C, where K<sub>p</sub> exceeds 1 (week 5).',
    water: 'K<sub>p</sub> = P<sub>H₂O</sub>: this is simply the vapour pressure of water. 0.0316 bar = 3.16 kPa; the measured value at 25 °C is 3.17 kPa (week 8).',
    nacl: 'This K<sub>c</sub> = [Na⁺][Cl⁻] is a solubility product. It is large: NaCl is very soluble (a saturated solution is about 6 M).',
    ozone: 'An enormous K, yet ozone survives for days in the air: the decomposition is slow (week 11). It is constantly remade by UV light.',
    reform: 'Tiny at 25 °C. The reaction is strongly endothermic, so industry runs it at 700–1000 °C, where K becomes large: most of the world\'s hydrogen is made this way.',
  };
  $('k-note').innerHTML = `${rule} ${lies} ${f === 1 ? NOTES[base.id] : ''}`;
}

function seg(id, set) {
  $(id).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    set(+b.dataset.v);
    for (const x of $(id).querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === b));
    render();
  });
}
seg('k-dir', v => { dir = v; });
seg('k-mult', v => { mult = v; });
sel.addEventListener('change', render);
render();
