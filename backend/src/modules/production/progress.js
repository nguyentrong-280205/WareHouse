const repo = require('../../shared/business-repository'),
	decimal = require('../../shared/decimal');
const { requireRow, now } = require('../../shared/business-context');

// Follow rework back to the original production completion. Returns never count
// as production, even when they concern the same SKU/lot.
async function lockReceiptPlans(c, qcLineIds) {
	const ids = [...new Set(qcLineIds.filter(Boolean).map(String))];
	if (!ids.length) return [];
	const [rows] = await c.execute(
		`WITH lineage AS(
 SELECT q.id,q.source_line_id,q.rework_batch_id FROM ChiTietQCThanhPham q WHERE q.id IN (${ids.map(() => '?').join(',')})
 UNION ALL
 SELECT parent.id,parent.source_line_id,parent.rework_batch_id FROM lineage l
 JOIN DotTaiXuLy b ON b.id=l.rework_batch_id
 JOIN XuLyHangLoiTraVe x ON x.id=b.disposition_id AND x.source_qc_type='PRODUCT'
 JOIN ChiTietQCThanhPham parent ON parent.id=x.product_qc_line_id
 ) SELECT DISTINCT p.plan_id FROM lineage l JOIN ChiTietYeuCauNhapTP r ON r.id=l.source_line_id
 JOIN ChiTietKeHoachSanXuat p ON p.id=r.plan_line_id`,
		ids
	);
	const planIds = rows
		.map((r) => String(r.plan_id))
		.sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1));
	for (const id of planIds)
		requireRow(await repo.one(c, 'KeHoachSanXuat', { id }, { lock: true }));
	return planIds;
}
async function change(c, plan, status, req) {
	if (plan.status === status || !['DA_DUYET', 'DANG_THUC_HIEN'].includes(plan.status)) return;
	const values = { status, version: plan.version + 1, updated_at: now() };
	await repo.update(c, 'KeHoachSanXuat', { id: plan.id }, values);
	await repo.audit(
		c,
		req.principal,
		'plans.progress',
		'KeHoachSanXuat',
		plan.id,
		plan,
		{ ...plan, ...values },
		req.correlationId
	);
}
async function markStarted(c, planId, req) {
	const plan = requireRow(await repo.one(c, 'KeHoachSanXuat', { id: planId }, { lock: true }));
	if (plan.status === 'DA_DUYET') await change(c, plan, 'DANG_THUC_HIEN', req);
}
async function refresh(c, planIds, req) {
	for (const id of planIds) {
		const plan = requireRow(await repo.one(c, 'KeHoachSanXuat', { id }, { lock: true }));
		if (!['DA_DUYET', 'DANG_THUC_HIEN'].includes(plan.status)) continue;
		const [received] = await c.execute(
			`WITH lineage AS(
   SELECT q.id AS qc_line_id,r.plan_line_id FROM ChiTietQCThanhPham q
   JOIN ChiTietYeuCauNhapTP r ON r.id=q.source_line_id
   JOIN ChiTietKeHoachSanXuat p ON p.id=r.plan_line_id WHERE p.plan_id=?
   UNION ALL
   SELECT child.id,parent.plan_line_id FROM lineage parent
   JOIN XuLyHangLoiTraVe x ON x.product_qc_line_id=parent.qc_line_id AND x.source_qc_type='PRODUCT'
   JOIN DotTaiXuLy b ON b.disposition_id=x.id
   JOIN ChiTietQCThanhPham child ON child.rework_batch_id=b.id
  ) SELECT origin.plan_line_id,SUM(l.qty_base) AS received_base FROM lineage origin
  JOIN ChiTietQCThanhPham q ON q.id=origin.qc_line_id
  JOIN BienBanQCThanhPham qc ON qc.id=q.qc_id AND qc.status='DA_XAC_NHAN'
  JOIN ChiTietPhieuNhap l ON l.product_qc_line_id=q.id
  JOIN PhieuNhapKho h ON h.id=l.receipt_id AND l.generation=h.allocation_generation
   AND h.kind='FINISHED' AND h.status='HOAN_THANH'
  GROUP BY origin.plan_line_id`,
			[id]
		);
		const totals = new Map(
			received.map((r) => [String(r.plan_line_id), decimal.parse(r.received_base)])
		);
		const lines = await repo.find(c, 'ChiTietKeHoachSanXuat', { plan_id: id });
		const complete =
			lines.length > 0 &&
			lines.every((l) => (totals.get(String(l.id)) || 0n) >= decimal.parse(l.qty_base));
		if (complete) await change(c, plan, 'HOAN_THANH', req);
		else if (received.length) await change(c, plan, 'DANG_THUC_HIEN', req);
	}
}
module.exports = { lockReceiptPlans, markStarted, refresh };
