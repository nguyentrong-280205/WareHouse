<!-- WAREHOUSE_PORTABLE_20261023 -->
## Docker warehouse hiện hành — 23/10/2026

Người dùng đã giao thêm SQL Server container và đổi project Docker thành **warehouse**. Compose mặc định tại root chạy SQL Server2022Developer riêng (SSMS: localhost,14330), db-init/migrate/Express/frontend; app http://localhost:8080, backend3001. Lần đầu chạy `node scripts/setup-docker.js` rồi `docker compose up -d --build`; những lần sau `docker compose up -d`. `scripts/start-docker.ps1` nay dùng bản portable, không phụ thuộc SQL Server Windows/dynamic port. [Hướng dẫn hiện hành](docker_warehouse.md).

Giữ nguyên HTTT02/Windows .env/data và các MySQL/Prisma archives. Chế độ Windows chuyển sang `infra/compose.windows.yaml`/`scripts/start-docker-windows.ps1` (project warehouse-windows); hướng dẫn cũ bên dưới về start-docker dò Windows port là lịch sử đã được thay thế cho chế độ mặc định. Không đồng bộ/copy dữ liệu giữa SQL Server Docker và HTTT02; cả hai có thể mở cùng SSMS. Volumes mới warehouse_sqlserver_data/warehouse_demo_artifacts/warehouse_uploads riêng; credentials riêng local ignored, backend không dùng sa. Seed fixture19accounts trong Docker, không import dữ liệu cũ; seed một lần, không overwrite. Schema76bảng/237FK/native checksum và 29UC giữ nguyên, DA_CODE_CHUA_TEST; chỉ kiểm cú pháp/config/bootstrap/migration/health, không unit/integration/E2E/regression. Không commit/reset/drop/delete volume. Nhóm warehouse-foundation cũ giữ ở trạng thái dừng, không tự xóa.

---

# Chuyển nền tảng sang Microsoft SQL Server — 16/10/2026

## Bổ sung sửa lỗi Compose khởi động lại — 16/10/2026

Named instance HTTT02 sau khởi động lại đang ngheTCP52313 (đã dò bằng Windows Authentication), khác60026 trong bằng chứng chuyển đổi ban đầu phía dưới. Đã đồng bộ endpoint local/Docker, giữ nguyên user/password/database; cấu hình cũ sao lưu trong `.artifacts/sqlserver/endpoint-backups`. Không sửa schema/migration đã apply.

Script migration trước đây ghi diagnostics vào thư mục root-owned trong image user node, gây EACCES và che lỗi kết nối gốc. Đã cấp quyền thư mục artifacts cho node và bọc ghi diagnostics để luôn báo mã lỗi gốc. Thêm `scripts/start-docker.ps1` tự khám phá port đúng instance và `backend/scripts/refresh-sqlserver-endpoint.js` chỉ cập nhật endpoint sau kiểm tra cấu hình. Chạy lại bằng script này thay vì dựa cổng động cũ. Không đổi frontend/29UC hoặc chạy test nghiệp vụ.

Bằng chứng sau sửa: Compose migrate exit0, appliedNow[]/pending[] (không chạy lại DDL đã apply); backend3001 và frontend8080 healthy; `/health` và frontend proxy `/api/v1/health` trả database=connected. Node/PowerShell kiểm cú pháp đạt; không chạy unit/integration/E2E/regression. Không commit/reset hoặc xóa dữ liệu/volumes.

Trạng thái mã nguồn: DA_CODE_CHUA_TEST. Đã chuyển runtime/schema/repository sang SQL Server và kiểm tra kỹ thuật tối thiểu; chưa kiểm thử hoặc nghiệm thu 29 UC. Lệnh chuyển database mới nhất thay quyết định MySQL về công nghệ; giữ nguyên 29 UC, FS01–FS12, frontend, SRS và tám Domain Model.

## Kết nối đã xác minh trước migration

- `NGUYENTRONG-200\HTTT02`: SQL Server 2022 Developer 16.0.1210.3.
- Windows Authentication kết nối thành công bằng người dùng Windows hiện hành; có quyền sysadmin trên instance này. Mixed authentication đang bật.
- Kết nối TCP thực tế dùng cổng **60026**, là dynamic port; không giả định 1433. Cần khám phá lại nếu SQL Server thay cổng sau khởi động.
- Thuộc tính MachineName/ServerName còn tên `NguyenTrong-2005`; địa chỉ người dùng cung cấp kết nối được và InstanceName là HTTT02. Không tự đổi tên máy hoặc instance.
- Hai database đích chưa tồn tại tại thời điểm khảo sát. Script bootstrap dừng nếu database/login đã tồn tại, không adopt hoặc ghi đè.

## Thiết kế triển khai

Backend Express/JavaScript CommonJS, `mssql` 12.7.9; SQL Authentication bằng tài khoản ứng dụng riêng, khởi tạo bằng Windows Authentication. Không dùng sa trong ứng dụng. Dev/test và quyền migration tách biệt; bí mật nằm trong `.env`/`.artifacts` bị Git ignore.

