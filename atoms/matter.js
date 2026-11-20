// Module 1: classify particle pictures; dimensional analysis with conversion factors; significant figures.

const $ = id => document.getElementById(id);
const SVGNS = 'http://www.w3.org/2000/svg';
const SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const supN = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(c => SUPD[c]).join('');

/* ------------------------------------------------------------------ */
/* Classification of matter                                            */
/* ------------------------------------------------------------------ */

const KINDS = [
  { key: 'el', label: 'a pure element' },
  { key: 'cp', label: 'a pure compound' },
  { key: 'mee', label: 'a mixture of two elements' },
  { key: 'mec', label: 'a mixture of an element and a compound' },
  { key: 'mcc', label: 'a mixture of two compounds' },
];
const EXPLAIN = {
  el: 'Every particle is the same and contains only one kind of atom. Single atoms (like He) and molecules made of one element (like O₂ or N₂) are both pure elements.',
  cp: 'Every particle is the same molecule, and it contains two different kinds of atom: one compound.',
  mee: 'Two different kinds of particle, and each contains only one kind of atom: two elements, mixed.',
  mec: 'Two different kinds of particle: one contains only one kind of atom (an element), the other two kinds bonded together (a compound).',
  mcc: 'Two different kinds of particle, and each contains more than one kind of atom: two compounds, mixed.',
};
const COLS = ['--atom-O', '--atom-N', '--atom-C', '--atom-Cl', '--atom-H'];
const R = 8.5;

// Shapes: list of [dx, dy, colourIndex]; colour indices refer to the two or three elements in play.
const SHAPE = {
  A: [[0, 0, 0]],
  A2: [[-0.85 * R, 0, 0], [0.85 * R, 0, 0]],
  AB: [[-0.85 * R, 0, 0], [0.85 * R, 0, 1]],
  AB2: [[0, 0, 0], [-1.45 * R, 0.75 * R, 1], [1.45 * R, 0.75 * R, 1]],
  AB3: [[0, 0, 0], [0, -1.6 * R, 1], [1.4 * R, 0.8 * R, 1], [-1.4 * R, 0.8 * R, 1]],
};

const rand = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function makePicture() {
  const kind = KINDS[rand(KINDS.length)].key;
  const els = shuffle([...COLS.keys()]).slice(0, 3);
  const mol = (shape, a, b) => ({ shape, map: [els[a], els[b ?? a]] });
  const pick = arr => arr[rand(arr.length)];
  let groups;
  if (kind === 'el') groups = [[pick([mol('A', 0), mol('A2', 0)]), 12]];
  else if (kind === 'cp') groups = [[pick([mol('AB', 0, 1), mol('AB2', 0, 1), mol('AB3', 0, 1)]), 9]];
  else if (kind === 'mee') groups = [[pick([mol('A', 0), mol('A2', 0)]), 6], [mol('A2', 1), 5]];
  else if (kind === 'mec') groups = [[pick([mol('A', 2), mol('A2', 2)]), 5], [pick([mol('AB', 0, 1), mol('AB2', 0, 1)]), 5]];
  else groups = [[mol('AB', 0, 1), 5], [mol('AB2', 2, 1), 5]];
  // If an element is drawn in white-ish H colour as a single atom, fine; positions:
  const placed = [];
  const items = [];
  for (const [m, count] of groups) for (let i = 0; i < count; i++) items.push(m);
  for (const m of shuffle(items)) {
    for (let tries = 0; tries < 400; tries++) {
      const x = 22 + Math.random() * 156, y = 22 + Math.random() * 156;
      if (placed.every(p => (p.x - x) ** 2 + (p.y - y) ** 2 > (3.9 * R) ** 2)) { placed.push({ x, y, m, a: Math.random() * Math.PI * 2 }); break; }
    }
  }
  return { kind, placed };
}

function drawPicture(p) {
  let s = `<svg viewBox="0 0 200 200" xmlns="${SVGNS}">`;
  for (const { x, y, m, a } of p.placed) {
    const c = Math.cos(a), sn = Math.sin(a);
    for (const [dx, dy, ci] of SHAPE[m.shape]) {
      const big = m.shape !== 'A' && ci === 0 && SHAPE[m.shape].length > 2;
      s += `<circle cx="${(x + dx * c - dy * sn).toFixed(1)}" cy="${(y + dx * sn + dy * c).toFixed(1)}" r="${big ? R * 1.15 : R}" fill="var(${COLS[m.map[ci]]})" stroke="var(--text)" stroke-width="0.8"/>`;
    }
  }
  return s + '</svg>';
}

