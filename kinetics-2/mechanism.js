// Module 4: two-step mechanism A → I → P (exact solution) and a "read the mechanism" exercise.

import { Plot } from '../assets/plot.js';
import { sig } from '../assets/format.js';

const $ = id => document.getElementById(id);

// ---------- A → I → P ----------
const k1In = $('me-k1'), k2In = $('me-k2');
const plot = new Plot($('me-plot'));

function conc(k1, k2, t) {
  const A = Math.exp(-k1 * t);
  const I = Math.abs(k2 - k1) < 1e-9 ? k1 * t * Math.exp(-k1 * t) : k1 / (k2 - k1) * (Math.exp(-k1 * t) - Math.exp(-k2 * t));
  return [A, I, 1 - A - I];
}

function render() {
  const k1 = Math.pow(10, +k1In.value), k2 = Math.pow(10, +k2In.value);
  $('me-k1-out').textContent = `${sig(k1, 2)} s⁻¹`;
  $('me-k2-out').textContent = `${sig(k2, 2)} s⁻¹`;
  const tmax = Math.min(400, 6 / Math.min(k1, k2));
  const n = 240, ts = Array.from({ length: n + 1 }, (_, i) => i / n * tmax);
  const c = ts.map(t => conc(k1, k2, t));
  plot.draw({
    x: { min: 0, max: tmax, label: 'time t (s)' },
    y: { min: 0, max: 1.05, label: 'concentration (M)' },
    series: [
      { points: ts.map(t => [t, 1 - Math.exp(-k1 * t)]), color: '--text-muted', width: 1.5, dash: [5, 5] },
      { points: ts.map((t, i) => [t, c[i][0]]), color: '--c0' },
      { points: ts.map((t, i) => [t, c[i][1]]), color: '--c3' },
      { points: ts.map((t, i) => [t, c[i][2]]), color: '--c2' },
    ],
  });
  const Imax = Math.max(...c.map(x => x[1]));
  const tHalf = ts[c.findIndex(x => x[2] >= 0.5)];
  const r = k2 / k1;
  $('me-readout').innerHTML = [
    ['k₂ / k₁', sig(r, 2)],
    ['Largest [I]', `${sig(Imax, 2)} M`],
    ['Half of P formed after', tHalf !== undefined ? `${sig(tHalf, 3)} s` : `> ${sig(tmax, 3)} s`],
    ['Rate-determining step', r > 5 ? 'step 1' : r < 0.2 ? 'step 2' : 'neither clearly'],
  ].map(([a, b]) => `<tr><td>${a}</td><td class="num">${b}</td></tr>`).join('');
  $('me-note').innerHTML = r > 5
    ? `Step 1 is the bottleneck. I is used up almost as soon as it forms, so [I] stays small, and P appears just as if step 1 were the whole reaction (the dashed line): rate = k₁[A]. Make step 2 even faster: nothing changes.`
    : r < 0.2
      ? `Now step 2 is the bottleneck. A turns into I quickly, the intermediate piles up, and P appears only at the pace of step 2. Making step 1 faster hardly helps.`
      : `The two steps are about equally fast. Neither alone sets the pace: P appears more slowly than either step would allow on its own, and the full rate law needs both rate constants.`;
}
k1In.addEventListener('input', render);
k2In.addEventListener('input', render);
$('me-presets').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  k1In.value = b.dataset.k1; k2In.value = b.dataset.k2; render();
});
render();

