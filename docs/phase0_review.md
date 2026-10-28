<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

# Bàn giao đồng bộ Giai đoạn 0 — 11/10/2026

> Hồ sơ bàn giao lịch sử được giữ nguyên. Sau bàn giao, người dùng đã thay TypeScript/Prisma bằng Express JavaScript CommonJS + mysql2/promise và SQL migration. Công nghệ cũ **DA_THAY_THE**; bằng chứng hiện hành ở [backend_stack_migration_review.md](backend_stack_migration_review.md). Các bảng/nghiệp vụ/29 UC không thay vì đổi stack.

> Đây là snapshot bàn giao11/10. Phê duyệt12/10 và trạng thái hiện hành ở mục cuối; các đề xuất cũ tại báo cáo không phủ nhận quyết định mới.

Chỉ tài liệu. Đã đọc đối chiếu README/AGENTS, SRS, hồ sơ thiết kế và tám Domain Model; quyết định trong yêu cầu hiện tại được áp dụng, không diễn giải thành quyền triển khai. Giai đoạn 1 chưa bắt đầu. Không dựng backend/MySQL/Prisma schema/migration/seed/Compose, không code UC, không sửa frontend hoặc Domain Model gốc.

## 1. Quyết định đã chốt và còn CHUA_DUYET

Đã chốt: monorepo Modular Monolith Node.js/Express/TypeScript; MySQL8+ InnoDB utf8mb4, Prisma migration kiểm soát; warehouse_db và warehouse_test riêng; REST/OpenAPI/RBAC backend; Compose sau duyệt và direct dev; frontend React/JS/Vite/Tailwind giữ nguyên. Đúng 29 UC, không UC28/LenhSanXuat/lớp điều phối riêng. KHSX lập xong CHO_DUYET, BOM version/hiệu lực truy vết theo dòng, chỉ BGĐ duyệt mới sản xuất/cấp phát. Actor UC13/15 Bộ phận quản lý kho, UC15 stock reservation bắt buộc. QC nhiều lô/đợt/partial receipts; units/packaging phiên bản/capacity unit riêng; cut-off/count history/safe bounded unlock; return theo delivered và cách ly trước QC. Auth ưu tiên session HttpOnly+CSRF, mật khẩu hash/RBAC; timestamp UTC, ngày nghiệp vụ Asia/Ho_Chi_Minh.

| Ưu tiên | Cần người dùng xác nhận | ID |
|---|---|---|
| Trước nền tảng/migration liên quan | Node/Prisma/MySQL version pin/collation, precision/scale; lựa chọn auth cuối theo hướng ưu tiên, account–KH cardinality | D06/07/08 |
| Trước nghiệp vụ BOM | Hao hụt/làm tròn, năng lực xưởng/lịch ca và quản lý BOM/NCC/xưởng qua seed hay CRUD hỗ trợ; PO tương lai có giảm nhu cầu mua không | D01/11 |
| Trước UC13/15 | Có triển khai capacity reservation UC13 không; TTL/renew/priority và phân bổ chưa hoàn tất cho holds | D03 |
| Trước UC07/09 | Freeze hay kiểm soát cuốn chiếu; lease/max duration/renew/cancel actor; hold bị ảnh hưởng bởi delta giảm; không mở khóa rồi duyệt proposal cũ | D04/09 |
| Trước UC12/14/17/18 | Actor tạo/phân chuyến/xác nhận giao, tạo yêu cầu/tiếp nhận trả; approval ngoại lệ trả vượt, unknown lot/reinspection; người duyệt phương án xử lý lỗi | D05/10/12 |
| Trước auth/expiry/report | Session TTL/refresh/rate limit/account lock/hash; FEFO tie/biên ngày HSD/min shelf life/cảnh báo; giá/tiền tệ | D07/12/13 |
| Trước vận hành | Maker-checker/reversal/downstream, CI/Git/performance/backup/RPO/RTO/retention | D04/14 |

Chi tiết và lịch sử tại [decisions.md](decisions.md). CHUA_DUYET là trạng thái thông số/chính sách, không phải trạng thái chứng từ CHO_DUYET. Các phương án trong database/API chưa được triển khai.

## 2. File chỉnh sửa

Đã chỉnh16 file có sẵn và tạo báo cáo này; không xóa file. Git đã có11 đường dẫn tracked cũ bị xóa và README/docs/frontend/docs.zip untracked trước thao tác; giữ nguyên hiện trạng này, không reset/restore/commit.

