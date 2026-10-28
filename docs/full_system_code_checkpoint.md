<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

# Checkpoint bàn giao mã nguồn — 16/10/2026

Bổ sung sau bàn giao cùng ngày: người dùng yêu cầu9account tên dễ nhớ theo role; seed LOCAL_SIMPLE_* đã chạy, tổng19accounts/9roles/1KH, giữ10account cũ. [Danh sách đăng nhập](../data.md). Ngoại lệ mật khẩu ngắn chỉ bộ mới/flag local được kiểm code DB, không hạ policy mọi account. `kiemke01` là người Hội đồng thứ hai; giới hạn một Hội đồng trong checkpoint ban đầu bên dưới đã được gỡ bằng dữ liệu bổ sung được giao. Chưa chạy unit/integration/E2E/regression.

**29 UC DA_CODE_CHUA_TEST; CHUA_KIEM_THU, CHUA_NGHIEM_THU.** Không UC28, không HOAN_THANH. Lệnh người dùng15/10 và xác nhận trực tiếp FS01–12 đã thay gate riêng UC01/nghiệm thu từng UC. Không còn chờ duyệt FS01–12 hoặc script contract bị chặn.

[Bàn giao/29UC/trang/luồng kiểm tay/local/demo/giới hạn](full_system_handoff.md), [manifest API/schema/module/files](full_system_manifest.md), [tiến độ29UC](uc_progress.md).

## Đã triển khai mã nguồn

- Backend Express/JavaScript CommonJS/mysql2, Modular Monolith/MVC: auth/warehouse/customers/orders/production/purchasing/qc/inventory/returns/dispositions/stocktake/reports/evidence và shared decimal/policy/validation/idempotency/audit. Không TypeScript/ORM; Prisma archive không sửa hoặc thực thi.
- React giữ framework/layout/phong cách: ResourcePage/RecordSummary, StocktakePanel/EvidencePicker, DataPage, Home/Dashboard nguồn API thật; route/navigation/RBAC và helper nguồn. 50 file JS/JSX đã parse. Không tính trang users placeholder ẩn là UC mới.
- 151 handler nghiệp vụ bind đầy đủ, cộng auth và health; runtime OpenAPI sinh từ nguồn thực. Không endpoint mock hoặc unbound để lấp số UC.
- QC nhiều đợt/quota nguồn; điều phối UC13 không ghi tồn/giữ capacity, snapshot và kiểm lại khi post; UC15 reserved-only,120phút/gia hạn1/hard240; post tiêu thụ hold và giảm on_hand một transaction. FEFO/HSD, sức chứa gồm mọi bucket + unknown, điều kiện bảo quản, idempotency và audit được nối trong mã, chưa được test.
- Forecast tồn riêng demand/kho cho KHSX khác physical reservation; PO duyệt chưa giao chỉ giảm nhu cầu mua. Thuật toán tiền/định mức dùng BigInt theo FS01–03. Ngày nghiệp vụ VN, timestamp UTC.
- Giao thành công độc lập với xuất; trả theo delivered; nhận QUARANTINE/UNKNOWN, xác minh không cộng vật lý hai lần. FAILED intake, disposition maker-checker, rework quota riêng không sửa QC gốc.
- Kiểm kê snapshot/count bất biến, phạm vi hữu hạn/lease/generation/recount độc lập, evidence/verification/board adjustment, invalidation trước unlock. Reports tồn theo kỳ/hiện tại, ledger/HSD/lỗi/chênh lệch+nguyên nhân+tỷ lệ, cấu hình cảnh báo revision rõ ràng.
- Bản sửa tích hợp cuối: kiểm lại lot/item/quy đổi/storage ở confirm/post; SQL giữ trong repositories; timer idle React đồng bộ header expiry từ backend, không polling keep-alive, hard8giờ giữ nguyên.

## MySQL/seed/Docker thực tế