// ---------- read a mechanism ----------
// Each question: [text, options]; option: [label, correct, feedback]
const MECHS = [
  {
    name: 'NO₂ + CO, below 225 °C (Brown 14.6)',
    steps: ['NO₂ + NO₂ → NO₃ + NO (slow)', 'NO₃ + CO → NO₂ + CO₂ (fast)'],
    qs: [
      ['Overall reaction?', [
        ['NO₂ + CO → NO + CO₂', true, 'Add the steps and cancel what appears on both sides: one NO₂ and the NO₃.'],
        ['2 NO₂ + CO → NO₃ + NO + CO₂', false, 'NO₃ is formed and then used up, and one NO₂ is given back: cancel them.'],
        ['NO₃ + CO → NO₂ + CO₂', false, 'That is only step 2.'],
      ]],
      ['Intermediate?', [
        ['NO₃', true, 'Formed in step 1, used up in step 2.'],
        ['CO', false, 'CO is a reactant of the overall reaction.'],
        ['NO', false, 'NO is a product of the overall reaction.'],
      ]],
      ['Predicted rate law?', [
        ['rate = k₁[NO₂]²', true, 'The slow first step is bimolecular in NO₂. CO reacts after the bottleneck, so it is not in the rate law, exactly as measured.'],
        ['rate = k[NO₂][CO]', false, 'That would be the rate law if the overall reaction were one elementary step. It does not match the experiment.'],
        ['rate = k₂[NO₃][CO]', false, 'Step 2 is fast, and NO₃ is an intermediate: it should not appear in an overall rate law.'],
      ]],
    ],
  },
  {
    name: 'Ozone decomposition (lecture)',
    steps: ['O₃ → O₂ + O (slow)', 'O₃ + O → 2 O₂ (fast)'],
    qs: [
      ['Molecularity of the two steps?', [
        ['unimolecular, then bimolecular', true, 'One O₃ falls apart; then O₃ and O collide.'],
        ['bimolecular, then bimolecular', false, 'Step 1 has a single reactant molecule.'],
        ['both unimolecular', false, 'Step 2 needs O₃ and O to collide.'],
      ]],
      ['Overall reaction?', [
        ['2 O₃ → 3 O₂', true, 'O cancels: formed in step 1, used in step 2.'],
        ['O₃ → O₂ + O', false, 'That is step 1 alone.'],
        ['2 O₃ + O → 3 O₂ + O', false, 'Right sum, but cancel the O that appears on both sides.'],
      ]],
      ['If step 1 is the slow step, the rate law is', [
        ['rate = k₁[O₃]', true, 'The rate law of the unimolecular slow step.'],
        ['rate = k[O₃]²', false, 'The coefficient 2 in the overall equation does not make it second order: look at the slow step.'],
        ['rate = k₂[O₃][O]', false, 'That is the fast step, and O is an intermediate.'],
      ]],
    ],
  },
  {
    name: 'Generic two-step mechanism (lecture)',
    steps: ['2 A → I + C (slow)', 'I + B → A + D (fast)'],
    qs: [
      ['Overall reaction?', [
        ['A + B → C + D', true, 'Two A go in, one comes back; I cancels.'],
        ['2 A + B → C + D', false, 'Step 2 gives one A back: one A cancels.'],
        ['2 A + B → A + C + D + I', false, 'Cancel species that appear on both sides.'],
      ]],
      ['Intermediate?', [
        ['I', true, 'Formed in step 1, consumed in step 2.'],
        ['A', false, 'A is consumed overall (one net A): it is a reactant.'],
        ['C', false, 'C is a product.'],
      ]],
      ['Predicted rate law?', [
        ['rate = k₁[A]²', true, 'Step 1 is slow and bimolecular in A. B reacts only after the bottleneck.'],
        ['rate = k[A][B]', false, 'That follows the overall equation, but the overall equation is not elementary here.'],
        ['rate = k₁[A]² [B]', false, 'B is not in the slow step.'],
      ]],
    ],
  },
  {
    name: 'Chlorine and ozone (stratosphere)',
    steps: ['Cl + O₃ → ClO + O₂ (slow)', 'ClO + O → Cl + O₂ (fast)'],
    qs: [
      ['Overall reaction?', [
        ['O₃ + O → 2 O₂', true, 'Cl and ClO both cancel.'],
        ['Cl + O₃ + O → Cl + 2 O₂', false, 'Cl appears on both sides: cancel it.'],
        ['Cl + O₃ → ClO + O₂', false, 'That is only step 1.'],
      ]],
      ['What is Cl in this mechanism?', [
        ['a catalyst', true, 'Used up in step 1 and given back in step 2: it is not consumed. One Cl atom can destroy many ozone molecules.'],
        ['an intermediate', false, 'An intermediate is formed first and used up later. Cl is there at the start.'],
        ['a product', false, 'Cl is not in the overall equation.'],
      ]],
      ['And ClO?', [
        ['an intermediate', true, 'Formed in step 1, used up in step 2.'],
        ['a catalyst', false, 'A catalyst is there at the start. ClO is formed first.'],
        ['a reactant', false, 'ClO is not in the overall equation.'],
      ]],
      ['If step 1 is slow, the rate law is', [
        ['rate = k₁[Cl][O₃]', true, 'A catalyst can appear in the rate law: more Cl, faster ozone loss.'],
        ['rate = k[O₃][O]', false, 'That follows the overall equation, which is not elementary.'],
        ['rate = k₁[O₃]', false, 'Step 1 is bimolecular: Cl must collide with O₃.'],
      ]],
    ],
  },
  {
    name: 'H₂ + ICl',
    steps: ['H₂ + ICl → HI + HCl (slow)', 'HI + ICl → I₂ + HCl (fast)'],
    qs: [
      ['Overall reaction?', [
        ['H₂ + 2 ICl → I₂ + 2 HCl', true, 'HI cancels; ICl and HCl appear once in each step.'],
        ['H₂ + ICl → I₂ + HCl', false, 'Count: ICl is used in both steps, and HCl is formed in both.'],
        ['H₂ + 2 ICl → HI + I₂ + 2 HCl', false, 'HI is formed and then used up: cancel it.'],
      ]],
      ['Intermediate?', [
        ['HI', true, 'Formed in step 1, used up in step 2.'],
        ['HCl', false, 'HCl is formed in both steps and never used up: a product.'],
        ['ICl', false, 'ICl is a reactant.'],
      ]],
      ['Predicted rate law?', [
        ['rate = k₁[H₂][ICl]', true, 'The rate law of the slow bimolecular step: first order in each, although ICl has the coefficient 2 overall.'],
        ['rate = k[H₂][ICl]²', false, 'Exponents from the overall equation only work for an elementary reaction.'],
        ['rate = k₂[HI][ICl]', false, 'That is the fast step, and HI is an intermediate.'],
      ]],
    ],
  },
];

