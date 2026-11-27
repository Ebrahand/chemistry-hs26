// Landing-page toy: two kinds of gas molecules (mass ratio 4 : 1) bouncing elastically in a box.
// The temperature slider rescales all velocities by sqrt(T_new / T_old), so the mean kinetic
// energy is proportional to T, and at the same T the lighter molecules move sqrt(4) = 2 times faster.
(() => {
  const canvas = document.getElementById('toy');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const slider = document.getElementById('toy-T');
  const out = document.getElementById('toy-T-out');
  const pauseBtn = document.querySelector('.toy-pause');

  const KINDS = [
    { m: 4, r: 9, n: 14, c0: '#d6ecff', c1: '#4a9cf0' }, // heavy
    { m: 1, r: 5.5, n: 24, c0: '#ffe2d6', c1: '#ff7f50' }, // light
  ];
  const SIGMA_REF = 75; // px/s: velocity-component spread for the light molecule at 300 K

  let W = 480, H = 300, T = +slider.value;
  const P = [];

  function gauss() { // Box–Muller
    let u = 0; while (!u) u = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
  }
  function sigma(m, temp) { return SIGMA_REF * Math.sqrt((temp / 300) / m); }

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 480, h = canvas.clientHeight || 300;
    for (const p of P) { p.x *= w / W; p.y *= h / H; }
    W = w; H = h;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const p of P) { // keep inside after a resize
      p.x = Math.min(Math.max(p.x, p.r), W - p.r);
      p.y = Math.min(Math.max(p.y, p.r), H - p.r);
    }
  }

  function seed() {
    size();
    for (const k of KINDS) {
      for (let i = 0; i < k.n; i++) {
        let x, y, tries = 0;
        do { // avoid starting on top of another molecule
          x = k.r + Math.random() * (W - 2 * k.r);
          y = k.r + Math.random() * (H - 2 * k.r);
        } while (tries++ < 50 && P.some(q => (q.x - x) ** 2 + (q.y - y) ** 2 < (q.r + k.r + 2) ** 2));
        const s = sigma(k.m, T);
        P.push({ x, y, vx: gauss() * s, vy: gauss() * s, m: k.m, r: k.r, k });
      }
    }
  }

  function step(dt) {
    for (const p of P) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < p.r) { p.x = p.r; p.vx = Math.abs(p.vx); }
      if (p.x > W - p.r) { p.x = W - p.r; p.vx = -Math.abs(p.vx); }
      if (p.y < p.r) { p.y = p.r; p.vy = Math.abs(p.vy); }
      if (p.y > H - p.r) { p.y = H - p.r; p.vy = -Math.abs(p.vy); }
    }
    for (let i = 0; i < P.length; i++) {
      const a = P[i];
      for (let j = i + 1; j < P.length; j++) {
        const b = P[j];
        const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
        const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        // separate the overlap, shared by mass
        const ov = rr - d, M = a.m + b.m;
        a.x -= nx * ov * b.m / M; a.y -= ny * ov * b.m / M;
        b.x += nx * ov * a.m / M; b.y += ny * ov * a.m / M;
        if (vn >= 0) continue; // already moving apart
        const J = 2 * vn / M; // elastic collision along the line of centres
        a.vx += J * b.m * nx; a.vy += J * b.m * ny;
        b.vx -= J * a.m * nx; b.vy -= J * a.m * ny;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // warm glow from the bottom that grows with temperature
    const heat = (T - 50) / 1150;
    const g = ctx.createLinearGradient(0, H, 0, H * 0.35);
    g.addColorStop(0, `rgba(255, 110, 60, ${0.05 + 0.45 * heat})`);
    g.addColorStop(1, 'rgba(255, 110, 60, 0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    for (const p of P) {
      const s = ctx.createRadialGradient(p.x - p.r * 0.35, p.y - p.r * 0.4, p.r * 0.1, p.x, p.y, p.r);
      s.addColorStop(0, p.k.c0); s.addColorStop(1, p.k.c1);
      ctx.fillStyle = s;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI); ctx.fill();
    }
  }

  function setT(newT) {
    const f = Math.sqrt(newT / T);
    for (const p of P) { p.vx *= f; p.vy *= f; }
    T = newT;
    out.textContent = `${T} K`;
  }

  // ---------- loop ----------
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let paused = reduce, visible = true, raf = 0, last = 0;

  function frame(t) {
    raf = 0;
    const dt = Math.min((t - last) / 1000, 1 / 30);
    last = t;
    const n = 4; // substeps keep fast molecules from passing through each other
    for (let i = 0; i < n; i++) step(dt / n);
    draw();
    if (!paused && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function kick() { // (re)start the loop; the first frame only records the time
    if (!raf && !paused && visible && !document.hidden) {
      raf = requestAnimationFrame(t => { last = t; raf = requestAnimationFrame(frame); });
    }
  }
  function setPaused(v) {
    paused = v;
    pauseBtn.setAttribute('aria-pressed', String(v));
    pauseBtn.innerHTML = v
      ? '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="3" height="9" rx=".8" fill="currentColor"/><rect x="7" y="1.5" width="3" height="9" rx=".8" fill="currentColor"/></svg>';
    pauseBtn.setAttribute('aria-label', v ? 'Play the animation' : 'Pause the animation');
    if (v && raf) { cancelAnimationFrame(raf); raf = 0; }
    kick();
  }

  seed();
  draw();
  setPaused(paused);

  slider.addEventListener('input', () => { setT(+slider.value); if (paused) draw(); });
  pauseBtn.addEventListener('click', () => setPaused(!paused));
  document.addEventListener('visibilitychange', kick);
  new ResizeObserver(() => { size(); draw(); }).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(canvas);
})();
