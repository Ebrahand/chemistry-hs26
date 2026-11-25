// Module 5: an energy landscape in 3D with two routes from the reactant basin to the product basin: the uncatalysed
// route over a high pass, and the catalysed route over two lower passes with an intermediate between them.
// Speed-up factor e^(ΔEa/RT) and the equivalent temperature.

import { sig, sci } from '../assets/format.js';
import { View3D, rgb, css, arrow, text, dashed, pathEnergy, ease, heightRamp, rampColor, surfaceItems } from './view3d.js';

const $ = id => document.getElementById(id);
const R = 8.314, DE = -40;   // kJ/mol, ΔE of the reaction (the same on both routes)
const eIn = $('cat-Ea'), lIn = $('cat-low');
let T = 298.15;

// x = reaction progress (0 … 1), y = which route (0 … 1). Catalysed route in front (y = YC), uncatalysed behind (y = YU).
const YC = 0.27, YU = 0.73, NX = 66, NY = 46;
const XS = Array.from({ length: NX }, (_, i) => i / (NX - 1)), YS = Array.from({ length: NY }, (_, j) => j / (NY - 1));
const ZS = 1.3 / 300, Z = E => E * ZS - 0.3;
const WX = x => (x - 0.5) * 2.5, WY = y => (y - 0.5) * 1.7;
let Ea = 120, Ec = 100, EI = 35, E2 = 75;

const routeU = () => [[0.16, 0], [0.5, Ea], [0.84, DE]];
const routeC = () => [[0.16, 0], [0.36, Ec], [0.52, EI], [0.66, E2], [0.84, DE]];
const base = x => pathEnergy([[0.16, 0], [0.84, DE]], x);
// the range between the basins: rises over x = 0.15 … 0.3, falls over 0.7 … 0.85
const ridge = x => ease((x - 0.15) / 0.15) * (1 - ease((x - 0.7) / 0.15));

// Between the two routes a range of hills (higher than either pass); outside them a low bank.
function energy(x, y, cat) {
  const r = ridge(x), Vu = pathEnergy(routeU(), x);
  // without a catalyst the front route is closed: a range of hills instead of a pass
  const Vc = cat ? pathEnergy(routeC(), x) : base(x) + r * (Ea + 15 - base(x));
  const bank = (V, dy) => V + 18 * r * (1 - Math.exp(-((dy / 0.12) ** 2)));
  if (y <= YC) return bank(Vc, y - YC);
  if (y >= YU) return bank(Vu, y - YU);
  const t = (y - YC) / (YU - YC), L = Vc + (Vu - Vc) * ease(t);
  return L + r * Math.max(0, Ea + 25 - L) * Math.sin(Math.PI * t) ** 2;
}

