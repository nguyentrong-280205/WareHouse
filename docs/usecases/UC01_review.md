<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](../sqlserver_runbook.md) và [báo cáo chuyển đổi](../sqlserver_conversion.md).

# Bàn giao UC01 — chờ nghiệm thu người dùng

Ngày 14/10/2026. **CHO_NGUOI_DUNG_XAC_NHAN**, chưa HOAN_THANH; chỉ UC01, 28 UC khác CHUA_LAM. Người dùng đã duyệt Argon2id65536 KiB/3/1, demo theo SRS/permissions và landing `/`. [Thiết kế](UC01.md), [chạy/demo/test tay](../uc01_local_runbook.md), [tiến độ](../uc_progress.md).

## Kết quả thực chạy

| Kiểm tra | Kết quả/bằng chứng |
|---|---|
| Backend unit | `npm test`: **14/14 PASS**, gồm 11 tests nền tảng + 3 UC01 (env/hash/input); hash/verify bằng Argon2 native thật |
| MySQL integration | `npm run test:integration`: **17/17 PASS**, gồm 4 tests nền tảng + 13 UC01; warehouse_test guard, không mock MySQL/transaction |
| Browser | `npm run test:browser`: PASS với Edge headless, Express3001/Vite5174/test pool guarded; direct unauth → login, wrong password, admin LOCKED, success → `/`, reload, logout, menu khách/direct dashboard denied, desktop/mobile Home/Dashboard/proxy health, không pageerror |
| Frontend | Windows và Docker Vite production build PASS; lint exit0, còn 4 warnings cũ; CSS/layout/framework/mock data giữ nguyên |
| Contract/cú pháp | Foundation/planned/runtime OpenAPI validate PASS; CommonJS syntax check PASS. Runtime đúng 5 operations (2 health + login/me/logout), không thay api_contract.yaml |
| Docker/runtime | Rebuild/up thành công; backend/frontend/mysql-dev/mysql-test healthy, migrator exit0. Node24.21.0, argon2 0.45.1 Linux native load/hash/verify được với USER node UID1000 |
| HTTP/browser app Docker | /health200 MySQL connected; frontend /api/v1/health200; /api/v1/openapi.json200 chỉ health/auth; /auth/me không cookie401; /login SPA200. Edge trên bản build Docker PASS: unauth /dashboard → /login, form render, proxy health/no page errors; chỉ đọc, không login/ghi dev |
| Migration | Dev/test 2 BASELINED_LEGACY, pending=[]; không migration mới, không schema/data reset hoặc xóa history |
| Password benchmark | Windows Node24.21.0 cấu hình đã duyệt hash+verify: 288/317/334 ms; container Linux một lần345 ms. Chỉ kiểm tương thích/cost thực, không là load benchmark/p95 |
| Dependency audit | Backend runtime 0 vulnerabilities; full dev còn19 moderate entries nhánh tooling Jest như báo cáo nền tảng, không high/critical. Không audit fix --force/hạ stack |

Screenshots riêng tư, không password/token: backend/.artifacts/uc01-login.png, uc01-home-board.png, uc01-home-customer.png, uc01-dashboard.png, uc01-dashboard-mobile.png, uc01-docker-login.png. Nội dung credentials và `.env` không được in/đọc vào báo cáo. Image Docker xác minh không chứa .env/.artifacts; Prisma/TypeScript/tsx không resolve được. Browser fixtures chỉ test; không dùng demo dev để test tự động. Ảnh Unsplash gốc tùy mạng, không thay asset.

## Mapping yêu cầu và phạm vi kiểm chứng

| Truy vết | Kiểm chứng UC01 |
|---|---|
| BR01/BP01/FR001; T-UC01-AC01 | Login/me/logout thật, cookie HttpOnly, phiên MySQL, principal permissions/customer boundary; UI direct route unauth bị chặn |
| FR002/AC-01-01; T-UC01-AC01 | 9 vai trò đăng nhập đúng; menu/guard theo permissions, board/customer khác chức năng; landing `/`, reload phục hồi, logout. Test-only HTTP routes dùng authenticate → RBAC/scope để kiểm 401/403/204, không expose API UC khác |
| AC-01-02; T-UC01-AC02 | Account/role LOCKED hoặc phiên thiếu/forged/revoked/idle/hard deny; wrong permission/customer403; headers giả không thay quyền. Không tạo session/chứng từ/tồn sai |
| FR003/AC-01-03; T-UC01-AC03 | Wrong/unknown password deny generic; 5 lần sai đồng thời không mất counter, khóa đúng15 phút, window reset/success clear; khóa admin không tự mở. AU02 ghi counter bảo mật hợp lệ, không là kết quả nghiệp vụ sai |
| AU01/NT08 | Idle renew <= hard; clock tests kiểm biên thực không chờ8 giờ; CSRF phiên khác/thiếu deny; login với stale cookie được phép, rotate/revoke phiên cũ; token/CSRF hashes DB |
| NT07/NFR06 | Hai accounts cùng KH hoạt động cùng boundary, internal NULL không toàn quyền, live role permissions; middleware test với session MySQL thật. UC11 chưa code nên chưa chứng minh query đơn hàng thật, phải kiểm lại khi giao UC11 |
| NFR03/05/07 | Native Argon2id salts ngẫu nhiên, không plaintext DB; audit actor/correlation đúng; lỗi SQL audit rollback session và counter reset; logout revoke/audit/idempotency atomic, retry revoked401/key phiên khác409 |

