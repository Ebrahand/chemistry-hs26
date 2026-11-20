// Module 5: VSEPR geometries as a rotatable 3D model, and a "predict the shape" exercise.

import { cssColor } from '../assets/plot.js';
import { MOLECULES, EDGEOM, molGeom, vsepr, formulaHTML } from './molecules.js';
import { lewisSVG, chargeLabels } from './lewis.js';

const $ = id => document.getElementById(id);
const norm = v => { const L = Math.hypot(...v); return v.map(x => x / L); };

// Domain positions for each electron-domain geometry. Order matters: lone pairs take the first positions listed
// in LP_ORDER (equatorial first for 5 domains, trans pair for 6).
const POS = {
  2: [[0, 0, 1], [0, 0, -1]],
  3: [[1, 0, 0], [-0.5, Math.sqrt(3) / 2, 0], [-0.5, -Math.sqrt(3) / 2, 0]],
  4: [[0, 0, 1], [0.943, 0, -0.333], [-0.471, 0.816, -0.333], [-0.471, -0.816, -0.333]],
  5: [[1, 0, 0], [-0.5, Math.sqrt(3) / 2, 0], [-0.5, -Math.sqrt(3) / 2, 0], [0, 0, 1], [0, 0, -1]],
  6: [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]],
};
const LP_ORDER = { 2: [0, 1], 3: [0, 1, 2], 4: [0, 1, 2, 3], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5] };
const ANGLES = { 2: '180°', 3: '120°', 4: '109.5°', 5: '90° and 120°', 6: '90°' };
const EXAMPLE = {
  '2/0': 'CO₂', '3/0': 'BF₃', '2/1': 'NO₂⁻, O₃', '4/0': 'CH₄', '3/1': 'NH₃', '2/2': 'H₂O',
  '5/0': 'PCl₅', '4/1': 'SF₄', '3/2': 'ClF₃', '2/3': 'XeF₂', '6/0': 'SF₆', '5/1': 'BrF₅', '4/2': 'XeF₄',
};

