const base = require('../../shared/business-repository');
const types = {
	MATERIAL: { kind: 'materialQc', field: 'material_qc_line_id' },
	PRODUCT: { kind: 'productQc', field: 'product_qc_line_id' },
	RETURN: { kind: 'returnQc', field: 'return_qc_line_id' }
};
async function claimed(c, field, lineId, exclude = '0') {
	if (!Object.values(types).some((t) => t.field === field)) throw new Error('INVALID_QC_FIELD');
	return (
		await c.execute(
			'SELECT COALESCE(SUM(qty_base),0) AS n FROM XuLyHangLoiTraVe WHERE ' +
				field +
				"=? AND id<>? AND status IN ('NHAP','CHO_DUYET','DA_DUYET','DA_THUC_HIEN')",
			[lineId, exclude]
		)
	)[0][0].n;
}
async function all(c, { status } = {}) {
	return (
		await c.execute(
			'SELECT * FROM XuLyHangLoiTraVe' +
				(status ? ' WHERE status=?' : '') +
				' ORDER BY id DESC',
			status ? [status] : []
		)
	)[0];
}
async function page(c, principal, { page = 1, pageSize = 20, status } = {}) {
	const from =
		` FROM XuLyHangLoiTraVe h
 LEFT JOIN BienBanQCNguyenLieu qm ON qm.id=(SELECT qc_id FROM ChiTietQCNguyenLieu WHERE id=h.material_qc_line_id)
 LEFT JOIN BienBanQCThanhPham qp ON qp.id=(SELECT qc_id FROM ChiTietQCThanhPham WHERE id=h.product_qc_line_id)
 LEFT JOIN KetQuaKiemTraHangTra qr ON qr.id=(SELECT qc_id FROM ChiTietQCHangTra WHERE id=h.return_qc_line_id)
 LEFT JOIN DotGiaoNguyenLieu sm ON sm.id=qm.source_id
 LEFT JOIN PhieuNhapKhoThanhPham sp ON sp.id=qp.source_id
 LEFT JOIN TiepNhanTra sr ON sr.id=qr.source_id
 LEFT JOIN DotTaiXuLy b ON b.id=COALESCE(qm.rework_batch_id,qp.rework_batch_id,qr.rework_batch_id)
 WHERE (EXISTS(SELECT 1 FROM TaiKhoan_Kho a WHERE a.account_id=? AND a.warehouse_id=COALESCE(b.warehouse_id,sm.warehouse_id,sr.warehouse_id))
 OR (b.id IS NULL AND EXISTS(SELECT 1 FROM TaiKhoan_Xuong a WHERE a.account_id=? AND a.workshop_id=sp.workshop_id)))` +
		(status ? ' AND h.status=?' : '');
	const params = [principal.accountId, principal.accountId, ...(status ? [status] : [])];
	const [[count]] = await c.execute('SELECT COUNT(*) AS n' + from, params);
	return {
		rows: (
			await c.execute(
				'SELECT h.*' +
					from +
					' ORDER BY h.id DESC OFFSET ' +
					(page - 1) * pageSize +
					' ROWS FETCH NEXT ' +
					pageSize +
					' ROWS ONLY',
				params
			)
		)[0],
		total: Number(count.n)
	};
}
module.exports = { ...base, types, claimed, all, page };
