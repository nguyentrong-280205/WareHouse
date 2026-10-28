<!-- WAREHOUSE_PORTABLE_20261023 -->
## Docker warehouse hiện hành — 23/10/2026

Người dùng đã giao thêm SQL Server container và đổi project Docker thành **warehouse**. Compose mặc định tại root chạy SQL Server2022Developer riêng (SSMS: localhost,14330), db-init/migrate/Express/frontend; app http://localhost:8080, backend3001. Lần đầu chạy `node scripts/setup-docker.js` rồi `docker compose up -d --build`; những lần sau `docker compose up -d`. `scripts/start-docker.ps1` nay dùng bản portable, không phụ thuộc SQL Server Windows/dynamic port. [Hướng dẫn hiện hành](docker_warehouse.md).

Giữ nguyên HTTT02/Windows .env/data và các MySQL/Prisma archives. Chế độ Windows chuyển sang `infra/compose.windows.yaml`/`scripts/start-docker-windows.ps1` (project warehouse-windows); hướng dẫn cũ bên dưới về start-docker dò Windows port là lịch sử đã được thay thế cho chế độ mặc định. Không đồng bộ/copy dữ liệu giữa SQL Server Docker và HTTT02; cả hai có thể mở cùng SSMS. Volumes mới warehouse_sqlserver_data/warehouse_demo_artifacts/warehouse_uploads riêng; credentials riêng local ignored, backend không dùng sa. Seed fixture19accounts trong Docker, không import dữ liệu cũ; seed một lần, không overwrite. Schema76bảng/237FK/native checksum và 29UC giữ nguyên, DA_CODE_CHUA_TEST; chỉ kiểm cú pháp/config/bootstrap/migration/health, không unit/integration/E2E/regression. Không commit/reset/drop/delete volume. Nhóm warehouse-foundation cũ giữ ở trạng thái dừng, không tự xóa.

---

# Chạy hệ thống với SQL Server trên Windows

> **Sửa lỗi khởi động Docker 16/10/2026:** HTTT02 đã đổi dynamic port từ60026 sang52313. Dùng `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-docker.ps1` từ thư mục gốc: script kết nối Windows Authentication để dò TCP port hiện tại, sao lưu cấu hình local ignored, cập nhật endpoint `.env`/Docker secrets (không đổi credentials), rồi chạy Compose. Cổng backend Docker mặc định3001, frontend8080. Đây là cách khởi động ưu tiên sau khi Windows/SQL Server khởi động lại; nút Start của Docker Desktop không tự dò lại cổng SQL Server.

Container chạy bằng user node; image đã cấp quyền ghi đúng thư mục `.artifacts/sqlserver`. Ghi log thất bại không còn che lỗi migration gốc. Không cần reset/drop database hoặc xóa volume khi lỗi kết nối.

Hiện hành ngày 16/10/2026. Backend Express + JavaScript CommonJS + mssql; frontend React/Vite giữ nguyên. Không dùng MySQL/mysql2/Prisma trong runtime mới. Trạng thái UC: DA_CODE_CHUA_TEST, chưa nghiệm thu.

## Instance và bí mật cục bộ

Instance đã kết nối: `NGUYENTRONG-200\HTTT02`, SQL Server 2022 Developer `16.0.1210.3`. Windows Authentication hoạt động, mixed authentication bật. TCP được khám phá thực tế là **60026**. Đây là dynamic port, không cam kết giữ nguyên sau khi dịch vụ thay đổi.

Bootstrap đã tạo `warehouse_db` và `warehouse_test`, bốn login riêng: warehouse_app, warehouse_migration, warehouse_test_app, warehouse_test_migration. App chỉ SELECT/INSERT/UPDATE/DELETE trong database tương ứng; migration có quyền DDL/DML tại database của nó, không sysadmin. SSMS dùng Windows Authentication hiện hành. Không dùng sa cho backend.

`backend/.env` chứa URL kết nối; `backend/.artifacts/sqlserver/bootstrap.json` giữ credentials khôi phục cục bộ. Cả hai bị Git ignore. Không copy nội dung vào chat/log/Git. Cấu hình MySQL cũ đã sao lưu tại `.artifacts/sqlserver/mysql.env.backup`, không ghi đè secrets/volumes MySQL.

Ví dụ cấu trúc URL (chỉ placeholder):

```dotenv
DATABASE_URL=sqlserver://warehouse_app:URL_ENCODED_PASSWORD@WINDOWS_HOST:OBSERVED_PORT/warehouse_db?instance=HTTT02&trustServerCertificate=true
```

