<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

# RTM BR/BP → FR → UC → API → test — bản nháp

Nguồn SRS 2.2 mục 6/12/13. 105 FR, 29 UC; FR/AC cũ giữ mã. API operationId tra api_contract.yaml. Hiện 14/10/2026 chỉ UC01 đã chạy test tự động; 28 UC khác CHUA_CHAY. [Mapping AC/FR và bằng chứng UC01](usecases/UC01_review.md). Mã BP/BR liên kết theo RTM SRS; không tự bịa mã yêu cầu cho khoảng trống.

| BR/BP | FR | UC | API operationId | Test dự kiến | Trạng thái |
|---|---|---|---|---|---|
| BR01/BP01 | FR001 | UC01 | auth.login, auth.me, auth.logout | T-UC01-AC01–03 | PASS tự động; chờ test tay/nghiệm thu |
| BR01/BP01 | FR002 | UC01 | auth.login, auth.me, auth.logout | T-UC01-AC01–03 | PASS tự động; chờ test tay/nghiệm thu |
| BR01/BP01 | FR003 | UC01 | auth.login, auth.me, auth.logout | T-UC01-AC01–03 | PASS tự động; chờ test tay/nghiệm thu |
| BR02/BP02 | FR004 | UC02 | plans.list, plans.create, plans.read | T-UC02-AC01–03 | CHUA_CHAY |
| BR02/BP02 | FR005 | UC02 | plans.list, plans.create, plans.read | T-UC02-AC01–03 | CHUA_CHAY |
| BR02/BP02 | FR006 | UC02 | plans.list, plans.create, plans.read | T-UC02-AC01–03 | CHUA_CHAY |
| BR02/BP02; BR03/BP03 | FR007 | UC03 | plans.decide | T-UC03-AC01–03 | CHUA_CHAY |
| BR02/BP02; BR03/BP03 | FR008 | UC03 | plans.decide | T-UC03-AC01–03 | CHUA_CHAY |
| BR02/BP02; BR03/BP03 | FR009 | UC03 | plans.decide | T-UC03-AC01–03 | CHUA_CHAY |
| BR08/BP07/BP08; BR14/BP07/BP10/BP11/BP12 | FR010 | UC04 | productQc.list, productQc.create, productQc.confirm | T-UC04-AC01–03 | CHUA_CHAY |
| BR08/BP07/BP08; BR14/BP07/BP10/BP11/BP12 | FR011 | UC04 | productQc.list, productQc.create, productQc.confirm | T-UC04-AC01–03 | CHUA_CHAY |
| BR08/BP07/BP08; BR14/BP07/BP10/BP11/BP12 | FR012 | UC04 | productQc.list, productQc.create, productQc.confirm | T-UC04-AC01–03 | CHUA_CHAY |
| BR13/BP13 | FR013 | UC05 | reports.inventory, reports.movements, reports.expiry, reports.stocktake-variances, reports.alerts | T-UC05-AC01–03 | CHUA_CHAY |
| BR13/BP13 | FR014 | UC05 | reports.inventory, reports.movements, reports.expiry, reports.stocktake-variances, reports.alerts | T-UC05-AC01–03 | CHUA_CHAY |
| BR13/BP13 | FR015 | UC05 | reports.inventory, reports.movements, reports.expiry, reports.stocktake-variances, reports.alerts | T-UC05-AC01–03 | CHUA_CHAY |
| BR12/BP12 | FR016 | UC06 | inventory.search, inventory.ledger | T-UC06-AC01–03 | CHUA_CHAY |
| BR12/BP12 | FR017 | UC06 | inventory.search, inventory.ledger | T-UC06-AC01–03 | CHUA_CHAY |
| BR12/BP12 | FR018 | UC06 | inventory.search, inventory.ledger | T-UC06-AC01–03 | CHUA_CHAY |
| BR11/BP11; BR14/BP07/BP10/BP11/BP12 | FR019 | UC07 | stocktakes.create, stocktakes.cutoff, stocktakes.count, stocktakes.submitCount, stocktakes.confirm | T-UC07-AC01–03 | CHUA_CHAY |
| BR11/BP11; BR14/BP07/BP10/BP11/BP12 | FR020 | UC07 | stocktakes.create, stocktakes.cutoff, stocktakes.count, stocktakes.submitCount, stocktakes.confirm | T-UC07-AC01–03 | CHUA_CHAY |
| BR11/BP11; BR14/BP07/BP10/BP11/BP12 | FR021 | UC07 | stocktakes.create, stocktakes.cutoff, stocktakes.count, stocktakes.submitCount, stocktakes.confirm | T-UC07-AC01–03 | CHUA_CHAY |
| BR11/BP11 | FR022 | UC08 | variances.verify | T-UC08-AC01–03 | CHUA_CHAY |
| BR11/BP11 | FR023 | UC08 | variances.verify | T-UC08-AC01–03 | CHUA_CHAY |
| BR11/BP11 | FR024 | UC08 | variances.verify | T-UC08-AC01–03 | CHUA_CHAY |
| BR11/BP11 | FR025 | UC09 | adjustments.decide | T-UC09-AC01–03 | CHUA_CHAY |
| BR11/BP11 | FR026 | UC09 | adjustments.decide | T-UC09-AC01–03 | CHUA_CHAY |
| BR11/BP11 | FR027 | UC09 | adjustments.decide | T-UC09-AC01–03 | CHUA_CHAY |
| BR12/BP12 | FR028 | UC10 | materials.list, materials.create, materials.update, materials.lock | T-UC10-AC01–03 | CHUA_CHAY |
| BR12/BP12 | FR029 | UC10 | materials.list, materials.create, materials.update, materials.lock | T-UC10-AC01–03 | CHUA_CHAY |
| BR12/BP12 | FR030 | UC10 | materials.list, materials.create, materials.update, materials.lock | T-UC10-AC01–03 | CHUA_CHAY |
| BR02/BP02 | FR031 | UC11 | orders.list, orders.create, orders.read, orders.submit | T-UC11-AC01–03 | CHUA_CHAY |
| BR02/BP02 | FR032 | UC11 | orders.list, orders.create, orders.read, orders.submit | T-UC11-AC01–03 | CHUA_CHAY |
| BR02/BP02 | FR033 | UC11 | orders.list, orders.create, orders.read, orders.submit | T-UC11-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR09/BP09 | FR034 | UC12 | issues.postSale | T-UC12-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR09/BP09 | FR035 | UC12 | issues.postSale | T-UC12-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR09/BP09 | FR036 | UC12 | issues.postSale | T-UC12-AC01–03 | CHUA_CHAY |
| BR10/BP10; BR14/BP07/BP10/BP11/BP12 | FR037 | UC14 | returnQc.list, returnQc.create, returnQc.confirm | T-UC14-AC01–03 | CHUA_CHAY |
| BR10/BP10; BR14/BP07/BP10/BP11/BP12 | FR038 | UC14 | returnQc.list, returnQc.create, returnQc.confirm | T-UC14-AC01–03 | CHUA_CHAY |
| BR10/BP10; BR14/BP07/BP10/BP11/BP12 | FR039 | UC14 | returnQc.list, returnQc.create, returnQc.confirm | T-UC14-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08; BR08/BP07/BP08 | FR040 | UC16 | receipts.postProduct | T-UC16-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08; BR08/BP07/BP08 | FR041 | UC16 | receipts.postProduct | T-UC16-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08; BR08/BP07/BP08 | FR042 | UC16 | receipts.postProduct | T-UC16-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08; BR10/BP10 | FR043 | UC17 | receipts.postReturn | T-UC17-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08; BR10/BP10 | FR044 | UC17 | receipts.postReturn | T-UC17-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08; BR10/BP10 | FR045 | UC17 | receipts.postReturn | T-UC17-AC01–03 | CHUA_CHAY |
| BR10/BP10 | FR046 | UC18 | dispositions.create, dispositions.submit, dispositions.decide, dispositions.execute | T-UC18-AC01–03 | CHUA_CHAY |
| BR10/BP10 | FR047 | UC18 | dispositions.create, dispositions.submit, dispositions.decide, dispositions.execute | T-UC18-AC01–03 | CHUA_CHAY |
| BR10/BP10 | FR048 | UC18 | dispositions.create, dispositions.submit, dispositions.decide, dispositions.execute | T-UC18-AC01–03 | CHUA_CHAY |
| BR12/BP12 | FR049 | UC19 | warehouses.list, warehouses.create, warehouses.update, warehouses.lock, warehouses.createLocation | T-UC19-AC01–03 | CHUA_CHAY |
| BR12/BP12 | FR050 | UC19 | warehouses.list, warehouses.create, warehouses.update, warehouses.lock, warehouses.createLocation | T-UC19-AC01–03 | CHUA_CHAY |
| BR12/BP12 | FR051 | UC19 | warehouses.list, warehouses.create, warehouses.update, warehouses.lock, warehouses.createLocation | T-UC19-AC01–03 | CHUA_CHAY |
| BR12/BP12; BR14/BP07/BP10/BP11/BP12 | FR052 | UC20 | productLots.list, productLots.create, productLots.update, productLots.lock | T-UC20-AC01–03 | CHUA_CHAY |
| BR12/BP12; BR14/BP07/BP10/BP11/BP12 | FR053 | UC20 | productLots.list, productLots.create, productLots.update, productLots.lock | T-UC20-AC01–03 | CHUA_CHAY |
| BR12/BP12; BR14/BP07/BP10/BP11/BP12 | FR054 | UC20 | productLots.list, productLots.create, productLots.update, productLots.lock | T-UC20-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08 | FR055 | UC21 | receipts.postMaterial | T-UC21-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08 | FR056 | UC21 | receipts.postMaterial | T-UC21-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08 | FR057 | UC21 | receipts.postMaterial | T-UC21-AC01–03 | CHUA_CHAY |
| BR07/BP06 | FR058 | UC22 | materialRequests.list, materialRequests.create, materialRequests.read, materialRequests.submit | T-UC22-AC01–03 | CHUA_CHAY |
| BR07/BP06 | FR059 | UC22 | materialRequests.list, materialRequests.create, materialRequests.read, materialRequests.submit | T-UC22-AC01–03 | CHUA_CHAY |
| BR07/BP06 | FR060 | UC22 | materialRequests.list, materialRequests.create, materialRequests.read, materialRequests.submit | T-UC22-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR07/BP06 | FR061 | UC23 | issues.postMaterial | T-UC23-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR07/BP06 | FR062 | UC23 | issues.postMaterial | T-UC23-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR07/BP06 | FR063 | UC23 | issues.postMaterial | T-UC23-AC01–03 | CHUA_CHAY |
| BR08/BP07/BP08 | FR064 | UC24 | productRequests.list, productRequests.create, productRequests.read, productRequests.submit | T-UC24-AC01–03 | CHUA_CHAY |
| BR08/BP07/BP08 | FR065 | UC24 | productRequests.list, productRequests.create, productRequests.read, productRequests.submit | T-UC24-AC01–03 | CHUA_CHAY |
| BR08/BP07/BP08 | FR066 | UC24 | productRequests.list, productRequests.create, productRequests.read, productRequests.submit | T-UC24-AC01–03 | CHUA_CHAY |
| BR12/BP12; BR14/BP07/BP10/BP11/BP12 | FR067 | UC25 | products.list, products.create, products.update, products.lock | T-UC25-AC01–03 | CHUA_CHAY |
| BR12/BP12; BR14/BP07/BP10/BP11/BP12 | FR068 | UC25 | products.list, products.create, products.update, products.lock | T-UC25-AC01–03 | CHUA_CHAY |
| BR12/BP12; BR14/BP07/BP10/BP11/BP12 | FR069 | UC25 | products.list, products.create, products.update, products.lock | T-UC25-AC01–03 | CHUA_CHAY |
| BR03/BP03; BR04/BP04 | FR070 | UC26 | purchases.list, purchases.create, purchases.read, purchases.submit | T-UC26-AC01–03 | CHUA_CHAY |
| BR03/BP03; BR04/BP04 | FR071 | UC26 | purchases.list, purchases.create, purchases.read, purchases.submit | T-UC26-AC01–03 | CHUA_CHAY |
| BR03/BP03; BR04/BP04 | FR072 | UC26 | purchases.list, purchases.create, purchases.read, purchases.submit | T-UC26-AC01–03 | CHUA_CHAY |
| BR04/BP04 | FR073 | UC27 | purchases.decide | T-UC27-AC01–03 | CHUA_CHAY |
| BR04/BP04 | FR074 | UC27 | purchases.decide | T-UC27-AC01–03 | CHUA_CHAY |
| BR04/BP04 | FR075 | UC27 | purchases.decide | T-UC27-AC01–03 | CHUA_CHAY |
| BR04/BP04 | FR076 | UC29 | materialQc.list, materialQc.create, materialQc.confirm | T-UC29-AC01–03 | CHUA_CHAY |
| BR04/BP04 | FR077 | UC29 | materialQc.list, materialQc.create, materialQc.confirm | T-UC29-AC01–03 | CHUA_CHAY |
| BR04/BP04 | FR078 | UC29 | materialQc.list, materialQc.create, materialQc.confirm | T-UC29-AC01–03 | CHUA_CHAY |
| BR12/BP12 | FR079 | UC30 | materialLots.list, materialLots.create, materialLots.update, materialLots.lock | T-UC30-AC01–03 | CHUA_CHAY |
| BR12/BP12 | FR080 | UC30 | materialLots.list, materialLots.create, materialLots.update, materialLots.lock | T-UC30-AC01–03 | CHUA_CHAY |
| BR12/BP12 | FR081 | UC30 | materialLots.list, materialLots.create, materialLots.update, materialLots.lock | T-UC30-AC01–03 | CHUA_CHAY |
| BR11/BP11; BR14/BP07/BP10/BP11/BP12 | FR082 | UC07 | stocktakes.create, stocktakes.cutoff, stocktakes.count, stocktakes.submitCount, stocktakes.confirm | T-UC07-AC01–03 | CHUA_CHAY |
| BR11/BP11; BR14/BP07/BP10/BP11/BP12 | FR083 | UC07 | stocktakes.create, stocktakes.cutoff, stocktakes.count, stocktakes.submitCount, stocktakes.confirm | T-UC07-AC01–03 | CHUA_CHAY |
| BR11/BP11 | FR084 | UC08 | variances.verify | T-UC08-AC01–03 | CHUA_CHAY |
| BR11/BP11 | FR085 | UC09 | adjustments.decide | T-UC09-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR09/BP09 | FR086 | UC12 | issues.postSale | T-UC12-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08; BR08/BP07/BP08 | FR087 | UC16 | receipts.postProduct | T-UC16-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08 | FR088 | UC21 | receipts.postMaterial | T-UC21-AC01–03 | CHUA_CHAY |
| BR12/BP12; BR14/BP07/BP10/BP11/BP12 | FR089 | UC25 | products.list, products.create, products.update, products.lock | T-UC25-AC01–03 | CHUA_CHAY |
| BR13/BP13 | FR090 | UC05 | reports.inventory, reports.movements, reports.expiry, reports.stocktake-variances, reports.alerts | T-UC05-AC01–03 | CHUA_CHAY |
| BR12/BP12; BR14/BP07/BP10/BP11/BP12 | FR091 | UC20 | productLots.list, productLots.create, productLots.update, productLots.lock | T-UC20-AC01–03 | CHUA_CHAY |
| BR10/BP10; BR14/BP07/BP10/BP11/BP12 | FR092 | UC14 | returnQc.list, returnQc.create, returnQc.confirm | T-UC14-AC01–03 | CHUA_CHAY |
| BR11/BP11; BR14/BP07/BP10/BP11/BP12 | FR093 | UC07 | stocktakes.create, stocktakes.cutoff, stocktakes.count, stocktakes.submitCount, stocktakes.confirm | T-UC07-AC01–03 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10 | FR094 | UC13 | receipts.list, receipts.allocate, receipts.read, receipts.updateAllocation, receipts.confirmAllocation, receipts.reopen, receipts.cancel | T-UC13-AC01–05 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08; BR08/BP07/BP08; BR10/BP10; BR14/BP07/BP10/BP11/BP12 | FR095 | UC13 | receipts.list, receipts.allocate, receipts.read, receipts.updateAllocation, receipts.confirmAllocation, receipts.reopen, receipts.cancel | T-UC13-AC01–05 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08; BR08/BP07/BP08; BR10/BP10; BR11/BP11; BR14/BP07/BP10/BP11/BP12 | FR096 | UC13 | receipts.list, receipts.allocate, receipts.read, receipts.updateAllocation, receipts.confirmAllocation, receipts.reopen, receipts.cancel | T-UC13-AC01–05 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08; BR08/BP07/BP08; BR10/BP10 | FR097 | UC13 | receipts.list, receipts.allocate, receipts.read, receipts.updateAllocation, receipts.confirmAllocation, receipts.reopen, receipts.cancel | T-UC13-AC01–05 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR12/BP12 | FR098 | UC13 | receipts.list, receipts.allocate, receipts.read, receipts.updateAllocation, receipts.confirmAllocation, receipts.reopen, receipts.cancel | T-UC13-AC01–05 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR06/BP05/BP08; BR08/BP07/BP08; BR10/BP10 | FR099 | UC13 | receipts.list, receipts.allocate, receipts.read, receipts.updateAllocation, receipts.confirmAllocation, receipts.reopen, receipts.cancel | T-UC13-AC01–05 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10 | FR100 | UC15 | issues.list, issues.allocate, issues.read, issues.updateAllocation, issues.confirmAllocation, issues.reopen, issues.cancel | T-UC15-AC01–05 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR07/BP06; BR09/BP09; BR14/BP07/BP10/BP11/BP12 | FR101 | UC15 | issues.list, issues.allocate, issues.read, issues.updateAllocation, issues.confirmAllocation, issues.reopen, issues.cancel | T-UC15-AC01–05 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR07/BP06; BR09/BP09; BR11/BP11; BR14/BP07/BP10/BP11/BP12 | FR102 | UC15 | issues.list, issues.allocate, issues.read, issues.updateAllocation, issues.confirmAllocation, issues.reopen, issues.cancel | T-UC15-AC01–05 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR07/BP06; BR09/BP09 | FR103 | UC15 | issues.list, issues.allocate, issues.read, issues.updateAllocation, issues.confirmAllocation, issues.reopen, issues.cancel | T-UC15-AC01–05 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR12/BP12 | FR104 | UC15 | issues.list, issues.allocate, issues.read, issues.updateAllocation, issues.confirmAllocation, issues.reopen, issues.cancel | T-UC15-AC01–05 | CHUA_CHAY |
| BR05/BP05/BP06/BP08/BP09/BP10; BR07/BP06; BR09/BP09 | FR105 | UC15 | issues.list, issues.allocate, issues.read, issues.updateAllocation, issues.confirmAllocation, issues.reopen, issues.cancel | T-UC15-AC01–05 | CHUA_CHAY |

