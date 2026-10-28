<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

## Hiệu lực bằng chứng nền tảng

Các PASS MySQL bên dưới chỉ là bằng chứng lịch sử. Stack hiện hành đã đổi SQL Server; chỉ kết nối/schema/migration/cú pháp/health được kiểm trong đợt chuyển đổi. Chưa chạy lại bộ test nền tảng/auth/nghiệp vụ, chưa nghiệm thu SQL Server.

# Bàn giao nền tảng Giai đoạn 1

> Hồ sơ bàn giao lịch sử được giữ nguyên. Sau bàn giao, người dùng đã thay TypeScript/Prisma bằng Express JavaScript CommonJS + mysql2/promise và SQL migration. Công nghệ cũ **DA_THAY_THE**; bằng chứng hiện hành ở [backend_stack_migration_review.md](backend_stack_migration_review.md). Các bảng/nghiệp vụ/29 UC không thay vì đổi stack.

Ngày 12/10/2026. **CHO_NGUOI_DUNG_XAC_NHAN**: các tiêu chí kỹ thuật đã kiểm thực; chờ người dùng chạy thử và nghiệm thu. Chưa triển khai UC01 hoặc UC khác, không tự chuyển Giai đoạn 2.

## Phạm vi và phiên bản thực tế

Node 24.21.0 LTS, Express 5.2.1, TypeScript 5.9.3, ESM; Prisma CLI/Client/adapter-mariadb 7.10.0; MySQL Community 8.4.8 LTS, InnoDB/utf8mb4. Adapter tên MariaDB kết nối MySQL Server, không đổi database provider.

Người dùng đã chấp thuận MySQL 8.4.8 nếu tag tồn tại sau khi Docker Hub báo mysql:8.4.12 không tìm thấy. Manifest, pull, SELECT VERSION và runtime dev/test xác minh 8.4.8. Prisma 7.8.0 trong phiếu trước chỉ là ứng viên; phạm vi major 7 đã duyệt cho phép chọn patch sau kiểm chứng. Pin 7.10.0 và overrides mariadb 3.5.4/mysql2 3.24.0/deepmerge-ts 8.0.0 để xử lý audit. Swagger Parser patch 10.1.1 cũng đã validate cả hai contracts. npm audit backend gồm devDependencies báo **0 vulnerabilities**; kết quả tại thời điểm bàn giao, không thay kiểm tra định kỳ hoặc audit hệ điều hành image.

Node global trên máy là 24.18.1. Runtime 24.21.0 được tải riêng vào .tools-runtime, ignored; scripts/use-node.ps1 chọn đúng Node/npm trong terminal, không thay cài đặt toàn máy.

## Cấu trúc được tạo

~~~text
backend/
  package.json, package-lock.json, tsconfig.json, prisma.config.ts, .env.example
  src/
    app.ts, server.ts
    shared/ config.ts, database.ts, http.ts, logger.ts, test-guard.ts
    modules/ README.md, auth/security.ts
  prisma/
    schema.prisma
    migrations/ migration_lock.toml
      202610120000_environment_bootstrap/migration.sql
      202610120001_foundation/migration.sql
  scripts/ migrate.mjs, validate-openapi.mjs
  tests/ unit/foundation.test.ts, integration/foundation.test.ts, browser-smoke.mjs
infra/
  compose.yaml, backend.Dockerfile, frontend.Dockerfile, nginx.conf, .env.example
  mysql/init.sh
scripts/
  setup-local.mjs, use-node.ps1
~~~

Module boundaries customers/orders/production/purchasing/quality/warehouse/inventory/returns/stocktaking/reporting được mô tả trong modules/README.md. Chỉ auth có primitives cần cho nền tảng; không tạo controller/service/repository rỗng. Generated Prisma Client, dist, node_modules, screenshots và private configuration được ignore.

## Database và migration thực tế

| Bảng | Phạm vi nền tảng |
|---|---|
| KhachHang | Customer identity và scope cho account |
| VaiTroQuyen | Role, mỗi account một role |
| Quyen | Permission identifiers |
| VaiTro_Quyen | Liên kết role–permission |
| TaiKhoan | Account metadata, customer_id nullable, không UNIQUE |
| PhienDangNhap | Lưu hash token, idle/hard expiry; chưa có session workflow |
| AuditLog | Storage audit metadata; chưa nghiệp vụ ghi audit hoặc API chỉnh sửa |
| IdempotencyRequest | Storage chống request trùng; chưa posting logic |

Thêm _warehouse_environment làm marker kỹ thuật an toàn test (model EnvironmentMarker), không là lớp Domain mới, và _prisma_migrations của Prisma. Dev marker table trống; test có UUID marker do init tạo. KhachHang 1:N TaiKhoan đã kiểm bằng hai account cùng customer trong transaction test; tài khoản nội bộ customer_id NULL.