| File | Nội dung |
|---|---|
| [README.md](../README.md) | Công nghệ đã xác nhận, BOM/không lệnh riêng, cổng giai đoạn và liên kết báo cáo; chỉnh tối thiểu. |
| [AGENTS.md](../AGENTS.md) | Stack xác nhận, reservation UC15, QC/kiểm kê/return/time; giữ một UC/lần và nghiệm thu người dùng. |
| [docs/architecture.md](architecture.md) | Module ownership/service transaction chung, mandatory hold, recovery, direct dev và Compose dự kiến. |
| [docs/business_rules.md](business_rules.md) | KHSX tạo CHO_DUYET, issued/held/free, hold consume/release, partial QC, finite unlock, delivered quota và timezone. |
| [docs/database_design.md](database_design.md) | BOM/effectivity, QC batch/partial quota, packaging/capacity factors, holds, delivery/reception, finite stocktake lease và ERD/PK/FK/UQ/check/index/transactions. |
| [docs/decisions.md](decisions.md) | Bảo tồn lịch sử D01–D14/GAP01–GAP16, tách DA_XAC_NHAN khỏi CHUA_DUYET và cổng chưa chuyển giai đoạn. |
| [docs/domain_consolidation.md](domain_consolidation.md) | 34 lớp SRS/33 lớp unique trong8 view; mở rộng logic có căn cứ và QC1:N không sửa nguồn. |
| [docs/frontend_audit.md](frontend_audit.md) | Đối chiếu route lệnh sản xuất với KHSX đã duyệt và nhu cầu UI tương lai; không sửa frontend. |
| [docs/permissions.md](permissions.md) | Actor điều phối xác nhận, read ANY_OF cho NVKho, tách helper/renew/cancel quyền CHUA_DUYET. |
| [docs/srs.md](srs.md) | Phiên bản2.3; actor UC13/15, FR005/008/094/100/103–105, RULE03/16, AC-15 và bảng truy vết bổ sung; giữ mã29 UC/105 FR/101 AC. |
| [docs/testing_strategy.md](testing_strategy.md) | Warehouse_test guard, hold concurrency/consume/expiry, multibatch QC, partial return/physical, unlock/generation và reserved-adjustment conflict. |
| [docs/traceability.md](traceability.md) | Giữ bảng105 FR, bỏ operation plans.submit không còn hợp lệ, thêm trace quyết định→API→AC→test. |
| [docs/uc_catalog.md](uc_catalog.md) | Gói FE/BE/DB/test29 UC và phụ lục kiểm thử nghiệp vụ mới; UC13/15 riêng. |
| [docs/uc_dependencies.md](uc_dependencies.md) | Giữ thứ tự 29 UC, fixtures BOM/holds/QC/delivery/recovery và chuỗi tích hợp thật sau UC nguồn. |
| [docs/uc_progress.md](uc_progress.md) | Actor/policy cập nhật;29 UC vẫn CHUA_LAM, chưa test runtime/nghiệm thu. |
| [docs/api_contract.yaml](api_contract.yaml) | OpenAPI3.0.3 draft105 operations/86 schemas; remove plans.submit, typed outputs/QC batch/holds/helpers và lỗi409. |
| [docs/phase0_review.md](phase0_review.md) | Báo cáo bàn giao và giới hạn kiểm chứng hiện hành. |

## 3. Database

Một thiết kế chung cho34 lớp SRS, không bảng lặp theo actor. Tám view có33 lớp unique, NhaCungCap chỉ có SRS. Logic bổ sung được tách khỏi class khái niệm và nêu lý do/PK/FK/UQ/CHECK/index trong [database_design.md](database_design.md).

- BOM M:N phiên bản/hiệu lực và demand snapshot; plan line FK BOM bắt buộc. Nhu cầu trừ issued và hold riêng rồi phân free đã loại tất cả holds; không cùng một lượng dùng cho hai kế hoạch.
- QC source1:N batches, QC line1:N receipts. Bỏ unique chỉ theo source line; unique source+batch và khóa source aggregate chống kiểm/nhập vượt quota, accepted+rejected=inspected.
- Mandatory DatGiuTon tách initial/consumed/released/remaining. Confirm chỉ reserved/available; post giảm on_hand và reserved/consume cùng transaction, ledger một lần. Capacity factor/version riêng; DatGiuSucChua vẫn CHUA_DUYET.
- Delivery lines liên kết issue, return reception quarantine/lot/source quota; UC17 chuyển quality bằng hai ledger legs, không nhận vật lý hai lần.
- Stocktake snapshot/round bất biến, finite lease/heartbeat/generation, safe expire/cancel/complete. Vô hiệu pending proposals trước unlock; UC09 không post từ snapshot cũ. Delta ảnh hưởng hold cần policy duyệt, contract chặn conflict.
- XOR thật với FK hai loại lô, normalized unique tránh NULL trùng trong MySQL; immutable posting/ledger/audit, unique source chống duplicate. Toàn bộ nhập/xuất/điều chỉnh qua chứng từ và transaction; scope locks/QC/delivered quota không CHECK liên bảng.

