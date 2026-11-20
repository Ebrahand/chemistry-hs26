// Module 1: ΔE = q + w as a "vault" with heat and work arrows, and the battery path example.

import { sgn } from '../assets/thermo.js';

const $ = id => document.getElementById(id);
const qIn = $('fl-q'), wIn = $('fl-w');

const PRESETS = [
  { name: 'Warm a gas; it expands', q: 40, w: -15,
    text: 'Heat flows in (q > 0) and the expanding gas pushes the piston out, doing work on the surroundings (w < 0).' },
  { name: 'Compress a gas', q: -20, w: 60,
    text: 'The piston does work on the gas (w > 0). The gas gets warmer than its surroundings and loses some heat (q < 0).' },
  { name: 'Exothermic reaction in a rigid box', q: -80, w: 0,
    text: 'A rigid box cannot change volume, so no P–V work is done (w = 0). All the energy leaves as heat.' },
];
const presetsEl = $('fl-presets');
presetsEl.innerHTML = PRESETS.map((p, i) => `<button class="btn" type="button" data-i="${i}">${p.name}</button>`).join('');
let active = 0;

// horizontal arrow from x1 to x2 at height y, thickness by magnitude
function harrow(x1, x2, y, mag, col, label, sub) {
  const t = 4 + 14 * Math.min(1, mag / 100);
  const dir = Math.sign(x2 - x1) || 1;
  const head = 10 + t * 0.6;
  const xb = x2 - dir * head;
  const lx = (x1 + x2) / 2;
  return `<line x1="${x1}" y1="${y}" x2="${xb}" y2="${y}" stroke="var(${col})" stroke-width="${t}"/>` +
    `<path d="M${xb},${y - t / 2 - 6} L${x2},${y} L${xb},${y + t / 2 + 6} z" fill="var(${col})"/>` +
    `<text x="${lx}" y="${y - t / 2 - 10}" font-size="14" font-weight="700" text-anchor="middle" fill="var(${col})">${label}</text>` +
    `<text x="${lx}" y="${y + t / 2 + 20}" font-size="12" text-anchor="middle" fill="var(--text-muted)">${sub}</text>`;
}

function render() {
  const q = +qIn.value, w = +wIn.value, dE = q + w;
  $('fl-q-out').textContent = `${sgn(q, 0)} kJ`;
  $('fl-w-out').textContent = `${sgn(w, 0)} kJ`;
  presetsEl.querySelectorAll('button').forEach((b, i) => b.classList.toggle('primary', i === active));

  const W = 560, H = 270;
  const bx = 200, by = 40, bw = 160, bh = 190;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<text x="12" y="20" font-size="12" fill="var(--text-muted)">surroundings</text>`;
  s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="10" fill="var(--surface-2)" stroke="var(--text)" stroke-width="2"/>`;
  s += `<text x="${bx + bw / 2}" y="${by + 22}" font-size="13" text-anchor="middle" fill="var(--text-muted)">system</text>`;
  // energy level bar inside: centre line = no change
  const mid = by + 95, bar = Math.min(55, Math.abs(dE) * 0.55);
  const top = dE > 0 ? mid - bar : mid, bot = dE > 0 ? mid : mid + bar;
  const ecol = dE > 0 ? '--good' : dE < 0 ? '--bad' : '--text-muted';
  s += `<line x1="${bx + 30}" y1="${mid}" x2="${bx + bw - 30}" y2="${mid}" stroke="var(--plot-axis)" stroke-dasharray="4 4"/>`;
  if (dE) s += `<rect x="${bx + 55}" y="${top}" width="${bw - 110}" height="${Math.max(2, bot - top)}" fill="var(${ecol})" opacity="0.8"/>`;
  s += `<text x="${bx + bw / 2}" y="${by + bh - 12}" font-size="16" font-weight="700" text-anchor="middle" fill="var(${ecol})">ΔE = ${sgn(dE, 0)} kJ</text>`;
  // heat on the left, work on the right
  if (q) s += q > 0 ? harrow(20, bx - 6, 115, Math.abs(q), '--c0', `q = ${sgn(q, 0)}`, 'heat in')
                    : harrow(bx - 6, 20, 115, Math.abs(q), '--c0', `q = ${sgn(q, 0)}`, 'heat out');
  else s += `<text x="${bx / 2 + 6}" y="110" font-size="13" text-anchor="middle" fill="var(--text-muted)">q = 0</text>`;
  if (w) s += w > 0 ? harrow(W - 20, bx + bw + 6, 115, Math.abs(w), '--c1', `w = ${sgn(w, 0)}`, 'work done on system')
                    : harrow(bx + bw + 6, W - 20, 115, Math.abs(w), '--c1', `w = ${sgn(w, 0)}`, 'work done by system');
  else s += `<text x="${bx + bw + (W - bx - bw) / 2}" y="110" font-size="13" text-anchor="middle" fill="var(--text-muted)">w = 0</text>`;
  s += '</svg>';
  $('fl-diagram').innerHTML = s;

  const kind = q > 0 ? 'Heat flows in: endothermic.' : q < 0 ? 'Heat flows out: exothermic.' : 'No heat flows.';
  const res = dE > 0 ? 'More energy goes in than comes out, so the system gains energy.'
    : dE < 0 ? 'More energy comes out than goes in, so the system loses energy.'
    : 'What goes in comes back out: the internal energy does not change.';
  const p = active >= 0 ? PRESETS[active].text + ' ' : '';
  $('fl-note').innerHTML = `${p || kind + ' '}${res} <strong>ΔE = q + w = (${sgn(q, 0)}) + (${sgn(w, 0)}) = ${sgn(dE, 0)} kJ</strong>.`;
}

