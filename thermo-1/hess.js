// Module 5: Hess's-law puzzles. Scale and reverse given reactions until they add up to the target.

import { eqText, sgn } from '../assets/thermo.js';

const $ = id => document.getElementById(id);

// ΔH values: P1 and P4 from Brown Appendix C (rounded as in the lecture and Brown's examples);
// P2 is Brown's graphite → diamond example; P3 is sample problem 3 of exercise 4.
const PUZZLES = [
  { name: 'Liquid water',
    target: { 'H2(g)': -2, 'O2(g)': -1, 'H2O(l)': 2 },
    given: [
      { eq: { 'H2(g)': -2, 'O2(g)': -1, 'H2O(g)': 2 }, dH: -483.6 },
      { eq: { 'H2O(l)': -1, 'H2O(g)': 1 }, dH: 44.0 },
    ], sol: [1, -2] },
  { name: 'Graphite → diamond',
    target: { 'C(graphite)': -1, 'C(diamond)': 1 },
    given: [
      { eq: { 'C(graphite)': -1, 'O2(g)': -1, 'CO2(g)': 1 }, dH: -393.5 },
      { eq: { 'C(diamond)': -1, 'O2(g)': -1, 'CO2(g)': 1 }, dH: -395.4 },
    ], sol: [1, -1] },
  { name: 'Methanol from CO',
    target: { 'CO(g)': -1, 'H2(g)': -2, 'CH3OH(g)': 1 },
    given: [
      { eq: { 'C(graphite)': -2, 'O2(g)': -1, 'CO(g)': 2 }, dH: -221.0 },
      { eq: { 'C(graphite)': -2, 'H2(g)': -4, 'O2(g)': -1, 'CH3OH(g)': 2 }, dH: -402.4 },
    ], sol: [-0.5, 0.5] },
  { name: 'Methane from its elements',
    target: { 'C(graphite)': -1, 'H2(g)': -2, 'CH4(g)': 1 },
    given: [
      { eq: { 'CH4(g)': -1, 'O2(g)': -2, 'CO2(g)': 1, 'H2O(l)': 2 }, dH: -890.4 },
      { eq: { 'C(graphite)': -1, 'O2(g)': -1, 'CO2(g)': 1 }, dH: -393.5 },
      { eq: { 'H2(g)': -1, 'O2(g)': -0.5, 'H2O(l)': 1 }, dH: -285.8 },
    ], sol: [-1, 1, 2] },
];
const FACTORS = [-2, -1, -0.5, 0, 0.5, 1, 2];
const fLabel = f => ({ '-0.5': '−½ (reverse, half)', '0.5': '½', '-1': '−1 (reverse)', '-2': '−2 (reverse, double)' }[f] || String(f));

let P = 0, fac = [];
const pz = $('hess-puzzles');
pz.innerHTML = PUZZLES.map((p, i) => `<button class="btn" type="button" data-i="${i}">${p.name}</button>`).join('');

const scaled = (eq, f) => Object.fromEntries(Object.entries(eq).map(([k, c]) => [k, c * f]));

function load(i) {
  P = i; fac = PUZZLES[i].given.map(() => 1);
  pz.querySelectorAll('button').forEach((b, j) => b.classList.toggle('primary', j === i));
  $('hess-target').textContent = eqText(PUZZLES[i].target) + '   ΔH = ?';
  $('hess-rows').innerHTML = PUZZLES[i].given.map((g, k) =>
    `<tr><td id="hess-eq-${k}">${eqText(g.eq)}</td><td class="num">${sgn(g.dH, 1)}</td>` +
    `<td><select data-k="${k}" aria-label="Factor for reaction ${k + 1}">${FACTORS.map(f => `<option value="${f}"${f === 1 ? ' selected' : ''}>${fLabel(f)}</option>`).join('')}</select></td>` +
    `<td class="num" id="hess-c-${k}"></td></tr>`).join('');
  render();
}

