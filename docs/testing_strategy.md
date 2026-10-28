<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

## Cách ly và kiểm thử sau đổi SQL Server

Không thực thi unit/integration/E2E/regression trong đợt này. Tests hiện có được chuyển dialect và giữ ý định kiểm tra; chưa chạy. Khi được giao: dùng SQL Server thật warehouse_test, login warehouse_test_app; kiểm NODE_ENV, parsed DB, endpoint allowlist, DB_NAME(), ORIGINAL_LOGIN(), InstanceName HTTT02 và marker UUID trước ghi. Dev/test cùng instance nhưng khác DB/login/quyền/marker; không reset development. Fixture có prefix/ID sở hữu và cleanup đúng FK, không TRUNCATE. XACT_ABORT làm transaction lỗi constraint kết thúc: mỗi tình huống lỗi phải transaction riêng. Concurrency dùng hai mssql.Transaction thật với UPDLOCK/HOLDLOCK/READPAST, không mock thay SQL Server. Không tái sử dụng PASS MySQL cũ làm bằng chứng.

# Chiến lược kiểm thử từng UC — bản nháp Giai đoạn 0

## Lệnh ưu tiên hiện hành — 15/10/2026

**Tạm hoãn chạy mọi unit/integration/E2E/regression trong nhiệm vụ code toàn bộ29UC.** Không chạy baseline/regression theo từng UC, không restart Docker để kiểm từng UC, không yêu cầu người dùng test giữa quá trình. Các bước yêu cầu chạy test trong chiến lược lịch sử phía dưới được hoãn tới khi có lệnh phù hợp sau bàn giao; giữ nguyên files test/guards, không xóa hoặc hạ kiểm soát dữ liệu. Chỉ kiểm cú pháp/cấu hình tối thiểu nếu cần cho triển khai.

Không chạy test mới trong lần tiếp nhận15/10. UC01 có bằng chứng riêng14/10 nhưng không suy rộng PASS sang toàn hệ thống. Tiến độ code mới DA_CODE_CHUA_TEST, HOAN_THANH chỉ do người dùng nghiệm thu. Checklist/manual guide29UC sẽ bàn giao cùng toàn bộ code; không có cổng dừng từng UC. [Kế hoạch](full_system_execution.md), [điểm chặn nghiệp vụ](full_system_policy_approval.md).

Hiện hành 14/10/2026: UC01 đã có unit/API MySQL/browser tests và regression nền tảng; [bằng chứng](usecases/UC01_review.md). 28 UC khác chưa code/test. Các nhận xét CHUA_CHAY/chưa login trong kế hoạch Giai đoạn 0–1 là lịch sử hoặc tests tương lai. Thiết kế để nghiệm thu lần lượt 29 UC, không tác động dữ liệu phát triển hoặc UC hoàn thành. Test riêng từng UC tại uc_catalog; RTM tại traceability.md.

## Cách ly dữ liệu và môi trường

- Unit test không database, kiểm validator/decimal/quy đổi/FEFO/state machine. API integration và E2E chạy backend test riêng với MySQL InnoDB thật `warehouse_test`, không SQLite/mock để chứng minh khóa/transaction.
- Credential test chỉ quyền trong warehouse_test; migration credential/shadow DB riêng. Dev dùng warehouse_db và volume khác; E2E frontend URL riêng trỏ test API, không đổi .env/frontend mock của người dùng để test.
- Trước mọi test ghi/reset: NODE_ENV=test; URL host nằm allowlist test, database parsed từ URL **bằng đúng warehouse_test**; SELECT DATABASE() đúng warehouse_test; marker test-only và test instance UUID đúng; env dev/test không cùng đích; thiếu/sai bất kỳ điều kiện nào → abort trước DML/DDL. Không dựa tên chứa chữ test. Không log DATABASE_URL có password.
- Mặc định test suite tuần tự vì một DB test chung, fixture prefix `T_<UC>_<runId>` và cleanup chính row fixture thuộc run theo FK thứ tự; không TRUNCATE toàn DB ở teardown UC. Lock test-run ngăn hai suite cùng namespace. Nếu cần parallel: MySQL instance test riêng mỗi worker nhưng cùng tên DB warehouse_test; không tự reset instance khác.
- Chỉ rebuild/reset DB test khi được phép; guard trước và sau connect, kiểm evidence host/db/marker đã khử secret. Không xóa dev/production hoặc reset dữ liệu test tay khi chưa được cho phép.
- API request thực commit không được rollback bằng transaction outer của process test khác connection. Dùng fixtures/cleanup hoặc disposable test instance; test transaction rollback nghiệp vụ dùng fault injection riêng chỉ bật trong test build.

