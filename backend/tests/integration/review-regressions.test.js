// Prepared regression checks; execution remains deferred by repository policy.
// Real SQL Server only. Every fixture and service call shares a guarded transaction
// which is rolled back; HTTP/session wrappers are outside these service checks.
const { randomUUID } = require('node:crypto');
const { createDatabase, withTransaction } = require('../../src/config/database');
const { verifyTestDatabase } = require('../../src/shared/test-guard');
const repo = require('../../src/shared/business-repository');
const inventoryRepo = require('../../src/modules/inventory/repository');
const { createInventoryService } = require('../../src/modules/inventory/service');
const { createWarehouseService } = require('../../src/modules/warehouse/service');
const { createQcService } = require('../../src/modules/qc/service');
const { createDispositionService } = require('../../src/modules/dispositions/service');
const { businessDate, now } = require('../../src/shared/business-context');
const { defaultExpiry } = require('../../src/shared/lot-expiry');
const url = process.env.TEST_DATABASE_URL;
let pool;
afterAll(async () => {
	if (pool) await pool.end();
});
async function isolated(run) {
	pool ??= createDatabase(url);
	const guard = (c) =>
		verifyTestDatabase(
			c,
			url,
			process.env.TEST_ALLOWED_ENDPOINTS,
			process.env.TEST_INSTANCE_ID
		);
	const rollback = new Error('ROLLBACK_REVIEW_FIXTURE'),
		prefix = 'review_' + randomUUID().slice(0, 8);
	await expect(
		withTransaction(
			pool,
			async (c) => {
				await guard(c);
				const fixture = await setup(c, prefix);
				await run(fixture);
				throw rollback;
			},
			{ beforeBegin: guard }
		)
	).rejects.toBe(rollback);
	expect(await repo.one(pool, 'Kho', { code: prefix + '_MATERIAL' })).toBeUndefined();
	expect(await repo.one(pool, 'KeHoachSanXuat', { code: prefix })).toBeUndefined();
}
async function setup(c, prefix) {
	const context = { read: (fn) => fn(c), write: (_req, _op, fn) => fn(c) };
	const inventory = createInventoryService(context),
		warehouse = createWarehouseService(context),
		qc = createQcService(context),
		dispositions = createDispositionService(context);
	const [[role]] = await c.execute(
		'INSERT INTO VaiTroQuyen(code,name) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES(?,?)',
		[prefix, prefix]
	);
	let staffPermission = (
		await c.execute("SELECT id FROM Quyen WHERE code='issues.postMaterial'")
	)[0][0];
	if (!staffPermission)
		staffPermission = (
			await c.execute(
				'INSERT INTO Quyen(code,description) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES(?,?)',
				['issues.postMaterial', 'Rollback regression fixture']
			)
		)[0][0];
	await c.execute('INSERT INTO VaiTro_Quyen(role_id,permission_id) VALUES(?,?)', [
		role.id,
		staffPermission.id
	]);
	async function account(suffix) {
		const [[row]] = await c.execute(
			'INSERT INTO TaiKhoan(code,login,password_hash,display_name,role_id,updated_at) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES(?,?,?,?,?,?)',
			[prefix + suffix, prefix + suffix, 'NOT_A_LOGIN_HASH', prefix + suffix, role.id, now()]
		);
		return row.id;
	}
	const manager = await account('_manager'),
		staff = await account('_staff'),
		other = await account('_other');
	const units = {};
	for (const code of ['KG', 'CAN'])
		units[code] =
			(await repo.one(c, 'DonViTinh', { code }))?.id ||
			(await repo.insert(c, 'DonViTinh', {
				code,
				name: code,
				dimension: code === 'KG' ? 'MASS' : 'COUNT',
				discrete: code !== 'KG',
				scale: code === 'KG' ? 6 : 0
			}));
	const kg = units.KG,
		can = units.CAN;
	const warehouses = {},
		locations = {};
	for (const type of ['MATERIAL', 'FINISHED', 'CONTROLLED']) {
		warehouses[type] = await repo.insert(c, 'Kho', {
			code: prefix + '_' + type,
			name: prefix,
			type,
			capacity: '10000',
			capacity_unit_id: kg,
			created_by_id: manager
		});
		locations[type] = await repo.insert(c, 'ViTriLuuKho', {
			code: prefix + '_' + type,
			name: prefix,
			warehouse_id: warehouses[type],
			capacity: '10000',
			capacity_unit_id: kg,
			storage_rule: 'DRY',
			created_by_id: manager
		});
		for (const id of [manager, staff, other])
			await c.execute('INSERT INTO TaiKhoan_Kho(account_id,warehouse_id) VALUES(?,?)', [
				id,
				warehouses[type]
			]);
	}
	const workshop = await repo.insert(c, 'XuongSanXuat', { code: prefix, name: prefix });
	await c.execute('INSERT INTO TaiKhoan_Xuong(account_id,workshop_id) VALUES(?,?)', [
		manager,
		workshop
	]);
	const product = await repo.insert(c, 'ThanhPham', {
		code: prefix,
		name: prefix,
		base_unit_id: can,
		container_type: 'CAN',
		volume_ml: '330',
		shelf_life_days: 365,
		created_by_id: manager
	});
	const packaging = await repo.insert(c, 'QuyCachDongGoi', {
		product_id: product,
		unit_id: can,
		revision: 1,
		units_per_pack: '1',
		effective_from: '2020-01-01',
		created_by_id: manager
	});
	const productLot = await repo.insert(c, 'LoThanhPham', {
		code: prefix,
		product_id: product,
		packaging_version_id: packaging,
		manufactured_on: businessDate(),
		expires_on: defaultExpiry(businessDate(), 365),
		created_by_id: manager
	});
	const material = await repo.insert(c, 'NguyenLieu', {
		code: prefix,
		name: prefix,
		base_unit_id: kg,
		requires_expiry: false,
		storage_condition: 'DRY',
		created_by_id: manager
	});
	const materialLot = await repo.insert(c, 'LoNguyenLieu', {
		code: prefix,
		material_id: material,
		manufactured_on: businessDate(),
		first_received_at: now(),
		created_by_id: manager
	});
	const factor = await repo.insert(c, 'HeSoChiemCho', {
		material_id: material,
		capacity_unit_id: kg,
		revision: 1,
		factor_per_base: '1',
		effective_at: '2020-01-01 00:00:00.000'
	});
	await repo.insert(c, 'HeSoChiemCho', {
		product_id: product,
		capacity_unit_id: kg,
		revision: 1,
		factor_per_base: '1',
		effective_at: '2020-01-01 00:00:00.000'
	});
	const balance = await repo.insert(c, 'TonKho', {
		location_id: locations.MATERIAL,
		material_lot_id: materialLot,
		quality_bucket: 'DAT',
		qty_on_hand: '100',
		capacity_factor_id: factor,
		capacity_factor_snapshot: '1'
	});
	const customer = await repo.insert(c, 'KhachHang', {
		code: prefix,
		name: prefix,
		updated_at: now()
	});
	const order = await repo.insert(c, 'DonHang', {
		code: prefix,
		customer_id: customer,
		due_date: businessDate(),
		delivery_address: 'Rollback fixture',
		recipient: prefix,
		recipient_phone: '000',
		status: 'XAC_NHAN',
		created_by_id: manager
	});
	const orderLine = await repo.insert(c, 'ChiTietDonHang', {
		order_id: order,
		line_no: 1,
		product_id: product,
		unit_id: can,
		packaging_id: packaging,
		qty_input: '100',
		factor_snapshot: '1',
		qty_base: '100'
	});
	const bom = await repo.insert(c, 'DinhMuc', {
		product_id: product,
		revision: 1,
		output_qty_base: '100',
		effective_from: '2020-01-01',
		created_by_id: manager
	});
	const bomLine = await repo.insert(c, 'ChiTietDinhMuc', {
		bom_id: bom,
		material_id: material,
		unit_id: kg,
		qty_per_output: '100'
	});
	const plan = await repo.insert(c, 'KeHoachSanXuat', {
		code: prefix,
		order_id: order,
		start_date: businessDate(),
		end_date: businessDate(),
		status: 'DA_DUYET',
		created_by_id: manager
	});
	const planLine = await repo.insert(c, 'ChiTietKeHoachSanXuat', {
		plan_id: plan,
		order_line_id: orderLine,
		product_id: product,
		workshop_id: workshop,
		bom_version_id: bom,
		qty_base: '100',
		start_date: businessDate(),
		end_date: businessDate()
	});
	const demand = await repo.insert(c, 'NhuCauNguyenLieuKHSX', {
		plan_line_id: planLine,
		bom_line_id: bomLine,
		material_id: material,
		unit_id: kg,
		qty_required: '100',
		snapshot_available: '100',
		shortage: '0',
		policy_revision: 'FS-20261015'
	});
	const materialRequest = await repo.insert(c, 'PhieuXuatKhoNguyenLieu', {
		code: prefix,
		plan_line_id: planLine,
		workshop_id: workshop,
		status: 'DA_GUI',
		created_by_id: manager
	});
	const requestLine = await repo.insert(c, 'ChiTietYeuCauXuatNL', {
		request_id: materialRequest,
		demand_id: demand,
		material_id: material,
		unit_id: kg,
		qty_base: '100'
	});
	await c.execute(
		'INSERT INTO PhanCongCapNguyenLieu(request_id,staff_id,warehouse_id,assigned_by_id) VALUES(?,?,?,?)',
		[materialRequest, staff, warehouses.MATERIAL, manager]
	);
	const principal = (id = manager) => ({
		accountId: id,
		customerId: null,
		warehouseIds: Object.values(warehouses),
		workshopIds: id === manager ? [workshop] : [],
		permissions:
			id === manager
				? [
						'issues.read',
						'issues.allocate',
						'issues.confirmAllocation',
						'receipts.read',
						'receipts.allocate',
						'receipts.confirmAllocation',
						'warehouses.write',
						'dispositions.create',
						'dispositions.execute'
					]
				: [
						'issues.postMaterial',
						'receipts.postProduct',
						'dispositions.decide',
						'productQc.write'
					]
	});
	const req = (body = {}, id, actor = manager) => ({
		body,
		params: id ? { id } : {},
		query: {},
		principal: principal(actor),
		correlationId: randomUUID()
	});
	// Savepoints restore failed service mutations; the outer transaction is the only commit boundary.
	async function rejected(callback, code) {
		await c.execute('SAVE TRANSACTION expected_rejection');
		try {
			await expect(callback()).rejects.toMatchObject({ code });
		} finally {
			await c.execute('ROLLBACK TRANSACTION expected_rejection');
		}
	}
	async function productQc(accepted = '100', rejectedQty = '0') {
		const request = await repo.insert(c, 'PhieuNhapKhoThanhPham', {
			code: prefix + '_TP',
			plan_line_id: planLine,
			workshop_id: workshop,
			status: 'QC_HOAN_TAT',
			created_by_id: manager
		});
		const line = await repo.insert(c, 'ChiTietYeuCauNhapTP', {
			request_id: request,
			plan_line_id: planLine,
			product_lot_id: productLot,
			qty_completed: '100'
		});
		const header = await repo.insert(c, 'BienBanQCThanhPham', {
			source_id: request,
			status: 'DA_XAC_NHAN',
			confirmed_at: now(),
			created_by_id: manager
		});
		return repo.insert(c, 'ChiTietQCThanhPham', {
			qc_id: header,
			source_line_id: line,
			product_lot_id: productLot,
			batch_sequence: 1,
			qty_inspected: '100',
			qty_accepted: accepted,
			qty_rejected: rejectedQty
		});
	}
	const receiptBody = (line, quantity, kind = 'FINISHED', type = 'FINISHED') => ({
		kind,
		...(kind === 'REJECTED' ? { sourceQcType: 'PRODUCT' } : {}),
		warehouseId: warehouses[type],
		lines: [
			{
				qcLineId: line,
				lotKind: 'PRODUCT',
				lotId: productLot,
				locationId: locations[type],
				unitId: can,
				quantity
			}
		]
	});
	async function receive(line, quantity, kind = 'FINISHED', type = 'FINISHED') {
		const allocated = await inventory.allocate(
			'receipts',
			req(receiptBody(line, quantity, kind, type))
		);
		const confirmed = await inventory.command(
			'receipts',
			'confirmAllocation',
			req({ expectedVersion: allocated.version }, allocated.id)
		);
		return inventory.post(
			'receipts',
			kind === 'REJECTED' ? 'postRejected' : 'postProduct',
			req(
				{
					expectedVersion: confirmed.version,
					expectedAllocationVersion: confirmed.allocationVersion
				},
				confirmed.id,
				kind === 'REJECTED' ? manager : staff
			)
		);
	}
	return {
		c,
		prefix,
		repo,
		inventory,
		warehouse,
		qc,
		dispositions,
		manager,
		staff,
		other,
		principal,
		req,
		rejected,
		warehouses,
		locations,
		workshop,
		kg,
		can,
		plan,
		planLine,
		materialRequest,
		requestLine,
		materialLot,
		balance,
		productLot,
		productQc,
		receiptBody,
		receive
	};
}