let pic, answered = false, right = 0, total = 0;
const btns = $('cls-btns');
btns.innerHTML = KINDS.map(k => `<button type="button" class="btn" data-k="${k.key}">${k.label}</button>`).join('');
function newPicture() {
  pic = makePicture();
  answered = false;
  $('cls-pic').innerHTML = drawPicture(pic);
  btns.querySelectorAll('button').forEach(b => b.classList.remove('right', 'wrong'));
  $('cls-note').textContent = 'Pick an answer.';
}
btns.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const ok = b.dataset.k === pic.kind;
  btns.querySelectorAll('button').forEach(x => x.classList.remove('right', 'wrong'));
  b.classList.add(ok ? 'right' : 'wrong');
  if (!answered) { total++; if (ok) right++; answered = true; }
  $('cls-note').innerHTML = (ok ? '<strong>Correct.</strong> ' : '<strong>Not quite.</strong> ') + (ok ? EXPLAIN[pic.kind] : 'Count the different kinds of particle first, then look inside each: one kind of atom or more?');
  $('cls-score').textContent = `${right} of ${total} right at the first try`;
});
$('cls-next').addEventListener('click', newPicture);
newPicture();

/* ------------------------------------------------------------------ */
/* Dimensional analysis                                                */
/* ------------------------------------------------------------------ */

// A factor relates a quantities: [value, unit] = [value, unit].
const F = {
  kcal: [[1, 'kcal'], [1000, 'cal']], cal: [[1, 'cal'], [4.184, 'J']], kJ: [[1, 'kJ'], [1000, 'J']],
  km: [[1, 'km'], [1000, 'm']], h: [[1, 'h'], [60, 'min']], min: [[1, 'min'], [60, 's']], cm: [[1, 'm'], [100, 'cm']],
  L: [[1, 'L'], [1000, 'mL']], rho: [[1.00, 'g'], [1, 'mL']], kg: [[1, 'kg'], [1000, 'g']], cc: [[1, 'mL'], [1, 'cm³']],
  day: [[1, 'day'], [24, 'h']],
};
const TASKS = [
  { text: 'A chocolate bar contains 230 kcal. How many kJ is that?', v: 230, num: ['kcal'], den: [], target: { kJ: 1 }, sf: 3, f: ['kcal', 'cal', 'kJ', 'h'] },
  { text: 'Swiss motorways: 120 km/h. How many m/s?', v: 120, num: ['km'], den: ['h'], target: { m: 1, s: -1 }, sf: 3, f: ['km', 'h', 'min', 'cm'] },
  { text: 'A 1.5 L bottle of water (density 1.00 g/mL). Mass in kg?', v: 1.5, num: ['L'], den: [], target: { kg: 1 }, sf: 2, f: ['L', 'rho', 'kg', 'cc'] },
  { text: 'How many seconds are in one day?', v: 1, num: ['day'], den: [], target: { s: 1 }, sf: null, f: ['day', 'h', 'min', 'km'] },
  { text: 'Gold has a density of 19.3 g/cm³. What is it in kg/L?', v: 19.3, num: ['g'], den: ['cm³'], target: { kg: 1, L: -1 }, sf: 3, f: ['kg', 'cc', 'L', 'rho'] },
];
const fmtV = v => (Number.isInteger(v) ? String(v) : String(v));
const taskSel = $('da-task');
taskSel.innerHTML = TASKS.map((t, i) => `<option value="${i}">${t.text}</option>`).join('');
let chain = [];   // [{ key, flipped }]

