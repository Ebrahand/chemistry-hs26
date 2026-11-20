// Module 6: ΔG = ΔH − TΔS against temperature, with the four cases and the crossover temperature ΔH/ΔS.

import { Plot } from '../assets/plot.js';
import { byId, sumProp, eqText, sgn } from '../assets/thermo.js';

const $ = id => document.getElementById(id);
const fromTable = (id, name) => { const r = byId(id); return { name: name || r.name, eq: eqText(r.eq), dH: sumProp(r.eq, 'H'), dS: sumProp(r.eq, 'S'), id }; };
const flip = p => ({ ...p, dH: -p.dH, dS: -p.dS, eq: p.eq.split(' → ').reverse().join(' → ') });

const ozone = fromTable('ozone', 'Case 1: 2 O₃ → 3 O₂');
const PROCS = [
  ozone,
  { ...flip(ozone), name: 'Case 2: 3 O₂ → 2 O₃', id: 'ozone-r' },
  { name: 'Case 3: water freezing', eq: 'H₂O(l) → H₂O(s)', dH: -6.01, dS: -22.0, id: 'freeze', known: 273.15 },
  { name: 'Case 4: ice melting', eq: 'H₂O(s) → H₂O(l)', dH: 6.01, dS: 22.0, id: 'melt', known: 273.15 },
  fromTable('haber'),
  fromTable('lime'),
  fromTable('no2'),
  { ...fromTable('vapwater', 'Water boiling'), known: 373.15 },
  { ...fromTable('vapbr2', 'Bromine boiling'), known: 332.0 },
  { ...fromTable('vapmeoh', 'Methanol boiling'), known: 337.8 },
  fromTable('diamond'),
  { name: 'Your own ΔH and ΔS', id: 'custom' },
];
const NOTES = {
  haber: 'Industry still runs it at about 400–500 °C, because at low temperature it is far too slow (kinetics), and uses high pressure to push it forward (equilibrium, week 12).',
  lime: 'Limestone has to be heated above about 840 °C before it decomposes at 1 atm of CO₂. Real lime kilns run at about 900 °C.',
  no2: 'Below about 55 °C the colourless dimer N₂O₄ is favoured, above it brown NO₂.',
  vapbr2: 'Measured normal boiling point of Br₂: 58.8 °C (332 K).',
  vapmeoh: 'Measured normal boiling point of methanol: 64.7 °C.',
  vapwater: 'The table values are for 25 °C. ΔH_vap of water falls from 44.0 kJ/mol at 25 °C to 40.7 kJ/mol at 100 °C, which is why the estimate is a few degrees low.',
  diamond: 'ΔG is negative at every temperature here, yet nothing happens: the rearrangement of the crystal is extremely slow.',
  freeze: 'Water freezes below 0 °C: there the heat released (ΔH) wins over the entropy lost.',
  melt: 'Ice melts above 0 °C: there the entropy gained (TΔS) wins over the heat needed.',
};

const sel = $('gt-rxn'), tIn = $('gt-T'), hIn = $('gt-dH'), sIn = $('gt-dS');
sel.innerHTML = PROCS.map((p, i) => `<option value="${i}">${p.name}</option>`).join('');
const plot = new Plot($('gt-plot'));
const dd = x => (Math.abs(x) < 10 ? 2 : 1);
const K = t => `${Math.round(t)} K (${Math.round(t - 273.15)} °C)`;

function current() {
  const p = PROCS[+sel.value];
  if (p.id !== 'custom') return p;
  return { ...p, eq: 'a process of your own', dH: +hIn.value, dS: +sIn.value };
}
function tmaxFor(p) {
  const tc = p.dH / (p.dS / 1000);
  return tc > 0 && p.dH * p.dS > 0 ? Math.min(3000, Math.max(400, Math.ceil(tc * 2.2 / 100) * 100)) : 1500;
}

