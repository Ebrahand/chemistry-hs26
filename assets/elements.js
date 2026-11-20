// Element data shared by topics 6 and 7, and an electron-configuration engine.
//
// Sources (checked 2026-11-18):
//   r    bonding atomic radius in pm. Periods 1–5 as in Lecture 6 p. 29 (Brown Fig. 7.7), which are the
//        covalent radii of Cordero et al., Dalton Trans. 2008, 2832. Period 6 from the same paper.
//   ie   first ionization energy in kJ/mol, NIST Atomic Spectra Database, rounded.
//   ea   electron affinity in kJ/mol with Brown's sign convention (energy change for X(g) + e⁻ → X⁻(g)),
//        as in Brown Fig. 7.12, main groups, periods 1–5 only. 'pos' means "> 0" (the anion is unstable).
//   en   Pauling electronegativity exactly as in Lecture 7 p. 13 (Brown Fig. 8.8, one decimal).
// null means "not shown": the lecture figures do not give a value.

const RAW = `
1 H Hydrogen 1 1 31 1312 -73 2.1
2 He Helium 1 18 28 2372 pos -
3 Li Lithium 2 1 128 520 -60 1.0
4 Be Beryllium 2 2 96 899 pos 1.5
5 B Boron 2 13 84 801 -27 2.0
6 C Carbon 2 14 76 1086 -122 2.5
7 N Nitrogen 2 15 71 1402 pos 3.0
8 O Oxygen 2 16 66 1314 -141 3.5
9 F Fluorine 2 17 57 1681 -328 4.0
10 Ne Neon 2 18 58 2081 pos -
11 Na Sodium 3 1 166 496 -53 0.9
12 Mg Magnesium 3 2 141 738 pos 1.2
13 Al Aluminium 3 13 121 578 -43 1.5
14 Si Silicon 3 14 111 787 -134 1.8
15 P Phosphorus 3 15 107 1012 -72 2.1
16 S Sulfur 3 16 105 1000 -200 2.5
17 Cl Chlorine 3 17 102 1251 -349 3.0
18 Ar Argon 3 18 106 1521 pos -
19 K Potassium 4 1 203 419 -48 0.8
20 Ca Calcium 4 2 176 590 -2 1.0
21 Sc Scandium 4 3 170 633 - 1.3
22 Ti Titanium 4 4 160 659 - 1.5
23 V Vanadium 4 5 153 651 - 1.6
24 Cr Chromium 4 6 139 653 - 1.6
25 Mn Manganese 4 7 139 717 - 1.5
26 Fe Iron 4 8 132 762 - 1.8
27 Co Cobalt 4 9 126 760 - 1.9
28 Ni Nickel 4 10 124 737 - 1.9
29 Cu Copper 4 11 132 745 - 1.9
30 Zn Zinc 4 12 122 906 - 1.6
31 Ga Gallium 4 13 122 579 -30 1.6
32 Ge Germanium 4 14 120 762 -119 1.8
33 As Arsenic 4 15 119 947 -78 2.0
34 Se Selenium 4 16 120 941 -195 2.4
35 Br Bromine 4 17 120 1140 -325 2.8
36 Kr Krypton 4 18 116 1351 pos -
37 Rb Rubidium 5 1 220 403 -47 0.8
38 Sr Strontium 5 2 195 550 -5 1.0
39 Y Yttrium 5 3 190 600 - 1.2
40 Zr Zirconium 5 4 175 640 - 1.4
41 Nb Niobium 5 5 164 652 - 1.6
42 Mo Molybdenum 5 6 154 684 - 1.8
43 Tc Technetium 5 7 147 702 - 1.9
44 Ru Ruthenium 5 8 146 710 - 2.2
45 Rh Rhodium 5 9 142 720 - 2.2
46 Pd Palladium 5 10 139 804 - 2.2
47 Ag Silver 5 11 145 731 - 1.9
48 Cd Cadmium 5 12 144 868 - 1.7
49 In Indium 5 13 142 558 -30 1.7
50 Sn Tin 5 14 139 709 -107 1.8
51 Sb Antimony 5 15 139 834 -103 1.9
52 Te Tellurium 5 16 138 869 -190 2.1
53 I Iodine 5 17 139 1008 -295 2.5
54 Xe Xenon 5 18 140 1170 pos -
55 Cs Caesium 6 1 244 376 - 0.7
56 Ba Barium 6 2 215 503 - 0.9
57 La Lanthanum 6 3 207 538 - 1.0
58 Ce Cerium 6 f - 534 - -
59 Pr Praseodymium 6 f - 527 - -
60 Nd Neodymium 6 f - 533 - -
61 Pm Promethium 6 f - 540 - -
62 Sm Samarium 6 f - 545 - -
63 Eu Europium 6 f - 547 - -
64 Gd Gadolinium 6 f - 593 - -
65 Tb Terbium 6 f - 566 - -
66 Dy Dysprosium 6 f - 573 - -
67 Ho Holmium 6 f - 581 - -
68 Er Erbium 6 f - 589 - -
69 Tm Thulium 6 f - 597 - -
70 Yb Ytterbium 6 f - 603 - -
71 Lu Lutetium 6 f - 524 - -
72 Hf Hafnium 6 4 175 659 - 1.3
73 Ta Tantalum 6 5 170 761 - 1.5
74 W Tungsten 6 6 162 770 - 1.7
75 Re Rhenium 6 7 151 760 - 1.9
76 Os Osmium 6 8 144 840 - 2.2
77 Ir Iridium 6 9 141 880 - 2.2
78 Pt Platinum 6 10 136 870 - 2.2
79 Au Gold 6 11 136 890 - 2.4
80 Hg Mercury 6 12 132 1007 - 1.9
81 Tl Thallium 6 13 145 589 - 1.8
82 Pb Lead 6 14 146 716 - 1.9
83 Bi Bismuth 6 15 148 703 - 1.9
84 Po Polonium 6 16 140 812 - 2.0
85 At Astatine 6 17 150 899 - 2.2
86 Rn Radon 6 18 150 1037 - -
`;

