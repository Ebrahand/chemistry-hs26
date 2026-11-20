// Module 4: Raoult's law, why the boiling point rises and the freezing point falls (real water data),
// and ΔTb = i·Kb·m, ΔTf = i·Kf·m for several solvents.

import { Plot, cssColor } from '../assets/plot.js';
import { water, K0, ATM, solveT, solveTdec } from '../assets/chem.js';
import { fix } from '../assets/format.js';

const $ = id => document.getElementById(id);
const segValue = (id, cb) => {
  for (const b of $(id).querySelectorAll('button')) b.addEventListener('click', () => {
    $(id).querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    cb(b.dataset.v);
  });
};

/* ------------------------------------------------------------------ */
/* Raoult's law                                                        */
/* ------------------------------------------------------------------ */
{
  const PW = water.vap(298.15) / 1000;          // kPa, water at 25 °C (3.17)
  const PB = 75 * 0.133322, PT = 22 * 0.133322; // benzene and toluene at 20 °C: 75 and 22 torr
  const plot = new Plot($('ra-plot'));
  const xIn = $('ra-x'), box = $('ra-box'), ctx = box.getContext('2d');
  let mode = 'nv';
  // fixed scrambled order of the 40 liquid sites, so the coloured ones are spread out
  const order = [...Array(40).keys()].map(i => [i, Math.sin(i * 12.9898) * 43758.5453 % 1]).sort((a, b) => a[1] - b[1]).map(a => a[0]);
  // vapour: 7 × 4 jittered grid slots, filled in a scrambled order so molecules never overlap
  const vapSeed = [...Array(28).keys()]
    .map(k => [k, (Math.sin(k * 78.233) * 43758.5453) % 1])
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => [((k % 7) + 0.5 + 0.35 * Math.sin(k * 5.1)) / 7, (Math.floor(k / 7) + 0.5 + 0.3 * Math.sin(k * 2.7)) / 4]);

  function drawBox(xLiq, nVapA, nVapB, colA, colB) {
    const w = box.clientWidth, h = box.clientHeight; if (!w) return;
    const dpr = window.devicePixelRatio || 1;
    if (box.width !== Math.round(w * dpr)) { box.width = Math.round(w * dpr); box.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = cssColor('--accent-soft'); ctx.fillRect(0, h * 0.5, w, h * 0.5);
    const r = w * 0.04;
    const nB = Math.round(xLiq * 40);   // sites taken by the second component
    for (let k = 0; k < 40; k++) {
      const i = order[k], cx = (i % 8 + 0.5) / 8 * w, cy = h * 0.5 + (Math.floor(i / 8) + 0.5) / 5 * h * 0.5;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = k < nB ? colB : colA; ctx.fill();
    }
    for (let k = 0; k < nVapA + nVapB; k++) {
      const [sx, sy] = vapSeed[k];
      ctx.beginPath(); ctx.arc((0.06 + 0.88 * sx) * w, (0.05 + 0.38 * sy) * h, r, 0, Math.PI * 2);
      ctx.fillStyle = k < nVapA ? colA : colB; ctx.fill();
    }
  }

  function render() {
    const x = +xIn.value;
    const cW = cssColor('--c1'), cS = cssColor('--c0');
    if (mode === 'nv') {
      const Xw = 1 - x, P = Xw * PW;
      $('ra-x-label').textContent = 'Mole fraction of sugar';
      $('ra-x-out').textContent = x.toFixed(3);
      plot.draw({
        x: { min: 0, max: 1, label: 'mole fraction of water, X(water)' },
        y: { min: 0, max: 3.5, label: 'vapour pressure (kPa)' },
        series: [{ points: [[0, 0], [1, PW]], color: '--c1' }],
        markers: [{ x: Xw, y: P, color: '--c1', r: 6 }, { x: 1, y: PW, color: '--c1', r: 4, hollow: true }],
        hlines: [{ y: PW, label: 'P°', color: '--plot-axis' }],
      });
      $('ra-legend').innerHTML = '<span><i style="border-color:var(--c1)"></i>P(water) = X(water) · P°(water)</span>';
      $('ra-note').textContent = `P = ${Xw.toFixed(3)} × ${PW.toFixed(2)} kPa = ${P.toFixed(2)} kPa (water at 25 °C). ` +
        `The vapour pressure is lowered by X(sugar) · P° = ${(x * PW).toFixed(2)} kPa. Only water molecules (blue) are found in the vapour.`;
      drawBox(x, Math.round(16 * Xw), 0, cW, cS);
    } else {
      const Xb = x, Pb = Xb * PB, Pt = (1 - Xb) * PT, Ptot = Pb + Pt, Yb = Pb / Ptot;
      $('ra-x-label').textContent = 'Mole fraction of benzene in the liquid';
      $('ra-x-out').textContent = x.toFixed(3);
      plot.draw({
        x: { min: 0, max: 1, label: 'mole fraction of benzene in the liquid' },
        y: { min: 0, max: 11, label: 'pressure (kPa)' },
        series: [
          { points: [[0, 0], [1, PB]], color: '--c0', dash: [8, 5] },
          { points: [[0, PT], [1, 0]], color: '--c2', dash: [2, 4] },
          { points: [[0, PT], [1, PB]], color: '--text' },
        ],
        markers: [{ x: Xb, y: Pb, color: '--c0', r: 5 }, { x: Xb, y: Pt, color: '--c2', r: 5 }, { x: Xb, y: Ptot, color: '--text', r: 6 }],
      });
      $('ra-legend').innerHTML = '<span><i style="border-color:var(--c0);border-top-style:dashed"></i>benzene</span>' +
        '<span><i style="border-color:var(--c2);border-top-style:dotted"></i>toluene</span><span><i style="border-color:var(--text)"></i>total</span>';
      $('ra-note').textContent = `P(benzene) = ${Xb.toFixed(2)} × 75 torr = ${(Pb / 0.133322).toFixed(1)} torr, ` +
        `P(toluene) = ${(1 - Xb).toFixed(2)} × 22 torr = ${(Pt / 0.133322).toFixed(1)} torr, total ${(Ptot / 0.133322).toFixed(1)} torr (${Ptot.toFixed(2)} kPa). ` +
        `The vapour is ${(100 * Yb).toFixed(0)} % benzene although the liquid is only ${(100 * Xb).toFixed(0)} %: the vapour is richer in the more volatile liquid. That is the idea behind distillation.`;
      const nV = Math.round(20 * Ptot / PB);
      const nA = Math.round(nV * (1 - Yb));
      drawBox(x, nA, nV - nA, cssColor('--c2'), cssColor('--c0'));   // A = toluene (green), B = benzene (orange)
    }
  }
  segValue('ra-mode', v => {
    mode = v;
    xIn.max = v === 'nv' ? 0.5 : 1;
    xIn.value = v === 'nv' ? 0.1 : 0.5;
    render();
  });
  xIn.addEventListener('input', render);
  new ResizeObserver(render).observe(box);
  render();
}