function render() {
  const p = current();
  $('gt-custom').style.display = p.id === 'custom' ? '' : 'none';
  $('gt-dH-out').textContent = `${sgn(+hIn.value, 0)} kJ`;
  $('gt-dS-out').textContent = `${sgn(+sIn.value, 0)} J/K`;
  const T = +tIn.value, tmax = +tIn.max;
  $('gt-T-out').textContent = K(T);
  const dS = p.dS / 1000;                       // kJ/K
  const G = t => p.dH - t * dS;
  const pts = f => [[0, f(0)], [tmax, f(tmax)]];
  const ys = [p.dH, 0, -tmax * dS, G(tmax), G(0)];
  let lo = Math.min(...ys), hi = Math.max(...ys);
  const pad = Math.max((hi - lo) * 0.08, 2); lo -= pad; hi += pad;
  const tc = p.dH / dS, cross = dS !== 0 && tc > 0 && tc < tmax;
  plot.draw({
    x: { min: 0, max: tmax, label: 'temperature T (K)' },
    y: { min: lo, max: hi, label: 'kJ' },
    raster: { fn: (x, y) => (y < 0 ? '--good' : null), nx: 4, ny: 120, alpha: 0.08 },
    series: [
      { points: pts(() => p.dH), color: '--c0', width: 2, dash: [6, 4] },
      { points: pts(t => -t * dS), color: '--c1', width: 2, dash: [6, 4] },
      { points: pts(G), color: '--text', width: 3 },
    ],
    hlines: [{ y: 0, color: '--plot-axis' }],
    vlines: [{ x: T, color: '--accent', width: 1.5 }].concat(cross ? [{ x: tc, color: '--plot-axis', dash: [3, 4] }] : []),
    markers: [{ x: T, y: G(T), color: G(T) < 0 ? '--good' : '--bad', r: 6 }],
    texts: [{ x: tmax, y: 0, dy: 4, text: 'ΔG < 0: spontaneous ', color: '--good', align: 'right', baseline: 'top', size: 12 }],
  });

  const g = G(T);
  const caseN = p.dH < 0 && p.dS > 0 ? 1 : p.dH > 0 && p.dS < 0 ? 2 : p.dH < 0 ? 3 : 4;
  const rows = [
    ['Process', p.eq],
    ['ΔH', `${sgn(p.dH, 2)} kJ`],
    ['ΔS', `${sgn(p.dS, 1)} J/K`],
    ['ΔG at this T', `${sgn(p.dH, dd(p.dH))} − ${Math.round(T)} × (${sgn(dS, 4)}) = <strong>${sgn(g, dd(g))} kJ</strong>`],
    ['Crossover T = ΔH/ΔS', p.dH * p.dS > 0 ? K(tc) : 'none (ΔH and ΔS have opposite signs)'],
  ];
  if (p.known) rows.push(['Measured', K(p.known)]);
  $('gt-readout').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal">${b}</td></tr>`).join('');

  const caseTxt = {
    1: 'Case 1: ΔH &lt; 0 and ΔS &gt; 0. Both favour it: spontaneous at every temperature.',
    2: 'Case 2: ΔH &gt; 0 and ΔS &lt; 0. Both are against it: never spontaneous. The reverse always is.',
    3: `Case 3: ΔH &lt; 0 but ΔS &lt; 0. Spontaneous only at low temperature, below ${K(tc)}.`,
    4: `Case 4: ΔH &gt; 0 but ΔS &gt; 0. Spontaneous only at high temperature, above ${K(tc)}.`,
  }[caseN];
  const caseOut = p.dS === 0 || p.dH === 0 ? 'With ΔH or ΔS equal to zero, only the other term decides.' : caseTxt;
  const now = g < 0 ? `At ${Math.round(T)} K, ΔG &lt; 0: <strong>spontaneous</strong>.` : Math.abs(g) < 0.05 ? `At ${Math.round(T)} K, ΔG ≈ 0: at equilibrium.` : `At ${Math.round(T)} K, ΔG &gt; 0: <strong>nonspontaneous</strong>.`;
  $('gt-note').innerHTML = `${caseOut} ${now} ${NOTES[p.id] || ''}`;
}

function setRange() {
  const p = current();
  const tmax = tmaxFor(p);
  tIn.max = tmax;
  if (+tIn.value > tmax) tIn.value = tmax;
}
sel.addEventListener('change', () => { setRange(); tIn.value = Math.min(298, +tIn.max); render(); });
for (const el of [hIn, sIn]) el.addEventListener('input', () => { setRange(); render(); });
tIn.addEventListener('input', render);
sel.value = '4';   // Haber
setRange();
render();
