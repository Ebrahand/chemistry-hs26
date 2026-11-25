// Module 1: A ⇌ B with molecules that turn over at random (probability k·dt per step). Amounts and rates against time.

import { Plot } from '../assets/plot.js';
import { sig } from '../assets/format.js';

const $ = id => document.getElementById(id);
const cv = $('dy-box'), ctx = cv.getContext('2d');
const kfIn = $('dy-kf'), krIn = $('dy-kr'), catIn = $('dy-cat');
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const plot = new Plot($('dy-plot'));

const AR = 1.6, N0 = 200, WINDOW = 60, SAMPLE = 0.25, RATE_WIN = 3;   // s
const CAT = 5;
let M = [], t = 0, hist = [], events = [], view = 'n', nextSample = 0;
let running = !window.matchMedia('(prefers-reduced-motion: reduce)').matches, visible = true, last = 0;

const mol = isB => ({ B: isB, x: 0.02 + Math.random() * (AR - 0.04), y: 0.02 + Math.random() * 0.96,
  a: Math.random() * 2 * Math.PI, flash: 0 });
function start(isB) { M = Array.from({ length: N0 }, () => mol(isB)); t = 0; hist = []; events = []; nextSample = 0; sample(); }
const counts = () => { const nB = M.filter(m => m.B).length; return [M.length - nB, nB]; };
const factor = () => (catIn.checked ? CAT : 1);

function rates() {
  const recent = events.filter(e => e.t > t - RATE_WIN), span = Math.max(1, Math.min(RATE_WIN, t));
  return [recent.filter(e => e.f).length / span, recent.filter(e => !e.f).length / span];
}
function sample() {
  const [nA, nB] = counts(), [rf, rr] = rates();
  hist.push({ t, nA, nB, rf, rr });
  while (hist.length && hist[0].t < t - WINDOW) hist.shift();
}

function step(dt) {
  const kf = +kfIn.value * factor(), kr = +krIn.value * factor();
  for (const m of M) {
    m.a += (Math.random() - 0.5) * 3 * dt;
    m.x += Math.cos(m.a) * 0.12 * dt; m.y += Math.sin(m.a) * 0.12 * dt;
    if (m.x < 0.015 || m.x > AR - 0.015) { m.a = Math.PI - m.a; m.x = Math.min(AR - 0.015, Math.max(0.015, m.x)); }
    if (m.y < 0.015 || m.y > 0.985) { m.a = -m.a; m.y = Math.min(0.985, Math.max(0.015, m.y)); }
    if (Math.random() < (m.B ? kr : kf) * dt) { events.push({ t, f: !m.B }); m.B = !m.B; m.flash = 0.4; }
    m.flash = Math.max(0, m.flash - dt);
  }
  t += dt;
  while (events.length && events[0].t < t - RATE_WIN) events.shift();
  if (t >= nextSample) { sample(); nextSample = t + SAMPLE; }
}

function draw() {
  const w = cv.clientWidth, h = cv.clientHeight, dpr = window.devicePixelRatio || 1;
  if (!w) return;
  if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const cA = css('--c0'), cB = css('--c1'), r = Math.max(2.5, w / 150);
  for (const m of M) {
    const px = m.x / AR * w, py = m.y * h;
    if (m.flash > 0) { ctx.beginPath(); ctx.arc(px, py, r * 2.4, 0, 2 * Math.PI); ctx.fillStyle = css('--good-soft'); ctx.fill(); }
    ctx.fillStyle = m.B ? cB : cA;
    if (m.B) { ctx.fillRect(px - r, py - r, 2 * r, 2 * r); }   // B: squares, so colour is not the only cue
    else { ctx.beginPath(); ctx.arc(px, py, r, 0, 2 * Math.PI); ctx.fill(); }
  }
}

