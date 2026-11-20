# Chemistry HS26 — interactive companion

Interactive pages for the ETH Zurich D-MAVT first-year Chemistry course (HS26).
A static site: plain HTML, CSS and JavaScript, with no build step and no server code.
Nothing a student does on the site is recorded or sent anywhere.

## Structure

```
index.html            landing page, one row per syllabus topic
assets/style.css      shared styles (light and dark mode)
assets/plot.js        small canvas plotting helper (no dependencies)
assets/quiz.js        self-check questions
assets/format.js      number and unit formatting
assets/chem.js        physical data shared by topics 8 and 9 (vapour pressures, phase boundaries)
assets/elements.js    element data for topics 6 and 7 (radii, I₁, EA, electronegativity) and electron configurations
assets/ptable.js      clickable periodic table (Z = 1–86)
assets/thermo.js      ΔH°f, ΔG°f, S° (Brown Appendix C) and reactions shared by topics 4 and 5
assets/formula.js     atomic weights (Z = 1–86), formula parser, molar mass, formula HTML; topics 1 and 3
assets/ions.js        common ions (Brown Tables 2.4, 2.5), ionic formulas and names, solubility guidelines (Brown Table 4.1)
atoms/                topic 1, Atoms, molecules, reactions (Brown 1.1–1.3, 1.5–1.7, 2.1, 2.3–2.8, 3.1–3.7)
  matter.js           classify particle pictures, dimensional-analysis chain, significant figures
  atom.js             build an atom (Z ≤ 30, stable isotopes), atomic weight from isotope abundances
  compounds.js        periodic table (metal / metalloid / nonmetal), ionic-compound builder, name → formula practice
  balance.js          balancing with coefficient steppers and atom-count bars; the algebra method
  mole.js             molar mass and mass %, grams ⇄ moles ⇄ particles, empirical formula from mass %
  limiting.js         limiting reactant with molecule pictures, then with grams; theoretical and percent yield
gases/                topic 2, Gases (Brown 10.1–10.8)
  data.js             molar masses and van der Waals a, b (Brown Table 10.3)
  pressure.js         barometer: column height of Hg, glycerol or water at any altitude (standard atmosphere)
  laws.js             piston simulation for Boyle, Charles and Avogadro with live plots
  igl.js              PV = nRT calculator with units; gas densities and floating balloons
  dalton.js           N₂/O₂/Ar mixture: partial pressures and mole fractions
  speeds.js           Maxwell–Boltzmann speed distributions (u_mp, u_av, u_rms); mean free path against pressure
  real.js             compressibility factor Z against P from van der Waals, a and b effects separately
aqueous/              topic 3, Reactions in aqueous solutions (Brown 4.1–4.5)
  electrolytes.js     conductivity tester with particle pictures (strong, weak, nonelectrolytes)
  precipitation.js    clickable solubility grid; mix two solutions: molecular, complete ionic and net ionic equations
  acids.js            neutralization with amounts in mmol; salt formed, what is left over
  redox.js            oxidation-number practice with the rules applied step by step
  activity.js         activity series (Brown Table 4.5): metal in a solution of ions or acid
  molarity.js         molarity from mass and volume; dilution M₁V₁ = M₂V₂
thermo-1/             topic 4, Thermodynamics I (Brown 5.1–5.7)
  firstlaw.js         ΔE = q + w with heat and work arrows; battery example for state functions
  piston.js           reaction in a cylinder at 1 atm: w = −PΔV, ΔH = q_p, ΔE = ΔH + w
  reaction.js         thermochemical equation as a conversion factor (H2 + O2, vapour or liquid, either way)
  calorimeter.js      coffee-cup calorimeter: final temperature, q of metal, water and cup
  hess.js             Hess's-law puzzles with an enthalpy staircase
  formation.js        ΔH°rxn from ΔH°f with the "via the elements" diagram
thermo-2/             topic 5, Thermodynamics II (Brown 19.1–19.6)
  marbles.png         the TA's marble figure (energy, entropy, both together), from "Entropy marble figures/"
  secondlaw.js        ice melting with surroundings at any T: ΔS_sys, ΔS_surr, ΔS_univ
  microstates.js      molecules in a two-half box, W = C(N, n), S = k ln W
  entropy.js          S° comparison table, "predict the sign of ΔS" exercise
  gibbs.js            ΔH°, ΔS°, ΔG° from Appendix C, check ΔG° = ΔH° − TΔS°, ΔS_univ
  temperature.js      ΔG against T, the four cases, crossover temperature
electrons/            topic 6, Electronic structure; periodic properties
  light.js            wavelength, frequency, photon energy across the EM spectrum
  hydrogen.js         H line spectrum, Bohr levels and transitions, uncertainty principle
  orbitals.js         exact hydrogen orbitals as a rotatable 3D cloud, radial probability, quantum-number checker
  config.js           configurations Z = 1–86 with orbital boxes, box-filling exercise (Aufbau, Pauli, Hund)
  trends.js           Z_eff, property map, successive ionization energies, ionic radii to scale, compare-two-atoms exercise
bonding/              topic 7, Chemical bonding; molecular geometry
  molecules.js        Lewis-structure library (44 species); formal charges, oxidation numbers, VSEPR computed from it
  lewis.js            Lewis-structure renderer and step-by-step explorer, resonance and formal-charge comparison
  ionic.js            lattice energy against Coulomb's law, Born–Haber cycle (NaCl, RbCl)
  polarity.js         electronegativity difference and bond polarity, hydrogen-halide partial charges
  energy.js           reaction enthalpy from bond enthalpies, bond length against bond enthalpy
  vsepr.js            rotatable VSEPR geometries, "predict the shape" exercise
liquids/              topic 8, Liquids and intermolecular forces
  md.js               toy 2D molecular dynamics: attraction vs temperature
  forces.js           dispersion animation, "which forces?" flowchart, hydride boiling points, ranking exercise
  vapour.js           vapour pressure, boiling at altitude, Clausius–Clapeyron view
  heating.js          heating/cooling curve of water with a step-by-step heat calculation
  phase.js            real-data phase diagrams of H2O and CO2 (log pressure axis)
solutions/            topic 9, Properties of solutions
  dissolve.js         three-step enthalpy diagram, alcohol solubility table
  henry.js            Henry's law bottle, O2 solubility against temperature
  units.js            concentration-unit converter with the working shown
  colligative.js      Raoult's law, why ΔTb/ΔTf happen (real water curves), ΔT = i·K·m for several solvents
  osmosis.js          osmotic pressure, reverse osmosis, red blood cell
kinetics-1/           topic 10, Chemical kinetics I
  index.html          page text, equations (KaTeX), controls
  rate.js             module 1: particle simulation, average vs instantaneous rate, stoichiometry
  ratelaw.js          module 2: order explorer and initial-rates lab
  orders.js           module 3: zero/first/second order over time
  detective.js        "what order is it?" exercise
  ode.js              module 4: slope field and Euler's method
```

