// Thermodynamic data and helpers shared by topics 4 and 5 (Thermodynamics I and II).
//
// Standard values at 298.15 K, copied from Brown et al., Appendix C
// ("Thermodynamic quantities for selected substances at 298.15 K").
//   H: ΔH°f (kJ/mol)   G: ΔG°f (kJ/mol)   S: S° (J mol⁻¹ K⁻¹)

export const R = 8.314;          // J mol⁻¹ K⁻¹
export const T0 = 298.15;        // K

export const SPECIES = {
  'H2(g)':        { f: 'H₂(g)',        H: 0,        G: 0,        S: 130.58 },
  'H(g)':         { f: 'H(g)',         H: 217.94,   G: 203.26,   S: 114.60 },
  'O2(g)':        { f: 'O₂(g)',        H: 0,        G: 0,        S: 205.0 },
  'O3(g)':        { f: 'O₃(g)',        H: 142.3,    G: 163.4,    S: 237.6 },
  'N2(g)':        { f: 'N₂(g)',        H: 0,        G: 0,        S: 191.50 },
  'C(graphite)':  { f: 'C(s, graphite)', H: 0,      G: 0,        S: 5.69 },
  'C(diamond)':   { f: 'C(s, diamond)',  H: 1.88,   G: 2.84,     S: 2.43 },
  'CO(g)':        { f: 'CO(g)',        H: -110.5,   G: -137.2,   S: 197.9 },
  'CO2(g)':       { f: 'CO₂(g)',       H: -393.5,   G: -394.4,   S: 213.6 },
  'CH4(g)':       { f: 'CH₄(g)',       H: -74.8,    G: -50.8,    S: 186.3 },
  'C2H2(g)':      { f: 'C₂H₂(g)',      H: 226.77,   G: 209.2,    S: 200.8 },
  'C2H4(g)':      { f: 'C₂H₄(g)',      H: 52.30,    G: 68.11,    S: 219.4 },
  'C2H6(g)':      { f: 'C₂H₆(g)',      H: -84.68,   G: -32.89,   S: 229.5 },
  'C3H8(g)':      { f: 'C₃H₈(g)',      H: -103.85,  G: -23.47,   S: 269.9 },
  'C4H10(g)':     { f: 'C₄H₁₀(g)',     H: -124.73,  G: -15.71,   S: 310.0 },
  'CH3OH(l)':     { f: 'CH₃OH(l)',     H: -238.6,   G: -166.23,  S: 126.8 },
  'CH3OH(g)':     { f: 'CH₃OH(g)',     H: -201.2,   G: -161.9,   S: 237.6 },
  'C2H5OH(l)':    { f: 'C₂H₅OH(l)',    H: -277.7,   G: -174.76,  S: 160.7 },
  'C6H12O6(s)':   { f: 'C₆H₁₂O₆(s)',   H: -1273.02, G: -910.4,   S: 212.1 },
  'H2O(l)':       { f: 'H₂O(l)',       H: -285.83,  G: -237.13,  S: 69.91 },
  'H2O(g)':       { f: 'H₂O(g)',       H: -241.82,  G: -228.57,  S: 188.83 },
  'NH3(g)':       { f: 'NH₃(g)',       H: -46.19,   G: -16.66,   S: 192.5 },
  'NO(g)':        { f: 'NO(g)',        H: 90.37,    G: 86.71,    S: 210.62 },
  'NO2(g)':       { f: 'NO₂(g)',       H: 33.84,    G: 51.84,    S: 240.45 },
  'N2O4(g)':      { f: 'N₂O₄(g)',      H: 9.66,     G: 98.28,    S: 304.3 },
  'CaCO3(s)':     { f: 'CaCO₃(s)',     H: -1207.1,  G: -1128.76, S: 92.88 },
  'CaO(s)':       { f: 'CaO(s)',       H: -635.5,   G: -604.17,  S: 39.75 },
  'Fe(s)':        { f: 'Fe(s)',        H: 0,        G: 0,        S: 27.15 },
  'Fe2O3(s)':     { f: 'Fe₂O₃(s)',     H: -822.16,  G: -740.98,  S: 89.96 },
  'Al(s)':        { f: 'Al(s)',        H: 0,        G: 0,        S: 28.32 },
  'Al2O3(s)':     { f: 'Al₂O₃(s)',     H: -1669.8,  G: -1576.5,  S: 51.00 },
  'Br2(l)':       { f: 'Br₂(l)',       H: 0,        G: 0,        S: 152.3 },
  'Br2(g)':       { f: 'Br₂(g)',       H: 30.71,    G: 3.14,     S: 245.3 },
  'Na(s)':        { f: 'Na(s)',        H: 0,        G: 0,        S: 51.45 },
  'Cl2(g)':       { f: 'Cl₂(g)',       H: 0,        G: 0,        S: 222.96 },
  'NaCl(s)':      { f: 'NaCl(s)',      H: -410.9,   G: -384.0,   S: 72.33 },
  'Na+(aq)':      { f: 'Na⁺(aq)',      H: -240.1,   G: -261.9,   S: 59.0 },
  'Cl-(aq)':      { f: 'Cl⁻(aq)',      H: -167.2,   G: -131.2,   S: 56.5 },
};

