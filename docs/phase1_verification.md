<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

# Kiểm tra lại nền tảng Giai đoạn 1 — 14/10/2026

**CHO_NGUOI_DUNG_XAC_NHAN.** Các kiểm tra runtime đã chạy đạt; còn cảnh báo và phần chưa kiểm chứng bên dưới. Không tuyên bố đã nghiệm thu toàn bộ nền tảng hoặc chuyển Giai đoạn 2. Không code UC01.

## Stack được kiểm chứng

Node 24.21.0 LTS, Express 5.2.1, JavaScript CommonJS; mysql2/promise 3.24.0, MySQL 8.4.8; SQL migrations có version/checksum; Docker Compose 2.39.2; frontend React/JavaScript/Vite/Tailwind hiện có. npm host 11.16.0. Không yêu cầu npm host và image cùng patch; dependencies được pin bằng lockfile.

npm ls --depth=0 hợp lệ. Trong container đang chạy: Node/Express/mysql2 đúng các phiên bản trên, package type=commonjs, UID=1000. require.resolve không tìm thấy prisma, @prisma/client, @prisma/adapter-mariadb, typescript hoặc tsx. Backend không transpile/build; chạy node src/server.js. Dockerfile chỉ cài runtime dependencies bằng npm ci --omit=dev --ignore-scripts.

## Các kiểm tra thực tế

| Nhóm/lệnh | Kết quả ngày 14/10/2026 |
|---|---|
| npm run check | PASS: syntax CommonJS src/database/scripts/tests |
| npm test | 11/11 unit tests PASS, 2 suites |
| npm run test:integration | 4/4 PASS trên MySQL thật, không SQLite/mock thay transaction |
| npm run openapi:validate | PASS: foundation 2 health operations và planned 105 operations |
| npm run db:status; db:status:test | Mỗi DB có 2 BASELINED_LEGACY, pending=[] |
| npm run db:migrate; db:migrate:test | PASS; adoptedLegacy=false, appliedNow=[], pending=[]; không chạy lại CREATE TABLE |
| MySQL metadata/guard | PASS: đúng DB/user/engine/charset/timezone, test marker và hai server UUID khác nhau |
| Docker Compose config --quiet | PASS, không in private config |
| Compose build backend frontend migrate | PASS; có sử dụng cache, không gọi đây là cài sạch mọi layer |
| Compose up app; ps | mysql-dev/mysql-test/backend/frontend healthy; migrate exit 0 |
| GET /health; /api/v1/health | HTTP 200, application=running, database=connected |
| Frontend /api/v1/health qua Nginx | HTTP 200, kết nối MySQL thật |
| Swagger /docs/ | HTTP 200; foundation contract được phục vụ |
| Windows npm start, port tạm 3001 | PASS, health kết nối MySQL; không sửa env files |
| Frontend npm run build | PASS, Vite 8.3.1; bundle JS 716.22 kB, warning >500 kB |
| Frontend npm run lint | Exit 0, còn 5 warnings; không coi là sạch cảnh báo |
| Browser npm run test:browser, FRONTEND_URL=localhost:8080 | PASS: Edge headless Home/Dashboard/proxy health, không page errors |
| Backend npm audit --omit=dev | 0 vulnerabilities |
| Backend full npm audit | 19 moderate entries, không high/critical; chưa PASS sạch |

Integration kiểm pool/UTC, schema/history, health/Swagger, parameterized SQL, hai accounts cùng customer, FK/CHECK/DECIMAL, transaction rollback và row-level lock trên hai connections thật. Unit test guard từ chối dev/wrong endpoint/user/marker; probe stub chỉ dùng để kiểm failure-path 503. Chưa chủ động ngắt MySQL runtime để kiểm mất kết nối.

Browser screenshots nằm ở backend/.artifacts, ignored. Build/lint chỉ sinh artifacts; frontend source/dependencies/UI/mock không chỉnh sửa. Backend tests không đăng nhập hoặc CRUD nghiệp vụ UC.

## Database và dữ liệu

| Môi trường | Database | App user | Windows port |
|---|---|---|---|
| Dev | warehouse_db | warehouse_app | 3307 |
| Test | warehouse_test | warehouse_test_app | 3308 |

MySQL 8.4.8 ở cả hai, server UUID khác nhau, database utf8mb4/utf8mb4_0900_ai_ci, session timezone +00:00. App không root; migration credentials riêng. Volumes warehouse_mysql_dev_data và warehouse_mysql_test_data giữ nguyên.

Mỗi DB có 11 bảng: 8 bảng nền tảng KhachHang/VaiTroQuyen/Quyen/VaiTro_Quyen/TaiKhoan/PhienDangNhap/AuditLog/IdempotencyRequest; _warehouse_environment; _sql_migrations; _prisma_migrations. Tám bảng nền tảng đều 0 rows khi kiểm sau tests. Không có dữ liệu thật được seed; fixtures test rollback. AUTO_INCREMENT test có thể tăng do rollback, không reset lại sequence.

