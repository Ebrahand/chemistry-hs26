// Module 6: compressibility factor Z = PV/nRT against P from the van der Waals equation, with the attraction (a)
// and volume (b) corrections shown separately.

import { Plot } from '../assets/plot.js';
import { R, GASES, uni } from './data.js';

const $ = id => document.getElementById(id);
const LIST = ['He', 'H2', 'Ne', 'N2', 'O2', 'Ar', 'CH4', 'CO2', 'NH3', 'Cl2', 'Xe'];
$('vdw-gas').innerHTML = LIST.map(k => `<option value="${k}">${GASES[k].name} (${uni(k)})</option>`).join('');
$('vdw-gas').value = 'CO2';
const plot = new Plot($('vdw-plot'));
const PMAX = 100;   // MPa

// Z against P (MPa) for P(Vm); keeps the stable (monotonic) branch, so a van der Waals loop shows as a jump.
function curve(a, b, T) {
  const pts = [];
  let maxP = 0, jumped = false, prevKept = true;
  for (let i = 0; i <= 900; i++) {
    const Vm = Math.pow(10, 3 - i * (5 / 900));   // 1000 L/mol down to 0.01 L/mol
    if (Vm <= b * 1.0005) break;
    const P = (R * T) / (Vm - b) - a / (Vm * Vm);   // kPa
    if (P / 1000 > PMAX) { pts.push([PMAX, (PMAX * 1000 * Vm) / (R * T)]); break; }
    if (P > maxP) {
      if (!prevKept && pts.length) jumped = true;
      pts.push([P / 1000, (P * Vm) / (R * T)]);
      maxP = P; prevKept = true;
    } else prevKept = false;
  }
  return { pts, jumped };
}
function zAt(pts, P) {
  for (let i = 1; i < pts.length; i++) if (pts[i][0] >= P) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (x1 - x0 < 1e-9) return y1;
    return y0 + ((P - x0) / (x1 - x0)) * (y1 - y0);
  }
  return null;
}

function render() {
  const g = GASES[$('vdw-gas').value], T = +$('vdw-T').value;
  $('vdw-T-out').textContent = `${T} K = ${(T - 273.15).toFixed(0)} °C`;
  const full = curve(g.a, g.b, T), onlyA = curve(g.a, 0, T), onlyB = curve(0, g.b, T);
  const series = [{ points: [[0, 1], [PMAX, 1]], color: '--plot-axis', dash: [5, 4] }];
  if ($('vdw-sa').checked) series.push({ points: onlyA.pts, color: '--c3', width: 2, dash: [6, 3] });
  if ($('vdw-sb').checked) series.push({ points: onlyB.pts, color: '--c2', width: 2, dash: [6, 3] });
  series.push({ points: full.pts, color: '--c0', width: 2.5 });
  const shown = series.flatMap(s => s.points.map(p => p[1]));
  const ymax = Math.min(4, Math.max(2, ...shown) * 1.05);
  plot.draw({
    x: { min: 0, max: PMAX, label: 'P (MPa)' }, y: { min: 0, max: ymax, label: 'Z = PV / nRT' },
    series,
    texts: [{ x: PMAX, y: 1, text: 'ideal', dx: -4, dy: -8, align: 'right', color: '--text-muted' }],
  });
  const Tb = g.a / (R * g.b), Tc = (8 * g.a) / (27 * R * g.b);
  const z = P => { const v = zAt(full.pts, P); return v === null ? '—' : v.toFixed(3); };
  $('vdw-readout').innerHTML = [
    ['Z at 0.1 MPa (1 atm)', z(0.101325)], ['Z at 10 MPa', z(10)], ['Z at 50 MPa', z(50)],
    ['a / b', `${g.a} / ${g.b}`],
  ].map(([l, v]) => `<tr><td>${l}</td><td class="num">${v}</td></tr>`).join('');
  let note = `At 1 atm ${g.name} is ideal to within ${Math.abs(1 - zAt(full.pts, 0.101325)) < 0.001 ? '0.1 %' : (100 * Math.abs(1 - zAt(full.pts, 0.101325))).toFixed(1) + ' %'}. `;
  const z10 = zAt(full.pts, 10);
  if (full.jumped) note += `Here, below its critical temperature (${Tc.toFixed(0)} K from these constants), the gas condenses to a liquid when you squeeze it: Z drops suddenly. `;
  else if (z10 !== null && z10 < 0.98) note += 'At moderate pressure Z &lt; 1: attraction wins and the gas is easier to compress than an ideal gas. ';
  else note += 'Z rises above 1 almost from the start: the molecular volume (b) matters more than the weak attraction (a). ';
  note += `At high pressure the volume term always wins and Z &gt; 1. Above about ${Tb.toFixed(0)} K (a/Rb with these constants; the real value is lower) the dip below 1 disappears: fast molecules hardly feel the attraction.`;
  if ($('vdw-sa').checked && !onlyA.jumped && onlyA.pts.length && onlyA.pts[onlyA.pts.length - 1][0] < PMAX * 0.99) note += ' With attraction only (b = 0) the pressure has a maximum and the gas would collapse: only the molecules\' own volume stops it.';
  $('vdw-note').innerHTML = note;
}
['vdw-gas', 'vdw-T', 'vdw-sa', 'vdw-sb'].forEach(id => $(id).addEventListener('input', render));
render();