test(
	'two held material issues remain receivable until both are physically posted',
	() =>
		isolated(async (f) => {
			const allocate = (quantity) =>
				f.inventory.allocate(
					'issues',
					f.req({
						kind: 'MATERIAL',
						warehouseId: f.warehouses.MATERIAL,
						sourceId: f.materialRequest,
						lines: [
							{
								sourceLineId: f.requestLine,
								lotKind: 'MATERIAL',
								lotId: f.materialLot,
								locationId: f.locations.MATERIAL,
								unitId: f.kg,
								quantity
							}
						]
					})
				);
			const first = await allocate('40'),
				second = await allocate('60');
			await f.c.execute('SAVE TRANSACTION draft_visibility');
			await repo.update(f.c, 'PhieuXuatKho', { id: second.id }, { status: 'DA_PHAN_BO' });
			await f.rejected(
				() => f.inventory.read('issues', f.req({}, second.id, f.staff)),
				'NOT_FOUND'
			);
			await f.rejected(
				() => f.inventory.reservations(f.req({}, second.id, f.staff)),
				'NOT_FOUND'
			);
			await f.c.execute('ROLLBACK TRANSACTION draft_visibility');
			expect(
				await inventoryRepo.issueUsed(f.c, 'material_request_line_id', f.requestLine, '0')
			).toBe('100.000000');
			const post = (doc) =>
				f.inventory.post(
					'issues',
					'postMaterial',
					f.req(
						{
							expectedVersion: doc.version,
							expectedAllocationVersion: doc.allocationVersion
						},
						doc.id,
						f.staff
					)
				);
			await post(first);
			expect(
				(await repo.one(f.c, 'PhieuXuatKhoNguyenLieu', { id: f.materialRequest })).status
			).toBe('DANG_CAP');
			expect(
				await inventoryRepo.issuePosted(f.c, 'material_request_line_id', f.requestLine)
			).toBe('40.000000');
			await f.rejected(
				() => f.inventory.reservations(f.req({}, second.id, f.other)),
				'MATERIAL_STAFF_ASSIGNMENT_REQUIRED'
			);
			expect(
				(await f.inventory.reservations(f.req({}, second.id, f.staff))).data
			).toHaveLength(1);
			await post(second);
			expect(
				(await repo.one(f.c, 'PhieuXuatKhoNguyenLieu', { id: f.materialRequest })).status
			).toBe('HOAN_THANH');
			expect((await repo.one(f.c, 'TonKho', { id: f.balance })).qty_on_hand).toBe('0.000000');
			expect((await repo.one(f.c, 'TonKho', { id: f.balance })).qty_reserved).toBe(
				'0.000000'
			);
			expect((await repo.one(f.c, 'KeHoachSanXuat', { id: f.plan })).status).toBe(
				'DANG_THUC_HIEN'
			);
		}),
	60000
);