Migrations versioned: 202610120000_environment_bootstrap, 202610120001_foundation. Dev/test có hai history entries thành công. Test init tạo marker trước; wrapper chỉ baseline marker metadata khi guard đã kiểm và database chưa có bảng nghiệp vụ. Foundation vẫn chạy migrate deploy thực; không dùng db push/reset/drop hoặc đánh dấu giả schema đã migrate. Shadow replay trên warehouse_shadow trả No difference detected.

SQL migration áp InnoDB, utf8mb4_0900_ai_ci, identifier utf8mb4_0900_bin, BIGINT UNSIGNED, UTC DATETIME(3), FK lịch sử RESTRICT, unique login/code và CHECK login chuẩn hóa/session expiry/idempotency expiry. App users chỉ DML trên database tương ứng; DDL migration và shadow credentials riêng, ứng dụng không dùng root.

Tám bảng nền tảng dev đều có 0 rows khi truy vấn cuối. Test fixtures có run ID và rollback transaction, không dữ liệu nghiệp vụ thật. Chưa tạo stock/BOM/QC/reservation/stocktaking/document tables. Blueprint vẫn hỗ trợ 29 UC; generated lot keys, quota nguồn, locks, posting và business transactions phải kiểm ở UC tương ứng sau schema review. Decimal CAST trên MySQL/adapter đã kiểm đúng quantity/price (20,6), factor (20,9), VND amount (20,0); chưa là kiểm thử tính tiền hay posting tồn.

## API và bảo mật nền tảng

GET /health và /api/v1/health chạy probe MySQL thật; 200 thể hiện application running/database connected, probe lỗi trả 503 degraded. JSON envelope có request ID, lỗi không lộ stack/credentials. /docs phục vụ Swagger; /api/v1/openapi.json chỉ contract 2 health operations trong foundation_api.json. Swagger dùng server URL tương đối, hỗ trợ direct và proxy. Contract api_contract.yaml vẫn là 105 operations dự kiến, chưa triển khai. Route login/CRUD nghiệp vụ trả 404.

Có environment validation, correlation ID, structured logging/redaction, CORS allowlist, body limits, cookie parser, CSRF HMAC gắn opaque cookie, validation/error boundary và RBAC/customer-scope primitives. Cookie có mặt không chứng minh đăng nhập. Chưa login/session resolver/Argon2id hashing/account management; AU01–03 mới có constants/schema/helpers và unit checks tương ứng, không nghiệm thu toàn bộ auth workflow.

## Docker và frontend

Project Compose warehouse-foundation; MySQL dev/test cùng 8.4.8, instances/credentials/volumes riêng. Named volumes warehouse_mysql_dev_data và warehouse_mysql_test_data. Windows dev/test ports 127.0.0.1:3307/3308; network Docker dùng mysql-dev/mysql-test:3306. Profile test chứa mysql-test; profile app chứa migrate one-shot, backend và frontend. Backend 127.0.0.1:3000; frontend Nginx 127.0.0.1:8080. Secrets từ files ignored, không hardcode password. Backend chạy USER node, có OpenSSL/CA cho Prisma.

Frontend Docker build dùng project/lockfile hiện có; Nginx SPA fallback và proxy /api. Direct Vite 5173 proxy /api tới backend 3000. UI/mock/components/routes/assets/styles và dependencies giữ nguyên; chỉ 3 cấu hình frontend đổi:

- src/services/apiClient.js: fallback /api, giữ VITE_API_URL override.
- vite.config.js: /api proxy và VITE_API_PROXY_TARGET.
- .env.example: VITE_API_URL=/api.

SHA-256 baseline kiểm 58 file frontend/Domain: chỉ apiClient.js và vite.config.js khác; .env.example được kiểm riêng vì baseline loại env files. Tám Domain Model giữ nguyên. Không sửa frontend/.env riêng có sẵn; không chuyển trang mock sang API nghiệp vụ. 29 UC01–UC27, UC29, UC30 vẫn CHUA_LAM; không UC28.

## Bằng chứng chạy thực tế

