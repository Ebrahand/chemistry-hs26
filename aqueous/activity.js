// Module 5: activity series (Brown Table 4.5). A metal strip in a solution of metal ions or an acid:
// does it react, and what is the net ionic equation?

import { gcd } from '../assets/formula.js';

const $ = id => document.getElementById(id);
// [symbol, name, ion charge] from easiest to hardest to oxidize
const SERIES = [
  ['Li', 'lithium', 1], ['K', 'potassium', 1], ['Ba', 'barium', 2], ['Ca', 'calcium', 2], ['Na', 'sodium', 1],
  ['Mg', 'magnesium', 2], ['Al', 'aluminium', 3], ['Mn', 'manganese', 2], ['Zn', 'zinc', 2], ['Cr', 'chromium', 3],
  ['Fe', 'iron', 2], ['Co', 'cobalt', 2], ['Ni', 'nickel', 2], ['Sn', 'tin', 2], ['Pb', 'lead', 2], ['H', 'hydrogen', 1],
  ['Cu', 'copper', 2], ['Ag', 'silver', 1], ['Hg', 'mercury', 2], ['Pt', 'platinum', 2], ['Au', 'gold', 3],
];
const WATER = ['Li', 'K', 'Ba', 'Ca', 'Na'];
const ION_COLOUR = { Cu: '#3d8fd9', Ni: '#4caf50', Co: '#d9739a', Cr: '#5f9e6e', Fe: '#9cc58a', Mn: '#e8b9c6' };
const METAL_COLOUR = { Cu: '#b87333', Ag: '#c9c9c9', Au: '#d4af37', Pt: '#b8b8b0', Hg: '#a9a9b0', Pb: '#7d7f86', Sn: '#a5a5a0', Ni: '#a8a29a', Co: '#8b8f95', Fe: '#6e6e6e', Cr: '#9ba3ab', Zn: '#a7b0b8', Mn: '#999088', Al: '#c4c8cc', Mg: '#b9b9b9' };
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const ionU = (sym, q) => `${sym}${q > 1 ? SUP[q] : ''}⁺`;
const ionH = (sym, q) => `${sym}<sup>${q > 1 ? q : ''}+</sup>`;
const SALT = { Li: 'lithium nitrate', K: 'potassium nitrate', Ba: 'barium nitrate', Ca: 'calcium nitrate', Na: 'sodium nitrate', Mg: 'magnesium nitrate', Al: 'aluminium nitrate', Mn: 'manganese(II) nitrate', Zn: 'zinc nitrate', Cr: 'chromium(III) nitrate', Fe: 'iron(II) sulfate', Co: 'cobalt(II) nitrate', Ni: 'nickel(II) chloride', Sn: 'tin(II) chloride', Pb: 'lead(II) nitrate', H: 'hydrochloric acid', Cu: 'copper(II) nitrate', Ag: 'silver nitrate', Hg: 'mercury(II) nitrate', Pt: 'a platinum(II) salt', Au: 'gold(III) chloride' };

const metals = SERIES.map((s, i) => [s, i]).filter(([s]) => s[0] !== 'H');
$('act-metal').innerHTML = metals.map(([s, i]) => `<option value="${i}">${s[1]}, ${s[0]}</option>`).join('');
$('act-ion').innerHTML = SERIES.map((s, i) => `<option value="${i}">${ionU(s[0], s[2])}  ${SALT[s[0]]}</option>`).join('');
$('act-metal').value = String(SERIES.findIndex(s => s[0] === 'Cu'));
$('act-ion').value = String(SERIES.findIndex(s => s[0] === 'Ag'));

