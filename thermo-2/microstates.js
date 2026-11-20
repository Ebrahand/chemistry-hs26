// Module 3: molecules moving in a box with a left and a right half. W(n) = C(N, n) microstates for n molecules on the left.

import { sci } from '../assets/format.js';

const $ = id => document.getElementById(id);
const nIn = $('ms-N'), cv = $('ms-box'), ctx = cv.getContext('2d');
const KB = 1.380649e-23;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

function binom(N, k) {
  k = Math.min(k, N - k);
  let r = 1;
  for (let i = 1; i <= k; i++) r = r * (N - k + i) / i;
  return Math.round(r) || r;
}
const bigNum = x => x < 1e6 ? x.toLocaleString('en-US').replace(/,/g, ' ') : sci(x, 3);

let P = [], running = !window.matchMedia('(prefers-reduced-motion: reduce)').matches, visible = true, last = 0, lastN = -1;
const AR = 1.6;   // box width / height, as in .sim-box.wide

function place(allLeft) {
  const N = +nIn.value;
  P = Array.from({ length: N }, () => {
    const a = Math.random() * 2 * Math.PI, v = 0.5 + Math.random() * 0.25;
    return { x: (allLeft ? 0.03 + Math.random() * 0.44 : 0.03 + Math.random() * 0.94) * AR, y: 0.05 + Math.random() * 0.9,
      vx: v * Math.cos(a), vy: v * Math.sin(a) };
  });
}

function step(dt) {
  for (const p of P) {
    const turn = (Math.random() - 0.5) * 2.5 * dt;   // a little randomness so they mix like real collisions
    const c = Math.cos(turn), s = Math.sin(turn);
    [p.vx, p.vy] = [p.vx * c - p.vy * s, p.vx * s + p.vy * c];
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < 0.02) { p.x = 0.02; p.vx = Math.abs(p.vx); }
    if (p.x > AR - 0.02) { p.x = AR - 0.02; p.vx = -Math.abs(p.vx); }
    if (p.y < 0.02) { p.y = 0.02; p.vy = Math.abs(p.vy); }
    if (p.y > 0.98) { p.y = 0.98; p.vy = -Math.abs(p.vy); }
  }
}

function draw() {
  const w = cv.clientWidth, h = cv.clientHeight, dpr = window.devicePixelRatio || 1;
  if (!w) return;
  if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = css('--plot-axis'); ctx.setLineDash([5, 5]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = css('--text-muted'); ctx.font = `12px ${getComputedStyle(document.body).fontFamily}`;
  ctx.textAlign = 'center'; ctx.fillText('left half', w / 4, h - 8); ctx.fillText('right half', 3 * w / 4, h - 8);
  const r = Math.max(3, Math.min(8, w / (6 * Math.sqrt(P.length + 4))));
  for (const p of P) {
    ctx.beginPath(); ctx.arc(p.x / AR * w, p.y * h, r, 0, 2 * Math.PI);
    ctx.fillStyle = p.x < AR / 2 ? css('--c0') : css('--c1'); ctx.fill();
  }
}

function bars(n) {
  const N = P.length, Wn = [];
  for (let k = 0; k <= N; k++) Wn.push(binom(N, k));
  const max = Math.max(...Wn);
  const W = 480, H = 250, l = 30, r = 10, top = 34, bot = 40;
  const bw = (W - l - r) / (N + 1);
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<text x="${l}" y="16" font-size="12" fill="var(--text-muted)">number of microstates W (bar height relative to the tallest)</text>`;
  Wn.forEach((v, k) => {
    const hh = (v / max) * (H - top - bot), x = l + k * bw, y = H - bot - hh;
    s += `<rect x="${x + bw * 0.12}" y="${y}" width="${Math.max(1, bw * 0.76)}" height="${Math.max(hh, 0.8)}" fill="var(${k === n ? '--c0' : '--cB'})"/>`;
    if (N <= 12) s += `<text x="${x + bw / 2}" y="${y - 5}" font-size="12" text-anchor="middle" fill="var(--text)"${k === n ? ' font-weight="700"' : ''}>${v}</text>`;
    const lab = N <= 20 || k === 0 || k === N || k === Math.round(N / 2) || (N <= 40 && k % 5 === 0) || k % 10 === 0;
    if (lab) s += `<text x="${x + bw / 2}" y="${H - bot + 16}" font-size="12" text-anchor="middle" fill="var(--text-muted)">${k}</text>`;
  });
  s += `<line x1="${l}" y1="${H - bot}" x2="${W - r}" y2="${H - bot}" stroke="var(--plot-axis)"/>`;
  s += `<text x="${(W + l) / 2}" y="${H - 6}" font-size="12" text-anchor="middle" fill="var(--text-muted)">molecules in the left half</text>`;
  s += '</svg>';
  $('ms-bars').innerHTML = s;
}

function readout() {
  const N = P.length, n = P.filter(p => p.x < AR / 2).length;
  if (n === lastN && N === bars.N) return;
  lastN = n; bars.N = N;
  bars(n);
  const W = binom(N, n), Wmax = binom(N, Math.floor(N / 2)), total = Math.pow(2, N);
  const rows = [
    ['Now on the left', `${n} of ${N}`],
    ['W for this split', bigNum(W)],
    ['S = k<sub>B</sub> ln W', W === 1 ? '0' : `${sci(KB * Math.log(W), 3)} J/K`],
    ['W for an even split', bigNum(Wmax)],
    ['Chance: all on the left', `1 in ${bigNum(total)}`],
  ];
  $('ms-readout').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td class="num">${b}</td></tr>`).join('');
  $('ms-note').innerHTML = `All ${N} molecules can be arranged over the two halves in 2<sup>${N}</sup> = ${bigNum(total)} ways. ` +
    `Only one of them has all on the left, while ${bigNum(Wmax)} of them (${(Wmax / total * 100).toPrecision(2)} %) give an even split. ` +
    (n === N ? 'Right now they are all on the left: the lowest-entropy arrangement. Let them move.'
      : Math.abs(n - N / 2) <= Math.max(1, Math.sqrt(N) / 2) ? 'Right now the split is close to even: the state with the most microstates, so the highest entropy.'
      : 'They keep moving at random, so the split drifts towards the middle, where most of the microstates are.');
}

function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
  if (visible) {
    if (running) step(dt);
    draw(); readout();
  }
  requestAnimationFrame(loop);
}

nIn.addEventListener('input', () => { $('ms-N-out').textContent = nIn.value; place(true); lastN = -1; });
$('ms-left').addEventListener('click', () => { place(true); lastN = -1; });
$('ms-pause').addEventListener('click', () => { running = !running; $('ms-pause').textContent = running ? 'Pause' : 'Run'; });
new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(cv);
$('ms-N-out').textContent = nIn.value;
$('ms-pause').textContent = running ? 'Pause' : 'Run';
place(true);
requestAnimationFrame(loop);
