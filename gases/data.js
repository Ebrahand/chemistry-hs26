// Gas data shared by the topic 2 modules.
// M: molar mass (g/mol). a (L² kPa mol⁻²) and b (L mol⁻¹): van der Waals constants, Brown Table 10.3 (Lecture 2 p. 29).

export const R = 8.314;            // J mol⁻¹ K⁻¹ = L kPa mol⁻¹ K⁻¹
export const KB = 1.380649e-23;    // J/K

export const GASES = {
  He: { name: 'helium', M: 4.003, a: 3.46, b: 0.02370 },
  Ne: { name: 'neon', M: 20.18, a: 21.4, b: 0.0171 },
  Ar: { name: 'argon', M: 39.95, a: 135, b: 0.0322 },
  Kr: { name: 'krypton', M: 83.80, a: 235, b: 0.0398 },
  Xe: { name: 'xenon', M: 131.29, a: 425, b: 0.0510 },
  H2: { name: 'hydrogen', M: 2.016, a: 24.7, b: 0.0266 },
  N2: { name: 'nitrogen', M: 28.01, a: 141, b: 0.0391 },
  O2: { name: 'oxygen', M: 32.00, a: 138, b: 0.0318 },
  F2: { name: 'fluorine', M: 38.00, a: 107, b: 0.0290 },
  Cl2: { name: 'chlorine', M: 70.90, a: 658, b: 0.0562 },
  H2O: { name: 'water vapour', M: 18.02, a: 553, b: 0.0305 },
  NH3: { name: 'ammonia', M: 17.03, a: 423, b: 0.0371 },
  CH4: { name: 'methane', M: 16.04, a: 228, b: 0.0428 },
  CO2: { name: 'carbon dioxide', M: 44.01, a: 364, b: 0.0427 },
  CCl4: { name: 'carbon tetrachloride', M: 153.82, a: 2067, b: 0.1383 },
};
export const AIR_M = 28.97;

const SUB = '₀₁₂₃₄₅₆₇₈₉';
export const uni = f => f.replace(/\d/g, d => SUB[d]);
export const fHTML = f => f.replace(/(\d+)/g, '<sub>$1</sub>');
