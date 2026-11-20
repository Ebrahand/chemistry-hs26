// Module 3: Lewis structures step by step, formal charges, oxidation numbers, resonance.

import { MOLECULES, BY_ID, VALENCE, formulaHTML, totalValence, bondSum, electronsAround, formalCharges,
  oxidationNumbers, bestStructure, sub, validate } from './molecules.js';
import { BY_SYM } from '../assets/elements.js';

const $ = id => document.getElementById(id);
const U = 64;                      // px per bond length
const signed = v => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0');

/* ------------------------------------------------------------------ */
/* SVG renderer                                                        */
/* ------------------------------------------------------------------ */
// Spread k items over the angular gaps left by the occupied directions (radians). Returns angles.
function spread(occupied, k) {
  if (k === 0) return [];
  if (occupied.length === 0) {   // a free atom: the four sides of its Lewis symbol (top, right, bottom, left)
    const sides = [90, 0, 270, 180].map(d => d * Math.PI / 180);
    return k <= 4 ? sides.slice(0, k) : [...Array(k).keys()].map(i => Math.PI / 2 + i * 2 * Math.PI / k);
  }
  const occ = [...occupied].map(a => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).sort((a, b) => a - b);
  const gaps = occ.map((a, i) => ({ from: a, size: (i + 1 < occ.length ? occ[i + 1] : occ[0] + 2 * Math.PI) - a, n: 0 }));
  const mid = g => g.from + g.size / 2;
  const angDist = (a, b) => { const d = Math.abs(a - b) % (2 * Math.PI); return Math.min(d, 2 * Math.PI - d); };
  for (let i = 0; i < k; i++) {
    const top = Math.max(...gaps.map(g => g.size / (g.n + 1)));
    const tied = gaps.filter(g => g.size / (g.n + 1) > top - 1e-6);
    // among equally good gaps, take the one furthest from the gaps already used (lone pairs spread out, e.g. XeF4)
    const used = gaps.filter(g => g.n > 0).map(mid);
    let best = tied[0], bd = -1;
    for (const g of tied) {
      const d = used.length ? Math.min(...used.map(u => angDist(u, mid(g)))) : 0;
      if (d > bd + 1e-6) { bd = d; best = g; }
    }
    best.n++;
  }
  const out = [];
  for (const g of gaps) for (let i = 0; i < g.n; i++) out.push(g.from + g.size * (i + 1) / (g.n + 1));
  return out;
}

