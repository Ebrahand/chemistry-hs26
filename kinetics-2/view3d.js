// Small 3D helper for the week 11 visualisations: a rotatable camera on a 2D canvas, depth-sorted drawing,
// shaded surfaces z = f(x, y) and shaded spheres. No dependencies; world axes are x, y and z (z up).
//
//   const view = new View3D(canvas, v => { const { ctx, w, h } = v.frame(); ... }, { az, el });
//   v.project([x, y, z], vp)  → [sx, sy, depth, scale]   with vp = { cx, cy, S, D }   (D = perspective distance)
//   v.paint(items)            items = [{ d, fn(ctx) }], drawn far to near

import { cssColor } from '../assets/plot.js';

export function rgb(c) {
  c = cssColor(c) || '#888';
  if (c.startsWith('rgb')) return c.match(/[\d.]+/g).slice(0, 3).map(Number);
  let h = c.replace('#', '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}
export const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
export const css = (c, a = 1) => `rgba(${c.map(Math.round).join(',')},${a})`;
export const dark = () => {
  const [r, g, b] = rgb('--bg');
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
};
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// smooth step with zero slope at both ends
export const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

// Energy along a path through [[x, E], ...] with a horizontal tangent at every point (plateaus, peaks, dips).
export function pathEnergy(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x0, e0] = pts[i - 1], [x1, e1] = pts[i];
    if (x <= x1) return e0 + (e1 - e0) * ease((x - x0) / (x1 - x0));
  }
  return pts[pts.length - 1][1];
}

export class View3D {
  constructor(cv, render, { az = 0.6, el = 0.45, minEl = -0.2, maxEl = 1.45 } = {}) {
    this.cv = cv; this.ctx = cv.getContext('2d'); this.render = render;
    this.az = az; this.el = el; this.az0 = az; this.el0 = el;
    let drag = null, queued = false;
    this.redraw = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; this.render(this); }); };
    cv.style.touchAction = 'pan-y';
    cv.style.cursor = 'grab';
    cv.tabIndex = 0;
    cv.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, y: e.clientY, az: this.az, el: this.el, touch: e.pointerType === 'touch' };
      cv.setPointerCapture?.(e.pointerId); cv.style.cursor = 'grabbing';
    });
    cv.addEventListener('pointermove', e => {
      if (!drag) return;
      this.az = drag.az - (e.clientX - drag.x) * 0.01;
      // on touch screens vertical drags scroll the page, so only the azimuth follows the finger
      if (!drag.touch) this.el = clamp(drag.el + (e.clientY - drag.y) * 0.01, minEl, maxEl);
      this.redraw();
    });
    const end = () => { drag = null; cv.style.cursor = 'grab'; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('dblclick', () => { this.az = this.az0; this.el = this.el0; this.redraw(); });
    cv.addEventListener('keydown', e => {
      const k = { ArrowLeft: [0.12, 0], ArrowRight: [-0.12, 0], ArrowUp: [0, 0.08], ArrowDown: [0, -0.08] }[e.key];
      if (!k) return;
      e.preventDefault();
      this.az += k[0]; this.el = clamp(this.el + k[1], minEl, maxEl); this.redraw();
    });
    new ResizeObserver(() => this.redraw()).observe(cv);
    // colours come from CSS variables: redraw when the colour scheme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => this.redraw());
  }

  // resize the backing store, clear, and update the camera basis
  frame() {
    const cv = this.cv, w = cv.clientWidth, h = cv.clientHeight, dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const ca = Math.cos(this.az), sa = Math.sin(this.az), ce = Math.cos(this.el), se = Math.sin(this.el);
    this.u = [-sa, ca, 0];                       // screen right
    this.v = [-se * ca, -se * sa, ce];           // screen up
    this.wv = [ce * ca, ce * sa, se];            // towards the viewer
    return { ctx, w, h };
  }

  project(p, vp) {
    const [x, y, z] = p, u = this.u, v = this.v, wv = this.wv;
    const d = x * wv[0] + y * wv[1] + z * wv[2];
    const f = vp.D ? vp.D / (vp.D - d) : 1;
    return [vp.cx + vp.S * f * (x * u[0] + y * u[1] + z * u[2]), vp.cy - vp.S * f * (x * v[0] + y * v[1] + z * v[2]), d, vp.S * f];
  }

  paint(items) {
    items.sort((a, b) => a.d - b.d);
    for (const it of items) it.fn(this.ctx);
  }
}

// Colour ramp for heights: dark (low) to light (high), one hue, chosen for the current colour scheme.
export function heightRamp() {
  return dark()
    ? [[16, 52, 82], [38, 104, 150], [104, 170, 205], [205, 228, 238]]
    : [[22, 66, 108], [52, 122, 176], [130, 186, 220], [232, 242, 247]];
}
export function rampColor(ramp, t) {
  t = clamp(t, 0, 1) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(t));
  return mix(ramp[i], ramp[i + 1], t - i);
}

