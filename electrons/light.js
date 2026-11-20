// Module 1: wavelength, frequency and photon energy across the electromagnetic spectrum.

import { cssColor } from '../assets/plot.js';
import { sci, sig } from '../assets/format.js';

export const h = 6.626e-34, c = 2.998e8, NA = 6.022e23;
const $ = id => document.getElementById(id);

// Approximate regions (boundaries are conventions; visible as in the problem-set solutions, 400–750 nm)
const REGIONS = [
  { name: 'gamma rays', lo: -13, hi: -11 },
  { name: 'X-rays', lo: -11, hi: -8 },
  { name: 'ultraviolet', lo: -8, hi: Math.log10(4e-7) },
  { name: 'visible', lo: Math.log10(4e-7), hi: Math.log10(7.5e-7) },
  { name: 'infrared', lo: Math.log10(7.5e-7), hi: -3 },
  { name: 'microwaves', lo: -3, hi: 0 },
  { name: 'radio waves', lo: 0, hi: 2 },
];
export const region = lam => {
  const L = Math.log10(lam);
  return (REGIONS.find(r => L >= r.lo && L < r.hi) || REGIONS[L < -11 ? 0 : 6]).name;
};

// Colour of visible light (approximation after D. Bruton); null outside 380–780 nm
export function lambdaRGB(nm) {
  if (nm < 380 || nm > 780) return null;
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else r = 1;
  const f = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (780 - nm) / 80 : 1;
  const to = v => Math.round(255 * Math.pow(v * f, 0.8));
  return `rgb(${to(r)}, ${to(g)}, ${to(b)})`;
}