## Liên kết bổ sung của điều phối

BR05/BP05/08/10 → FR094–FR099 → UC13 → receipts.allocate/confirmAllocation/updateAllocation/reopen/cancel → AC-13-01–05. BR05/BP06/09 → FR100–FR105 → UC15 → issues.allocate/confirmAllocation/updateAllocation/reopen/cancel → AC-15-01–05. Posting UC16/17/21 và UC12/23 có test phối hợp FR099/105 để chặn phân bổ stale; không tính điều phối là posting. NFR03/04/12 → T-CONC-ISSUE/RECEIPT/CAPACITY/ADJUSTMENT, T-IDEMPOTENCY, T-ROLLBACK; NFR05/06 → T-RBAC/session/CSRF; NFR14/15 → T-COUNT-IMMUTABLE/LEDGER-RECONCILIATION.

Khoảng trống chưa có FR chính thức: chi tiết policy định mức/capacity calendar, tiếp nhận trả chưa rõ lô, CRUD NCC/xưởng, delivery/cancel, reservation TTL/timeout và reversal. Ghi CHUA_DUYET tại decisions.md, không suy diễn UC hoặc FR mới ngoài yêu cầu phục hồi. Trước từng UC refinement RTM đến từng operation/test case chi tiết trong docs/usecases/UCxx.md.