Chưa kiểm constraints/locking trên MySQL thật, chưa Prisma validate vì chưa được tạo schema/database.

## 4. API Contract

[api_contract.yaml](api_contract.yaml) là OpenAPI3.0.3 dạng JSON (hợp lệ theo YAML1.2), draft chưa triển khai,105 operations/86 schemas. Mỗi operation có UC/permission, local refs, path params, success/error responses. Phân quyền không dựa ẩn nút UI; read receipt/issue cho NVKho chấp nhận posting permission phù hợp với ANY_OF và scope/loại phiếu.

- Bỏ plans.submit vì create KHSX đã CHO_DUYET; plan payload/result giữ BOM/demand/xưởng/lịch.
- Bổ sung reservations.read/release/renew; confirm giữ nguồn/tồn, post kiểm/consume own hold, release làm allocation mất điều kiện post. Renew CHUA_DUYET.
- QC theo batch/source/lot, typed results/remaining quota và GET detail; outputs riêng catalog/order/plan/purchase/request/stocktake/report thay projections rỗng.
- Lookup BOM/location/material needs; helpers delivery-confirm/return-request/quarantine-reception trong UC12/14, không UC mới. Helper actor, stocktake cancel/renew và UC18 approver còn CHUA_DUYET.
- Lỗi409 cho stale/expired reservation, source/QC/capacity quota, scope expired/generation/idempotency;422 cho field/decimal/unit/sum/source sai. CSRF/idempotency/version cho ghi đã thiết kế, login công khai.

## 5. Danh sách và thứ tự 29 UC

| UC | Tên giữ nguyên theo SRS | Thứ tự đề xuất | Trạng thái |
|---|---|---|---|
| UC01 | Đăng nhập hệ thống | 1 | CHUA_LAM |
| UC02 | Lập kế hoạch sản xuất | 9 | CHUA_LAM |
| UC03 | Duyệt KHSX | 10 | CHUA_LAM |
| UC04 | QC thành phẩm | 20 | CHUA_LAM |
| UC05 | Thống kê báo cáo và cảnh báo | 29 | CHUA_LAM |
| UC06 | Tra cứu dữ liệu kho | 7 | CHUA_LAM |
| UC07 | Lập biên bản kiểm kê | 26 | CHUA_LAM |
| UC08 | Xử lý chênh lệch kiểm kê | 27 | CHUA_LAM |
| UC09 | Phê duyệt điều chỉnh tồn | 28 | CHUA_LAM |
| UC10 | Quản lý nguyên liệu | 2 | CHUA_LAM |
| UC11 | Đặt đơn hàng | 8 | CHUA_LAM |
| UC12 | Xuất kho TP giao hàng | 22 | CHUA_LAM |
| UC13 | Điều phối nhập kho | 14 | CHUA_LAM |
| UC14 | Kiểm tra hàng trả về | 23 | CHUA_LAM |
| UC15 | Điều phối xuất kho | 17 | CHUA_LAM |
| UC16 | Nhập kho TP | 21 | CHUA_LAM |
| UC17 | Nhập kho hàng trả | 24 | CHUA_LAM |
| UC18 | Xử lý hàng lỗi/trả về | 25 | CHUA_LAM |
| UC19 | Quản lý dữ liệu kho | 4 | CHUA_LAM |
| UC20 | Quản lý lô thành phẩm | 6 | CHUA_LAM |
| UC21 | Nhập kho nguyên liệu | 15 | CHUA_LAM |
| UC22 | Lập yêu cầu xuất NL | 16 | CHUA_LAM |
| UC23 | Xuất kho NL | 18 | CHUA_LAM |
| UC24 | Lập yêu cầu nhập TP | 19 | CHUA_LAM |
| UC25 | Quản lý thành phẩm | 3 | CHUA_LAM |
| UC26 | Lập đơn mua NL | 11 | CHUA_LAM |
| UC27 | Duyệt đơn mua NL | 12 | CHUA_LAM |
| UC29 | QC nguyên liệu | 13 | CHUA_LAM |
| UC30 | Quản lý lô nguyên liệu | 5 | CHUA_LAM |

