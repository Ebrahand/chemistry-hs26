// Module 1: three-step enthalpy diagram of dissolving, and the alcohol solubility table.

import { fix } from '../assets/format.js';

const $ = id => document.getElementById(id);
const in1 = $('dh-1'), in2 = $('dh-2'), in3 = $('dh-3');

// Illustrative magnitudes only (the page says so). They follow Brown's qualitative picture.
const PRESETS = [
  { name: 'Ionic solid in water', v: [90, 30, -118],
    text: 'Breaking up the crystal costs a lot (ΔH₁), but the ions are strongly surrounded by water (ion–dipole, ΔH₃). The two nearly cancel.' },
  { name: 'Oil in water', v: [10, 45, -12],
    text: 'Water molecules hold on to each other through hydrogen bonds (large ΔH₂). Oil molecules can only offer weak dispersion attractions in return (small ΔH₃).' },
  { name: 'Hexane in heptane', v: [20, 20, -40],
    text: 'Both are held together by dispersion forces only. The forces broken and the forces formed are about the same: ΔH_soln ≈ 0, and entropy makes them mix in any proportion.' },
  { name: 'Ethanol in water', v: [35, 40, -80],
    text: 'Ethanol and water both form hydrogen bonds, and they form them with each other too. They mix in any proportion.' },
];
const ENTROPY = 15;   // what the entropy of mixing can "pay for", in the same illustrative units

const presetsEl = $('dh-presets');
presetsEl.innerHTML = PRESETS.map((p, i) => `<button class="btn" type="button" data-i="${i}">${p.name}</button>`).join('');
let active = 0;

function render() {
  const a = +in1.value, b = +in2.value, c = +in3.value, sol = a + b + c;
  $('dh-1-out').textContent = `+${a}`;
  $('dh-2-out').textContent = `+${b}`;
  $('dh-3-out').textContent = fix(c);
  presetsEl.querySelectorAll('button').forEach((x, i) => x.classList.toggle('primary', i === active));

  // levels (enthalpy, illustrative units)
  const L = [0, a, a + b, sol];
  const lo = Math.min(0, sol) - 10, hi = a + b + 15;
  const W = 520, H = 300, top = 18, bot = 24;
  const Y = v => top + (hi - v) / (hi - lo) * (H - top - bot);
  const xs = [[20, 120], [140, 240], [260, 360], [380, 480]];
  const names = ['solute + solvent', 'solute particles apart', 'room made in solvent', 'solution'];
  const arrow = (x, y1, y2, col, label) => {
    const up = y2 < y1;
    return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2 + (up ? 6 : -6)}" stroke="var(${col})" stroke-width="3"/>` +
      `<path d="M${x - 6},${y2 + (up ? 8 : -8)} L${x},${y2} L${x + 6},${y2 + (up ? 8 : -8)} z" fill="var(${col})"/>` +
      `<text x="${x + 8}" y="${(y1 + y2) / 2 + 4}" font-size="13" fill="var(${col})" font-weight="600">${label}</text>`;
  };
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<line x1="10" y1="${Y(0)}" x2="${W - 10}" y2="${Y(0)}" stroke="var(--plot-axis)" stroke-dasharray="4 4"/>`;
  L.forEach((v, i) => {
    const [x1, x2] = xs[i];
    const col = i === 3 ? (sol <= 0 ? '--good' : '--bad') : '--text';
    svg += `<line x1="${x1}" y1="${Y(v)}" x2="${x2}" y2="${Y(v)}" stroke="var(${col})" stroke-width="3"/>`;
    const below = i === 0 || i === 3;
    svg += `<text x="${(x1 + x2) / 2}" y="${Y(v) + (below ? 16 : -7)}" font-size="12" text-anchor="middle" fill="var(--text-muted)">${names[i]}</text>`;
  });
  if (a) svg += arrow(130, Y(0), Y(a), '--c0', 'ΔH₁');
  if (b) svg += arrow(250, Y(a), Y(a + b), '--c0', 'ΔH₂');
  if (c) svg += arrow(370, Y(a + b), Y(sol), '--c1', 'ΔH₃');
  if (Math.abs(sol) > 1) svg += arrow(495, Y(0), Y(sol), sol <= 0 ? '--good' : '--bad', '');
  svg += `<text x="${W - 12}" y="${top + 2}" font-size="14" text-anchor="end" font-weight="700" fill="var(${sol <= 0 ? '--good' : '--bad'})">ΔH<tspan font-size="10" dy="4">soln</tspan><tspan dy="-4"> = ${sol > 0 ? '+' : ''}${fix(sol)}</tspan></text>`;
  svg += `<text x="12" y="${top}" font-size="12" fill="var(--text-muted)">enthalpy ↑</text></svg>`;
  $('dh-diagram').innerHTML = svg;

  let verdict;
  if (sol <= 0) verdict = `ΔH<sub>soln</sub> is ${sol === 0 ? 'zero' : 'negative (exothermic)'} and entropy favours mixing too: it dissolves.`;
  else if (sol <= ENTROPY) verdict = 'ΔH<sub>soln</sub> is slightly positive (endothermic), but the entropy gain of mixing can make up for it: it still dissolves, and the solution cools down a little.';
  else verdict = 'ΔH<sub>soln</sub> is strongly positive. The solute–solvent attractions are too weak to pay for breaking up the solute and the solvent, and entropy cannot make up the difference: it hardly dissolves.';
  const p = active >= 0 ? PRESETS[active].text + ' ' : '';
  $('dh-note').innerHTML = p.replace('ΔH_soln ≈ 0', 'ΔH<sub>soln</sub> ≈ 0') + verdict;
}

presetsEl.addEventListener('click', e => {
  const btn = e.target.closest('button'); if (!btn) return;
  active = +btn.dataset.i;
  [in1.value, in2.value, in3.value] = PRESETS[active].v;
  render();
});
for (const el of [in1, in2, in3]) el.addEventListener('input', () => { active = -1; render(); });
[in1.value, in2.value, in3.value] = PRESETS[0].v;
render();

// ---- alcohols (Brown Table 13.2): mol alcohol per 100 g solvent, 20 °C; Infinity = miscible
const ALC = [
  ['methanol, CH₃OH', Infinity, '0.12'], ['ethanol, C₂H₅OH', Infinity, Infinity], ['propanol, C₃H₇OH', Infinity, Infinity],
  ['butanol, C₄H₉OH', '0.11', Infinity], ['pentanol, C₅H₁₁OH', '0.030', Infinity], ['hexanol, C₆H₁₃OH', '0.0058', Infinity],
];   // values as strings so the significant figures are kept
const bar = s => s === Infinity ? 100 : Math.max(4, (Math.log10(+s) + 3) / 3.3 * 100);   // 0.001 → 0 %, ~2 → 100 %
const show = s => s === Infinity ? '∞' : String(s);
$('alc-table').innerHTML = ALC.map(([n, w, h]) =>
  `<tr><td>${n}</td><td class="num">${show(w)}</td><td><div class="hbar"><i style="width:${bar(w).toFixed(0)}%"></i></div></td><td class="num">${show(h)}</td></tr>`).join('');