SQL Server dùng NVARCHAR cho Unicode, collation `Latin1_General_100_CI_AI_SC` cho nội dung; mã, login và hash dùng `Latin1_General_100_BIN2`. Không có charset utf8mb4/InnoDB trên SQL Server. Tiền VND DECIMAL(20,0), lượng/đơn giá DECIMAL(20,6), hệ số DECIMAL(20,9) giữ nguyên; không chuyển qua JavaScript Number. BIGINT IDENTITY là số dương có giới hạn signed BIGINT; cần đối chiếu max ID trước bất kỳ sao chép dữ liệu MySQL nào.

Migration T-SQL có lineage riêng, checksum và khóa `sp_getapplock`; không chạy lại migration MySQL/Prisma trên SQL Server. Transaction dùng một connection, khóa đọc sửa `UPDLOCK/HOLDLOCK`, kiểm tra reservation/QC/FEFO/kiểm kê như trước. Unique index trên trường nullable phải lọc NULL để giữ ngữ nghĩa MySQL. Kiểm tra database test gồm endpoint, database, principal, instance và marker riêng.

## Bảo toàn dữ liệu và giới hạn

Giữ nguyên migration MySQL, archive Prisma, Docker volumes và dữ liệu MySQL. Chưa sao chép dữ liệu nghiệp vụ cũ: cần bảng mapping, số lượng nguồn/đích, kiểm tra FK và kế hoạch rollback được duyệt trước thao tác sao chép. Khởi tạo database/schema SQL Server mới không chứng minh dữ liệu cũ đã được di chuyển.

Không chạy unit/integration/E2E/regression. Chỉ được ghi nhận kiểm tra kết nối, cấu hình, cú pháp và migration thực tế; không đánh dấu UC HOAN_THANH.

Các hướng dẫn Linked Server/ODBC trước lệnh chuyển công nghệ là DA_THAY_THE. Không cần Linked Server để SSMS mở database SQL Server mới.

## Kết quả thực hiện và bằng chứng tối thiểu

| Hạng mục | Kết quả thực tế |
|---|---|
| Instance | NGUYENTRONG-200\HTTT02, SQL Server2022Developer16.0.1210.3, TCP60026 |
| Authentication | Windows Authentication bootstrap thành công; mixed mode có sẵn; mssql SQL Login app riêng kết nối dev/test thành công |
| Database | warehouse_db và warehouse_test tạo mới, không ghi đè DB/login có sẵn |
| Schema dev | 76 bảng nghiệp vụ,237FK,512CHECK,164index gồm PK/metadata,9filtered unique |
| Schema test | 76 bảng nghiệp vụ,237FK,514CHECK (thêm test marker),165index,9filtered unique |
| Migration | 202610160001_native_schema APPLIED cả hai DB; status pending[] và checksum hợp lệ; Compose migrate exit0 |
| Precision | Đọc qua mssql: decimal(20,6) 99999999999999.123456 và decimal(20,0) 99999999999999999999 giữ nguyên chuỗi; không JS Number mất chính xác |
| Dependency | mssql12.7.9/lossless-json4.3.1; không mysql2/Prisma/ORM runtime. npm ls trực tiếp hợp lệ; npm ci image báo0vulnerability |
| Cú pháp/contract | npm run check đạt cú pháp; OpenAPI foundation/planned/runtime hợp lệ;151business handlers,unbound[],missingReferences[],duplicateOperationIds[]; không HTTP/DB nghiệp vụ |
| Native Windows | Backend3000 health database=connected; Vite5173 trảHTTP200 |
| Docker Windows host | Backend ngoài3001 health connected; frontend8080HTTP200; proxy /api/v1/health connected; containers backend/frontend healthy |
| Dữ liệu cũ | Hai MySQL containers và warehouse_mysql_dev_data/warehouse_mysql_test_data vẫn giữ; inventory chỉ đọc; chưa import dữ liệu nguồn |
| Git | Giữ nguyên11tracked deletions có sẵn và các thư mục untracked; không commit/reset/restore/stage. .env/credentials/secrets bị ignore |

Schema/constraint chi tiết: [manifest đọc thực tế](sqlserver_schema_manifest.md). Các FK/CHECK đều enabled/trusted. Metadata không chứng minh transaction/cạnh tranh nghiệp vụ đúng. Trong hai lần chuẩn bị migration đầu có lỗi DDL chuyển kiểu và đã rollback toàn transaction; đã sửa trước khi bản cuối APPLIED, không drop/reset. File migration đã APPLIED từ đó giữ bất biến.

Tái tạo fixture SQL Server bằng ba seed explicit đã được duyệt:9roles/19accounts/1KH,3kho/5vịtrí, danh mục/versiongiá/BOM/calendar/factors/scopes/permissions. Dùng credentials demo private sẵn có để hash lại Argon2id65536/3/1, không lấy row/hash từ MySQL, không tạo tồn đầu/chứng từ/QC giả. Session/audit/idempotency nguồn chưa chuyển. Người dùng cần đăng nhập lại khi dùng database mới.