test(
	'allocation enforces workshop scope while posting staff need warehouse scope only; plan completes at full intake',
	() =>
		isolated(async (f) => {
			const qcLine = await f.productQc();
			const denied = f.req(f.receiptBody(qcLine, '50'));
			denied.principal = { ...denied.principal, workshopIds: [] };
			await f.rejected(() => f.inventory.allocate('receipts', denied), 'WORKSHOP_SCOPE');
			await f.receive(qcLine, '50');
			expect((await repo.one(f.c, 'KeHoachSanXuat', { id: f.plan })).status).toBe(
				'DANG_THUC_HIEN'
			);
			await f.receive(qcLine, '50');
			expect((await repo.one(f.c, 'KeHoachSanXuat', { id: f.plan })).status).toBe(
				'HOAN_THANH'
			);
			const [[audit]] = await f.c.execute(
				"SELECT COUNT(*) AS n FROM AuditLog WHERE target_type='KeHoachSanXuat' AND target_id=? AND action='plans.progress'",
				[f.plan]
			);
			expect(audit.n).toBe(2);
		}),
	60000
);

test(
	'failed intake is excluded from plan completion; accepted rework is counted once from original plan',
	() =>
		isolated(async (f) => {
			const qcLine = await f.productQc('80', '20');
			await f.receive(qcLine, '80');
			await f.receive(qcLine, '20', 'REJECTED', 'CONTROLLED');
			expect((await repo.one(f.c, 'KeHoachSanXuat', { id: f.plan })).status).toBe(
				'DANG_THUC_HIEN'
			);
			const failed = await repo.one(f.c, 'TonKho', {
				location_id: f.locations.CONTROLLED,
				product_lot_id: f.productLot,
				quality_bucket: 'FAILED'
			});
			const created = await f.dispositions.create(
				f.req({
					sourceQcType: 'PRODUCT',
					sourceQcLineId: qcLine,
					method: 'REWORK',
					quantityBase: '20',
					reason: 'Rollback rework fixture',
					balanceId: failed.id
				})
			);
			const submitted = await f.dispositions.command(
				'submit',
				f.req({ expectedVersion: created.version }, created.id)
			);
			const approval = f.req(
				{ expectedVersion: submitted.version, decision: 'APPROVE' },
				created.id,
				f.other
			);
			approval.principal.workshopIds = [f.workshop];
			const approved = await f.dispositions.command('decide', approval);
			const executed = await f.dispositions.command(
				'execute',
				f.req({ expectedVersion: approved.version, balanceId: failed.id }, created.id)
			);
			const batch = executed.reworkBatches[0];
			const result = await f.qc.create(
				'productQc',
				f.req(
					{
						reworkBatchId: batch.id,
						lines: [
							{
								sourceLineId: batch.id,
								lotId: f.productLot,
								quantityInspectedBase: '20',
								acceptedBase: '20',
								rejectedBase: '0',
								batchSequence: 1
							}
						]
					},
					undefined,
					f.staff
				)
			);
			const confirmed = await f.qc.confirm(
				'productQc',
				f.req({ expectedVersion: result.version }, result.id, f.staff)
			);
			await f.receive(confirmed.lines[0].id, '20', 'FINISHED', 'CONTROLLED');
			expect((await repo.one(f.c, 'KeHoachSanXuat', { id: f.plan })).status).toBe(
				'HOAN_THANH'
			);
		}),
	60000
);

