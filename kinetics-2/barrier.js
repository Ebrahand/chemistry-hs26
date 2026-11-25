// Module 2: potential-energy surface of A + BC → AB + C in 3D (Ea, ΔE, Ea(reverse) marked on it), and the molecules of a
// gas as a 3D cloud in velocity space with the sphere ½Mu² = Ea, at two temperatures. Both views rotate with the mouse.

import { sig, sci } from '../assets/format.js';
import { View3D, rgb, css, mix, ball, arrow, text, dashed, ease, heightRamp, rampColor, surfaceItems } from './view3d.js';

const $ = id => document.getElementById(id);
const R = 8.314;
const sgn = (x, d = 0) => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(d);

/* ------------------------------------------------------------------ */
/* Potential-energy surface                                            */
/* ------------------------------------------------------------------ */
// Coordinates u = A–B distance, v = B–C distance, both scaled to 0…1. The valley (minimum-energy path) runs along
// v = r0 (BC bonded, A far away), bends round the corner and leaves along u = r0 (AB bonded, C far away).
// s = position along the valley (0 … 1), d = signed distance from it (> 0 towards "all three atoms apart").
const r0 = 0.17, rho = 0.22, N = 58;
const eaIn = $('pr-Ea'), deIn = $('pr-dE'), sIn = $('pr-s');
const VALLEY = [];
{
  const pts = [], nrm = [];
  for (let i = 0; i <= 60; i++) { pts.push([1 - i / 60 * (1 - r0 - rho), r0]); nrm.push([0, 1]); }
  for (let i = 1; i <= 60; i++) {
    const th = -Math.PI / 2 - i / 60 * Math.PI / 2, c = [r0 + rho, r0 + rho];
    const q = [c[0] + rho * Math.cos(th), c[1] + rho * Math.sin(th)];
    pts.push(q); nrm.push([(c[0] - q[0]) / rho, (c[1] - q[1]) / rho]);
  }
  for (let i = 1; i <= 60; i++) { pts.push([r0, r0 + rho + i / 60 * (1 - r0 - rho)]); nrm.push([1, 0]); }
  let L = 0; const len = [0];
  for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); len.push(L); }
  pts.forEach((p, i) => VALLEY.push({ u: p[0], v: p[1], n: nrm[i], s: len[i] / L }));
}
const valleyAt = s => {
  let i = VALLEY.findIndex(p => p.s >= s); if (i <= 0) return VALLEY[Math.max(0, i)];
  const a = VALLEY[i - 1], b = VALLEY[i], t = (s - a.s) / (b.s - a.s);
  return { u: a.u + (b.u - a.u) * t, v: a.v + (b.v - a.v) * t, s };
};
// grid: nearest valley point of every node (independent of the sliders, so computed once)
const GU = Array.from({ length: N }, (_, i) => i / (N - 1));
const NEAR = GU.map(u => GU.map(v => {
  let best = 1e9, k = 0;
  for (let i = 0; i < VALLEY.length; i++) { const dd = (u - VALLEY[i].u) ** 2 + (v - VALLEY[i].v) ** 2; if (dd < best) { best = dd; k = i; } }
  const q = VALLEY[k], d = Math.sqrt(best), sign = (u - q.u) * q.n[0] + (v - q.v) * q.n[1] >= 0 ? 1 : -1;
  return { s: q.s, d: sign * d };
}));

let Ea = +eaIn.value, dE = +deIn.value;
const Vs = s => (s < 0.5 ? Ea * ease((s - 0.12) / 0.38) : Ea + (dE - Ea) * ease((s - 0.5) / 0.38));
const plateau = () => Math.max(Ea, dE, 0) + 35;      // A + B + C, all apart
function energy(n) {
  const V = Vs(n.s), Pl = plateau(), w = n.d >= 0 ? 0.3 : 0.06;
  return V + (Pl - V) * (1 - Math.exp(-((n.d / w) ** 2)));
}
const ZS = 1.5 / 300;                                     // world height per kJ/mol
const W = u => (u - 0.5) * 2.2;                            // u, v → world x, y
const Z = E => E * ZS - 0.35;

