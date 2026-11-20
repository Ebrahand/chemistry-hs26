// Module 2: hydrogen line spectrum, Bohr energy levels, and the uncertainty principle.
// Constants as in Lecture 6: E_n = −2.18×10⁻¹⁸ J / n², h = 6.626×10⁻³⁴ J s, c = 2.998×10⁸ m/s.

import { cssColor } from '../assets/plot.js';
import { sci, sig } from '../assets/format.js';
import { h, c, NA, region, lambdaRGB, lengthStr } from './light.js';

const $ = id => document.getElementById(id);
const RY = 2.18e-18;                       // J
const En = n => (n === Infinity ? 0 : -RY / (n * n));
const SERIES = { 1: 'Lyman', 2: 'Balmer', 3: 'Paschen', 4: 'Brackett', 5: 'Pfund' };
const font = () => getComputedStyle(document.body).fontFamily;

function setupCanvas(cv) {
  const ctx = cv.getContext('2d');
  const w = cv.clientWidth, H = cv.clientHeight;
  if (!w) return null;
  const dpr = window.devicePixelRatio || 1;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(H * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, H);
  return { ctx, w, H };
}

/* ------------------------------------------------------------------ */
/* Visible lines of hydrogen                                           */
/* ------------------------------------------------------------------ */
{
  const cv = $('h-lines');
  const lines = [3, 4, 5, 6].map(n => h * c / (En(n) - En(2)) * 1e9);
  function draw() {
    const s = setupCanvas(cv); if (!s) return;
    const { ctx, w, H } = s;
    const X = nm => 10 + (nm - 380) / (720 - 380) * (w - 20);
    const y0 = 6, bh = H - 30;
    ctx.fillStyle = '#000'; ctx.fillRect(10, y0, w - 20, bh);
    ctx.fillStyle = cssColor('--text-muted'); ctx.font = `11px ${font()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const nm of lines) {
      ctx.fillStyle = lambdaRGB(nm);
      ctx.fillRect(X(nm) - 2, y0, 4, bh);
      ctx.fillStyle = cssColor('--text-muted');
      ctx.fillText(`${Math.round(nm)} nm`, X(nm), y0 + bh + 4);
    }
  }
  new ResizeObserver(draw).observe(cv);
}

/* ------------------------------------------------------------------ */
/* Bohr energy levels                                                  */
/* ------------------------------------------------------------------ */
{
  let ni = 3, nf = 1, found = false;
  const NI = [1, 2, 3, 4, 5, 6, 7], NF = [1, 2, 3, 4, 5, 6, 7, Infinity];
  const lab = n => (n === Infinity ? '∞' : String(n));
  function seg(id, values, get, set) {
    const root = $(id);
    for (const v of values) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = lab(v); b.dataset.v = v;
      b.addEventListener('click', () => { set(v); update(); });
      root.appendChild(b);
    }
    return () => root.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.v === get() || (b.dataset.v === 'Infinity' && get() === Infinity)));
  }
  const syncI = seg('bohr-ni', NI, () => ni, v => { ni = v; });
  const syncF = seg('bohr-nf', NF, () => nf, v => { nf = v; });

  function photon() {
    if (ni === nf) return null;
    const dE = En(nf) - En(ni);
    const lam = h * c / Math.abs(dE);
    return { dE, lam, emitted: dE < 0 };
  }

  function drawLevels() {
    const s = setupCanvas($('bohr-levels')); if (!s) return;
    const { ctx, w, H } = s;
    const top = 16, bot = H - 14, left = w < 420 ? 34 : 44, right = w - (w < 420 ? 96 : 130);
    const Y = E => top + (E / -RY) * (bot - top);   // 0 at top, −2.18e-18 at bottom
    const text = cssColor('--text'), muted = cssColor('--text-muted'), axis = cssColor('--plot-axis');
    ctx.font = `${w < 420 ? 11 : 12}px ${font()}`; ctx.textBaseline = 'middle';
    for (const n of [...NI, Infinity]) {
      const y = Y(En(n));
      const active = n === ni || n === nf;
      ctx.strokeStyle = active ? text : axis; ctx.lineWidth = active ? 2.2 : 1;
      ctx.setLineDash(n === Infinity ? [4, 4] : []);
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = active ? text : muted; ctx.textAlign = 'right';
      if (n <= 4 || n === Infinity) ctx.fillText(`n = ${lab(n)}`, left - 4, y);
      ctx.textAlign = 'left';
      if (n <= 3 || n === Infinity) ctx.fillText(n === Infinity ? '0 (electron free)' : `${sci(En(n), 3)} J`, right + 6, y);
    }
    const p = photon();
    if (p) {
      const x = left + (right - left) * 0.5, y1 = Y(En(ni)), y2 = Y(En(nf));
      const col = p.lam > 380e-9 && p.lam < 780e-9 ? lambdaRGB(p.lam * 1e9) : cssColor(p.emitted ? '--c0' : '--c1');
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2 + (y2 > y1 ? -9 : 9)); ctx.stroke();
      ctx.beginPath(); const dir = y2 > y1 ? 1 : -1;
      ctx.moveTo(x, y2); ctx.lineTo(x - 7, y2 - dir * 11); ctx.lineTo(x + 7, y2 - dir * 11); ctx.fill();
      // wavy photon
      const ym = (y1 + y2) / 2, x0 = x + 14;
      ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 60; i++) { const xx = x0 + i; const yy = ym + 5 * Math.sin(i / 4); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke();
      ctx.fillStyle = text; ctx.textAlign = 'left';
      ctx.fillText(p.emitted ? 'photon out' : 'photon in', x0, ym - 14);
    }
  }

  function drawSpectrum() {
    const s = setupCanvas($('bohr-spec')); if (!s) return;
    const { ctx, w, H } = s;
    const L0 = Math.log10(80e-9), L1 = Math.log10(8e-6);
    const X = lam => 8 + (Math.log10(lam) - L0) / (L1 - L0) * (w - 16);
    const top = 4, bh = H - 26;
    const muted = cssColor('--text-muted'), text = cssColor('--text');
    ctx.fillStyle = cssColor('--surface-2'); ctx.fillRect(8, top, w - 16, bh);
    const g = ctx.createLinearGradient(X(400e-9), 0, X(750e-9), 0);
    for (let nm = 400; nm <= 750; nm += 25) g.addColorStop((nm - 400) / 350, lambdaRGB(nm));
    ctx.globalAlpha = 0.35; ctx.fillStyle = g; ctx.fillRect(X(400e-9), top, X(750e-9) - X(400e-9), bh); ctx.globalAlpha = 1;
    ctx.font = `${w < 500 ? 9 : 11}px ${font()}`; ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const [lam, t] of [[100e-9, '100 nm'], [200e-9, '200'], [500e-9, '500'], [1e-6, '1 µm'], [2e-6, '2 µm'], [5e-6, '5 µm']]) ctx.fillText(t, X(lam), top + bh + 4);
    const lower = Math.min(ni, nf);
    if (lower === Infinity) return;
    ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.fillStyle = muted;
    ctx.fillText(`${SERIES[lower] || ''} series: all lines ending on n = ${lower}`, 12, top + 3);
    for (let up = lower + 1; up <= lower + 25; up++) {
      const lam = h * c / (En(up) - En(lower));
      if (lam > 8e-6) continue;
      ctx.strokeStyle = muted; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(X(lam), top + 18); ctx.lineTo(X(lam), top + bh); ctx.stroke();
    }
    const p = photon();
    if (p && Math.max(ni, nf) !== Infinity && p.lam < 8e-6) {
      ctx.strokeStyle = text; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(X(p.lam), top + 14); ctx.lineTo(X(p.lam), top + bh); ctx.stroke();
    }
  }

  function update() {
    syncI(); syncF();
    const p = photon();
    const rows = [
      ['E<sub>initial</sub>', `${sci(En(ni), 3)} J`],
      ['E<sub>final</sub>', nf === Infinity ? '0 J' : `${sci(En(nf), 3)} J`],
    ];
    if (p) {
      rows.push(['ΔE = E<sub>f</sub> − E<sub>i</sub>', `${p.dE > 0 ? '+' : ''}${sci(p.dE, 3)} J`]);
      rows.push(['photon', p.emitted ? 'emitted' : 'absorbed']);
      if (nf !== Infinity) {
        rows.push(['λ = hc / |ΔE|', lengthStr(p.lam)]);
        rows.push(['region', region(p.lam)]);
      }
    }
    $('bohr-table').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td class="num">${b}</td></tr>`).join('');
    let note;
    if (!p) note = 'Pick two different levels.';
    else if (nf === Infinity) {
      note = `Taking the electron from n = ${ni} all the way out (n = ∞) costs ${sci(-En(ni), 3)} J per atom, ` +
        `or ${Math.round(-En(ni) * NA / 1000)} kJ/mol. ${ni === 1 ? 'The measured ionization energy of hydrogen is 1312 kJ/mol (section 5): Bohr gets it right.' : ''}`;
    } else {
      const lower = Math.min(ni, nf), reg = region(p.lam);
      note = `${p.emitted ? 'Emission' : 'Absorption'}, ${SERIES[lower] || ''} series (lower level n = ${lower}). ` +
        `λ = ${lengthStr(p.lam)}, ${reg}${reg === 'visible' ? ' light' : ''}.`;
      if (p.emitted && Math.abs(p.lam - 94.974e-9) / 94.974e-9 < 0.003) {
        note += ' <strong>This is the mystery line from problem set 6!</strong>';
        found = true;
      }
      if (!p.emitted) note += ' To go up, the atom must absorb a photon of exactly this energy.';
    }
    $('bohr-note').innerHTML = note;
    const tag = $('bohr-mystery');
    tag.textContent = found ? 'found: 5 → 1' : 'not found yet';
    tag.className = found ? 'tag live' : 'tag';
    drawLevels(); drawSpectrum();
  }
  new ResizeObserver(() => { drawLevels(); }).observe($('bohr-levels'));
  new ResizeObserver(() => { drawSpectrum(); }).observe($('bohr-spec'));
  update();
}