## Fixtures và quy trình mỗi UC

Giai đoạn 1 sau duyệt chuẩn bị seed deterministic theo schema: đủ roles/accounts scope, 2 kho hoạt động + 1 controlled, vị trí đủ/gần đầy/trống/khóa, SKU lon/chai quy cách khác nhau, NL kg/lít/cái, lô đạt/quarantine/lỗi/hết hạn/cận hạn, NCC/xưởng, BOM/capacity và source documents từng trạng thái. Tất cả là dữ liệu giả; mật khẩu không đưa Git/log. Seed opening stock bằng chứng từ hợp lệ để ledger=balance.

Mỗi UC có namespace dữ liệu riêng, clock cố định và đơn vị snapshot; không sửa base seed của UC đã xong. Phụ thuộc chưa code dùng fixtures đúng schema/trạng thái/ledger (tag dependency_fixture), không fake handler. Khi nhánh UC thực hoàn thành, chạy chuỗi tích hợp thật thay fixture để nghiệm thu cuối.

1. Lập phạm vi UC, AC/FR/API/UI/tables/permission và migration impact; xác nhận policy chưa chốt.
2. Chạy baseline suites UC hoàn thành + hash/UI snapshot trước thay đổi liên quan.
3. Kiểm unit, API success/invalid/state/RBAC/scope; assert response + chứng từ + balances + ledger + audit/quota.
4. UI/E2E dùng seed user đúng scope: input, loading/error/empty, unit, submit, toast/status, keyboard/mobile/layout. Đối chiếu dữ liệu UI với API/DB, không dùng mock mặc định để che lỗi.
5. Migration upgrade trên bản schema UC trước và fixtures lịch sử; regression mọi UC completed khi đổi shared/schema/auth/inventory; thay trang độc lập ít nhất smoke tất cả route và suite impacted.
6. Lưu evidence theo UC, migration/version, commit nếu người dùng giao, lệnh/result, test chưa chạy/lý do. Đưa hướng dẫn test tay (URL, account giả, input, expected), không tuyên bố đã test tay thay người dùng.
7. Cập nhật CHO_NGUOI_DUNG_XAC_NHAN; chỉ HOAN_THANH khi người dùng xác nhận theo README, dừng trước UC kế tiếp.

## Test transaction và bất biến bắt buộc

| Scenario | Setup và assertion |
|---|---|
| Hai giữ cùng tồn | tồn100, hai connection confirm hold70 với barrier; một commit/hold70, một409; on_hand100/reserved70/free30 và ledger không đổi; post thắng→30/0/30, ledger−70 |
| Hai nhập cùng QC | accepted chưa nhập 100, hai post 80; tối đa một thành công, consumed=80, balance +80 |
| Hai nhập capacity | sức chứa còn 100 capacity-unit, hai phiếu cần 70; một thành công, không vượt capacity |
| Retry/double click | cùng Idempotency-Key+payload trả cùng result; khác payload cùng key=409; khác key cùng phiếu không stock posting thứ hai |
| Mất response sau commit | retry đọc kết quả đã commit, không duplicate ledger/document |
| Rollback nhiều dòng | lỗi sau dòng đầu hoặc sau ledger trước commit; tất cả document/quota/balance/ledger/audit nghiệp vụ rollback; fault hook chỉ test |
| Kiểm kê cạnh tranh | cut-off và post cùng location barrier; phiếu hoặc trước snapshot hoặc bị khóa sau cut-off, không lọt ở giữa; outside-scope vẫn được post |
| Duyệt điều chỉnh lặp | hai BGĐ session/connection, đề nghị 1; chỉ một delta/posting; reject không thay tồn |
| UC13/15 không tồn | snapshot on_hand/lô projection/StockPosting/ledger trước/sau save/confirm/reopen/cancel giữ nguyên; UC15 reserved/available đổi đúng hold/release, UC13 capacity hold chỉ nếu duyệt |
| Phân bổ stale | điều phối rồi nguồn/quota/capacity/tồn đổi bằng chứng từ hợp lệ; post chặn+rollback, điều phối lại có version/audit |
| FEFO và hạn | hai HSD, tie first_received/id, không HSD FIFO; hold/quarantine/hết hạn loại; test đầu/cuối ngày timezone theo D13 |
| Hàng trả | nhận vật lý quarantine, QC permit 40 trong 60, UC17 chuyển 40→DAT; tổng vật lý vẫn 60, lỗi còn 20; không nhận lại vượt lượng đã giao |
| Quy đổi/version | 2 thùng×24+3=51; SKU khác 12/thùng cho 27; 1 pallet×1440+2×24+1×6+3=1497; revision mới không sửa giao dịch cũ |
| Hàng thừa/sai vị trí | snapshot zero/rỗng, count mới, tỷ lệ N/A; sai vị trí đúng tổng không tăng/giảm SKU giả; AC-KK07/09 |
| Quality/counter immutability | QC sum sai không save; submitted count không update, recount phiên mới; người ngoài Hội đồng không sửa |