function draw(view) {
  const { ctx, w, h } = view.frame();
  if (!w) return;
  const cat = Ec < Ea;
  const vp = { cx: w / 2, cy: h * 0.5, S: Math.min(w / 2.9, h / 2.4), D: 6 };
  const Eg = XS.map(x => YS.map(y => energy(x, y, cat)));
  const Elo = DE, Ehi = Ea + 25, ramp = heightRamp();
  const items = surfaceItems(view, vp, { nx: NX, ny: NY, X: XS.map(WX), Y: YS.map(WY), Z: Eg.map(r => r.map(Z)) },
    (i, j) => rampColor(ramp, ((Eg[i][j] + Eg[i + 1][j + 1]) / 2 - Elo + 10) / (Ehi - Elo + 10)), { every: 5 });
  // the two routes, drawn on the surface in short pieces so that the ridge can hide them
  const routes = [[YU, routeU(), rgb('--text-muted')]].concat(cat ? [[YC, routeC(), rgb('--c2')]] : []);
  for (const [y0, pts, col] of routes) {
    let prev = null;
    for (let k = 0; k <= 80; k++) {
      const x = 0.08 + k / 80 * 0.84, p = view.project([WX(x), WY(y0), Z(pathEnergy(pts, x)) + 0.012], vp);
      if (prev) { const a = prev; items.push({ d: (a[2] + p[2]) / 2 + 0.02, fn: c => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(p[0], p[1]); c.strokeStyle = css(col); c.lineWidth = 3; c.stroke(); } }); }
      prev = p;
    }
  }
  view.paint(items);

  // annotations: heights of the passes above the reactant basin, and ΔE
  const at = (x, y, E) => view.project([WX(x), WY(y), Z(E)], vp);
  const muted = rgb('--text-muted'), green = rgb('--c2');
  const U0 = at(0.5, YU, 0), Ua = at(0.5, YU, Ea);
  dashed(ctx, [[at(0.16, YU, 0)[0], at(0.16, YU, 0)[1]], [U0[0], U0[1]]], muted, 1.2);
  arrow(ctx, U0[0], U0[1], Ua[1], muted, 'Eₐ');
  if (cat) {
    const C0 = at(0.36, YC, 0), Ca = at(0.36, YC, Ec);
    dashed(ctx, [[at(0.16, YC, 0)[0], at(0.16, YC, 0)[1]], [C0[0], C0[1]]], green, 1.2);
    arrow(ctx, C0[0], C0[1], Ca[1], green, 'Eₐ,cat', 'left');
    const I = at(0.52, YC, EI);
    text(ctx, 'intermediate', I[0], I[1] + 22, green, { size: 12 });
  }
  const P0 = at(0.92, 0.5, 0), Pd = at(0.92, 0.5, DE);
  dashed(ctx, [[at(0.1, 0.5, 0)[0], at(0.1, 0.5, 0)[1]], [P0[0], P0[1]]], muted, 1);
  arrow(ctx, P0[0], P0[1], Pd[1], rgb('--text'), 'ΔE');
  const Rl = at(0.06, 0.5, 0), Pl = at(0.94, 0.5, DE);
  text(ctx, 'reactants', Rl[0], Rl[1] + 22, '--text-muted');
  text(ctx, 'products', Pl[0], Pl[1] + 24, '--text-muted');
  // axis along the front edge
  const a0 = at(0.05, 0, DE), a1 = at(0.95, 0, DE);
  ctx.strokeStyle = css(rgb('--plot-axis')); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke();
  text(ctx, 'reaction progress →', (a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2 + 18, '--text-muted', { size: 12 });
}

const view = new View3D($('cat-diagram'), draw, { az: -1.95, el: 0.72, minEl: 0.1 });

function render() {
  Ea = +eIn.value;
  if (+lIn.value > Ea - 10) lIn.value = Ea - 10;
  const low = +lIn.value;
  Ec = Ea - low;
  EI = 0.35 * Ec; E2 = 0.75 * Ec;   // intermediate and second (lower) peak of the catalysed route
  $('cat-Ea-out').textContent = `${Ea} kJ/mol`;
  $('cat-low-out').textContent = `${low} kJ/mol`;
  const f = Math.exp(low * 1000 / (R * T));
  const Teq = T * Ea / Ec;
  $('cat-readout').innerHTML = [
    ['E<sub>a</sub> with catalyst', `${Ec} kJ/mol`],
    ['Speed-up k<sub>cat</sub>/k = e<sup>ΔE<sub>a</sub>/RT</sup>', `<strong>${f < 1e4 ? sig(f, 3) : sci(f, 2)}</strong>`],
    ['Same speed-up by heating instead', low ? `to ${Teq.toFixed(0)} K (${(Teq - 273.15).toFixed(0)} °C)` : '—'],
    ['ΔE of the reaction', `−${-DE} kJ/mol on both routes`],
  ].map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal">${b}</td></tr>`).join('');
  const tc = (T - 273.15).toFixed(0);
  $('cat-note').innerHTML = low === 0
    ? 'No catalyst: the only way across is over the high pass.'
    : `At ${tc} °C, lowering E<sub>a</sub> by ${low} kJ/mol makes the reaction ${f < 1e4 ? sig(f, 3) : sci(f, 2)} times faster. ` +
      `Without the catalyst you would have to heat it to about ${(Teq - 273.15).toFixed(0)} °C for the same effect. ` +
      (T > 500 ? 'At high temperature the same ΔEₐ helps less, because RT is larger: one reason enzymes, which work at body temperature, are so effective.'
        : 'Enzymes often lower Eₐ even more than this.');
  view.redraw();
}
eIn.addEventListener('input', render);
lIn.addEventListener('input', render);
$('cat-T').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  T = +b.dataset.t;
  for (const x of $('cat-T').querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === b));
  render();
});
render();
