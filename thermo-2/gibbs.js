// Module 5: ΔH°, ΔS° and ΔG° of a reaction from Brown Appendix C, the check ΔG° = ΔH° − TΔS°, and ΔS_univ.

import { SPECIES, REACTIONS, byId, sumProp, eqText, sgn, T0, fmtS } from '../assets/thermo.js';

const $ = id => document.getElementById(id);
const sel = $('g-rxn');
sel.innerHTML = REACTIONS.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
sel.value = 'haber';
const fmt = (x, d = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d);

function render() {
  const r = byId(sel.value);
  $('g-eq').textContent = eqText(r.eq);
  $('g-table').innerHTML = Object.entries(r.eq).map(([sp, c]) => {
    const d = SPECIES[sp];
    return `<tr><td>${c < 0 ? 'reactant' : 'product'}: ${d.f}</td><td class="num">${c > 0 ? '+' : '−'}${Math.abs(c)}</td>` +
      `<td class="num">${fmt(d.H)}</td><td class="num">${fmtS(d.S)}</td><td class="num">${fmt(d.G)}</td></tr>`;
  }).join('');

  const dH = sumProp(r.eq, 'H'), dS = sumProp(r.eq, 'S'), dG = sumProp(r.eq, 'G');
  const dGcheck = dH - T0 * dS / 1000;
  const dSsurr = -dH * 1000 / T0, dSuniv = dS + dSsurr;
  const rows = [
    ['ΔH°', `${sgn(dH, 2)} kJ`],
    ['ΔS°', `${sgn(dS, 1)} J/K`],
    ['ΔG° from ΔG°<sub>f</sub>', `${sgn(dG, 2)} kJ`],
    ['ΔH° − TΔS° (298.15 K)', `${sgn(dH, 2)} − 298.15 × (${sgn(dS / 1000, 4)}) = ${sgn(dGcheck, 2)} kJ`],
    ['ΔS<sub>surr</sub> = −ΔH°/T', `${sgn(dSsurr, 1)} J/K`],
    ['ΔS<sub>univ</sub> = ΔS° + ΔS<sub>surr</sub>', `${sgn(dSuniv, 1)} J/K`],
  ];
  $('g-readout').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal">${b}</td></tr>`).join('');

  const verdict = dG < 0
    ? `ΔG° &lt; 0: <strong>spontaneous</strong> under standard conditions at 25 °C (and ΔS<sub>univ</sub> &gt; 0, as it must be).`
    : `ΔG° &gt; 0: <strong>nonspontaneous</strong> under standard conditions at 25 °C. The reverse reaction is spontaneous.`;
  const hs = (dH < 0) === (dS > 0)
    ? (dH < 0 ? ' Both ΔH (heat released) and ΔS (more disorder) favour it.' : ' Neither ΔH nor ΔS favours it.')
    : (dH < 0 ? ' ΔH favours it, ΔS works against it: it wins only at low enough temperature.' : ' ΔS favours it, ΔH works against it: it wins only at high enough temperature.');
  const extra = r.id === 'haber'
    ? ' The lecture\'s example: ΔS of the system is negative, yet the heat released raises the entropy of the surroundings by more.' : '';
  $('g-note').innerHTML = `${verdict}${hs}${extra} ${r.note}`;
}
sel.addEventListener('change', render);
render();