Các bài cạnh tranh dùng connection thật và barrier/transaction harness, không sleep tùy ý; assertions cuối join commit, chống kết quả ngẫu nhiên. Ledger reconciliation cho cả bucket và quota nguồn, không chỉ tổng hàng.

## Acceptance và RTM

Mỗi UC ít nhất ACxx-01 (success), 02 (quyền/trạng thái), 03 (invalid). UC13/15 có 5 AC riêng; AC-KK01–10 gắn UC07/08/09, UC12/15 khi chặn expiry. ID kế hoạch `T-UCxx-ACyy`, thêm `T-CONC-*`, `T-RBAC-*`, `T-REG-UCxx`. FR có test ID không có nghĩa test đã tồn tại/pass; status tất cả CHUA_CHAY.

NFR p95/load demo, backup/restore, RPO/RTO là mục tiêu đề xuất cần D14; trước khi load test phải chốt machine/data volume/concurrency/p95, không báo số benchmark chưa chạy. Không test performance trên DB thật.

## Evidence Giai đoạn 0

Đã khảo sát mã/tài liệu và kiểm tra cấu trúc hồ sơ bằng script đọc file. Không chạy npm install/build/dev, MySQL/migration, API/UI/E2E. Baseline hash có 61 file frontend/config/README/SRS/domain trước chỉnh sửa; so sánh sau viết hồ sơ chỉ `docs/srs.md` thay đổi theo yêu cầu. README, toàn bộ frontend được lấy hash (không gồm .env/dist/node_modules) và tám Domain Model giữ nguyên; không có file nguồn mới trong frontend. .env/dist/node_modules không được đọc/sửa.

Kiểm tra tài liệu ngày 11/10/2026: danh mục SRS = 29 mã duy nhất đúng UC01–UC27/UC29/UC30; headings đặc tả = 29; uc_catalog/uc_progress đủ đúng 29; 105 FR không trùng mã, 91 AC thường + 10 AC-KK; UC13/15 mỗi UC 5 AC. API nháp 92 operations, operationId duy nhất, bao phủ 29 UC, path parameters và local schema/response refs hợp lệ. Đây là kiểm tra cấu trúc/nội dung contract JSON-as-YAML, chưa phải validation bằng tool OpenAPI chuyên dụng hoặc test API chạy. Hồ sơ yêu cầu có đủ và không rỗng. Không khôi phục/reset thay đổi Git có sẵn, không commit.

## Test bổ sung sau xác nhận — tất cả CHUA_CHAY