function drawPES(view) {
  const { ctx, w, h } = view.frame();
  if (!w) return;
  const vp = { cx: w / 2, cy: h * (w < 420 ? 0.6 : 0.53), S: Math.min(w / 2.85, h / 2.35), D: 6 };
  const Zg = NEAR.map(row => row.map(n => Z(energy(n))));
  const Elo = Math.min(0, dE), Ehi = plateau(), ramp = heightRamp();
  const items = surfaceItems(view, vp, { nx: N, ny: N, X: GU.map(W), Y: GU.map(W), Z: Zg },
    (i, j) => { const E = (Zg[i][j] + Zg[i + 1][j + 1]) / 2 / ZS + 0.35 / ZS; return rampColor(ramp, (E - Elo + 10) / (Ehi - Elo + 10)); });
  // minimum-energy path on the surface, split into short pieces so that ridges can hide it
  const path = VALLEY.filter((_, i) => i % 2 === 0).map(p => view.project([W(p.u), W(p.v), Z(Vs(p.s)) + 0.012], vp));
  const ink = rgb('--text');
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    items.push({ d: (a[2] + b[2]) / 2 + 0.02, fn: c => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = css(ink, 0.85); c.lineWidth = 2.2; c.setLineDash([]); c.stroke(); } });
  }
  // the molecule as a ball on the path
  const s = +sIn.value / 100, q = valleyAt(s), Eb = Vs(s);
  const bp = view.project([W(q.u), W(q.v), Z(Eb) + 0.065], vp);
  items.push({ d: bp[2] + 0.05, fn: c => ball(c, bp[0], bp[1], 0.065 * bp[3], rgb('--c3')) });
  view.paint(items);

  // annotations on top: energy levels and arrows at the transition state
  const sad = valleyAt(0.5), rea = valleyAt(0.03), pro = valleyAt(0.86);
  const at = (p, E) => view.project([W(p.u), W(p.v), Z(E)], vp);
  const S0 = at(sad, 0), Sa = at(sad, Ea), Sd = at(sad, dE), R0 = at(rea, 0), P0 = at(pro, 0), Pd = at(pro, dE);
  const muted = rgb('--text-muted');
  dashed(ctx, [[R0[0], R0[1]], [S0[0], S0[1]], [P0[0], P0[1]]], muted, 1.3);
  if (Math.abs(dE) > 2) dashed(ctx, [[Pd[0], Pd[1]], [Sd[0], Sd[1]]], muted, 1.3);
  arrow(ctx, S0[0] - 12, S0[1], Sa[1], rgb('--c0'), 'Eₐ', 'left');
  arrow(ctx, Sd[0] + 12, Sd[1], Sa[1], rgb('--c1'), 'Eₐ(rev)');
  arrow(ctx, P0[0], P0[1], Pd[1], ink, 'ΔE', P0[0] < w / 2 ? 'left' : 'right');
  text(ctx, 'transition state ‡', Sa[0], Sa[1] - 14, '--text', { bold: true });
  const Rl = at(valleyAt(0.0), 0), Pl = at(valleyAt(1), dE), Ap = view.project([W(0.88), W(0.88), Z(plateau())], vp);
  text(ctx, 'A + B–C', Rl[0], Rl[1] + 20, '--text-muted');
  text(ctx, 'A–B + C', Pl[0], Pl[1] + 20, '--text-muted');
  text(ctx, 'A + B + C (all apart)', Ap[0], Ap[1] - 8, '--text-muted');
  // axes along the two back edges of the surface (where the other distance is very short)
  const tz = Z(plateau()) + 0.03, o = view.project([W(0), W(0), tz], vp), xu = view.project([W(1), W(0), tz], vp), yv = view.project([W(0), W(1), tz], vp);
  ctx.strokeStyle = cssAxis(); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(xu[0], xu[1]); ctx.moveTo(o[0], o[1]); ctx.lineTo(yv[0], yv[1]); ctx.stroke();
  for (const [e, lab] of [[xu, 'A–B distance'], [yv, 'B–C distance']]) {
    const dx = e[0] - o[0], dy = e[1] - o[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
    ctx.fillStyle = cssAxis(); ctx.beginPath();
    ctx.moveTo(e[0], e[1]); ctx.lineTo(e[0] - 9 * ux - 4 * uy, e[1] - 9 * uy + 4 * ux); ctx.lineTo(e[0] - 9 * ux + 4 * uy, e[1] - 9 * uy - 4 * ux); ctx.fill();
    text(ctx, lab, o[0] + dx * 0.78, o[1] + dy * 0.78 - 9, '--text-muted', { size: 12 });
  }

  // inset: the three atoms at the ball's position
  molecule(ctx, q.u, q.v, Eb, s);
}
const cssAxis = () => css(rgb('--plot-axis'));