Thứ tự: UC01 → UC10 → UC25 → UC19 → UC30 → UC20 → UC06 → UC11 → UC02 → UC03 → UC26 → UC27 → UC29 → UC13 → UC21 → UC22 → UC15 → UC23 → UC24 → UC04 → UC16 → UC12 → UC14 → UC17 → UC18 → UC07 → UC08 → UC09 → UC05.

Mỗi UC có gói frontend/backend/database/test tại [uc_catalog.md](uc_catalog.md). [uc_dependencies.md](uc_dependencies.md) tách phụ thuộc dữ liệu khỏi thứ tự code: UC13 dùng QC NL thật và QC TP/return fixture; UC15 dùng NL thật và TP/order fixture; UC14 cần fixture delivered, không chỉ posted issue. Fixtures schema/ledger chuẩn trong warehouse_test, không handler giả hoặc code UC chưa được giao. Sau UC nguồn hoàn thành chạy chuỗi tích hợp thật; nghiệm thu từng UC rồi chờ người dùng chỉ định UC tiếp.

## 6. Khác biệt nguồn còn lại

| Nguồn | Kết quả đối chiếu |
|---|---|
| SRS34 lớp vs8 Domain views | 33 lớp unique; NhaCungCap thiếu trong views. Thiết kế từ SRS, nguồn giữ nguyên. |
| View request→QC/QC→receipt0..1 | Logic1:N theo yêu cầu đã xác nhận; đây là khác biệt khái niệm còn lưu, không sửa Mermaid gốc. |
| View thiếu BOM/hold/packaging/delivery/count lease | Bổ sung logic có căn cứ, không tuyên bố lớp mới có trong nguồn. Physical details/policy CHUA_DUYET vẫn cần duyệt. |
| UC18/UC07/support actor | Người duyệt xử lý lỗi, người lập scope/cancel, delivery/reception chưa đủ FR/quyền cụ thể; helper APIs CHUA_DUYET, không tạo UC mới. |
| Kế hoạch/đơn/xưởng/giá/FEFO | Thiếu ngưỡng năng lực/overproduction/tie/expiry boundary/rounding; không hardcode policy giả. |
| Frontend mock/production-orders | UI hiện tại còn dữ liệu trái ngành và route lệnh; không tạo LenhSanXuat theo mock. Giữ UI, thay dữ liệu/nhãn chỉ khi UC được giao. |
| Điều chỉnh giảm vs hold | Chặn409 nếu reserved vượt on_hand sau delta; cơ chế invalidate/reallocate holds CHUA_DUYET, tránh cắt ưu tiên ngầm. |

SRS 2.3 cập nhật có thông báo trước thay nghiệp vụ, giữ105 FR và91 AC thường+10 AC-KK. Lịch sử2.2 tại mục 16; xác nhận hiện hành/mapping tại mục 17. Không đánh lại mã27 UC khác/FR/AC.

## 7. Chuẩn bị Giai đoạn 1 — chưa thực hiện

1. Người dùng duyệt hồ sơ và ra lệnh rõ phạm vi nền tảng; chốt version/schema/auth và policy chặn phần được triển khai.
2. Chuẩn bị root ignore/placeholder env để bảo vệ secrets, nhưng không stage/commit/reset thay người dùng; FE vẫn giữ scripts/styles/framework hiện có.
3. Sau lệnh mới tạo backend Express/TS/modules/shared/health/OpenAPI và Prisma schema/migrations theo phạm vi duyệt; không db push.
4. Sau lệnh mới dựng MySQL/Compose, dev warehouse_db và warehouse_test riêng/guard/credentials/volumes, direct dev scripts; migration credentials/shadow DB riêng.
5. Kiểm health/Prisma validate/migration/engine/charset/FK/CHECK/seed giả/test guards trên MySQL test. Chuẩn bị deterministic fixtures và regression baseline, không UC nào thành hoàn thành nhờ scaffold.
6. Chờ chỉ định UC đầu tiên; một UC/lần, API/UI/DB/RBAC/regression, test tay người dùng và nghiệm thu trước đóng UC.

Cấu trúc project đầy đủ dự kiến đã có tại [architecture.md](architecture.md); chưa tạo thư mục/file triển khai.

## 8. Kiểm tra thực tế và giới hạn