/* ------------------------------------------------------------------ */
/* Uncertainty principle                                               */
/* ------------------------------------------------------------------ */
{
  const OBJ = {
    electron: { label: 'electron', m: 9.109e-31, size: null, dv: 6, what: 'an electron in an atom' },
    proton: { label: 'proton', m: 1.673e-27, size: 1.7e-15, dv: 2, what: 'a proton at (5.00 ± 0.01) × 10⁴ m/s (problem set 6)' },
    mosquito: { label: 'mosquito', m: 1.5e-6, size: 5e-3, dv: -2, what: 'a 1.50 mg mosquito, speed known to ±0.01 m/s (problem set 6)' },
    golf: { label: 'golf ball', m: 0.045, size: 0.043, dv: -2, what: 'a 45 g golf ball' },
  };
  let obj = 'electron';
  const slider = $('hup-dv');
  for (const [k, o] of Object.entries(OBJ)) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = o.label; b.dataset.v = k;
    b.addEventListener('click', () => { obj = k; slider.value = o.dv; update(); });
    $('hup-obj').appendChild(b);
  }
  function draw(dx) {
    const s = setupCanvas($('hup-scale')); if (!s) return;
    const { ctx, w, H } = s;
    const L0 = -36, L1 = 0;
    const X = L => 10 + (L - L0) / (L1 - L0) * (w - 20);
    const y = H * 0.42;
    const muted = cssColor('--text-muted'), text = cssColor('--text');
    ctx.strokeStyle = cssColor('--plot-axis'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(w - 10, y); ctx.stroke();
    ctx.font = `${w < 500 ? 9 : 11}px ${font()}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = muted;
    for (let L = L0; L <= L1; L += 6) {
      ctx.beginPath(); ctx.moveTo(X(L), y - 3); ctx.lineTo(X(L), y + 3); ctx.stroke();
      ctx.textAlign = L === L0 ? 'left' : L === L1 ? 'right' : 'center';
      ctx.fillText(L === 0 ? '1 m' : `10${['⁻³⁶','⁻³⁰','⁻²⁴','⁻¹⁸','⁻¹²','⁻⁶'][(L + 36) / 6]} m`, X(L), y + 6);
    }
    const marks = [
      [Math.log10(1e-10), 'atom', '--c2'], [Math.log10(1e-15), 'nucleus', '--c3'],
    ];
    if (OBJ[obj].size) marks.push([Math.log10(OBJ[obj].size), OBJ[obj].label, '--c1']);
    ctx.textBaseline = 'bottom';
    marks.forEach(([L, t, col], i) => {
      ctx.fillStyle = cssColor(col); ctx.beginPath(); ctx.arc(X(L), y, 4, 0, 7); ctx.fill();
      ctx.fillText(t, X(L), y - 6 - (i === 2 && Math.abs(L - marks[0][0]) < 3 ? 12 : 0));
    });
    const Ld = Math.max(L0, Math.min(L1, Math.log10(dx)));
    ctx.strokeStyle = cssColor('--c0'); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(X(Ld), y - 22); ctx.lineTo(X(Ld), y + 2); ctx.stroke();
    ctx.fillStyle = cssColor('--c0'); ctx.font = `600 ${w < 500 ? 10 : 12}px ${font()}`;
    ctx.textAlign = Ld < -33 ? 'left' : Ld > -3 ? 'right' : 'center';
    ctx.fillText('Δx', X(Ld), y - 24);
  }
  function update() {
    $('hup-obj').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === obj));
    const o = OBJ[obj], dv = Math.pow(10, +slider.value);
    const dx = h / (4 * Math.PI * o.m * dv);
    $('hup-dv-out').textContent = `${sig(dv, 2)} m/s`;
    let note = `For ${o.what}: Δx ≥ h / (4π m Δv) = ${sci(dx, 3)} m.`;
    if (obj === 'electron') {
      note += dx > 1e-11 ? ` That is ${dx > 1e-10 ? 'larger than' : 'comparable to'} the size of an atom (about 10⁻¹⁰ m): we cannot say where in the atom the electron is.`
        : ' Now the position is sharper, but only because the speed is extremely uncertain.';
    } else if (o.size) {
      const ratio = dx / o.size;
      note += ratio < 1e-6 ? ` That is ${sci(ratio, 1)} times the size of the ${o.label} itself: completely unnoticeable.`
        : ` That is ${sig(ratio, 2)} times the size of the ${o.label}: quantum effects matter here.`;
    }
    $('hup-note').textContent = note;
    draw(dx);
  }
  slider.value = OBJ[obj].dv;
  slider.addEventListener('input', update);
  new ResizeObserver(() => update()).observe($('hup-scale'));
  update();
}
