// Module 5: Maxwell–Boltzmann speed distributions for two gases; mean free path against pressure.

import { Plot } from '../assets/plot.js';
import { R, KB, GASES, AIR_M, uni } from './data.js';
import { sci } from '../assets/format.js';

const $ = id => document.getElementById(id);

/* ---------- speed distributions ---------- */
const LIST = ['H2', 'He', 'CH4', 'H2O', 'N2', 'O2', 'Ar', 'CO2', 'Cl2', 'Xe'];
const opts = LIST.map(k => `<option value="${k}">${GASES[k].name} (${uni(k)}), ${GASES[k].M} g/mol</option>`).join('');
$('mb-a').innerHTML = opts; $('mb-b').innerHTML = opts;
$('mb-a').value = 'O2'; $('mb-b').value = 'He';
const plot = new Plot($('mb-plot'));

const speeds = (M, T) => { const m = M / 1000; return { mp: Math.sqrt(2 * R * T / m), av: Math.sqrt(8 * R * T / (Math.PI * m)), rms: Math.sqrt(3 * R * T / m) }; };
const f = (u, M, T) => { const m = M / 1000, a = m / (2 * R * T); return 4 * Math.PI * Math.pow(a / Math.PI, 1.5) * u * u * Math.exp(-a * u * u); };
const STEPS = [1000, 1500, 2000, 3000, 4000, 5000, 6000, 8000, 10000];

function renderMB() {
  const A = $('mb-a').value, B = $('mb-b').value, T = +$('mb-T').value;
  const MA = GASES[A].M, MB = GASES[B].M;
  $('mb-T-out').textContent = `${T} K = ${(T - 273.15).toFixed(0)} °C`;
  const sA = speeds(MA, T), sB = speeds(MB, T);
  const need = 3.2 * Math.max(sA.mp, sB.mp);
  const xmax = STEPS.find(s => s >= need) || 10000;
  const curve = M => { const p = []; for (let i = 0; i <= 300; i++) { const u = (i / 300) * xmax; p.push([u, f(u, M, T) * 1000]); } return p; };
  const peak = Math.max(f(sA.mp, MA, T), f(sB.mp, MB, T)) * 1000;
  plot.draw({
    x: { min: 0, max: xmax, label: 'molecular speed u (m/s)' },
    y: { min: 0, max: peak * 1.15, label: 'fraction per 1000 m/s' },
    series: [{ points: curve(MA), color: '--c0', width: 2.5 }, { points: curve(MB), color: '--c1', width: 2.5 }],
    vlines: [{ x: sA.mp, color: '--c0', dash: [2, 3] }, { x: sA.av, color: '--c0', dash: [5, 3] }, { x: sA.rms, color: '--c0' }],
    texts: [{ x: sA.rms, y: f(sA.rms, MA, T) * 1000, text: 'u rms', dx: 5, dy: -6, align: 'left', color: '--c0' }],
  });
  $('mb-legend').innerHTML = `<span><i style="border-color:var(--c0)"></i>${uni(A)}</span><span><i style="border-color:var(--c1)"></i>${uni(B)}</span><span class="small">lines for ${uni(A)}: dotted u<sub>mp</sub>, dashed u<sub>av</sub>, solid u<sub>rms</sub></span>`;
  $('mb-ha').textContent = uni(A); $('mb-hb').textContent = uni(B);
  const Ek = 1.5 * R * T / 1000;
  $('mb-table').innerHTML = [
    ['u<sub>mp</sub> (m/s)', sA.mp, sB.mp], ['u<sub>av</sub> (m/s)', sA.av, sB.av], ['u<sub>rms</sub> (m/s)', sA.rms, sB.rms],
  ].map(([l, a, b]) => `<tr><td>${l}</td><td class="num">${a.toFixed(0)}</td><td class="num">${b.toFixed(0)}</td></tr>`).join('') +
    `<tr><td>avg. E<sub>k</sub> (kJ/mol)</td><td class="num">${Ek.toFixed(2)}</td><td class="num">${Ek.toFixed(2)}</td></tr>`;
  const ratio = Math.sqrt(Math.max(MA, MB) / Math.min(MA, MB));
  const lighter = MA < MB ? A : B;
  let note = A === B ? 'Same gas twice: the curves lie on top of each other.'
    : `Same temperature, so the same average kinetic energy (${Ek.toFixed(2)} kJ/mol, ${sci(1.5 * KB * T, 3)} J per molecule). ${uni(lighter)} is lighter, so it must move faster: √(${Math.max(MA, MB)} / ${Math.min(MA, MB)}) = ${ratio.toFixed(2)} times faster, with a broader curve. The area under each curve is 1 (all molecules).`;
  note += T > 700 ? ' At high T the curves flatten and stretch: many more molecules are fast.' : '';
  $('mb-note').innerHTML = note;
}
['mb-a', 'mb-b', 'mb-T'].forEach(id => $(id).addEventListener('input', renderMB));
renderMB();

