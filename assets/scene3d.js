// Shared 3D engine for every visualisation on the site (three.js 0.170.0 from cdn.jsdelivr.net).
//
//   const v = new View(canvas, { az, el, radius });       a rotatable, zoomable 3D view in an existing <canvas>
//   v.scene.add(mesh); v.invalidate();                   draw once
//   v.animate(dt => { ...; return true; });              per-frame callback while on screen (return false to stop)
//   v.label('text', { at: [x, y, z] })                   sharp HTML label that follows a 3D point
//
//   const p = new Plot3D(canvas, opts);                   a 3D graph: x across, y up, z into the page
//   p.draw({ x, y, z, curves, surfaces, points, segs, planes, labels });
//
// Controls (the same on every view): drag with one finger or the mouse to rotate; pinch with two fingers or the
// trackpad to zoom; the mouse wheel zooms once the view has been clicked (⌘/Ctrl + wheel always zooms), so the page
// still scrolls past a view; arrow keys rotate, + and − zoom, 0 resets; double-click or double-tap resets.
//
// All views on a page share one WebGL renderer (phones allow only a few WebGL contexts): each view renders into
// the shared drawing buffer and copies the picture into its own canvas. A view only renders while it is on screen
// and something changed.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
export { THREE };

// ---------------------------------------------------------------------------------------------------------------
// small helpers (colours from CSS custom properties, nice tick values)
// ---------------------------------------------------------------------------------------------------------------
export function cssColor(name, el = document.documentElement) {
  if (!name) return null;
  if (name.startsWith('--')) return getComputedStyle(el).getPropertyValue(name).trim();
  return name;
}
export const col = name => new THREE.Color().setStyle(cssColor(name) || '#888888');
export const isDark = () => {
  const c = col('--bg');
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b < 0.25;   // linear values
};

export function niceStep(range, target = 5) {
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / mag;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
}
export function ticks(min, max, target = 5) {
  if (!(max > min)) return { values: [min], step: 1 };
  const step = niceStep(max - min, target);
  const out = [];
  const start = Math.ceil(min / step - 1e-9) * step;
  for (let v = start; v <= max + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return { values: out, step };
}
export function fmtTick(v, step) {
  const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  return v.toFixed(Math.min(dec, 4)).replace('-', '−');
}

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

// ---------------------------------------------------------------------------------------------------------------
// shared renderer and frame loop
// ---------------------------------------------------------------------------------------------------------------
let GL = null, glW = 0, glH = 0;
function renderer() {
  if (GL) return GL;
  GL = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: false });
  GL.setPixelRatio(1);
  GL.setClearColor(0x000000, 0);
  GL.localClippingEnabled = true;
  GL.setScissorTest(true);
  return GL;
}

const views = new Set();
let looping = false, lastT = 0;
function kick() {
  if (looping) return;
  looping = true; lastT = 0;
  requestAnimationFrame(frame);
}
function frame(t) {
  const dt = lastT ? Math.min((t - lastT) / 1000, 0.1) : 0;
  lastT = t;
  let busy = false;
  for (const v of views) {
    if (!v.onScreen) continue;
    if (v.tickFn) { if (v.tickFn(dt) === false) v.tickFn = null; else busy = true; v.dirty = true; }
    if (v.flight) { v._fly(t); busy = true; }
    if (v.dirty) v._render();
  }
  if (busy) requestAnimationFrame(frame); else looping = false;
}

// re-colour every view when the colour scheme changes
const themeHandlers = new Set();
export function onTheme(fn) { themeHandlers.add(fn); }
function retheme() { for (const fn of themeHandlers) fn(); for (const v of views) v.invalidate(); }
window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', retheme);
new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// ---------------------------------------------------------------------------------------------------------------
// View: camera, controls, labels, toolbar
// ---------------------------------------------------------------------------------------------------------------
export class View {
  constructor(cv, opts = {}) {
    this.cv = cv;
    this.ctx = cv.getContext('2d');
    this.opts = opts;
    this.ortho = !!opts.ortho;
    this.home = { az: opts.az ?? -0.6, el: opts.el ?? 0.4, zoom: 1 };
    this.az = this.home.az; this.el = this.home.el; this.zoom = 1;
    this.minZoom = opts.minZoom ?? 0.5; this.maxZoom = opts.maxZoom ?? 6;
    this.radius = opts.radius ?? 1;               // radius of the content, for framing
    this.fitPoints = opts.fitPoints || null;      // or: points that must fit the frame (ortho views)
    this.margin = opts.margin ?? 1.12;
    this.target = new THREE.Vector3(...(opts.target || [0, 0, 0]));
    this.scene = new THREE.Scene();
    this.camera = this.ortho ? new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200)
      : new THREE.PerspectiveCamera(opts.fov ?? 32, 1, 0.05, 100);
    this.aspect = 1; this.base = 1;
    this.labels = [];
    this.dirty = true; this.onScreen = false;
    this.tickFn = null; this.flight = null;