## Bổ sung truy vết quyết định hiện hành (giữ105 FR/AC IDs)

| BR/BP → FR | UC/API | AC hiện có → test dự kiến | Trạng thái |
|---|---|---|---|
| BR02/03/07; BP02/03/06→FR005/008/058–060 | UC02/03/22/26; plans.create/decide, materialRequests.create, purchases.create | AC-02-01/03-01/22-03→T-BOM-VERSION/T-DEMAND-NO-DOUBLE-RESERVE | CHUA_CHAY; rounding/hao hụt CHUA_DUYET |
| BR05/07/09; BP06/09→FR100–105 | UC15/12/23; issues.confirmAllocation, reservations.read/release, issues.postSale/postMaterial | AC-15-01–05/12-03/23-03→T-CONC-RESERVE/T-RESERVE-CONSUME/T-RESERVE-EXPIRE | CHUA_CHAY; renew TTL CHUA_DUYET |
| BR06/08/10; BP05/07/08/10→FR010–012/037–045/055–057/076–078/087/088 | UC04/14/29/13/16/17/21; *Qc.create/confirm/read, receipts.* | AC-04-03/14-01/16-03/17-03/21-03/29-03→T-QC-MULTIBATCH/T-QC-PARTIAL/T-CONC-QC | CHUA_CHAY |
| BR11; BP11→FR019–027/082–085/093 | UC07/08/09; stocktakes.*, variances.verify, adjustments.decide | AC-07-03/09-03/AC-KK→T-LOCK-RECOVERY/T-ADJUSTMENT-STALE | CHUA_CHAY; lease/cancel/renew policy CHUA_DUYET |
| BR09/10; BP09/10→FR034–048/092 | UC12/14/17/18; deliveries.confirm, returnRequests.create, returnReceptions.post, returnQc.*, receipts.postReturn | AC-12-01/14-01/17-01→T-RETURN-DELIVERED/T-NO-DOUBLE-PHYSICAL | CHUA_CHAY; helper actor CHUA_DUYET |
| BR14; BP12→FR049–054/067–069/089/091 | UC19/20/25/30/05/06 | AC-25-03/AC-KK→T-UOM-VERSION/T-CAPACITY-DIMENSION/T-TIMEZONE | CHUA_CHAY; hệ số/boundary CHUA_DUYET |

