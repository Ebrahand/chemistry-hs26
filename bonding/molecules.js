// Lewis-structure library for topic 7. Every structure lists its atoms (with lone pairs) and bonds;
// formal charges, oxidation numbers, electron counts and VSEPR shapes are all computed from that,
// so nothing is typed in twice. validate() checks every structure's electron count.
//
// Electronegativities are the lecture's (Lecture 7 p. 13), used for oxidation numbers.

import { BY_SYM } from '../assets/elements.js';

export const VALENCE = { H: 1, B: 3, C: 4, N: 5, O: 6, F: 7, P: 5, S: 6, Cl: 7, Br: 7, I: 7, Xe: 8, As: 5, Se: 6 };
const SUB = '₀₁₂₃₄₅₆₇₈₉';
export const sub = s => s.replace(/\d/g, d => SUB[d]);

// Layout angles (degrees, counter-clockwise from "right") for n ligands around a central atom
function anglesFor(n, centralLp) {
  if (n === 1) return [0];
  if (n === 2) return [180, 0];
  if (n === 3) return centralLp ? [180, 0, 270] : [90, 210, 330];
  if (n === 4) return [180, 0, 90, 270];
  if (n === 5) return [90, 162, 234, 306, 18];
  return [0, 60, 120, 180, 240, 300];
}

// AB_n builder. ligands: [element, bond order, lone pairs, radical electrons?]
function AB(center, lp, ligands, { rad = 0, angles } = {}) {
  const ang = angles || anglesFor(ligands.length, lp + rad);
  const atoms = [{ el: center, x: 0, y: 0, lp, rad }];
  const bonds = [];
  ligands.forEach(([el, order, llp, lrad = 0], i) => {
    const a = ang[i] * Math.PI / 180;
    atoms.push({ el, x: Math.cos(a), y: Math.sin(a), lp: llp, rad: lrad });
    bonds.push([0, i + 1, order]);
  });
  return { atoms, bonds, central: [0] };
}
// Explicit builder: atoms [el, x, y, lp, rad?], bonds [i, j, order]
function X(atoms, bonds, central) {
  return { atoms: atoms.map(([el, x, y, lp, rad = 0]) => ({ el, x, y, lp, rad })), bonds, central };
}

// kind: 'single' (one good structure), 'resonance' (equivalent structures), 'alternatives' (compare by formal charge)
const M = (id, formula, name, charge, kind, structures, note = '') => ({ id, formula, name, charge, kind, structures, note });

