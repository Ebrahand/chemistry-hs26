// Module 2: build an atom (protons, neutrons, electrons → element, isotope, ion) and atomic weight from isotopes.

import { byZ } from '../assets/elements.js';
import { AW } from '../assets/formula.js';

const $ = id => document.getElementById(id);

// Stable isotopes (mass numbers) for Z = 1–30, and long-lived radioactive isotopes found in nature.
const STABLE = {
  1: [1, 2], 2: [3, 4], 3: [6, 7], 4: [9], 5: [10, 11], 6: [12, 13], 7: [14, 15], 8: [16, 17, 18], 9: [19], 10: [20, 21, 22],
  11: [23], 12: [24, 25, 26], 13: [27], 14: [28, 29, 30], 15: [31], 16: [32, 33, 34, 36], 17: [35, 37], 18: [36, 38, 40],
  19: [39, 41], 20: [40, 42, 43, 44, 46, 48], 21: [45], 22: [46, 47, 48, 49, 50], 23: [50, 51], 24: [50, 52, 53, 54], 25: [55],
  26: [54, 56, 57, 58], 27: [59], 28: [58, 60, 61, 62, 64], 29: [63, 65], 30: [64, 66, 67, 68, 70],
};
const NATURAL_RADIO = { '1-3': 'tritium, made by cosmic rays', '6-14': 'carbon-14, used for radiocarbon dating', '19-40': 'potassium-40, about 0.012 % of natural potassium' };
const SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => String(n).split('').map(c => SUPD[c]).join('');
const chargeStr = q => (q === 0 ? '' : (Math.abs(q) === 1 ? '' : Math.abs(q)) + (q > 0 ? '+' : '−'));

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const pIn = $('ba-p'), nIn = $('ba-n'), eIn = $('ba-e');

function nuclide(Z, A, q, sym) {
  return `<span style="display:inline-flex;align-items:center;font-size:30px;line-height:1">` +
    `<span style="display:inline-flex;flex-direction:column;align-items:flex-end;font-size:15px;line-height:1.15;margin-right:2px"><span>${A}</span><span>${Z}</span></span>` +
    `<strong>${sym}</strong><span style="font-size:15px;align-self:flex-start;margin-left:1px">${chargeStr(q)}</span></span>`;
}