Có thể bỏ `:OBSERVED_PORT` và dùng `?instance=HTTT02` để driver khám phá named instance qua SQL Browser; cần Browser/UDP hoạt động. Không tự dùng 1433 khi thiếu port. Với Docker nên khai báo cổng TCP đã xác minh. Encrypt luôn bật; `trustServerCertificate=true` chỉ ngoại lệ development với chứng chỉ cục bộ. Môi trường thật phải dùng chứng chỉ tin cậy, đúng hostname và tắt ngoại lệ này.

Để xem cổng đang phục vụ trong SSMS:

```sql
SELECT SERVERPROPERTY('InstanceName') AS instance_name,
       CONNECTIONPROPERTY('net_transport') AS transport,
       CONNECTIONPROPERTY('local_tcp_port') AS tcp_port;
```

Kết nối Shared Memory có thể trả port NULL; mở kết nối TCP tới named instance để khám phá cổng. Không tự chỉnh TCP/IP, firewall hoặc cố định cổng của những instance khác. Thuộc tính MachineName/ServerName đang giữ tên cũ NguyenTrong-2005, đã ghi nhận; không tự rename.

## Chạy trực tiếp trên Windows — ưu tiên

Từ thư mục gốc, mở terminal PowerShell thứ nhất:

```powershell
. ./scripts/use-node.ps1
Set-Location backend
npm ci
npm run db:connection
npm run db:status
npm run db:status:test
npm start
```

Backend: `http://127.0.0.1:3000`, health: `/health`, Swagger: `/docs`. Script connection chỉ đọc identity và một biểu thức DECIMAL, không thử UC hoặc ghi nghiệp vụ.

Terminal thứ hai từ thư mục gốc:

```powershell
. ./scripts/use-node.ps1
Set-Location frontend
npm ci
npm run dev
```

Frontend: `http://localhost:5173`, đăng nhập tại `/login`. Vite proxy `/api` tới backend 3000. Không cần sửa frontend hoặc API URL. Trên PowerShell, nếu muốn truyền tham số Vite thì dùng `node node_modules/vite/bin/vite.js --host 127.0.0.1` để tránh npm PowerShell shim nuốt tham số.

Không chạy đồng thời hai backend cùng cổng. Khi chuyển từ Compose về native, chỉ `docker compose -f infra/compose.yaml --profile app stop frontend backend`; không dùng down -v hoặc remove-orphans.

## Migration và seed

```powershell
Set-Location backend
npm run db:migrate
npm run db:migrate:test
```

Lineage SQL Server: `database/sqlserver/migrations/202610160001_native_schema.sql`; 76 bảng nghiệp vụ, PK/FK/CHECK/index, QC nhiều đợt/rework/reservation/BOM/kiểm kê/audit. `_sql_migrations` giữ version/checksum/state/finished_at. Runner dùng transaction DDL và sp_getapplock cùng connection; lỗi rollback schema/history, không reset database. Chỉ sửa bằng migration version mới. Không chạy SQL MySQL/Prisma cũ trên SQL Server.

Schema hai database đã được khởi tạo. `scripts/setup-sqlserver.ps1` chỉ dành cho lần tạo mới sau khi kiểm tra instance/quyền; **không chạy lại trên cài đặt hiện có**. Script dừng nếu phát hiện DB/login hoặc manifest bootstrap đã tồn tại. Nếu bootstrap bị gián đoạn, review trạng thái và file ignored trước mọi phục hồi; không xóa/drop để thử lại.

Các lệnh seed explicit (đã chạy trên SQL Server dev, không chạy trên test):

```powershell
npm run seed:uc01:demo
npm run seed:full:demo
npm run seed:simple:demo
```

Seed tái tạo fixture giả đã được duyệt, không nhập dữ liệu MySQL: 9 roles, 19 accounts, 1 KH, 3 kho/5 vị trí, danh mục/giá/BOM/lịch/hệ số/quyền/scope. Không tạo tồn đầu, đơn hàng, QC hoặc phiếu nhập/xuất giả. Mật khẩu hash Argon2id 65536 KiB/3/1; tài khoản demo dễ nhớ và ngoại lệ mật khẩu ngắn giữ đúng allowlist đã duyệt. Hướng dẫn riêng tại `.artifacts/SIMPLE-demo-login.local.md` và `.artifacts/UC01-demo-login.local.md`; không đưa mật khẩu lên GitHub/log. Đăng nhập thành công về `/`. Không sao chép session, audit hoặc idempotency cũ sang database mới.

## Mở trong SSMS