// Depth-sorted quads of a surface. g = { nx, ny, X: [..], Y: [..], Z: [[..]] } in world coordinates (Z[i][j] at X[i], Y[j]),
// colour(i, j) → [r, g, b]. Mesh lines every `every` cells.
export function surfaceItems(view, vp, g, colour, { every = 4, light = [-0.35, -0.45, 0.82], lineAlpha = 0.18 } = {}) {
  const P = [];
  for (let i = 0; i < g.nx; i++) { P.push([]); for (let j = 0; j < g.ny; j++) P[i].push(view.project([g.X[i], g.Y[j], g.Z[i][j]], vp)); }
  const ln = Math.hypot(...light), L = light.map(x => x / ln);
  const lineCol = dark() ? 'rgba(255,255,255,' : 'rgba(0,0,0,';
  const items = [];
  for (let i = 0; i < g.nx - 1; i++) {
    for (let j = 0; j < g.ny - 1; j++) {
      const a = P[i][j], b = P[i + 1][j], c = P[i + 1][j + 1], d = P[i][j + 1];
      // normal from the two diagonals (world coordinates)
      const d1 = [g.X[i + 1] - g.X[i], g.Y[j + 1] - g.Y[j], g.Z[i + 1][j + 1] - g.Z[i][j]];
      const d2 = [g.X[i] - g.X[i + 1], g.Y[j + 1] - g.Y[j], g.Z[i][j + 1] - g.Z[i + 1][j]];
      let n = [d1[1] * d2[2] - d1[2] * d2[1], d1[2] * d2[0] - d1[0] * d2[2], d1[0] * d2[1] - d1[1] * d2[0]];
      const nl = Math.hypot(...n) || 1; n = n.map(x => x / nl);
      if (n[2] < 0) n = n.map(x => -x);
      const shade = 0.62 + 0.38 * Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
      const col = css(colour(i, j).map(x => x * shade));
      const edgeI = i % every === 0, edgeJ = j % every === 0;
      items.push({
        d: (a[2] + b[2] + c[2] + d[2]) / 4,
        fn: ctx => {
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
          ctx.fillStyle = col; ctx.fill();
          ctx.strokeStyle = col; ctx.lineWidth = 0.8; ctx.stroke();     // hides the hairline seams between quads
          if (edgeI || edgeJ) {
            ctx.beginPath();
            if (edgeJ) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
            if (edgeI) { ctx.moveTo(a[0], a[1]); ctx.lineTo(d[0], d[1]); }
            ctx.strokeStyle = lineCol + lineAlpha + ')'; ctx.lineWidth = 0.7; ctx.stroke();
          }
        },
      });
    }
  }
  return items;
}

// A shaded ball at screen position (x, y) with screen radius r.
export function ball(ctx, x, y, r, col, alpha = 1) {
  const hi = mix(col, [255, 255, 255], 0.55), lo = mix(col, [0, 0, 0], 0.35);
  const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  gr.addColorStop(0, css(hi, alpha)); gr.addColorStop(0.55, css(col, alpha)); gr.addColorStop(1, css(lo, alpha));
  ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, r), 0, 2 * Math.PI); ctx.fillStyle = gr; ctx.fill();
}

// Vertical double-headed arrow on screen from (x, y1) to (x, y2), with a label.
export function arrow(ctx, x, y1, y2, col, label, side = 'right') {
  if (Math.abs(y2 - y1) < 8) return;
  const dir = y2 > y1 ? 1 : -1, c = css(col);
  ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y1 + dir * 3); ctx.lineTo(x, y2 - dir * 3); ctx.stroke();
  const head = (y, d) => { ctx.beginPath(); ctx.moveTo(x - 4.5, y - d * 8); ctx.lineTo(x, y); ctx.lineTo(x + 4.5, y - d * 8); ctx.closePath(); ctx.fill(); };
  head(y2, dir); head(y1, -dir);
  if (label) text(ctx, label, x + (side === 'left' ? -7 : 7), (y1 + y2) / 2 + 4, col, { align: side === 'left' ? 'right' : 'left', bold: true, size: 14 });
}

// Text with a halo in the background colour, so that it stays readable on top of the surface.
export function text(ctx, s, x, y, col, { align = 'center', bold = false, size = 13, halo = true } = {}) {
  ctx.font = `${bold ? 600 : 400} ${size}px ${getComputedStyle(document.body).fontFamily}`;
  ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  // keep labels inside the canvas
  const tw = ctx.measureText(s).width, W = ctx.canvas.clientWidth, x0 = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x;
  x += Math.max(0, 4 - x0) - Math.max(0, x0 + tw - (W - 4));
  if (halo) { ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.strokeStyle = css(rgb('--bg'), 0.85); ctx.strokeText(s, x, y); }
  ctx.fillStyle = Array.isArray(col) ? css(col) : cssColor(col);
  ctx.fillText(s, x, y);
}

export function dashed(ctx, pts, col, width = 1.5, dash = [5, 4]) {
  ctx.save(); ctx.setLineDash(dash); ctx.strokeStyle = Array.isArray(col) ? css(col) : cssColor(col); ctx.lineWidth = width;
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore();
}
