// Module 4: reaction enthalpies from bond enthalpies, and bond length against bond enthalpy.
// Bond enthalpies and lengths: Brown Tables 8.3 and 8.4, as on Lecture 7 p. 24–25.
// "From ΔHf°": Brown Appendix C, H2O(g) −241.82, CO2(g) −393.5, CH4(g) −74.8, HCl(g) −92.30,
// NH3(g) −46.19, C2H4(g) 52.30, C2H6(g) −84.68 kJ/mol.

import { Plot } from '../assets/plot.js';
import { fix } from '../assets/format.js';

const $ = id => document.getElementById(id);
const D = { 'H–H': 436, 'O=O': 495, 'O–H': 463, 'C–H': 413, 'C=O': 799, 'Cl–Cl': 242, 'H–Cl': 431, 'N≡N': 941, 'N–H': 391, 'C=C': 614, 'C–C': 348 };

const RXN = [
  { eq: '2 H₂ + O₂ → 2 H₂O(g)', broken: [['H–H', 2], ['O=O', 1]], formed: [['O–H', 4]], ref: -483.6,
    note: 'Problem set 7, question 2. For liquid water ΔH = −571.6 kJ: condensing 2 mol of vapour releases another 88 kJ.' },
  { eq: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O(g)', broken: [['C–H', 4], ['O=O', 2]], formed: [['C=O', 2], ['O–H', 4]], ref: -802.3,
    note: 'Burning natural gas. The C=O bonds in CO₂ (799 kJ/mol each) and the O–H bonds in water are much stronger than the bonds broken.' },
  { eq: 'H₂ + Cl₂ → 2 HCl', broken: [['H–H', 1], ['Cl–Cl', 1]], formed: [['H–Cl', 2]], ref: -184.6,
    note: 'Here the estimate is almost exact: there are only diatomic molecules, so the "average" bond enthalpies are the real ones.' },
  { eq: 'N₂ + 3 H₂ → 2 NH₃', broken: [['N≡N', 1], ['H–H', 3]], formed: [['N–H', 6]], ref: -92.4,
    note: 'The Haber–Bosch process. The N≡N triple bond (941 kJ/mol) is one of the strongest bonds there is, which is why the reaction needs a catalyst.' },
  { eq: 'C₂H₄ + H₂ → C₂H₆', broken: [['C=C', 1], ['H–H', 1]], formed: [['C–C', 1], ['C–H', 2]], ref: -137.0,
    note: 'Only count bonds that change: the four C–H bonds of ethylene survive unchanged. Average values are off by about 10 % here.' },
  { eq: 'C₂H₆ + 7/2 O₂ → 2 CO₂ + 3 H₂O(g)', broken: [['C–C', 1], ['C–H', 6], ['O=O', 3.5]], formed: [['C=O', 4], ['O–H', 6]], ref: -1427.8,
    note: 'Per mole of ethane. Large molecules, many bonds: the small errors of the averages partly cancel.' },
];

