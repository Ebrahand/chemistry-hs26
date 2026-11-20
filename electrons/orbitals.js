// Module 3: hydrogen orbitals as a rotatable electron cloud, radial probability, and a quantum-number checker.
// Exact hydrogen wavefunctions: psi = R_nl(r) * (real angular function). Lengths in Bohr radii a0 = 0.529 Å.

import { Plot, cssColor } from '../assets/plot.js';
import { sig } from '../assets/format.js';

const $ = id => document.getElementById(id);
const A0 = 0.529;   // Å
const LETTER = 'spdf';

// Real angular parts as functions of a unit vector (x, y, z); normalisation is irrelevant here.
const ORIENT = {
  0: [{ key: 's', html: 's', f: () => 1, ml: '0' }],
  1: [
    { key: 'pz', html: 'p<sub>z</sub>', f: (x, y, z) => z, ml: '0' },
    { key: 'px', html: 'p<sub>x</sub>', f: x => x, ml: '±1 (combination)' },
    { key: 'py', html: 'p<sub>y</sub>', f: (x, y) => y, ml: '±1 (combination)' },
  ],
  2: [
    { key: 'dz2', html: 'd<sub>z²</sub>', f: (x, y, z) => 3 * z * z - 1, ml: '0' },
    { key: 'dxz', html: 'd<sub>xz</sub>', f: (x, y, z) => x * z, ml: '±1 (combination)' },
    { key: 'dyz', html: 'd<sub>yz</sub>', f: (x, y, z) => y * z, ml: '±1 (combination)' },
    { key: 'dxy', html: 'd<sub>xy</sub>', f: (x, y) => x * y, ml: '±2 (combination)' },
    { key: 'dx2y2', html: 'd<sub>x²−y²</sub>', f: (x, y) => x * x - y * y, ml: '±2 (combination)' },
  ],
  3: [
    { key: 'fz3', html: 'f<sub>z³</sub>', f: (x, y, z) => z * (5 * z * z - 3), ml: '0' },
    { key: 'fxz2', html: 'f<sub>xz²</sub>', f: (x, y, z) => x * (5 * z * z - 1), ml: '±1' },
    { key: 'fyz2', html: 'f<sub>yz²</sub>', f: (x, y, z) => y * (5 * z * z - 1), ml: '±1' },
    { key: 'fxyz', html: 'f<sub>xyz</sub>', f: (x, y, z) => x * y * z, ml: '±2' },
    { key: 'fzx2', html: 'f<sub>z(x²−y²)</sub>', f: (x, y, z) => z * (x * x - y * y), ml: '±2' },
    { key: 'fx3', html: 'f<sub>x(x²−3y²)</sub>', f: (x, y) => x * (x * x - 3 * y * y), ml: '±3' },
    { key: 'fy3', html: 'f<sub>y(3x²−y²)</sub>', f: (x, y) => y * (3 * x * x - y * y), ml: '±3' },
  ],
};

// Generalised Laguerre polynomial L_k^(a)(x)
function laguerre(k, a, x) {
  if (k === 0) return 1;
  let L0 = 1, L1 = 1 + a - x;
  for (let i = 1; i < k; i++) { const L2 = ((2 * i + 1 + a - x) * L1 - (i + a) * L0) / (i + 1); L0 = L1; L1 = L2; }
  return L1;
}
export const radial = (n, l, r) => { const rho = 2 * r / n; return Math.pow(rho, l) * Math.exp(-rho / 2) * laguerre(n - l - 1, 2 * l + 1, rho); };

// Radial probability P(r) = r² R², normalised to area 1 (per a0), on a grid
function radialTable(n, l) {
  const rT = 4 * n * n + 12, N = 3000, dr = rT / N;
  const r = new Float64Array(N + 1), P = new Float64Array(N + 1), cdf = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) { r[i] = i * dr; const R = radial(n, l, r[i]); P[i] = r[i] * r[i] * R * R; }
  for (let i = 1; i <= N; i++) cdf[i] = cdf[i - 1] + 0.5 * (P[i] + P[i - 1]) * dr;
  const tot = cdf[N];
  for (let i = 0; i <= N; i++) { P[i] /= tot; cdf[i] /= tot; }
  const rAt = q => { let i = 0; while (i < N && cdf[i] < q) i++; return r[i]; };
  let imax = 0; for (let i = 0; i <= N; i++) if (P[i] > P[imax]) imax = i;
  return { r, P, cdf, N, rAt, rMostProb: r[imax] };
}