- Docker Desktop đã khởi động lại sau khi engine tắt; hai MySQL container cũ tiếp tục dùng volume cũ, không reset/xóa dữ liệu.
- `npm run db:migrate` và `db:migrate:test`: đã apply7versions202610150001–0007. `db:status` và `db:status:test` sau triển khai: 2BASELINED_LEGACY +7APPLIED, pending[]. Bảy file20261015 từ đây bất biến; schema sửa sau phải version mới. Không chạy lại SQL riêng hoặc ép APPLYING.
- `npm run seed:full:demo` thành công trên dev qua guard: version FS_DEMO_20261015, units/catalog/packaging/prices/NCC/workshop/BOM/calendar/factors/3kho5vịtrí/scopes/permission hỗ trợ; vẫn9roles10accounts1KH; không account/password mới, không tồn đầu hoặc chứng từ.
- Compose đã build và khởi động app, đóng gói lại bản sửa cuối. Migration service exit0; backend/frontend/mysql-dev/mysql-test healthy. App http://localhost:8080, Swagger http://localhost:3000/docs. Uploads bind backend/uploads, bị loại khỏi image/Git. Giữ nguyên hai volume warehouse_mysql_dev_data và warehouse_mysql_test_data.

## Kiểm tối thiểu đã thực hiện

- CommonJS `npm run check`: đạt cú pháp, không thực thi tests.
- Parser frontend50files: đạt cú pháp; Vite build trong image thành công. Còn cảnh báo bundle khoảng849KB (>500KB), không đổi dependency/framework để che cảnh báo.
- `inspect-business-config`:151handler, unbound[], missingReferences[], duplicateOperationIds[], không SQL/HTTP.
- `openapi:validate`: đặc tả foundation/planned/runtime hợp lệ; không test endpoint.
- Migration/seed/build/health khởi động như trên là bằng chứng vận hành hạ tầng, không PASS nghiệp vụ29UC.
- **Không chạy unit/integration/E2E/regression hoặc browser/API business scenario.** Giữ nguyên tests cũ; bằng chứng UC01 ngày14/10 chỉ là lịch sử.

## Phần còn chờ sau bàn giao

1. Người dùng kiểm tay29UC theo full_system_handoff; ghi lỗi/UC/role/mã chứng từ/thao tác, không gửi mật khẩu/token. Chỉ người dùng nghiệm thu mới HOAN_THANH. Không tự chạy bộ test nếu chưa đổi lệnh.
2. Demo chỉ một account Hội đồng: nhánh chênh lệch cần người đếm lại thứ hai, chưa tạo account11/chuyển role tài khoản khác. Cần phê duyệt dữ liệu bổ sung; không hạ independent recount. Kiểm customer isolation khác KH cần fixture test khi được giao; hai account demo hiện cùng KH.
3. Cảnh báo chưa đặt giá trị mặc định: QLK cấu hình ngưỡng theo SKU/kho. Seed ngày/quota/factor/giá/BOM đều giả; không suy diễn ngoài lịch đã khai báo.
4. Chưa kiểm transaction/concurrency/end-to-end/bảo mật/quota/FEFO/lease thực tế, NFR hiệu năng/browser/responsive/backup/restore. Build/health không thay thế những kiểm này.
5. Ngoại lệ ngoài FS01–12 vẫn không tự chọn. Không quản trị tài khoản/NCC/xưởng/BOM qua UI ngoài phạm vi; không reversal posted, bypassQC/FEFO hoặc capacity hold.

## Bảo toàn

Git vẫn11tracked deletions cũ và source/docs untracked; không stage/commit/reset/restore. Không sửa SRS/tám Domain Model, không đọc/in secrets/mật khẩu. Hướng dẫn mật khẩu cục bộ vẫn tồn tại và gitignored; không sao chép vào docs công khai. Vì source untracked từ trước, manifest là inventory hiện tại, không giả là diff lịch sử.
