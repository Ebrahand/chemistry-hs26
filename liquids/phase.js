// Module 4: real-data phase diagrams of water and CO2, pressure on a log axis.

import { Plot } from '../assets/plot.js';
import { water, co2, K0, ATM, solveT, solveTdec, fmtP } from '../assets/chem.js';
import { fix } from '../assets/format.js';

const $ = id => document.getElementById(id);
const plot = new Plot($('pd-plot'));
new ResizeObserver(() => render()).observe($('pd-plot'));
const Pin = $('pd-P'), Tin = $('pd-T');
const lg = Math.log10;

const SUBS = {
  water: {
    d: water, Tmin: -40, Tmax: 450, ymin: 1, ymax: 8.3,
    labels: [[-20, 3.5, 'SOLID'], [180, 6.8, 'LIQUID'], [250, 2.6, 'GAS'], [412, 7.95, 'SUPER-'], [412, 7.7, 'CRITICAL']],
    presets: [['1 atm, 25 °C', ATM, 25], ['Everest', 33.7e3, 25], ['Freeze-drying', 50, -10], ['Triple point', water.pt, 0.01], ['Critical point', water.pc, 373.946]],
  },
  co2: {
    d: co2, Tmin: -120, Tmax: 60, ymin: 1, ymax: 8.3,
    labels: [[-95, 6.4, 'SOLID'], [-15, 6.8, 'LIQUID'], [-5, 4.2, 'GAS'], [46, 7.95, 'SUPER-'], [46, 7.7, 'CRITICAL']],
    presets: [['1 atm, 25 °C', ATM, 25], ['Dry ice at 1 atm', ATM, -90], ['Extinguisher (20 °C)', 6.0e6, 20], ['Triple point', co2.pt, -56.558], ['Critical point', co2.pc, 30.978]],
  },
};
let sub = 'water';

// phase at temperature T (K) and pressure P (Pa)
function phaseAt(d, T, P) {
  if (T < d.Tt) {
    if (P < d.sub(T)) return 'gas';
    if (d === water && T >= d.meltTmin && P > d.melt(T)) return 'liquid';
    return 'solid';
  }
  if (d === co2 && P > d.melt(T)) return 'solid';
  if (T >= d.Tc) return P >= d.pc ? 'super' : 'gas';
  return P < d.vap(T) ? 'gas' : 'liquid';
}
const COLOR = { solid: '--c1', liquid: '--c2', gas: '--c0', super: '--c3' };
const NAME = { solid: 'solid', liquid: 'liquid', gas: 'gas', super: 'supercritical fluid' };

function curves(d, Tmin) {
  const vap = [], subl = [], melt = [];
  for (let T = d.Tt; T <= d.Tc; T += (d.Tc - d.Tt) / 300) vap.push([T - K0, lg(d.vap(T))]);
  vap.push([d.Tc - K0, lg(d.pc)]);
  for (let T = Tmin + K0; T <= d.Tt; T += (d.Tt - Tmin - K0) / 200) subl.push([T - K0, lg(d.sub(T))]);
  subl.push([d.Tt - K0, lg(d.pt)]);
  if (d === water) {
    for (let T = d.Tt; T >= d.meltTmin; T -= 0.05) melt.push([T - K0, lg(Math.max(d.pt, d.melt(T)))]);
  } else {
    for (let T = d.Tt; T <= d.Tt + 40; T += 0.1) { const p = d.melt(T); melt.push([T - K0, lg(p)]); if (p > 2.5e8) break; }
  }
  return { vap, subl, melt };
}

// melting/sublimation and boiling temperatures (°C) at pressure P
function transitions(d, P) {
  const out = {};
  if (P < d.pt) out.sub = solveT(T => d.sub(T), P, 100, d.Tt) - K0;
  else {
    out.melt = d === water ? solveTdec(T => d.melt(T), P, d.meltTmin, d.Tt) - K0 : solveT(T => d.melt(T), P, d.Tt, 400) - K0;
    if (P < d.pc) out.boil = solveT(T => d.vap(T), P, d.Tt, d.Tc) - K0;
  }
  return out;
}

