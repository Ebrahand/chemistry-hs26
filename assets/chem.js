// Physical data shared by the liquids (topic 8) and solutions (topic 9) pages.
// Every function takes T in kelvin and returns a pressure in pascal, unless noted.
//
// Sources of the equations (all checked against tabulated values, see the README):
//   water, liquid–vapour:  Wagner & Pruss (1993) saturation-pressure equation, IAPWS
//   water, ice Ih melting: IAPWS (2011) melting-pressure equation, valid 251.165–273.16 K
//   water, sublimation:    Clausius–Clapeyron from the triple point with ΔH_sub = 51.0 kJ/mol
//                          (gives 103.7 Pa at −20 °C; tabulated 103.3 Pa)
//   CO2:                   Span & Wagner (1996) ancillary equations
//   organic liquids:       Antoine equation, log10(P/torr) = A − B / (C + t/°C)

export const R = 8.314;          // J mol⁻¹ K⁻¹
export const ATM = 101325;       // Pa
export const K0 = 273.15;

export const water = {
  name: 'Water', formula: 'H₂O',
  Tt: 273.16, pt: 611.657,       // triple point
  Tc: 647.096, pc: 22.064e6,     // critical point
  meltTmin: 251.165,             // below this (above 209.9 MPa) other ice forms appear
  vap(T) {
    const tau = 1 - T / this.Tc;
    const a = [-7.85951783, 1.84408259, -11.7866497, 22.6807411, -15.9618719, 1.80122502];
    const e = [1, 1.5, 3, 3.5, 4, 7.5];
    let s = 0;
    for (let i = 0; i < 6; i++) s += a[i] * Math.pow(tau, e[i]);
    return this.pc * Math.exp((this.Tc / T) * s);
  },
  sub(T) { return this.pt * Math.exp(-51.0e3 / R * (1 / T - 1 / this.Tt)); },
  melt(T) {
    const th = T / this.Tt;
    return this.pt * (1 + 1.19539337e6 * (1 - th ** 3) + 8.08183159e4 * (1 - th ** 25.75) + 3.33826860e3 * (1 - th ** 103.75));
  },
};

export const co2 = {
  name: 'Carbon dioxide', formula: 'CO₂',
  Tt: 216.592, pt: 0.51795e6,
  Tc: 304.1282, pc: 7.3773e6,
  vap(T) {
    const tau = 1 - T / this.Tc;
    return this.pc * Math.exp((this.Tc / T) * (-7.0602087 * tau + 1.9391218 * tau ** 1.5 - 1.6463597 * tau ** 2 - 3.2995634 * tau ** 4));
  },
  sub(T) {
    const x = 1 - T / this.Tt;
    return this.pt * Math.exp((this.Tt / T) * (-14.740846 * x + 2.4327015 * x ** 1.9 - 5.3061778 * x ** 2.9));
  },
  melt(T) {
    const x = T / this.Tt - 1;
    return this.pt * (1 + 1955.5390 * x + 2055.4593 * x * x);
  },
};

const antoine = (A, B, C) => T => Math.pow(10, A - B / (C + (T - K0))) * ATM / 760;

// Four liquids with very different intermolecular forces (the set Brown uses for vapour pressure).
export const liquids = [
  { id: 'ether', name: 'Diethyl ether', formula: 'C₂H₅OC₂H₅', color: '--c0', dash: [],
    forces: 'dispersion + weak dipole–dipole', P: antoine(6.92032, 1064.07, 228.80) },
  { id: 'ethanol', name: 'Ethanol', formula: 'C₂H₅OH', color: '--c3', dash: [8, 5],
    forces: 'one O–H per molecule: hydrogen bonds', P: antoine(8.20417, 1642.89, 230.300) },
  { id: 'water', name: 'Water', formula: 'H₂O', color: '--c1', dash: [2, 4],
    forces: 'two O–H per molecule: an H-bond network', P: T => water.vap(T) },
  { id: 'glycol', name: 'Ethylene glycol', formula: 'HOCH₂CH₂OH', color: '--c2', dash: [12, 4, 2, 4],
    forces: 'two O–H and a bigger molecule', P: antoine(8.09083, 2088.936, 203.4545) },
];

// Solve f(T) = target for T between lo and hi (f increasing). Returns NaN if not bracketed.
export function solveT(f, target, lo, hi) {
  if (!(f(lo) <= target && f(hi) >= target)) return NaN;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    if (f(m) < target) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}
// Same, for a decreasing f (water's melting line).
export function solveTdec(f, target, lo, hi) {
  if (!(f(lo) >= target && f(hi) <= target)) return NaN;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    if (f(m) > target) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

// Pressure with unit that reads well: 612 Pa, 3.17 kPa, 22.1 MPa
export function fmtP(p) {
  if (!Number.isFinite(p)) return '—';
  if (p >= 1e6) return `${(p / 1e6).toPrecision(3)} MPa`;
  if (p >= 1e3) return `${(p / 1e3).toPrecision(3)} kPa`;
  return `${p.toPrecision(3)} Pa`;
}
