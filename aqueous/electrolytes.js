// Module 1: conductivity tester. What is in the solution (ions or molecules), and does the bulb light?

const $ = id => document.getElementById(id);

// units: particles each formula unit gives when dissolved; weak: drawn as mostly molecules with one ionized
const SOL = [
  { k: 'NaCl', label: 'NaCl', name: 'table salt, NaCl', type: 'strong', ions: [['Na⁺', 1], ['Cl⁻', -1]], eq: 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)' },
  { k: 'CaCl2', label: 'CaCl₂', name: 'calcium chloride, CaCl₂', type: 'strong', ions: [['Ca²⁺', 2], ['Cl⁻', -1], ['Cl⁻', -1]], eq: 'CaCl₂(s) → Ca²⁺(aq) + 2 Cl⁻(aq)' },
  { k: 'KNO3', label: 'KNO₃', name: 'potassium nitrate, KNO₃', type: 'strong', ions: [['K⁺', 1], ['NO₃⁻', -1]], eq: 'KNO₃(s) → K⁺(aq) + NO₃⁻(aq): the nitrate ion stays in one piece' },
  { k: 'HCl', label: 'HCl', name: 'hydrochloric acid, HCl', type: 'strong', ions: [['H⁺', 1], ['Cl⁻', -1]], eq: 'HCl(aq) → H⁺(aq) + Cl⁻(aq): a strong acid ionizes completely' },
  { k: 'AcOH', label: 'CH₃COOH', name: 'acetic acid (vinegar), CH₃COOH', type: 'weak', mol: 'CH₃COOH', ions: [['H⁺', 1], ['CH₃COO⁻', -1]], eq: 'CH₃COOH(aq) ⇌ H⁺(aq) + CH₃COO⁻(aq): only about 1 % ionized' },
  { k: 'NH3', label: 'NH₃', name: 'ammonia, NH₃', type: 'weak', mol: 'NH₃', ions: [['NH₄⁺', 1], ['OH⁻', -1]], eq: 'NH₃(aq) + H₂O(l) ⇌ NH₄⁺(aq) + OH⁻(aq): about 1 % reacts' },
  { k: 'suc', label: 'sugar', name: 'sugar (sucrose), C₁₂H₂₂O₁₁', type: 'non', mol: 'C₁₂H₂₂O₁₁', eq: 'C₁₂H₂₂O₁₁(s) → C₁₂H₂₂O₁₁(aq): whole molecules' },
  { k: 'EtOH', label: 'ethanol', name: 'ethanol, C₂H₅OH', type: 'non', mol: 'C₂H₅OH', eq: 'C₂H₅OH(l) → C₂H₅OH(aq): whole molecules' },
  { k: 'H2O', label: 'nothing', name: 'pure water', type: 'none', eq: 'Pure water: practically no ions' },
];
let cur = SOL[0];
$('el-pick').innerHTML = SOL.map((s, i) => `<button class="btn${i ? '' : ' primary'}" type="button" data-i="${i}">${s.label}</button>`).join('');
$('el-pick').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $('el-pick').querySelectorAll('button').forEach(x => x.classList.toggle('primary', x === b));
  cur = SOL[+b.dataset.i]; render();
});

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function render() {
  const W = 420, H = 300;
  const bx0 = 70, bx1 = 350, by0 = 110, by1 = 285;
  // particles
  const parts = [];
  if (cur.type === 'strong') for (let i = 0; i < 6; i++) for (const ion of cur.ions) parts.push({ ion: true, t: ion[0], q: ion[1] });
  else if (cur.type === 'weak') { for (let i = 0; i < 9; i++) parts.push({ ion: false, t: cur.mol }); for (const ion of cur.ions) parts.push({ ion: true, t: ion[0], q: ion[1] }); }
  else if (cur.type === 'non') for (let i = 0; i < 8; i++) parts.push({ ion: false, t: cur.mol });
  const r = rng(cur.k.length * 977 + cur.k.charCodeAt(0));
  const placed = [];
  for (const p of parts) {
    for (let tries = 0; tries < 300; tries++) {
      const x = bx0 + 24 + r() * (bx1 - bx0 - 48), y = by0 + 32 + r() * (by1 - by0 - 48);
      const wNew = p.ion ? 13 : 36;
      if (placed.every(o => Math.abs(o.x - x) > (wNew + (o.ion ? 13 : 36)) * 0.9 || Math.abs(o.y - y) > 26) && Math.abs(x - 120) > (p.ion ? 20 : 42) && Math.abs(x - 300) > (p.ion ? 20 : 42)) { placed.push({ ...p, x, y }); break; }
    }
  }
  const glow = { strong: 1, weak: 0.3, non: 0, none: 0 }[cur.type];
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  // wires and bulb
  s += `<path d="M 120 ${by0 + 60} L 120 40 L 146 40 M 158 40 L 194 40 M 226 40 L 300 40 L 300 ${by0 + 60}" fill="none" stroke="var(--text-muted)" stroke-width="2"/>`;
  s += `<line x1="146" y1="26" x2="146" y2="54" stroke="var(--text)" stroke-width="2"/><line x1="158" y1="32" x2="158" y2="48" stroke="var(--text)" stroke-width="4"/><text x="152" y="72" text-anchor="middle" font-size="11" fill="var(--text-muted)">battery</text>`;
  if (glow > 0) s += `<circle cx="210" cy="36" r="${18 + 16 * glow}" fill="#ffd54a" opacity="${0.25 * glow + 0.1}"/>`;
  s += `<circle cx="210" cy="36" r="16" fill="${glow ? '#ffd54a' : 'var(--surface)'}" fill-opacity="${glow ? 0.35 + 0.65 * glow : 1}" stroke="var(--text)" stroke-width="1.5"/>`;
  if (glow === 1) for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; s += `<line x1="${210 + 22 * Math.cos(a)}" y1="${36 + 22 * Math.sin(a)}" x2="${210 + 30 * Math.cos(a)}" y2="${36 + 30 * Math.sin(a)}" stroke="#e0a800" stroke-width="2"/>`; }
  // beaker
  s += `<rect x="${bx0}" y="${by0 + 14}" width="${bx1 - bx0}" height="${by1 - by0 - 14}" fill="var(--c1)" opacity=".10"/>`;
  s += `<path d="M ${bx0} ${by0 - 10} L ${bx0} ${by1} L ${bx1} ${by1} L ${bx1} ${by0 - 10}" fill="none" stroke="var(--text)" stroke-width="2"/>`;
  // electrodes
  s += `<rect x="114" y="${by0 + 4}" width="12" height="100" fill="var(--text-muted)"/><rect x="294" y="${by0 + 4}" width="12" height="100" fill="var(--text-muted)"/>`;
  s += `<text x="120" y="${by0 - 2}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--text-muted)">−</text><text x="300" y="${by0 - 2}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--text-muted)">+</text>`;
  for (const p of placed) {
    if (p.ion) {
      const col = p.q > 0 ? '--c0' : '--c1';
      s += `<circle cx="${p.x}" cy="${p.y}" r="13" fill="color-mix(in srgb, var(${col}) 30%, var(--surface))" stroke="var(${col})" stroke-width="1.5"/>`;
      s += `<text x="${p.x}" y="${p.y + 4}" text-anchor="middle" font-size="${p.t.length > 4 ? 7.5 : 10}" font-weight="600" fill="var(--text)">${p.t}</text>`;
    } else {
      s += `<rect x="${p.x - 34}" y="${p.y - 10}" width="68" height="20" rx="10" fill="color-mix(in srgb, var(--cB) 45%, var(--surface))" stroke="var(--text-muted)"/>`;
      s += `<text x="${p.x}" y="${p.y + 4}" text-anchor="middle" font-size="${p.t.length > 8 ? 8.5 : 10}" fill="var(--text)">${p.t}</text>`;
    }
  }
  $('el-diagram').innerHTML = s + '</svg>';
  $('el-eq').textContent = cur.eq;
  const note = {
    strong: `<strong>Strong electrolyte.</strong> ${cur.name} breaks up completely into ions. The ions carry the current, so the bulb glows brightly.${cur.ions.length > 2 ? ' Each formula unit gives three ions, so this solution conducts even better than NaCl at the same concentration.' : ''}`,
    weak: `<strong>Weak electrolyte.</strong> Most of the ${cur.name.split(',')[0]} stays as molecules; only a small fraction forms ions, so the bulb glows dimly. (One pair is drawn per ten molecules to make it visible; in reality it is about one in a hundred.)`,
    non: `<strong>Nonelectrolyte.</strong> ${cur.name[0].toUpperCase() + cur.name.slice(1)} dissolves as whole, neutral molecules. Nothing carries the current: the bulb stays dark, even though the solid has dissolved completely.`,
    none: '<strong>Pure water</strong> contains almost no ions, so the bulb stays dark. Tap water conducts a little because of dissolved salts (Ca²⁺, Mg²⁺, HCO₃⁻, …).',
  }[cur.type];
  $('el-note').innerHTML = note;
}
render();
