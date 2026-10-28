<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

# Danh mục mã nguồn/API/schema — 16/10/2026

**DA_CODE_CHUA_TEST.** Inventory từ mã nguồn hiện có; không là kết quả kiểm thử hoặc Git diff. Xem [bàn giao](full_system_handoff.md) cho đối chiếu29UC, luồng thao tác và giới hạn.

## API đã bind

Tiền tố `/api/v1`. Auth login/me/logout được bind riêng trong auth/routes. Health `/health`, `/api/v1/health`; Swagger `/docs`. Danh sách dưới chứa 151 handler nghiệp vụ.

| Method/path | Operation | UC | Quyền (một trong) |
|---|---|---|---|
| GET `/materials` | materials.list | UC10 | materials.read |
| POST `/materials` | materials.create | UC10 | materials.write |
| PUT `/materials/{id}` | materials.update | UC10 | materials.write |
| GET `/materials/{id}` | materials.read | UC10 | materials.read |
| POST `/materials/{id}/lock` | materials.lock | UC10 | materials.write |
| GET `/products` | products.list | UC25 | products.read |
| POST `/products` | products.create | UC25 | products.write |
| PUT `/products/{id}` | products.update | UC25 | products.write |
| GET `/products/{id}` | products.read | UC25 | products.read |
| POST `/products/{id}/lock` | products.lock | UC25 | products.write |
| GET `/warehouses` | warehouses.list | UC19 | warehouses.read |
| POST `/warehouses` | warehouses.create | UC19 | warehouses.write |
| PUT `/warehouses/{id}` | warehouses.update | UC19 | warehouses.write |
| GET `/warehouses/{id}` | warehouses.read | UC19 | warehouses.read |
| POST `/warehouses/{id}/lock` | warehouses.lock | UC19 | warehouses.write |
| GET `/material-lots` | materialLots.list | UC30 | materialLots.read |
| POST `/material-lots` | materialLots.create | UC30 | materialLots.write |
| PUT `/material-lots/{id}` | materialLots.update | UC30 | materialLots.write |
| GET `/material-lots/{id}` | materialLots.read | UC30 | materialLots.read |
| POST `/material-lots/{id}/lock` | materialLots.lock | UC30 | materialLots.write |
| GET `/product-lots` | productLots.list | UC20 | productLots.read |
| POST `/product-lots` | productLots.create | UC20 | productLots.write |
| PUT `/product-lots/{id}` | productLots.update | UC20 | productLots.write |
| GET `/product-lots/{id}` | productLots.read | UC20 | productLots.read |
| POST `/product-lots/{id}/lock` | productLots.lock | UC20 | productLots.write |
| GET `/warehouses/{id}/locations` | locations.list | UC19 | warehouses.read, receipts.read, receipts.allocate, issues.read, issues.allocate |
| POST `/warehouses/{id}/locations` | warehouses.createLocation | UC19 | warehouses.write |
| GET `/orders` | orders.list | UC11 | orders.read |
| POST `/orders` | orders.create | UC11 | orders.create |
| GET `/orders/{id}` | orders.read | UC11 | orders.read |
| POST `/orders/{id}/submit` | orders.submit | UC11 | orders.submit |
| GET `/production-plans` | plans.list | UC02 | plans.read, plans.decide |
| POST `/production-plans` | plans.create | UC02 | plans.create |
| GET `/production-plans/{id}` | plans.read | UC02 | plans.read, plans.decide |
| GET `/purchases` | purchases.list | UC26 | purchases.read, purchases.decide |
| POST `/purchases` | purchases.create | UC26 | purchases.create |
| GET `/purchases/{id}` | purchases.read | UC26 | purchases.read, purchases.decide |
| POST `/purchases/{id}/submit` | purchases.submit | UC26 | purchases.submit |
| GET `/material-requests` | materialRequests.list | UC22 | materialRequests.read |
| POST `/material-requests` | materialRequests.create | UC22 | materialRequests.create |
| GET `/material-requests/{id}` | materialRequests.read | UC22 | materialRequests.read |
| POST `/material-requests/{id}/submit` | materialRequests.submit | UC22 | materialRequests.submit |
| GET `/product-requests` | productRequests.list | UC24 | productRequests.read |
| POST `/product-requests` | productRequests.create | UC24 | productRequests.create |
| GET `/product-requests/{id}` | productRequests.read | UC24 | productRequests.read |
| POST `/product-requests/{id}/submit` | productRequests.submit | UC24 | productRequests.submit |
| POST `/production-plans/{id}/decision` | plans.decide | UC03 | plans.decide |
| POST `/purchases/{id}/decision` | purchases.decide | UC27 | purchases.decide |
| GET `/qc/materials` | materialQc.list | UC29 | materialQc.read |
| POST `/qc/materials` | materialQc.create | UC29 | materialQc.write |
| POST `/qc/materials/{id}/confirm` | materialQc.confirm | UC29 | materialQc.write |
| GET `/qc/products` | productQc.list | UC04 | productQc.read |
| POST `/qc/products` | productQc.create | UC04 | productQc.write |
| POST `/qc/products/{id}/confirm` | productQc.confirm | UC04 | productQc.write |
| GET `/qc/returns` | returnQc.list | UC14 | returnQc.read |
| POST `/qc/returns` | returnQc.create | UC14 | returnQc.write |
| POST `/qc/returns/{id}/confirm` | returnQc.confirm | UC14 | returnQc.write |
| GET `/receipts` | receipts.list | UC13 | receipts.read, receipts.postMaterial, receipts.postProduct, receipts.postReturn |
| POST `/receipts` | receipts.allocate | UC13 | receipts.allocate |
| GET `/receipts/{id}` | receipts.read | UC13 | receipts.read, receipts.postMaterial, receipts.postProduct, receipts.postReturn |
| PUT `/receipts/{id}` | receipts.updateAllocation | UC13 | receipts.allocate |
| POST `/receipts/{id}/confirm-allocation` | receipts.confirmAllocation | UC13 | receipts.confirmAllocation |
| POST `/receipts/{id}/reopen-allocation` | receipts.reopen | UC13 | receipts.allocate |
| POST `/receipts/{id}/cancel` | receipts.cancel | UC13 | receipts.allocate |
| GET `/issues` | issues.list | UC15 | issues.read, issues.postMaterial, issues.postSale |
| POST `/issues` | issues.allocate | UC15 | issues.allocate |
| GET `/issues/{id}` | issues.read | UC15 | issues.read, issues.postMaterial, issues.postSale |
| PUT `/issues/{id}` | issues.updateAllocation | UC15 | issues.allocate |
| POST `/issues/{id}/confirm-allocation` | issues.confirmAllocation | UC15 | issues.confirmAllocation |
| POST `/issues/{id}/reopen-allocation` | issues.reopen | UC15 | issues.allocate |
| POST `/issues/{id}/cancel` | issues.cancel | UC15 | issues.allocate |
| POST `/receipts/{id}/post-material` | receipts.postMaterial | UC21 | receipts.postMaterial |
| POST `/receipts/{id}/post-product` | receipts.postProduct | UC16 | receipts.postProduct |
| POST `/receipts/{id}/post-return` | receipts.postReturn | UC17 | receipts.postReturn |
| POST `/issues/{id}/post-material` | issues.postMaterial | UC23 | issues.postMaterial |
| POST `/issues/{id}/post-sale` | issues.postSale | UC12 | issues.postSale |
| GET `/inventory` | inventory.search | UC06 | inventory.search |
| GET `/inventory/ledger` | inventory.ledger | UC06 | inventory.search |
| POST `/dispositions` | dispositions.create | UC18 | dispositions.create |
| GET `/dispositions` | dispositions.list | UC18 | dispositions.create, dispositions.decide, dispositions.execute |
| POST `/dispositions/{id}/submit` | dispositions.submit | UC18 | dispositions.create |
| POST `/dispositions/{id}/decision` | dispositions.decide | UC18 | dispositions.decide |
| POST `/dispositions/{id}/execute` | dispositions.execute | UC18 | dispositions.execute |
| POST `/stocktakes` | stocktakes.create | UC07 | stocktakes.create |
| GET `/stocktakes` | stocktakes.list | UC07 | stocktakes.create, stocktakes.count, stocktakes.confirm, variances.verify, adjustments.decide |
| POST `/stocktakes/{id}/cutoff` | stocktakes.cutoff | UC07 | stocktakes.create |
| POST `/stocktakes/{id}/counts` | stocktakes.count | UC07 | stocktakes.count |
| POST `/stocktakes/{id}/counts/{countId}/submit` | stocktakes.submitCount | UC07 | stocktakes.count |
| POST `/stocktakes/{id}/confirm` | stocktakes.confirm | UC07 | stocktakes.confirm |
| POST `/stocktake-variances/{id}/verify` | variances.verify | UC08 | variances.verify |
| POST `/adjustments/{id}/decision` | adjustments.decide | UC09 | adjustments.decide |
| GET `/reports/inventory` | reports.inventory | UC05 | reports.read |
| GET `/reports/movements` | reports.movements | UC05 | reports.read |
| GET `/reports/expiry` | reports.expiry | UC05 | reports.read |
| GET `/reports/stocktake-variances` | reports.stocktake-variances | UC05 | reports.read |
| GET `/reports/alerts` | reports.alerts | UC05 | reports.read |
| GET `/issues/{id}/reservations` | reservations.read | UC15 | issues.read, issues.postMaterial, issues.postSale |
| POST `/issues/{id}/release-reservations` | reservations.release | UC15 | issues.allocate |
| POST `/issues/{id}/renew-reservations` | reservations.renew | UC15 | reservations.renew |
| GET `/qc/materials/{id}` | materialQc.read | UC29 | materialQc.read |
| GET `/qc/products/{id}` | productQc.read | UC04 | productQc.read |
| GET `/qc/returns/{id}` | returnQc.read | UC14 | returnQc.read |
| POST `/deliveries/{id}/confirm` | deliveries.confirm | UC12 | deliveries.confirm |
| POST `/return-requests` | returnRequests.create | UC14 | returnRequests.create |
| GET `/return-requests` | returnRequests.list | UC14 | returnRequests.create, returnQc.read, returnReceptions.post, unknownReturns.resolve, unknownReturns.resolve |
| POST `/return-receptions` | returnReceptions.post | UC14 | returnReceptions.post |
| GET `/return-receptions` | returnReceptions.list | UC14 | returnReceptions.post, returnQc.read |
| POST `/stocktakes/{id}/cancel` | stocktakes.cancel | UC07 | stocktakes.cancel |
| POST `/stocktakes/{id}/renew-locks` | stocktakes.renewLocks | UC07 | stocktakes.renew |
| GET `/products/{id}/bom-versions` | bomVersions.list | UC02 | plans.read, plans.create |
| GET `/production-plans/{id}/material-demands` | plans.materialDemands | UC03 | plans.read, plans.decide |
| GET `/lookups/units` | lookups.units | UC10 | materials.read, products.write, warehouses.write, materialLots.write, productLots.write, orders.create, purchases.create, stocktakes.count, materialQc.write, productQc.write, returnQc.write, receipts.allocate, issues.allocate, returnReceptions.post, unknownReturns.resolve, reports.read |
| GET `/lookups/products` | lookups.products | UC11 | orders.create, plans.create, productRequests.create, returnReceptions.post |
| GET `/lookups/materials` | lookups.materials | UC26 | purchases.create, materialRequests.create, plans.create |
| GET `/lookups/workshops` | lookups.workshops | UC02 | plans.create |
| GET `/lookups/suppliers` | lookups.suppliers | UC26 | purchases.create |
| GET `/lookups/orders` | lookups.orders | UC02 | plans.create |
| GET `/lookups/plan-lines` | lookups.planLines | UC22 | materialRequests.create, productRequests.create |
| POST `/purchases/{id}/deliveries` | materialDeliveries.create | UC29 | receipts.postMaterial |
| GET `/reports/alert-rules` | reports.alertRules | UC05 | reports.read |
| POST `/reports/alert-rules` | reports.configureAlert | UC05 | reports.configureAlerts |
| GET `/deliveries` | deliveries.list | UC12 | deliveries.confirm, returnRequests.create |
| GET `/deliveries/{id}` | deliveries.read | UC12 | deliveries.confirm, returnRequests.create |
| GET `/return-requests/{id}` | returnRequests.read | UC14 | returnRequests.create, returnQc.read, returnReceptions.post, unknownReturns.resolve, unknownReturns.resolve |
| GET `/return-receptions/{id}` | returnReceptions.read | UC14 | returnReceptions.post, returnQc.read |
| GET `/dispositions/{id}` | dispositions.read | UC18 | dispositions.create, dispositions.decide, dispositions.execute |
| GET `/stocktakes/{id}` | stocktakes.read | UC07 | stocktakes.create, stocktakes.count, stocktakes.confirm, variances.verify, adjustments.decide |
| POST `/evidence` | evidence.create | UC07 | stocktakes.count, variances.verify, deliveries.confirm, unknownReturns.resolve |
| GET `/evidence/{id}` | evidence.read | UC07 | stocktakes.count, variances.verify, deliveries.confirm, unknownReturns.resolve, adjustments.decide |
| GET `/unknown-returns` | unknownReturns.list | UC14 | returnReceptions.post, unknownReturns.resolve |
| POST `/unknown-returns` | unknownReturns.create | UC14 | returnReceptions.post |
| GET `/unknown-returns/{id}` | unknownReturns.read | UC14 | returnReceptions.post, unknownReturns.resolve |
| POST `/unknown-returns/{id}/resolve` | unknownReturns.resolve | UC14 | unknownReturns.resolve |
| POST `/receipts/{id}/post-rejected` | receipts.postRejected | UC18 | dispositions.execute |
| GET `/lookups/material-deliveries` | lookups.material-deliveries | UC29 | materialQc.read, materialQc.write, receipts.allocate |
| GET `/lookups/qc-sources` | lookups.qc-sources | UC04 | materialQc.write, productQc.write, returnQc.write |
| GET `/lookups/allocation-sources` | lookups.allocation-sources | UC13 | receipts.allocate, issues.allocate |
| GET `/lookups/rework-batches` | lookups.rework-batches | UC18 | materialQc.read, productQc.read, returnQc.read, materialQc.write, productQc.write, returnQc.write, dispositions.create |
| GET `/lookups/count-members` | lookups.count-members | UC07 | stocktakes.create |
| GET `/lookups/approved-plans` | lookups.approved-plans | UC26 | purchases.create |
| GET `/lookups/warehouses` | lookups.warehouses | UC19 | receipts.allocate, receipts.postMaterial, receipts.postProduct, receipts.postReturn, issues.allocate, issues.postMaterial, issues.postSale, stocktakes.create, returnReceptions.post, unknownReturns.resolve, reports.read, reports.configureAlerts, inventory.search |
| GET `/lookups/product-lots` | lookups.product-lots | UC24 | productRequests.create, productLots.write |
| GET `/lookups/count-lots` | lookups.count-lots | UC07 | stocktakes.count |
| GET `/lookups/material-lots` | lookups.material-lots | UC29 | receipts.postMaterial |
| GET `/lookups/alert-items` | lookups.alert-items | UC05 | reports.configureAlerts |
| GET `/lookups/approved-purchases` | lookups.approved-purchases | UC29 | receipts.postMaterial |
| GET `/material-deliveries` | materialDeliveries.list | UC29 | receipts.postMaterial, materialQc.read, receipts.allocate |
| POST `/material-deliveries` | materialDeliveries.register | UC29 | receipts.postMaterial |
| GET `/material-deliveries/{id}` | materialDeliveries.read | UC29 | receipts.postMaterial, materialQc.read, receipts.allocate |
| PUT `/warehouses/{id}/locations/{locationId}` | warehouses.updateLocation | UC19 | warehouses.write |