1. Mở SSMS → Connect → Database Engine.
2. Server name: **`NGUYENTRONG-200\HTTT02`**.
3. Authentication: **Windows Authentication**. Với chứng chỉ cục bộ, bật **Trust Server Certificate** trong tùy chọn kết nối; giữ encryption.
4. Connect → Object Explorer → chuột phải **Databases → Refresh**.
5. Mở **Databases → warehouse_db → Tables → dbo.TaiKhoan** (hoặc dbo.Kho, dbo.TonKho, dbo.DonHang).
6. Chuột phải bảng → **Select Top 1000 Rows**. Có thể mở **Keys** để xem PK/FK; không cần Linked Server/ODBC.

Truy vấn không đọc password hash/token:

```sql
USE warehouse_db;
SELECT DB_NAME() AS database_name, SERVERPROPERTY('InstanceName') AS instance_name;
SELECT id, code, login, display_name, role_id, customer_id, status FROM dbo.TaiKhoan ORDER BY id;
SELECT id, code, name FROM dbo.VaiTroQuyen ORDER BY id;
SELECT version, state, finished_at FROM dbo._sql_migrations ORDER BY version;
```

Nếu chưa thấy database, kiểm tra đúng HTTT02, Refresh và quyền login. Không chọn nhầm SQLEXPRESS/HTTT01/instance khác. `warehouse_test` là database kiểm thử riêng, không nơi thao tác dữ liệu demo.

## Docker kết nối SQL Server host

Compose hiện hành chỉ migrate/backend/frontend; không yêu cầu MySQL hoặc SQL Server container. URL trong Docker dùng `host.docker.internal` cùng TCP port thực tế, không dùng localhost trong container. Secrets nằm trong `infra/secrets/sqlserverAppUrl` và `sqlserverMigrationUrl`, bị Git/Docker ignore.

```powershell
# Từ backend, đồng bộ secret lần đầu; dừng nếu secret đã có nhưng khác.
node scripts/sqlserver-docker-secrets.js
# Từ gốc, sau khi dừng backend native để nhường cổng 3000:
docker compose -f infra/compose.yaml --profile app up -d --build
docker compose -f infra/compose.yaml --profile app ps
```

App `http://localhost:8080`, backend `http://localhost:3000`. Có thể đặt `$env:BACKEND_PORT='3001'` để Docker xuất cổng backend khác khi native đang chiếm 3000; nginx vẫn gọi backend:3000 bên trong Docker. Không dùng cấu hình đó cho test tự động vì 3001 là cổng test app lịch sử.

TCP/IP trên HTTT02 phải nghe địa chỉ host Docker truy cập được; firewall chỉ mở phạm vi thực sự cần. Không tự mở rộng rule Windows nếu chưa cần. Compose cũ lưu nguyên byte ở `infra/compose.mysql.archive.yaml`, DA_THAY_THE. Các container MySQL cũ có thể hiện orphan: giữ nguyên, không dùng --remove-orphans/down -v. Hai volume `warehouse_mysql_dev_data`, `warehouse_mysql_test_data` phải được giữ.

## Backup/restore SQL Server

Chạy bằng người có quyền backup trong SSMS; thay đường dẫn bằng thư mục SQL Server service account có quyền ghi, dùng tên file mới. Chưa chạy backup/restore trong nhiệm vụ này.

```sql
BACKUP DATABASE warehouse_db TO DISK=N'D:\SQLBackups\warehouse_db_NEW_TIMESTAMP.bak'
WITH COPY_ONLY, CHECKSUM, COMPRESSION;
RESTORE VERIFYONLY FROM DISK=N'D:\SQLBackups\warehouse_db_NEW_TIMESTAMP.bak' WITH CHECKSUM;
```

Phục hồi thử sang database tên mới sau khi xem RESTORE FILELISTONLY và lập MOVE cho từng logical file. Không WITH REPLACE, không restore đè dev/test, không tự sửa connection của app sang bản phục hồi. Retention, lịch backup, RPO/RTO và tự động hóa vẫn cần quyết định vận hành riêng; không tự đặt.

## Phạm vi kiểm chứng

Được phép: kết nối, identity, metadata/schema/migration, cú pháp và health tối thiểu. **Không chạy unit/integration/E2E/regression** trong đợt chuyển đổi. Các tests đã đổi dialect nhưng chưa thực thi; PASS MySQL cũ không là bằng chứng SQL Server. Cần người dùng kiểm tay/nghiệm thu 29 UC, nhất là transaction cạnh tranh/QC/FEFO/kiểm kê. Xem [báo cáo chuyển đổi](sqlserver_conversion.md).