function renderDA() {
  const t = TASKS[+taskSel.value];
  // occurrences of units, to strike through the ones that cancel
  const occ = [];
  const add = (unit, sign, where) => {
    const o = { unit, sign, cx: false, where };
    const prev = occ.find(p => !p.cx && p.unit === unit && p.sign === -sign);
    if (prev) { prev.cx = true; o.cx = true; }
    occ.push(o);
    return o;
  };
  const startNum = t.num.map(u => add(u, 1)), startDen = t.den.map(u => add(u, -1));
  const parts = chain.map(c => {
    const [a, b] = F[c.key];
    const [top, bot] = c.flipped ? [b, a] : [a, b];
    return { top, bot, oTop: add(top[1], 1), oBot: add(bot[1], -1) };
  });
  const u = o => `<span class="u${o.cx ? ' cx' : ''}">${o.unit}</span>`;
  const startHTML = `<span class="frac"><span>${fmtV(t.v)} ${startNum.map(u).join(' ')}</span><span>${startDen.length ? startDen.map(u).join(' ') : '&nbsp;'}</span></span>`;
  let html = startHTML;
  parts.forEach((p, i) => {
    html += `<span class="times">×</span><span class="frac"><span>${fmtV(p.top[0])} ${u(p.oTop)}</span><span>${fmtV(p.bot[0])} ${u(p.oBot)}</span><button type="button" data-flip="${i}">flip</button></span>`;
  });
  // resulting units
  const net = {};
  for (const o of occ) net[o.unit] = (net[o.unit] || 0) + o.sign;
  for (const k of Object.keys(net)) if (!net[k]) delete net[k];
  const value = parts.reduce((v, p) => v * p.top[0] / p.bot[0], t.v);
  const unitStr = Object.entries(net).sort((a, b) => b[1] - a[1]).map(([k, e]) => e === 1 ? k : k + supN(e)).join(' ') || '(no unit)';
  const shown = t.sf ? Number(value.toPrecision(t.sf)).toLocaleString('en-US', { maximumSignificantDigits: t.sf }) : value.toLocaleString('en-US');
  html += `<span class="times">=</span><strong>${shown.replace(/,/g, ' ')} ${unitStr}</strong>`;
  $('da-chain').innerHTML = html;

  const done = Object.keys(t.target).length === Object.keys(net).length && Object.entries(t.target).every(([k, e]) => net[k] === e);
  const stray = occ.some(o => !o.cx && !(o.unit in t.target));
  let msg;
  if (!chain.length) msg = `You have ${fmtV(t.v)} ${t.num.join(' ')}${t.den.length ? '/' + t.den.join(' ') : ''}. Which unit has to go first?`;
  else if (done) msg = `<strong>Done.</strong> Only ${unitStr} is left, so the number is right too. ${t.sf ? `Rounded to ${t.sf} significant figures, like the value you started with (the conversion factors here are exact${t.f.includes('rho') ? ', and the density has 3' : ''}).` : 'Every number here is exact, so the answer is exact.'}`;
  else if (Object.values(net).some(e => Math.abs(e) > 1)) msg = `Now you have ${unitStr}: a unit appears squared, so a factor is upside down. Flip it.`;
  else if (stray && parts.some(p => !p.oTop.cx && !p.oBot.cx)) msg = 'A factor added units without cancelling any. Is it upside down? Flip it, or remove it.';
  else msg = `Now you have ${unitStr}. Keep going until only ${Object.entries(t.target).map(([k, e]) => e === 1 ? k : k + '⁻¹').join(' ')} is left.`;
  $('da-note').innerHTML = msg;
}
$('da-factors').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  chain.push({ key: b.dataset.k, flipped: false });
  renderDA();
});
$('da-chain').addEventListener('click', e => {
  const b = e.target.closest('button[data-flip]'); if (!b) return;
  const c = chain[+b.dataset.flip]; c.flipped = !c.flipped; renderDA();
});
function setTask() {
  const t = TASKS[+taskSel.value];
  chain = [];
  $('da-factors').innerHTML = t.f.map(k => { const [a, b] = F[k]; return `<button class="btn" type="button" data-k="${k}">${a[0]} ${a[1]} = ${b[0]} ${b[1]}</button>`; }).join('');
  renderDA();
}
taskSel.addEventListener('change', setTask);
$('da-undo').addEventListener('click', () => { chain.pop(); renderDA(); });
$('da-clear').addEventListener('click', () => { chain = []; renderDA(); });
setTask();

/* ------------------------------------------------------------------ */
/* Significant figures                                                 */
/* ------------------------------------------------------------------ */


// Analyse a typed number. Returns null if it cannot be read.
export function analyse(raw) {
  const s = String(raw).trim().replace(/[−–]/g, '-').replace(/\s/g, '').replace(',', '.');
  const m = s.match(/^([+-]?)(\d*\.?\d*)(?:(?:[eE]|[×xX*]10\^?)([+-]?\d+))?$/);
  if (!m || !/\d/.test(m[2])) return null;
  const [, sign, mant, expS] = m;
  const exp = expS ? +expS : 0;
  const chars = mant.split('');
  const hasPoint = mant.includes('.');
  const digitIdx = chars.map((c, i) => (c === '.' ? -1 : i)).filter(i => i >= 0);
  const firstNZ = digitIdx.find(i => chars[i] !== '0');
  const marks = chars.map(() => 'not');
  let ambiguous = 0;
  if (firstNZ === undefined) return { sign, mant, exp, marks, sf: 0, zero: true, hasPoint };
  const lastNZ = [...digitIdx].reverse().find(i => chars[i] !== '0');
  for (const i of digitIdx) {
    if (i < firstNZ) continue;
    if (i <= lastNZ || hasPoint) marks[i] = 'sig';
    else { marks[i] = 'amb'; ambiguous++; }
  }
  const sf = marks.filter(x => x === 'sig').length;
  const decimals = (hasPoint ? mant.length - mant.indexOf('.') - 1 : -ambiguous) - exp;
  return { sign, mant, exp, marks, sf, ambiguous, hasPoint, decimals, value: Number(sign + mant + 'e' + exp) };
}