const sel = $('mx-sel');
sel.innerHTML = MECHS.map((m, i) => `<option value="${i}">${m.name}</option>`).join('');
function renderMx() {
  const m = MECHS[+sel.value];
  $('mx-steps').innerHTML = `<div class="table-wrap" style="margin:0"><table><tbody>` +
    m.steps.map((s, i) => `<tr><td>Step ${i + 1}</td><td style="font-size:17px">${s}</td></tr>`).join('') + '</tbody></table></div>';
  $('mx-qs').innerHTML = m.qs.map(([q, opts], qi) => `<div class="card" style="margin-top:12px"><p class="q" style="margin:0 0 8px"><strong>${qi + 1}.</strong> ${q}</p>` +
    `<div class="opts" data-q="${qi}">` + opts.map(([lab], oi) => `<button type="button" data-o="${oi}">${lab}</button>`).join('') +
    `</div><p class="feedback" aria-live="polite"></p></div>`).join('');
}
$('mx-qs').addEventListener('click', e => {
  const b = e.target.closest('button[data-o]'); if (!b) return;
  const box = b.parentElement, qi = +box.dataset.q, [, ok, fb] = MECHS[+sel.value].qs[qi][1][+b.dataset.o];
  box.querySelectorAll('button').forEach(x => x.classList.remove('right', 'wrong'));
  b.classList.add(ok ? 'right' : 'wrong');
  const p = box.nextElementSibling;
  p.className = 'feedback ' + (ok ? 'right' : 'wrong');
  p.textContent = (ok ? 'Correct. ' : 'Not quite. ') + fb;
});
sel.addEventListener('change', renderMx);
renderMx();
