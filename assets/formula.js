// Atomic weights and a chemical-formula parser, shared by topics 1 and 3.
//
// Atomic weights: IUPAC standard (abridged) values, as on the periodic table in Brown (inside front cover);
// K = 39.0983 as on Lecture 1 p. 29. Elements without stable isotopes: mass number of the longest-lived
// isotope, in brackets in Brown, here marked with `radio: true`.
//
//   parseFormula('Ca(NO3)2')      → { Ca: 1, N: 2, O: 6 }
//   molarMass('Ca(NO3)2')         → 164.09
//   formulaHTML('Ca(NO3)2')       → 'Ca(NO<sub>3</sub>)<sub>2</sub>'

export const AW = {
  H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.180,
  Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.948, K: 39.0983, Ca: 40.078,
  Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38,
  Ga: 69.723, Ge: 72.630, As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224,
  Nb: 92.906, Mo: 95.95, Tc: 98, Ru: 101.07, Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41, In: 114.82, Sn: 118.71,
  Sb: 121.76, Te: 127.60, I: 126.90, Xe: 131.29, Cs: 132.91, Ba: 137.33, La: 138.91, Ce: 140.12, Pr: 140.91, Nd: 144.24,
  Pm: 145, Sm: 150.36, Eu: 151.96, Gd: 157.25, Tb: 158.93, Dy: 162.50, Ho: 164.93, Er: 167.26, Tm: 168.93, Yb: 173.05,
  Lu: 174.97, Hf: 178.49, Ta: 180.95, W: 183.84, Re: 186.21, Os: 190.23, Ir: 192.22, Pt: 195.08, Au: 196.97, Hg: 200.59,
  Tl: 204.38, Pb: 207.2, Bi: 208.98, Po: 209, At: 210, Rn: 222,
};
export const RADIOACTIVE = new Set(['Tc', 'Pm', 'Po', 'At', 'Rn']);

// Parse a formula with optional parentheses and a hydrate dot: 'CuSO4·5H2O', 'Fe2(SO4)3', '(NH4)2HPO4'.
// Charges written at the end ('SO4^2-', 'NH4+') are ignored. Throws an Error with a readable message.
export function parseFormula(text) {
  let s = String(text).trim().replace(/\s+/g, '').replace(/[₀-₉]/g, c => String(c.charCodeAt(0) - 0x2080))
    .replace(/\^?[0-9]*[+−-]$/, '').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻]$/, '');
  if (!s) throw new Error('Type a formula, for example H2O or Ca(NO3)2.');
  const parts = s.split(/[·.*]/);
  const total = {};
  for (const part of parts) {
    const m = part.match(/^(\d*)(.*)$/);
    const mult = m[1] ? +m[1] : 1;
    const counts = parseGroup(m[2]);
    for (const [el, n] of Object.entries(counts)) total[el] = (total[el] || 0) + n * mult;
  }
  return total;
}

function parseGroup(s) {
  let i = 0;
  function readNum() {
    let d = '';
    while (i < s.length && /\d/.test(s[i])) d += s[i++];
    return d ? +d : 1;
  }
  function group(close) {
    const out = {};
    while (i < s.length) {
      const c = s[i];
      if (c === '(' || c === '[') {
        i++;
        const inner = group(c === '(' ? ')' : ']');
        const n = readNum();
        for (const [el, k] of Object.entries(inner)) out[el] = (out[el] || 0) + k * n;
      } else if (c === ')' || c === ']') {
        if (c !== close) throw new Error('The brackets do not match.');
        i++;
        return out;
      } else if (/[A-Z]/.test(c)) {
        let sym = c; i++;
        if (i < s.length && /[a-z]/.test(s[i])) sym += s[i++];
        if (!(sym in AW)) throw new Error(`“${sym}” is not an element symbol (check upper and lower case: Co is cobalt, CO is carbon monoxide).`);
        const n = readNum();
        out[sym] = (out[sym] || 0) + n;
      } else {
        throw new Error(`Cannot read “${c}”. Use element symbols, numbers and brackets, e.g. Al2(SO4)3.`);
      }
    }
    if (close) throw new Error('A bracket is not closed.');
    return out;
  }
  const r = group(null);
  if (!Object.keys(r).length) throw new Error('Type a formula, for example H2O or Ca(NO3)2.');
  return r;
}

export function molarMass(formulaOrCounts) {
  const c = typeof formulaOrCounts === 'string' ? parseFormula(formulaOrCounts) : formulaOrCounts;
  return Object.entries(c).reduce((m, [el, n]) => m + AW[el] * n, 0);
}

// 'Ca(NO3)2' → HTML with subscripts; a trailing charge such as '2-' or '+' becomes a superscript.
export function formulaHTML(f) {
  let s = String(f);
  let charge = '';
  const m = s.match(/\^([0-9]*[+-])$/);
  if (m) { charge = m[1].replace('-', '−'); s = s.slice(0, -m[0].length); }
  const body = s.replace(/(\d+)/g, (d, _x, off) => (off === 0 || /[·.]/.test(s[off - 1]) ? d : `<sub>${d}</sub>`)).replace(/[.*]/g, '·');
  return charge ? `${body}<sup>${charge}</sup>` : body;
}

// Greatest common divisor and least common multiple, for formulas and balancing
export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const lcm = (a, b) => (a / gcd(a, b)) * b;