// structure: { atoms: [{el, x, y, lp, rad, singles}], bonds: [[i, j, order]] }
// opts: { charge, labels: array of strings per atom (or null), labelKind: 'fc' | 'ox', scale }
export function lewisSVG(s, opts = {}) {
  const P = s.atoms.map(a => [a.x * U, -a.y * U]);
  const dirs = s.atoms.map(() => []);
  for (const [i, j] of s.bonds) {
    dirs[i].push(Math.atan2(-(P[j][1] - P[i][1]), P[j][0] - P[i][0]));
    dirs[j].push(Math.atan2(-(P[i][1] - P[j][1]), P[i][0] - P[j][0]));
  }
  let g = '';
  const rad = el => (el === 'H' ? 10 : el.length > 1 ? 15 : 12);
  // bonds
  for (const [i, j, o] of s.bonds) {
    const [x1, y1] = P[i], [x2, y2] = P[j];
    const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const r1 = rad(s.atoms[i].el), r2 = rad(s.atoms[j].el);
    const offs = o === 1 ? [0] : o === 2 ? [-3.5, 3.5] : [-6, 0, 6];
    for (const d of offs) {
      const ox = -uy * d, oy = ux * d;
      g += `<line x1="${(x1 + ux * r1 + ox).toFixed(1)}" y1="${(y1 + uy * r1 + oy).toFixed(1)}" x2="${(x2 - ux * r2 + ox).toFixed(1)}" y2="${(y2 - uy * r2 + oy).toFixed(1)}" stroke="var(--text)" stroke-width="2" stroke-linecap="round"/>`;
    }
  }
  // atoms, lone pairs, single electrons, labels
  const xs = [], ys = [];
  s.atoms.forEach((a, i) => {
    const [x, y] = P[i];
    const r = rad(a.el);
    g += `<text x="${x}" y="${y + 7}" text-anchor="middle" font-size="21" font-weight="600" fill="var(--text)">${a.el}</text>`;
    xs.push(x - r - 6, x + r + 6); ys.push(y - 18, y + 18);
    const nl = a.lp || 0, ns = (a.rad || 0) + (a.singles || 0);
    const angs = spread(dirs[i], nl + ns);
    angs.forEach((t, k) => {
      const d = r + 7 + (a.el.length > 1 ? 2 : 0);
      const cx = x + Math.cos(t) * d, cy = y - Math.sin(t) * d;
      const px = -Math.sin(t), py = -Math.cos(t);
      if (k < nl) {
        g += `<circle cx="${(cx + px * 4).toFixed(1)}" cy="${(cy + py * 4).toFixed(1)}" r="2.7" fill="var(--text)"/><circle cx="${(cx - px * 4).toFixed(1)}" cy="${(cy - py * 4).toFixed(1)}" r="2.7" fill="var(--text)"/>`;
      } else {
        g += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.6" fill="var(${a.rad ? '--c0' : '--text'})"/>`;
      }
      xs.push(cx - 6, cx + 6); ys.push(cy - 6, cy + 6);
    });
    if (opts.labels && opts.labels[i] !== null && opts.labels[i] !== undefined && opts.labels[i] !== '') {
      const all = [...dirs[i], ...angs];
      const [t] = all.length ? spread(all, 1) : [Math.PI / 4];
      const d = r + 19;
      const lx = x + Math.cos(t) * d, ly = y - Math.sin(t) * d;
      const v = opts.labels[i];
      const col = opts.labelKind === 'ox' ? '--c2' : v.startsWith('+') ? '--c0' : v.startsWith('−') ? '--c1' : '--text-muted';
      g += opts.labelKind === 'ox'
        ? `<rect x="${(lx - 13).toFixed(1)}" y="${(ly - 9).toFixed(1)}" width="26" height="17" rx="4" fill="var(--surface)" stroke="var(${col})"/><text x="${lx.toFixed(1)}" y="${(ly + 4.5).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="var(${col})">${v}</text>`
        : `<text x="${lx.toFixed(1)}" y="${(ly + 4.5).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="var(${col})">${v}</text>`;
      xs.push(lx - 14, lx + 14); ys.push(ly - 10, ly + 10);
    }
  });
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (opts.charge) {
    const bx0 = x0 - 4, bx1 = x1 + 4, by0 = y0 - 4, by1 = y1 + 4;
    const br = (x, d) => `<path d="M${x + d * 7},${by0} L${x},${by0} L${x},${by1} L${x + d * 7},${by1}" fill="none" stroke="var(--text)" stroke-width="1.8"/>`;
    g += br(bx0, 1) + br(bx1, -1);
    const c = Math.abs(opts.charge) === 1 ? '' : Math.abs(opts.charge);
    g += `<text x="${bx1 + 4}" y="${by0 + 10}" font-size="15" font-weight="600" fill="var(--text)">${c}${opts.charge > 0 ? '+' : '−'}</text>`;
    x0 = bx0; x1 = bx1 + 20; y0 = by0; y1 = by1;
  }
  const pad = 8, W = x1 - x0 + 2 * pad, H = y1 - y0 + 2 * pad;
  const maxW = opts.maxWidth || 360;
  return `<svg viewBox="${(x0 - pad).toFixed(1)} ${(y0 - pad).toFixed(1)} ${W.toFixed(1)} ${H.toFixed(1)}" style="max-width:${Math.min(maxW, W * (opts.scale || 1.25))}px;margin:0 auto" role="img" aria-label="${opts.aria || 'Lewis structure'}">${g}</svg>`;
}

export function chargeLabels(s, kind) {
  if (kind === 'fc') return formalCharges(s).map(v => (v ? signed(v) : ''));   // zero formal charges are not written
  if (kind === 'ox') { const ox = oxidationNumbers(s); return ox ? ox.map(signed) : null; }
  return null;
}

