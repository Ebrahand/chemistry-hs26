// Module 1: lattice energy against Coulomb's law, and the Born–Haber cycle.

import { Plot } from '../assets/plot.js';
import { fix } from '../assets/format.js';

const $ = id => document.getElementById(id);

/* ------------------------------------------------------------------ */
/* Lattice energy vs |Q1 Q2| / d                                       */
/* ------------------------------------------------------------------ */
{
  // ionic radii (pm), Brown Fig. 7.8; lattice energies (kJ/mol), Brown Table 8.1
  const R = { 'Li⁺': 90, 'Na⁺': 116, 'K⁺': 152, 'Mg²⁺': 86, 'Ca²⁺': 114, 'Sr²⁺': 132, 'F⁻': 119, 'Cl⁻': 167, 'I⁻': 206, 'O²⁻': 126 };
  const SALTS = [
    ['LiF', 'Li⁺', 'F⁻', 1, 1030], ['LiCl', 'Li⁺', 'Cl⁻', 1, 834], ['LiI', 'Li⁺', 'I⁻', 1, 730],
    ['NaF', 'Na⁺', 'F⁻', 1, 910], ['NaCl', 'Na⁺', 'Cl⁻', 1, 788], ['NaI', 'Na⁺', 'I⁻', 1, 682],
    ['KF', 'K⁺', 'F⁻', 1, 808], ['KCl', 'K⁺', 'Cl⁻', 1, 701], ['KI', 'K⁺', 'I⁻', 1, 632],
    ['MgO', 'Mg²⁺', 'O²⁻', 4, 3795], ['CaO', 'Ca²⁺', 'O²⁻', 4, 3414], ['SrO', 'Sr²⁺', 'O²⁻', 4, 3217],
  ].map(([f, c, a, q, U]) => ({ f, c, a, q, U, d: R[c] + R[a], x: q / ((R[c] + R[a]) / 1000) }));
  let sel = SALTS.find(s => s.f === 'NaCl'), zoom = false;
  const plot = new Plot($('lat-plot'));
  const slope = SALTS.reduce((a, s) => a + s.U * s.x, 0) / SALTS.reduce((a, s) => a + s.x * s.x, 0);
  function draw() {
    $('lat-view').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', (b.dataset.v === 'zoom') === zoom));
    plot.draw({
      x: zoom ? { min: 2.6, max: 5.0, label: '|Q₁Q₂| / d  (nm⁻¹)' } : { min: 0, max: 21, label: '|Q₁Q₂| / d  (nm⁻¹)' },
      y: zoom ? { min: 580, max: 1100, label: 'lattice energy (kJ/mol)' } : { min: 0, max: 4200, label: 'lattice energy (kJ/mol)' },
      series: [{ points: [[0, 0], [21, 21 * slope]], color: '--cB', width: 1.5, dash: [6, 5] }],
      markers: SALTS.map(s => ({ x: s.x, y: s.U, color: s === sel ? '--c0' : s.q === 4 ? '--c3' : '--c1', r: s === sel ? 7 : 5 })),
      texts: SALTS.filter(s => zoom || s.q === 4 || s === sel || s.f === 'LiF').map(s => ({ x: s.x, y: s.U, text: s.f, dx: s.q === 4 ? -10 : 8, dy: s.q === 4 ? 0 : -9, align: s.q === 4 ? 'right' : 'left', size: zoom ? 12 : 11, color: s === sel ? '--text' : '--text-muted', bold: s === sel })),
    });
    $('lat-note').innerHTML = `<strong>${sel.f}</strong>: ${sel.c} + ${sel.a}, d = ${R[sel.c]} + ${R[sel.a]} = ${sel.d} pm, ` +
      `|Q₁Q₂| = ${sel.q}. Lattice energy ${sel.U} kJ/mol. The dashed line is "proportional to |Q₁Q₂|/d": Coulomb's law alone gets ` +
      `the trend right to within about 10 %.`;
  }
  $('lat-view').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { zoom = b.dataset.v === 'zoom'; draw(); }));
  $('lat-plot').addEventListener('click', ev => {
    const r = $('lat-plot').getBoundingClientRect();
    let best = null, bd = 1e9;
    for (const s of SALTS) {
      const dx = plot.X(s.x) - (ev.clientX - r.left), dy = plot.Y(s.U) - (ev.clientY - r.top);
      const dd = Math.hypot(dx, dy);
      if (dd < bd) { bd = dd; best = s; }
    }
    if (best && bd < 40) { sel = best; draw(); }
  });
  draw();
}