function render() {
  const im = +$('act-metal').value, ii = +$('act-ion').value;
  const [M, mName, m] = SERIES[im], [N, nName, n] = SERIES[ii];
  const same = im === ii, reacts = im < ii;

  // ladder
  const rowH = 17, W = 300, H = SERIES.length * rowH + 30;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<text x="0" y="12" font-size="11" fill="var(--text-muted)">easiest to oxidize</text><text x="0" y="${H - 4}" font-size="11" fill="var(--text-muted)">hardest to oxidize</text>`;
  SERIES.forEach(([sym, , q], i) => {
    const y = 18 + i * rowH;
    const isM = i === im, isN = i === ii;
    if (isM || isN) s += `<rect x="70" y="${y}" width="200" height="${rowH - 2}" rx="4" fill="color-mix(in srgb, var(${isM ? '--c0' : '--c1'}) 25%, var(--surface))"/>`;
    s += `<text x="80" y="${y + 12}" font-size="12" fill="var(--text)" font-weight="${isM || isN ? 700 : 400}">${sym === 'H' ? 'H₂' : sym}(${sym === 'H' ? 'g' : sym === 'Hg' ? 'l' : 's'}) → ${sym === 'H' ? '2 ' : ''}${ionU(sym, q)}(aq) + ${sym === 'H' ? 2 : q > 1 ? q : ''}e⁻</text>`;
    if (sym === 'H') s += `<line x1="70" y1="${y - 1}" x2="270" y2="${y - 1}" stroke="var(--plot-axis)" stroke-dasharray="3 3"/><line x1="70" y1="${y + rowH - 1}" x2="270" y2="${y + rowH - 1}" stroke="var(--plot-axis)" stroke-dasharray="3 3"/>`;
  });
  if (!same) {
    const y1 = 18 + im * rowH + 8, y2 = 18 + ii * rowH + 8;
    s += `<path d="M 62 ${y2} C 30 ${y2}, 30 ${y1}, 62 ${y1}" fill="none" stroke="var(${reacts ? '--good' : '--bad'})" stroke-width="2" marker-end="url(#act-ah)"/>`;
    s += `<defs><marker id="act-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(${reacts ? '--good' : '--bad'})"/></marker></defs>`;
    s += `<text x="26" y="${(y1 + y2) / 2 + 4}" text-anchor="middle" font-size="18" font-weight="700" fill="var(${reacts ? '--good' : '--bad'})">${reacts ? '✓' : '✗'}</text>`;
  }
  $('act-ladder').innerHTML = s + '</svg>';

  // beaker
  const BW = 260, BH = 170;
  const sol = ION_COLOUR[N] || 'var(--c1)', solOp = ION_COLOUR[N] ? 0.45 : 0.12;
  let b = `<svg viewBox="0 0 ${BW} ${BH}" xmlns="http://www.w3.org/2000/svg">`;
  b += `<rect x="40" y="50" width="180" height="110" fill="${sol}" opacity="${solOp}"/>`;
  if (reacts && ION_COLOUR[M]) b += `<rect x="40" y="50" width="180" height="110" fill="${ION_COLOUR[M]}" opacity=".3"/>`;
  b += `<path d="M 40 30 L 40 160 L 220 160 L 220 30" fill="none" stroke="var(--text)" stroke-width="2"/>`;
  b += `<rect x="118" y="10" width="24" height="135" rx="2" fill="${METAL_COLOUR[M] || '#999'}" stroke="var(--text-muted)"/>`;
  b += `<text x="130" y="28" text-anchor="middle" font-size="12" font-weight="700" fill="#222">${M}</text>`;
  if (reacts && N !== 'H') for (let k = 0; k < 16; k++) b += `<circle cx="${116 + (k % 2) * 28 + Math.sin(k * 2.1) * 2}" cy="${62 + k * 5}" r="${3 + (k % 3)}" fill="${METAL_COLOUR[N] || '#888'}" stroke="var(--text-muted)" stroke-width=".5"/>`;
  if (reacts && N === 'H') for (let k = 0; k < 12; k++) b += `<circle cx="${110 + (k * 37) % 44}" cy="${140 - k * 8}" r="${2.5 + (k % 3)}" fill="none" stroke="var(--text)" stroke-width="1"/>`;
  b += `<text x="130" y="${BH - 0}" text-anchor="middle" font-size="11" fill="var(--text-muted)">${SALT[N]}</text>`;
  $('act-beaker').innerHTML = b + '</svg>';

  // equation and note
  let note;
  if (same) note = `The ${mName} strip is in a solution of its own ions: nothing changes.`;
  else if (!reacts) note = `<strong>No reaction (NR).</strong> ${mName[0].toUpperCase() + mName.slice(1)} is <em>below</em> ${N === 'H' ? 'hydrogen' : nName} in the series, so ${ionH(N, n)} cannot take electrons from it.${N === 'H' ? ` ${mName[0].toUpperCase() + mName.slice(1)} does not dissolve in this acid.` : ''}`;
  else {
    let eq;
    if (N === 'H') {
      const k = m % 2 ? 2 : 1, a = k, bb = m * k;
      eq = `${a > 1 ? a + ' ' : ''}${M}(s) + ${bb} H<sup>+</sup>(aq) ⟶ ${a > 1 ? a + ' ' : ''}${ionH(M, m)}(aq) + ${bb / 2 > 1 ? bb / 2 + ' ' : ''}H<sub>2</sub>(g)`;
    } else {
      const g = gcd(m, n), a = n / g, bb = m / g;
      eq = `${a > 1 ? a + ' ' : ''}${M}(s) + ${bb > 1 ? bb + ' ' : ''}${ionH(N, n)}(aq) ⟶ ${a > 1 ? a + ' ' : ''}${ionH(M, m)}(aq) + ${bb > 1 ? bb + ' ' : ''}${N}(${N === 'Hg' ? 'l' : 's'})`;
    }
    note = `<strong>Reaction.</strong> ${mName[0].toUpperCase() + mName.slice(1)} is above ${N === 'H' ? 'hydrogen' : nName}, so it is oxidized and ${ionH(N, n)} is reduced.<br><span class="eq-line" style="display:inline-block;margin:6px 0">${eq}</span><br>` +
      `${M} goes from 0 to +${m} (loses ${m} e⁻ each); ${N} goes from +${n} to 0. The electrons lost and gained balance.` +
      (N === 'H' ? ' The bubbles are hydrogen gas.' : ` ${nName[0].toUpperCase() + nName.slice(1)} metal is deposited on the strip.`) +
      (ION_COLOUR[M] ? ` The solution takes on the colour of ${ionH(M, m)}.` : '');
  }
  if (WATER.includes(M)) note += ` <span class="small muted">In reality ${mName} is so active that it reacts with the water itself (giving H₂ and ${m > 1 ? M + '(OH)₂' : M + 'OH'}), whatever is dissolved in it.</span>`;
  $('act-note').innerHTML = note;
}
$('act-metal').addEventListener('change', render);
$('act-ion').addEventListener('change', render);
render();