function molecule(ctx, u, v, E, s) {
  const x0 = 16, y0 = 26, k = 120;              // pixels per unit distance
  const xa = x0 + 9, xb = xa + u * k * 0.55 + 14, xc = xb + v * k * 0.55 + 14, y = y0 + 12;
  const bond = r => (r < r0 * 1.3 ? 'full' : r < r0 * 2.2 ? 'part' : null);
  const lineCol = rgb('--text-muted');
  for (const [p, q, b] of [[xa, xb, bond(u)], [xb, xc, bond(v)]]) {
    if (!b) continue;
    if (b === 'full') { ctx.strokeStyle = css(lineCol); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p, y); ctx.lineTo(q, y); ctx.stroke(); }
    else dashed(ctx, [[p, y], [q, y]], lineCol, 2, [3, 3]);
  }
  ball(ctx, xa, y, 8, rgb('--c0')); ball(ctx, xb, y, 9, rgb('--c1')); ball(ctx, xc, y, 9, rgb('--cB'));
  text(ctx, 'A', xa, y + 24, '--text-muted', { size: 12 }); text(ctx, 'B', xb, y + 24, '--text-muted', { size: 12 }); text(ctx, 'C', xc, y + 24, '--text-muted', { size: 12 });
  const what = s < 0.25 ? 'reactants' : s > 0.75 ? 'products' : Math.abs(s - 0.5) < 0.06 ? 'transition state: bonds half broken, half formed' : s < 0.5 ? 'B–C stretching, A–B forming' : 'A–B forming, B–C breaking';
  text(ctx, `${what} · E = ${sgn(Math.round(E))} kJ/mol`, x0, y0 - 6, '--text', { align: 'left', size: 12 });
}

const pesView = new View3D($('pr-diagram'), drawPES, { az: 0.8, el: 0.68, minEl: 0.1 });

function renderProfile(changed) {
  Ea = +eaIn.value; dE = +deIn.value;
  // the top of the hill can never lie below the products
  if (Ea < dE + 5) {
    if (changed === 'dE') { Ea = Math.min(200, dE + 5); eaIn.value = Ea; }
    else { dE = Ea - 5; deIn.value = dE; }
  }
  const Er = Ea - dE;
  $('pr-Ea-out').textContent = `${Ea} kJ/mol`;
  $('pr-dE-out').textContent = `${sgn(dE)} kJ/mol`;
  $('pr-s-out').textContent = `${sIn.value} %`;
  const rows = [
    ['E<sub>a</sub> forward', `${Ea} kJ/mol`],
    ['ΔE', `${sgn(dE)} kJ/mol (${dE < 0 ? 'exothermic' : dE > 0 ? 'endothermic' : 'thermoneutral'})`],
    ['E<sub>a</sub> reverse = E<sub>a</sub> − ΔE', `${Ea} − (${sgn(dE)}) = <strong>${Er} kJ/mol</strong>`],
    ['k<sub>forward</sub> / k<sub>reverse</sub> at 25 °C (same A)', sci(Math.exp(-(Ea - Er) * 1000 / (R * 298.15)), 2)],
  ];
  $('pr-readout').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal">${b}</td></tr>`).join('');
  $('pr-note').innerHTML = dE < 0
    ? `Exothermic: the product valley lies lower, so going back means climbing ${Er} kJ/mol instead of ${Ea}. The reverse reaction is the slower one.`
    : dE > 0
      ? `Endothermic: the product valley lies higher, so the reverse reaction has the smaller climb (${Er} kJ/mol) and is the faster one.`
      : 'With ΔE = 0 both valleys lie at the same height: both directions climb the same pass and run equally fast.';
  pesView.redraw();
}
eaIn.addEventListener('input', () => renderProfile('Ea'));
deIn.addEventListener('input', () => renderProfile('dE'));
sIn.addEventListener('input', () => { $('pr-s-out').textContent = `${sIn.value} %`; pesView.redraw(); });
let anim = null;
$('pr-go').addEventListener('click', () => {
  if (anim) return;
  const t0 = performance.now(), from = +sIn.value >= 100 ? 0 : +sIn.value, dur = 3500 * (1 - from / 100) + 300;
  const tick = t => {
    const f = Math.min(1, (t - t0) / dur);
    sIn.value = Math.round(from + (100 - from) * f);
    $('pr-s-out').textContent = `${sIn.value} %`; drawPES(pesView);
    anim = f < 1 ? requestAnimationFrame(tick) : null;
  };
  anim = requestAnimationFrame(tick);
});
renderProfile();