| Kiểm tra | Kết quả thực tế |
|---|---|
| UC SRS/catalog/progress |29 mã/tên duy nhất, UC01–27/29/30, không UC28; UC13/15 xuất hiện riêng ở plan/permissions/API/test. |
| ID giữ nguyên | So với trước sửa: toàn bộ mã/tên UC,105 FR,91 AC thường và10 AC-KK giữ nguyên/thứ tự không đổi. |
| API structural checks | JSON parse,105 operationId không trùng, bao phủ29 UC; local refs resolvable, path parameters required, required schema fields tồn tại, permissions/success responses/CSRF/idempotency. Không lỗi trong phạm vi checks này. |
| RTM operation references và liên kết tài liệu | Các operationId được kiểm trong RTM tồn tại; plans.submit đã loại khỏi trace; liên kết file Markdown nội bộ được kiểm tồn tại, không lỗi. |
| Frontend/Domain | SHA-256 trước/sau58 file nguồn frontend/domain (bỏ .env*/node_modules/dist): không đổi, không thêm/xóa trong phạm vi bảo vệ;8 Domain files nguyên vẹn. |
| Git | Status/diff kiểm trước và sau sửa;11 tracked deletions cũ vẫn có sẵn; không commit/reset/restore. |
| OpenAPI validator chuyên dụng | CHUA_KIEM_CHUNG. Đã thử Swagger Parser10.1.0 vào thư mục tạm ngoài project; cache thiếu (ENOTCACHED), network proxy bị chặn (ECONNREFUSED). Không cài package vào frontend/backend. Structural checks không thay validator chuyên dụng. |
| Mermaid rendering | CHUA_KIEM_CHUNG bằng renderer; đã đối chiếu node/quan hệ với bảng logic, không tuyên bố diagram đã render. |
| Prisma/MySQL/runtime/API/UI/concurrency | CHUA_CHAY; chưa dựng schema/server/database. Mọi test dự kiến giữ CHUA_CHAY, không chứng minh runtime từ thiết kế. |

Cần validation OpenAPI chuyên dụng và kiểm MySQL/Prisma/runtime sau khi môi trường phù hợp/phạm vi được cho phép; không ghi “đã đạt” cho phần chưa chạy. Báo cáo kiểm cấu trúc không phải nghiệm thu UC.

**Dừng Giai đoạn 0. Chờ người dùng xem xét/xác nhận; không tự chuyển Giai đoạn 1.**

## Cập nhật sau bàn giao — 12/10/2026

Người dùng đã phê duyệt NT01/03/04/05/08–12 theo đề xuất, NT02 Prisma7/adapter với điều kiện kiểm connection/migration thật, NT06 VND amount20,0 và NT07 KhachHang1:N accounts/customer_id không UNIQUE, AU01–03. Các bảng cần duyệt ở phần bàn giao11/10 phía trên là lịch sử; trạng thái hiện hành tại [foundation_approval.md](foundation_approval.md) và [decisions.md](decisions.md).

Đã đồng bộ database/architecture/permissions/business_rules/API/README/AGENTS/domain consolidation/catalog/trace/testing, cùng ghi chú auth và RULE15 trong SRS; mã UC/FR/AC giữ nguyên. Session idle 30 phút/hard 8 giờ, tạm khóa 15 phút sau 5 lần sai trong 15 phút, password 12–128; rule rounding tại xác nhận chưa chốt thuật toán/dòng-vs-tổng, không tựHALF_UP. Các policy BOM/hold/capacity/count/delivery/disposition/IP threshold vẫn CHUA_DUYET.

Prisma7/MySQL migration runtime chưa chạy, API vẫn draft NOT_IMPLEMENTED; không tạo backend/database/schema/migration/Compose, không commit/reset. Người dùng sẽ cấp lệnh riêng Giai đoạn 1. 29 UC/frontend/8 Domain Model giữ nguyên.

Kiểm tra tài liệu sau đồng bộ12/10/2026:15 file tài liệu thay đổi, không thêm/xóa file. Hash nguồn frontend/8 Domain so trước sửa không đổi. SRS/catalog/progress giữ29 mã/tên UC;105 FR,91 AC thường+10 AC-KK không trùng. API draft105 operations/89 schemas, operationId/local refs/path params/required fields/permission và CSRF-idempotency được kiểm cấu trúc không lỗi. Liên kết file nội bộ tồn tại; Git status/diff trước/sau giữ nguyên11 tracked deletions cũ. Không chạy validator OpenAPI chuyên dụng, Prisma/MySQL/runtime/UI/tests trong lần này; chưa nghiệm thu nền tảng hoặc UC.
