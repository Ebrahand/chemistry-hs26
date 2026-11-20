// Module 4: electron configurations of Z = 1–86 with orbital boxes, and a box-filling exercise.

import { ELEMENTS, BY_SYM, byZ, ORDER, CAP, EXCEPTIONS, aufbau, groundState, configString, condensed,
  unpaired, valence, block } from '../assets/elements.js';
import { periodicTable } from '../assets/ptable.js';

const $ = id => document.getElementById(id);
const BLOCK_COL = { s: '--c1', p: '--c2', d: '--c0', f: '--c3' };

// Orbital boxes for one subshell with k electrons, filled by Hund's rule: list of 'u', 'd', 'ud', ''
export function hundBoxes(sub, k) {
  const m = CAP[sub[1]] / 2;
  return [...Array(m).keys()].map(i => (k > m + i ? 'ud' : k > i ? 'u' : ''));
}
const ARROW = { '': '', u: '↑', d: '↓', ud: '↑↓' };

function boxesHTML(occ, coreSubs = new Set()) {
  return ORDER.filter(s => occ[s]).map(s => {
    const boxes = hundBoxes(s, occ[s]).map(b => `<span class="ob">${ARROW[b]}</span>`).join('');
    return `<div class="ob-group${coreSubs.has(s) ? ' core' : ''}"><div class="ob-row">${boxes}</div><div class="ob-label">${s}</div></div>`;
  }).join('');
}

/* ------------------------------------------------------------------ */
/* Configuration explorer                                              */
/* ------------------------------------------------------------------ */
{
  let Z = 34;
  const table = periodicTable($('cfg-table'), {
    value: () => 1,
    colour: e => BLOCK_COL[block(e)],
    onSelect: e => { Z = e.Z; update(); },
    selected: 'Se',
  });
  function update() {
    const e = byZ(Z);
    table.select(e.sym);
    const occ = groundState(Z);
    const nobleZ = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54 };
    const coreSym = condensed(Z).match(/^\[(\w+)\]/)?.[1];
    const coreSubs = new Set(coreSym ? Object.keys(groundState(nobleZ[coreSym])) : []);
    $('cfg-out').innerHTML = `
      <tr><td>element</td><td><strong>${e.name}</strong>, ${e.sym}, Z = ${Z} (${Z} electrons)</td></tr>
      <tr><td>full</td><td class="num" style="white-space:normal">${configString(occ, { html: true })}</td></tr>
      <tr><td>condensed</td><td class="num">${condensed(Z, { html: true })}</td></tr>
      <tr><td>valence electrons</td><td class="num">${valence(occ)}</td></tr>
      <tr><td>unpaired electrons</td><td class="num">${unpaired(occ)}</td></tr>
      <tr><td>block</td><td>${block(e)} block</td></tr>`;
    $('cfg-boxes').innerHTML = boxesHTML(occ, coreSubs);
    let note;
    if (EXCEPTIONS[Z]) {
      const pred = aufbau(Z);
      note = `<strong>An exception.</strong> The filling order predicts [${coreSym}] ${configString(pred, { html: true, from: ORDER.indexOf(coreSym === 'Kr' ? '5s' : coreSym === 'Xe' ? '6s' : '4s') })}, ` +
        `but the measured ground state is ${condensed(Z, { html: true })}. ` +
        (Z === 24 || Z === 42 ? 'A half-filled d subshell is especially stable. ' : Z === 29 || Z === 47 || Z === 79 ? 'A filled d subshell is especially stable. ' : '') +
        `The s and d (or f and d) levels are so close in energy here that small effects decide. As the lecture says: don't memorize these, just be aware.`;
    } else {
      const last = ORDER.filter(s => occ[s]).pop();
      const v = valence(occ);
      note = `The last electron goes into ${last}, so ${e.sym} is in the ${last[1]} block. `;
      if (Z === 2) note = 'Helium has a full 1s shell. It sits above the noble gases (group 18) although it is in the s block. ';
      if (/[dp]/.test(last) && occ[last] === CAP[last[1]] && e.group === 12) note += `The 3d, 4d or 5d subshell is full, so its electrons are not counted as valence electrons: ${v} valence electrons. `;
      else if (e.group >= 13 && e.group <= 18 && e.period >= 4) note += `The filled d${e.period >= 6 ? ' and f' : ''} subshell does not count: ${v} valence electrons, like every element of group ${e.group}. `;
      note += unpaired(occ) ? `Hund's rule leaves ${unpaired(occ)} unpaired electron${unpaired(occ) > 1 ? 's' : ''}.` : 'All electrons are paired.';
    }
    $('cfg-note').innerHTML = note;
  }
  $('cfg-prev').addEventListener('click', () => { Z = Z > 1 ? Z - 1 : 86; update(); });
  $('cfg-next').addEventListener('click', () => { Z = Z < 86 ? Z + 1 : 1; update(); });
  update();
}