| Test ID | Setup/assertion và UC |
|---|---|
| T-CONC-RESERVE | UC15 hai connections giữ70 từ100; một thắng; source còn70 không cho hai holds dù stock200; không on_hand/ledger delta |
| T-RESERVE-CONSUME | UC12/23 own hold70; post retry/key khác chỉ ledger−70 một lần, onhand30/reserved0/free30; không dùng hold phiếu khác |
| T-RESERVE-EXPIRE | clock cố định, expire vs post/cancel/renew barrier; consumed+released<=initial, cache reserved đúng; stale allocation409, không onhand delta khi expire; TTL fixture không policy thật |
| T-QC-MULTIBATCH | UC04/29 source100, batch60(50/10) và40(30/10); total accepted80/rejected20; batch thêm1 chặn; nhập30+50 đúng, nhập thêm1 chặn |
| T-CONC-QC | UC16/21 accepted100, hai receipt80 tranh quota→một commit; rollback không mất quota; hai QC confirm cùng source vượt inspected bị chặn |
| T-QC-PARTIAL | QC chưa chốt/failed/quarantine không DAT; QC partial không đổi cả lot status thành DAT; source không HOAN_THANH chỉ vì1 batch chốt |
| T-CONC-CAPACITY | UC13 confirm snapshots và hai post70 vào100capacity→một post; nếu CHUA_DUYET chưa bật hold không assert reservation; capacity hold branch chỉ sau duyệt |
| T-LOCK-RECOVERY | UC07 worker dừng/crash/expiry/cancel/complete; lazy recovery giải phóng scope atomic sau mark invalid; count/snapshot vẫn nguyên; không infinite renew |
| T-ADJUSTMENT-STALE | UC09 approve vs expiry barrier: commit trước expiry hoặc stale409; sau unlock proposal cũ không post, generation mới chặn request cũ |
| T-RETURN-DELIVERED | UC12 xuất100, delivered60; hai receive40 cùng delivery→một thắng; trả vượt còn20 chặn; approval exception thiếu chặn, actor policy CHUA_DUYET |
| T-NO-DOUBLE-PHYSICAL | UC14 nhận60 quarantine, QC40 đạt20 lỗi; UC17 chuyển40 sangDAT hai ledger legs, physical vẫn60; QC không stock mutation |
| T-BOM-VERSION | UC02/03/22 BOM v1/v2/effectivity; plan giữv1 sau đổiv2; required100 issued20 ownhold30 free10→thiếu40; không cộng ownhold vào free/trừ hai lần |
| T-UOM-VERSION | UC25/07 SKU24/thùng khác12/thùng, pallet/lốc/lẻ quy đổi theo snapshot; revision không sửa count cũ, kg+lít không cộng |
| T-CAPACITY-DIMENSION | UC19/13/21 occupied gồm quarantine/unknown; chai count/volume_ml không thay capacity factor; move cùng vị trí không double occupancy |
| T-TIMEZONE | UTC boundary↔Asia/Ho_Chi_Minh ngày nghiệp vụ/report; expiry đầu/cuối ngày theo policy CHUA_DUYET sau duyệt |

Test warehouse_test thật riêng, guard host/name/marker/credential trước mọi write/reset; fixture namespace/run-id và scoped cleanup, không dữ liệu warehouse_db hoặc UC đã nghiệm thu. Concurrency dùng barrier hai DB connections, không sleep tùy ý. Baseline regression UC completed giữ nguyên, thay shared schema/auth/inventory chạy toàn suite completed. Tất cả ví dụ TTL/precision/data fixture không phải policy mặc định. Evidence lịch sử92 operations phía trên thuộc bản trước; kết quả hiện hành nằm phase0_review.md.

T-ADJUSTMENT-RESERVED-CONFLICT: UC09 delta làm on_hand<reserved phải rollback/409, không âm hoặc cắt hold theo ưu tiên ngầm; vô hiệu holds chỉ sau policy duyệt. T-HOLD-QUALITY-INVALID: hold còn hạn không cho xuất khi lot/capacity/location scope mất điều kiện.

## Test dự kiến cho phê duyệt nền tảng 12/10/2026 — CHUA_CHAY

| ID | Assertion |
|---|---|
| T-FOUNDATION-SQL | mysql2 pool/transaction/MySQL 8.4.8, SQL migration status/checksum/baseline schema/isolation phải kiểm thật; T-FOUNDATION-PRISMA7 là ID lịch sử DA_THAY_THE |
| T-CUSTOMER-MULTIACCOUNT | Hai accounts cùngKH được đọc scope KH khi đúng permission/state, account KH khác bị403/404; created_by riêng vẫn audit đúng; body/querycustomerId giả không đổi scope, internalNULL không toàn quyền; index customer_id không UNIQUE |
| T-SESSION-IDLE-HARD | Clock fixture quanh30phút/8giờ, expired đúngmốc401; activity renew idle không vượt hard; logout/revoke/adminLOCKED chặn; no refresh token/remember-me |
| T-AUTH-TEMP-LOCK | 5 lần sai trong15phút→khóa tạm15phút, hết hạn mở lại cơ chế tạm, adminLOCKED không tự mở; concurrency failed-count không mất update; IP threshold chưa duyệt không giả đạt |
| T-PASSWORD-BOUNDS | Password11/129 invalid,12/128 valid theo policy; không cắt input, hashArgon2id/không mật khẩu rõ; CSRF/Origin/CORS đúng |
| T-VND-CONFIRM-ROUNDING | Amount string integer/VND, quantity-price20,6/factor20,9; không intermediate rounding; mode chưa cấu hình chặn confirm/rollback; test tie/line-total chỉ sau policy duyệt |

