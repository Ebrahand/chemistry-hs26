// Module 4: Haber process. Equilibrium % NH₃ from a 1 : 3 N₂/H₂ feed at temperature T and total pressure P (ideal gases).

import { Plot } from '../assets/plot.js';
import { sig, sci } from '../assets/format.js';

const $ = id => document.getElementById(id);
// Brown Table 15.2 (15th ed., given in kPa), converted to bar: ×10⁴
const TABLE = [[300, 4.23e-3], [400, 1.60e-4], [450, 4.39e-5], [500, 1.41e-5], [550, 5.24e-6], [600, 2.19e-6]];
// Brown Fig. 15.9: % NH₃ measured, at 20.3, 30.4, 40.5, 50.6 MPa
const MEASURED = { 400: [38.7, 47.8, 54.9, 60.6], 450: [27.4, 35.9, 42.9, 48.8], 500: [18.9, 26.0, 32.2, 37.8], 550: [8.8, 12.9, 16.9, 20.8] };
const MPA = [20.3, 30.4, 40.5, 50.6];
const COLORS = { 400: '--c0', 450: '--c1', 500: '--c2', 550: '--c3' };

function Kp(Tc) {   // ln K linear in 1/T between table points
  const inv = 1 / (Tc + 273.15);
  for (let i = 0; i < TABLE.length - 1; i++) {
    const [t1, k1] = TABLE[i], [t2, k2] = TABLE[i + 1];
    if (Tc <= t2 || i === TABLE.length - 2) {
      const u = (inv - 1 / (t1 + 273.15)) / (1 / (t2 + 273.15) - 1 / (t1 + 273.15));
      return Math.exp(Math.log(k1) + u * (Math.log(k2) - Math.log(k1)));
    }
  }
}
// extent x per mol N₂: N₂ 1 − x, H₂ 3 − 3x, NH₃ 2x, total 4 − 2x.  Kp P² = 4x²(4 − 2x)² / (27 (1 − x)⁴)
function extent(K, P) {
  const target = K * P * P, g = x => 4 * x * x * (4 - 2 * x) ** 2 / (27 * (1 - x) ** 4) - target;
  let lo = 0, hi = 1 - 1e-12;
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (g(m) > 0) hi = m; else lo = m; }
  return (lo + hi) / 2;
}
const pctNH3 = (Tc, P) => { const x = extent(Kp(Tc), P); return 100 * x / (2 - x); };

const tIn = $('hb-T'), pIn = $('hb-P'), cIn = $('hb-cat');
const plot = new Plot($('hb-plot'));
const LOGS = Array.from({ length: 121 }, (_, i) => i / 40);   // log10 P from 0 to 3

function render() {
  const T = +tIn.value, P = Math.pow(10, +pIn.value), K = Kp(T);
  $('hb-T-out').textContent = `${T} °C`;
  $('hb-P-out').textContent = `${P < 10 ? P.toFixed(1) : Math.round(P)} bar`;
  const series = Object.keys(MEASURED).map(t => ({ points: LOGS.map(l => [l, pctNH3(+t, Math.pow(10, l))]), color: COLORS[t], width: 1.5 }));
  series.push({ points: LOGS.map(l => [l, pctNH3(T, Math.pow(10, l))]), color: '--text', width: 3 });
  const markers = [];
  for (const [t, ys] of Object.entries(MEASURED)) ys.forEach((y, i) => markers.push({ x: Math.log10(MPA[i] * 10), y, color: COLORS[t], hollow: true, r: 4.5 }));
  const y = pctNH3(T, P);
  markers.push({ x: Math.log10(P), y, color: '--text', r: 7 });
  plot.draw({
    x: { min: 0, max: 3, label: 'total pressure (bar, log scale)', tickValues: [0, 1, 2, 3], tickFormat: v => ['1', '10', '100', '1000'][v] },
    y: { min: 0, max: 100, label: '% NH₃ at equilibrium' },
    series, markers,
  });
  $('hb-legend').innerHTML = Object.keys(MEASURED).map(t => `<span><i style="border-color:var(${COLORS[t]})"></i>${t} °C</span>`).join('') +
    `<span><i style="border-color:var(--text)"></i>your T</span><span>○ measured (Brown)</span>`;

  const x = extent(K, P), tot = 4 - 2 * x;
  const pN2 = (1 - x) / tot * P, pH2 = 3 * (1 - x) / tot * P, pNH3 = 2 * x / tot * P;
  $('hb-readout').innerHTML = [
    [`K<sub>p</sub> at ${T} °C`, sci(K, 3)],
    ['NH₃ at equilibrium', `<strong>${sig(y, 3)} %</strong>`],
    ['P(N₂), P(H₂), P(NH₃)', `${sig(pN2, 3)}, ${sig(pH2, 3)}, ${sig(pNH3, 3)} bar`],
    ['Halve the volume now', 'Q = K/4 &lt; K: shifts →'],
  ].map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal">${b}</td></tr>`).join('');

  const at1 = pctNH3(T, 1);
  let note = `At 1 bar and ${T} °C only ${sig(at1, 2)} % NH₃ forms. At ${P < 10 ? P.toFixed(1) : Math.round(P)} bar: ${sig(y, 3)} %. `;
  note += T >= 500 ? 'Hotter means faster, but this exothermic equilibrium slides back towards N₂ and H₂. ' : T <= 400 ? 'Cooler gives more NH₃ at equilibrium, but even on iron the reaction gets slow. ' : 'Around 400–500 °C industry trades yield against speed. ';
  note += cIn.checked
    ? 'The iron catalyst does not change any of these numbers; it only gets the gas to them within seconds in the reactor. Unreacted N₂ and H₂ are recycled after the NH₃ is liquefied out.'
    : '<strong>Without the catalyst the equilibrium percentages are exactly the same</strong> (K is unchanged), but the gas would need far too long to reach them: in practice almost no NH₃ would come out of the reactor.';
  $('hb-note').innerHTML = note;
}
for (const el of [tIn, pIn]) el.addEventListener('input', render);
cIn.addEventListener('change', render);
render();