/* ------------------------------------------------------------------ */
/* Why: real vapour-pressure curves of water                           */
/* ------------------------------------------------------------------ */
{
  const plot = new Plot($('why-plot'));
  const mIn = $('why-m');
  let view = 'b';
  const NW = 1000 / 18.015;   // mol water per kg
  const Pliq = T => water.vap(T) / 1000, Pice = T => water.sub(T) / 1000;   // kPa (liquid curve also below 0 °C: supercooled)

  function render() {
    const im = +mIn.value, X = NW / (NW + im);
    $('why-m-out').textContent = `${im.toFixed(2)} mol/kg`;
    let dT, formula, note;
    if (view === 'b') {
      const Tb0 = solveT(T => Pliq(T) * 1000, ATM, 360, 400), Tb = solveT(T => X * Pliq(T) * 1000, ATM, 360, 400);
      dT = Tb - Tb0; formula = 0.51 * im;
      const pts = (f) => { const a = []; for (let t = 96; t <= 104.001; t += 0.05) a.push([t, f(t + K0)]); return a; };
      plot.draw({
        x: { min: 96, max: 104, label: 'temperature (°C)' },
        y: { min: 85, max: 115, label: 'vapour pressure (kPa)' },
        series: [{ points: pts(Pliq), color: '--c1' }, { points: pts(T => X * Pliq(T)), color: '--c0', dash: [8, 5] }],
        hlines: [{ y: ATM / 1000, label: '1 atm', color: '--text' }],
        markers: [{ x: Tb0 - K0, y: ATM / 1000, color: '--c1', r: 5 }, { x: Tb - K0, y: ATM / 1000, color: '--c0', r: 5 }],
        segments: [{ x1: Tb0 - K0, y1: 85, x2: Tb0 - K0, y2: ATM / 1000, color: '--c1', dash: [3, 3], width: 1 },
          { x1: Tb - K0, y1: 85, x2: Tb - K0, y2: ATM / 1000, color: '--c0', dash: [3, 3], width: 1 }],
      });
      $('why-legend').innerHTML = '<span><i style="border-color:var(--c1)"></i>pure water</span><span><i style="border-color:var(--c0);border-top-style:dashed"></i>solution</span>';
      note = 'The solution reaches 1 atm only at a higher temperature: the boiling point is elevated.';
    } else {
      // liquid minus ice vapour pressure falls with T, so use the decreasing solver
      const Tf0 = solveTdec(T => Pliq(T) - Pice(T), 0, 250, 275), Tf = solveTdec(T => X * Pliq(T) - Pice(T), 0, 250, 275);
      dT = Tf0 - Tf; formula = 1.86 * im;
      const pts = (f, a, b) => { const r = []; for (let t = a; t <= b + 1e-9; t += 0.02) r.push([t, f(t + K0)]); return r; };
      plot.draw({
        x: { min: -7, max: 1, label: 'temperature (°C)' },
        y: { min: 0.33, max: 0.66, label: 'vapour pressure (kPa)' },
        series: [
          { points: pts(Pice, -7, 0.01), color: '--c3', width: 3 },
          { points: pts(Pliq, -7, 1), color: '--c1' },
          { points: pts(T => X * Pliq(T), -7, 1), color: '--c0', dash: [8, 5] },
        ],
        markers: [{ x: Tf0 - K0, y: Pice(Tf0), color: '--c1', r: 5 }, { x: Tf - K0, y: Pice(Tf), color: '--c0', r: 5 }],
      });
      $('why-legend').innerHTML = '<span><i style="border-color:var(--c3)"></i>ice</span><span><i style="border-color:var(--c1)"></i>pure liquid water</span><span><i style="border-color:var(--c0);border-top-style:dashed"></i>solution</span>';
      note = 'Ice and liquid can coexist only where their vapour pressures are equal. The solution\'s curve meets the ice curve at a lower temperature: the freezing point is depressed. The ice curve and the liquid curve have almost the same slope, so lowering the liquid curve a little moves the crossing a long way: that is why ΔTf is bigger than ΔTb.';
    }
    $('why-readout').innerHTML =
      `<tr><td>X(water)</td><td class="num">${X.toFixed(4)}</td></tr>` +
      `<tr><td>${view === 'b' ? 'ΔTb' : 'ΔTf'} read off the curves</td><td class="num">${dT.toFixed(2)} °C</td></tr>` +
      `<tr><td>${view === 'b' ? '0.51 × i·m' : '1.86 × i·m'}</td><td class="num">${formula.toFixed(2)} °C</td></tr>`;
    $('why-note').textContent = note + ' The curves are real data for water, so the shift agrees with the K values of the formula.';
  }
  segValue('why-view', v => { view = v; render(); });
  mIn.addEventListener('input', render);
  render();
}