// Reactions as { species: coefficient }, negative = reactant.
// `phys` marks physical changes. `note` is shown under the calculator.
export const REACTIONS = [
  { id: 'propane', name: 'Burning propane (lecture)', eq: { 'C3H8(g)': -1, 'O2(g)': -5, 'CO2(g)': 3, 'H2O(l)': 4 },
    note: 'The lecture example. A camping-stove gas: about 2220 kJ for every mole (44 g) burned.' },
  { id: 'methane', name: 'Burning methane (natural gas)', eq: { 'CH4(g)': -1, 'O2(g)': -2, 'CO2(g)': 1, 'H2O(l)': 2 },
    note: 'Natural gas in a kitchen or a power plant.' },
  { id: 'hydrogen', name: 'Burning hydrogen', eq: { 'H2(g)': -2, 'O2(g)': -1, 'H2O(l)': 2 },
    note: 'The lecture\'s opening example. Compare with Hess\'s law below: −571.6 kJ from −483.6 kJ and 2 × (−44.0 kJ).' },
  { id: 'glucose', name: 'Burning glucose (respiration)', eq: { 'C6H12O6(s)': -1, 'O2(g)': -6, 'CO2(g)': 6, 'H2O(l)': 6 },
    note: 'Your cells run this reaction in many small steps; by Hess\'s law the total is the same as in a flame.' },
  { id: 'thermite', name: 'Thermite (Fe₂O₃ + Al)', eq: { 'Fe2O3(s)': -1, 'Al(s)': -2, 'Al2O3(s)': 1, 'Fe(s)': 2 },
    note: 'Hot enough to melt the iron it makes. Used to weld railway tracks.' },
  { id: 'haber', name: 'Ammonia synthesis (Haber)', eq: { 'N2(g)': -1, 'H2(g)': -3, 'NH3(g)': 2 },
    note: 'Fertiliser for half of the world\'s food.' },
  { id: 'lime', name: 'Making lime (CaCO₃ → CaO + CO₂)', eq: { 'CaCO3(s)': -1, 'CaO(s)': 1, 'CO2(g)': 1 },
    note: 'Heating limestone in a kiln, the first step in making cement.' },
  { id: 'no2', name: 'NO₂ dimerising (2 NO₂ → N₂O₄)', eq: { 'NO2(g)': -2, 'N2O4(g)': 1 },
    note: 'Brown NO₂ turns into colourless N₂O₄ when cooled.' },
  { id: 'ozone', name: 'Ozone decomposing (2 O₃ → 3 O₂)', eq: { 'O3(g)': -2, 'O2(g)': 3 }, note: 'Lecture 5, example 1.' },
  { id: 'diamond', name: 'Diamond → graphite', eq: { 'C(diamond)': -1, 'C(graphite)': 1 },
    note: 'Spontaneous at room temperature, yet diamonds last for billions of years: spontaneous does not mean fast.' },
  { id: 'vapwater', name: 'Water evaporating at 25 °C', eq: { 'H2O(l)': -1, 'H2O(g)': 1 }, phys: true,
    note: 'A physical change: the same formula on both sides, only the state changes.' },
  { id: 'vapbr2', name: 'Bromine evaporating', eq: { 'Br2(l)': -1, 'Br2(g)': 1 }, phys: true,
    note: 'Br₂ is one of only two elements that are liquid at room temperature.' },
  { id: 'vapmeoh', name: 'Methanol evaporating', eq: { 'CH3OH(l)': -1, 'CH3OH(g)': 1 }, phys: true,
    note: 'A physical change.' },
  { id: 'nacl', name: 'Dissolving NaCl in water', eq: { 'NaCl(s)': -1, 'Na+(aq)': 1, 'Cl-(aq)': 1 }, phys: true,
    note: 'The same small ΔH as on the week 9 page: dissolving salt is driven by entropy.' },
];

export const byId = id => REACTIONS.find(r => r.id === id);

// Σ products − Σ reactants of a property ('H', 'G' or 'S')
export function sumProp(eq, prop) {
  let s = 0;
  for (const [sp, c] of Object.entries(eq)) s += c * SPECIES[sp][prop];
  return s;
}

// "a A + b B → c C" with nice coefficients (½ for 0.5 etc.)
export function coefText(c) {
  const a = Math.abs(c);
  const frac = { 0.5: '½', 1.5: '³⁄₂', 2.5: '⁵⁄₂', 0.25: '¼' }[a];
  if (frac) return frac + ' ';
  return a === 1 ? '' : `${+a.toFixed(3)} `;
}
export function eqText(eq, names = sp => (SPECIES[sp] ? SPECIES[sp].f : sp)) {
  const lhs = [], rhs = [];
  for (const [sp, c] of Object.entries(eq)) {
    if (Math.abs(c) < 1e-9) continue;
    (c < 0 ? lhs : rhs).push(coefText(c) + names(sp));
  }
  return `${lhs.join(' + ') || '—'} → ${rhs.join(' + ') || '—'}`;
}

// Number with a sign and fixed decimals, proper minus: sgn(-3.2, 1) → '−3.2', sgn(4) → '+4'
export const sgn = (x, d = 1) => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(d);

// S° as printed in the table: keep at least one decimal (310 → '310.0')
export const fmtS = x => (Number.isInteger(x) ? x.toFixed(1) : String(x));