Kho/xưởng scopes chưa được cấp/migrate nên trả []; không dùng [] hoặc NULL như toàn quyền. Ẩn `/users`/`/production-orders` và các menu profile/settings chưa được giao; không account CRUD/reset, LenhSanXuat, stock posting/reservation/QC hoặc UC khác. Các trang cũ vẫn mock/placeholder, không là nghiệp vụ đã hoàn thành. Khóa login tạm chỉ hạn chế login mới, không tự revoke phiên còn hợp lệ; admin/role LOCKED bị resolver từ chối ngay.

## Database và bảo tồn dữ liệu

Metadata kiểm lại sau tests (backend/.artifacts/uc01-db-evidence.json): MySQL dev/test8.4.8, cùng 2 history BASELINED_LEGACY. warehouse_test cả 8 bảng nền tảng đều **0 rows** sau cleanup, marker/history giữ nguyên. Mỗi HTTP fixture có prefix/IDs riêng; cleanup được guard và kiểm ownership trước delete, không truncate/reset/đụng dữ liệu UC khác.

warehouse_db chỉ seed được duyệt: **1 KhachHang, 9 VaiTroQuyen, 51 Quyen, 53 VaiTro_Quyen, 10 TaiKhoan**; PhienDangNhap/AuditLog/IdempotencyRequest đều0 tại lúc kiểm (chưa chạy test ghi dev). 2 account customer_id cùng KH, 8 nội bộ NULL; non-Argon2 accounts0. Seed chạy lại xác minh credentials, không overwrite. Password chỉ [hướng dẫn local ignored](../../backend/.artifacts/UC01-demo-login.local.md), không public docs/GitHub/log/image Docker.

Đối chiếu SHA-256 28 files được bảo vệ trong snapshot124 files trước code: SRS, 8 Domain Model, source SQL migrations/migrator/schema verifier/history, archive backend/prisma, FE CSS/mock data/dependencies **không drift**. Kiểm danh sách UC:29 unique, không UC28, 28 CHUA_LAM. Không xóa file nguồn nào; thêm auth/test/demo utilities và sửa đúng phần integration/layout visibility/config/docs UC01. Git vẫn 11 tracked deletions có sẵn và thư mục hiện tại untracked; không stage/commit/reset/restore, không xóa secrets/volumes/data. Argon2 là dependency mới duy nhất backend; JavaScript CommonJS/mysql2 stack giữ nguyên.

## Còn chờ và giới hạn

- Người dùng test tay và nghiệm thu UC01 theo runbook; chưa có bằng chứng test tay của người dùng. Không tự chuyển HOAN_THANH hoặc UC tiếp theo.
- 4 lint warnings cũ: DashboardPage/setDateRange, KPICard/ArrowDownRight, InventoryChart/Legend, StockStructureChart/totalStockFormatted; bundle Vite khoảng775 kB/minified vẫn warning >500 kB. UserCheck đã bỏ khi sửa Header UC01. Không đổi frontend để tối ưu ngoài scope.
- 19 moderate dev audit entries giữ mở; runtime sạch không đồng nghĩa full audit sạch. Fresh migration/incomplete-DDL recovery nền tảng chưa được giao môi trường kiểm riêng, không làm sạch volumes để kiểm.
- IP thresholds/support provisioning/reset, làm tròn tiền, capacity/reservation TTL, QC/reversal, BOM/kiểm kê/giao hàng và policies CHUA_DUYET giữ mở. Cấu hình auth đã duyệt không được dùng làm TTL cho chúng.

App Docker giữ chạy cho người dùng thử; các server/Vite/browser test tạm đã đóng. Dừng tại UC01 và chờ xác nhận.