export const MOLECULES = [
  M('hf', 'HF', 'hydrogen fluoride', 0, 'single', [AB('F', 3, [['H', 1, 0]], { angles: [180] })]),
  M('cl2', 'Cl2', 'chlorine', 0, 'single', [AB('Cl', 3, [['Cl', 1, 3]])]),
  M('n2', 'N2', 'nitrogen', 0, 'single', [AB('N', 1, [['N', 3, 1]])]),
  M('h2o', 'H2O', 'water', 0, 'single', [AB('O', 2, [['H', 1, 0], ['H', 1, 0]])]),
  M('h2s', 'H2S', 'hydrogen sulfide', 0, 'single', [AB('S', 2, [['H', 1, 0], ['H', 1, 0]])]),
  M('nh3', 'NH3', 'ammonia', 0, 'single', [AB('N', 1, [['H', 1, 0], ['H', 1, 0], ['H', 1, 0]])]),
  M('nh4', 'NH4', 'ammonium', 1, 'single', [AB('N', 0, [['H', 1, 0], ['H', 1, 0], ['H', 1, 0], ['H', 1, 0]])]),
  M('ch4', 'CH4', 'methane', 0, 'single', [AB('C', 0, [['H', 1, 0], ['H', 1, 0], ['H', 1, 0], ['H', 1, 0]])]),
  M('ccl4', 'CCl4', 'tetrachloromethane', 0, 'single', [AB('C', 0, [['Cl', 1, 3], ['Cl', 1, 3], ['Cl', 1, 3], ['Cl', 1, 3]])]),
  M('ncl3', 'NCl3', 'nitrogen trichloride', 0, 'single', [AB('N', 1, [['Cl', 1, 3], ['Cl', 1, 3], ['Cl', 1, 3]])]),
  M('hcn', 'HCN', 'hydrogen cyanide', 0, 'single', [AB('C', 0, [['H', 1, 0], ['N', 3, 1]])]),
  M('h2co', 'H2CO', 'formaldehyde', 0, 'single', [AB('C', 0, [['O', 2, 2], ['H', 1, 0], ['H', 1, 0]])]),
  M('cocl2', 'COCl2', 'phosgene', 0, 'single', [AB('C', 0, [['O', 2, 2], ['Cl', 1, 3], ['Cl', 1, 3]])]),
  M('c2h6', 'C2H6', 'ethane', 0, 'single', [X(
    [['C', -0.5, 0, 0], ['C', 0.5, 0, 0], ['H', -1.5, 0, 0], ['H', -0.5, 1, 0], ['H', -0.5, -1, 0], ['H', 1.5, 0, 0], ['H', 0.5, 1, 0], ['H', 0.5, -1, 0]],
    [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1], [1, 7, 1]], [0, 1])]),
  M('c2h4', 'C2H4', 'ethylene', 0, 'single', [X(
    [['C', -0.5, 0, 0], ['C', 0.5, 0, 0], ['H', -1.1, 0.85, 0], ['H', -1.1, -0.85, 0], ['H', 1.1, 0.85, 0], ['H', 1.1, -0.85, 0]],
    [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]], [0, 1])]),
  M('co2', 'CO2', 'carbon dioxide', 0, 'alternatives', [
    AB('C', 0, [['O', 2, 2], ['O', 2, 2]]),
    AB('C', 0, [['O', 3, 1], ['O', 1, 3]]),
  ], 'Both structures obey the octet rule. Formal charges decide: O=C=O has none at all.'),
  M('cn', 'CN', 'cyanide ion', -1, 'single', [AB('C', 1, [['N', 3, 1]])],
    'From the lecture: C has formal charge −1, N has 0.'),
  M('scn', 'SCN', 'thiocyanate ion', -1, 'alternatives', [
    AB('C', 0, [['S', 2, 2], ['N', 2, 2]]),
    AB('C', 0, [['S', 3, 1], ['N', 1, 3]]),
    AB('C', 0, [['S', 1, 3], ['N', 3, 1]]),
  ], 'Two structures have just one formal charge of −1. The better one puts it on N, the more electronegative atom (N 3.0, S 2.5).'),
  M('n3', 'N3', 'azide ion', -1, 'alternatives', [
    AB('N', 0, [['N', 2, 2], ['N', 2, 2]]),
    AB('N', 0, [['N', 3, 1], ['N', 1, 3]]),
    AB('N', 0, [['N', 1, 3], ['N', 3, 1]]),
  ], 'Problem set 7, question 6. The symmetric structure has the smallest formal charges (−1, +1, −1). Two electron domains on the middle N: linear.'),
  M('o3', 'O3', 'ozone', 0, 'resonance', [
    AB('O', 1, [['O', 2, 2], ['O', 1, 3]]),
    AB('O', 1, [['O', 1, 3], ['O', 2, 2]]),
  ], 'Both O–O bonds are measured to be the same length (128 pm), between a single (148 pm) and a double bond (121 pm).'),
  M('so2', 'SO2', 'sulfur dioxide', 0, 'resonance', [
    AB('S', 1, [['O', 2, 2], ['O', 1, 3]]),
    AB('S', 1, [['O', 1, 3], ['O', 2, 2]]),
  ], 'Drawn here with octets, like ozone (same number of valence electrons).'),
  M('no2', 'NO2', 'nitrite ion', -1, 'resonance', [
    AB('N', 1, [['O', 2, 2], ['O', 1, 3]]),
    AB('N', 1, [['O', 1, 3], ['O', 2, 2]]),
  ], 'Problem set 7, question 8: the two N–O bonds are the same, each about halfway between a single and a double bond.'),
  M('no3', 'NO3', 'nitrate ion', -1, 'resonance', [
    AB('N', 0, [['O', 2, 2], ['O', 1, 3], ['O', 1, 3]]),
    AB('N', 0, [['O', 1, 3], ['O', 2, 2], ['O', 1, 3]]),
    AB('N', 0, [['O', 1, 3], ['O', 1, 3], ['O', 2, 2]]),
  ]),
  M('co3', 'CO3', 'carbonate ion', -2, 'resonance', [
    AB('C', 0, [['O', 2, 2], ['O', 1, 3], ['O', 1, 3]]),
    AB('C', 0, [['O', 1, 3], ['O', 2, 2], ['O', 1, 3]]),
    AB('C', 0, [['O', 1, 3], ['O', 1, 3], ['O', 2, 2]]),
  ]),
  M('hco2', 'HCO2', 'formate ion', -1, 'resonance', [
    AB('C', 0, [['H', 1, 0], ['O', 2, 2], ['O', 1, 3]], { angles: [270, 30, 150] }),
    AB('C', 0, [['H', 1, 0], ['O', 1, 3], ['O', 2, 2]], { angles: [270, 30, 150] }),
  ], 'Problem set 7, question 10: each C–O bond is about 1.5 bonds, so it is longer than the C=O double bonds in CO₂.'),
  M('hno2', 'HNO2', 'nitrous acid', 0, 'alternatives', [
    X([['H', -1.6, 0, 0], ['O', -0.6, 0, 2], ['N', 0.4, 0, 1], ['O', 1.25, 0.55, 2]], [[0, 1, 1], [1, 2, 1], [2, 3, 2]], [1, 2]),
    X([['H', -1.6, 0, 0], ['O', -0.6, 0, 1], ['N', 0.4, 0, 1], ['O', 1.25, 0.55, 3]], [[0, 1, 1], [1, 2, 2], [2, 3, 1]], [1, 2]),
  ], 'Problem set 7, question 8. Unlike NO₂⁻, the second structure is not equivalent: it puts formal charges on both O atoms, so it contributes little.'),
  M('bf3', 'BF3', 'boron trifluoride', 0, 'alternatives', [
    AB('B', 0, [['F', 1, 3], ['F', 1, 3], ['F', 1, 3]]),
    AB('B', 0, [['F', 2, 2], ['F', 1, 3], ['F', 1, 3]]),
    AB('B', 0, [['F', 1, 3], ['F', 2, 2], ['F', 1, 3]]),
    AB('B', 0, [['F', 1, 3], ['F', 1, 3], ['F', 2, 2]]),
  ], 'Less than an octet (Lecture 7): B keeps only 6 electrons. A B=F double bond would give B an octet, but puts +1 on F, the most electronegative element.'),
  M('ch3', 'CH3', 'methyl cation', 1, 'single', [AB('C', 0, [['H', 1, 0], ['H', 1, 0], ['H', 1, 0]])],
    'Only 6 valence electrons in total, so C cannot reach an octet.'),
  M('bf4', 'BF4', 'tetrafluoroborate ion', -1, 'single', [AB('B', 0, [['F', 1, 3], ['F', 1, 3], ['F', 1, 3], ['F', 1, 3]])]),
  M('no', 'NO', 'nitric oxide', 0, 'alternatives', [
    AB('N', 1, [['O', 2, 2]], { rad: 1, angles: [0] }),
    { ...AB('N', 2, [['O', 2, 1, 1]], { angles: [0] }) },
  ], 'An odd number of electrons (11): one electron has to stay unpaired, so one atom cannot have an octet.'),
  M('pcl5', 'PCl5', 'phosphorus pentachloride', 0, 'single', [AB('P', 0, [['Cl', 1, 3], ['Cl', 1, 3], ['Cl', 1, 3], ['Cl', 1, 3], ['Cl', 1, 3]])],
    'More than an octet: P has 10 electrons around it. Only possible from period 3 on.'),
  M('sf4', 'SF4', 'sulfur tetrafluoride', 0, 'single', [AB('S', 1, [['F', 1, 3], ['F', 1, 3], ['F', 1, 3], ['F', 1, 3]])]),
  M('clf3', 'ClF3', 'chlorine trifluoride', 0, 'single', [AB('Cl', 2, [['F', 1, 3], ['F', 1, 3], ['F', 1, 3]])]),
  M('brf3', 'BrF3', 'bromine trifluoride', 0, 'single', [AB('Br', 2, [['F', 1, 3], ['F', 1, 3], ['F', 1, 3]])]),
  M('xef2', 'XeF2', 'xenon difluoride', 0, 'single', [AB('Xe', 3, [['F', 1, 3], ['F', 1, 3]])]),
  M('sf6', 'SF6', 'sulfur hexafluoride', 0, 'single', [AB('S', 0, [['F', 1, 3], ['F', 1, 3], ['F', 1, 3], ['F', 1, 3], ['F', 1, 3], ['F', 1, 3]])]),
  M('brf5', 'BrF5', 'bromine pentafluoride', 0, 'single', [AB('Br', 1, [['F', 1, 3], ['F', 1, 3], ['F', 1, 3], ['F', 1, 3], ['F', 1, 3]])]),
  M('xef4', 'XeF4', 'xenon tetrafluoride', 0, 'single', [AB('Xe', 2, [['F', 1, 3], ['F', 1, 3], ['F', 1, 3], ['F', 1, 3]])]),
  M('brf4', 'BrF4', 'tetrafluorobromate ion', -1, 'single', [AB('Br', 2, [['F', 1, 3], ['F', 1, 3], ['F', 1, 3], ['F', 1, 3]])],
    'Problem set 7, question 5: compare with BF₄⁻. Same formula type, but Br brings 7 valence electrons and B only 3.'),
  M('asf3', 'AsF3', 'arsenic trifluoride', 0, 'single', [AB('As', 1, [['F', 1, 3], ['F', 1, 3], ['F', 1, 3]])]),
  M('clo3', 'ClO3', 'chlorate ion', -1, 'single', [AB('Cl', 1, [['O', 1, 3], ['O', 1, 3], ['O', 1, 3]])],
    'Drawn with octets only. Structures with Cl=O double bonds (more than an octet on Cl) have smaller formal charges; for the shape it makes no difference.'),
  M('bro2', 'BrO2', 'bromite ion', -1, 'single', [AB('Br', 2, [['O', 1, 3], ['O', 1, 3]])],
    'Drawn with octets only. The shape does not depend on it: 4 electron domains, 2 of them lone pairs.'),
  M('bro3', 'BrO3', 'bromate ion', -1, 'single', [AB('Br', 1, [['O', 1, 3], ['O', 1, 3], ['O', 1, 3]])],
    'Problem set 7, question 4(b) asks for the structure that obeys the octet rule: this one.'),
  M('socl2', 'SOCl2', 'thionyl chloride', 0, 'single', [AB('S', 1, [['O', 1, 3], ['Cl', 1, 3], ['Cl', 1, 3]])],
    'Problem set 7, question 4(b), the structure that obeys the octet rule. (A version with S=O has smaller formal charges but 10 electrons on S.)'),
];
export const BY_ID = Object.fromEntries(MOLECULES.map(m => [m.id, m]));