## SQL Server migration và bảng

Runtime dùng Microsoft SQL Server Windows + mssql. Native T-SQL lineage202610160001_native_schema đã APPLIED trên dev/test; 76 bảng/237FK. [Manifest schema thực tế](sqlserver_schema_manifest.md), [hướng dẫn chạy/SSMS](sqlserver_runbook.md). MySQL20261012/20261015 và Prisma chỉ archive nguyên byte, không chạy trên SQL Server. Không chạy test tự động;29UC DA_CODE_CHUA_TEST.

| Migration T-SQL | Bảng khai báo CREATE TABLE |
|---|---|
| `202610160001_native_schema.sql` | `KhachHang`, `VaiTroQuyen`, `Quyen`, `VaiTro_Quyen`, `TaiKhoan`, `PhienDangNhap`, `AuditLog`, `IdempotencyRequest`, `DonViTinh`, `NguyenLieu`, `ThanhPham`, `QuyCachDongGoi`, `GiaBanThanhPham`, `Kho`, `ViTriLuuKho`, `TaiKhoan_Kho`, `XuongSanXuat`, `TaiKhoan_Xuong`, `NhaCungCap`, `LoNguyenLieu`, `LoThanhPham`, `HeSoChiemCho`, `DinhMuc`, `ChiTietDinhMuc`, `LichNangLucXuong`, `DonHang`, `ChiTietDonHang`, `KeHoachSanXuat`, `ChiTietKeHoachSanXuat`, `PhanBoLichSanXuat`, `NhuCauNguyenLieuKHSX`, `DonMuaNguyenLieu`, `ChiTietDonMuaNguyenLieu`, `PhanBoMuaChoNhuCau`, `PhieuXuatKhoNguyenLieu`, `ChiTietYeuCauXuatNL`, `PhieuNhapKhoThanhPham`, `ChiTietYeuCauNhapTP`, `DotGiaoNguyenLieu`, `ChiTietGiaoNL`, `PhieuXuatKho`, `ChiTietPhieuXuat`, `DotGiaoHang`, `ChiTietGiaoHang`, `YeuCauTraHang`, `ChiTietTraHang`, `TiepNhanTra`, `ChiTietTiepNhanTra`, `BienBanQCNguyenLieu`, `ChiTietQCNguyenLieu`, `BienBanQCThanhPham`, `ChiTietQCThanhPham`, `KetQuaKiemTraHangTra`, `ChiTietQCHangTra`, `PhieuNhapKho`, `ChiTietPhieuNhap`, `TonKho`, `DatGiuTon`, `BienBanKiemKe`, `KhoaViTriKiemKe`, `StockPosting`, `LichSuBienDongTon`, `PhamViKiemKe`, `ThanhVienKiemKe`, `SnapshotKiemKe`, `LanDemKiemKe`, `ChiTietLanDem`, `ChiTietKiemKe`, `XuLyChenhLech`, `DeNghiDieuChinhTon`, `BangChung`, `TiepNhanChuaDinhDanh`, `XuLyHangLoiTraVe`, `CauHinhNghiepVu`, `DotTaiXuLy`, `PhanBoTonDuKien`; ALTER `dbo` |