| Kiểm tra | Kết quả và giới hạn |
|---|---|
| Prisma validate/generate | PASS, Prisma 7.10.0, datasource MySQL |
| Backend build | PASS Windows Node 24.21.0 và Docker npm ci/build |
| Frontend build | PASS Windows/Docker; còn cảnh báo bundle >500 kB |
| Migration dev/test | PASS, 2 entries mỗi DB; lặp không pending |
| Shadow replay | PASS, No difference detected; shadow độc lập |
| Unit tests | 8/8 PASS: env/guard/expiry/scope/CSRF/RBAC/validation/errors/health failure |
| Integration/API tests | 3/3 PASS trên MySQL thật: metadata, health/Swagger, FK/CHECK/Decimal/customer 1:N/rollback |
| OpenAPI validation | PASS: foundation 2 operations và planned 105 operations |
| Browser direct | PASS Edge headless Home/Dashboard, không page errors, Vite proxy → MySQL health |
| Browser Compose | PASS Edge headless Home/Dashboard và Nginx proxy → MySQL health |
| Docker runtime | MySQL dev/test, backend, frontend healthy; migrate exited 0 |
| Dependency audit backend | PASS, npm audit tất cả dependencies/devDependencies: 0 vulnerabilities |
| Bảo tồn sources | Hash baseline PASS ngoài 2 thay đổi cấu hình đã nêu; Domain 8/8 nguyên vẹn |

Failure-path 503 có probe stub trong unit test; không giả stub là bằng chứng kết nối/transaction thật. Không chủ động gây mất kết nối MySQL runtime. Screenshots headless ở backend/.artifacts, ignored. Không coi mock Home/Dashboard là UC05 đã triển khai.

## Files thêm/sửa và hiện trạng Git

Thêm toàn bộ files trong cây backend/infra/scripts phía trên; root .gitignore/.dockerignore; docs/foundation_api.json, phase1_runbook.md và phase1_review.md. Cập nhật README.md, AGENTS.md, docs/architecture.md, database_design.md, testing_strategy.md, uc_progress.md, decisions.md, foundation_approval.md, frontend_audit.md, permissions.md; chỉnh ba cấu hình frontend đã liệt kê. Domain/SRS/catalog/RTM và business contract không thay đổi trong Giai đoạn 1.

Git giữ nguyên 11 tracked deletions có sẵn: srs.md cũ, tám domain/*.md cũ và hai DOCX. README/AGENTS/docs/frontend và docs.zip đã untracked từ trước; backend/infra/scripts và ignores mới cũng untracked. Vì vậy git diff tracked không phản ánh toàn bộ files mới; file list và source hashes bổ sung việc kiểm chứng. Không stage, commit, reset, restore hoặc xử lý các deletions có sẵn. Env/secrets/node_modules/dist/generated/runtime/artifacts được kiểm git check-ignore; không đọc/in secrets.

## Chạy thử và các mục còn mở

[Runbook](phase1_runbook.md) có lệnh đúng scripts, startup direct/Compose, migration/tests, Workbench, logs, safe stop và troubleshooting. Trong workspace này secrets đã tạo; không chạy setup lại. Mở frontend http://localhost:8080, health http://localhost:3000/health, Swagger http://localhost:3000/docs. Containers được giữ chạy cho người dùng.

Workbench GUI và nghiệm thu thủ công của người dùng CHUA_KIEM_CHUNG. Windows dev/build đã kiểm; npm start production trên Windows chưa chạy riêng (entrypoint đã chạy trong Docker). Clean npm ci trên host chưa chạy, đã kiểm npm ci trong images. Full stop/down chưa chạy cuối bàn giao vì giữ containers; hướng dẫn không xóa volumes. Bundle warning >500 kB còn tồn tại. Image OS scan, triển khai production/TLS và CI/backup chưa nằm trong kiểm chứng hiện tại; không tự bật chính sách CHUA_DUYET.

Trước UC01: người dùng chạy thử và xác nhận nền tảng, giao UC01 riêng, duyệt bootstrap CSRF/login/account cấp ban đầu và test fixture roles/permissions; các workflow cấp/reset/support hoặc IP thresholds còn mở cần chốt đúng phạm vi. Các policy rounding/BOM/reservation/QC/kiểm kê/giao nhận vẫn CHUA_DUYET, chốt khi UC liên quan được giao. Frontend đang có nhãn Lệnh sản xuất từ mock cũ; giữ nguyên theo yêu cầu, không tạo LenhSanXuat để khớp nhãn.

Dừng tại Giai đoạn 1 và chờ người dùng xác nhận. Không tự đánh dấu nền tảng đã nghiệm thu hoặc UC HOAN_THANH.

## Liên kết evidence hiện hành — 14/10/2026

Thân báo cáo phía trên là bàn giao lịch sử trước đổi stack. Nền tảng đang chạy CommonJS/mysql2/SQL migrations, được kiểm lại tại [phase1_verification.md](phase1_verification.md); [UC01 scope đề xuất](uc01_scope_proposal.md). Không dùng các lệnh TypeScript/Prisma trong lịch sử làm hướng dẫn chạy hiện hành; xem phase1_runbook.md. Nền tảng vẫn chờ nghiệm thu.
