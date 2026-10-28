// Work directly with DECIMAL strings; never round quantities through Number.
export function formatQuantity(value, decimalSeparator = ',', groupThousands = decimalSeparator === ',') {
  if (value === null || value === undefined) return '—';
  const text = String(value);
  if (!/^-?\d+(\.\d+)?$/.test(text)) return text;
  const [whole, fraction = ''] = text.split('.');
  const tail = fraction.replace(/0+$/, '');
  return (groupThousands ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : whole) + (tail ? decimalSeparator + tail : '');
}
export const formatNumber = formatQuantity;
export const isMoneyField = key => /^(unitPrice|amount|totalAmount|estimatedUnitPrice|estimatedAmount|estimatedTotalAmount|priceBaseVnd)$/.test(key);
export const isQuantityField = key => /^(quantity.*|qty.*|.*Base|onHand|reserved|available|delta|unitsPerPack|cartonsPerPallet|volumeMl|capacity.*|conversionFactor|factor|outputQuantity.*)$/.test(key) && !isMoneyField(key);

export function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${value > 0 ? '+' : ''}${value}%`;
}
