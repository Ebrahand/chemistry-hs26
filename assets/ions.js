// Common ions (Brown Tables 2.4 and 2.5, plus a few oxyanions from Brown 2.8), ionic-compound formulas and names,
// and the solubility guidelines of Brown Table 4.1 (Lecture 3 p. 14). Shared by topics 1 and 3.

import { gcd } from './formula.js';

// f: formula without charge; q: charge; name: Brown's name (Stock name first where there is a choice);
// poly: polyatomic (needs brackets when there is more than one); old: the older -ous/-ic name.
export const CATIONS = [
  { f: 'H', q: 1, name: 'hydrogen' },
  { f: 'Li', q: 1, name: 'lithium', alkali: true },
  { f: 'Na', q: 1, name: 'sodium', alkali: true },
  { f: 'K', q: 1, name: 'potassium', alkali: true },
  { f: 'Cs', q: 1, name: 'cesium', alkali: true },
  { f: 'Ag', q: 1, name: 'silver' },
  { f: 'NH4', q: 1, name: 'ammonium', poly: true },
  { f: 'Cu', q: 1, name: 'copper(I)', old: 'cuprous' },
  { f: 'Mg', q: 2, name: 'magnesium' },
  { f: 'Ca', q: 2, name: 'calcium' },
  { f: 'Sr', q: 2, name: 'strontium' },
  { f: 'Ba', q: 2, name: 'barium' },
  { f: 'Zn', q: 2, name: 'zinc' },
  { f: 'Cd', q: 2, name: 'cadmium' },
  { f: 'Cu', q: 2, name: 'copper(II)', old: 'cupric' },
  { f: 'Fe', q: 2, name: 'iron(II)', old: 'ferrous' },
  { f: 'Co', q: 2, name: 'cobalt(II)', old: 'cobaltous' },
  { f: 'Ni', q: 2, name: 'nickel(II)', old: 'nickelous' },
  { f: 'Mn', q: 2, name: 'manganese(II)', old: 'manganous' },
  { f: 'Pb', q: 2, name: 'lead(II)', old: 'plumbous' },
  { f: 'Sn', q: 2, name: 'tin(II)', old: 'stannous' },
  { f: 'Hg', q: 2, name: 'mercury(II)', old: 'mercuric' },
  { f: 'Hg2', q: 2, name: 'mercury(I)', old: 'mercurous', poly: true },
  { f: 'Al', q: 3, name: 'aluminium' },
  { f: 'Cr', q: 3, name: 'chromium(III)', old: 'chromic' },
  { f: 'Fe', q: 3, name: 'iron(III)', old: 'ferric' },
];

export const ANIONS = [
  { f: 'F', q: -1, name: 'fluoride' },
  { f: 'Cl', q: -1, name: 'chloride' },
  { f: 'Br', q: -1, name: 'bromide' },
  { f: 'I', q: -1, name: 'iodide' },
  { f: 'OH', q: -1, name: 'hydroxide', poly: true },
  { f: 'CN', q: -1, name: 'cyanide', poly: true },
  { f: 'NO3', q: -1, name: 'nitrate', poly: true },
  { f: 'NO2', q: -1, name: 'nitrite', poly: true },
  { f: 'CH3COO', q: -1, name: 'acetate', poly: true },
  { f: 'ClO4', q: -1, name: 'perchlorate', poly: true },
  { f: 'ClO3', q: -1, name: 'chlorate', poly: true },
  { f: 'MnO4', q: -1, name: 'permanganate', poly: true },
  { f: 'HCO3', q: -1, name: 'hydrogen carbonate', poly: true },
  { f: 'O', q: -2, name: 'oxide' },
  { f: 'S', q: -2, name: 'sulfide' },
  { f: 'O2', q: -2, name: 'peroxide', poly: true },
  { f: 'SO4', q: -2, name: 'sulfate', poly: true },
  { f: 'SO3', q: -2, name: 'sulfite', poly: true },
  { f: 'CO3', q: -2, name: 'carbonate', poly: true },
  { f: 'CrO4', q: -2, name: 'chromate', poly: true },
  { f: 'Cr2O7', q: -2, name: 'dichromate', poly: true },
  { f: 'N', q: -3, name: 'nitride' },
  { f: 'PO4', q: -3, name: 'phosphate', poly: true },
];

