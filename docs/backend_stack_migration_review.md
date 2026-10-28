<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

# Bàn giao chuyển đổi backend JavaScript + mysql2

Quyết định người dùng ngày 12/10/2026: Express JavaScript CommonJS + mysql2/promise, SQL migration versioned, Modular Monolith + MVC, Jest/Supertest. Thay thế TypeScript/Prisma; MySQL 8.4.8, dữ liệu và các quyết định nghiệp vụ giữ hiệu lực. Chưa code UC.

## Phân loại trước thay đổi

| Nhóm | Files | Xử lý |
|---|---|---|
| Giữ nguyên | Toàn bộ frontend; docs/srs.md, docs/domain/*, docs/api_contract.yaml, foundation_api.json; MySQL tables/FK/CHECK/indexes, volumes | Hash/metadata baseline và kiểm lại sau đổi |
| Chuyển đổi | backend/src/*.ts, src/shared/*.ts, src/modules/auth/security.ts, tests/**/*.ts; package.json/lock, scripts/migrate.mjs, backend Dockerfile, Compose migrate service | JavaScript CommonJS, pool/transaction, Jest; không đổi API |
| Loại bỏ sau kiểm chứng | 10 files .ts ở src/tests, tsconfig.json, prisma.config.ts, artifacts generated/dist | Người dùng đã cho phép đúng danh sách qua phản hồi; chỉ dọn sau JavaScript/tests chạy |
| Hồ sơ DA_THAY_THE giữ lại | backend/prisma/schema.prisma, migration_lock.toml và SQL migrations cũ | Không chạy Prisma; giữ hồ sơ và SQL nguyên byte để xác minh history |
| Bảo vệ cấu hình/dữ liệu | backend/.env, frontend/.env, infra/.env, infra/secrets/*, MySQL volumes, _prisma_migrations, warehouse_shadow | Không in/ghi đè/xóa hoặc reset; shadow không còn dùng trong quy trình mới |
| Đồng bộ tài liệu | README/AGENTS và tất cả docs ngoài Domain; lịch sử phê duyệt/bàn giao | Đánh dấu quyết định cũ DA_THAY_THE, giữ lịch sử; không đổi BR/FR/AC/29 UC |

## Phương án migration có thể review

Dùng runner SQL nhỏ trong backend/database, mysql2/promise, GET_LOCK theo database, checksum SHA-256 và bảng kỹ thuật _sql_migrations. Đây là metadata công cụ được yêu cầu, không bảng nghiệp vụ mới. Hai SQL files foundation được sao chép nguyên byte từ nguồn cũ; không chạy lại CREATE TABLE trên database đã migrate.

Trước tiếp nhận legacy: kiểm _prisma_migrations có hai migrations finished, không failed/pending/rolled-back; checksum khớp files cũ; đối chiếu metadata đầy đủ columns/types/default/null/collation, PK/unique/index, FK/rules và CHECK/engine của bảng nền tảng với SQL đã review. Chỉ sau đó ghi records BASELINED_LEGACY; giữ _prisma_migrations nguyên vẹn. Schema/checksum sai thì abort trước DDL; không tự chữa drift.

Database mới: chạy SQL thứ tự, marker test guard trước mọi ghi. Migration runner lưu trạng thái APPLYING/APPLIED; DDL MySQL có implicit commit nên lỗi dở dang phải dừng/review, không giả rollback schema hoặc tự chạy lại. Không reset/drop/delete dữ liệu. Kiểm db:status chỉ đọc và báo pending/drift.

Các phần dưới ghi bằng chứng đã chạy. Nền tảng CHO_NGUOI_DUNG_XAC_NHAN, 29 UC CHUA_LAM.

## Stack trước và sau

| Phần | Trước (DA_THAY_THE) | Hiện hành |
|---|---|---|
| Backend | Express 5.2.1, TypeScript 5.9.3, ESM | Express 5.2.1, JavaScript CommonJS, require/module.exports |
| DB access | Prisma Client/adapter 7.10.0 | mysql2/promise 3.24.0, pool/execute/parameterized SQL |
| Migration | Prisma Migrate/schema DSL/shadow | SQL files nguyên byte, checksum/version/GET_LOCK, _sql_migrations |
| Transaction | ORM callback/transaction client | Một mysql2 connection, begin/commit/rollback/release |
| Tests | node:test + tsx/TypeScript | Jest 30.5.2 + Supertest, CommonJS |
| Backend startup | generate → tsc → dist/src/server.js | node src/server.js; dev node --watch; không build |
| Docker | Dev tooling/Prisma/tsc/OpenSSL install | npm ci --omit=dev --ignore-scripts, chỉ runtime dependencies |
| MySQL/frontend | MySQL 8.4.8; React JS/Vite/Tailwind | Giữ nguyên versions/dữ liệu/volumes/UI/mock/dependencies |

Giữ Node 24.21.0 LTS và helper chọn runtime trong terminal; không thay global Node. D08/NT01/NT02 và phần ORM của NT09/NT12 DA_THAY_THE; các quyết định MySQL/precision/auth/cardinality/quy trình giữ hiệu lực. Không ORM thay thế, không microservices. Sources chính thức: [mysql2 Promise API](https://sidorares.github.io/node-mysql2/docs/documentation/promise-wrapper), [Jest CommonJS](https://jestjs.io/docs/getting-started), [MySQL implicit commit](https://dev.mysql.com/doc/refman/8.4/en/implicit-commit.html).

## Cấu trúc backend hiện hành

~~~text
backend/
  package.json, package-lock.json, jest.config.js, .env.example
  src/
    app.js, server.js
    config/ environment.js, database.js
    shared/ http.js, logger.js, test-guard.js
    modules/
      README.md
      auth/security.js
      health/routes.js, controller.js, service.js, repository.js
  database/
    migrator.js, schema-verification.js, sql.js, migration-history.sql
    migrations/202610120000_environment_bootstrap.sql
    migrations/202610120001_foundation.sql
  scripts/ migrate.js, validate-openapi.js, check.js
  tests/ unit/foundation.test.js, unit/migration.test.js
    integration/foundation.test.js, browser-smoke.js
  prisma/ README.md, schema.prisma, migrations/*  # hồ sơ DA_THAY_THE, không thực thi
infra/
  compose.yaml, backend.Dockerfile, frontend.Dockerfile, nginx.conf, mysql/init.sh
scripts/
  use-node.ps1, setup-local.mjs  # helper ngoài backend, bảo tồn private config
~~~

Health dùng MVC thực: route khai báo URL; controller trả envelope; service nhận probe; repository execute SELECT 1 trên connection từ pool. Auth chỉ primitives, không login/session resolver/CRUD. Modules business tương lai được mô tả, không tạo file rỗng. SQL không nằm trong controllers.

withConnection đặt UTC và release trong finally; withTransaction dùng cùng connection, commit hoặc rollback toàn bộ và release khi lỗi/guard fail. Repositories nhận connection từ service/orchestrator. Pool giữ DECIMAL/BIGINT dạng chuỗi; updated_at phải được SQL insert/update ghi rõ, không dựa @updatedAt của ORM. Không đổi column/default/trigger để thay ORM.

## Dependencies

Thêm mysql2 3.24.0 và Jest 30.5.2. Giữ Express/cookie-parser/cors/dotenv/pino/swagger-ui-express/zod, Supertest/OpenAPI validator/browser tooling. Gỡ dependencies trực tiếp @prisma/adapter-mariadb, @prisma/client, prisma, typescript, tsx và sáu @types liên quan; gỡ allowScripts và overrides của Prisma/mariadb/deepmerge. Không còn compiler/ORM trong manifest hoặc startup scripts. Jest có dependencies gián tiếp cho tooling/types nhưng không dùng TypeScript compiler/transpilation cho backend.

npm ci --ignore-scripts đã kiểm trên host; Docker npm ci --omit=dev --ignore-scripts đã kiểm. npm audit --omit=dev báo 0 vulnerabilities. Full audit có 19 moderate dependency entries từ một nhánh Jest → load-nyc-config → js-yaml/argparse → sprintf-js (GHSA-hp3w-g68c-fv3c); chưa giải quyết. Không hạ major Jest bằng audit fix --force. Image runtime không cài devDependencies; không coi full audit đã PASS. Không duyệt telemetry/install scripts tùy tiện.

## Database và migration đã kiểm

Dev warehouse_db ở 3307 và test warehouse_test ở 3308 trên hai MySQL 8.4.8 instances/volumes cũ. Không đổi credentials/private env, không drop/reset/xóa dữ liệu. warehouse_shadow và secrets liên quan cũ giữ nguyên để bảo tồn cấu hình, không dùng bởi runner mới.

8 bảng nền tảng nguyên vẹn: KhachHang, VaiTroQuyen, Quyen, VaiTro_Quyen, TaiKhoan, PhienDangNhap, AuditLog, IdempotencyRequest. _warehouse_environment và _prisma_migrations nguyên vẹn. Đối chiếu trước/sau: 10 bảng cũ mỗi DB có cùng schema/constraints và row counts; 2 history rows mỗi DB giống cả id/checksum/timestamps/state/steps. Tám bảng nền tảng vốn 0 rows trước đổi và vẫn 0 rows cuối. Test marker vẫn 1 row; dev marker 0. Không lấy dữ liệu credentials/password để làm báo cáo.

Test AUTO_INCREMENT có thể tiến lên khi insert rồi rollback; đây là hành vi MySQL trong warehouse_test, không mất rows và không đổi schema/IDs hiện có. Dev counters không bị tests ghi. So DDL đã tách giá trị sequence khỏi cấu trúc, không reset sequence để tạo kết quả giống giả.

Thêm duy nhất _sql_migrations để tracking công cụ. Hai files SQL giữ đúng SHA-256 legacy:

- 202610120000_environment_bootstrap: fc933a4cf2b35db95c4465ee6bf434424f0264e6c73b8212648df61a668ea9e0.
- 202610120001_foundation: 962b65a5da1dbe32e9ee2539cd8ab8463e38c9fe777516a5ab9c0c7cfc9b000e.

Schema verifier đối chiếu columns/types/default/null/collations, PK/unique/indexes, FK/delete-update rules, CHECK enforced/expressions, InnoDB/utf8mb4 và marker constraints trước baseline. Chuẩn hóa khác biệt biểu diễn ENUM/flags index và introducers cho ASCII literal của mysql CLI/driver, không sửa constraint. Đã ghi hai BASELINED_LEGACY ở dev/test, appliedNow=[]; repeat migrate tiếp tục appliedNow=[] và status pending=[]. Không chạy lại CREATE TABLE foundation. _prisma_migrations không xóa/sửa.

Runner GET_LOCK theo database, chống chạy đồng thời. SQL migration mới lưu APPLYING trước DDL, chỉ APPLIED khi mọi statement thành công; checksum/order/unknown history/dở dang phải dừng review. DDL implicit commit nên không giả rollback schema. Không baseline database có bảng không quản lý. Fresh bootstrap path được code/review, nhưng **chưa chạy trên instance sạch mới** trong lần này; không reset database người dùng để kiểm.

Chưa tạo BOM/reservation/QC/ledger/stocktaking/document tables hoặc nghiệp vụ mới. Thiết kế 29 UC vẫn giữ; các UC tương lai phải dùng parameterized SQL, kiểm chứng từ/QC/hold/capacity/phạm vi, locks và cùng transaction cho document/balance/ledger/audit/idempotency theo thiết kế đã duyệt.

## Kiểm tra đã thực sự chạy

| Kiểm tra | Kết quả |
|---|---|
| CommonJS syntax npm run check | PASS, không .ts/.mjs runtime backend |
| Unit Jest | 11/11 PASS: 8 invariants cũ + SQL splitter/checksum/order/incomplete state/transaction commit-rollback-release |
| Integration MySQL thật | 4/4 PASS: pool/UTC/schema/history/status, health/Swagger, FK/CHECK/DECIMAL/customer 1:N/rollback, row lock 2 connections trên marker đã commit |
| Guard test database | Refuse dev/wrong host/user/no marker ở unit; real guard trước DML/transactions |
| SQL migration dev/test | BASELINED_LEGACY sau verify; repeat không pending/appliedNow |
| Bảo tồn DB | 10 bảng cũ mỗi DB/row counts/DDL và 2 legacy history rows nguyên vẹn |
| Direct Windows | npm start tại 3001 và npm run dev/Node --watch tại 3002; health kết nối MySQL thật |
| Direct frontend | npm dev 5174 proxy → backend 3001; Edge Home/Dashboard/health PASS |
| Docker | Build CommonJS runtime PASS; migration exit 0; MySQL dev/test/backend/frontend healthy |
| Docker browser | Edge Home/Dashboard/proxy health 8080 PASS, không page errors |
| OpenAPI | Validator PASS cả foundation 2 operations và planned 105 operations; Swagger HTTP 200 |
| Frontend build | npm run build PASS trên Node 24.21.0; warning bundle >500 kB vẫn còn |
| Sources/contracts | 64 protected files hash nguyên vẹn; paths/components/auth policy OpenAPI unchanged |
| Runtime dependency audit | 0 vulnerabilities; full Jest dev audit còn 19 moderate entries |

Mocks chỉ dùng unit helper/failure-path; pool/FK/CHECK/rollback/locking kiểm MySQL thật. Row lock test không giả đã có stock posting. Browser dùng Edge headless/profile tạm; không thao tác Workbench GUI hoặc nghiệm thu thủ công thay người dùng.

## Lệnh và chạy thử

[Runbook hiện hành](phase1_runbook.md) có scripts khớp manifest. Từ Code, Docker app đang sẵn cho người dùng:

~~~powershell
docker compose --env-file infra/.env -f infra/compose.yaml --profile app --profile test up -d --build
~~~

Mở http://localhost:8080, health http://localhost:3000/health, Swagger http://localhost:3000/docs. Backend direct: chọn Node helper, cd backend, npm ci --ignore-scripts, npm run db:status, npm start hoặc npm run dev; dừng backend container chiếm 3000 trước. Tests: npm test, npm run test:integration, npm run openapi:validate, npm run check. Database scripts có dev/test migrate/status riêng; không script Prisma/build/backend lint chưa cấu hình.

Workbench: host 127.0.0.1, dev 3307 user warehouse_app/schema warehouse_db, test 3308 user warehouse_test_app/schema warehouse_test. Password lấy riêng tư từ secrets devApp/testApp. Kiểm SHOW TABLES, SELECT VERSION/DATABASE/CURRENT_USER, _sql_migrations và legacy history; không app root hoặc DDL trực tiếp lặp. Dừng bằng Compose stop, không down -v; logs chỉ structured errors/correlation, không secrets.

## Files thay đổi

Danh sách dưới là so SHA-256 baseline trước chuyển stack; không suy ra từ git diff vì files dự án đang untracked. Artifacts generated/dist được dọn riêng theo duyệt, node_modules tái tạo bằng npm.

### Sửa (19)

- backend/package-lock.json
- backend/package.json
- backend/src/modules/README.md
- docs/api_contract.yaml
- docs/architecture.md
- docs/database_design.md
- docs/decisions.md
- docs/foundation_approval.md
- docs/frontend_audit.md
- docs/phase0_review.md
- docs/phase1_review.md
- docs/phase1_runbook.md
- docs/testing_strategy.md
- docs/traceability.md
- docs/uc_progress.md
- infra/backend.Dockerfile
- infra/compose.yaml
- README.md
- AGENTS.md

### Thêm (28)

- backend/database/migration-history.sql
- backend/database/migrations/202610120000_environment_bootstrap.sql
- backend/database/migrations/202610120001_foundation.sql
- backend/database/migrator.js
- backend/database/schema-verification.js
- backend/database/sql.js
- backend/jest.config.js
- backend/prisma/README.md
- backend/scripts/check.js
- backend/scripts/migrate.js
- backend/scripts/validate-openapi.js
- backend/src/app.js
- backend/src/config/database.js
- backend/src/config/environment.js
- backend/src/modules/auth/security.js
- backend/src/modules/health/controller.js
- backend/src/modules/health/repository.js
- backend/src/modules/health/routes.js
- backend/src/modules/health/service.js
- backend/src/server.js
- backend/src/shared/http.js
- backend/src/shared/logger.js
- backend/src/shared/test-guard.js
- backend/tests/browser-smoke.js
- backend/tests/integration/foundation.test.js
- backend/tests/unit/foundation.test.js
- backend/tests/unit/migration.test.js
- docs/backend_stack_migration_review.md

### Xóa sau khi người dùng duyệt (15)

- backend/prisma.config.ts
- backend/scripts/migrate.mjs
- backend/scripts/validate-openapi.mjs
- backend/src/app.ts
- backend/src/modules/auth/security.ts
- backend/src/server.ts
- backend/src/shared/config.ts
- backend/src/shared/database.ts
- backend/src/shared/http.ts
- backend/src/shared/logger.ts
- backend/src/shared/test-guard.ts
- backend/tests/browser-smoke.mjs
- backend/tests/integration/foundation.test.ts
- backend/tests/unit/foundation.test.ts
- backend/tsconfig.json

Người dùng đã duyệt danh sách .ts/config/generated/dist và bổ sung ba backend .mjs, với điều kiện bản JavaScript và tests chạy thành công trước dọn. Điều kiện đã đạt. Giữ schema.prisma và SQL/lock cũ làm hồ sơ DA_THAY_THE như phương án đã trình; không còn tham chiếu thực thi. Không xóa files ngoài danh sách này hoặc xử lý Git deletions có sẵn.

Frontend giữ nguyên tuyệt đối trong lần chuyển stack, bao gồm API client/proxy/env example đã có từ Giai đoạn 1 trước. SRS/8 Domain Models/BR/FR/AC/UC catalog/dependencies/domain consolidation giữ hash cũ. API contract chỉ đổi info description và x-foundation/x-pending technical metadata; 105 operationId/endpoints và 89 schemas/auth policy không đổi. RTM chỉ cập nhật test công nghệ thay thế, không đổi BR/FR/AC.

Đã đồng bộ README/AGENTS/architecture/database/approval/decisions/runbook/testing/progress/frontend audit/traceability. phase0_review và phase1_review giữ thân lịch sử, thêm ghi chú stack cũ DA_THAY_THE và link báo cáo mới; không viết lại như JavaScript đã được chọn từ đầu. Các tài liệu không có công nghệ cũ không sửa chỉ để đổi timestamp.

Git status giữ 11 deletions tracked cũ, các thư mục untracked có sẵn và files nền tảng mới; không stage/commit/reset/restore. Secrets/private env/volumes giữ nguyên, không in bí mật. Không chuyển UC/giai đoạn.

## Còn mở và cần người dùng xác nhận

Nền tảng mới **CHO_NGUOI_DUNG_XAC_NHAN**. Cần người dùng chạy thử frontend/health/Swagger/Workbench và nghiệm thu, rồi giao UC01 riêng. Workbench GUI chưa thực hiện; fresh bootstrap và kiểm lỗi DDL dở dang trên instance mới chưa chạy; CI/production/backup không tự triển khai. Full dev dependency audit còn nhánh Jest moderate nêu trên, runtime sạch; tiếp tục theo dõi upstream hoặc duyệt thay đổi tooling khi có bản phù hợp. Cảnh báo bundle frontend >500 kB giữ nguyên.

Quyết định đổi stack và cleanup đã được người dùng xác nhận; không còn xin duyệt lại TypeScript/Prisma hoặc MySQL. Chính sách rounding/BOM/capacity hold UC13/TTL-reservation/QC-reinspection/stocktake/delivery/roles phụ vẫn CHUA_DUYET. Trước UC01 cần chốt CSRF bootstrap/cấp tài khoản test/roles-permissions và workflow cấp/reset/support đúng phạm vi. Không dùng timeout auth cho hold/stocktake, không tự code đăng nhập hoặc đóng UC từ tests nền tảng.

Dừng tại Giai đoạn 1, chờ nghiệm thu nền tảng mới; không bắt đầu UC01.

## Kiểm chứng lại sau chuyển stack — 14/10/2026

Báo cáo chuyển đổi phía trên giữ lịch sử ngày 12/10. [phase1_verification.md](phase1_verification.md) là evidence kiểm lại mới nhất; stack runtime và 15 tests vẫn đạt, giữ archive prisma/data/history, không xóa hoặc commit. Còn 19 moderate dev entries, 5 lint warnings frontend, bundle warning, fresh migration/recovery và nghiệm thu GUI chưa làm. [Đề xuất UC01](uc01_scope_proposal.md) chỉ tài liệu sau kiểm tra, chưa code.
