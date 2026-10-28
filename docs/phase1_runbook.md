<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

## Quy trình chạy thay thế

Dùng [sqlserver_runbook.md](sqlserver_runbook.md) cho Windows, SSMS, migration, Docker, backup/restore. Không chạy setup-local.mjs hay MySQL/Prisma commands cũ. Các script legacy đã đánh DA_THAY_THE hoặc chặn thực thi; giữ volumes và SQL history cũ.

# Runbook nền tảng JavaScript + mysql2

Lệnh15/10/2026 giao code cả29UC và **hoãn chạy unit/integration/E2E/regression**; các lệnh test trong runbook này giữ làm tham chiếu, không được thực thi theo từng UC trong đợt code hiện tại. Không restart Docker giữa từng UC. [Kế hoạch mới/điểm chặn](full_system_execution.md). Các hướng dẫn chạy nền tảng đã kiểm trước đây không chứng minh28UC còn lại đã tồn tại.

Công nghệ hiện hành: Node 24.21.0 LTS, Express 5.2.1, JavaScript CommonJS, mysql2/promise 3.24.0, MySQL 8.4.8, SQL migration, Jest 30.5.2/Supertest. Không TypeScript/ORM/backend build. Các lệnh Prisma trong runbook trước DA_THAY_THE. [Báo cáo chuyển đổi](backend_stack_migration_review.md).

## Cấu hình và phần mềm

Docker Desktop Linux Engine/WSL2 + Compose V2. MySQL dev/test có volumes/credentials riêng. Secrets/env workspace đã tạo và được bảo tồn; **không chạy setup lại**. .env.example chỉ placeholder. scripts/setup-local.mjs chỉ tạo cấu hình mới, từ chối overwrite; không in secrets. Node toàn máy có thể khác bản đã duyệt; từ root Code dùng helper trong mỗi terminal:

~~~powershell
. ./scripts/use-node.ps1
node --version
~~~

Helper chỉ thay PATH/npm của terminal hiện tại. .tools-runtime riêng ignored, không đổi Node toàn máy. Máy khác cài Node 24.21.0 hoặc dùng Docker. Không đọc/in password/env vào chat/log/Git. warehouse_shadow cũ giữ nguyên, không dùng bởi runner mới; SHADOW_DATABASE_URL trong cấu hình cũ là legacy, không cần điền cho stack mới.

## Toàn bộ bằng Docker Compose

Từ root Code:

~~~powershell
docker compose --env-file infra/.env -f infra/compose.yaml --profile app --profile test up -d --build
docker compose --env-file infra/.env -f infra/compose.yaml --profile app --profile test ps
~~~

Đã build backend/migrate và chạy SQL migrator → backend → frontend. Dockerfile Node 24.21.0 chạy npm ci --omit=dev --ignore-scripts, npm start → node src/server.js; không generated client/tsc/Prisma/OpenSSL install. Frontend Dockerfile/Nginx nguyên bản. MySQL volumes warehouse_mysql_dev_data/warehouse_mysql_test_data giữ nguyên.

| Dịch vụ | Windows | Docker network |
|---|---|---|
| MySQL dev | 127.0.0.1:3307, warehouse_db | mysql-dev:3306 |
| MySQL test | 127.0.0.1:3308, warehouse_test | mysql-test:3306 |
| Backend | 127.0.0.1:3000 | backend:3000 |
| Frontend | 127.0.0.1:8080 | frontend:80 |

Hiện Giai đoạn 2 chỉ UC01 đã được giao: mở http://localhost:8080/login, dùng [demo và hướng dẫn UC01](uc01_local_runbook.md), thành công về `/`; /dashboard yêu cầu reports.read. Health http://localhost:3000/health hoặc /api/v1/health trả data.status=ok, application=running, database=connected. http://localhost:8080/api/v1/health chứng minh Nginx proxy tới mysql2 backend. Swagger http://localhost:3000/docs; runtime contract gồm 2 health + 3 auth operations. Các API nghiệp vụ khác vẫn chưa triển khai.

## Development trực tiếp

