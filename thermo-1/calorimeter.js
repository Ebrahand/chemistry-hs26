// Module 4: coffee-cup calorimeter. Hot metal in water; the final temperature from q_metal + q_water + q_cup = 0.

import { Plot } from '../assets/plot.js';
import { sgn } from '../assets/thermo.js';

const $ = id => document.getElementById(id);
// Specific heats, J g⁻¹ K⁻¹. Al and Fe as in Brown Table 5.2; Cu and Au handbook values at 25 °C.
const METALS = [
  { n: 'aluminium, Al', c: 0.90 }, { n: 'iron, Fe', c: 0.45 }, { n: 'copper, Cu', c: 0.385 }, { n: 'gold, Au', c: 0.129 },
];
const CW = 4.184;
const sel = $('cal-metal');
sel.innerHTML = METALS.map((m, i) => `<option value="${i}">${m.n} (${m.c} J g⁻¹ K⁻¹)</option>`).join('');
const ins = ['cal-mm', 'cal-Tm', 'cal-mw', 'cal-Tw', 'cal-C'].map($);
const plot = new Plot($('cal-plot'));
const TAU = 15, TMAX = 90;   // s, illustrative: how fast the temperatures even out
let tNow = TMAX, anim = 0;

function state() {
  const c = METALS[+sel.value].c;
  const [mm, Tm, mw, Tw, C] = ins.map(x => +x.value);
  const Cm = mm * c, Cwat = mw * CW;
  const Tf = (Cm * Tm + (Cwat + C) * Tw) / (Cm + Cwat + C);
  return { c, mm, Tm, mw, Tw, C, Cm, Cwat, Tf };
}

function render() {
  const s = state();
  $('cal-mm-out').textContent = `${s.mm} g`;
  $('cal-Tm-out').textContent = `${s.Tm.toFixed(1)} °C`;
  $('cal-mw-out').textContent = `${s.mw} g`;
  $('cal-Tw-out').textContent = `${s.Tw.toFixed(1)} °C`;
  $('cal-C-out').textContent = `${s.C} J/K`;

  const curve = (T0) => {
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const t = (i / 120) * tNow;
      pts.push([t, s.Tf + (T0 - s.Tf) * Math.exp(-t / TAU)]);
    }
    return pts;
  };
  const lo = Math.min(s.Tm, s.Tw), hi = Math.max(s.Tm, s.Tw);
  const at = T0 => s.Tf + (T0 - s.Tf) * Math.exp(-tNow / TAU);
  plot.draw({
    x: { min: 0, max: TMAX, label: 'time after dropping it in (s)' },
    y: { min: Math.floor(lo / 5) * 5 - 2, max: Math.ceil(hi / 5) * 5 + 2, label: 'temperature (°C)' },
    series: [{ points: curve(s.Tm), color: '--c0' }, { points: curve(s.Tw), color: '--c1' }],
    hlines: [{ y: s.Tf, label: `${s.Tf.toFixed(2)}°`, color: '--plot-axis' }],
    markers: [{ x: tNow, y: at(s.Tm), color: '--c0' }, { x: tNow, y: at(s.Tw), color: '--c1' }],
  });

  const dTm = s.Tf - s.Tm, dTw = s.Tf - s.Tw;
  const qm = s.Cm * dTm, qw = s.Cwat * dTw, qc = s.C * dTw;
  const rows = [
    ['Final temperature', `${s.Tf.toFixed(2)} °C`],
    [`q<sub>metal</sub> = m c<sub>s</sub> ΔT`, `${s.mm} × ${s.c} × (${sgn(dTm, 2)}) = ${sgn(qm, 0)} J`],
    [`q<sub>water</sub> = m c<sub>s</sub> ΔT`, `${s.mw} × ${CW} × (${sgn(dTw, 2)}) = ${sgn(qw, 0)} J`],
    [`q<sub>cup</sub> = C ΔT`, `${s.C} × (${sgn(dTw, 2)}) = ${sgn(qc, 0)} J`],
    ['Sum', `${sgn(qm + qw + qc + 0, 0).replace(/^[+−]0$/, '0')} J`],
  ];
  $('cal-readout').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal">${b}</td></tr>`).join('');

  const ratio = s.Cm / (s.Cwat + s.C);
  $('cal-note').innerHTML = Math.abs(s.Tm - s.Tw) < 0.01 ? 'Same temperature: no heat flows.'
    : `The ${s.Tm > s.Tw ? 'metal loses' : 'metal gains'} exactly the heat that the water and cup ${s.Tm > s.Tw ? 'gain' : 'lose'}. ` +
      `The metal can store only ${ratio < 0.1 ? ratio.toFixed(3) : ratio.toFixed(2)} times as much heat per kelvin as the water and cup together ` +
      `(${s.Cm.toFixed(0)} against ${(s.Cwat + s.C).toFixed(0)} J/K), so the final temperature ends up ` +
      `${ratio < 1 ? 'closer to the water\'s' : 'closer to the metal\'s'} starting temperature.`;
}

function go() {
  cancelAnimationFrame(anim);
  const t0 = performance.now(), dur = 2500;
  const step = now => {
    const f = Math.min(1, (now - t0) / dur);
    tNow = Math.max(0.01, f * TMAX);
    render();
    if (f < 1) anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}

$('cal-go').addEventListener('click', go);
for (const el of [sel, ...ins]) el.addEventListener('input', () => { cancelAnimationFrame(anim); tNow = TMAX; render(); });
render();