    // lights: soft sky/ground light plus a key light that moves with the camera
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.6);
    this.key = new THREE.DirectionalLight(0xffffff, 1.5);
    this.key.position.set(0.6, 1.2, 1);
    this.camera.add(this.key);
    this.scene.add(this.hemi, this.camera);

    this._wrap();
    this._controls();
    views.add(this);
    new ResizeObserver(() => { this._needFit = true; this.invalidate(); }).observe(cv);
    new IntersectionObserver(es => {
      this.onScreen = es[es.length - 1].isIntersecting;
      if (this.onScreen) this.invalidate();
    }, { rootMargin: '120px' }).observe(cv);
    this._needFit = true;
  }

  // the canvas moves into a positioned wrapper that also holds the labels, the toolbar and the hint
  _wrap() {
    const cv = this.cv, wrap = document.createElement('div');
    wrap.className = 'v3d';
    cv.parentNode.insertBefore(wrap, cv);
    wrap.append(cv);
    this.wrap = wrap;
    this.layer = document.createElement('div');
    this.layer.className = 'v3d-labels';
    this.layer.setAttribute('aria-hidden', 'true');
    wrap.append(this.layer);
    const bar = document.createElement('div');
    bar.className = 'v3d-bar';
    wrap.append(bar);
    this.bar = bar;
    if (this.opts.faceOn) {
      const b = this.button('2D', 'Look straight at the graph (2D view)', () => {
        const flat = Math.abs(this.az - this.opts.faceOn.az) < 0.02 && Math.abs(this.el - this.opts.faceOn.el) < 0.02;
        this.flyTo(flat ? this.home : { ...this.opts.faceOn, zoom: 1 });
      });
      this.faceBtn = b;
    }
    this.button('⟲', 'Reset the view', () => this.flyTo(this.home));
    if (this.opts.hint !== false) {
      const h = document.createElement('div');
      h.className = 'v3d-hint';
      h.textContent = coarse ? 'One finger: rotate · two fingers: zoom'
        : `Drag: rotate · pinch or ${isMac ? '⌘' : 'Ctrl'} + scroll: zoom`;
      wrap.append(h);
      this.hint = h;
    }
    cv.tabIndex = 0;
    cv.classList.add('v3d-canvas');
  }

  button(text, title, fn) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'v3d-btn'; b.textContent = text; b.title = title;
    b.setAttribute('aria-label', title);
    b.addEventListener('click', fn);
    this.bar.prepend(b);
    return b;
  }

  _touched() {
    if (this.hint) { this.hint.classList.add('gone'); this.hint = null; }
  }

  _controls() {
    const cv = this.cv, ptrs = new Map();
    let rot = null, pinch = null, tap = null, lastTap = 0, engaged = false;
    cv.style.touchAction = 'none';
    const startRotate = p => { rot = { x: p.x, y: p.y, az: this.az, el: this.el }; };
    const two = () => { const [a, b] = [...ptrs.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };

    cv.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button > 0) return;
      cv.setPointerCapture?.(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.flight = null; engaged = true; this._touched();
      if (ptrs.size === 1) {
        startRotate(ptrs.get(e.pointerId));
        tap = { x: e.clientX, y: e.clientY, t: performance.now() };
      } else if (ptrs.size === 2) {
        rot = null; tap = null;
        pinch = { d: two() || 1, zoom: this.zoom };
      }
      cv.classList.add('grabbing');
    });
    cv.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && ptrs.size >= 2) {
        this.setZoom(pinch.zoom * two() / pinch.d);
      } else if (rot) {
        const s = 6 / Math.max(300, Math.min(cv.clientWidth, 900));
        this.az = rot.az - (e.clientX - rot.x) * s;
        this.el = clamp(rot.el + (e.clientY - rot.y) * s, -1.45, 1.45);
        this.invalidate();
      }
      if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 6) tap = null;
    });
    const up = e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = null;
      if (ptrs.size === 1) startRotate([...ptrs.values()][0]);   // the finger that stays resumes rotating
      if (ptrs.size === 0) {
        rot = null; cv.classList.remove('grabbing');
        if (tap && e.type === 'pointerup' && performance.now() - tap.t < 350) {
          const now = performance.now();
          if (now - lastTap < 320) { lastTap = 0; this.flyTo(this.home); }
          else { lastTap = now; this._tap(e); }
        }
        tap = null;
      }
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') engaged = false; });
    cv.addEventListener('blur', () => { engaged = false; });

    cv.addEventListener('wheel', e => {
      const pinchy = e.ctrlKey || e.metaKey;
      if (!pinchy && !engaged) { this._nudge(); return; }      // let the page scroll
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
      this.setZoom(this.zoom * Math.exp(-dy * (pinchy ? 0.01 : 0.0025)));
      this._touched();
    }, { passive: false });

    // Safari's own trackpad pinch (macOS); on iOS the two-finger pointers above do the work
    let g0 = 1;
    cv.addEventListener('gesturestart', e => { e.preventDefault(); g0 = this.zoom; });
    cv.addEventListener('gesturechange', e => { e.preventDefault(); if (ptrs.size < 2) this.setZoom(g0 * e.scale); });
    cv.addEventListener('gestureend', e => e.preventDefault());

    cv.addEventListener('keydown', e => {
      const k = e.key;
      if (k === 'ArrowLeft') this.az += 0.12;
      else if (k === 'ArrowRight') this.az -= 0.12;
      else if (k === 'ArrowUp') this.el = clamp(this.el + 0.1, -1.45, 1.45);
      else if (k === 'ArrowDown') this.el = clamp(this.el - 0.1, -1.45, 1.45);
      else if (k === '+' || k === '=') this.setZoom(this.zoom * 1.2);
      else if (k === '-' || k === '_') this.setZoom(this.zoom / 1.2);
      else if (k === '0' || k === 'Home') this.flyTo(this.home);
      else return;
      e.preventDefault(); this._touched(); this.invalidate();
    });
  }

  // wheel over a view that has not been clicked: say once how to zoom, then let the page scroll
  _nudge() {
    if (this._nudged) return;
    this._nudged = true;
    const n = document.createElement('div');
    n.className = 'v3d-nudge';
    n.textContent = `Click the view to zoom with the wheel, or hold ${isMac ? '⌘' : 'Ctrl'}`;
    this.wrap.append(n);
    setTimeout(() => n.classList.add('gone'), 1600);
    setTimeout(() => n.remove(), 2400);
  }

  setZoom(z) { this.zoom = clamp(z, this.minZoom, this.maxZoom); this.invalidate(); }

  // tap or click without dragging: hand the 3D objects under the pointer to the page (v.onTap = hits => …)
  _tap(e) {
    if (!this.onTap) return;
    const r = this.cv.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    this._place();
    ray.setFromCamera(ndc, this.camera);
    this.onTap(ray.intersectObjects(this.scene.children, true), ray, ndc);
  }

  flyTo(goal, ms = 650) {
    this._touched();
    const g = { az: goal.az ?? this.az, el: goal.el ?? this.el, zoom: goal.zoom ?? this.zoom };
    // turn the short way round
    const tau = 2 * Math.PI;
    let daz = ((g.az - this.az) % tau + tau + Math.PI) % tau - Math.PI;
    if (reduceMotion || ms <= 0) { this.az += daz; this.el = g.el; this.zoom = g.zoom; this.flight = null; this.invalidate(); return; }
    this.flight = { t0: performance.now(), ms, from: { az: this.az, el: this.el, zoom: this.zoom }, daz, to: g };
    this.invalidate();
  }
  _fly(t) {
    const f = this.flight, u = clamp((t - f.t0) / f.ms, 0, 1), s = u * u * (3 - 2 * u);
    this.az = f.from.az + f.daz * s;
    this.el = f.from.el + (f.to.el - f.from.el) * s;
    this.zoom = f.from.zoom * Math.pow(f.to.zoom / f.from.zoom, s);
    if (u >= 1) this.flight = null;
    this.dirty = true;
  }

  invalidate() { this.dirty = true; kick(); }
  animate(fn) { this.tickFn = fn; this.invalidate(); }
  stop() { this.tickFn = null; }

  // camera direction from the target, for the current angles
  dir(az = this.az, el = this.el) {
    const c = Math.cos(el);
    return new THREE.Vector3(c * Math.sin(az), Math.sin(el), c * Math.cos(az));
  }

  // how big the frame must be so that the content fits, seen from the home direction
  _fit() {
    const a = this.aspect;
    if (this.ortho && this.fitPoints) {
      const d = this.dir(this.home.az, this.home.el);
      const right = new THREE.Vector3(Math.cos(this.home.az), 0, -Math.sin(this.home.az));
      const up = new THREE.Vector3().crossVectors(d, right).normalize();
      let hw = 0, hh = 0;
      for (const p of this.fitPoints) {
        const q = p.clone().sub(this.target);
        hw = Math.max(hw, Math.abs(q.dot(right))); hh = Math.max(hh, Math.abs(q.dot(up)));
      }
      // leave room (in CSS px) around the content for labels
      const [px, py] = this.opts.padPx || [0, 0], w = this.w || 600, h = this.h || 400;
      this.base = Math.max(hh / Math.max(0.3, 1 - 2 * py / h), hw / (a * Math.max(0.3, 1 - 2 * px / w))) * this.margin;
    } else if (this.ortho) {
      this.base = this.radius * this.margin * Math.max(1, 1 / a);
    } else {
      const half = THREE.MathUtils.degToRad(this.camera.fov / 2);
      const vfit = this.radius / Math.sin(half);
      const hfit = this.radius / Math.sin(Math.atan(Math.tan(half) * a));
      this.base = Math.max(vfit, hfit) * this.margin;
    }
    this._needFit = false;
  }

  _place() {
    const d = this.dir(), cam = this.camera;
    if (this._needFit) this._fit();
    if (this.ortho) {
      const hh = this.base / this.zoom;
      cam.left = -hh * this.aspect; cam.right = hh * this.aspect; cam.top = hh; cam.bottom = -hh;
      cam.position.copy(this.target).addScaledVector(d, 50);
      cam.near = 0.1; cam.far = 120;
    } else {
      const dist = this.base / this.zoom;
      cam.aspect = this.aspect;
      cam.position.copy(this.target).addScaledVector(d, dist);
      cam.near = Math.max(0.01, dist / 60); cam.far = dist * 6 + this.radius * 4;
    }
    cam.lookAt(this.target);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    if (this.faceBtn) {
      const flat = Math.abs(this.az - this.opts.faceOn.az) < 0.02 && Math.abs(this.el - this.opts.faceOn.el) < 0.02;
      if (flat !== this._flat) { this._flat = flat; this.faceBtn.textContent = flat ? '3D' : '2D';
        this.faceBtn.title = flat ? 'Back to the 3D view' : 'Look straight at the graph (2D view)'; }
    }
  }

  _render() {
    this.dirty = false;
    const cv = this.cv, w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    if (Math.abs(this.aspect - w / h) > 1e-6) { this.aspect = w / h; this._needFit = true; }
    if (w !== this.w || h !== this.h) this._needFit = true;
    this.w = w; this.h = h;
    this._place();
    this.beforeRender?.(this);
    const r = renderer();
    if (pw > glW || ph > glH) { glW = Math.max(glW, pw); glH = Math.max(glH, ph); r.setSize(glW, glH, false); }
    r.setViewport(0, 0, pw, ph);
    r.setScissor(0, 0, pw, ph);
    r.render(this.scene, this.camera);
    this.ctx.clearRect(0, 0, pw, ph);
    this.ctx.drawImage(r.domElement, 0, glH - ph, pw, ph, 0, 0, pw, ph);
    this._placeLabels();
  }

  // screen position (CSS px) of a world point; null when it is behind the camera
  toScreen(p) {
    const v = (p.isVector3 ? p.clone() : new THREE.Vector3(...p)).project(this.camera);
    if (v.z > 1 || v.z < -1) return null;
    return { x: (v.x + 1) / 2 * this.w, y: (1 - v.y) / 2 * this.h };
  }

  label(html, o = {}) {
    const el = document.createElement('div');
    el.className = 'v3d-label' + (o.cls ? ' ' + o.cls : '');
    el.innerHTML = html;
    if (o.color) el.style.color = `var(${o.color})`;
    this.layer.append(el);
    const L = {
      el, pos: new THREE.Vector3(...(o.at || [0, 0, 0])), dx: o.dx || 0, dy: o.dy || 0,
      anchor: o.anchor || 'c', show: true,
      set: html2 => { if (L._h !== html2) { el.innerHTML = html2; L._h = html2; } return L; },
      at: (x, y, z) => { L.pos.set(x, y, z); return L; },
    };
    L._h = html;
    this.labels.push(L);
    return L;
  }
  removeLabel(L) { L.el.remove(); this.labels = this.labels.filter(x => x !== L); }
  clearLabels() { for (const L of this.labels) L.el.remove(); this.labels = []; }

  _placeLabels() {
    const tr = { c: '-50%,-50%', l: '0,-50%', r: '-100%,-50%', t: '-50%,0', b: '-50%,-100%', bl: '0,-100%', br: '-100%,-100%', tl: '0,0', tr: '-100%,0' };
    for (const L of this.labels) {
      const s = L.show && this.toScreen(L.pos);
      if (!s || s.x < -40 || s.y < -40 || s.x > this.w + 40 || s.y > this.h + 40) { L.el.style.display = 'none'; continue; }
      L.el.style.display = '';
      L.el.style.transform = `translate(${(s.x + L.dx).toFixed(1)}px,${(s.y + L.dy).toFixed(1)}px) translate(${tr[L.anchor] || tr.c})`;
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// building blocks
// ---------------------------------------------------------------------------------------------------------------

// tube along a polyline (array of Vector3), radius r; parallel-transported frames, so no twisting
export function tubeGeometry(P, r, radial = 7) {
  const pts = [];
  for (const p of P) if (!pts.length || p.distanceToSquared(pts[pts.length - 1]) > 1e-12) pts.push(p);
  const n = pts.length;
  if (n < 2) return null;
  const T = pts.map((p, i) => new THREE.Vector3().subVectors(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)]).normalize());
  const a = Math.abs(T[0].x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const N = new THREE.Vector3().crossVectors(T[0], a).normalize(), B = new THREE.Vector3();
  const pos = new Float32Array(n * radial * 3), nor = new Float32Array(n * radial * 3);
  const d = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    N.addScaledVector(T[i], -N.dot(T[i]));
    if (N.lengthSq() < 1e-10) N.crossVectors(T[i], a);
    N.normalize();
    B.crossVectors(T[i], N);
    for (let j = 0; j < radial; j++) {
      const ang = (2 * Math.PI * j) / radial;
      d.copy(N).multiplyScalar(Math.cos(ang)).addScaledVector(B, Math.sin(ang));
      const k = (i * radial + j) * 3;
      pos[k] = pts[i].x + d.x * r; pos[k + 1] = pts[i].y + d.y * r; pos[k + 2] = pts[i].z + d.z * r;
      nor[k] = d.x; nor[k + 1] = d.y; nor[k + 2] = d.z;
    }
  }
  const idx = [];
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) {
    const A = i * radial + j, Bq = i * radial + (j + 1) % radial, C = A + radial, D = Bq + radial;
    idx.push(A, C, Bq, Bq, C, D);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

// split a polyline into dashes of world length on/off
export function dashes(P, on, off) {
  const out = [];
  let cur = [P[0].clone()], drawing = true, left = on;
  for (let i = 1; i < P.length; i++) {
    let a = P[i - 1].clone(), seg = a.distanceTo(P[i]);
    while (seg >= left) {
      const m = a.clone().lerp(P[i], left / seg);
      if (drawing) { cur.push(m); out.push(cur); cur = null; } else cur = [m];
      seg -= left; a = m; drawing = !drawing; left = drawing ? on : off;
    }
    left -= seg;
    if (drawing) cur.push(P[i].clone());
  }
  if (drawing && cur && cur.length > 1) out.push(cur);
  return out;
}

// join indexed geometries with position + normal into one (one draw call)
export function mergeGeometries(list) {
  let nv = 0, ni = 0;
  for (const g of list) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of list) {
    pos.set(g.attributes.position.array, ov * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, ov * 3);
    const I = g.index.array;
    for (let i = 0; i < I.length; i++) idx[oi + i] = I[i] + ov;
    ov += g.attributes.position.count; oi += I.length;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}

const sphereGeo = new THREE.SphereGeometry(1, 24, 16);
export const geo = {
  sphere: sphereGeo,
  sphereLo: new THREE.SphereGeometry(1, 14, 10),
  cube: new THREE.BoxGeometry(1, 1, 1),
};

// themed materials: the colour comes from a CSS custom property and follows light/dark mode
const themed = [];
export function mat(token, kind = 'lambert', extra = {}) {
  const M = kind === 'basic' ? THREE.MeshBasicMaterial : kind === 'standard' ? THREE.MeshStandardMaterial
    : kind === 'line' ? THREE.LineBasicMaterial : THREE.MeshLambertMaterial;
  const m = new M({ color: col(token), ...extra });
  m.userData.token = token;
  themed.push(new WeakRef(m));
  return m;
}
onTheme(() => {
  for (let i = themed.length - 1; i >= 0; i--) {
    const m = themed[i].deref();
    if (!m) { themed.splice(i, 1); continue; }
    m.color.copy(col(m.userData.token));
  }
});

// many identical spheres (or cubes) with their own position, size and colour: one draw call
export class Swarm {
  constructor(view, max, { geometry = geo.sphereLo, material } = {}) {
    this.max = max;
    this.mesh = new THREE.InstancedMesh(geometry, material || new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.05 }), max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._p = new THREE.Vector3();
    this.mesh.setColorAt(0, new THREE.Color());
    view.scene.add(this.mesh);
  }
  begin() { this.n = 0; }
  // add one instance; colour is a THREE.Color; q is an optional rotation (Quaternion)
  put(x, y, z, r, color, q) {
    if (this.n >= this.max) return;
    this._p.set(x, y, z); this._s.set(r, r, r);
    this._m.compose(this._p, q || this._q.identity(), this._s);
    this.mesh.setMatrixAt(this.n, this._m);
    this.mesh.setColorAt(this.n, color);
    this.n++;
  }
  end() {
    this.mesh.count = this.n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

// wire-frame box with faint walls, centred at the origin; size [w, h, d]
export function glassBox(view, [w, h, d], { walls = 0.035, edge = '--plot-axis' } = {}) {
  const g = new THREE.Group();
  const box = new THREE.BoxGeometry(w, h, d);
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(box), mat(edge, 'line')));
  if (walls > 0) {
    const m = mat('--accent', 'basic', { transparent: true, opacity: walls, side: THREE.BackSide, depthWrite: false });
    g.add(new THREE.Mesh(box, m));
  }
  view.scene.add(g);
  return g;
}