Khởi động MySQL riêng và dừng app đang chiếm 3000:

~~~powershell
docker compose --env-file infra/.env -f infra/compose.yaml --profile test up -d mysql-dev mysql-test
docker compose --env-file infra/.env -f infra/compose.yaml --profile app stop frontend backend
~~~

Terminal backend từ root:

~~~powershell
. ./scripts/use-node.ps1
cd backend
npm ci --ignore-scripts
npm run check
npm run db:status
npm run db:migrate
npm run db:migrate:test
npm start
~~~

Hoặc npm run dev để dùng Node --watch, không tsx/transpilation. npm start trực tiếp đã kiểm trên Windows; ở lần chuyển đổi dùng port tạm 3001 để không xung đột app container, không ghi đè env. Có thể chọn cùng cách:

~~~powershell
$env:PORT='3001'
npm start
~~~

Terminal frontend từ root:

~~~powershell
. ./scripts/use-node.ps1
cd frontend
$env:VITE_API_URL='/api'
$env:VITE_API_PROXY_TARGET='http://127.0.0.1:3000'
npm run dev
~~~

Mặc định mở localhost:5173. Với terminal helper PowerShell, quote separator/flags khi truyền tham số npm. Cặp direct kiểm thực trong lần này là backend 3001/frontend 5174:

~~~powershell
$env:VITE_API_PROXY_TARGET='http://127.0.0.1:3001'
npm run dev '--' '--host=127.0.0.1' '--port=5174' '--strictPort'
~~~

Không đổi files/frontend env; UI/mock/dependencies giữ nguyên. Chọn đúng cặp proxy/port. CORS origin ngoài allowlist cần cấu hình riêng; cặp test cùng origin proxy đã kiểm. Auth/session frontend thuộc UC01 chưa code.

## SQL migrations và tests

backend/database/migrations có hai SQL nguyên byte từ legacy. _sql_migrations chỉ metadata version/checksum/state/time. _prisma_migrations và schema.prisma/SQL cũ lưu lịch sử DA_THAY_THE; không dùng Prisma runtime.

~~~powershell
# Trong backend với Node đã chọn
npm run db:status
npm run db:status:test
npm run db:migrate
npm run db:migrate:test
npm test
npm run test:integration
npm run openapi:validate
npm run check
npm audit --omit=dev
~~~

Đã chạy dev/test migrate, repeat không pending/appliedNow; BASELINED_LEGACY chỉ sau kiểm history/checksum và schema/FK/PK/unique/index/CHECK/engine/collation. Runner dùng GET_LOCK trên cùng connection. APPLYING hoặc checksum/order sai → dừng/review; không tự re-run DDL, rollback schema/reset/drop. DDL MySQL implicit commit, không tương đương rollback DML. Database có bảng nhưng không có history phải review, không tự baseline. Migration mới thêm file timestamp cao hơn, SQL review và người dùng duyệt schema trước chạy; không sửa SQL đã apply.

11 unit tests và 4 integration tests PASS. MySQL thật cho connection/transaction/FK/CHECK/DECIMAL/2-account customer/row-lock; fixtures chỉ warehouse_test, guard env/host/user/name/UUID marker trước ghi, luôn rollback. Không TRUNCATE hoặc seed dữ liệu thật. Fresh bootstrap SQL được code/review nhưng chưa chạy trên instance/database mới trong lần này; không dùng reset database hiện có để tạo bằng chứng đó. Không script db:replay/Prisma/shadow mới.

Browser smoke dùng Edge Windows và profile tạm:

~~~powershell
$env:FRONTEND_URL='http://localhost:8080'
$env:BROWSER_PATH='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
npm run test:browser
~~~

Đã kiểm direct 5174 và Compose 8080; Home/Dashboard, không page errors, proxy health tới MySQL thật. Screenshots backend/.artifacts ignored. Đổi FRONTEND_URL theo direct nếu cần. Frontend npm run build đã chạy lại và PASS trên Node 24.21.0; image/frontend source giữ nguyên. Cảnh báo bundle >500 kB hiện có không tự refactor.

