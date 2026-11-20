// Module 2: solubility guidelines as a clickable grid; mix two salt solutions and write the molecular,
// complete ionic and net ionic equations.

import { CATIONS, ANIONS, compound, solubility, ionHTML } from '../assets/ions.js';
import { gcd } from '../assets/formula.js';

const $ = id => document.getElementById(id);
const cat = (f, q) => CATIONS.find(c => c.f === f && (q === undefined || c.q === q));
const an = f => ANIONS.find(a => a.f === f);

/* ---------- grid ---------- */
const ROWS = [cat('Na'), cat('K'), cat('NH4'), cat('Ag'), cat('Pb'), cat('Ba'), cat('Ca'), cat('Mg'), cat('Cu', 2), cat('Fe', 3)];
const COLS = ['NO3', 'CH3COO', 'Cl', 'I', 'SO4', 'CO3', 'PO4', 'OH', 'S'].map(an);
const grid = $('sol-grid');
grid.innerHTML = `<thead><tr><th></th>${COLS.map(a => `<th>${ionHTML(a)}</th>`).join('')}</tr></thead><tbody>` +
  ROWS.map((c, i) => `<tr><th style="text-align:right">${ionHTML(c)}</th>${COLS.map((a, j) => {
    const s = solubility(c, a).soluble;
    return `<td><button type="button" class="${s ? 'sol' : 'insol'}" data-i="${i}" data-j="${j}" aria-label="${compound(c, a).name}: ${s ? 'soluble' : 'insoluble'}">${s ? 'aq' : 's'}</button></td>`;
  }).join('')}</tr>`).join('') + '</tbody>';
function pick(i, j) {
  grid.querySelectorAll('button.sel').forEach(b => b.classList.remove('sel'));
  grid.querySelector(`button[data-i="${i}"][data-j="${j}"]`).classList.add('sel');
  const c = ROWS[i], a = COLS[j], k = compound(c, a), s = solubility(c, a);
  $('sol-note').innerHTML = `<strong>${k.html}</strong>, ${k.name}: <strong>${s.soluble ? 'soluble' : 'insoluble'}</strong>. ${s.why}`;
}
grid.addEventListener('click', e => { const b = e.target.closest('button'); if (b) pick(+b.dataset.i, +b.dataset.j); });
pick(3, 2);

/* ---------- mixing two solutions ---------- */
const SALTS = [
  [cat('Pb'), an('NO3')], [cat('K'), an('I')], [cat('Ag'), an('NO3')], [cat('Na'), an('Cl')], [cat('Na'), an('SO4')],
  [cat('Ba'), an('Cl')], [cat('Na'), an('CO3')], [cat('Ca'), an('Cl')], [cat('Na'), an('OH')], [cat('K'), an('PO4')],
  [cat('Mg'), an('NO3')], [cat('Cu', 2), an('NO3')], [cat('Fe', 3), an('NO3')], [cat('NH4'), an('Cl')], [cat('K'), an('NO3')],
].map(([c, a]) => ({ c, a, k: compound(c, a) }));
const opt = s => `<option>${s.k.text.replace(/(\d)/g, d => '₀₁₂₃₄₅₆₇₈₉'[d])}  ${s.k.name}</option>`;
$('mix-a').innerHTML = SALTS.map(opt).join(''); $('mix-b').innerHTML = SALTS.map(opt).join('');
$('mix-a').selectedIndex = 0; $('mix-b').selectedIndex = 1;

const coefStr = n => (n > 1 ? `${n} ` : '');
const ionTerm = (ion, n, cls = '') => `<span class="${cls}">${coefStr(n)}${ionHTML(ion)}(aq)</span>`;

function balance(s1, s2, p1, p2) {
  // x s1 + y s2 → u p1 + v p2 with p1 = c1 a2, p2 = c2 a1
  let best = null;
  for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) for (let u = 1; u <= 6; u++) for (let v = 1; v <= 6; v++) {
    if (x * s1.k.nc !== u * p1.nc || x * s1.k.na !== v * p2.na || y * s2.k.nc !== v * p2.nc || y * s2.k.na !== u * p1.na) continue;
    if (!best || x + y + u + v < best.reduce((a, b) => a + b)) best = [x, y, u, v];
  }
  return best;
}