## Cấu trúc backend và file nguồn

```text
backend/src/
  config/                 environment, pool mssql, transaction
  modules/auth/           session/CSRF/RBAC/Argon2id
  modules/health/         readiness
  modules/warehouse/      catalogs/lots/warehouses/locations
  modules/customers/      scoped read lookups/source helpers
  modules/orders/         customer orders and price snapshots
  modules/production/     KHSX/BOM/calendar/demands/requests/forecast
  modules/purchasing/     PO and maker-checker
  modules/qc/             material/product/return QC and deliveries
  modules/inventory/      allocation/reservation/posting/ledger/maintenance
  modules/returns/        delivery/return/reception/unidentified intake
  modules/dispositions/   approved disposal/return/rework
  modules/stocktake/      immutable counts/verification/adjustment/leases
  modules/reports/        reports and alert revisions
  modules/evidence/       private evidence upload/download
  shared/                 decimal/policy/validation/idempotency/error
backend/database/         immutable SQL versions + guarded runner
backend/scripts/          migration, explicit seed and syntax/docs tools
backend/prisma/           DA_THAY_THE archive, not runtime
frontend/src/features/    forms/tables/detail/stocktake/reports/live overview
infra/                    Compose, Dockerfiles, nginx, SQL Server host secrets (MySQL archive)
```