function drawPlot() {
  const t0 = Math.max(0, t - WINDOW), t1 = Math.max(WINDOW, t);
  const kf = +kfIn.value * factor(), kr = +krIn.value * factor();
  if (view === 'n') {
    const N = M.length, nBeq = N * kf / (kf + kr);
    plot.draw({
      x: { min: t0, max: t1, label: 'time (s)' },
      y: { min: 0, max: Math.max(N0, N) * 1.05, label: 'number of molecules' },
      series: [{ points: hist.map(p => [p.t, p.nA]), color: '--c0' }, { points: hist.map(p => [p.t, p.nB]), color: '--c1' }],
      hlines: [{ y: nBeq, color: '--c1', label: 'B eq.' }, { y: N - nBeq, color: '--c0', label: 'A eq.' }],
    });
    $('dy-legend').innerHTML = '<span><i style="border-color:var(--c0)"></i>A (circles)</span><span><i style="border-color:var(--c1)"></i>B (squares)</span><span>dashed: equilibrium from K</span>';
  } else {
    const ymax = Math.max(5, ...hist.map(p => Math.max(p.rf, p.rr))) * 1.1;
    plot.draw({
      x: { min: t0, max: t1, label: 'time (s)' },
      y: { min: 0, max: ymax, label: 'conversions per second' },
      series: [{ points: hist.map(p => [p.t, p.rf]), color: '--c2' }, { points: hist.map(p => [p.t, p.rr]), color: '--c3' }],
    });
    $('dy-legend').innerHTML = '<span><i style="border-color:var(--c2)"></i>forward A → B, k<sub>f</sub>[A]</span><span><i style="border-color:var(--c3)"></i>reverse B → A, k<sub>r</sub>[B]</span>';
  }
}

let lastUi = 0;
function ui(force) {
  if (!force && performance.now() - lastUi < 250) return;
  lastUi = performance.now();
  drawPlot();
  const [nA, nB] = counts(), [rf, rr] = rates();
  const kf = +kfIn.value * factor(), kr = +krIn.value * factor(), K = kf / kr, Q = nA ? nB / nA : Infinity;
  $('dy-kf-out').textContent = `${(+kfIn.value * factor()).toFixed(2)} s⁻¹`;
  $('dy-kr-out').textContent = `${(+krIn.value * factor()).toFixed(2)} s⁻¹`;
  $('dy-readout').innerHTML = [
    ['A / B now', `${nA} / ${nB}`],
    ['Q = [B]/[A] now', Number.isFinite(Q) ? sig(Q, 3) : '∞'],
    ['K = k<sub>f</sub>/k<sub>r</sub>', `<strong>${sig(K, 3)}</strong>`],
    ['Forward / reverse per s', `${rf.toFixed(1)} / ${rr.toFixed(1)}`],
  ].map(([a, b]) => `<tr><td>${a}</td><td class="num">${b}</td></tr>`).join('');
  const near = Math.abs(Math.log((Q || 1e-9) / K)) < 0.25;
  $('dy-note').innerHTML = near
    ? `At equilibrium: about ${rf.toFixed(0)} A turn into B every second, and about as many B turn back. Nothing changes on the whole, yet every molecule keeps switching (the green flashes).`
    : Q < K
      ? `Q &lt; K: there is too little B. The forward rate k<sub>f</sub>[A] beats the reverse rate, so B builds up until [B]/[A] = ${sig(K, 3)}.`
      : `Q &gt; K: there is too much B. The reverse rate wins, and B turns back into A until [B]/[A] = ${sig(K, 3)}.`;
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  if (visible) { if (running) step(dt); draw(); ui(); }
  requestAnimationFrame(loop);
}

kfIn.addEventListener('input', () => ui(true));
krIn.addEventListener('input', () => ui(true));
catIn.addEventListener('change', () => ui(true));
$('dy-allA').addEventListener('click', () => { start(false); ui(true); });
$('dy-allB').addEventListener('click', () => { start(true); ui(true); });
$('dy-add').addEventListener('click', () => { for (let i = 0; i < 60; i++) M.push(mol(false)); ui(true); });
$('dy-remove').addEventListener('click', () => {
  const bs = M.filter(m => m.B); const drop = new Set(bs.slice(0, Math.floor(bs.length / 2)));
  M = M.filter(m => !drop.has(m)); ui(true);
});
$('dy-view').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  view = b.dataset.view;
  for (const x of $('dy-view').querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === b));
  ui(true);
});
new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(cv);
start(false);
ui(true);
draw();
requestAnimationFrame(loop);
// a page that starts paused (reduced motion) still needs a way to run: the start buttons run it
for (const id of ['dy-allA', 'dy-allB']) $(id).addEventListener('click', () => { running = true; });