Không chạy MySQL/API/UI/auth/package install lúc này. Approval không là evidence pass và không đóng UC01 hoặc nền tảng. Không dùng timeout auth làm reservation/stocktake lease.

## Bằng chứng nền tảng trước đổi stack — lịch sử DA_THAY_THE

Prisma validate/generate, backend build và frontend build PASS trên Node 24.21.0. Dev/test migrations và shadow replay PASS, không khác biệt schema. 8 unit tests và 3 integration/API tests PASS với MySQL 8.4.8 thật. Integration kiểm connection, migration history, InnoDB/utf8mb4, customer index, health/Swagger, FK/CHECK/Decimal CAST và transaction rollback.

CSRF/RBAC được kiểm ở mức primitives; login, hash password, session resolver và nghiệp vụ UC01 chưa triển khai. Failure-path health 503 dùng probe stub trong unit test; connection và transaction dùng MySQL thật. Tests dự kiến cho UC ở các mục lịch sử phía trên vẫn chưa chạy.

Edge headless smoke Home/Dashboard/proxy health PASS ở direct 5173 và Compose 8080, không page errors. Swagger Parser kiểm foundation 2 operations và planned contract 105 operations PASS. Docker images build PASS; dev/test MySQL, backend và frontend healthy, migrate exit 0. npm audit backend gồm devDependencies báo 0 vulnerabilities sau patch Swagger Parser 10.1.1.

Frontend còn cảnh báo bundle >500 kB; giữ nguyên UI. Screenshots ở backend/.artifacts, ignored. Test fixtures rollback; không ghi dữ liệu dev. Workbench GUI và nghiệm thu thủ công của người dùng chưa thực hiện. [Chi tiết](phase1_review.md), [lệnh chạy](phase1_runbook.md). Không nghiệm thu UC nào bằng tests hạ tầng.

## Kiểm thử hiện hành sau chuyển stack

Jest 30.5.2/Supertest, JavaScript CommonJS. 11 unit tests và 4 integration tests thực tế trên MySQL 8.4.8 đã PASS: giữ 8 assertions hạ tầng cũ, bổ sung SQL splitter/checksum/order/APPLYING/transaction release, schema verifier và hai connections khóa dòng thật. Unit stubs chỉ kiểm lỗi/helper; connection/FK/CHECK/DECIMAL/rollback/locking không thay bằng mock. Test guard kiểm environment/database/host/user/UUID marker trước ghi. Không reset/TRUNCATE hoặc fixtures thật.

Migration SQL dev/test tiếp nhận legacy sau verify, giữ history và bảng cũ; db:status chỉ đọc. Fresh bootstrap path được review/code nhưng chưa chạy trên database mới trong lần chuyển đổi này. Backend chạy trực tiếp/Docker không build TypeScript. Browser/contract/hash evidence hiện hành ở backend_stack_migration_review.md; UC tests chưa chạy không được đánh dấu hoàn thành.

## Evidence kiểm lại — 14/10/2026

11 unit tests/4 MySQL integration tests PASS khi chạy lại; SQL status/repeat migration không pending/appliedNow, test marker/server isolation đúng. Frontend build PASS, lint exit 0 còn 5 warnings; browser Home/Dashboard/proxy health PASS. Docker config/build/up và health/Swagger PASS; Windows npm start health PASS. Audit runtime 0, full dev còn 19 moderate entries. Source/Domain/29 UC giữ nguyên; không dùng mocks để chứng minh MySQL transaction.

[Bảng lệnh/kết quả/giới hạn](phase1_verification.md). Tests fresh bootstrap/recovery vẫn CHUA_KIEM_CHUNG, test UC01 chưa triển khai; không tự nghiệm thu nền tảng hoặc UC bằng các primitives hiện tại.