Runtime audit 0 vulnerabilities. Full npm audit hiện còn 19 moderate entries từ nhánh Jest → load-nyc-config → js-yaml/argparse → sprintf-js; không có trong image runtime. Không dùng npm audit fix --force để tự hạ major Jest. Jest chạy CommonJS với transform={} và không sử dụng config YAML không tin cậy. Đây vẫn là cảnh báo chưa giải quyết, không gọi full audit PASS.

## Workbench, logs, safe stop

Workbench GUI chưa tự thao tác trong lần này. Standard TCP/IP host 127.0.0.1, dev port 3307/user warehouse_app/schema warehouse_db; test 3308/user warehouse_test_app/schema warehouse_test. Password lấy thủ công từ infra/secrets/devApp hoặc testApp, không chụp/in/chat. Migration users riêng, app không root.

~~~sql
SELECT VERSION(),DATABASE(),CURRENT_USER();
SHOW TABLES;
SELECT version,state,finished_at FROM _sql_migrations ORDER BY version;
SELECT migration_name,finished_at,rolled_back_at FROM _prisma_migrations;
SELECT TABLE_NAME,ENGINE,TABLE_COLLATION
FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE();
~~~

8 bảng nền tảng giữ nguyên; marker và history cũ giữ nguyên; thêm _sql_migrations 2 records BASELINED_LEGACY. customer_id không UNIQUE. History cũ không xóa/sửa. Không chạy CREATE TABLE trong Workbench để lặp migration.

~~~powershell
docker compose --env-file infra/.env -f infra/compose.yaml --profile app --profile test logs --tail 100 backend migrate
docker compose --env-file infra/.env -f infra/compose.yaml --profile app --profile test stop
~~~

Không down -v/reset/drop. Chỉ Ctrl+C đúng process npm đang chạy. Các container app được giữ để người dùng nghiệm thu; stop toàn bộ chưa chạy cuối bàn giao. Không in Compose config/secrets; config --quiet để validate.

- Port bận: chọn một backend; direct dùng 3000 hoặc cặp tạm 3001/5174 đã kiểm.
- Docker engine unavailable: mở Desktop Linux Engine/WSL2, không reset Docker data.
- SQL_MIGRATION_FAILED: kiểm code lỗi/target/checksum/schema/history; không bỏ verify/guard hoặc baseline giả.
- Incomplete DDL: review trạng thái APPLYING và schema, không xóa history để ép chạy lại; forward repair cần duyệt.
- Cấu hình/volume không khớp: setup không overwrite và MySQL init chỉ volume mới; không xóa volume để vượt lỗi password.

## Trước UC01 — hồ sơ lịch sử trước lệnh Giai đoạn 2

Người dùng nghiệm thu nền tảng mới và giao UC01 riêng. Chốt CSRF bootstrap/login/account provisioning/test fixtures roles/permissions trong phạm vi UC01; các chính sách nghiệp vụ CHUA_DUYET giữ mở. Không login hoặc CRUD nào được triển khai trong chuyển stack. Không tự chuyển Giai đoạn 2.

## Bằng chứng chạy lại — 14/10/2026

[phase1_verification.md](phase1_verification.md) là evidence mới nhất. Các lệnh check/unit/integration/OpenAPI/status/migrate, frontend build/lint, Docker config/build/up/health/Swagger/browser và Windows npm start đã chạy lại. Docker build có reuse cache; không coi npm ci đã chạy sạch hôm nay. Backend runtime không có Prisma/TypeScript/tsx; thư mục prisma chỉ archive giữ nguyên.

Frontend lint exit 0 nhưng 5 warnings (unused imports/variables), build vẫn warning 716.22 kB; full backend audit 19 moderate dev entries, runtime 0. Không sửa source frontend/dependencies để làm sạch trong bước kiểm tra. Workbench GUI/fresh migration/recovery chưa kiểm, không reset dev/test để kiểm. [UC01 scope proposal](uc01_scope_proposal.md) chỉ tài liệu, chờ lệnh riêng.