function render() {
  const S = SUBS[sub], d = S.d;
  const y = +Pin.value, P = 10 ** y, Tc = +Tin.value, T = Tc + K0;
  $('pd-P-out').textContent = `${fmtP(P)} (${(P / ATM).toPrecision(3)} atm)`;
  $('pd-T-out').textContent = `${fix(Tc, 1)} °C`;
  const c = curves(d, S.Tmin);
  const ph = phaseAt(d, T, P);
  const tr = transitions(d, P);

  const decades = [1, 2, 3, 4, 5, 6, 7, 8];
  const tick = v => ({ 1: '10 Pa', 2: '100 Pa', 3: '1 kPa', 4: '10 kPa', 5: '100 kPa', 6: '1 MPa', 7: '10 MPa', 8: '100 MPa' }[v]);
  const markers = [
    { x: d.Tt - K0, y: lg(d.pt), color: '--text', r: 4 },
    { x: d.Tc - K0, y: lg(d.pc), color: '--text', r: 4 },
    { x: Tc, y, color: COLOR[ph], r: 7 },
  ];
  const segments = [
    { x1: d.Tc - K0, y1: lg(d.pc), x2: S.Tmax, y2: lg(d.pc), color: '--plot-axis', dash: [3, 4], width: 1 },
    { x1: d.Tc - K0, y1: lg(d.pc), x2: d.Tc - K0, y2: S.ymax, color: '--plot-axis', dash: [3, 4], width: 1 },
  ];
  for (const k of ['melt', 'boil', 'sub']) if (Number.isFinite(tr[k])) markers.push({ x: tr[k], y, color: '--text', r: 4, hollow: true });
  // on narrow screens the small regions have no room for a label; the colour legend covers them
  const compact = $('pd-plot').clientWidth < 480;
  const texts = S.labels.filter(([, , t]) => !compact || t === 'LIQUID' || t === 'GAS')
    .map(([x, yy, t]) => ({ x, y: yy, text: t, align: 'center', bold: true, color: '--text-muted' }));
  texts.push({ x: d.Tt - K0, y: lg(d.pt), text: 'triple point', dx: 8, dy: 10, color: '--text' });
  if (!compact) texts.push({ x: d.Tc - K0, y: lg(d.pc), text: 'critical point', dx: -8, dy: -10, align: 'right', color: '--text' });

  plot.draw({
    padL: 74,
    x: { min: S.Tmin, max: S.Tmax, label: 'temperature (°C)' },
    y: { min: S.ymin, max: S.ymax, label: 'pressure (log scale)', tickValues: decades, tickFormat: tick },
    raster: { fn: (xx, yy) => COLOR[phaseAt(d, xx + K0, 10 ** yy)], nx: 150, ny: 90, alpha: 0.2 },
    series: [
      { points: c.vap, color: '--text', width: 2.2 },
      { points: c.subl, color: '--text', width: 2.2 },
      { points: c.melt, color: '--text', width: 2.2 },
    ],
    segments, markers, texts,
    hlines: [{ y: lg(ATM), label: '1 atm', color: '--plot-axis' }, { y, color: '--text' }],
  });

  const nearTriple = Math.abs(T - d.Tt) < 0.05 && Math.abs(y - lg(d.pt)) < 0.005;
  const nearCrit = Math.abs(T - d.Tc) < 0.05 && Math.abs(y - lg(d.pc)) < 0.005;
  const parts = [nearTriple ? `This is the <strong>triple point</strong> of ${d.formula} (${fix(d.Tt - K0, 2)} °C, ${fmtP(d.pt)}): solid, liquid and gas coexist.`
    : nearCrit ? `This is the <strong>critical point</strong> of ${d.formula} (${fix(d.Tc - K0, 2)} °C, ${fmtP(d.pc)}): the liquid and the gas have become identical.`
    : `${d.name} at ${fix(Tc, Math.abs(Tc) < 1 ? 2 : 1)} °C and ${fmtP(P)} is a <strong>${NAME[ph]}</strong>.`];
  if (nearTriple || nearCrit) { /* the special message says it all */ }
  else if (Number.isFinite(tr.sub)) parts.push(`At this pressure (below the triple point, ${fmtP(d.pt)}) there is no liquid: the solid <strong>sublimes at ${fix(tr.sub, 1)} °C</strong>.`);
  else {
    if (Number.isFinite(tr.melt)) parts.push(`At this pressure it <strong>melts at ${fix(tr.melt, Math.abs(tr.melt) < 1 ? 2 : 1)} °C</strong>`);
    if (Number.isFinite(tr.boil)) parts.push(`and <strong>boils at ${fix(tr.boil, 1)} °C</strong>.`);
    else if (Number.isFinite(tr.melt)) parts.push(`. It is above the critical pressure (${fmtP(d.pc)}), so liquid and gas no longer separate: there is no boiling.`);
  }
  if (sub === 'water' && Math.abs(y - lg(ATM)) < 0.01) parts.push('(The melting point at 1 atm is 0.00 °C; at the triple point it is 0.01 °C.)');
  $('pd-note').innerHTML = parts.join(' ').replace(' .', '.');
}

function setSub(s) {
  sub = s;
  const S = SUBS[s];
  $('pd-sub').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === s));
  Tin.min = S.Tmin; Tin.max = S.Tmax;
  $('pd-presets').innerHTML = S.presets.map(([n, p, t], i) => `<button class="btn" type="button" data-i="${i}">${n}</button>`).join('');
  Pin.value = lg(S.presets[0][1]); Tin.value = S.presets[0][2];
  render();
}

Pin.addEventListener('input', render);
Tin.addEventListener('input', render);
$('pd-sub').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setSub(b.dataset.v); });
$('pd-presets').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const [, p, t] = SUBS[sub].presets[+b.dataset.i];
  Pin.value = lg(p); Tin.value = t; render();
});
function pick(ev) {
  const r = ev.currentTarget.getBoundingClientRect();
  const pt = plot.invert(ev.clientX - r.left, ev.clientY - r.top);
  if (!pt) return;
  Tin.value = pt.x.toFixed(1); Pin.value = pt.y.toFixed(3); render();
}
$('pd-plot').addEventListener('click', pick);
setSub('water');