test(
	'PO receiving lookup works without workshop grants and excludes actors without warehouse scope',
	() =>
		isolated(async (f) => {
			const supplier = await repo.insert(f.c, 'NhaCungCap', {
				code: f.prefix,
				name: f.prefix
			});
			const purchase = await repo.insert(f.c, 'DonMuaNguyenLieu', {
				code: f.prefix,
				plan_id: f.plan,
				supplier_id: supplier,
				status: 'DA_DUYET',
				created_by_id: f.manager
			});
			const sources = require('../../src/modules/customers/source-repository');
			expect(f.principal(f.staff).workshopIds).toEqual([]);
			expect(
				(await sources.approved(f.c, 'purchases', f.staff)).some((p) => p.id === purchase)
			).toBe(true);
			await f.c.execute('DELETE FROM TaiKhoan_Kho WHERE account_id=?', [f.other]);
			expect(await sources.approved(f.c, 'purchases', f.other)).toEqual([]);
			await repo.update(f.c, 'DonMuaNguyenLieu', { id: purchase }, { status: 'NHAP' });
			expect(
				(await sources.approved(f.c, 'purchases', f.staff)).some((p) => p.id === purchase)
			).toBe(false);
		}),
	60000
);

test(
	'location lock commands protect fields, warehouse state, stale versions and retired locations',
	() =>
		isolated(async (f) => {
			const input = (body = {}) => ({
				...f.req(body, f.warehouses.FINISHED),
				params: { id: f.warehouses.FINISHED, locationId: f.locations.FINISHED }
			});
			const locked = await f.warehouse.locationCommand('lock', input({ expectedVersion: 0 }));
			await f.rejected(
				() =>
					f.warehouse.updateLocation(
						input({ expectedVersion: locked.version, name: 'changed' })
					),
				'INVALID_STATE'
			);
			await f.rejected(
				() => f.warehouse.locationCommand('unlock', input({ expectedVersion: 0 })),
				'STALE_VERSION'
			);
			const unlocked = await f.warehouse.locationCommand(
				'unlock',
				input({ expectedVersion: locked.version })
			);
			await f.rejected(
				() =>
					f.warehouse.updateLocation(
						input({ expectedVersion: unlocked.version, status: 'LOCKED' })
					),
				'LOCATION_STATUS_COMMAND_REQUIRED'
			);
			await repo.update(f.c, 'Kho', { id: f.warehouses.FINISHED }, { status: 'LOCKED' });
			await f.rejected(
				() =>
					f.warehouse.updateLocation(
						input({ expectedVersion: unlocked.version, name: 'changed' })
					),
				'INVALID_STATE'
			);
			await repo.update(f.c, 'Kho', { id: f.warehouses.FINISHED }, { status: 'ACTIVE' });
			const relocked = await f.warehouse.locationCommand(
				'lock',
				input({ expectedVersion: unlocked.version })
			);
			await repo.insert(f.c, 'PhieuChuyenViTri', {
				code: f.prefix,
				warehouse_id: f.warehouses.FINISHED,
				source_location_id: f.locations.FINISHED,
				created_by_id: f.manager,
				status: 'HOAN_THANH'
			});
			await f.rejected(
				() =>
					f.warehouse.locationCommand(
						'unlock',
						input({ expectedVersion: relocked.version })
					),
				'LOCATION_RETIRED'
			);
			expect((await repo.one(f.c, 'ViTriLuuKho', { id: f.locations.FINISHED })).name).toBe(
				f.prefix
			);
		}),
	60000
);