function render() {
  const p = PUZZLES[P];
  const net = {};
  let dH = 0;
  const steps = [];
  p.given.forEach((g, k) => {
    const f = fac[k];
    $(`hess-eq-${k}`).textContent = f === 0 ? eqText(g.eq) : eqText(f < 0 ? scaled(g.eq, -1) : g.eq);
    $(`hess-eq-${k}`).style.opacity = f === 0 ? 0.45 : 1;
    $(`hess-c-${k}`).textContent = f === 0 ? '—' : `${sgn(f * g.dH, 1)}`;
    if (!f) return;
    for (const [sp, c] of Object.entries(g.eq)) net[sp] = (net[sp] || 0) + f * c;
    dH += f * g.dH;
    steps.push({ k, v: f * g.dH });
  });
  for (const sp of Object.keys(net)) if (Math.abs(net[sp]) < 1e-9) delete net[sp];
  const keys = new Set([...Object.keys(net), ...Object.keys(p.target)]);
  const ok = [...keys].every(sp => Math.abs((net[sp] || 0) - (p.target[sp] || 0)) < 1e-9);
  const reversed = [...keys].every(sp => Math.abs((net[sp] || 0) + (p.target[sp] || 0)) < 1e-9);
  $('hess-sum').innerHTML = `${Object.keys(net).length ? eqText(net) : '(nothing left)'} &nbsp; ΔH = <strong>${sgn(dH, 1)} kJ</strong>`;
  const note = $('hess-note');
  if (ok) note.innerHTML = `✔ That is the target reaction. <strong>ΔH = ${sgn(dH, 1)} kJ</strong>.` +
    (P === 1 ? ' Diamond is slightly higher in enthalpy than graphite. You could never measure this directly: the reaction is far too slow.' : '');
  else if (reversed) note.innerHTML = 'Close: that is the target reaction backwards. Flip the sign of every factor.';
  else note.innerHTML = 'Not the target yet. Look for a species that appears in only one given reaction: its coefficient in the target tells you the factor for that reaction.';
  note.style.borderColor = ok ? 'var(--good)' : '';

  // staircase diagram
  const levels = [0];
  for (const st of steps) levels.push(levels[levels.length - 1] + st.v);
  const lo = Math.min(...levels), hi = Math.max(...levels);
  const span = Math.max(hi - lo, 50);
  const W = 420, H = 260, top = 24, bot = 24;
  const Y = v => top + (hi + span * 0.05 - v) / (span * 1.1) * (H - top - bot);
  const n = levels.length, step = (W - 40) / Math.max(n, 2);
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<text x="4" y="14" font-size="12" fill="var(--text-muted)">enthalpy ↑</text>`;
  levels.forEach((v, i) => {
    const x1 = 20 + i * step, x2 = x1 + step * 0.62;
    s += `<line x1="${x1}" y1="${Y(v)}" x2="${x2}" y2="${Y(v)}" stroke="var(--text)" stroke-width="3"/>`;
    s += `<text x="${(x1 + x2) / 2}" y="${Y(v) + (i && levels[i] < levels[i - 1] ? 16 : -7)}" font-size="11" text-anchor="middle" fill="var(--text-muted)">${i === 0 ? 'start' : 'after ' + (steps[i - 1].k + 1)}</text>`;
    if (i) {
      const ax = x1 - step * 0.19, y1 = Y(levels[i - 1]), y2 = Y(v), up = y2 < y1;
      const col = v < levels[i - 1] ? '--bad' : '--good';
      if (Math.abs(y2 - y1) > 12) s += `<line x1="${ax}" y1="${y1}" x2="${ax}" y2="${y2 + (up ? 8 : -8)}" stroke="var(${col})" stroke-width="2.5"/>` +
        `<path d="M${ax - 5},${y2 + (up ? 9 : -9)} L${ax},${y2} L${ax + 5},${y2 + (up ? 9 : -9)} z" fill="var(${col})"/>`;
    }
  });
  if (steps.length) {
    const xe = 20 + (n - 1) * step + step * 0.62;
    s += `<line x1="20" y1="${Y(0)}" x2="${xe}" y2="${Y(0)}" stroke="var(--plot-axis)" stroke-dasharray="4 4"/>`;
    s += `<text x="${W - 4}" y="14" font-size="13" font-weight="700" text-anchor="end" fill="var(${ok ? '--good' : '--text'})">total ${sgn(dH, 1)} kJ</text>`;
  }
  s += '</svg>';
  $('hess-diagram').innerHTML = s;
}

pz.addEventListener('click', e => { const b = e.target.closest('button'); if (b) load(+b.dataset.i); });
$('hess-rows').addEventListener('change', e => {
  const s = e.target.closest('select'); if (!s) return;
  fac[+s.dataset.k] = +s.value; render();
});
$('hess-reveal').addEventListener('click', () => {
  fac = [...PUZZLES[P].sol];
  document.querySelectorAll('#hess-rows select').forEach((s, k) => { s.value = String(fac[k]); });
  render();
});
load(0);