Khác biệt T-SQL đã xử lý có chủ đích: khóa range/row; INSERT OUTPUT cùng statement; pagination OFFSET/FETCH/TOP; filtered uniqueness với NULL; enum/JSON/check/computed columns; CASE bit eligibility; ngày VN/UTC; metadata sys.foreign_key_columns; LIKE escape; tách aggregate delivery khỏi SUM/subquery và giữ decimal scale6 trước phép trừ để tránh SQL Server làm tròn trung gian.

## Repository và file thay đổi

- `backend/package.json`, package-lock.json; `src/config/{environment,database}.js`: mssql pool, identity verification, parameter binding, transport exact decimal, transaction và cấu hình named instance/certificate.
- `src/shared/{business-repository,test-guard,http,sql-pattern}.js`: T-SQL CRUD/OUTPUT/locking/pagination/LIKE, guard test và lỗi SQL Server.
- Repository trong auth, warehouse, customers/source, orders, production/calendar/request/forecast, purchasing, QC, inventory/maintenance, returns/unknown, stocktake, dispositions: chuyển cú pháp; business service/FE không đổi. `src/modules/README.md` đồng bộ ranh giới module.
- `database/sqlserver/migrator.js` và native migration mới; các file MySQL SQL/history/Prisma giữ nguyên. Script prepare offline không được ghi đè migration đã tạo.
- `scripts/migrate.js`, các script seed/uc01-data, demo guard, connection/schema inspection, Docker secrets, contract/docs/manifest helpers. Script Linked Server/setup MySQL cũ chặn chạy và đánh DA_THAY_THE; inventory nguồn chỉ archive, không cài lại mysql2 cho runtime.
- Tests hiện có đổi URL/dialect/identity/locking/error semantics sang SQL Server, giữ phạm vi kiểm tra; **không chạy**. Không xóa test hoặc coi đã pass. XACT_ABORT cần tách transaction cho trường hợp cố tình vi phạm constraint.
- `infra/compose.yaml`: chỉ frontend/backend/migrate nối SQL Server host; `compose.mysql.archive.yaml` giữ bản cũ. `.env`/SQL secrets local ignored được cấu hình, không hardcode mật khẩu.
- README, AGENTS, decisions, architecture, database_design, foundation_approval, phase1 review/runbook/verification, testing_strategy, UC progress/catalog/traceability, handoff/checkpoint/manifest, SSMS/local guides và data.md đã có chỉ dẫn hiện hành. Lịch sử công nghệ cũ DA_THAY_THE; không sửa SRS/tám Domain/FS01–12 nguồn.
- OpenAPI chỉ đổi mô tả công nghệ/hiện trạng; operation/path/request/response/schema/security không đổi cấu trúc.

## Chạy và xem dữ liệu

[Runbook Windows/SSMS/Docker/migration/backup](sqlserver_runbook.md). Trong phiên bàn giao này đang chạy native backend3000/frontend5173 và Docker backend3001/frontend8080, cùng SQL Server đã xác minh. Compose mặc định3000; chỉ dùng một backend trên cổng đó, hoặc đặt BACKEND_PORT=3001 như phiên hiện tại.

SSMS: Database Engine → `NGUYENTRONG-200\HTTT02` → Windows Authentication → Connect → Databases → Refresh → **warehouse_db → Tables**. Xem dbo.TaiKhoan/dbo.VaiTroQuyen/dbo.Kho/dbo.TonKho; bảng tồn/chứng từ rỗng là đúng vì chưa tạo nghiệp vụ. Có thể dùng Select Top1000Rows; tránh chia sẻ password_hash/token_hash.

## UC và phần chưa kiểm chứng/cần xác nhận

Đúng29UC: UC01–UC27,UC29,UC30, khôngUC28; tất cả giữ DA_CODE_CHUA_TEST.151handler đã bind từ mã nguồn trước chuyển engine, không có operation thiếu theo inspect tĩnh. Danh sách tên/actor/frontend/backend/checklist ở [tiến độ](uc_progress.md), [bàn giao](full_system_handoff.md), [manifest](full_system_manifest.md). Không phát hiện UC mới cần code thêm trong phạm vi chuyển công nghệ; chưa được phép suy ra chức năng đã đúng từ binding/schema/health.

Chưa chạy unit/integration/E2E/regression, chưa kiểm tay đăng nhập/quyền/quota/QC/FEFO/kiểm kê/concurrency trên SQL Server. Chưa chạy backup/restore hoặc đo hiệu năng. Chưa cố định dynamic port/firewall/certificate production. Bằng chứng PASS MySQL cũ chỉ là lịch sử. Không có action schema/connection đang bị chặn.

Người dùng còn cần lựa chọn riêng việc chuyển dữ liệu MySQL (đặc biệt audit7/session3/idempotency2 và xung đột với fixture đích), cut-off/mapping/row-count/rollback theo [kế hoạch import](sqlserver_data_migration_plan.md). Hiện không import, không xóa nguồn. Khi có lệnh kiểm thử/nghiệm thu mới được chạy bộ test hoặc đánh HOAN_THANH. Ngoại lệ nghiệp vụ/backup retention/RPO-RTO chưa duyệt vẫn giữ mở.