const num = s => (s === '-' ? null : s === 'pos' ? 'pos' : Number(s));

export const ELEMENTS = RAW.trim().split('\n').map(line => {
  const [Z, sym, name, period, group, r, ie, ea, en] = line.trim().split(/\s+/);
  return {
    Z: +Z, sym, name, period: +period,
    group: group === 'f' ? null : +group,
    fblock: group === 'f',
    r: num(r), ie: num(ie), ea: num(ea), en: num(en),
  };
});
export const BY_SYM = Object.fromEntries(ELEMENTS.map(e => [e.sym, e]));
export const byZ = Z => ELEMENTS[Z - 1];

// Position in an 18-column table; Ce–Lu go in a separate row (row 8) under groups 4–17, as in Brown.
export function cell(e) {
  if (e.fblock) return { row: 8, col: 4 + (e.Z - 58) };
  return { row: e.period, col: e.group };
}

/* ------------------------------------------------------------------ */
/* Electron configurations                                             */
/* ------------------------------------------------------------------ */

// Filling (Aufbau / Madelung) order, as on Lecture 6 p. 22–23.
export const ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p'];
export const CAP = { s: 2, p: 6, d: 10, f: 14 };
export const L_OF = { s: 0, p: 1, d: 2, f: 3 };
const NOBLE = [[2, 'He'], [10, 'Ne'], [18, 'Ar'], [36, 'Kr'], [54, 'Xe'], [86, 'Rn']];

// Measured ground states that differ from the filling order (Z ≤ 86). Lecture 6 p. 26: "Don't memorize! Just be aware."
export const EXCEPTIONS = {
  24: { '4s': 1, '3d': 5 },        // Cr
  29: { '4s': 1, '3d': 10 },       // Cu
  41: { '5s': 1, '4d': 4 },        // Nb
  42: { '5s': 1, '4d': 5 },        // Mo
  44: { '5s': 1, '4d': 7 },        // Ru
  45: { '5s': 1, '4d': 8 },        // Rh
  46: { '5s': 0, '4d': 10 },       // Pd
  47: { '5s': 1, '4d': 10 },       // Ag
  57: { '4f': 0, '5d': 1 },        // La
  58: { '4f': 1, '5d': 1 },        // Ce
  64: { '4f': 7, '5d': 1 },        // Gd
  78: { '6s': 1, '5d': 9 },        // Pt
  79: { '6s': 1, '5d': 10 },       // Au
};