/* ------------------------------------------------------------------ */
/* ΔTb and ΔTf for several solvents (Brown Table 13.3)                 */
/* ------------------------------------------------------------------ */
{
  const SOLV = [
    { n: 'Water, H₂O', Tb: 100.0, Kb: 0.51, Tf: 0.0, Kf: 1.86 },
    { n: 'Benzene, C₆H₆', Tb: 80.1, Kb: 2.53, Tf: 5.5, Kf: 5.12 },
    { n: 'Ethanol, C₂H₅OH', Tb: 78.4, Kb: 1.22, Tf: -114.6, Kf: 1.99 },
    { n: 'Carbon tetrachloride, CCl₄', Tb: 76.8, Kb: 5.02, Tf: -22.3, Kf: 29.8 },
    { n: 'Chloroform, CHCl₃', Tb: 61.2, Kb: 3.63, Tf: -63.5, Kf: 4.68 },
  ];
  const sel = $('bf-solvent'), mIn = $('bf-m');
  sel.innerHTML = SOLV.map((s, i) => `<option value="${i}">${s.n} (Kb ${s.Kb}, Kf ${s.Kf} °C/m)</option>`).join('');
  let i = 1;
  function render() {
    const s = SOLV[+sel.value], m = +mIn.value;
    $('bf-m-out').textContent = `${m.toFixed(2)} mol/kg`;
    const dTb = i * s.Kb * m, dTf = i * s.Kf * m;
    const Tb = s.Tb + dTb, Tf = s.Tf - dTf;
    const lo = Math.min(Tf, s.Tf) - 8, hi = Math.max(Tb, s.Tb) + 8;
    const W = 560, X = t => 20 + (t - lo) / (hi - lo) * (W - 40);
    const bar = (y, a, b, col, label) =>
      `<rect x="${X(a)}" y="${y}" width="${Math.max(1, X(b) - X(a))}" height="18" rx="4" fill="var(${col})" opacity="0.85"/>` +
      `<text x="${X(a) - 6}" y="${y + 13}" font-size="12" text-anchor="end" fill="var(--text)">${fix(a, 1)}</text>` +
      `<text x="${X(b) + 6}" y="${y + 13}" font-size="12" fill="var(--text)">${fix(b, 1)}</text>` +
      `<text x="${(X(a) + X(b)) / 2}" y="${y - 5}" font-size="12" text-anchor="middle" fill="var(--text-muted)">${label}</text>`;
    let svg = `<svg viewBox="0 0 ${W} 120" xmlns="http://www.w3.org/2000/svg">`;
    svg += bar(22, s.Tf, s.Tb, '--c1', 'pure solvent: liquid range (°C)');
    svg += bar(76, Tf, Tb, '--c0', 'solution: liquid range (°C)');
    svg += '</svg>';
    $('bf-scale').innerHTML = svg;
    let note = `ΔTb = i·Kb·m = ${i} × ${s.Kb} × ${m.toFixed(2)} = ${dTb.toFixed(2)} °C, so it boils at ${fix(Tb, 2)} °C. ` +
      `ΔTf = i·Kf·m = ${i} × ${s.Kf} × ${m.toFixed(2)} = ${dTf.toFixed(2)} °C, so it freezes at ${fix(Tf, 2)} °C. `;
    if (s.Tb === 100.0 && i >= 2) note += 'This is why salt (NaCl) or CaCl₂ is spread on icy roads: with i = 3, CaCl₂ is especially effective.';
    $('bf-note').textContent = note;
  }
  segValue('bf-i', v => { i = +v; render(); });
  sel.addEventListener('input', render);
  mIn.addEventListener('input', render);
  render();
}
