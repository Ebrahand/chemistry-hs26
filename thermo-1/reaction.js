// Module 3: a thermochemical equation as a conversion factor. 2 H2 + O2 → 2 H2O, vapour or liquid, either direction.

import { SPECIES, sgn } from '../assets/thermo.js';

const $ = id => document.getElementById(id);
const mIn = $('rx-m');
const M_H2 = 2.016;
const DH = { g: 2 * SPECIES['H2O(g)'].H, l: 2 * SPECIES['H2O(l)'].H };   // kJ per 2 mol H2: −483.64, −571.66
let state = 'g', dir = 'f';

function seg(id, set) {
  $(id).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $(id).querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    set(b.dataset.v); render();
  });
}
seg('rx-state', v => { state = v; });
seg('rx-dir', v => { dir = v; });

function render() {
  const m = +mIn.value, n = m / M_H2;
  const dHeq = (dir === 'f' ? 1 : -1) * DH[state];          // for the equation as written
  const q = (n / 2) * dHeq;
  $('rx-m-out').textContent = `${m.toFixed(1)} g`;
  document.querySelector('label[for="rx-m"] span').textContent = dir === 'f' ? 'Mass of H₂ burned' : 'Mass of H₂ made';

  // enthalpy levels
  const W = 520, H = 270, top = 40, bot = 30;
  const Y = v => top + (0 - v) / 600 * (H - top - bot);
  const water = state === 'g' ? 'H₂O(g)' : 'H₂O(l)';
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<text x="12" y="16" font-size="12" fill="var(--text-muted)">enthalpy ↑</text>`;
  const lvl = (x1, x2, v, label, on) =>
    `<line x1="${x1}" y1="${Y(v)}" x2="${x2}" y2="${Y(v)}" stroke="var(${on ? '--text' : '--cB'})" stroke-width="3"/>` +
    `<text x="${(x1 + x2) / 2}" y="${Y(v) - 8}" font-size="13" text-anchor="middle" fill="var(${on ? '--text' : '--text-muted'})">${label}</text>`;
  s += lvl(30, 210, 0, '2 H₂(g) + O₂(g)', true);
  s += lvl(300, 480, DH.g, '2 H₂O(g)', state === 'g');
  s += lvl(300, 480, DH.l, '2 H₂O(l)', state === 'l');
  const yA = Y(0), yB = Y(DH[state]);
  const [y1, y2] = dir === 'f' ? [yA, yB] : [yB, yA];
  const col = dHeq < 0 ? '--bad' : '--good';
  const ax = 255, up = y2 < y1;
  s += `<line x1="${ax}" y1="${y1}" x2="${ax}" y2="${y2 + (up ? 10 : -10)}" stroke="var(${col})" stroke-width="4"/>` +
    `<path d="M${ax - 8},${y2 + (up ? 12 : -12)} L${ax},${y2} L${ax + 8},${y2 + (up ? 12 : -12)} z" fill="var(${col})"/>`;
  s += `<text x="${ax - 10}" y="${(y1 + y2) / 2}" font-size="14" font-weight="700" text-anchor="end" fill="var(${col})">ΔH = ${sgn(dHeq, 1)} kJ</text>`;
  s += `<text x="390" y="${Y(DH.l) + 22}" font-size="11" text-anchor="middle" fill="var(--text-muted)">−88.0 kJ: condensing 2 mol of vapour</text>`;
  s += '</svg>';
  $('rx-diagram').innerHTML = s;

  const eq = dir === 'f' ? `2 H₂(g) + O₂(g) → 2 ${water}` : `2 ${water} → 2 H₂(g) + O₂(g)`;
  $('rx-note').innerHTML =
    `<strong>${eq}</strong>, ΔH = ${sgn(dHeq, 1)} kJ per 2 mol H₂.<br>` +
    `${m.toFixed(1)} g H₂ = ${m.toFixed(1)} g ÷ ${M_H2} g/mol = ${n.toFixed(3)} mol, so ` +
    `q = ${n.toFixed(3)} mol × (${sgn(dHeq, 1)} kJ / 2 mol) = <strong>${sgn(q, 1)} kJ</strong>. ` +
    (q < 0 ? 'Heat is released.' : 'The same amount of energy has to be put back in.');
}

mIn.addEventListener('input', render);
render();