/* ---------- mean free path ---------- */
const D = 3.7e-10, T0 = 298.15;   // effective diameter of air molecules (m), temperature (K)
const uAir = Math.sqrt(8 * R * T0 / (Math.PI * AIR_M / 1000));
const PLACES = [['Sea level', 101.325], ['Airliner, 11 km', 22.7], ['Lab vacuum pump', 0.1], ['100 km altitude', 3.2e-5]];
$('mfp-places').innerHTML = PLACES.filter(([, p]) => p).map(([n, p]) => `<button class="btn" type="button" data-p="${p}">${n}</button>`).join('');
$('mfp-places').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $('mfp-P').value = Math.log10(+b.dataset.p); renderMFP(); });

const REF = [[1e-10, 'atom'], [1e-7, 'virus'], [7e-5, 'hair'], [1e-3, '1 mm'], [1e-1, '10 cm'], [1, '1 m']];
function lenText(x) {
  if (x < 1e-6) return `${(x * 1e9).toFixed(0)} nm`;
  if (x < 1e-3) return `${(x * 1e6).toFixed(x < 1e-5 ? 1 : 0)} µm`;
  if (x < 1e-2) return `${(x * 1e3).toFixed(1)} mm`;
  if (x < 1) return `${(x * 100).toFixed(1)} cm`;
  return `${x.toFixed(1)} m`;
}
function renderMFP() {
  const PkPa = Math.pow(10, +$('mfp-P').value), P = PkPa * 1000;
  $('mfp-P-out').textContent = PkPa >= 1 ? `${PkPa.toFixed(1)} kPa` : `${sci(P, 2)} Pa`;
  const lam = KB * T0 / (Math.SQRT2 * Math.PI * D * D * P);
  const z = uAir / lam;
  const W = 520, H = 70, x0 = 20, x1 = W - 20, lo = -10, hi = 1;
  const X = v => x0 + ((Math.log10(v) - lo) / (hi - lo)) * (x1 - x0);
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<line x1="${x0}" y1="40" x2="${x1}" y2="40" stroke="var(--plot-axis)" stroke-width="1.5"/>`;
  for (const [v, l] of REF) s += `<line x1="${X(v)}" y1="35" x2="${X(v)}" y2="45" stroke="var(--plot-axis)"/><text x="${X(v)}" y="60" text-anchor="middle" font-size="11" fill="var(--text-muted)">${l}</text>`;
  const lx = Math.min(x1, X(lam));
  s += `<circle cx="${lx}" cy="40" r="7" fill="var(--c0)"/><text x="${Math.min(Math.max(lx, 60), W - 60)}" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="var(--c0)">λ = ${lenText(lam)}</text>`;
  $('mfp-diagram').innerHTML = s + '</svg>';
  $('mfp-note').innerHTML = `A molecule of air (average speed ${uAir.toFixed(0)} m/s at 25 °C) travels on average <strong>${lenText(lam)}</strong> between collisions and collides about <strong>${sci(z, 2)} times per second</strong>. ` +
    (PkPa > 50 ? 'This is why smells spread slowly even though the molecules are fast.' : 'λ ∝ 1/P: fewer molecules, longer free flights.');
}
$('mfp-P').addEventListener('input', renderMFP);
renderMFP();
