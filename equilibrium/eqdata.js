// Equilibria for the week 12 page. K at 298.15 K from ΔG° with Brown Appendix C data (assets/thermo.js).
// eq: { species: coefficient }, negative = reactant. Phase is read from the species key: (g), (l), (s), (aq).

import { SPECIES, sumProp } from '../assets/thermo.js';

export const R = 8.314;            // J mol⁻¹ K⁻¹
export const RL = 0.08314;         // L bar mol⁻¹ K⁻¹
export const T0 = 298.15;

export const EQUILIBRIA = [
  { id: 'haber', name: 'Ammonia synthesis (Haber)', eq: { 'N2(g)': -1, 'H2(g)': -3, 'NH3(g)': 2 } },
  { id: 'n2o4', name: 'N₂O₄ ⇌ 2 NO₂', eq: { 'N2O4(g)': -1, 'NO2(g)': 2 } },
  { id: 'lime', name: 'Lime burning (CaCO₃ ⇌ CaO + CO₂)', eq: { 'CaCO3(s)': -1, 'CaO(s)': 1, 'CO2(g)': 1 } },
  { id: 'water', name: 'Water evaporating', eq: { 'H2O(l)': -1, 'H2O(g)': 1 } },
  { id: 'nacl', name: 'Saturated NaCl solution', eq: { 'NaCl(s)': -1, 'Na+(aq)': 1, 'Cl-(aq)': 1 } },
  { id: 'ozone', name: 'Ozone ⇌ oxygen', eq: { 'O3(g)': -2, 'O2(g)': 3 } },
  { id: 'reform', name: 'Steam reforming of methane', eq: { 'CH4(g)': -1, 'H2O(g)': -1, 'CO(g)': 1, 'H2(g)': 3 } },
];

export const phase = sp => sp.match(/\((\w+)\)$/)[1];
export const formula = sp => SPECIES[sp].f.replace(/\((g|l|s|aq)\)$/, '');
export const dG = eq => sumProp(eq, 'G');                       // kJ
export const Kof = eq => Math.exp(-dG(eq) * 1000 / (R * T0));
export const dn = eq => Object.entries(eq).reduce((s, [sp, c]) => s + (phase(sp) === 'g' ? c : 0), 0);