function sciForm(a) {
  const digits = a.mant.replace('.', '').replace(/^0+/, '');
  const sig = digits.slice(0, a.sf);
  const e = Math.floor(Math.log10(Math.abs(a.value)));
  return `${a.sign === '-' ? '−' : ''}${sig[0]}${sig.length > 1 ? '.' + sig.slice(1) : ''} × 10${supN(e)}`;
}

function renderSF() {
  const a = analyse($('sf-in').value);
  if (!a) { $('sf-digits').textContent = '—'; $('sf-note').textContent = 'Type a number such as 0.0060, 6000, 6.0e3 or 6.0×10^3.'; return; }
  let html = a.sign === '-' ? '−' : '';
  a.mant.split('').forEach((c, i) => { html += c === '.' ? '.' : `<span class="${a.marks[i]}">${c}</span>`; });
  if (a.exp) html += ` <span class="not">× 10${supN(a.exp)}</span>`;
  $('sf-digits').innerHTML = html;
  if (a.zero) { $('sf-note').textContent = 'A measured value of zero: the number of decimal places shows how precisely it was measured.'; return; }
  let note = `<strong>${a.sf} significant figure${a.sf === 1 ? '' : 's'}</strong>, highlighted. In scientific notation: ${sciForm(a)}.`;
  const lead = a.mant.replace('.', '').match(/^0+/);
  if (lead && a.value) note += ' The leading zeros only place the decimal point.';
  if (a.ambiguous) note += ` <span style="color:var(--c0)">The trailing zero${a.ambiguous > 1 ? 's are' : ' is'} ambiguous</span>: without a decimal point we cannot tell whether ${a.ambiguous > 1 ? 'they were' : 'it was'} measured, so ${a.ambiguous > 1 ? 'they are' : 'it is'} not counted. Write it in scientific notation to say what you mean.`;
  else if (a.hasPoint && /0$/.test(a.mant)) note += ' Zeros at the end after a decimal point are significant: someone measured them.';
  $('sf-note').innerHTML = note;
}
$('sf-ex').innerHTML = ['0.004050', '60023', '6000', '6.0e3', '27.0', '100.'].map(x => `<button class="btn" type="button">${x}</button>`).join('');
$('sf-ex').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $('sf-in').value = b.textContent; renderSF(); });
$('sf-in').addEventListener('input', renderSF);
renderSF();

function roundTo(x, d) {
  if (d < 0) { const g = Math.pow(10, -d); return Math.round(x / g) * g; }
  const f = Math.pow(10, d);
  return Math.round(x * f) / f;
}
function renderCalc() {
  const a = analyse($('calc-a').value), b = analyse($('calc-b').value), op = $('calc-op').value;
  if (!a || !b || a.zero || b.zero) { $('calc-note').textContent = 'Type two non-zero numbers.'; return; }
  const sym = { '*': '×', '/': '÷', '+': '+', '-': '−' }[op];
  const raw = op === '*' ? a.value * b.value : op === '/' ? a.value / b.value : op === '+' ? a.value + b.value : a.value - b.value;
  const rawStr = String(Number(raw.toPrecision(12))).replace('-', '−');
  let shown, why;
  if (op === '*' || op === '/') {
    const sf = Math.min(a.sf, b.sf);
    shown = Number(raw.toPrecision(sf));
    const str = Math.abs(shown) >= 1e5 || (Math.abs(shown) < 1e-3 && shown !== 0) ? raw.toExponential(sf - 1).replace('e', ' × 10^') : raw.toPrecision(sf);
    shown = str.replace('-', '−');
    why = `The factors have ${a.sf} and ${b.sf} significant figures, so the answer gets ${sf}.`;
  } else {
    const d = Math.min(a.decimals, b.decimals);
    const r = roundTo(raw, d);
    shown = (d > 0 ? r.toFixed(d) : String(r)).replace('-', '−');
    const place = d > 0 ? `${d} decimal place${d > 1 ? 's' : ''}` : d === 0 ? 'no decimal places' : `the nearest ${Math.pow(10, -d)}`;
    why = `For + and − count decimal places, not significant figures: the least precise number is known to ${place}, so the answer is rounded to ${place}.`;
  }
  $('calc-note').innerHTML = `Calculator: ${$('calc-a').value} ${sym} ${$('calc-b').value} = ${rawStr}. Report <strong>${shown}</strong>. ${why}`;
}
['calc-a', 'calc-b', 'calc-op'].forEach(id => $(id).addEventListener('input', renderCalc));
renderCalc();
