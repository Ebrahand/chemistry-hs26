// Module 1: barometer. Column height h = P / (ρ g) for different liquids and altitudes (standard atmosphere).

const $ = id => document.getElementById(id);
const G = 9.80665;
const LIQ = [
  { k: 'Hg', name: 'mercury', rho: 13595, tube: 1.0 },
  { k: 'gly', name: 'glycerol', rho: 1260, tube: 9.0 },
  { k: 'w', name: 'water', rho: 1000, tube: 11.0 },
];
const PLACES = [['Sea level', 0], ['Zurich', 408], ['Jungfraujoch', 3454], ['Matterhorn', 4478], ['Everest', 8849]];
// International Standard Atmosphere (troposphere), kPa
const pAt = h => 101.325 * Math.pow(1 - 2.25577e-5 * h, 5.25588);

let liq = LIQ[0];
$('bar-liq').innerHTML = LIQ.map((l, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}">${l.name}</button>`).join('');
$('bar-liq').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  liq = LIQ[+b.dataset.i];
  $('bar-liq').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  render();
});
$('bar-places').innerHTML = PLACES.map(([n, h]) => `<button class="btn" type="button" data-h="${h}">${n}</button>`).join('');
$('bar-places').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $('bar-alt').value = b.dataset.h; render(); });
$('bar-alt').addEventListener('input', render);

