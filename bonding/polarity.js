// Module 2: electronegativity difference, bond polarity, and partial charges of the hydrogen halides.

import { cssColor } from '../assets/plot.js';
import { BY_SYM } from '../assets/elements.js';

const $ = id => document.getElementById(id);
const PICK = ['H', 'Li', 'Na', 'K', 'Cs', 'Mg', 'Ca', 'B', 'Al', 'C', 'Si', 'N', 'P', 'O', 'S', 'F', 'Cl', 'Br', 'I'];
const METALS = new Set(['Li', 'Na', 'K', 'Cs', 'Mg', 'Ca', 'Al']);

{
  let A = 'H', B = 'F';
  function chips(root, get, set) {
    for (const s of PICK) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.v = s;
      b.innerHTML = `${s} <span class="muted small">${BY_SYM[s].en.toFixed(1)}</span>`;
      b.addEventListener('click', () => { set(s); update(); });
      root.appendChild(b);
    }
    return () => root.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === get()));
  }
  const syncA = chips($('en-a'), () => A, v => { A = v; });
  const syncB = chips($('en-b'), () => B, v => { B = v; });
  const cv = $('en-canvas'), ctx = cv.getContext('2d');

  function draw() {
    const w = cv.clientWidth, H = cv.clientHeight; if (!w) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, H);
    const ea = BY_SYM[A].en, eb = BY_SYM[B].en, d = eb - ea;
    const shift = Math.max(-1, Math.min(1, d / 3));          // + towards B
    const xa = w * 0.32, xb = w * 0.68, y = H * 0.45, R = Math.min(H * 0.36, w * 0.2);
    const cE = cssColor('--c1');
    const wa = 0.5 - 0.45 * shift, wb = 0.5 + 0.45 * shift;   // share of the bonding pair near each atom
    for (const [x, wgt] of [[xa, wa], [xb, wb]]) {
      const g = ctx.createRadialGradient(x, y, 2, x, y, R * (0.75 + 0.6 * wgt));
      const al = Math.round(40 + 200 * wgt).toString(16).padStart(2, '0');
      g.addColorStop(0, cE + al); g.addColorStop(1, cE + '00');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R * (0.75 + 0.6 * wgt), 0, 7); ctx.fill();
    }
    const font = getComputedStyle(document.body).fontFamily, text = cssColor('--text');
    ctx.fillStyle = text; ctx.font = `700 ${Math.round(R * 0.45)}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(A, xa, y); ctx.fillText(B, xb, y);
    if (A === B || Math.abs(d) < 0.05) {
      ctx.font = `13px ${font}`; ctx.fillStyle = cssColor('--text-muted');
      ctx.fillText('shared equally: no dipole', w / 2, H - 14);
      return;
    }
    const neg = d > 0 ? xb : xa, pos = d > 0 ? xa : xb;
    ctx.font = `600 ${Math.max(14, R * 0.3)}px ${font}`;
    ctx.fillStyle = cssColor('--c1'); ctx.fillText('δ−', neg, y - R * 0.95);
    ctx.fillStyle = cssColor('--c0'); ctx.fillText('δ+', pos, y - R * 0.95);
    // dipole vector, lecture convention: from − to +
    const ay = H - 18;
    ctx.strokeStyle = text; ctx.fillStyle = text; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(neg, ay); ctx.lineTo(pos + (pos > neg ? -8 : 8), ay); ctx.stroke();
    ctx.beginPath(); const dir = pos > neg ? 1 : -1;
    ctx.moveTo(pos, ay); ctx.lineTo(pos - dir * 10, ay - 5); ctx.lineTo(pos - dir * 10, ay + 5); ctx.fill();
    ctx.font = `12px ${font}`; ctx.fillStyle = cssColor('--text-muted');
    ctx.fillText('μ (from − to +, as in the lecture)', (xa + xb) / 2, ay - 10);
  }

  function update() {
    syncA(); syncB();
    const ea = BY_SYM[A].en, eb = BY_SYM[B].en, d = Math.abs(eb - ea);
    const dStr = d.toFixed(1);
    $('en-table').innerHTML = `
      <tr><td>${BY_SYM[A].name}</td><td class="num">${ea.toFixed(1)}</td></tr>
      <tr><td>${BY_SYM[B].name}</td><td class="num">${eb.toFixed(1)}</td></tr>
      <tr><td>difference</td><td class="num"><strong>${dStr}</strong></td></tr>`;
    $('en-mark').style.left = `${Math.min(100, d / 3.3 * 100)}%`;
    const more = eb > ea ? B : A;
    let note;
    if (A === B) note = `${A}–${A}: two identical atoms share the pair exactly equally. A <strong>nonpolar covalent</strong> bond, as in H₂, Cl₂ or N₂.`;
    else if (d < 0.05) note = `${A} and ${B} have the same electronegativity in the lecture's table: the bond is essentially <strong>nonpolar</strong>.`;
    else if (d < 0.5) note = `Difference ${dStr}: a <strong>polar covalent</strong> bond, but only slightly polar. ${more} pulls the shared pair a little closer. C–H bonds (0.4) are the classic example and are usually treated as nonpolar.`;
    else if (d < 2) note = `Difference ${dStr}: a <strong>polar covalent</strong> bond. ${more} pulls the shared pair towards itself and gets a partial negative charge δ−.`;
    else note = `Difference ${dStr} ≥ 2: by the rule of thumb an <strong>ionic</strong> bond. The electron is essentially transferred to ${more}, giving ${more === A ? B : A} a positive and ${more} a negative ion.`;
    if (METALS.has(A) && METALS.has(B)) note += ' (Two metals do not form a molecule like this: together they form a metallic solid.)';
    $('en-note').innerHTML = note;
    draw();
  }
  new ResizeObserver(draw).observe(cv);
  update();
}

/* ------------------------------------------------------------------ */
/* Hydrogen halides                                                    */
/* ------------------------------------------------------------------ */
{
  // Brown Table 8.3: bond length (pm), Δ electronegativity, dipole moment (D)
  const HX = [['HF', 92, 1.9, 1.82], ['HCl', 127, 0.9, 1.08], ['HBr', 141, 0.7, 0.82], ['HI', 161, 0.4, 0.44]];
  const D = 3.336e-30, e = 1.602e-19;
  $('hx-table').innerHTML = HX.map(([m, r, den, mu]) => {
    const delta = mu * D / (e * r * 1e-12);
    return `<tr><td>${m}</td><td class="num">${r}</td><td class="num">${den.toFixed(1)}</td><td class="num">${mu.toFixed(2)}</td>` +
      `<td class="num">${delta.toFixed(2)} <span class="hbar" style="display:inline-block;width:80px;vertical-align:middle;margin-left:6px"><i style="width:${delta * 200}%"></i></span></td></tr>`;
  }).join('');
}
