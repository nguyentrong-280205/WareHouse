const { AppError } = require('./http');
const ten = n => 10n ** BigInt(n);
function invalid() { throw new AppError(422, 'DECIMAL_INVALID', 'Số thập phân không hợp lệ hoặc vượt độ chính xác cho phép.'); }
function parse(value, scale = 6, precision = 20, signed = false) {
  if (typeof value !== 'string' || !(signed ? /^-?\d+(\.\d+)?$/ : /^\d+(\.\d+)?$/).test(value)) invalid();
  const negative = value.startsWith('-'), [whole, fraction = ''] = value.replace('-', '').split('.');
  if (fraction.length > scale || whole.replace(/^0+/, '').length > precision - scale) invalid();
  const n = BigInt(whole) * ten(scale) + BigInt(fraction.padEnd(scale, '0') || '0');
  if (n >= ten(precision)) invalid();
  return negative ? -n : n;
}
function format(n, scale = 6) {
  const sign = n < 0n ? '-' : '', abs = n < 0n ? -n : n;
  return sign + (abs / ten(scale)) + (scale ? '.' + (abs % ten(scale)).toString().padStart(scale, '0') : '');
}
function positive(value, scale = 6) { const n = parse(value, scale); if (n <= 0n) invalid(); return n; }
function ceilDivide(a, b) { if (a < 0n || b <= 0n) invalid(); return (a + b - 1n) / b; }
function money(quantity, price) {
  const raw = positive(quantity) * parse(price); // 12 fractional digits, no intermediate rounding.
  const amount = (raw + ten(12) / 2n) / ten(12);
  if (amount >= ten(20)) invalid();
  return amount.toString();
}
function convert(quantity, factor, discrete = false) {
  const raw = positive(quantity) * positive(factor, 9);
  if (raw % ten(9) !== 0n) invalid();
  const result = raw / ten(9);
  if (result >= ten(20) || (discrete && result % ten(6) !== 0n)) invalid();
  return format(result);
}
function demand(output, inputPerBatch, batchOutput, discrete) {
  const raw = positive(output) * positive(inputPerBatch), denominator = positive(batchOutput);
  const quantum = discrete ? ten(6) : 1n;
  const n = ceilDivide(raw, denominator * quantum) * quantum;
  if (n >= ten(20)) invalid();
  return format(n);
}
module.exports = { parse, format, positive, ceilDivide, money, convert, demand, ten };