{
  let r = 0;
  RXN.forEach((x, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = x.eq;
    b.addEventListener('click', () => { r = i; update(); });
    $('be-rxn').appendChild(b);
  });
  const sum = list => list.reduce((a, [b, n]) => a + n * D[b], 0);
  const n = v => (Number.isInteger(v) ? String(v) : v.toFixed(1));

  function ladder(up, dH) {
    const W = 360, H = 300, top = 26, bot = H - 26;
    const Emax = up, Emin = Math.min(0, dH);
    const Y = E => top + (Emax - E) / (Emax - Emin) * (bot - top);
    let s = '';
    const lvl = (E, x0, x1, label, above = false) => {
      s += `<line x1="${x0}" y1="${Y(E)}" x2="${x1}" y2="${Y(E)}" stroke="var(--text)" stroke-width="2"/>`;
      s += above
        ? `<text x="${(x0 + x1) / 2}" y="${Y(E) - 7}" font-size="12" text-anchor="middle" fill="var(--text)">${label}</text>`
        : `<text x="${x0}" y="${Y(E) + 16}" font-size="12" fill="var(--text)">${label}</text>`;
    };
    const arrow = (x, E1, E2, col, label, side = 1) => {
      const d = E2 > E1 ? 1 : -1;
      s += `<line x1="${x}" y1="${Y(E1)}" x2="${x}" y2="${Y(E2) + d * 8}" stroke="var(${col})" stroke-width="3"/>`;
      s += `<path d="M${x - 6},${Y(E2) + d * 10} L${x + 6},${Y(E2) + d * 10} L${x},${Y(E2)} Z" fill="var(${col})"/>`;
      s += `<text x="${x + side * 8}" y="${(Y(E1) + Y(E2)) / 2 + 4}" font-size="12" font-weight="700" text-anchor="${side > 0 ? 'start' : 'end'}" fill="var(${col})">${label}</text>`;
    };
    lvl(up, 60, 300, 'separate atoms', true);
    lvl(0, 20, 120, 'reactants');
    lvl(dH, 200, 300, 'products');
    arrow(70, 0, up, '--c1', `break +${fix(up)}`, 1);
    arrow(250, up, dH, '--c0', `form −${fix(up - dH)}`, -1);
    s += `<line x1="120" y1="${Y(0)}" x2="330" y2="${Y(0)}" stroke="var(--text-muted)" stroke-dasharray="3 3"/>`;
    arrow(320, 0, dH, dH < 0 ? '--good' : '--bad', `ΔH ${dH < 0 ? '−' : '+'}${fix(Math.abs(dH))}`, -1);
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Energy ladder: break all bonds, then form the new ones">${s}</svg>`;
  }

  function update() {
    const x = RXN[r];
    $('be-rxn').querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', i === r));
    const up = sum(x.broken), down = sum(x.formed), dH = up - down;
    const rows = [];
    rows.push(`<tr><th colspan="2">Bonds broken (energy in)</th></tr>`);
    for (const [b, c] of x.broken) rows.push(`<tr><td>${n(c)} × ${b} (${D[b]})</td><td class="num">+${fix(c * D[b])}</td></tr>`);
    rows.push(`<tr><th colspan="2">Bonds formed (energy out)</th></tr>`);
    for (const [b, c] of x.formed) rows.push(`<tr><td>${n(c)} × ${b} (${D[b]})</td><td class="num">−${fix(c * D[b])}</td></tr>`);
    rows.push(`<tr class="latest"><td><strong>Estimate</strong> ${fix(up)} − ${fix(down)}</td><td class="num"><strong>${dH > 0 ? '+' : '−'}${fix(Math.abs(dH))} kJ</strong></td></tr>`);
    rows.push(`<tr><td>From ΔH<sub>f</sub>° (week 4)</td><td class="num">${fix(x.ref, 1)} kJ</td></tr>`);
    $('be-table').innerHTML = rows.join('');
    $('be-svg').innerHTML = ladder(up, dH);
    const err = (dH - x.ref) / Math.abs(x.ref) * 100;
    $('be-note').innerHTML = `${x.note} Estimate and table value differ by ${Math.abs(err).toFixed(0) === '0' ? 'less than 1' : Math.abs(err).toFixed(0)} %.`;
  }
  update();
}

/* ------------------------------------------------------------------ */
/* Bond length vs bond enthalpy                                        */
/* ------------------------------------------------------------------ */
{
  const FAM = [
    ['C–C', '--c0', [[154, 348, '–'], [134, 614, '='], [120, 839, '≡']]],
    ['C–N', '--c3', [[143, 293, '–'], [138, 615, '='], [116, 891, '≡']]],
    ['C–O', '--c1', [[143, 358, '–'], [123, 799, '='], [113, 1072, '≡']]],
    ['N–N', '--c2', [[147, 163, '–'], [124, 418, '='], [110, 941, '≡']]],
    ['N–O', '--accent', [[136, 201, '–'], [122, 607, '=']]],
    ['O–O', '--text-muted', [[148, 146, '–'], [121, 495, '=']]],
  ];
  const plot = new Plot($('bl-plot'));
  plot.draw({
    x: { min: 105, max: 158, label: 'bond length (pm)' },
    y: { min: 0, max: 1150, label: 'bond enthalpy (kJ/mol)' },
    series: FAM.map(([, col, pts]) => ({ points: pts.map(p => [p[0], p[1]]), color: col, dots: true, width: 2 })),
    texts: FAM.flatMap(([name, col, pts]) => pts.map(p => ({ x: p[0], y: p[1], text: name[0] + p[2] + name[2], color: col, dx: 7, dy: -8, size: 11 }))),
  });
  $('bl-legend').innerHTML = FAM.map(([name, col]) => `<span><i style="border-color:var(${col})"></i>${name}</span>`).join('');
}
