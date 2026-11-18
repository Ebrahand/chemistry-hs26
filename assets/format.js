// Number and unit formatting shared by the interactive pages.

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const superscript = n => (n < 0 ? '⁻' : '') + [...String(Math.abs(n))].map(c => SUP[c]).join('');

// x with `digits` significant figures; very large or small values in ×10ⁿ form.
export function sig(x, digits = 3) {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  if (Math.abs(x) >= 1000 && Math.abs(x) < 1e4) return String(Math.round(x)).replace('-', '−');
  if (Math.abs(x) >= 1e4 || Math.abs(x) < 1e-3) return sci(x, digits);
  return x.toPrecision(digits).replace('-', '−');
}

// Always scientific: 2.41×10⁻³
export function sci(x, digits = 3) {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  const [mant, exp] = x.toExponential(digits - 1).split('e');
  const e = +exp;
  return (e === 0 ? mant : `${mant}×10${superscript(e)}`).replace('-', '−');
}

// Read a number typed by a student: accepts "0,012", "1.2e-3", "1.2×10^-3", "1.2 x 10-3", "−0.5".
export function parseNumber(s) {
  const t = String(s).trim().replace(/\s+/g, '').replace(',', '.').replace(/[−–]/g, '-')
    .replace(/[×xX*]10\^?/, 'e');
  return t === '' ? NaN : Number(t);
}

// Units of k for a reaction of the given overall order: M^(1−order) s⁻¹
export function kUnit(order) {
  const p = 1 - order;
  if (p === 0) return 's⁻¹';
  if (p === 1) return 'M s⁻¹';
  return `M${superscript(p)} s⁻¹`;
}