/* ------------------------------------------------------------------ */
/* Steps (Lecture 7 p. 17)                                             */
/* ------------------------------------------------------------------ */
// "N and Cl both have electronegativity 3.0" for the first bond between different elements of equal electronegativity
function tie(s) {
  for (const [i, j] of s.bonds) {
    const a = s.atoms[i].el, b = s.atoms[j].el;
    if (a !== b && BY_SYM[a].en === BY_SYM[b].en) return `${a} and ${b} both have electronegativity ${BY_SYM[a].en.toFixed(1)}`;
  }
  return 'two different atoms have the same electronegativity';
}

function clone(s) { return { atoms: s.atoms.map(a => ({ ...a })), bonds: s.bonds.map(b => [...b]), central: s.central }; }
const nameOf = el => BY_SYM[el].name.toLowerCase();

export function buildSteps(m) {
  const fin = m.structures[m.kind === 'alternatives' ? bestStructure(m) : 0];
  const tot = totalValence(m);
  const central = new Set(fin.central);
  const steps = [];
  // 1. count
  const s1 = clone(fin); s1.bonds = [];
  s1.atoms.forEach(a => { const v = VALENCE[a.el]; a.lp = Math.max(0, v - 4); a.singles = v - 2 * a.lp; a.rad = 0; });
  const counts = {};
  for (const a of fin.atoms) counts[a.el] = (counts[a.el] || 0) + 1;
  const parts = Object.entries(counts).map(([el, n]) => `${n > 1 ? n + ' × ' : ''}${el} ${VALENCE[el]}`);
  let txt = parts.join(' + ');
  if (m.charge < 0) txt += ` + ${-m.charge} (charge ${m.charge === -1 ? '1−' : -m.charge + '−'})`;
  if (m.charge > 0) txt += ` − ${m.charge} (charge ${m.charge}+)`;
  steps.push({ s: s1, title: 'Count the valence electrons', text: `${txt} = <strong>${tot}</strong> valence electrons. Each atom is shown with its Lewis symbol.`, left: tot });
  // 2. skeleton
  const s2 = clone(fin); s2.bonds = s2.bonds.map(([i, j]) => [i, j, 1]); s2.atoms.forEach(a => { a.lp = 0; a.rad = 0; a.singles = 0; });
  let left = tot - 2 * s2.bonds.length;
  steps.push({ s: s2, title: 'Connect the atoms with single bonds', text: `${s2.bonds.length} single bond${s2.bonds.length > 1 ? 's' : ''} use ${2 * s2.bonds.length} electrons. <strong>${left}</strong> left.`, left });
  // 3. outer atoms
  const s3 = clone(s2);
  let used3 = 0;
  s3.atoms.forEach((a, i) => {
    if (central.has(i) || a.el === 'H') return;
    const need = Math.max(0, (8 - electronsAround(s3, i)) / 2);
    const give = Math.min(need, Math.floor(left / 2));
    a.lp = give; left -= 2 * give; used3 += 2 * give;
  });
  steps.push({ s: s3, title: 'Complete the octets of the outer atoms', text: used3 ? `Lone pairs on the outer atoms use ${used3} electrons (H needs no lone pair: 2 electrons are enough). <strong>${left}</strong> left.` : `The outer atoms are all H, which need only their 2 bonding electrons. <strong>${left}</strong> left.`, left });
  // 4. central atom(s)
  const s4 = clone(s3);
  const cs = [...central].sort((p, q) => BY_SYM[s4.atoms[q].el].en - BY_SYM[s4.atoms[p].el].en);
  const before4 = left;
  for (const i of cs) {
    const need = Math.max(0, (8 - electronsAround(s4, i)) / 2);
    const give = Math.min(need, Math.floor(left / 2));
    s4.atoms[i].lp += give; left -= 2 * give;
  }
  if (left >= 2) { s4.atoms[cs[cs.length - 1] ?? 0].lp += Math.floor(left / 2); left -= 2 * Math.floor(left / 2); }
  if (left === 1) { s4.atoms[cs[0] ?? 0].rad = 1; left = 0; }
  const cname = cs.length === 1 ? `the central ${s4.atoms[cs[0]].el}` : 'the central atoms';
  steps.push({ s: s4, title: 'Put the rest on the central atom', text: before4 ? `The remaining ${before4} electron${before4 > 1 ? 's go' : ' goes'} on ${cname}${before4 % 2 ? ': an odd number, so one stays unpaired' : ''}.` : `Nothing is left for ${cname}.`, left: 0 });
  // 5. multiple bonds / final
  const changed = JSON.stringify(s4.bonds) !== JSON.stringify(fin.bonds);
  const short = fin.atoms.map((a, i) => ({ a, i })).filter(({ a, i }) => a.el !== 'H' && electronsAround(fin, i) < 8);
  const over = fin.atoms.map((a, i) => ({ a, i })).filter(({ a, i }) => electronsAround(fin, i) > 8);
  let t5;
  if (changed) {
    const lacking = cs.filter(i => electronsAround(s4, i) < 8).map(i => `${s4.atoms[i].el} has only ${electronsAround(s4, i)}`).join(', ');
    const mult = fin.bonds.filter(b => b[2] > 1).map(([i, j, o]) => `${fin.atoms[i].el}${o === 2 ? '=' : '≡'}${fin.atoms[j].el}`);
    t5 = `${lacking ? lacking[0].toUpperCase() + lacking.slice(1) + ' electrons. ' : ''}Share lone pairs of the neighbours to make multiple bonds: ${mult.join(', ')}.`;
    if (!short.length) t5 += ' Now every atom has an octet (H: 2).';
  } else t5 = 'Nothing to change.';
  if (short.length) t5 += ` ${short.map(({ a, i }) => `${a.el} has ${electronsAround(fin, i)} electrons`).join(', ')}: an exception to the octet rule (${fin.atoms.some(a => a.rad) ? 'odd number of electrons' : 'fewer than eight'}).`;
  else if (over.length) t5 += ` ${over.map(({ a, i }) => `${a.el} has ${electronsAround(fin, i)} electrons around it`).join(', ')}: more than an octet. Possible for atoms from period 3 on, which are big enough.`;
  else if (!changed) t5 += ' Every atom already has an octet (H: 2). Done.';
  steps.push({ s: fin, title: 'Multiple bonds if a central atom lacks an octet', text: t5, left: 0, final: true });
  return steps;
}