function render() {
  const alt = +$('bar-alt').value, P = pAt(alt);   // kPa
  const h = (P * 1000) / (liq.rho * G);            // m
  $('bar-alt-out').textContent = `${alt} m`;
  $('bar-units').innerHTML = [
    ['Pa', Math.round(P * 1000).toLocaleString('en-US').replace(/,/g, ' ')],
    ['kPa', P.toFixed(1)],
    ['bar', (P / 100).toFixed(3)],
    ['atm', (P / 101.325).toFixed(3)],
    ['torr (mm Hg)', (P / 101.325 * 760).toFixed(0)],
  ].map(([u, v]) => `<tr><td>${u}</td><td class="num">${v}</td></tr>`).join('');

  // drawing: tube scaled to the liquid's own tube length, with a 1.8 m person for scale
  const W = 380, H = 320, top = 18, bottom = 270, scale = (bottom - top) / liq.tube;
  const x0 = 150, tw = 26;
  const hy = bottom - h * scale;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  // dish
  s += `<path d="M ${x0 - 60} ${bottom - 14} L ${x0 - 60} ${bottom + 18} L ${x0 + 110 + tw} ${bottom + 18} L ${x0 + 110 + tw} ${bottom - 14}" fill="none" stroke="var(--text-muted)" stroke-width="2"/>`;
  s += `<rect x="${x0 - 58}" y="${bottom}" width="${166 + tw}" height="17" fill="var(--c1)" opacity=".55"/>`;
  // tube and column
  s += `<rect x="${x0}" y="${hy}" width="${tw}" height="${bottom - hy + 12}" fill="var(--c1)" opacity=".75"/>`;
  s += `<path d="M ${x0} ${bottom + 12} L ${x0} ${top} Q ${x0 + tw / 2} ${top - 10} ${x0 + tw} ${top} L ${x0 + tw} ${bottom + 12}" fill="none" stroke="var(--text)" stroke-width="2"/>`;
  s += `<text x="${x0 + tw + 8}" y="${(top + hy) / 2 + 4}" font-size="12" fill="var(--text-muted)">vacuum</text>`;
  // height arrow
  s += `<line x1="${x0 - 14}" y1="${hy}" x2="${x0 - 14}" y2="${bottom}" stroke="var(--c0)" stroke-width="1.6"/>`;
  s += `<line x1="${x0 - 20}" y1="${hy}" x2="${x0 - 8}" y2="${hy}" stroke="var(--c0)" stroke-width="1.6"/><line x1="${x0 - 20}" y1="${bottom}" x2="${x0 - 8}" y2="${bottom}" stroke="var(--c0)" stroke-width="1.6"/>`;
  const hText = h < 2 ? `${(h * 1000).toFixed(0)} mm` : `${h.toFixed(2)} m`;
  s += `<text x="${x0 - 22}" y="${(hy + bottom) / 2 + 4}" text-anchor="end" font-size="15" font-weight="700" fill="var(--c0)">h = ${hText}</text>`;
  // atmosphere arrows on the dish
  for (const ax of [x0 - 40, x0 + tw + 90]) s += `<path d="M ${ax} ${bottom - 40} L ${ax} ${bottom - 6} M ${ax - 5} ${bottom - 13} L ${ax} ${bottom - 5} L ${ax + 5} ${bottom - 13}" fill="none" stroke="var(--text-muted)" stroke-width="1.6"/>`;
  s += `<text x="${x0 + tw + 97}" y="${bottom - 30}" font-size="12" fill="var(--text-muted)">P<tspan baseline-shift="sub" font-size="9">atm</tspan></text>`;
  // scale ticks
  const step = liq.tube <= 1 ? 0.1 : 1;
  for (let v = 0; v <= liq.tube + 1e-9; v += step) {
    const y = bottom - v * scale;
    s += `<line x1="${x0 + tw}" y1="${y}" x2="${x0 + tw + 5}" y2="${y}" stroke="var(--text-muted)"/>`;
    if (Math.round(v / step) % (liq.tube <= 1 ? 2 : 2) === 0) s += `<text x="${x0 + tw + 8}" y="${y + 4}" font-size="10" fill="var(--text-muted)">${liq.tube <= 1 ? (v * 1000).toFixed(0) + ' mm' : v.toFixed(0) + ' m'}</text>`;
  }
  // person 1.8 m
  const ph = 1.8 * scale, px = 330;
  const fits = ph < bottom - top;
  if (fits) {
    const hd = Math.min(12, ph * 0.12);
    s += `<circle cx="${px}" cy="${bottom + 18 - ph + hd}" r="${hd}" fill="none" stroke="var(--text-muted)" stroke-width="1.5"/>`;
    s += `<path d="M ${px} ${bottom + 18 - ph + 2 * hd} L ${px} ${bottom + 18 - ph * 0.45} M ${px} ${bottom + 18 - ph * 0.45} L ${px - ph * 0.12} ${bottom + 18} M ${px} ${bottom + 18 - ph * 0.45} L ${px + ph * 0.12} ${bottom + 18} M ${px - ph * 0.15} ${bottom + 18 - ph * 0.72} L ${px + ph * 0.15} ${bottom + 18 - ph * 0.72}" stroke="var(--text-muted)" stroke-width="1.5" fill="none"/>`;
  }
  s += `<text x="${fits ? px : W - 4}" y="${H - 6}" text-anchor="${fits ? 'middle' : 'end'}" font-size="11" fill="var(--text-muted)">${fits ? '1.8 m person' : 'a person (1.8 m) would not fit at this scale'}</text>`;
  $('bar-diagram').innerHTML = s + '</svg>';

  let note = `At ${alt} m the air pushes with ${P.toFixed(1)} kPa, and that holds up ${hText} of ${liq.name}:  h = P / (ρg) = ${(P * 1000).toFixed(0)} Pa / (${liq.rho} kg/m³ × 9.81 m/s²).`;
  if (liq.k === 'w') note += ' This is why a suction pump at the top of a well cannot lift water more than about 10 m: the atmosphere does the lifting.';
  else if (liq.k === 'Hg') note += ' Mercury is 13.6 times denser than water, so its column is 13.6 times shorter. That is why barometers use mercury, and why pressure is still quoted in mm Hg.';
  if (alt > 3000) note += ` Up here there is less air above you, so the pressure is only ${(100 * P / 101.325).toFixed(0)} % of that at sea level.`;
  $('bar-note').innerHTML = note;
}
render();