export function formulaHTML(m) {
  const f = sub(m.formula);
  if (!m.charge) return f;
  const c = Math.abs(m.charge) === 1 ? '' : Math.abs(m.charge);
  return `${f}<sup>${c}${m.charge > 0 ? '+' : '−'}</sup>`;
}

/* ------------------------------------------------------------------ */
/* Electron bookkeeping                                                */
/* ------------------------------------------------------------------ */
export const totalValence = m => m.structures[0].atoms.reduce((a, at) => a + VALENCE[at.el], 0) - m.charge;

export function bondSum(s, i) {
  return s.bonds.reduce((a, [p, q, o]) => a + (p === i || q === i ? o : 0), 0);
}
// electrons "around" an atom (bonding pairs counted fully, as for the octet rule)
export const electronsAround = (s, i) => 2 * bondSum(s, i) + 2 * s.atoms[i].lp + (s.atoms[i].rad || 0);

export function formalCharges(s) {
  return s.atoms.map((a, i) => VALENCE[a.el] - (2 * a.lp + (a.rad || 0)) - bondSum(s, i));
}

// Oxidation numbers: every bonding pair goes to the more electronegative atom; equal electronegativity splits it.
// Returns null when two different elements have the same electronegativity in the lecture's table (ambiguous).
export function oxidationNumbers(s) {
  const own = s.atoms.map(a => 2 * a.lp + (a.rad || 0));
  for (const [p, q, o] of s.bonds) {
    const A = s.atoms[p], B = s.atoms[q];
    const ea = BY_SYM[A.el].en, eb = BY_SYM[B.el].en;
    if (ea === eb) {
      if (A.el !== B.el) return null;
      own[p] += o; own[q] += o;
    } else if (ea > eb) own[p] += 2 * o; else own[q] += 2 * o;
  }
  return s.atoms.map((a, i) => VALENCE[a.el] - own[i]);
}