Equations are rendered with KaTeX 0.16.11, loaded from cdn.jsdelivr.net.

Data in `assets/elements.js`: radii as in Lecture 6 (Brown Fig. 7.7 = Cordero et al. 2008), I₁ from NIST,
EA from Brown Fig. 7.12, electronegativities exactly as in Lecture 7 (one decimal). `bonding/molecules.js` checks
itself on load (`validate()`: electron counts, formal charges and oxidation numbers add up); errors go to the console.

Data in `assets/formula.js`: IUPAC standard atomic weights as on Brown's periodic table (K = 39.0983 as in Lecture 1).
`assets/ions.js` follows Brown Tables 2.4, 2.5 and 4.1 exactly. Isotope masses and abundances on the topic 1 page: IUPAC/NIST.
Van der Waals constants (topic 2): Brown Table 10.3 in kPa units, as shown in Lecture 2. Activity series (topic 3): Brown
Table 4.5. Problem-set items are left out of the practice tools (PS1 Q4 compounds, PS3 Q4 species).

Data in `assets/thermo.js`: copied from Brown Appendix C (the polybox PDF of the textbook), checked against the
problem-set solutions (e.g. ΔS° of the Haber reaction −198.2 J/K, propane combustion −2220 kJ). Specific heats on the
topic 4 page: Brown Table 5.2 (Al, Fe, water) and handbook values (Cu 0.385, Au 0.129 J g⁻¹ K⁻¹).
`assets/quiz.js` skips `.quiz[data-custom]` blocks, which run their own logic (the ΔS sign exercise).

Data in `assets/chem.js`: water saturation pressure (Wagner & Pruss / IAPWS), ice melting curve (IAPWS 2011),
ice sublimation (Clausius–Clapeyron, ΔH_sub = 51.0 kJ/mol), CO2 (Span & Wagner ancillaries), organic liquids
(Antoine). Checked: water boils at 99.97 °C at 1 atm, CO2 sublimes at −78.5 °C, and Raoult's law on these curves
reproduces K_b = 0.51 and K_f = 1.86 °C/m.

## Run it locally

ES modules do not load from `file://`, so serve the folder:

```bash
python3 -m http.server 8642 --directory website
```

Then open <http://localhost:8642>.

## Publish (GitHub Pages)

1. Create a GitHub repository and push this folder to its `main` branch.
2. In the repository: Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. The site appears at `https://<user>.github.io/<repo>/`. Every push to `main` updates it within a minute or two.

`.nojekyll` tells GitHub Pages to serve the files as they are.

## Adding a topic

Copy `kinetics-1/` as a starting point, keep Brown's notation, and turn the topic's row on `index.html`
into a link (`class="topic live"`). Check every number against Brown or the lecture slides, and open
the page on a desktop and a phone before pushing.