{
  let nb = 4, nl = 0, az = 0.6, el = 0.35;
  const cv = $('vs-canvas'), ctx = cv.getContext('2d');

  function seg(root, values, get, set) {
    root.innerHTML = '';
    for (const v of values) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = v; b.dataset.v = v;
      b.addEventListener('click', () => { set(v); update(); });
      root.appendChild(b);
    }
  }
  seg($('vs-b'), [2, 3, 4, 5, 6], () => nb, v => { nb = v; if (nb + nl > 6) nl = 6 - nb; });
  seg($('vs-l'), [0, 1, 2, 3], () => nl, v => { nl = Math.min(v, 6 - nb); });

  function domains() {
    const dom = nb + nl;
    const pos = POS[dom];
    const lpIdx = new Set(LP_ORDER[dom].slice(0, nl));
    // 6 domains, 2 lone pairs: opposite each other (indices 0 and 1 are trans)
    return pos.map((p, i) => ({ p: norm(p), lp: lpIdx.has(i) }));
  }

  function draw() {
    const w = cv.clientWidth, H = cv.clientHeight; if (!w) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, H);
    const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
    const u = [-sa, ca, 0], v = [-se * ca, -se * sa, ce], dv = [ce * ca, ce * sa, se];
    const S = Math.min(w, H) * 0.34, cx = w / 2, cy = H / 2;
    const proj = p => ({ x: cx + S * (p[0] * u[0] + p[1] * u[1] + p[2] * u[2]), y: cy - S * (p[0] * v[0] + p[1] * v[1] + p[2] * v[2]), z: p[0] * dv[0] + p[1] * dv[1] + p[2] * dv[2] });
    const items = domains().map(d => ({ ...d, q: proj(d.p) }));
    const centre = { x: cx, y: cy, z: 0 };
    const text = cssColor('--text'), cA = cssColor('--c1'), cC = cssColor('--c2'), cL = cssColor('--c3');
    // draw back to front; the central atom sits at z = 0
    const order = [...items].sort((a, b) => a.q.z - b.q.z);
    const drawCentre = () => {
      const g = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 22);
      g.addColorStop(0, '#fff'); g.addColorStop(0.35, cC); g.addColorStop(1, cC);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 7); ctx.fill();
      ctx.fillStyle = cssColor('--bg'); ctx.font = `700 13px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', cx, cy + 1);
    };
    let centreDone = false;
    for (const it of order) {
      if (!centreDone && it.q.z > 0) { drawCentre(); centreDone = true; }
      const depth = 0.75 + 0.25 * it.q.z;
      if (it.lp) {
        // lone pair: a translucent lobe with two dots
        const px = cx + (it.q.x - cx) * 0.62, py = cy + (it.q.y - cy) * 0.62;
        const ang = Math.atan2(it.q.y - cy, it.q.x - cx);
        const len = Math.hypot(it.q.x - cx, it.q.y - cy) * 0.62;
        ctx.save(); ctx.translate((cx + px) / 2 + (px - cx) * 0.25, (cy + py) / 2 + (py - cy) * 0.25); ctx.rotate(ang);
        ctx.globalAlpha = 0.28 + 0.15 * depth; ctx.fillStyle = cL;
        ctx.beginPath(); ctx.ellipse(0, 0, Math.max(14, len * 0.55), 15 * depth, 0, 0, 7); ctx.fill();
        ctx.globalAlpha = 1; ctx.fillStyle = text;
        ctx.beginPath(); ctx.arc(len * 0.15, -4, 2.6, 0, 7); ctx.arc(len * 0.15, 4, 2.6, 0, 7); ctx.fill();
        ctx.restore();
      } else {
        ctx.strokeStyle = text; ctx.lineWidth = 5 * depth; ctx.lineCap = 'round';
        ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(it.q.x, it.q.y); ctx.stroke();
        ctx.globalAlpha = 1;
        const r = 15 * depth;
        const g = ctx.createRadialGradient(it.q.x - r * 0.3, it.q.y - r * 0.3, 1, it.q.x, it.q.y, r);
        g.addColorStop(0, '#fff'); g.addColorStop(0.3, cA); g.addColorStop(1, cA);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(it.q.x, it.q.y, r, 0, 7); ctx.fill();
      }
    }
    if (!centreDone) drawCentre();
    ctx.fillStyle = cssColor('--text-muted'); ctx.font = `12px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('drag to turn', w - 8, H - 6);
  }

  function update() {
    $('vs-b').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.v === nb));
    $('vs-l').querySelectorAll('button').forEach(b => { b.setAttribute('aria-pressed', +b.dataset.v === nl); b.disabled = nb + +b.dataset.v > 6; });
    const dom = nb + nl;
    const mg = molGeom(dom, nl);
    $('vs-table').innerHTML = `
      <tr><td>electron domains</td><td class="num">${nb} + ${nl} = ${dom}</td></tr>
      <tr><td>electron-domain geometry</td><td><strong>${EDGEOM[dom]}</strong></td></tr>
      <tr><td>molecular geometry</td><td><strong>${mg}</strong></td></tr>
      <tr><td>angles between domains</td><td class="num">${ANGLES[dom]}${nl && dom > 2 && !(dom === 5 && nl === 3) && !(dom === 6 && nl === 2) ? ', squeezed a bit' : ''}</td></tr>
      <tr><td>example</td><td>${EXAMPLE[`${nb}/${nl}`] || '—'}</td></tr>`;
    let note = `${dom} domains arrange themselves ${EDGEOM[dom] === 'linear' ? 'in a line' : 'as a ' + EDGEOM[dom].replace('trigonal bipyramidal', 'trigonal bipyramid').replace('octahedral', 'octahedron').replace('tetrahedral', 'tetrahedron').replace('trigonal planar', 'flat triangle')}. `;
    if (!nl) note += 'No lone pairs, so the molecular geometry is the same as the electron-domain geometry.';
    else note += `${nl} of them ${nl === 1 ? 'is a lone pair' : 'are lone pairs'} (pink). Looking only at the atoms, the molecule is <strong>${mg}</strong>.`;
    if (dom === 5 && nl) note += ' The lone pairs sit in the equatorial plane: there they have only two neighbours at 90°, instead of three.';
    if (dom === 6 && nl === 2) note += ' The two lone pairs sit opposite each other, as far apart as possible.';
    if (dom === 3 && nl === 1 || dom === 4 && nl >= 1) note += ' The lone pairs push the bonds together: angles below the ideal value.';
    $('vs-note').innerHTML = note;
    draw();
  }
  let drag = null;
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, az, el, touch: e.pointerType === 'touch' }; cv.setPointerCapture?.(e.pointerId); });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    az = drag.az - (e.clientX - drag.x) * 0.01;
    if (!drag.touch) el = Math.max(-1.5, Math.min(1.5, drag.el + (e.clientY - drag.y) * 0.01));
    draw();
  });
  const end = () => { drag = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  new ResizeObserver(draw).observe(cv);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', draw);
  update();
}