// Occupancy by filling order only: { '1s': 2, ... } (in ORDER)
export function aufbau(Z) {
  const occ = {};
  let left = Z;
  for (const sub of ORDER) {
    if (left <= 0) break;
    const k = Math.min(left, CAP[sub[1]]);
    occ[sub] = k; left -= k;
  }
  return occ;
}

// Actual ground-state occupancy (applies the exceptions above)
export function groundState(Z) {
  const occ = aufbau(Z);
  if (EXCEPTIONS[Z]) Object.assign(occ, EXCEPTIONS[Z]);
  for (const k of Object.keys(occ)) if (!occ[k]) delete occ[k];
  return occ;
}

const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => String(n).split('').map(c => SUPS[c]).join('');

// Subshells written in filling order, the way the lecture and the problem-set solutions write them:
// Se = [Ar] 4s² 3d¹⁰ 4p⁴, Pb = [Xe] 6s² 4f¹⁴ 5d¹⁰ 6p².
export function configString(occ, { from = 0, html = false } = {}) {
  return ORDER.slice(from).filter(s => occ[s]).map(s => html ? `${s}<sup>${occ[s]}</sup>` : s + sup(occ[s])).join(' ');
}

export function nobleCore(Z) {
  let core = null;
  for (const [zn, sym] of NOBLE) if (zn < Z) core = { Z: zn, sym };
  return core;
}

export function condensed(Z, opts = {}) {
  const occ = groundState(Z);
  const core = nobleCore(Z);
  if (!core) return configString(occ, opts);
  // drop the core's subshells: everything up to and including the core's last p (or 1s for He)
  const coreOcc = groundState(core.Z);
  const rest = {};
  for (const [s, k] of Object.entries(occ)) if (!(s in coreOcc)) rest[s] = k;
  return `[${core.sym}] ` + configString(rest, opts);
}

// Unpaired electrons by Hund's rule, subshell by subshell
export function unpaired(occ) {
  let u = 0;
  for (const [s, k] of Object.entries(occ)) {
    const m = CAP[s[1]] / 2;
    u += k <= m ? k : 2 * m - k;
  }
  return u;
}

// Valence electrons (Lecture 6 p. 25): electrons in the outermost shell, plus any partly filled d or f subshell.
// Filled d and f subshells are not counted.
export function valence(occ) {
  const nmax = Math.max(...Object.keys(occ).map(s => +s[0]));
  let v = 0;
  for (const [s, k] of Object.entries(occ)) {
    const n = +s[0], t = s[1];
    if (n === nmax && (t === 's' || t === 'p')) v += k;
    else if ((t === 'd' || t === 'f') && k < CAP[t]) v += k;
  }
  return v;
}

export function block(e) {
  if (e.fblock) return 'f';
  if (e.Z === 2) return 's';
  if (e.group <= 2) return 's';
  if (e.group >= 13) return 'p';
  return 'd';
}

// Slater's-rules effective nuclear charge felt by the outermost s/p electron (main-group elements only).
// Brown 7.2: Z_eff = Z − S. Same (n s, n p) group: 0.35 each (0.30 within 1s); shell n−1: 0.85; deeper: 1.00.
export function zeffSlater(Z) {
  const e = byZ(Z);
  if (e.fblock || (e.group >= 3 && e.group <= 12)) return null;
  const occ = groundState(Z);
  const nmax = Math.max(...Object.keys(occ).map(s => +s[0]));
  let S = 0;
  for (const [s, k] of Object.entries(occ)) {
    const n = +s[0], t = s[1];
    if (n === nmax && (t === 's' || t === 'p')) S += (k - 0) * (nmax === 1 ? 0.30 : 0.35);
    else if (n === nmax - 1) S += k * 0.85;
    else if (n < nmax - 1) S += k * 1.0;
    else S += k * 1.0;   // (n−1)d and (n−2)f electrons lie inside the ns/np shell: they count as n−1 or deeper
  }
  // the electron itself is not counted: remove one "same group" contribution
  S -= nmax === 1 ? 0.30 : 0.35;
  return Math.round((Z - S) * 100) / 100;
}