Không tạo FR hoặc UC mới cho helper APIs. NFR ngày nghiệp vụ→Asia/Ho_Chi_Minh, UTC timestamp. Các operationId trong bảng105 FR được đồng bộ contract ở lần kiểm cuối; phần state/permission/config CHUA_DUYET chưa có nghĩa được triển khai.

## Truy vết phê duyệt nền tảng 12/10/2026

NT07/AU01–03/NT08→BR01/BP01/FR001–003/UC01→auth.login/me/logout→AC-01-01–03 + T-CUSTOMER-MULTIACCOUNT/T-SESSION-IDLE-HARD/T-AUTH-TEMP-LOCK/T-PASSWORD-BOUNDS. NT07→BR02/BP02/FR031–033/UC11→orders.* (customer scope theo KH, nhiều account). NT06→UC11/26 và order/purchase confirmation→T-VND-CONFIRM-ROUNDING; mode/line-vs-total CHUA_DUYET, không FR/AC mới. NT02 cũ/T-FOUNDATION-PRISMA7 DA_THAY_THE về công nghệ; quyết định stack mới→T-FOUNDATION-SQL kiểm mysql2 connection/SQL migration thật trước nghiệm thu. Tất cả tests mới CHUA_CHAY, giữ105 FR và 29 UC.
