// Module 3: one solution, five concentration units, with the working shown.

import { sig } from '../assets/format.js';

const $ = id => document.getElementById(id);
const MW = 18.02;   // g/mol, water
const sel = $('cu-solute'), msIn = $('cu-ms'), mwIn = $('cu-mw'), rhoIn = $('cu-rho');

function render() {
  const M = +sel.value, name = sel.selectedOptions[0].dataset.n;
  const ms = +msIn.value, mw = +mwIn.value, rho = +rhoIn.value;
  $('cu-ms-out').textContent = `${ms.toFixed(1)} g`;
  $('cu-mw-out').textContent = `${mw.toFixed(0)} g`;
  $('cu-rho-out').textContent = `${rho.toFixed(3)} g/mL`;

  const ns = ms / M, nw = mw / MW, mtot = ms + mw, V = mtot / rho;   // V in mL
  const massPct = ms / mtot * 100, ppm = ms / mtot * 1e6, X = ns / (ns + nw);
  const molal = ns / (mw / 1000), molar = ns / (V / 1000);
  const row = (q, w, r, hl) => `<tr${hl ? ' class="latest"' : ''}><td>${q}</td><td class="num small">${w}</td><td class="num"><strong>${r}</strong></td></tr>`;
  $('cu-table').innerHTML =
    row('amount of solute', `${ms.toFixed(1)} g ÷ ${M} g/mol`, `${sig(ns, 3)} mol`) +
    row('amount of water', `${mw.toFixed(0)} g ÷ ${MW} g/mol`, `${sig(nw, 3)} mol`) +
    row('mass %', `${ms.toFixed(1)} g ÷ ${mtot.toFixed(1)} g × 100`, `${massPct.toPrecision(3)} %`) +
    row('ppm', `${ms.toFixed(1)} g ÷ ${mtot.toFixed(1)} g × 10⁶`, `${sig(ppm, 3)} ppm`) +
    row('mole fraction X<sub>solute</sub>', `${sig(ns, 3)} ÷ (${sig(ns, 3)} + ${sig(nw, 3)})`, sig(X, 3)) +
    row('molality m', `${sig(ns, 3)} mol ÷ ${(mw / 1000).toFixed(3)} kg water`, `${sig(molal, 3)} mol/kg`) +
    row('volume of solution', `${mtot.toFixed(1)} g ÷ ${rho.toFixed(3)} g/mL`, `${V.toFixed(1)} mL`, true) +
    row('molarity M', `${sig(ns, 3)} mol ÷ ${(V / 1000).toFixed(4)} L solution`, `${sig(molar, 3)} mol/L`, true);

  const diff = (molal - molar) / molal * 100;
  $('cu-note').textContent =
    `${ms.toFixed(1)} g of ${name} in ${mw.toFixed(0)} g of water: molality ${sig(molal, 3)} m, molarity ${sig(molar, 3)} M. ` +
    (Math.abs(diff) < 3
      ? 'In a dilute aqueous solution 1 kg of water is about 1 L of solution, so the two numbers are almost the same.'
      : `They differ by ${Math.abs(diff).toFixed(0)} %: molality divides by the mass of water only, molarity by the volume of the whole solution, which needs the density (highlighted rows).`) +
    (name === 'NaCl' ? ' For colligative properties, remember that each NaCl gives two ions.' : '');
}

for (const el of [sel, msIn, mwIn, rhoIn]) el.addEventListener('input', render);
render();