/* ------------------------------------------------------------------ */
/* Velocity-space cloud                                                */
/* ------------------------------------------------------------------ */
const t1In = $('mb-T1'), t2In = $('mb-T2'), mbEa = $('mb-Ea');
const M = 0.028;                 // kg/mol (N₂)
const ND = 3000;
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
// one set of standard-normal velocities, scaled by √(RT/M) for each temperature, so the two clouds differ only by T
const G = Array.from({ length: ND }, () => [gauss(), gauss(), gauss()]);
const G2 = G.map(g => g[0] * g[0] + g[1] * g[1] + g[2] * g[2]);
// erfc, Numerical Recipes (relative error < 1.2e-7)
function erfc(x) {
  const t = 1 / (1 + 0.5 * x);
  return t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 +
    t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
}
// fraction of molecules with kinetic energy ≥ Ea in a 3D gas (outside the sphere)
const tail = x => erfc(Math.sqrt(x)) + 2 * Math.sqrt(x / Math.PI) * Math.exp(-x);

let T1 = +t1In.value, T2 = +t2In.value, EaC = +mbEa.value;
function drawCloud(view) {
  const { ctx, w, h } = view.frame();
  if (!w) return;
  const side = w >= 460;                                     // two panels side by side, or one above the other
  const want = side ? '16 / 10' : '4 / 5';
  if (view.cv.style.aspectRatio !== want) { view.cv.style.aspectRatio = want; view.redraw(); return; }
  const pw = side ? w / 2 : w, ph = side ? h : h / 2;
  const ua = Math.sqrt(2 * EaC * 1000 / M);                  // m/s on the sphere
  const sig2 = Math.sqrt(R * T2 / M);
  const Rv = Math.max(3.4 * sig2, 1.12 * ua);                // m/s at the edge of a panel
  const muted = rgb('--text-muted'), axis = rgb('--plot-axis');
  [[T1, '--c0', 0], [T2, '--c1', 1]].forEach(([T, cName, k]) => {
    const ox = side ? k * pw : 0, oy = side ? 0 : k * ph;
    const vp = { cx: ox + pw / 2, cy: oy + ph / 2 + 10, S: Math.min(pw, ph - 34) / 2 / Rv, D: 0 };
    const col = rgb(cName), sT = Math.sqrt(R * T / M), lim = (ua / sT) ** 2;
    // axes through the origin
    for (const [a, lab] of [[[1, 0, 0], 'x'], [[0, 1, 0], 'y'], [[0, 0, 1], 'z']]) {
      const p = view.project(a.map(x => -x * Rv * 0.92), vp), q = view.project(a.map(x => x * Rv * 0.92), vp);
      ctx.strokeStyle = css(axis, 0.6); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      text(ctx, lab, q[0], q[1] - 4, '--text-muted', { size: 11, halo: false });
    }
    // dots: inside the sphere faint, outside strong; drawn back to front
    const pts = [];
    let out = 0;
    for (let i = 0; i < ND; i++) {
      const o = G2[i] >= lim; if (o) out++;
      const p = view.project(G[i].map(x => x * sT), vp);
      pts.push([p[0], p[1], p[2], o]);
    }
    pts.sort((a, b) => a[2] - b[2]);
    for (const [x, y, , o] of pts) {
      if (o) continue;
      ctx.fillStyle = css(col, 0.28); ctx.fillRect(x - 1, y - 1, 2, 2);
    }
    // sphere (orthographic: its outline is a circle) with its equator and a meridian for depth
    const c = view.project([0, 0, 0], vp), r = ua * vp.S;
    const ink = rgb('--text');
    ctx.fillStyle = css(ink, 0.04); ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, 2 * Math.PI); ctx.fill();
    for (const ring of [k2 => [Math.cos(k2), Math.sin(k2), 0], k2 => [Math.cos(k2), 0, Math.sin(k2)]]) {
      ctx.beginPath();
      for (let i = 0; i <= 72; i++) { const p = view.project(ring(i / 72 * 2 * Math.PI).map(x => x * ua), vp); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.strokeStyle = css(ink, 0.25); ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, 2 * Math.PI); ctx.strokeStyle = css(ink, 0.75); ctx.lineWidth = 1.8; ctx.stroke();
    for (const [x, y, , o] of pts) {
      if (!o) continue;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI); ctx.fillStyle = css(col); ctx.fill();
      ctx.strokeStyle = css(rgb('--bg')); ctx.lineWidth = 1; ctx.stroke();
    }
    text(ctx, `${T} K: ${out} of ${ND} outside`, ox + pw / 2, oy + 18, '--text', { bold: true, size: 13 });
    ctx.fillStyle = css(col); ctx.fillRect(ox + pw / 2 - ctx.measureText(`${T} K: ${out} of ${ND} outside`).width / 2 - 16, oy + 9, 10, 10);
    if (k === 0 && side) { ctx.strokeStyle = css(axis, 0.35); ctx.beginPath(); ctx.moveTo(pw, 8); ctx.lineTo(pw, h - 8); ctx.stroke(); }
    if (k === 0 && !side) { ctx.strokeStyle = css(axis, 0.35); ctx.beginPath(); ctx.moveTo(8, ph); ctx.lineTo(w - 8, ph); ctx.stroke(); }
  });
  text(ctx, `sphere: ½Mu² = Eₐ, u = ${Math.round(ua)} m/s (N₂)`, w - 8, h - 8, '--text-muted', { align: 'right', size: 11 });
}
const cloudView = new View3D($('mb-plot'), drawCloud, { az: -0.9, el: 0.35 });

