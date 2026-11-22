const repo = require('./repository'),
	d = require('../../shared/decimal');
const { requireRow, expectState, scope, fail } = require('../../shared/business-context');

// Uses the same candidates and source quota as confirmation; never creates a hold.
async function suggestions(c, req) {
	const warehouseId = req.query.warehouseId;
	scope(req.principal, warehouseId);
	const warehouse = requireRow(await repo.one(c, 'Kho', { id: warehouseId }));
	expectState(warehouse, ['ACTIVE']);
	if (!['FINISHED', 'CONTROLLED'].includes(warehouse.type))
		fail(422, 'WAREHOUSE_TYPE', 'Chọn kho thành phẩm phù hợp.');
	const order = requireRow(await repo.one(c, 'DonHang', { id: req.params.id }));
	expectState(order, ['XAC_NHAN', 'DANG_GIAO']);
	const stockByProduct = new Map(),
		balances = [],
		lines = [],
		shortages = [];
	for (const source of await repo.find(c, 'ChiTietDonHang', { order_id: order.id })) {
		const product = requireRow(await repo.one(c, 'ThanhPham', { id: source.product_id }));
		const unit = requireRow(await repo.one(c, 'DonViTinh', { id: product.base_unit_id }));
		const productId = String(product.id);
		if (!stockByProduct.has(productId)) {
			const available = [];
			for (const stock of await repo.candidates(c, warehouseId, 'PRODUCT', product.id)) {
				const qty = d.parse(stock.qty_on_hand) - d.parse(stock.qty_reserved);
				if (qty <= 0n) continue;
				const lot = requireRow(
					await repo.one(c, 'LoThanhPham', { id: stock.product_lot_id })
				);
				available.push({ stock, remaining: qty, lot });
				balances.push({
					id: String(stock.id),
					warehouseId: String(warehouseId),
					locationId: String(stock.location_id),
					lotKind: 'PRODUCT',
					qualityBucket: 'DAT',
					lotId: String(lot.id),
					itemId: productId,
					itemCode: product.code,
					itemName: product.name,
					lotCode: lot.code,
					unitId: String(unit.id),
					available: d.format(qty),
					expiresOn: lot.expires_on
				});
			}
			stockByProduct.set(productId, available);
		}
		const used = d.parse(await repo.issueUsed(c, 'order_line_id', source.id, '0'));
		const quantity = d.parse(source.qty_base),
			remaining = quantity > used ? quantity - used : 0n;
		let outstanding = remaining;
		for (const candidate of stockByProduct.get(productId)) {
			const take = outstanding < candidate.remaining ? outstanding : candidate.remaining;
			if (take <= 0n) continue;
			lines.push({
				sourceLineId: String(source.id),
				lotKind: 'PRODUCT',
				balanceId: String(candidate.stock.id),
				lotId: String(candidate.lot.id),
				locationId: String(candidate.stock.location_id),
				unitId: String(unit.id),
				quantity: d.format(take)
			});
			candidate.remaining -= take;
			outstanding -= take;
			if (!outstanding) break;
		}
		if (outstanding > 0n)
			shortages.push({
				sourceLineId: String(source.id),
				productCode: product.code,
				productName: product.name,
				unitName: unit.name,
				remainingBase: d.format(outstanding),
				hasPartial: outstanding < remaining
			});
	}
	return {
		data: {
			orderId: String(order.id),
			warehouseId: String(warehouseId),
			lines,
			balances,
			shortages
		}
	};
}
module.exports = { suggestions };