/* ------------------------------------------------------------------ */
/* Fill the boxes yourself                                             */
/* ------------------------------------------------------------------ */
{
  const TARGETS = ['C', 'N', 'O', 'P', 'S', 'Ti', 'Fe'];
  let sym = 'N', state = [], layout = [];
  const NEXT = { '': 'u', u: 'd', d: 'ud', ud: '' };

  for (const s of TARGETS) {
    const b = document.createElement('button');
    b.className = 'btn'; b.type = 'button'; b.textContent = s; b.dataset.v = s;
    b.addEventListener('click', () => { sym = s; reset(); });
    $('fill-pick').appendChild(b);
  }

  function reset() {
    const e = BY_SYM[sym], occ = aufbau(e.Z);
    const used = ORDER.filter(s => occ[s]);
    const subs = ORDER.slice(0, used.length + 1);       // one empty subshell more, as a trap
    layout = subs.map(s => ({ sub: s, m: CAP[s[1]] / 2 }));
    state = layout.map(g => Array(g.m).fill(''));
    $('fill-pick').querySelectorAll('button').forEach(b => b.classList.toggle('primary', b.dataset.v === sym));
    $('fill-task').innerHTML = `Draw the ground-state orbital diagram of <strong>${e.name} (Z = ${e.Z})</strong>: ${e.Z} electrons.`;
    $('fill-fb').textContent = ''; $('fill-fb').className = 'feedback';
    render();
  }
  function render() {
    $('fill-boxes').innerHTML = layout.map((g, gi) =>
      `<div class="ob-group"><div class="ob-row">${state[gi].map((b, bi) =>
        `<button type="button" class="ob" data-g="${gi}" data-b="${bi}" aria-label="${g.sub} box ${bi + 1}: ${b === '' ? 'empty' : b === 'u' ? 'spin up' : b === 'd' ? 'spin down' : 'paired'}">${ARROW[b]}</button>`).join('')}</div><div class="ob-label">${g.sub}</div></div>`).join('');
    $('fill-boxes').querySelectorAll('button.ob').forEach(btn => btn.addEventListener('click', () => {
      const gi = +btn.dataset.g, bi = +btn.dataset.b;
      state[gi][bi] = NEXT[state[gi][bi]];
      render();
      $('fill-boxes').querySelector(`button[data-g="${gi}"][data-b="${bi}"]`).focus();
    }));
  }
  const count = b => (b === 'ud' ? 2 : b ? 1 : 0);

  function check() {
    const e = BY_SYM[sym];
    const k = state.map(g => g.reduce((a, b) => a + count(b), 0));
    const total = k.reduce((a, b) => a + b, 0);
    const fb = $('fill-fb');
    const fail = msg => { fb.className = 'feedback wrong'; fb.innerHTML = msg; };
    if (total !== e.Z) return fail(`You have placed ${total} electron${total === 1 ? '' : 's'}; ${e.name} has ${e.Z}.`);
    // Aufbau: no electrons above a subshell that is not full
    for (let i = 0; i < layout.length; i++) {
      const full = k[i] === 2 * layout[i].m;
      if (!full && k.slice(i + 1).some(x => x > 0)) {
        const later = layout.findIndex((g, j) => j > i && k[j] > 0);
        return fail(`Aufbau: ${layout[i].sub} is not full yet, but there are electrons in ${layout[later].sub}, which is higher in energy. Fill from the bottom up.`);
      }
    }
    // Hund
    for (let i = 0; i < layout.length; i++) {
      const g = state[i], m = layout[i].m, ki = k[i];
      if (ki === 0 || ki === 2 * m) continue;
      const pairs = g.filter(b => b === 'ud').length;
      if (pairs > Math.max(0, ki - m)) return fail(`Hund's rule: in ${layout[i].sub}, put one electron in each box before pairing any of them.`);
      const singles = g.filter(b => b === 'u' || b === 'd');
      if (new Set(singles).size > 1) return fail(`Hund's rule: the unpaired electrons in ${layout[i].sub} should all have the same spin (parallel arrows).`);
    }
    const occ = aufbau(e.Z);
    fb.className = 'feedback right';
    fb.innerHTML = `Correct: ${condensed(e.Z, { html: true })}, with ${unpaired(occ)} unpaired electron${unpaired(occ) === 1 ? '' : 's'}. ` +
      `(Pauli is built in here: a box can only hold ↑↓, never ↑↑.)`;
  }
  function show() {
    const occ = aufbau(BY_SYM[sym].Z);
    state = layout.map(g => hundBoxes(g.sub, occ[g.sub] || 0));
    render(); check();
  }
  $('fill-check').addEventListener('click', check);
  $('fill-clear').addEventListener('click', reset);
  $('fill-show').addEventListener('click', show);
  reset();
}