// arrow from a to b (arrays or Vector3), shaft radius r
export function arrow(a, b, r, material) {
  a = a.isVector3 ? a : new THREE.Vector3(...a); b = b.isVector3 ? b : new THREE.Vector3(...b);
  const g = new THREE.Group(), L = a.distanceTo(b);
  if (L < 1e-6) return g;
  const head = Math.min(L * 0.45, r * 6);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L - head, 10), material);
  shaft.position.y = (L - head) / 2;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 2.6, head, 14), material);
  cone.position.y = L - head / 2;
  g.add(shaft, cone);
  g.position.copy(a);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return g;
}

export function disposeTree(obj) {
  obj.traverse(o => {
    if (o.geometry && !Object.values(geo).includes(o.geometry)) o.geometry.dispose();
    if (o.material && !o.material.userData?.keep) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Plot3D: a 3D graph. Data x runs across, y up, z into the page (z grows away from you in the 2D view).
//
//   p.draw({
//     x: { min, max, label, tickValues?, tickFormat?, ticks? (target count) },  y: {…},  z: {…}  (z optional)
//     curves:   [{ points: [[x, y, z], …], color, width (1 = normal), dash: true | [on, off], curtain: true | 0.2 }],
//     surfaces: [{ fn: (x, z) => y  or  param: (u, w) => [x, y, z], nx, nz, color | colorFn(x, y, z) → css, opacity,
//                  lines: 'z' | 'x' | 'both' | 0, pick }],
//     field:    { fn: (x, y) => slope, z, nx, ny, len, color }             (a slope field on the plane z)
//     points:   [{ at: [x, y, z], color, r (1 = normal), hollow }],
//     segs:     [{ a: [x, y, z], b: [x, y, z], color, width, dash }],
//     planes:   [{ x | y | z: value, color, opacity, pick }],       (pick: tap hits come back to p.onTap)
//     labels:   [{ at: [x, y, z], text | html, color, anchor, dx, dy, cls }],
//   });
//
// Axes: z.reverse puts larger z nearer the viewer. Curves and surfaces are clipped to the box. The "2D" button turns the camera to look straight down the z axis:
// that is the usual 2D graph.
// ---------------------------------------------------------------------------------------------------------------
export class Plot3D {
  constructor(cv, opts = {}) {
    this.size = opts.size || [1.7, 1, 1];
    const [W, H, D] = this.size;
    const corners = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) corners.push(new THREE.Vector3(sx * W / 2, sy * H / 2, sz * D / 2));
    this.v = new View(cv, {
      ortho: true, az: opts.az ?? -0.55, el: opts.el ?? 0.36, faceOn: { az: 0, el: 0 },
      fitPoints: corners, margin: opts.margin ?? 1.0, padPx: opts.padPx || [62, 40], minZoom: 0.5, maxZoom: 8, ...opts.view,
    });
    // the labels sit outside the box, so the box sits a little right of and above centre
    this.v.target.set(-W * 0.03, H * 0.02, 0);
    this.root = new THREE.Group();
    this.axes = new THREE.Group();
    this.v.scene.add(this.axes, this.root);
    const [hw, hh, hd] = [W / 2 + 1e-3, H / 2 + 1e-3, D / 2 + 1e-3];
    this.clip = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), hw), new THREE.Plane(new THREE.Vector3(-1, 0, 0), hw),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), hh), new THREE.Plane(new THREE.Vector3(0, -1, 0), hh),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), hd), new THREE.Plane(new THREE.Vector3(0, 0, -1), hd),
    ];
    this.v.beforeRender = () => this._decorate();
    this.tickLabels = [];
    this.dataLabels = [];
    onTheme(() => { this._axKey = null; if (this.spec) this.draw(this.spec); });
    this.onTap = null;
    this.v.onTap = hits => this.onTap?.(hits);
  }

  get view() { return this.v; }

  // data → world
  X(x) { const a = this.spec.x; return ((x - a.min) / (a.max - a.min) - 0.5) * this.size[0]; }
  Y(y) { const a = this.spec.y; return ((y - a.min) / (a.max - a.min) - 0.5) * this.size[1]; }
  Z(z) {                                   // larger z: further back (z.reverse: nearer)
    const a = this.spec.z, u = (z - a.min) / (a.max - a.min);
    return (0.5 - (a.reverse ? 1 - u : u)) * this.size[2];
  }
  // world → data
  toData(p) {
    const { x, y, z } = this.spec, [W, H, D] = this.size;
    let u = 0.5 - p.z / D; if (z.reverse) u = 1 - u;
    return [x.min + (p.x / W + 0.5) * (x.max - x.min), y.min + (p.y / H + 0.5) * (y.max - y.min), z.min + u * (z.max - z.min)];
  }
  P([x, y, z]) {
    const a = this.spec.y, span = a.max - a.min;
    const yy = clamp(y, a.min - 3 * span, a.max + 3 * span);   // far-off values: keep the geometry sane, clipping does the rest
    return new THREE.Vector3(this.X(x), this.Y(yy), this.Z(z ?? this.spec.z.min));
  }

  draw(spec) {
    spec = { ...spec };
    if (!spec.z) spec.z = { min: 0, max: 1, hidden: true };
    this.spec = spec;
    const key = JSON.stringify([spec.x, spec.y, spec.z, this.v.w < 420]);
    if (key !== this._axKey) { this._axKey = key; this._buildAxes(); }

    disposeTree(this.root);
    this.root.clear();
    for (const L of this.dataLabels) this.v.removeLabel(L);
    this.dataLabels = []; this.rings = [];
    const clip = this.clip, R = 0.0085 * this.size[1];

    for (const s of spec.surfaces || []) this._surface(s);

    for (const c of spec.curves || []) {
      const runs = [[]];
      for (const p of c.points) {
        if (!Number.isFinite(p[1])) { if (runs[runs.length - 1].length) runs.push([]); continue; }
        runs[runs.length - 1].push(this.P(p));
      }
      const m = mat(c.color, 'lambert', { clippingPlanes: clip, emissive: col(c.color), emissiveIntensity: 0.35 });
      for (const run of runs) {
        if (run.length < 2) continue;
        const pieces = c.dash ? dashes(run, ...(Array.isArray(c.dash) ? c.dash : [0.045, 0.03])) : [run];
        for (const piece of pieces) {
          const g = tubeGeometry(piece, R * (c.width || 1));
          if (g) this.root.add(new THREE.Mesh(g, m));
        }
        if (c.curtain) this._curtain(run, c);
      }
    }

    for (const s of spec.segs || []) {
      const a = this.P(s.a), b = this.P(s.b);
      const m = mat(s.color || '--text', 'lambert', { clippingPlanes: clip, emissive: col(s.color || '--text'), emissiveIntensity: 0.35 });
      const pieces = s.dash ? dashes([a, b], ...(Array.isArray(s.dash) ? s.dash : [0.035, 0.025])) : [[a, b]];
      for (const piece of pieces) {
        const g = tubeGeometry(piece, R * 0.75 * (s.width || 1), 6);
        if (g) this.root.add(new THREE.Mesh(g, m));
      }
    }

    for (const pt of spec.points || []) {
      if (!pt.at.every(Number.isFinite)) continue;
      const r = R * 2.3 * (pt.r || 1);
      const mesh = new THREE.Mesh(geo.sphere, pt.hollow
        ? mat(pt.color, 'lambert', { transparent: true, opacity: 0.25, depthWrite: false })
        : mat(pt.color, 'standard', { roughness: 0.4, emissive: col(pt.color), emissiveIntensity: 0.25 }));
      mesh.scale.setScalar(r);
      mesh.position.copy(this.P(pt.at));
      mesh.userData = pt;
      if (pt.hollow) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.28, 8, 24), mat(pt.color, 'basic'));
        ring.scale.setScalar(r * 1.05); ring.position.copy(mesh.position);
        this.rings.push(ring); this.root.add(ring);
      }
      this.root.add(mesh);
    }

    for (const pl of spec.planes || []) {
      const [W, H, D] = this.size;
      let g, p = new THREE.Vector3();
      if (pl.x !== undefined) { g = new THREE.PlaneGeometry(D, H); g.rotateY(Math.PI / 2); p.x = this.X(pl.x); }
      else if (pl.y !== undefined) { g = new THREE.PlaneGeometry(W, D); g.rotateX(-Math.PI / 2); p.y = this.Y(pl.y); }
      else { g = new THREE.PlaneGeometry(W, H); p.z = this.Z(pl.z); }
      const m = mat(pl.color || '--accent', 'basic', { transparent: true, opacity: pl.opacity ?? 0.16, side: THREE.DoubleSide, depthWrite: false, clippingPlanes: clip });
      const mesh = new THREE.Mesh(g, m); mesh.position.copy(p);
      if (pl.pick) mesh.userData.pick = pl.pick;
      this.root.add(mesh);
      if (pl.edge !== false) {
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), mat(pl.color || '--accent', 'line', { transparent: true, opacity: 0.7 }));
        e.position.copy(p); this.root.add(e);
      }
    }

    // slope field on the plane z = f.z: short segments of equal length with slope fn(x, y)
    if (spec.field) {
      const f = spec.field, [W, H] = this.size, ax = spec.x, ay = spec.y;
      const sx = W / (ax.max - ax.min), sy = H / (ay.max - ay.min), half = (f.len || 0.03) * W;
      const parts = [];
      for (let i = 0; i < (f.nx || 16); i++) for (let j = 0; j < (f.ny || 11); j++) {
        const x = ax.min + (i + 0.5) / (f.nx || 16) * (ax.max - ax.min), y = ay.min + (j + 0.5) / (f.ny || 11) * (ay.max - ay.min);
        const m = f.fn(x, y);
        if (!Number.isFinite(m)) continue;
        const dx = sx, dy = m * sy, L = Math.hypot(dx, dy), c = this.P([x, y, f.z]);
        const u = new THREE.Vector3(dx / L * half, dy / L * half, 0);
        const g = tubeGeometry([c.clone().sub(u), c.clone().add(u)], R * 0.42, 5);
        if (g) parts.push(g);
      }
      if (parts.length) this.root.add(new THREE.Mesh(mergeGeometries(parts), mat(f.color || '--plot-axis', 'basic', { clippingPlanes: clip })));
    }

    for (const L of spec.labels || []) {
      if (!L.at.every(Number.isFinite)) continue;
      const lab = this.v.label(L.html ?? escapeHTML(L.text), { at: this.P(L.at).toArray(), color: L.color, anchor: L.anchor, dx: L.dx, dy: L.dy, cls: 'data ' + (L.cls || '') });
      this.dataLabels.push(lab);
    }
    this.v.invalidate();
  }

  _curtain(run, c) {
    const y0 = this.Y(c.curtainTo ?? this.spec.y.min), n = run.length;
    const pos = new Float32Array(n * 6);
    run.forEach((p, i) => { pos.set([p.x, p.y, p.z, p.x, y0, p.z], i * 6); });
    const idx = [];
    for (let i = 0; i < n - 1; i++) { const a = 2 * i; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(idx);
    const m = mat(c.color, 'basic', { transparent: true, opacity: typeof c.curtain === 'number' ? c.curtain : 0.16, side: THREE.DoubleSide, depthWrite: false, clippingPlanes: this.clip });
    this.root.add(new THREE.Mesh(g, m));
  }

  // y = fn(x, z) over the whole x–z range, or a parametric patch param(u, w) → [x, y, z] with u, w in [0, 1].
  // Cells with a non-finite value are left out.
  _surface(s) {
    const nx = s.nx || 60, nz = s.nz || 40, ax = this.spec.x, az = this.spec.z;
    const pos = new Float32Array((nx + 1) * (nz + 1) * 3), colors = s.colorFn ? new Float32Array(pos.length) : null;
    const ok = new Uint8Array((nx + 1) * (nz + 1));
    const c = new THREE.Color();
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      let x, y, z;
      if (s.param) [x, y, z] = s.param(i / nx, j / nz);
      else { x = ax.min + (ax.max - ax.min) * i / nx; z = az.min + (az.max - az.min) * j / nz; y = s.fn(x, z); }
      const n = j * (nx + 1) + i, k = n * 3;
      ok[n] = Number.isFinite(y) && Number.isFinite(x) && Number.isFinite(z) ? 1 : 0;
      if (!ok[n]) continue;
      const p = this.P([x, y, z]);
      pos[k] = p.x; pos[k + 1] = p.y; pos[k + 2] = p.z;
      if (colors) { c.setStyle(cssColor(s.colorFn(x, y, z)) || '#888'); colors[k] = c.r; colors[k + 1] = c.g; colors[k + 2] = c.b; }
    }
    const idx = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, cc = a + nx + 1, d = cc + 1;
      if (ok[a] && ok[b] && ok[cc] && ok[d]) idx.push(a, cc, b, b, cc, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    if (colors) g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const op = s.opacity ?? 0.55;
    const m = mat(s.color || '--c1', 'lambert', {
      transparent: op < 1, opacity: op, side: THREE.DoubleSide,
      depthWrite: op >= 1, clippingPlanes: this.clip, vertexColors: !!colors,
    });
    if (colors) m.color.set(0xffffff);
    const mesh = new THREE.Mesh(g, m);
    if (s.pick) mesh.userData.pick = s.pick;
    this.root.add(mesh);
    // mesh lines: curves of constant z (the family of 2D graphs) and/or constant x
    const lines = s.lines ?? 'z';
    if (lines) {
      const lp = [], step = s.lineStep || Math.max(1, Math.round(nz / 8)), stepX = s.lineStepX || Math.max(1, Math.round(nx / 8));
      const at = (i, j) => { const k = (j * (nx + 1) + i) * 3; return [pos[k], pos[k + 1], pos[k + 2]]; };
      const good = (i, j) => ok[j * (nx + 1) + i];
      if (lines === 'z' || lines === 'both') for (let j = 0; j <= nz; j += step) for (let i = 0; i < nx; i++) if (good(i, j) && good(i + 1, j)) lp.push(...at(i, j), ...at(i + 1, j));
      if (lines === 'x' || lines === 'both') for (let i = 0; i <= nx; i += stepX) for (let j = 0; j < nz; j++) if (good(i, j) && good(i, j + 1)) lp.push(...at(i, j), ...at(i, j + 1));
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lp), 3));
      this.root.add(new THREE.LineSegments(lg, mat(s.lineColor || s.color || '--c1', 'line', { transparent: true, opacity: 0.8, clippingPlanes: this.clip })));
    }
  }

  _ticks(a, n) {
    if (a.hidden) return { values: [], fmt: () => '' };
    if (a.tickValues) return { values: a.tickValues.filter(v => v >= a.min - 1e-9 && v <= a.max + 1e-9), fmt: a.tickFormat || (v => String(v)) };
    const t = ticks(a.min, a.max, a.ticks || n);
    return { values: t.values, fmt: a.tickFormat || (v => fmtTick(v, t.step)) };
  }

  // grids on all six walls (the three far ones are shown, depending on the view), tick labels and titles
  _buildAxes() {
    disposeTree(this.axes);
    this.axes.clear();
    for (const L of this.tickLabels) this.v.removeLabel(L);
    this.tickLabels = [];
    const s = this.spec, [W, H, D] = this.size, compact = (this.v.cv.clientWidth || 600) < 420;
    const tx = this._ticks(s.x, compact ? 4 : 6), ty = this._ticks(s.y, compact ? 4 : 5), tz = this._ticks(s.z, compact ? 3 : 4);
    this.tx = tx; this.ty = ty; this.tz = tz;
    const gridM = mat('--plot-grid', 'line'), axisM = mat('--plot-axis', 'line');
    const hw = W / 2, hh = H / 2, hd = D / 2;
    const X = v => this.X(v), Y = v => this.Y(v), Z = v => this.Z(v);
    const wall = (name, gridPts, edgePts) => {
      const g = new THREE.Group();
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
      const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(edgePts, 3));
      g.add(new THREE.LineSegments(gg, gridM), new THREE.LineSegments(eg, axisM));
      // a faint fill makes the wall read as a surface when the graph is turned
      const fill = mat('--plot-grid', 'basic', { transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false });
      g.userData.name = name;
      g.add(wallMesh(name, fill));
      this.axes.add(g);
      return g;
    };
    const wallMesh = (name, m) => {
      let geo2;
      if (name[0] === 'x') { geo2 = new THREE.PlaneGeometry(D, H); geo2.rotateY(Math.PI / 2); }
      else if (name[0] === 'y') { geo2 = new THREE.PlaneGeometry(W, D); geo2.rotateX(-Math.PI / 2); }
      else geo2 = new THREE.PlaneGeometry(W, H);
      const mesh = new THREE.Mesh(geo2, m);
      const sgn = name[1] === '-' ? -1 : 1;
      if (name[0] === 'x') mesh.position.x = sgn * hw; else if (name[0] === 'y') mesh.position.y = sgn * hh; else mesh.position.z = sgn * hd;
      mesh.renderOrder = -1;
      return mesh;
    };
    const rect = (a, b, c, d) => [...a, ...b, ...b, ...c, ...c, ...d, ...d, ...a];
    this.walls = {};
    for (const sg of [-1, 1]) {
      const z0 = sg * hd, x0 = sg * hw, y0 = sg * hh;
      // z walls (back/front): x and y grid
      let gp = [];
      for (const v of tx.values) gp.push(X(v), -hh, z0, X(v), hh, z0);
      for (const v of ty.values) gp.push(-hw, Y(v), z0, hw, Y(v), z0);
      this.walls['z' + (sg < 0 ? '-' : '+')] = wall('z' + (sg < 0 ? '-' : '+'), gp, rect([-hw, -hh, z0], [hw, -hh, z0], [hw, hh, z0], [-hw, hh, z0]));
      // x walls: z and y grid
      gp = [];
      for (const v of tz.values) gp.push(x0, -hh, Z(v), x0, hh, Z(v));
      for (const v of ty.values) gp.push(x0, Y(v), -hd, x0, Y(v), hd);
      this.walls['x' + (sg < 0 ? '-' : '+')] = wall('x' + (sg < 0 ? '-' : '+'), gp, rect([x0, -hh, -hd], [x0, -hh, hd], [x0, hh, hd], [x0, hh, -hd]));
      // y walls (floor/ceiling): x and z grid
      gp = [];
      for (const v of tx.values) gp.push(X(v), y0, -hd, X(v), y0, hd);
      for (const v of tz.values) gp.push(-hw, y0, Z(v), hw, y0, Z(v));
      this.walls['y' + (sg < 0 ? '-' : '+')] = wall('y' + (sg < 0 ? '-' : '+'), gp, rect([-hw, y0, -hd], [hw, y0, -hd], [hw, y0, hd], [-hw, y0, hd]));
    }
    const mk = (html, cls) => { const L = this.v.label(html, { cls }); this.tickLabels.push(L); return L; };
    this.lx = tx.values.map(v => ({ v, L: mk(tx.fmt(v), 'tick') }));
    this.ly = ty.values.map(v => ({ v, L: mk(ty.fmt(v), 'tick') }));
    this.lz = tz.values.map(v => ({ v, L: mk(tz.fmt(v), 'tick') }));
    this.tX = s.x.label ? mk(s.x.label, 'title') : null;
    this.tY = s.y.label ? mk(s.y.label, 'title') : null;
    this.tZ = s.z.label && !s.z.hidden ? mk(s.z.label, 'title') : null;
  }

  // every frame: show the three far walls, put the tick labels on the outer edges facing the viewer
  _decorate() {
    if (!this.walls) return;
    for (const r of this.rings || []) r.quaternion.copy(this.v.camera.quaternion);   // rings face the viewer
    const v = this.v, d = v.dir(), [W, H, D] = this.size, hw = W / 2, hh = H / 2, hd = D / 2;
    const zHidden = this.spec.z.hidden;
    this.walls['x-'].visible = d.x >= 0; this.walls['x+'].visible = d.x < 0;
    this.walls['y-'].visible = d.y >= 0; this.walls['y+'].visible = d.y < 0;
    this.walls['z-'].visible = d.z >= 0; this.walls['z+'].visible = d.z < 0;
    const zNear = d.z >= 0 ? hd : -hd, xNear = d.x >= 0 ? hw : -hw;
    const yBot = -hh;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const scr = p => v.toScreen(p) || { x: 0, y: 0 };
    const pad = 13;
    const place = (L, p, inward, extra = 0) => {
      const a = scr(p), b = scr(inward);
      let dx = a.x - b.x, dy = a.y - b.y; const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      L.pos.copy(p); L.dx = dx * (pad + extra); L.dy = dy * (pad + extra);
      L.anchor = 'c';
      // push the label's box away from the axis by half its own size along the offset direction
      const w = L.el.offsetWidth || 0, h = L.el.offsetHeight || 0;
      L.dx += dx * w / 2 * 0.9; L.dy += dy * h / 2 * 0.9;
      L.show = true;
    };
    // titles go beyond the widest tick label, measured along the offset direction
    const beyond = (list, L) => {
      let ext = 0;
      for (const { L: t } of list) {
        if (!t.show) continue;
        const n = Math.hypot(t.dx, t.dy) || 1;
        ext = Math.max(ext, Math.abs(t.dx / n) * t.el.offsetWidth + Math.abs(t.dy / n) * t.el.offsetHeight);
      }
      return ext + 4;
    };
    const edgeLen = (a, b) => { const p = scr(a), q = scr(b); return Math.hypot(p.x - q.x, p.y - q.y); };
    // x axis: bottom edge on the near side
    const xOK = edgeLen(V(-hw, yBot, zNear), V(hw, yBot, zNear)) > 30;
    for (const { v: val, L } of this.lx) { const x = this.X(val); place(L, V(x, yBot, zNear), V(x, 0, 0)); L.show = xOK; }
    if (this.tX) { place(this.tX, V(0, yBot, zNear), V(0, 0, 0), beyond(this.lx)); this.tX.show = xOK; }
    // z axis: bottom edge on the near x side
    const zOK = !zHidden && edgeLen(V(xNear, yBot, -hd), V(xNear, yBot, hd)) > 30;
    for (const { v: val, L } of this.lz) { const z = this.Z(val); place(L, V(xNear, yBot, z), V(0, 0, z)); L.show = zOK; }
    if (this.tZ) { place(this.tZ, V(xNear, yBot, 0), V(0, 0, 0), beyond(this.lz)); this.tZ.show = zOK; }
    // y axis: the vertical edge furthest left on screen
    let best = null;
    for (const x of [-hw, hw]) for (const z of [-hd, hd]) {
      const sx = scr(V(x, 0, z)).x;
      if (!best || sx < best.sx - 0.5) best = { x, z, sx };
    }
    const yOK = edgeLen(V(best.x, -hh, best.z), V(best.x, hh, best.z)) > 30;
    for (const { v: val, L } of this.ly) { const y = this.Y(val); place(L, V(best.x, y, best.z), V(0, y, 0)); L.show = yOK; }
    if (this.tY) {
      this.tY.pos.set(best.x, hh, best.z); this.tY.dx = 0; this.tY.dy = -14; this.tY.anchor = 'b'; this.tY.show = yOK;
    }
  }
}

export function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}
