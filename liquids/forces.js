// Module 1: dispersion animation, "which forces act?" flowchart, hydride boiling points,
// polarity table and a boiling-point ranking exercise.
// Boiling points are normal boiling points (1 atm) in °C, rounded literature values.

import { Plot, cssColor } from '../assets/plot.js';
import { fix } from '../assets/format.js';

const $ = id => document.getElementById(id);
const K = t => (t + 273.15).toFixed(0);

/* ------------------------------------------------------------------ */
/* Dispersion: two atoms with correlated electron clouds               */
/* ------------------------------------------------------------------ */
{
  const ATOMS = {
    He: { e: 2, r: 0.55, amp: 0.10, bp: -268.9 },
    Ar: { e: 18, r: 0.80, amp: 0.20, bp: -185.8 },
    Xe: { e: 54, r: 1.00, amp: 0.30, bp: -108.1 },
  };
  let atom = 'Ar', playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches, t0 = performance.now(), tPause = 0, visible = true;
  const cv = $('disp-canvas'), ctx = cv.getContext('2d');

  function shift(t) {   // smooth pseudo-random sloshing of atom A's cloud, in units of its radius
    return 0.55 * Math.sin(1.7 * t) + 0.3 * Math.sin(2.9 * t + 1.3) + 0.15 * Math.sin(5.3 * t + 0.4);
  }
  function draw(now) {
    const w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const a = ATOMS[atom], t = (playing ? now - t0 : tPause) / 1000;
    const R = a.r * Math.min(h * 0.36, w * 0.17);
    const cx1 = w * 0.3, cx2 = w * 0.7, cy = h * 0.5;
    const sA = shift(t) * a.amp * R * 2.2;
    const sB = shift(t - 0.15) * a.amp * R * 2.0;   // B follows A (induced), slightly later
    const cE = cssColor('--c1'), cN = cssColor('--text'), muted = cssColor('--text-muted');
    for (const [cx, s] of [[cx1, sA], [cx2, sB]]) {
      const g = ctx.createRadialGradient(cx + s, cy, R * 0.1, cx + s, cy, R);
      g.addColorStop(0, cE + 'cc'); g.addColorStop(1, cE + '00');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx + s, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = cN; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
      if (Math.abs(s) > R * 0.12) {
        ctx.font = `600 ${Math.max(13, R * 0.28)}px ${getComputedStyle(document.body).fontFamily}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = cN;
        const dir = Math.sign(s);
        ctx.fillText('δ−', cx + dir * R * 0.75, cy - R * 0.95);
        ctx.fillText('δ+', cx - dir * R * 0.75, cy - R * 0.95);
      }
    }
    ctx.fillStyle = muted; ctx.font = `13px ${getComputedStyle(document.body).fontFamily}`; ctx.textAlign = 'center';
    ctx.fillText(`${atom}  (${a.e} electrons)`, cx1, h - 10); ctx.fillText(`${atom}`, cx2, h - 10);
  }
  function loop(now) { draw(now); if (playing && visible) requestAnimationFrame(loop); }
  function readout() {
    $('disp-readout').innerHTML = Object.entries(ATOMS).map(([k, v]) =>
      `<tr${k === atom ? ' class="latest"' : ''}><td>${k}</td><td>${v.e} e⁻</td><td class="num">bp ${fix(v.bp, 1)} °C (${K(v.bp)} K)</td></tr>`).join('');
    $('disp-note').textContent = {
      He: 'Helium has only 2 electrons, held tightly. Its cloud hardly distorts, the temporary dipoles are tiny, and helium boils only 4 K above absolute zero.',
      Ar: 'When the left cloud shifts towards the right atom, it pushes the right cloud away: the facing sides get opposite charges and attract. The dipoles keep flipping, but they stay in step.',
      Xe: 'Xenon has 54 electrons, many far from the nucleus. Its cloud is easily distorted (highly polarisable), so the temporary dipoles are large and xenon boils at 165 K.',
    }[atom];
  }
  for (const b of $('disp-atom').querySelectorAll('button')) b.addEventListener('click', () => {
    atom = b.dataset.v;
    $('disp-atom').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    readout(); if (!playing) draw(performance.now());
  });
  $('disp-play').addEventListener('click', () => {
    if (playing) { tPause = performance.now() - t0; playing = false; }
    else { t0 = performance.now() - tPause; playing = true; requestAnimationFrame(loop); }
    $('disp-play').textContent = playing ? '⏸ Pause' : '▶ Play';
  });
  $('disp-play').textContent = playing ? '⏸ Pause' : '▶ Play';
  new IntersectionObserver(es => { const was = visible; visible = es[0].isIntersecting; if (visible && !was && playing) requestAnimationFrame(loop); }).observe(cv);
  new ResizeObserver(() => draw(performance.now())).observe(cv);
  readout(); requestAnimationFrame(loop);
}

/* ------------------------------------------------------------------ */
/* Flowchart                                                           */
/* ------------------------------------------------------------------ */
const MOLS = [
  { id: 'He', f: 'He', name: 'helium', M: 4.00, bp: -268.9, polar: false, why: 'A single atom: no bonds, no dipole. Only 2 electrons, so the dispersion forces are very weak.' },
  { id: 'CH4', f: 'CH₄', name: 'methane', M: 16.04, bp: -161.5, polar: false, why: 'C–H bonds are almost non-polar and the molecule is a symmetric tetrahedron.' },
  { id: 'Cl2', f: 'Cl₂', name: 'chlorine', M: 70.90, bp: -34.0, polar: false, why: 'Two identical atoms share the electrons equally.' },
  { id: 'I2', f: 'I₂', name: 'iodine', M: 253.81, bp: 184.3, polar: false, why: 'Non-polar, but with 106 electrons the dispersion forces are strong: iodine is a solid at room temperature.' },
  { id: 'CO2', f: 'CO₂', name: 'carbon dioxide', M: 44.01, bp: null, note: 'no liquid at 1 atm: sublimes at −78.5 °C', polar: false, why: 'Each C=O bond is polar, but the molecule is linear, so the two bond dipoles point in opposite directions and cancel.' },
  { id: 'CCl4', f: 'CCl₄', name: 'carbon tetrachloride', M: 153.82, bp: 76.7, polar: false, why: 'Four polar C–Cl bonds, but in a tetrahedron the bond dipoles cancel. Many electrons, so strong dispersion forces.' },
  { id: 'HCl', f: 'HCl', name: 'hydrogen chloride', M: 36.46, bp: -85.1, polar: true, hb: false, why: 'Polar (Cl is more electronegative than H), but the H is bonded to Cl, not to N, O or F.' },
  { id: 'H2S', f: 'H₂S', name: 'hydrogen sulfide', M: 34.08, bp: -60.3, polar: true, hb: false, why: 'Bent and polar, but S is not electronegative enough for real hydrogen bonds.' },
  { id: 'DME', f: 'CH₃OCH₃', name: 'dimethyl ether', M: 46.07, bp: -24.8, polar: true, hb: false, why: 'It has an O, but no H on the O: all H atoms sit on carbon. It can accept a hydrogen bond from water, but cannot form them with itself.' },
  { id: 'acetone', f: 'CH₃COCH₃', name: 'acetone', M: 58.08, bp: 56.1, polar: true, hb: false, why: 'The C=O group makes it strongly polar, but there is no O–H.' },
  { id: 'H2O', f: 'H₂O', name: 'water', M: 18.02, bp: 100.0, polar: true, hb: true, why: 'Two O–H bonds and two lone pairs on O: each molecule can take part in up to four hydrogen bonds.' },
  { id: 'NH3', f: 'NH₃', name: 'ammonia', M: 17.03, bp: -33.3, polar: true, hb: true, why: 'N–H bonds, and a lone pair on N.' },
  { id: 'HF', f: 'HF', name: 'hydrogen fluoride', M: 20.01, bp: 19.5, polar: true, hb: true, why: 'F is the most electronegative element: very strong hydrogen bonds.' },
  { id: 'EtOH', f: 'C₂H₅OH', name: 'ethanol', M: 46.07, bp: 78.4, polar: true, hb: true, why: 'Same formula as dimethyl ether (C₂H₆O), but here one H sits on the O.' },
  { id: 'NaClaq', f: 'NaCl in water', name: 'sodium chloride dissolved in water', M: null, bp: null, ions: true, polar: true, hb: true, why: 'Na⁺ attracts the O side of water molecules, Cl⁻ the H side. The water molecules still hydrogen-bond with each other.' },
];

{
  let cur = 'EtOH';
  const picker = $('flow-picker');
  picker.innerHTML = MOLS.map(m => `<button type="button" class="chip" data-id="${m.id}" aria-pressed="false">${m.f}</button>`).join('');
  function render() {
    const m = MOLS.find(x => x.id === cur);
    picker.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === cur));
    const steps = [];
    steps.push({ q: 'Are ions involved?', a: m.ions ? 'Yes' : 'No', go: !!m.ions });
    if (!m.ions) {
      steps.push({ q: 'Is the molecule polar (does it have a net dipole moment)?', a: m.polar ? 'Yes' : 'No', go: m.polar });
      if (m.polar) steps.push({ q: 'Is an H atom bonded directly to N, O or F?', a: m.hb ? 'Yes' : 'No', go: m.hb });
    }
    $('flow-steps').innerHTML = steps.map(s =>
      `<li><span>${s.q}</span> <span class="ans ${s.go ? 'yes' : 'no'}">${s.a}</span></li>`).join('');
    const forces = [['f-disp', 'Dispersion']];
    if (m.polar && !m.ions) forces.push(['f-dip', 'Dipole–dipole']);
    if (m.hb) forces.push(['f-hb', 'Hydrogen bonds']);
    if (m.ions) { forces.push(['f-dip', 'Dipole–dipole']); forces.push(['f-ion', 'Ion–dipole']); }
    $('flow-forces').innerHTML = forces.map(([c, t]) => `<span class="fbadge ${c}">${t}</span>`).join(' ');
    const facts = [m.name];
    if (m.M) facts.push(`M = ${m.M.toFixed(2)} g/mol`);
    if (m.bp !== null) facts.push(`boiling point ${fix(m.bp, 1)} °C`);
    if (m.note) facts.push(m.note);
    $('flow-facts').textContent = facts.join(' · ');
    $('flow-why').textContent = m.why;
  }
  picker.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { cur = b.dataset.id; render(); } });
  render();
}

/* ------------------------------------------------------------------ */
/* Hydride boiling points                                              */
/* ------------------------------------------------------------------ */
{
  const GROUPS = [
    { g: 14, color: '--c2', dash: [6, 4], pts: [['CH₄', -161.5], ['SiH₄', -111.9], ['GeH₄', -88.5], ['SnH₄', -52.0]] },
    { g: 15, color: '--c3', dash: [2, 4], pts: [['NH₃', -33.3], ['PH₃', -87.7], ['AsH₃', -62.5], ['SbH₃', -17.0]] },
    { g: 16, color: '--c1', dash: [], pts: [['H₂O', 100.0], ['H₂S', -60.3], ['H₂Se', -41.3], ['H₂Te', -2.2]] },
    { g: 17, color: '--c0', dash: [10, 3, 2, 3], pts: [['HF', 19.5], ['HCl', -85.1], ['HBr', -66.8], ['HI', -35.4]] },
  ];
  const on = new Set([14, 15, 16, 17]);
  const plot = new Plot($('bp-plot'));
  $('bp-groups').innerHTML = GROUPS.map(g =>
    `<label class="chip"><input type="checkbox" data-g="${g.g}" checked><span class="swatch" style="background:var(${g.color})"></span>group ${g.g}</label>`).join('');
  // straight line through periods 3–5 of group 16, extended back to period 2
  const g16 = GROUPS[2].pts.slice(1).map(([, y], i) => [i + 3, y]);
  const mx = 4, my = g16.reduce((s, p) => s + p[1], 0) / 3;
  const slope = g16.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / g16.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  const at = p => my + slope * (p - mx);
  function render() {
    const trend = $('bp-trend').checked;
    const series = [], texts = [];
    for (const g of GROUPS) {
      if (!on.has(g.g)) continue;
      series.push({ points: g.pts.map(([, y], i) => [i + 2, y]), color: g.color, dash: g.dash, dots: true });
      // label the first and last member of each group, outside the lines
      const [n2, y2] = g.pts[0], [n5, y5] = g.pts[3];
      texts.push({ x: 2, y: y2, text: n2, dx: -9, align: 'right', color: g.color, bold: true });
      texts.push({ x: 5, y: y5, text: n5, dx: 9, color: g.color, bold: true });
    }
    const segments = [];
    if (trend && on.has(16)) {
      segments.push({ x1: 2, y1: at(2), x2: 5, y2: at(5), color: '--c1', dash: [3, 4], width: 1.5 });
      texts.push({ x: 2, y: at(2), text: `≈ ${fix(Math.round(at(2) / 10) * 10)} °C?`, dx: -9, align: 'right', color: '--c1' });
    }
    plot.draw({
      x: { min: 1.35, max: 5.65, label: 'period', tickValues: [2, 3, 4, 5], tickFormat: v => String(v) },
      y: { min: -180, max: 120, label: 'normal boiling point (°C)' },
      series, segments, texts,
      markers: trend && on.has(16) ? [{ x: 2, y: at(2), color: '--c1', hollow: true, r: 5 }] : [],
    });
    $('bp-note').textContent = trend
      ? `Following the trend of H₂S, H₂Se and H₂Te, water "should" boil somewhere around ${fix(Math.round(at(2) / 10) * 10)} °C (a rough straight-line extrapolation). It boils at +100 °C. The difference is hydrogen bonding.`
      : 'Group 14 (CH₄ to SnH₄) is the control: tetrahedral, non-polar, dispersion only. Its boiling points rise steadily with size. NH₃, H₂O and HF break the pattern because they form hydrogen bonds.';
  }
  $('bp-groups').addEventListener('change', e => { const g = +e.target.dataset.g; e.target.checked ? on.add(g) : on.delete(g); render(); });
  $('bp-trend').addEventListener('change', render);
  render();
}

/* ------------------------------------------------------------------ */
/* Similar mass, different polarity                                    */
/* ------------------------------------------------------------------ */
{
  const ROWS = [
    ['Propane, CH₃CH₂CH₃', 44.1, 0.1, 231], ['Dimethyl ether, CH₃OCH₃', 46.1, 1.3, 248], ['Methyl chloride, CH₃Cl', 50.5, 1.9, 249],
    ['Acetaldehyde, CH₃CHO', 44.1, 2.7, 294], ['Acetonitrile, CH₃CN', 41.1, 3.9, 355],
  ];
  $('dipole-table').innerHTML = ROWS.map(([n, M, mu, bp]) =>
    `<tr><td>${n}</td><td class="num">${M.toFixed(1)}</td><td class="num">${mu.toFixed(1)}</td><td class="num">${bp} K (${fix(bp - 273.15)} °C)</td>` +
    `<td><div class="hbar"><i style="width:${((bp - 200) / 170 * 100).toFixed(0)}%"></i></div></td></tr>`).join('');
}

/* ------------------------------------------------------------------ */
/* Ranking exercise                                                    */
/* ------------------------------------------------------------------ */
{
  const SETS = [
    { name: 'Halogens', items: [['F₂', -188.1], ['Cl₂', -34.0], ['Br₂', 58.8], ['I₂', 184.3]],
      why: 'All four are non-polar, so only dispersion forces act. More electrons → more polarisable → stronger dispersion → higher boiling point. That is why F₂ and Cl₂ are gases, Br₂ a liquid and I₂ a solid at room temperature.' },
    { name: 'Same mass, different shape', items: [['neopentane, C(CH₃)₄', 9.5], ['n-pentane, CH₃(CH₂)₃CH₃', 36.1], ['n-hexane, CH₃(CH₂)₄CH₃', 68.7]],
      why: 'Neopentane and n-pentane are both C₅H₁₂. Neopentane is compact, almost a ball, so it touches its neighbours over a small area. Long n-pentane molecules lie alongside each other: more contact, stronger dispersion. n-Hexane is bigger still.' },
    { name: 'Polarity and H-bonds', items: [['HCl', -85.1], ['H₂S', -60.3], ['H₂O', 100.0]],
      why: 'HCl and H₂S are both polar and both have 18 electrons. H₂S is a little larger and more polarisable, so its dispersion forces are stronger and it boils higher, even though HCl is slightly more polar. Water is the smallest of the three but forms hydrogen bonds, which beat everything else here.' },
    { name: 'C₂H₆O and friends', items: [['propane, C₃H₈', -42.1], ['dimethyl ether, CH₃OCH₃', -24.8], ['ethanol, C₂H₅OH', 78.4]],
      why: 'All have M ≈ 44–46 g/mol. Propane: dispersion only. Dimethyl ether: also dipole–dipole. Ethanol: also hydrogen bonds. Each extra force raises the boiling point.' },
  ];
  let cur = 0, picked = [];
  const setsEl = $('rank-sets'), pool = $('rank-pool');
  setsEl.innerHTML = SETS.map((s, i) => `<button type="button" class="btn" data-i="${i}">${s.name}</button>`).join('');
  // fixed but scrambled display order, so the answer is never simply left to right
  const shuffled = n => (n === 4 ? [2, 0, 3, 1] : [2, 0, 1]);
  function render() {
    const s = SETS[cur];
    setsEl.querySelectorAll('button').forEach((b, i) => b.classList.toggle('primary', i === cur));
    pool.innerHTML = shuffled(s.items.length).map(i => {
      const pos = picked.indexOf(i);
      return `<button type="button" class="rank-item${pos >= 0 ? ' picked' : ''}" data-i="${i}" ${pos >= 0 ? 'disabled' : ''}>` +
        `${pos >= 0 ? `<b>${pos + 1}</b> ` : ''}${s.items[i][0]}</button>`;
    }).join('');
    $('rank-order').textContent = picked.length ? 'Your order: ' + picked.map(i => s.items[i][0].split(',')[0]).join(' < ') : '';
    const fb = $('rank-fb');
    if (picked.length === s.items.length) {
      const right = picked.every((v, k) => v === k);
      fb.className = 'feedback ' + (right ? 'right' : 'wrong');
      fb.innerHTML = (right ? '<strong>Correct.</strong> ' : '<strong>Not quite.</strong> The right order is ' +
        s.items.map(x => x[0].split(',')[0]).join(' < ') + '. ') +
        'Boiling points: ' + s.items.map(([n, bp]) => `${n.split(',')[0]} ${fix(bp, 1)} °C`).join(', ') + '. ' + s.why;
    } else { fb.className = 'feedback'; fb.textContent = ''; }
  }
  setsEl.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { cur = +b.dataset.i; picked = []; render(); } });
  pool.addEventListener('click', e => { const b = e.target.closest('button'); if (b && !b.disabled) { picked.push(+b.dataset.i); render(); } });
  $('rank-undo').addEventListener('click', () => { picked = []; render(); });
  render();
}