presetsEl.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  active = +b.dataset.i;
  qIn.value = PRESETS[active].q; wIn.value = PRESETS[active].w;
  render();
});
for (const el of [qIn, wIn]) el.addEventListener('input', () => { active = -1; render(); });
qIn.value = PRESETS[0].q; wIn.value = PRESETS[0].w;
render();

// ---- path example: battery losing 100 kJ, through a wire or a motor (illustrative numbers)
const PATHS = [
  { q: -100, w: 0, text: 'Through a wire, all the energy comes out as heat: the wire gets hot.' },
  { q: -35, w: -65, text: 'Through a motor, most of the energy comes out as work (lifting a weight), the rest as heat.' },
];
function renderPath(i) {
  const p = PATHS[i];
  document.querySelectorAll('#path-btns button').forEach((b, j) => b.classList.toggle('primary', j === i));
  const W = 560, H = 150, base = 30, sc = 0.95;
  const bars = [['q', p.q, '--c0'], ['w', p.w, '--c1'], ['ΔE = q + w', p.q + p.w, '--bad']];
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<line x1="20" y1="${base}" x2="${W - 20}" y2="${base}" stroke="var(--plot-axis)"/>`;
  bars.forEach(([lab, v, col], k) => {
    const x = 60 + k * 170, h = Math.abs(v) * sc;
    if (h) s += `<rect x="${x}" y="${base}" width="90" height="${h}" fill="var(${col})" opacity="0.85"/>`;
    s += `<text x="${x + 45}" y="${base - 10}" font-size="14" font-weight="700" text-anchor="middle" fill="var(--text)">${lab}</text>`;
    s += `<text x="${x + 45}" y="${base + h + 18}" font-size="14" text-anchor="middle" fill="var(--text)">${sgn(v, 0)} kJ</text>`;
  });
  s += '</svg>';
  $('path-diagram').innerHTML = s + `<div class="callout">${p.text} Either way the battery ends up with the same
    ΔE = −100 kJ: ΔE is a state function, q and w are not.</div>`;
}
$('path-btns').addEventListener('click', e => {
  const b = e.target.closest('button'); if (b) renderPath(+b.dataset.p);
});
renderPath(0);
