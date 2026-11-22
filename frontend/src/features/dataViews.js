export const inventoryViews = [
	{
		label: 'Tồn theo lô/vị trí',
		endpoint: '/inventory',
		search: true,
		columns: [
			'warehouseId',
			'locationId',
			'itemName',
			'lotCode',
			'qualityBucket',
			'onHand',
			'reserved',
			'available',
			'expiresOn'
		]
	},
	{
		label: 'Sổ biến động',
		key: 'ledger',
		endpoint: '/inventory/ledger',
		dates: true,
		columns: [
			'createdAt',
			'warehouseId',
			'locationId',
			'lotId',
			'qualityBucket',
			'quantityDelta',
			'qtyBefore',
			'qtyAfter',
			'postingId',
			'reason'
		]
	}
];
export const reportViews = [
	{
		label: 'Hàng lỗi',
		endpoint: '/reports/inventory',
		params: { status: 'FAILED' },
		columns: ['warehouseId', 'itemKind', 'itemId', 'unitId', 'qualityBucket', 'onHand']
	},
	{
		label: 'Tồn theo kỳ',
		endpoint: '/reports/inventory',
		dates: true,
		requireDates: true,
		columns: [
			'warehouseId',
			'itemKind',
			'itemId',
			'unitId',
			'qualityBucket',
			'openingBase',
			'increasesBase',
			'decreasesBase',
			'closingBase'
		]
	},
	{
		label: 'Tổng hợp tồn',
		endpoint: '/reports/inventory',
		columns: [
			'warehouseId',
			'itemKind',
			'itemId',
			'unitId',
			'qualityBucket',
			'onHand',
			'reserved',
			'available'
		]
	},
	{
		label: 'Nhập / xuất / điều chỉnh',
		key: 'movements',
		endpoint: '/reports/movements',
		dates: true,
		columns: [
			'createdAt',
			'warehouseId',
			'quantityDelta',
			'qtyBefore',
			'qtyAfter',
			'receiptId',
			'issueId',
			'returnReceptionId',
			'adjustmentId',
			'dispositionId',
			'reason'
		]
	},
	{
		label: 'Hạn sử dụng',
		key: 'expiry',
		endpoint: '/reports/expiry',
		dates: true,
		columns: [
			'warehouseId',
			'locationId',
			'lotCode',
			'expiresOn',
			'daysRemaining',
			'qtyOnHand',
			'qualityBucket'
		]
	},
	{
		label: 'Chênh lệch kiểm kê',
		endpoint: '/reports/stocktake-variances',
		dates: true,
		columns: [
			'stocktakeCode',
			'warehouseId',
			'locationId',
			'itemId',
			'lotId',
			'qtySystem',
			'qtyCounted',
			'delta',
			'varianceRatio',
			'reason',
			'status'
		]
	},
	{
		label: 'Cảnh báo',
		key: 'alerts',
		endpoint: '/reports/alerts',
		columns: [
			'type',
			'warehouseId',
			'itemKind',
			'itemId',
			'lotId',
			'quantityBase',
			'availableBase',
			'thresholdBase',
			'daysRemaining',
			'idleDays'
		]
	}
];