const sub = s => s.replace(/(\d+)/g, '<sub>$1</sub>');
export const chargeText = q => (Math.abs(q) === 1 ? '' : Math.abs(q)) + (q > 0 ? '+' : '−');
export const ionHTML = ion => `${sub(ion.f)}<sup>${chargeText(ion.q)}</sup>`;
export const ionText = ion => `${ion.f}${chargeText(ion.q)}`;

// Neutral formula of an ionic compound: how many of each ion, and the formula (plain and HTML).
export function compound(cat, an) {
  const L = Math.abs(cat.q * an.q) / gcd(cat.q, an.q);
  const nc = L / cat.q, na = L / Math.abs(an.q);
  const part = (ion, n, html) => {
    const f = html ? sub(ion.f) : ion.f;
    if (n === 1) return f;
    return ion.poly ? `(${f})${html ? `<sub>${n}</sub>` : n}` : `${f}${html ? `<sub>${n}</sub>` : n}`;
  };
  return {
    nc, na,
    text: part(cat, nc, false) + part(an, na, false),
    html: part(cat, nc, true) + part(an, na, true),
    name: `${cat.name} ${an.name}`,
  };
}

// Brown Table 4.1. Returns { soluble: bool, why: string }.
export function solubility(cat, an) {
  const isAlkaliOrNH4 = cat.alkali || cat.f === 'NH4';
  const name = an.name;
  if (cat.f === 'H') return { soluble: true, why: 'This is an acid, not a salt: it dissolves (and ionizes) in water.' };
  if (an.f === 'NO3') return { soluble: true, why: 'All nitrates are soluble (no exceptions).' };
  if (an.f === 'CH3COO') return { soluble: true, why: 'All acetates are soluble (no exceptions).' };
  if (['Cl', 'Br', 'I'].includes(an.f)) {
    const ex = ['Ag', 'Hg2', 'Pb'].includes(cat.f);
    return { soluble: !ex, why: ex ? `${name[0].toUpperCase() + name.slice(1)}s are soluble, except those of Ag⁺, Hg₂²⁺ and Pb²⁺. This is one of the exceptions.` : `${name[0].toUpperCase() + name.slice(1)}s are soluble (exceptions: Ag⁺, Hg₂²⁺, Pb²⁺).` };
  }
  if (an.f === 'SO4') {
    const ex = ['Sr', 'Ba', 'Hg2', 'Pb'].includes(cat.f);
    return { soluble: !ex, why: ex ? 'Sulfates are soluble, except those of Sr²⁺, Ba²⁺, Hg₂²⁺ and Pb²⁺. This is one of the exceptions.' : 'Sulfates are soluble (exceptions: Sr²⁺, Ba²⁺, Hg₂²⁺, Pb²⁺).' };
  }
  if (an.f === 'S' || an.f === 'OH') {
    const ex = isAlkaliOrNH4 || ['Ca', 'Sr', 'Ba'].includes(cat.f);
    const what = an.f === 'S' ? 'Sulfides' : 'Hydroxides';
    return { soluble: ex, why: ex ? `${what} are insoluble, except those of NH₄⁺, the alkali metals, Ca²⁺, Sr²⁺ and Ba²⁺. This is one of the exceptions.` : `${what} are insoluble (exceptions: NH₄⁺, alkali metals, Ca²⁺, Sr²⁺, Ba²⁺).` };
  }
  if (an.f === 'CO3' || an.f === 'PO4') {
    const what = an.f === 'CO3' ? 'Carbonates' : 'Phosphates';
    return { soluble: isAlkaliOrNH4, why: isAlkaliOrNH4 ? `${what} are insoluble, except those of NH₄⁺ and the alkali metals. This is one of the exceptions.` : `${what} are insoluble (exceptions: NH₄⁺ and the alkali metals).` };
  }
  if (isAlkaliOrNH4) return { soluble: true, why: 'Compounds of the alkali metals and of NH₄⁺ are soluble.' };
  return { soluble: null, why: 'Not covered by the solubility guidelines in Brown Table 4.1.' };
}
