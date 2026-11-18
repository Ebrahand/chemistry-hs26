// Minimal canvas plotting for the course site. No dependencies.
//
//   const p = new Plot(canvasElement);
//   p.draw({
//     x: { min, max, label }, y: { min, max, label },
//     series:   [{ points: [[x, y], ...], color, dash, width }],
//     segments: [{ x1, y1, x2, y2, color, width, dash }],
//     hlines:   [{ y, label, color }],  vlines: [{ x, color, dash }],
//     markers:  [{ x, y, color, r, hollow }],
//   });
//
// Colours may be CSS custom properties ("--c1") or plain CSS colours.

export function cssColor(name, el = document.documentElement) {
  if (!name) return null;
  if (name.startsWith('--')) return getComputedStyle(el).getPropertyValue(name).trim();
  return name;
}

export function niceStep(range, target = 5) {
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / mag;
  const nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
  return nf * mag;
}

export function ticks(min, max, target = 5) {
  if (!(max > min)) return { values: [min], step: 1 };
  const step = niceStep(max - min, target);
  const out = [];
  const start = Math.ceil(min / step - 1e-9) * step;
  for (let v = start; v <= max + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return { values: out, step };
}

function fmtTick(v, step) {
  const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  return v.toFixed(Math.min(dec, 4)).replace('-', '−');
}

export class Plot {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pad = Object.assign({ l: 60, r: 18, t: 14, b: 46 }, opts.pad || {});
    this.spec = null;
    this.ro = new ResizeObserver(() => this.render());
    this.ro.observe(canvas);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', () => this.render());
  }

  draw(spec) { this.spec = spec; this.render(); }

  // CSS-pixel position inside the canvas -> data coordinates (null outside the plot area)
  invert(px, py) {
    const s = this.spec;
    if (!s || !this.w) return null;
    if (px < this.pad.l || px > this.pad.l + this.w || py < this.pad.t || py > this.pad.t + this.h) return null;
    return {
      x: s.x.min + ((px - this.pad.l) / this.w) * (s.x.max - s.x.min),
      y: s.y.min + (1 - (py - this.pad.t) / this.h) * (s.y.max - s.y.min),
    };
  }

  // data -> pixel (CSS px)
  X(x) { const { x: ax } = this.spec; return this.pad.l + (x - ax.min) / (ax.max - ax.min) * this.w; }
  Y(y) { const { y: ay } = this.spec; return this.pad.t + (1 - (y - ay.min) / (ay.max - ay.min)) * this.h; }

  render() {
    const s = this.spec;
    if (!s) return;
    const c = this.canvas, ctx = this.ctx;
    const cssW = c.clientWidth, cssH = c.clientHeight;
    if (!cssW || !cssH) return;
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== Math.round(cssW * dpr) || c.height !== Math.round(cssH * dpr)) {
      c.width = Math.round(cssW * dpr);
      c.height = Math.round(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const compact = cssW < 420;
    this.pad.l = compact ? 50 : 60;
    this.pad.r = (s.hlines || []).some(h => h.label) ? (compact ? 40 : 48) : 18;
    this.w = cssW - this.pad.l - this.pad.r;
    this.h = cssH - this.pad.t - this.pad.b;

    const grid = cssColor('--plot-grid'), axis = cssColor('--plot-axis');
    const text = cssColor('--text'), muted = cssColor('--text-muted');
    const font = getComputedStyle(document.body).fontFamily;
    const fs = compact ? 11 : 12;

    // grid + ticks
    const xt = ticks(s.x.min, s.x.max, compact ? 4 : 6);
    const yt = ticks(s.y.min, s.y.max, compact ? 4 : 5);
    ctx.lineWidth = 1;
    ctx.strokeStyle = grid;
    ctx.beginPath();
    for (const v of xt.values) { const px = Math.round(this.X(v)) + 0.5; ctx.moveTo(px, this.pad.t); ctx.lineTo(px, this.pad.t + this.h); }
    for (const v of yt.values) { const py = Math.round(this.Y(v)) + 0.5; ctx.moveTo(this.pad.l, py); ctx.lineTo(this.pad.l + this.w, py); }
    ctx.stroke();

    ctx.strokeStyle = axis;
    ctx.beginPath();
    ctx.moveTo(this.pad.l + 0.5, this.pad.t);
    ctx.lineTo(this.pad.l + 0.5, this.pad.t + this.h + 0.5);
    ctx.lineTo(this.pad.l + this.w, this.pad.t + this.h + 0.5);
    ctx.stroke();

    ctx.fillStyle = muted;
    ctx.font = `${fs}px ${font}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const v of xt.values) ctx.fillText(fmtTick(v, xt.step), this.X(v), this.pad.t + this.h + 6);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const v of yt.values) ctx.fillText(fmtTick(v, yt.step), this.pad.l - 6, this.Y(v));

    // axis labels
    ctx.fillStyle = text;
    ctx.font = `600 ${fs + 1}px ${font}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    if (s.x.label) ctx.fillText(s.x.label, this.pad.l + this.w / 2, cssH - 4);
    if (s.y.label) {
      ctx.save();
      ctx.translate(12, this.pad.t + this.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = 'middle';
      ctx.fillText(s.y.label, 0, 0);
      ctx.restore();
    }

    // clip to plot area
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.pad.l + 1, this.pad.t - 2, this.w, this.h + 2);
    ctx.clip();

    for (const hl of s.hlines || []) {
      const py = this.Y(hl.y);
      ctx.strokeStyle = cssColor(hl.color) || axis;
      ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(this.pad.l, py); ctx.lineTo(this.pad.l + this.w, py); ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const vl of s.vlines || []) {
      const px = this.X(vl.x);
      ctx.strokeStyle = cssColor(vl.color) || axis;
      ctx.setLineDash(vl.dash || []); ctx.lineWidth = vl.width || 1;
      ctx.beginPath(); ctx.moveTo(px, this.pad.t); ctx.lineTo(px, this.pad.t + this.h); ctx.stroke();
      ctx.setLineDash([]);
    }

    // slope field: short segments of constant on-screen length with slope fn(x, y)
    if (s.field) {
      const { fn, nx = 16, ny = 11, color = '--plot-axis', len = 14 } = s.field;
      const sx = this.w / (s.x.max - s.x.min), sy = this.h / (s.y.max - s.y.min);
      ctx.strokeStyle = cssColor(color); ctx.lineWidth = 1.3; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
          const x = s.x.min + ((i + 0.5) / nx) * (s.x.max - s.x.min);
          const y = s.y.min + ((j + 0.5) / ny) * (s.y.max - s.y.min);
          const m = fn(x, y);
          if (!Number.isFinite(m)) continue;
          // direction in pixels: (sx, −m·sy) normalised
          const dx = sx, dy = -m * sy, L = Math.hypot(dx, dy);
          const ux = (dx / L) * len / 2, uy = (dy / L) * len / 2;
          const px = this.X(x), py = this.Y(y);
          ctx.moveTo(px - ux, py - uy); ctx.lineTo(px + ux, py + uy);
        }
      }
      ctx.stroke();
    }

    for (const sr of s.series || []) {
      ctx.strokeStyle = cssColor(sr.color);
      ctx.lineWidth = sr.width || 2.5;
      ctx.setLineDash(sr.dash || []);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      let pen = false;
      for (const [x, y] of sr.points) {
        if (!Number.isFinite(y)) { pen = false; continue; }
        // keep far-off points from producing huge coordinates
        const py = Math.max(-1e4, Math.min(1e4, this.Y(y)));
        const px = this.X(x);
        if (pen) ctx.lineTo(px, py); else { ctx.moveTo(px, py); pen = true; }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (const sg of s.segments || []) {
      ctx.strokeStyle = cssColor(sg.color);
      ctx.lineWidth = sg.width || 1.5;
      ctx.setLineDash(sg.dash || []);
      ctx.beginPath(); ctx.moveTo(this.X(sg.x1), this.Y(sg.y1)); ctx.lineTo(this.X(sg.x2), this.Y(sg.y2)); ctx.stroke();
      ctx.setLineDash([]);
    }

    for (const m of s.markers || []) {
      if (!Number.isFinite(m.y)) continue;
      const col = cssColor(m.color);
      ctx.beginPath();
      ctx.arc(this.X(m.x), this.Y(m.y), m.r || 4, 0, Math.PI * 2);
      if (m.hollow) {
        ctx.fillStyle = cssColor('--surface'); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.fillStyle = col; ctx.fill();
        ctx.strokeStyle = cssColor('--surface'); ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
    ctx.restore();

    // horizontal-line labels sit in the right margin, outside the data area
    ctx.fillStyle = muted; ctx.font = `${fs}px ${font}`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (const hl of s.hlines || []) {
      if (hl.label) ctx.fillText(hl.label, this.pad.l + this.w + 5, this.Y(hl.y));
    }
  }
}