function renderAtom() {
  const Z = +pIn.value, N = +nIn.value, E = +eIn.value;
  const A = Z + N, q = Z - E, el = byZ(Z);
  $('ba-p-out').textContent = Z; $('ba-n-out').textContent = N; $('ba-e-out').textContent = E;

  // drawing
  const W = 360, H = 250, cx = 150, cy = 125, Rc = 105;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<defs><radialGradient id="ba-cloud"><stop offset="0" stop-color="var(--c1)" stop-opacity=".28"/><stop offset="1" stop-color="var(--c1)" stop-opacity="0"/></radialGradient></defs>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${Rc}" fill="url(#ba-cloud)"/>`;
  const r = rng(Z * 101 + 7);
  for (let i = 0; i < E; i++) {
    const ang = i * 2.39996 + r() * 0.6, rad = 26 + Math.sqrt((i + 0.5) / Math.max(E, 1)) * (Rc - 34) + (r() - 0.5) * 14;
    s += `<circle cx="${(cx + rad * Math.cos(ang)).toFixed(1)}" cy="${(cy + rad * Math.sin(ang)).toFixed(1)}" r="3.4" fill="var(--c1)"/>`;
  }
  // nucleus: protons and neutrons packed on a sunflower spiral, mixed in a fixed random order
  const order = [...Array(Z).fill('p'), ...Array(N).fill('n')];
  const r2 = rng(A * 31 + 3);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r2() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const rn = 3.6;
  order.forEach((t, i) => {
    const rad = rn * 1.05 * Math.sqrt(i), ang = i * 2.39996;
    s += `<circle cx="${(cx + rad * Math.cos(ang)).toFixed(1)}" cy="${(cy + rad * Math.sin(ang)).toFixed(1)}" r="${rn}" fill="var(${t === 'p' ? '--c0' : '--cB'})" stroke="var(--bg)" stroke-width=".6"/>`;
  });
  s += `<text x="${W - 4}" y="22" text-anchor="end" font-size="12" fill="var(--c0)">● proton</text>`;
  s += `<text x="${W - 4}" y="40" text-anchor="end" font-size="12" fill="var(--text-muted)">● neutron</text>`;
  s += `<text x="${W - 4}" y="58" text-anchor="end" font-size="12" fill="var(--c1)">● electron</text>`;
  s += `<text x="${W - 4}" y="${H - 26}" text-anchor="end" font-size="11" fill="var(--text-muted)">Not to scale: the real nucleus</text>`;
  s += `<text x="${W - 4}" y="${H - 12}" text-anchor="end" font-size="11" fill="var(--text-muted)">is 10 000× smaller than the cloud</text>`;
  $('ba-diagram').innerHTML = s + '</svg>';

  // readout
  const stable = STABLE[Z]?.includes(A);
  const radio = NATURAL_RADIO[`${Z}-${A}`];
  const kind = q === 0 ? 'neutral atom' : q > 0 ? `cation (${q} electron${q > 1 ? 's' : ''} removed)` : `anion (${-q} electron${q < -1 ? 's' : ''} added)`;
  const rows = [
    ['Element', `${el.name} (Z = ${Z})`],
    ['Symbol', nuclide(Z, A, q, el.sym)],
    ['Mass number A', `${Z} + ${N} = ${A}`],
    ['Charge', q === 0 ? '0' : chargeStr(q)],
    ['Isotope', stable ? `${el.sym}-${A}: stable` : radio ? `${el.sym}-${A}: radioactive, ${radio}` : `${el.sym}-${A}: not stable, not found in nature`],
  ];
  $('ba-readout').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');

  const stableList = STABLE[Z].map(m => `${el.sym}-${m}`).join(', ');
  let note = `Changing the number of <strong>protons</strong> changes the element. ${el.name} has ${Z}. `;
  note += `It is a ${kind}. `;
  if (!stable) note += `The stable isotope${STABLE[Z].length > 1 ? 's' : ''} of ${el.name.toLowerCase()} ${STABLE[Z].length > 1 ? 'are' : 'is'} ${stableList}: too many or too few neutrons and the nucleus falls apart. `;
  else note += `Adding a neutron would change only the mass, not the chemistry. `;
  if (Math.abs(q) > 3) note += 'Ions with such a large charge are not found in ordinary chemistry.';
  $('ba-note').innerHTML = note;
}
// Keep the electron slider in a sensible range for the chosen element
pIn.addEventListener('input', () => {
  const Z = +pIn.value;
  const nAt = STABLE[Z][Math.floor((STABLE[Z].length - 1) / 2)] - Z;
  nIn.value = nAt; eIn.value = Z;
  renderAtom();
});
nIn.addEventListener('input', renderAtom);
eIn.addEventListener('input', renderAtom);
renderAtom();

/* ------------------------------------------------------------------ */
/* Isotopes and atomic weight                                          */
/* ------------------------------------------------------------------ */

// Isotope masses (u) and natural abundances (%): IUPAC/NIST.
const ISO = [
  { sym: 'C', name: 'carbon', iso: [[12, 12.000000, 98.93], [13, 13.003355, 1.07]] },
  { sym: 'B', name: 'boron', iso: [[10, 10.012937, 19.9], [11, 11.009305, 80.1]] },
  { sym: 'Li', name: 'lithium', iso: [[6, 6.015123, 7.59], [7, 7.016003, 92.41]] },
  { sym: 'Cl', name: 'chlorine', iso: [[35, 34.968853, 75.76], [37, 36.965903, 24.24]] },
  { sym: 'Cu', name: 'copper', iso: [[63, 62.929598, 69.15], [65, 64.927790, 30.85]] },
  { sym: 'Br', name: 'bromine', iso: [[79, 78.918338, 50.69], [81, 80.916291, 49.31]] },
  { sym: 'Ag', name: 'silver', iso: [[107, 106.905097, 51.839], [109, 108.904752, 48.161]] },
];
const elSel = $('iso-el'), xIn = $('iso-x');
elSel.innerHTML = ISO.map((e, i) => `<option value="${i}">${e.name} (${e.sym})</option>`).join('');
const dots = $('iso-dots');
const NDOT = 200;
dots.innerHTML = '<i></i>'.repeat(NDOT);
const dotOrder = (() => { const r = rng(11); const a = [...Array(NDOT).keys()]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; })();

function renderIso() {
  const e = ISO[+elSel.value];
  const x = +xIn.value / 100;
  const [[A1, m1, nat1], [A2, m2]] = e.iso;
  $('iso-x-label').textContent = `Share of ${e.sym}-${A1}`;
  $('iso-x-out').textContent = `${(+xIn.value).toFixed(2)} %`;
  const avg = x * m1 + (1 - x) * m2;
  const nLight = Math.round(x * NDOT);
  const ds = dots.children;
  dotOrder.forEach((k, i) => { ds[k].style.background = i < nLight ? 'var(--c0)' : 'var(--c1)'; });
  $('iso-legend').innerHTML = `<span><i style="border-color:var(--c0);background:var(--c0)"></i>${e.sym}-${A1} (${m1.toFixed(4)} u)</span><span><i style="border-color:var(--c1);background:var(--c1)"></i>${e.sym}-${A2} (${m2.toFixed(4)} u)</span>`;
  $('iso-readout').innerHTML = [
    [`${e.sym}-${A1}`, `${x.toFixed(4)} × ${m1.toFixed(4)} u = ${(x * m1).toFixed(3)} u`],
    [`${e.sym}-${A2}`, `${(1 - x).toFixed(4)} × ${m2.toFixed(4)} u = ${((1 - x) * m2).toFixed(3)} u`],
    ['Average', `<strong>${avg.toFixed(3)} u</strong>`],
    ['Periodic table', `${AW[e.sym]} u`],
  ].map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal">${b}</td></tr>`).join('');
  const natural = Math.abs(+xIn.value - nat1) < 0.02;
  $('iso-note').innerHTML = natural
    ? `With the natural mixture the average is the atomic weight on the periodic table, ${AW[e.sym]} u. Not a single ${e.name} atom actually has this mass.`
    : `The average sits closer to the isotope there is more of. Isotopes have the same chemistry, so a sample enriched in ${e.sym}-${x > nat1 / 100 ? A1 : A2} would react the same way, but a mole of it would weigh ${avg.toFixed(2)} g instead of ${AW[e.sym]} g.`;
}
function natural() { xIn.value = ISO[+elSel.value].iso[0][2]; renderIso(); }
elSel.addEventListener('change', natural);
xIn.addEventListener('input', renderIso);
$('iso-nat').addEventListener('click', natural);
natural();