Hai history rows cũ vẫn finished, không rolled back; checksum trùng SQL hiện hành. Legacy history giữ collation utf8mb4_unicode_ci từ công cụ cũ; không ALTER để làm đồng nhất giả. Tám bảng nền tảng InnoDB/utf8mb4_0900_ai_ci, binary collation ở identifiers, customer_id không UNIQUE, các FK/PK/index/CHECK được schema verifier kiểm từ SQL đã review. Không đổi schema, chạy migration mới, xóa/reset dữ liệu hoặc volumes trong lần này.

SQL runner đang đọc backend/database/migrations, dùng mysql2 và GET_LOCK. Lịch sử/version/checksum đúng, chạy lặp không pending. **Fresh bootstrap trên instance mới và lỗi DDL dở dang trên MySQL thật vẫn CHUA_KIEM_CHUNG**. Không reset DB hiện có để tạo bằng chứng; đề xuất một môi trường kiểm migration riêng được duyệt và không gắn volumes hiện có.

## Kết luận về prisma/

backend/prisma/ chỉ là hồ sơ **DA_THAY_THE**: README.md, schema.prisma, migration_lock.toml và 2 SQL files cũ. Không có generated client/config/dependency/script thực thi. Rà soát source/runtime cho thấy không import/read thư mục này. SQL đang chạy nằm ở backend/database/migrations; copies được giữ checksum nguyên byte.

Runner vẫn đọc **bảng** _prisma_migrations bằng mysql2 khi tiếp nhận legacy. Việc đọc history không sử dụng Prisma ORM hay thư mục prisma/. Docker COPY backend có thể đóng gói các hồ sơ cũ, nhưng không thực thi chúng. Có thể chuyển sang thư mục archive sau phê duyệt; trong lần này giữ nguyên mọi file, không xóa hoặc di chuyển. Không đề xuất xóa bảng history để đổi stack.

## Cảnh báo và cách khắc phục đề xuất

| Vấn đề | Tác động/đề xuất |
|---|---|
| 19 moderate dev dependency entries | Nhánh Jest → load-nyc-config → js-yaml/argparse → sprintf-js. Theo dõi patch/đánh giá dependency/tooling tương thích rồi chạy lại tests, audit và Docker. Không dùng audit fix --force để tự hạ major Jest. Runtime image không có devDependencies; không diễn giải runtime sạch thành full audit sạch. |
| 5 frontend lint warnings | Header.jsx: UserCheck; DashboardPage.jsx: setDateRange; KPICard.jsx: ArrowDownRight; StockStructureChart.jsx: totalStockFormatted; InventoryChart.jsx: Legend. Đề xuất cleanup các imports/variables không dùng khi được giao sửa frontend; chưa sửa trong bước kiểm tra. |
| Bundle JS 716.22 kB | Warning build, không làm build thất bại. Đánh giá route lazy loading/chia bundle khi được duyệt tối ưu UI; không đổi UI/dependencies ngay. |
| Fresh migration/recovery chưa chạy thật | Duyệt môi trường kiểm migration độc lập rồi kiểm fresh apply/repeat/checksum drift/incomplete DDL; không reset hoặc dùng volumes dev/test hiện tại để làm sạch. |
| Workbench GUI/user acceptance | Cần người dùng tự kiểm bằng runbook; truy vấn metadata qua mysql2 đã kiểm, không thay nghiệm thu GUI. |

Không phát hiện lỗi làm thất bại backend/health/migration hiện có/frontend/tests. Tuy vậy không kết luận mọi điều kiện đều sạch hoặc đã kiểm hết các đường phục hồi. Không tự gỡ dependencies/sửa frontend để che cảnh báo.

## Tài liệu và cổng bước tiếp theo

[Runbook](phase1_runbook.md) là hướng dẫn stack hiện hành. [Báo cáo chuyển stack](backend_stack_migration_review.md) và phase0_review/phase1_review giữ lịch sử; tài liệu này là bằng chứng kiểm lại mới nhất. [Phạm vi UC01 đề xuất](uc01_scope_proposal.md) chỉ tài liệu, chưa quyền code.

Đối chiếu SHA-256 trước/sau: 108 files backend/frontend/infra/scripts/Domain và nguồn nghiệp vụ/API được bảo vệ giữ nguyên. Chỉ thêm hai tài liệu kiểm tra/đề xuất và cập nhật README, AGENTS, architecture, decisions, báo cáo chuyển stack, phase1_review/runbook, testing_strategy, uc_progress. Backend Windows chạy tạm đã được dừng; app Docker giữ healthy cho người dùng kiểm tra.

29 UC vẫn CHUA_LAM. Git giữ 11 tracked deletions có sẵn và các thư mục untracked; không commit/stage/reset/restore. Không xóa prisma/, dữ liệu hoặc secrets. Người dùng xác nhận nghiệm thu/cách xử lý cảnh báo và cấp lệnh UC01 trước khi chuyển Giai đoạn 2.