/* ------------------------------------------------------------------ */
/* Orbital viewer                                                      */
/* ------------------------------------------------------------------ */
{
  let n = 2, l = 1, o = 0;
  let az = 0.55, el = 0.32;      // camera azimuth / elevation (radians)
  let pts = [], viewR = 10, tab = null;
  const cv = $('orb-cloud'), ctx = cv.getContext('2d');
  const plot = new Plot($('orb-radial'));
  const fixedBox = $('orb-fixed'), signBox = $('orb-sign');
  let fixedR = null;

  function sample() {
    tab = radialTable(n, l);
    const ang = ORIENT[l][o].f;
    let amax = 0;
    for (let i = 0; i < 3000; i++) {
      const [x, y, z] = randDir(); const a = ang(x, y, z); amax = Math.max(amax, a * a);
    }
    amax *= 1.15;
    const out = [], want = 26000;
    let guard = 0;
    while (out.length < want && guard++ < want * 40) {
      const [x, y, z] = randDir();
      const a = ang(x, y, z);
      if (Math.random() * amax > a * a) continue;
      // radius from the inverse CDF
      const q = Math.random();
      let lo = 0, hi = tab.N;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (tab.cdf[mid] < q) lo = mid; else hi = mid; }
      const r = tab.r[hi];
      const sign = Math.sign(a * radial(n, l, r)) || 1;
      out.push([x * r, y * r, z * r, sign]);
    }
    pts = out;
    viewR = tab.rAt(0.99) * 1.05;
  }
  function randDir() {
    const z = 2 * Math.random() - 1, t = 2 * Math.PI * Math.random(), s = Math.sqrt(1 - z * z);
    return [s * Math.cos(t), s * Math.sin(t), z];
  }
  if (fixedR === null) fixedR = radialTable(4, 0).rAt(0.99) * 1.05;

  function draw() {
    const w = cv.clientWidth, H = cv.clientHeight; if (!w) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, H);
    const R = fixedBox.checked ? fixedR : viewR;
    const S = Math.min(w, H) / 2 / R, cx = w / 2, cy = H / 2;
    const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
    const u = [-sa, ca, 0], v = [-se * ca, -se * sa, ce];
    const P = p => [cx + S * (p[0] * u[0] + p[1] * u[1] + p[2] * u[2]), cy - S * (p[0] * v[0] + p[1] * v[1] + p[2] * v[2])];
    // axes
    const axis = cssColor('--plot-axis'), muted = cssColor('--text-muted');
    ctx.strokeStyle = axis; ctx.lineWidth = 1; ctx.font = `12px ${getComputedStyle(document.body).fontFamily}`;
    ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [d, name] of [[[1, 0, 0], 'x'], [[0, 1, 0], 'y'], [[0, 0, 1], 'z']]) {
      const a = P(d.map(k => -k * R * 0.92)), b = P(d.map(k => k * R * 0.92)), t = P(d.map(k => k * R * 0.99));
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.fillText(name, t[0], t[1]);
    }
    const pos = cssColor('--c1'), neg = cssColor(signBox.checked ? '--c0' : '--c1');
    const n3d = Math.min(pts.length, 5000);
    const dot = Math.max(1, Math.min(2, w / 220));
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < n3d; i++) {
      const p = pts[i];
      const [x, y] = P(p);
      ctx.fillStyle = p[3] > 0 ? pos : neg;
      ctx.fillRect(x - dot / 2, y - dot / 2, dot, dot);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = cssColor('--c2'); ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, 7); ctx.fill();
    // scale bar
    const nice = [0.5, 1, 2, 5, 10, 20].find(v => v / A0 * S > w * 0.12) || 20;
    const bar = nice / A0 * S;
    ctx.strokeStyle = cssColor('--text'); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(10, H - 12); ctx.lineTo(10 + bar, H - 12); ctx.stroke();
    ctx.fillStyle = cssColor('--text'); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(`${nice} Å`, 10, H - 16);
    ctx.fillStyle = muted; ctx.textAlign = 'right'; ctx.fillText('drag to turn', w - 8, H - 6);
  }

  function radialPlot() {
    const R = (fixedBox.checked ? fixedR : viewR);
    const pts2 = (nn, ll) => { const t = radialTable(nn, ll); const out = []; for (let i = 0; i <= t.N; i += 6) if (t.r[i] <= R) out.push([t.r[i] * A0, t.P[i] / A0]); return out; };
    const series = [];
    const others = [];
    for (let ll = 0; ll < n; ll++) if (ll !== l) others.push({ points: pts2(n, ll), color: '--cB', width: 1.5, dash: [5, 4] });
    const main = pts2(n, l);
    series.push(...others, { points: main, color: '--c1', width: 2.6 });
    const ymax = Math.max(...main.map(p => p[1]), ...others.flatMap(s => s.points.map(p => p[1])));
    const texts = [{ x: R * A0 * 0.97, y: ymax * 1.08, text: `${n}${LETTER[l]}`, align: 'right', bold: true, color: '--c1' }];
    others.forEach((s, i) => {
      const ll = [...Array(n).keys()].filter(k => k !== l)[i];
      const peak = s.points.reduce((a, b) => (b[1] > a[1] ? b : a));
      texts.push({ x: peak[0], y: peak[1], text: `${n}${LETTER[ll]}`, color: '--text-muted', dy: -8, align: 'center' });
    });
    plot.draw({
      x: { min: 0, max: R * A0, label: 'distance from nucleus r (Å)' },
      y: { min: 0, max: ymax * 1.15, label: 'radial probability', tickFormat: () => '' },
      series, texts, padL: 34,
    });
  }

  function seg(root, items, get, set) {
    root.innerHTML = '';
    items.forEach((it, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.innerHTML = it; b.setAttribute('aria-pressed', i === get());
      b.addEventListener('click', () => { set(i); update(); });
      root.appendChild(b);
    });
  }

  function update(resample = true) {
    if (l > n - 1) l = n - 1;
    if (o >= ORIENT[l].length) o = 0;
    seg($('orb-n'), ['1', '2', '3', '4'], () => n - 1, i => { n = i + 1; });
    seg($('orb-l'), [...Array(n).keys()].map(k => `${k} (${LETTER[k]})`), () => l, i => { l = i; o = 0; });
    seg($('orb-m'), ORIENT[l].map(x => x.html), () => o, i => { o = i; });
    if (resample) sample();
    const or = ORIENT[l][o];
    const mls = [...Array(2 * l + 1).keys()].map(k => k - l).map(v => (v > 0 ? '+' : '') + v).join(', ').replace(/-/g, '−');
    $('orb-table').innerHTML = `
      <tr><td>orbital</td><td>${n}${or.html}</td></tr>
      <tr><td>n, ℓ</td><td class="num">${n}, ${l}</td></tr>
      <tr><td>m<sub>ℓ</sub> values in ${n}${LETTER[l]}</td><td class="num">${mls}</td></tr>
      <tr><td>spherical (radial) nodes</td><td class="num">n − ℓ − 1 = ${n - l - 1}</td></tr>
      <tr><td>planar / conical nodes</td><td class="num">ℓ = ${l}</td></tr>
      <tr><td>90 % inside r =</td><td class="num">${sig(tab.rAt(0.9) * A0, 2)} Å</td></tr>`;
    const shape = ['spherical', 'two lobes along an axis ("dumbbell")', 'four lobes ("four-leaf clover"), except d<sub>z²</sub>', 'six or eight lobes'][l];
    let note = `${n}${LETTER[l]}: ${shape}. ${n === 1 ? '' : `It has ${n - 1} node${n - 1 === 1 ? '' : 's'} in total, `}`;
    if (n > 1) note += `${n - l - 1} spherical and ${l} through the nucleus.`;
    if (l === 2 && o === 0) note += ' d<sub>z²</sub> has two lobes along z and a ring ("doughnut") around the middle; it is still one of the five d orbitals.';
    if (l === 3) note += ' f orbitals are shown for completeness: you need to know that there are seven of them, not their shapes.';
    if (l === 0 && n > 1) note += ' In the radial graph, every zero between the bumps is one of the spherical nodes.';
    $('orb-note').innerHTML = note;
    draw(); radialPlot();
  }

  // drag to rotate
  let drag = null;
  cv.style.touchAction = 'pan-y';
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, az, el, touch: e.pointerType === 'touch' }; cv.setPointerCapture?.(e.pointerId); });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    az = drag.az - (e.clientX - drag.x) * 0.01;
    if (!drag.touch) el = Math.max(-1.5, Math.min(1.5, drag.el + (e.clientY - drag.y) * 0.01));
    draw();
  });
  const end = () => { drag = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  fixedBox.addEventListener('change', () => update(false));
  signBox.addEventListener('change', () => draw());
  new ResizeObserver(draw).observe(cv);
  update();
}