function render() {
  const s1 = SALTS[$('mix-a').selectedIndex], s2 = SALTS[$('mix-b').selectedIndex];
  const ions = [s1.c, s1.a, s2.c, s2.a].filter((ion, i, arr) => arr.findIndex(o => o.f === ion.f && o.q === ion.q) === i);
  const sameCat = s1.c === s2.c, sameAn = s1.a === s2.a;
  const p1 = compound(s1.c, s2.a), p2 = compound(s2.c, s1.a);
  const sol1 = solubility(s1.c, s2.a), sol2 = solubility(s2.c, s1.a);
  const insol = [!sol1.soluble, !sol2.soluble];
  $('mix-ions').innerHTML = ions.map(ion => {
    const inPpt = (!sameCat && !sameAn) && ((insol[0] && (ion === s1.c || ion === s2.a)) || (insol[1] && (ion === s2.c || ion === s1.a)));
    return `<span class="ion-chip ${inPpt ? 'ppt' : 'spect'}">${ionHTML(ion)}</span>`;
  }).join('');
  if (s1 === s2 || sameCat || sameAn) {
    $('mix-note').innerHTML = s1 === s2 ? 'The same solution twice: nothing new can form.' : `Both solutions contain ${ionHTML(sameCat ? s1.c : s1.a)}, so no new partners are possible. No reaction.`;
    $('mix-eqs').innerHTML = '';
    return;
  }
  if (!insol[0] && !insol[1]) {
    $('mix-note').innerHTML = `Possible new partners: ${p1.html} (${sol1.why.toLowerCase().replace(/\.$/, '')}) and ${p2.html} (${sol2.why.toLowerCase().replace(/\.$/, '')}). Both are soluble, so <strong>no precipitate</strong>: you just have a solution of four kinds of ion.`;
    $('mix-eqs').innerHTML = `<p class="eq-line">All four ions are spectators. <strong>No reaction</strong> (NR).</p>`;
    return;
  }
  const [x, y, u, v] = balance(s1, s2, p1, p2);
  const st = b => (b ? '(s)' : '(aq)');
  const mol = `<span>${coefStr(x)}${s1.k.html}(aq)</span> + <span>${coefStr(y)}${s2.k.html}(aq)</span> ⟶ <span>${coefStr(u)}${p1.html}${st(insol[0])}</span> + <span>${coefStr(v)}${p2.html}${st(insol[1])}</span>`;
  // complete ionic
  const left = [[s1.c, x * s1.k.nc], [s1.a, x * s1.k.na], [s2.c, y * s2.k.nc], [s2.a, y * s2.k.na]];
  const right = [];
  if (insol[0]) right.push({ solid: `${coefStr(u)}${p1.html}(s)`, n: u }); else right.push({ ion: s1.c, n: u * p1.nc }, { ion: s2.a, n: u * p1.na });
  if (insol[1]) right.push({ solid: `${coefStr(v)}${p2.html}(s)`, n: v }); else right.push({ ion: s2.c, n: v * p2.nc }, { ion: s1.a, n: v * p2.na });
  const spect = ion => right.some(r => r.ion === ion);
  const lhs = left.map(([ion, n]) => ionTerm(ion, n, spect(ion) ? 'spect' : '')).join(' + ');
  const rhs = right.map(r => r.solid ? `<span>${r.solid}</span>` : ionTerm(r.ion, r.n, 'spect')).join(' + ');
  // net ionic: non-spectator ions on the left, solids on the right, reduced by the gcd
  const netL = left.filter(([ion]) => !spect(ion));
  const netR = [];
  if (insol[0]) netR.push([p1, u]); if (insol[1]) netR.push([p2, v]);
  const g = [...netL.map(([, n]) => n), ...netR.map(([, n]) => n)].reduce((a, b) => gcd(a, b));
  const net = netL.map(([ion, n]) => `<span>${coefStr(n / g)}${ionHTML(ion)}(aq)</span>`).join(' + ') + ' ⟶ ' + netR.map(([p, n]) => `<span>${coefStr(n / g)}${p.html}(s)</span>`).join(' + ');
  $('mix-eqs').innerHTML =
    `<p class="small muted" style="margin:0">Molecular equation</p><p class="eq-line">${mol}</p>` +
    `<p class="small muted" style="margin:0">Complete ionic equation (spectator ions struck through)</p><p class="eq-line">${lhs} ⟶ ${rhs}</p>` +
    `<p class="small muted" style="margin:0">Net ionic equation</p><p class="eq-line"><strong>${net}</strong></p>`;
  const ppts = [insol[0] ? p1 : null, insol[1] ? p2 : null].filter(Boolean);
  const why = [insol[0] ? sol1.why : null, insol[1] ? sol2.why : null].filter(Boolean).join(' ');
  $('mix-note').innerHTML = `<strong>${ppts.map(p => p.name).join(' and ')} precipitate${ppts.length > 1 ? '' : 's'}.</strong> ${why}` +
    (ppts.some(p => p.text === 'PbI2') ? ' Lead(II) iodide is bright yellow (Brown Fig. 4.3).' : '') +
    (ppts.some(p => p.text === 'AgCl') ? ' Silver chloride is white; silver halides were used in photographic film.' : '') +
    (ppts.some(p => p.text === 'Cu(OH)2') ? ' Copper(II) hydroxide is a pale blue solid.' : '');
}
$('mix-a').addEventListener('change', render);
$('mix-b').addEventListener('change', render);
render();