function renderMB(changed) {
  T1 = +t1In.value; T2 = +t2In.value;
  if (T2 < T1 + 5) { if (changed === 'T1') { T2 = Math.min(1000, T1 + 5); t2In.value = T2; } else { T1 = T2 - 5; t1In.value = T1; } }
  EaC = +mbEa.value;
  const RT1 = R * T1 / 1000, RT2 = R * T2 / 1000;
  $('mb-T1-out').textContent = `${T1} K`;
  $('mb-T2-out').textContent = `${T2} K`;
  $('mb-Ea-out').textContent = `${EaC} kJ/mol`;
  const q1 = tail(EaC / RT1), q2 = tail(EaC / RT2), fr1 = Math.exp(-EaC / RT1), fr2 = Math.exp(-EaC / RT2);
  const pf = x => (x >= 1e-3 ? `${sig(100 * x, 3)} %` : sci(x, 2));
  const rows = [
    [`Outside the sphere at ${T1} K`, pf(q1)],
    [`Outside the sphere at ${T2} K`, pf(q2)],
    ['Ratio (higher T / lower T)', `<strong>${sig(q2 / q1, 3)}</strong>`],
    ['Brown: ratio of f = e<sup>−E<sub>a</sub>/RT</sup>', sig(fr2 / fr1, 3)],
    ['Ratio of mean speeds', sig(Math.sqrt(T2 / T1), 3)],
  ];
  $('mb-readout').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td class="num">${b}</td></tr>`).join('');
  const brown = EaC >= 95 && EaC <= 105 && T1 === 300 && T2 === 320 ? ' These are Brown\'s numbers (14.5): Eₐ = 100 kJ/mol, 300 K → 320 K.' : '';
  const none = q2 * ND < 0.5 ? ` At this E<sub>a</sub> not one of the ${ND} dots makes it out, even at ${T2} K: in a real gas with 10²³ molecules some still do.` : '';
  $('mb-note').innerHTML = `Heating by ${T2 - T1} K (${sig(100 * (T2 / T1 - 1), 2)} % in kelvin) makes the cloud only ` +
    `${sig(100 * (Math.sqrt(T2 / T1) - 1), 2)} % wider (the mean speed), but multiplies the number of molecules outside the sphere by ${sig(q2 / q1, 3)}. ` +
    `The larger E<sub>a</sub>, the stronger this effect.${none}${brown}`;
  cloudView.redraw();
}
t1In.addEventListener('input', () => renderMB('T1'));
t2In.addEventListener('input', () => renderMB('T2'));
mbEa.addEventListener('input', () => renderMB());
renderMB();