/* ------------------------------------------------------------------ */
/* Allowed quantum numbers                                             */
/* ------------------------------------------------------------------ */
{
  const opt = (sel, vals, def) => { sel.innerHTML = vals.map(v => `<option value="${v}"${v === def ? ' selected' : ''}>${String(v).replace('-', '−')}</option>`).join(''); };
  opt($('qn-n'), [0, 1, 2, 3, 4, 5], 3);
  opt($('qn-l'), [0, 1, 2, 3, 4], 2);
  opt($('qn-m'), [-4, -3, -2, -1, 0, 1, 2, 3, 4], -1);
  function check() {
    const n = +$('qn-n').value, l = +$('qn-l').value, m = +$('qn-m').value, s = +$('qn-s').value;
    const errs = [];
    if (n < 1) errs.push('n must be a positive whole number (1, 2, 3, …).');
    if (n >= 1 && l > n - 1) errs.push(`ℓ can only go from 0 to n − 1 = ${n - 1}. There is no ${n}${LETTER[l] || 'g'} subshell.`);
    if (Math.abs(m) > l) errs.push(`m_ℓ must lie between −ℓ and +ℓ, here −${l} … +${l}.`);
    const fb = $('qn-fb');
    if (errs.length) { fb.className = 'feedback wrong'; fb.innerHTML = 'Not allowed.<ul>' + errs.map(e => `<li>${e}</li>`).join('') + '</ul>'; }
    else {
      fb.className = 'feedback right';
      fb.textContent = `Allowed: an electron in a ${n}${LETTER[l]} orbital (one of ${2 * l + 1}), spin ${s > 0 ? 'up' : 'down'}. ` +
        `No other electron in the atom can have exactly these four numbers (Pauli).`;
    }
  }
  for (const id of ['qn-n', 'qn-l', 'qn-m', 'qn-s']) $(id).addEventListener('change', check);
  check();
}