// The dominant structure (Lecture 7): formal charges closest to zero, negative ones on the more electronegative atoms
export function bestStructure(m) {
  const score = s => {
    const fc = formalCharges(s);
    const sumAbs = fc.reduce((a, b) => a + Math.abs(b), 0);
    const negOnEN = fc.reduce((a, f, i) => a + (f < 0 ? f * BY_SYM[s.atoms[i].el].en : 0), 0);   // more negative = better
    return [sumAbs, negOnEN];
  };
  let best = 0;
  m.structures.forEach((s, i) => {
    const [a1, b1] = score(s), [a0, b0] = score(m.structures[best]);
    if (a1 < a0 || (a1 === a0 && b1 < b0 - 1e-9)) best = i;
  });
  return best;
}

// VSEPR from the first structure's central atom
const MOLGEOM = {
  2: ['linear'], 3: ['trigonal planar', 'bent'], 4: ['tetrahedral', 'trigonal pyramidal', 'bent'],
  5: ['trigonal bipyramidal', 'seesaw', 'T-shaped', 'linear'], 6: ['octahedral', 'square pyramidal', 'square planar'],
};
export const EDGEOM = { 2: 'linear', 3: 'trigonal planar', 4: 'tetrahedral', 5: 'trigonal bipyramidal', 6: 'octahedral' };
export const molGeom = (dom, lp) => MOLGEOM[dom]?.[lp];
export function vsepr(m) {
  const s = m.structures[0];
  if (!s.central || s.central.length !== 1) return null;
  const c = s.central[0];
  const bonding = s.bonds.filter(([p, q]) => p === c || q === c).length;
  if (bonding < 2) return null;
  const lone = s.atoms[c].lp + (s.atoms[c].rad ? 1 : 0);
  const dom = bonding + lone;
  return { center: s.atoms[c].el, bonding, lone, dom, edGeom: EDGEOM[dom], molGeom: molGeom(dom, lone) };
}

export function validate() {
  const errs = [];
  for (const m of MOLECULES) {
    const tot = totalValence(m);
    m.structures.forEach((s, k) => {
      const placed = s.atoms.reduce((a, at, i) => a + 2 * at.lp + (at.rad || 0), 0) + 2 * s.bonds.reduce((a, b) => a + b[2], 0);
      if (placed !== tot) errs.push(`${m.id}[${k}]: ${placed} electrons placed, ${tot} available`);
      const fcSum = formalCharges(s).reduce((a, b) => a + b, 0);
      if (fcSum !== m.charge) errs.push(`${m.id}[${k}]: formal charges sum to ${fcSum}`);
      const ox = oxidationNumbers(s);
      if (ox && ox.reduce((a, b) => a + b, 0) !== m.charge) errs.push(`${m.id}[${k}]: oxidation numbers sum wrong`);
    });
  }
  return errs;
}