// Length with a sensible unit
export function lengthStr(m) {
  const units = [[1, 'm'], [1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm'], [1e-12, 'pm']];
  for (const [f, u] of units) if (m >= f * 0.9999) return `${sig(m / f, 3)} ${u}`;
  return `${sci(m, 3)} m`;
}

{
  const slider = $('em-lam'), cv = $('em-band'), ctx = cv.getContext('2d');
  const PRESETS = [
    ['10 µm', 1e-5], ['5.50 × 10¹⁴ s⁻¹', c / 5.5e14], ['413 nm', 413e-9], ['EUV chip lithography, 13.5 nm', 13.5e-9],
    ['X-rays, 0.1 nm', 1e-10], ['microwave oven, 12.2 cm', 0.122], ['FM radio, 100 MHz', c / 1e8],
  ];
  for (const [label, lam] of PRESETS) {
    const b = document.createElement('button');
    b.className = 'btn'; b.type = 'button'; b.textContent = label;
    b.addEventListener('click', () => { slider.value = Math.log10(lam); update(); });
    $('em-presets').appendChild(b);
  }

  function draw(lam) {
    const w = cv.clientWidth, H = cv.clientHeight; if (!w) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, H);
    const font = getComputedStyle(document.body).fontFamily;
    const L0 = -12, L1 = 1, pad = 6;
    const X = L => pad + (L - L0) / (L1 - L0) * (w - 2 * pad);
    const top = 18, bh = H * 0.34;
    const text = cssColor('--text'), muted = cssColor('--text-muted'), surf2 = cssColor('--surface-2'), border = cssColor('--border');
    // regions
    REGIONS.forEach((r, i) => {
      const x0 = X(Math.max(r.lo, L0)), x1 = X(Math.min(r.hi, L1));
      if (r.name === 'visible') {
        const g = ctx.createLinearGradient(x0, 0, x1, 0);
        for (let nm = 400; nm <= 750; nm += 25) g.addColorStop((nm - 400) / 350, lambdaRGB(nm));
        ctx.fillStyle = g;
      } else ctx.fillStyle = i % 2 ? surf2 : cssColor('--bg');
      ctx.fillRect(x0, top, x1 - x0, bh);
      ctx.strokeStyle = border; ctx.strokeRect(x0 + 0.5, top + 0.5, x1 - x0, bh);
      if (r.name !== 'visible') {
        ctx.fillStyle = muted; ctx.font = `${w < 500 ? 10 : 12}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const label = w < 500 ? { 'gamma rays': 'γ', 'X-rays': 'X', ultraviolet: 'UV', infrared: 'IR', microwaves: 'micro', 'radio waves': 'radio' }[r.name] : r.name;
        ctx.fillText(label, (x0 + x1) / 2, top + bh / 2);
      }
    });
    // wavelength ticks
    ctx.fillStyle = muted; ctx.font = `${w < 500 ? 9 : 11}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const [L, t] of [[-12, '1 pm'], [-9, '1 nm'], [-6, '1 µm'], [-3, '1 mm'], [0, '1 m']]) {
      ctx.fillText(t, Math.min(w - 16, Math.max(14, X(L))), top + bh + 3);
    }
    // wave: short on the left, long on the right
    const wy = top + bh + 30, amp = Math.min(12, H * 0.08);
    ctx.strokeStyle = muted; ctx.lineWidth = 1.2; ctx.beginPath();
    let phase = 0, prevx = pad;
    for (let x = pad; x <= w - pad; x += 0.5) {
      const L = L0 + (x - pad) / (w - 2 * pad) * (L1 - L0);
      const pxPerWave = 3 + 60 * (L - L0) / (L1 - L0);
      phase += (x - prevx) / pxPerWave * 2 * Math.PI; prevx = x;
      const y = wy + amp * Math.sin(phase);
      x === pad ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('← higher energy, higher frequency', pad, wy + amp + 4);
    ctx.textAlign = 'right'; ctx.fillText('longer wavelength →', w - pad, wy + amp + 4);
    // marker
    const xm = X(Math.log10(lam));
    ctx.strokeStyle = text; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(xm, top - 4); ctx.lineTo(xm, top + bh + 2); ctx.stroke();
    ctx.fillStyle = text; ctx.beginPath(); ctx.moveTo(xm - 6, 4); ctx.lineTo(xm + 6, 4); ctx.lineTo(xm, top - 3); ctx.fill();
  }

  function update() {
    const lam = Math.pow(10, +slider.value);
    const nu = c / lam, E = h * c / lam, Emol = E * NA / 1000;
    const reg = region(lam);
    $('em-lam-out').textContent = lengthStr(lam);
    $('em-table').innerHTML = `
      <tr><td>wavelength λ</td><td class="num">${lengthStr(lam)} = ${sci(lam, 3)} m</td></tr>
      <tr><td>frequency ν = c/λ</td><td class="num">${sci(nu, 3)} s⁻¹</td></tr>
      <tr><td>energy of one photon, E = hc/λ</td><td class="num">${sci(E, 3)} J</td></tr>
      <tr><td>energy of 1 mol of photons</td><td class="num">${sig(Emol, 3)} kJ/mol</td></tr>
      <tr><td>region</td><td>${reg}</td></tr>`;
    const nm = lam * 1e9, col = lambdaRGB(nm);
    const sw = col ? `<span class="swatch" style="background:${col};width:14px;height:14px;vertical-align:-2px"></span> ` : '';
    let note;
    if (reg === 'visible') note = `${sw}Visible light, ${Math.round(nm)} nm. One mole of these photons carries ${sig(Emol, 3)} kJ, ${Math.round(Emol / 348 * 100)} % of what it takes to break a mole of C–C bonds (348 kJ/mol).`;
    else if (Emol > 348) note = `Each photon has more than enough energy to break a chemical bond (C–C: 348 kJ/mol). This is why ${reg === 'ultraviolet' ? 'UV light causes sunburn and fades colours' : reg + ' damage molecules such as DNA'}.`;
    else if (reg === 'infrared') note = `Infrared photons are too weak to break bonds, but they make molecules vibrate: this is heat radiation. One mole of them carries ${sig(Emol, 3)} kJ.`;
    else if (reg === 'microwaves') note = `Microwave photons make molecules rotate. A microwave oven heats food through the water molecules in it. One mole of photons: only ${sig(Emol * 1000, 3)} J.`;
    else note = `Radio photons carry almost no energy each (${sci(E, 2)} J). Radio waves are harmless to molecules and pass through walls.`;
    $('em-note').innerHTML = note;
    draw(lam);
  }
  slider.addEventListener('input', update);
  new ResizeObserver(() => draw(Math.pow(10, +slider.value))).observe(cv);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', update);
  update();
}