/* ------------------------------------------------------------------ */
/* Predict the shape                                                   */
/* ------------------------------------------------------------------ */
{
  // Problem set 7 first (questions 5, 6 and 11), then the rest in random order
  const FIRST = ['asf3', 'ch3', 'brf3', 'clo3', 'xef2', 'bro2', 'brf4', 'bf4', 'n3'];
  const pool = MOLECULES.filter(m => vsepr(m));
  const rest = pool.filter(m => !FIRST.includes(m.id)).sort(() => Math.random() - 0.5);
  const queue = [...FIRST.map(id => pool.find(m => m.id === id)), ...rest];
  let q = 0, score = 0, tried = 0, answered = false;
  const ED = ['linear', 'trigonal planar', 'tetrahedral', 'trigonal bipyramidal', 'octahedral'];
  const MG = ['linear', 'bent', 'trigonal planar', 'trigonal pyramidal', 'T-shaped', 'tetrahedral', 'square planar', 'seesaw', 'trigonal bipyramidal', 'square pyramidal', 'octahedral'];
  $('pr-ed').innerHTML += ED.map(x => `<option>${x}</option>`).join('');
  $('pr-mg').innerHTML += MG.map(x => `<option>${x}</option>`).join('');

  function show() {
    const m = queue[q % queue.length];
    $('pr-mol').innerHTML = `${formulaHTML(m)} <span class="small muted" style="font-weight:400">${m.name}</span>`;
    for (const id of ['pr-dom', 'pr-ed', 'pr-mg']) $(id).value = '';
    $('pr-fb').textContent = ''; $('pr-fb').className = 'feedback';
    $('pr-svg').innerHTML = '';
    answered = false;
  }
  function check() {
    const m = queue[q % queue.length], v = vsepr(m);
    const dom = +$('pr-dom').value, ed = $('pr-ed').value, mg = $('pr-mg').value;
    if (!dom || !ed || !mg) { $('pr-fb').className = 'feedback'; $('pr-fb').textContent = 'Choose all three first.'; return; }
    const ok = [dom === v.dom, ed === v.edGeom, mg === v.molGeom];
    const all = ok.every(Boolean);
    if (!answered) { tried++; if (all) score++; answered = true; }
    const fb = $('pr-fb');
    fb.className = 'feedback ' + (all ? 'right' : 'wrong');
    const why = `${v.center} has ${v.bonding} bonding domain${v.bonding > 1 ? 's' : ''} and ${v.lone} lone pair${v.lone === 1 ? '' : 's'}: ` +
      `${v.dom} domains, ${v.edGeom}, so the molecule is ${v.molGeom}.`;
    fb.innerHTML = (all ? 'Correct. ' : `Not quite (${['domains', 'electron-domain geometry', 'molecular geometry'].filter((_, i) => !ok[i]).join(', ')}). `) + why +
      (m.structures[0].bonds.some(b => b[2] > 1) ? ' A double or triple bond counts as one domain.' : '');
    $('pr-svg').innerHTML = lewisSVG(m.structures[0], { charge: m.charge, labels: chargeLabels(m.structures[0], 'fc'), labelKind: 'fc', maxWidth: 280 });
    $('pr-score').textContent = `${score} / ${tried} right`;
  }
  $('pr-check').addEventListener('click', check);
  $('pr-next').addEventListener('click', () => { q++; show(); });
  show();
}
