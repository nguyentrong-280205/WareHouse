// FS01–FS12 approved by the user on 2026-10-15. Not authentication timeouts.
module.exports = Object.freeze({
  revision: 'FS-20261015', currency: 'VND', moneyRounding: 'HALF_UP_LINE', wastagePercent: '0',
  reservationMinutes: 120, reservationMaxMinutes: 240, reservationMaxRenewals: 1,
  stocktakeMode: 'FROZEN_SCOPE', stocktakeLeaseMinutes: 60, stocktakeMaxMinutes: 240,
  stocktakeRenewMinutes: 60, capacityReservations: false, capacityDimensions: ['MASS', 'CAPACITY_VOLUME'],
  expiryBoundary: 'END_OF_BUSINESS_DATE', businessTimeZone: 'Asia/Ho_Chi_Minh',
});