/* ------------------------------------------------------------------ */
/* Explorer                                                            */
/* ------------------------------------------------------------------ */
const GROUPS = [
  ['Lecture examples', ['h2o', 'nh3', 'ch4', 'hcn', 'co2', 'n2', 'cn', 'scn', 'o3', 'no', 'bf3', 'pcl5']],
  ['Problem set 7', ['h2s', 'hf', 'ncl3', 'c2h6', 'c2h4', 'socl2', 'bro3', 'brf4', 'bf4', 'n3', 'hno2', 'no2', 'hco2', 'asf3', 'ch3', 'brf3', 'clo3', 'xef2', 'bro2']],
  ['More', ['cl2', 'nh4', 'ccl4', 'h2co', 'cocl2', 'so2', 'no3', 'co3', 'sf4', 'clf3', 'sf6', 'brf5', 'xef4']],
];

{
  const errs = validate();
  if (errs.length) console.error('Lewis library errors:', errs);

  const sel = $('lw-mol');
  sel.innerHTML = GROUPS.map(([g, ids]) => `<optgroup label="${g}">${ids.map(id => `<option value="${id}">${formulaHTML(BY_ID[id]).replace(/<\/?sup>/g, '')} · ${BY_ID[id].name}</option>`).join('')}</optgroup>`).join('');
  let m = BY_ID.hcn, steps = buildSteps(m), k = 0, kind = 'fc';

  function render() {
    const st = steps[k];
    const labels = st.final ? chargeLabels(st.s, kind) : null;
    $('lw-svg').innerHTML = lewisSVG(st.s, { charge: m.charge, labels, labelKind: kind, aria: `Lewis structure of ${m.name}, step ${k + 1}` });
    $('lw-steps').innerHTML = steps.map((x, i) => `<li class="${i === k ? 'now' : i < k ? 'done' : ''}">${x.title}${i <= k ? `<br><span class="small" style="font-weight:400">${x.text}</span>` : ''}</li>`).join('');
    $('lw-prev').disabled = k === 0; $('lw-next').disabled = k === steps.length - 1;
    $('lw-next').textContent = k === steps.length - 2 ? 'Last step →' : 'Next step →';
    // charge readout on the final step
    let note = '';
    if (st.final) {
      const fc = formalCharges(st.s), ox = oxidationNumbers(st.s);
      const list = arr => st.s.atoms.map((a, i) => `${a.el} ${signed(arr[i])}`).join(', ');
      note = `<strong>Formal charges</strong> (valence e⁻ − lone-pair e⁻ − ½ bonding e⁻): ${list(fc)}. They add up to the overall charge, ${signed(m.charge)}.`;
      note += ox ? `<br><strong>Oxidation numbers</strong> (bonding electrons all to the more electronegative atom): ${list(ox)}.`
        : `<br>Oxidation numbers are ambiguous here: in the lecture's table ${tie(st.s)}. (With more precise values the more electronegative one gets the electrons.)`;
      if (kind === 'ox' && !ox) note += ' Showing none.';
      if (m.note) note += `<br>${m.note}`;
    }
    $('lw-note').innerHTML = note;
    $('lw-note').style.display = note ? '' : 'none';
    renderAlternatives();
  }

  function renderAlternatives() {
    const box = $('lw-alt');
    if (m.kind === 'single' || k !== steps.length - 1) { box.innerHTML = ''; box.style.display = 'none'; return; }
    box.style.display = '';
    const best = bestStructure(m);
    const cards = m.structures.map((s, i) => {
      const fc = formalCharges(s);
      const nz = fc.map((f, j) => (f ? `${s.atoms[j].el} ${signed(f)}` : null)).filter(Boolean);
      const isBest = m.kind === 'alternatives' && i === best;
      return `<div class="res-card${isBest ? ' best' : ''}">${lewisSVG(s, { charge: m.charge, labels: chargeLabels(s, kind), labelKind: kind, scale: 0.9, maxWidth: 260 })}
        <p>${nz.length ? 'formal charges: ' + nz.join(', ') : 'no formal charges'}${isBest ? ' · <strong style="color:var(--good)">dominant</strong>' : ''}</p></div>`;
    });
    let head;
    if (m.kind === 'resonance') {
      // average bond order of each bond to the central atom
      const s0 = m.structures[0];
      const avg = s0.bonds.map(([i, j]) => m.structures.reduce((a, s) => a + s.bonds.find(b => (b[0] === i && b[1] === j) || (b[0] === j && b[1] === i))[2], 0) / m.structures.length);
      const pairs = s0.bonds.map(([i, j], n) => `${s0.atoms[i].el}–${s0.atoms[j].el} ${Number.isInteger(avg[n]) ? avg[n] : avg[n].toFixed(2).replace(/0$/, '')}`);
      head = `<p><strong>Resonance.</strong> These ${m.structures.length} structures are equally good. The real ${formulaHTML(m)} is a blend of them, not a switch between them: the electrons of the double bond are spread out (delocalised). Average bond orders: ${pairs.join(', ')}.</p>`;
    } else {
      head = `<p><strong>Which structure is best?</strong> All of these use the right number of electrons. The dominant one has formal charges closest to zero, and any negative formal charge on the more electronegative atom.</p>`;
    }
    box.innerHTML = head + `<div class="res-grid">${cards.join('')}</div>`;
  }

  sel.addEventListener('change', () => { m = BY_ID[sel.value]; steps = buildSteps(m); k = 0; render(); });
  $('lw-prev').addEventListener('click', () => { if (k > 0) { k--; render(); } });
  $('lw-next').addEventListener('click', () => { if (k < steps.length - 1) { k++; render(); } });
  $('lw-all').addEventListener('click', () => { k = steps.length - 1; render(); });
  $('lw-kind').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    kind = b.dataset.v;
    $('lw-kind').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    render();
  }));
  sel.value = 'hcn';
  render();
}

export { sub };
