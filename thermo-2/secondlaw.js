// Module 2: 1 mol of ice melting at 0 °C with surroundings at T_surr. ΔS_sys, ΔS_surr, ΔS_univ.

import { sgn } from '../assets/thermo.js';

const $ = id => document.getElementById(id);
const tIn = $('ice-T');
const HFUS = 6010, TM = 273.15;   // J/mol (Brown), K

function render() {
  const tc = +tIn.value, T = tc + 273.15;
  $('ice-T-out').textContent = `${tc.toFixed(1)} °C`;
  const dSsys = HFUS / TM, dSsurr = -HFUS / T, dSuniv = dSsys + dSsurr;

  const rows = [
    ['ΔS<sub>sys</sub> = +ΔH<sub>fus</sub> / 273.15 K', `${sgn(dSsys, 1)} J/K`],
    [`ΔS<sub>surr</sub> = −ΔH<sub>fus</sub> / ${T.toFixed(2)} K`, `${sgn(dSsurr, 1)} J/K`],
    ['ΔS<sub>univ</sub>', `${sgn(dSuniv, 2)} J/K`],
  ];
  $('ice-readout').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td class="num">${b}</td></tr>`).join('');

  const W = 480, H = 252, base = 122, sc = 3.4;
  const bars = [['ice (system)', dSsys, '--c1'], ['surroundings', dSsurr, '--c0'], ['universe', dSuniv, Math.abs(dSuniv) < 0.005 ? '--text-muted' : dSuniv > 0 ? '--good' : '--bad']];
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<text x="8" y="16" font-size="12" fill="var(--text-muted)">ΔS for melting 1 mol of ice (J/K)</text>`;
  s += `<line x1="20" y1="${base}" x2="${W - 20}" y2="${base}" stroke="var(--plot-axis)"/>`;
  bars.forEach(([lab, v, col], k) => {
    const x = 50 + k * 145, h = Math.max(Math.abs(v) * sc, 1.5);
    const y = v >= 0 ? base - h : base;
    s += `<rect x="${x}" y="${y}" width="90" height="${h}" fill="var(${col})" opacity="0.85"/>`;
    s += `<text x="${x + 45}" y="${v >= 0 ? y - 6 : y + h + 15}" font-size="14" font-weight="700" text-anchor="middle" fill="var(${col})">${sgn(v, 1)}</text>`;
    s += `<text x="${x + 45}" y="${H - 8}" font-size="13" text-anchor="middle" fill="var(--text)">${lab}</text>`;
  });
  s += '</svg>';
  $('ice-diagram').innerHTML = s;

  let note;
  if (Math.abs(tc) < 0.01) note = 'At exactly 0 °C the heat flows across no temperature difference: the surroundings lose exactly the entropy the ice gains. ΔS<sub>univ</sub> = 0: the <strong>reversible</strong> case. Ice and water coexist; nudge the temperature up or down and it melts or freezes.';
  else if (dSuniv > 0) note = `The heat leaves the surroundings at ${tc.toFixed(1)} °C, a higher temperature than the 0 °C at which the ice takes it up, so the surroundings lose less entropy than the ice gains. ΔS<sub>univ</sub> &gt; 0: the ice melts <strong>spontaneously</strong> (irreversibly).`;
  else note = `Below 0 °C, melting would take heat from colder surroundings: they would lose more entropy than the ice gains. ΔS<sub>univ</sub> &lt; 0, so melting is <strong>nonspontaneous</strong>. The reverse, water freezing, has ΔS<sub>univ</sub> = ${sgn(-dSuniv, 2)} J/K &gt; 0 and happens by itself, although the water's own entropy goes down.`;
  $('ice-note').innerHTML = note;
}

tIn.addEventListener('input', render);
$('ice-presets').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  tIn.value = b.dataset.t; render();
});
render();
