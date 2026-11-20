// Module 2: a reaction in a cylinder at constant pressure. ΔH = q_p, w = −PΔV = −Δn_gas·RT, ΔE = ΔH + w.

import { SPECIES, byId, sumProp, eqText, sgn, R, T0 } from '../assets/thermo.js';

const $ = id => document.getElementById(id);
const sel = $('pv-rxn'), xIn = $('pv-x');
const IDS = ['hydrogen', 'methane', 'propane', 'haber', 'lime', 'vapwater'];
sel.innerHTML = IDS.map(id => `<option value="${id}">${byId(id).name}</option>`).join('');

const RT = R * T0 / 1000;               // kJ/mol, 2.479
const VM = R * T0 / 101325 * 1000;      // L/mol at 1 atm, 24.47
const gasMoles = (eq, side) => Object.entries(eq)
  .filter(([sp, c]) => sp.endsWith('(g)') && Math.sign(c) === side)
  .reduce((a, [, c]) => a + Math.abs(c), 0);

function render() {
  const r = byId(sel.value), x = +xIn.value;
  const dH = sumProp(r.eq, 'H');
  const ni = gasMoles(r.eq, -1), nf = gasMoles(r.eq, 1), dn = nf - ni;
  const n = ni + x * dn;
  const q = x * dH, w = -x * dn * RT, dE = q + w;
  $('pv-x-out').textContent = `${Math.round(x * 100)} %`;

  // ---- drawing
  const W = 520, H = 300, cx = 150, cw = 170, floor = 270, Hmax = 190;
  const nmax = Math.max(ni, nf, 1);
  const condensed = 26;                                  // solids/liquids: thin layer at the bottom
  const gh = (n / nmax) * Hmax;
  const pistonY = floor - condensed - gh;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<text x="${cx + cw + 12}" y="${pistonY - 26}" font-size="12" fill="var(--text-muted)">atmosphere, P = 1 atm</text>`;
  for (let k = 0; k < 4; k++) {
    const ax = cx + 20 + k * 43;
    s += `<line x1="${ax}" y1="${pistonY - 40}" x2="${ax}" y2="${pistonY - 18}" stroke="var(--plot-axis)" stroke-width="2"/>` +
      `<path d="M${ax - 5},${pistonY - 22} L${ax},${pistonY - 14} L${ax + 5},${pistonY - 22} z" fill="var(--plot-axis)"/>`;
  }
  // cylinder walls
  s += `<path d="M${cx},${floor - Hmax - condensed - 20} L${cx},${floor} L${cx + cw},${floor} L${cx + cw},${floor - Hmax - condensed - 20}" fill="none" stroke="var(--text)" stroke-width="3"/>`;
  // condensed phase + gas
  s += `<rect x="${cx + 2}" y="${floor - condensed}" width="${cw - 4}" height="${condensed - 2}" fill="var(--cB)"/>`;
  s += `<text x="${cx + cw / 2}" y="${floor - 9}" font-size="11" text-anchor="middle" fill="var(--text)">solids / liquids</text>`;
  if (gh > 0.5) s += `<rect x="${cx + 2}" y="${pistonY}" width="${cw - 4}" height="${gh}" fill="var(--accent-soft)"/>`;
  // a few gas dots, deterministic positions
  const dots = Math.round(n * 6);
  for (let k = 0; k < dots; k++) {
    const u = (k * 0.6180339887) % 1, v = (k * 0.7548776662 + 0.3) % 1;
    s += `<circle cx="${cx + 10 + u * (cw - 20)}" cy="${pistonY + 6 + v * Math.max(0, gh - 12)}" r="3" fill="var(--accent)"/>`;
  }
  s += `<rect x="${cx - 2}" y="${pistonY - 12}" width="${cw + 4}" height="12" rx="2" fill="var(--text-muted)"/>`;
  s += `<text x="${cx + cw + 12}" y="${pistonY + gh / 2 + 4}" font-size="13" fill="var(--text)">${(n * VM).toFixed(1)} L gas</text>`;
  s += `<text x="${cx + cw + 12}" y="${pistonY + gh / 2 + 20}" font-size="12" fill="var(--text-muted)">${+n.toFixed(2)} mol</text>`;
  // heat arrow on the left
  if (Math.abs(q) > 0.01) {
    const y = floor - 60, out = q < 0;
    const x1 = out ? cx - 8 : 18, x2 = out ? 18 : cx - 8;
    s += `<line x1="${x1}" y1="${y}" x2="${x2 + (out ? 10 : -10)}" y2="${y}" stroke="var(--c0)" stroke-width="6"/>` +
      `<path d="M${x2 + (out ? 14 : -14)},${y - 9} L${x2},${y} L${x2 + (out ? 14 : -14)},${y + 9} z" fill="var(--c0)"/>` +
      `<text x="${(x1 + x2) / 2}" y="${y - 12}" font-size="13" font-weight="700" text-anchor="middle" fill="var(--c0)">q</text>` +
      `<text x="${(x1 + x2) / 2}" y="${y + 22}" font-size="11" text-anchor="middle" fill="var(--text-muted)">heat ${out ? 'out' : 'in'}</text>`;
  }
  s += '</svg>';
  $('pv-diagram').innerHTML = s;

  const rows = [
    ['Reaction', eqText(r.eq)],
    ['Δn<sub>gas</sub> (so far)', `${sgn(x * dn, 2)} mol`],
    ['ΔV = Δn·RT/P', `${sgn(x * dn * VM, 1)} L`],
    ['q<sub>p</sub> = ΔH', `${sgn(q, 1)} kJ`],
    ['w = −PΔV', `${sgn(w, 2)} kJ`],
    ['ΔE = q + w', `${sgn(dE, 1)} kJ`],
  ];
  $('pv-readout').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal">${b}</td></tr>`).join('');

  let note;
  if (dn === 0) note = 'No gas is made or used, so the piston does not move: w = 0 and ΔE = ΔH.';
  else if (dn > 0) note = `Gas is made, so the gas pushes the piston up against the atmosphere: the system does work (w &lt; 0) and ΔE is smaller than ΔH.`;
  else note = `Gas is used up, so the atmosphere pushes the piston down: work is done on the system (w &gt; 0) and ΔE is larger than ΔH.`;
  if (dn !== 0) note += ` The work is only ${(Math.abs(dn * RT / dH) * 100).toFixed(1)} % of ΔH: for most reactions ΔE ≈ ΔH.`;
  if (r.id === 'vapwater') note += ' Evaporation is the exception where the work is a noticeable share.';
  $('pv-note').innerHTML = note;
}

sel.addEventListener('change', () => { xIn.value = 0; render(); });
xIn.addEventListener('input', render);
render();