/* ------------------------------------------------------------------ */
/* Born–Haber cycle                                                    */
/* ------------------------------------------------------------------ */
{
  // kJ/mol. ΔHf° from Brown Appendix C; I₁ and EA as in week 6. RbCl: problem set 7, question 7.
  const SALTS = {
    NaCl: { M: 'Na', X: 'Cl', fSolid: -410.9, fMg: 107.7, fXg: 121.7, I1: 496, EA: -349 },
    RbCl: { M: 'Rb', X: 'Cl', fSolid: -430.5, fMg: 85.8, fXg: 121.7, I1: 403, EA: -349 },
  };
  let salt = 'NaCl', k = 0;
  for (const s of Object.keys(SALTS)) {
    const b = document.createElement('button');
    b.className = 'btn'; b.type = 'button'; b.textContent = s; b.dataset.v = s;
    b.addEventListener('click', () => { salt = s; k = 0; render(); });
    $('bh-salt').appendChild(b);
  }
  const f1 = v => (v > 0 ? '+' : '') + fix(v, 1);

  function steps() {
    const d = SALTS[salt], M = d.M, X = d.X;
    return [
      { label: `${M}${X}(s) → ${M}(s) + ½ ${X}₂(g)`, what: `−ΔH<sub>f</sub>°[${M}${X}(s)]`, dH: -d.fSolid,
        why: `Take the solid apart into its elements in their standard states: the reverse of its formation, so the sign flips.` },
      { label: `${M}(s) → ${M}(g)`, what: `ΔH<sub>f</sub>°[${M}(g)]`, dH: d.fMg, why: `Turn the metal into gaseous atoms.` },
      { label: `½ ${X}₂(g) → ${X}(g)`, what: `ΔH<sub>f</sub>°[${X}(g)]`, dH: d.fXg, why: `Break half a mole of ${X}–${X} bonds: half the bond enthalpy of ${X}₂.` },
      { label: `${M}(g) → ${M}⁺(g) + e⁻`, what: `I₁(${M})`, dH: d.I1, why: `Ionize the metal atom (first ionization energy, week 6). This is the biggest cost.` },
      { label: `${X}(g) + e⁻ → ${X}⁻(g)`, what: `EA(${X})`, dH: d.EA, why: `The electron goes to ${X}; this releases energy (electron affinity, week 6).` },
    ];
  }

  function render() {
    const d = SALTS[salt], st = steps(), M = d.M, X = d.X;
    $('bh-salt').querySelectorAll('button').forEach(b => b.classList.toggle('primary', b.dataset.v === salt));
    const shown = st.slice(0, k);
    const total = st.reduce((a, s) => a + s.dH, 0);
    $('bh-table').innerHTML = shown.map(s => `<tr><td>${s.what}</td><td class="num">${f1(s.dH)}</td></tr>`).join('') +
      (k === st.length ? `<tr class="latest"><td><strong>ΔH<sub>lattice</sub></strong> = sum</td><td class="num"><strong>${f1(total)}</strong></td></tr>` : '') +
      (k === 0 ? '<tr><td colspan="2" class="muted">Press "Next step" to start from the solid.</td></tr>' : '');
    $('bh-next').disabled = k >= st.length;
    $('bh-note').innerHTML = k === 0
      ? `Goal: ${M}${X}(s) → ${M}⁺(g) + ${X}⁻(g). We go the long way round, through steps with known enthalpies.`
      : k < st.length ? `Step ${k}: ${st[k - 1].why}`
        : `All five steps lead from ${M}${X}(s) to ${M}⁺(g) + ${X}⁻(g), exactly like the lattice-energy process. By Hess's law, ` +
          `ΔH<sub>lattice</sub> = ${st.map(s => `(${f1(s.dH)})`).join(' + ')} = <strong>${f1(total)} kJ/mol</strong>` +
          (salt === 'NaCl' ? ' (Brown and the lecture: +788 kJ/mol).' : ' (problem set 7: +692 kJ/mol).');
    // ladder
    const levels = [
      { E: d.fSolid, name: `${M}${X}(s)` },
      { E: 0, name: `${M}(s) + ½ ${X}₂(g)` },
      { E: d.fMg, name: `${M}(g) + ½ ${X}₂(g)` },
      { E: d.fMg + d.fXg, name: `${M}(g) + ${X}(g)` },
      { E: d.fMg + d.fXg + d.I1, name: `${M}⁺(g) + e⁻ + ${X}(g)` },
      { E: d.fMg + d.fXg + d.I1 + d.EA, name: `${M}⁺(g) + ${X}⁻(g)` },
    ];
    const W = 420, H = 380, top = 24, bot = H - 14;
    const Emin = -450, Emax = 760;
    const Y = E => top + (Emax - E) / (Emax - Emin) * (bot - top);
    let s = '';
    const L0 = 20, L1 = 215;                       // left column of levels; labels above the line, arrows on the right
    levels.forEach((lv, i) => {
      if (!(i === 0 || i <= k)) return;
      if (i < 5) {
        s += `<line x1="${L0}" y1="${Y(lv.E)}" x2="${L1}" y2="${Y(lv.E)}" stroke="var(--text)" stroke-width="2"/>`;
        s += `<text x="${L0 + 2}" y="${Y(lv.E) - 5}" font-size="12" fill="var(--text)">${lv.name}</text>`;
      } else {
        s += `<line x1="280" y1="${Y(lv.E)}" x2="410" y2="${Y(lv.E)}" stroke="var(--text)" stroke-width="2"/>`;
        s += `<text x="282" y="${Y(lv.E) + 16}" font-size="12" fill="var(--text)">${lv.name}</text>`;
      }
    });
    const arrow = (x, a, b, col, w = 2.5) => {
      const d = b > a ? 1 : -1;
      s += `<line x1="${x}" y1="${Y(a)}" x2="${x}" y2="${Y(b) + d * 7}" stroke="var(${col})" stroke-width="${w}"/>`;
      s += `<path d="M${x - 5},${Y(b) + d * 9} L${x + 5},${Y(b) + d * 9} L${x},${Y(b)} Z" fill="var(${col})"/>`;
    };
    for (let i = 0; i < k; i++) {
      const a = levels[i].E, b = levels[i + 1].E;
      if (i === 4) {
        s += `<line x1="${L1}" y1="${Y(a)}" x2="312" y2="${Y(a)}" stroke="var(--text-muted)" stroke-dasharray="3 3"/>`;
        arrow(305, a, b, '--c0');
      } else arrow(160 + i * 15, a, b, '--c1');
    }
    if (k === 5) {
      const xa = 395;
      s += `<line x1="${L1}" y1="${Y(levels[0].E)}" x2="${xa + 8}" y2="${Y(levels[0].E)}" stroke="var(--text-muted)" stroke-dasharray="3 3"/>`;
      arrow(xa, levels[0].E, levels[5].E, '--bad', 3);
      const ym = (Y(levels[0].E) + Y(levels[5].E)) / 2 + 30;
      s += `<text x="${xa - 8}" y="${ym}" text-anchor="end" font-size="13" font-weight="700" fill="var(--bad)">ΔH lattice</text>`;
      s += `<text x="${xa - 8}" y="${ym + 16}" text-anchor="end" font-size="13" font-weight="700" fill="var(--bad)">${f1(total)} kJ/mol</text>`;
    }
    s += `<text x="${W - 4}" y="12" text-anchor="end" font-size="11" fill="var(--text-muted)">energy ↑ (to scale)</text>`;
    $('bh-svg').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Born–Haber cycle energy levels for ${M}${X}">${s}</svg>`;
  }
  $('bh-next').addEventListener('click', () => { k = Math.min(5, k + 1); render(); });
  $('bh-reset').addEventListener('click', () => { k = 0; render(); });
  render();
}