File inventory (không chứa node_modules/dist/uploads/.artifacts/secrets hoặc archive):

- `backend/src/app.js`
- `backend/src/business.js`
- `backend/src/config/database.js`
- `backend/src/config/environment.js`
- `backend/src/modules/auth/controller.js`
- `backend/src/modules/auth/middleware.js`
- `backend/src/modules/auth/password.js`
- `backend/src/modules/auth/repository.js`
- `backend/src/modules/auth/routes.js`
- `backend/src/modules/auth/scope-repository.js`
- `backend/src/modules/auth/security.js`
- `backend/src/modules/auth/service.js`
- `backend/src/modules/auth/simple-demo.js`
- `backend/src/modules/customers/controller.js`
- `backend/src/modules/customers/repository.js`
- `backend/src/modules/customers/service.js`
- `backend/src/modules/customers/source-controller.js`
- `backend/src/modules/customers/source-repository.js`
- `backend/src/modules/customers/source-service.js`
- `backend/src/modules/dispositions/controller.js`
- `backend/src/modules/dispositions/repository.js`
- `backend/src/modules/dispositions/service.js`
- `backend/src/modules/evidence/controller.js`
- `backend/src/modules/evidence/service.js`
- `backend/src/modules/health/controller.js`
- `backend/src/modules/health/repository.js`
- `backend/src/modules/health/routes.js`
- `backend/src/modules/health/service.js`
- `backend/src/modules/inventory/controller.js`
- `backend/src/modules/inventory/maintenance-repository.js`
- `backend/src/modules/inventory/maintenance.js`
- `backend/src/modules/inventory/repository.js`
- `backend/src/modules/inventory/service.js`
- `backend/src/modules/inventory/stock-service.js`
- `backend/src/modules/orders/controller.js`
- `backend/src/modules/orders/repository.js`
- `backend/src/modules/orders/service.js`
- `backend/src/modules/production/controller.js`
- `backend/src/modules/production/forecast-repository.js`
- `backend/src/modules/production/repository.js`
- `backend/src/modules/production/request-controller.js`
- `backend/src/modules/production/request-repository.js`
- `backend/src/modules/production/request-service.js`
- `backend/src/modules/production/service.js`
- `backend/src/modules/purchasing/controller.js`
- `backend/src/modules/purchasing/repository.js`
- `backend/src/modules/purchasing/service.js`
- `backend/src/modules/qc/controller.js`
- `backend/src/modules/qc/repository.js`
- `backend/src/modules/qc/service.js`
- `backend/src/modules/reports/controller.js`
- `backend/src/modules/reports/repository.js`
- `backend/src/modules/reports/service.js`
- `backend/src/modules/returns/controller.js`
- `backend/src/modules/returns/repository.js`
- `backend/src/modules/returns/service.js`
- `backend/src/modules/returns/unknown-controller.js`
- `backend/src/modules/returns/unknown-repository.js`
- `backend/src/modules/returns/unknown-service.js`
- `backend/src/modules/stocktake/controller.js`
- `backend/src/modules/stocktake/lifecycle.js`
- `backend/src/modules/stocktake/repository.js`
- `backend/src/modules/stocktake/service.js`
- `backend/src/modules/warehouse/controller.js`
- `backend/src/modules/warehouse/repository.js`
- `backend/src/modules/warehouse/routes.js`
- `backend/src/modules/warehouse/service.js`
- `backend/src/server.js`
- `backend/src/shared/business-context.js`
- `backend/src/shared/business-policy.js`
- `backend/src/shared/business-repository.js`
- `backend/src/shared/contract-validation.js`
- `backend/src/shared/decimal.js`
- `backend/src/shared/dto.js`
- `backend/src/shared/http.js`
- `backend/src/shared/logger.js`
- `backend/src/shared/sql-pattern.js`
- `backend/src/shared/test-guard.js`
- `backend/database/migration-history.sql`
- `backend/database/migrations/202610120000_environment_bootstrap.sql`
- `backend/database/migrations/202610120001_foundation.sql`
- `backend/database/migrations/202610150001_catalogs.sql`
- `backend/database/migrations/202610150002_orders_production.sql`
- `backend/database/migrations/202610150003_inventory_sources.sql`
- `backend/database/migrations/202610150004_stocktake_control.sql`
- `backend/database/migrations/202610150005_rework_sources.sql`
- `backend/database/migrations/202610150006_system_audit.sql`
- `backend/database/migrations/202610150007_demand_forecast.sql`
- `backend/database/migrator.js`
- `backend/database/schema-verification.js`
- `backend/database/sql.js`
- `backend/database/sqlserver/migrations/202610160001_native_schema.sql`
- `backend/database/sqlserver/migrator.js`
- `backend/scripts/check-frontend.js`
- `backend/scripts/check.js`
- `backend/scripts/convert-repository-sources.js`
- `backend/scripts/full-system-fixture.js`
- `backend/scripts/generate-code-manifest.js`
- `backend/scripts/inspect-business-config.js`
- `backend/scripts/inspect-sqlserver-schema.js`
- `backend/scripts/inventory-mysql-source.js`
- `backend/scripts/migrate.js`
- `backend/scripts/prepare-sqlserver-schema.js`
- `backend/scripts/seed-full-system-demo.js`
- `backend/scripts/seed-simple-demo.js`
- `backend/scripts/seed-uc01-demo.js`
- `backend/scripts/setup-ssms-reader.js`
- `backend/scripts/sqlserver-connection.js`
- `backend/scripts/sqlserver-demo-guard.js`
- `backend/scripts/sqlserver-docker-secrets.js`
- `backend/scripts/sync-fs-contract.js`
- `backend/scripts/uc01-data.js`
- `backend/scripts/update-runtime-contract.js`
- `backend/scripts/update-sqlserver-contract-notes.js`
- `backend/scripts/update-sqlserver-docs.js`
- `backend/scripts/validate-openapi.js`
- `frontend/src/App.css`
- `frontend/src/App.jsx`
- `frontend/src/auth/access.js`
- `frontend/src/auth/AuthContext.jsx`
- `frontend/src/auth/AuthProvider.jsx`
- `frontend/src/auth/ProtectedRoute.jsx`
- `frontend/src/auth/useAuth.js`
- `frontend/src/components/common/Badge.jsx`
- `frontend/src/components/common/Button.jsx`
- `frontend/src/components/common/Card.jsx`
- `frontend/src/components/common/EmptyState.jsx`
- `frontend/src/components/common/LoadingSkeleton.jsx`
- `frontend/src/components/common/SearchBox.jsx`
- `frontend/src/components/common/Table.jsx`
- `frontend/src/components/dashboard/ExpiringLotsTable.jsx`
- `frontend/src/components/dashboard/InventoryChart.jsx`
- `frontend/src/components/dashboard/InventoryTrendChart.jsx`
- `frontend/src/components/dashboard/KPICard.jsx`
- `frontend/src/components/dashboard/LowStockTable.jsx`
- `frontend/src/components/dashboard/StockStructureChart.jsx`
- `frontend/src/components/dashboard/WarehouseActivity.jsx`
- `frontend/src/components/dashboard/WarehouseCapacity.jsx`
- `frontend/src/components/home/Notifications.jsx`
- `frontend/src/components/home/QuickAccess.jsx`
- `frontend/src/components/home/QuickActions.jsx`
- `frontend/src/components/home/RecentActivity.jsx`
- `frontend/src/components/home/WelcomeBanner.jsx`
- `frontend/src/components/layout/AppLayout.jsx`
- `frontend/src/components/layout/Header.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/data/dashboardMockData.js`
- `frontend/src/data/homeMockData.js`
- `frontend/src/data/navigationData.js`
- `frontend/src/features/DataPage.jsx`
- `frontend/src/features/DependentSelect.jsx`
- `frontend/src/features/EvidencePicker.jsx`
- `frontend/src/features/live-overview.js`
- `frontend/src/features/RecordSummary.jsx`
- `frontend/src/features/ResourcePage.jsx`
- `frontend/src/features/resources.js`
- `frontend/src/features/StocktakePanel.jsx`
- `frontend/src/index.css`
- `frontend/src/main.jsx`
- `frontend/src/pages/DashboardPage.jsx`
- `frontend/src/pages/HomePage.jsx`
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/NotFoundPage.jsx`
- `frontend/src/pages/PlaceholderPage.jsx`
- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/services/apiClient.js`
- `frontend/src/utils/formatDate.js`
- `frontend/src/utils/formatNumber.js`
- `infra/compose.yaml`
- `infra/backend.Dockerfile`
- `infra/frontend.Dockerfile`
- `infra/nginx.conf`
- `infra/mysql/init.sh`
