Cập nhật 28/10/2026: dùng duy nhất tài khoản xưởng `xuong01` quản lý cả ba xưởng XSX002 (Nước giải khát), XSX003 (Trà và nước trái cây), XSX004 (Nước tinh khiết). Mở lại xuong01, giữ mật khẩu và scope kho hiện có; khóa xuong_ngk/xuong_tra/xuong_nuoc và giữ uc01.workshop khóa, thu hồi phiên cả năm tài khoản. Không xóa tài khoản hoặc lịch sử, không gộp thêm xưởng. Script use-shared-workshop-account.js chạy transaction có guard và audit một lần sau consolidate; chạy lại không tự mở khóa/cấp lại scope. Các ghi nhận dùng ba tài khoản riêng bên dưới là lịch sử đã được thay thế. Không migration, không thay tồn/BOM/giá, không test nghiệp vụ/commit/reset.

# Chạy và chia sẻ hệ thống Docker warehouse

Hiện hành27/10: bootstrap sau seed gọi consolidate-workshops, kết quả3xưởng và3accountriêng theo [hướng dẫn](workshop_consolidation.md). Completion audit/legacy guards ngăn tạo lại demo/XSX001, cấp lại scope hoặc mở khóa account chung khi restart. Mật khẩu chỉ fileignored backend/.artifacts/WORKSHOP-logins.local.md (cũng có trong demo_artifacts). Không reset/xóa volume để đổi danh mục.

Cập nhật gợi ý sản xuất23/10: thêm uploads-init để tạo/cấp owner cho hai thư mục uploads/evidence (không đổi tệp cũ), migrate dùng chung volume uploads để lưu bằng chứng PDF khởi tạo tồn. Sau migration, seed-planning-suggestions chạy một lần:20vật tư/15BOM/lịch, phạm vi đúng ba nhóm đã duyệt, tồn bằng kiểm kê/điều chỉnh. Completion audit ngăn refill tồn/cấp lại scope khi restart. [Thiết kế và kết quả](planning_suggestions_design.md). Quyết định cấp scope mới thay phần “chỉ thêm xưởng” cũ bên dưới trong phạm vi ba nhóm đã xác nhận.

Bổ sung23/10: initialize chạy seed-production-workshops.js để thêm XSX001–XSX004 với tên chính thức theo data.md, giữ xưởng cũ và phân quyền. Người dùng đã xác nhận chỉ thêm4xưởng, giữ nguyên scope; script không ghi TaiKhoan_Xuong. Rerun không nhân đôi. Chưa seed lịch/năng lực/BOM cho xưởng mới.

Bổ sung cùng ngày: người dùng giao thêm giá mẫu cho TP001–TP015. Initialize chạy seed-product-prices.js sau danh mục, chỉ thêm cặp sản phẩm/đơn vị chưa có giá, không ghi đè giá cũ hoặc snapshot đơn hàng. Bảng giá ở [data.md](../data.md). Các ghi chú “chưa có giá” dưới đây là mốc trước lần bổ sung này.

Danh mục cập nhật23/10/2026: migrate áp dụng thêm 202610230001_product_description cho dev/test rồi seed một lần TP001–TP015 (15 ACTIVE,60 quy cách), khóa SKU FS_DEMO_20261015_PET_500 giữ lịch sử. Không overwrite giá trị quản lý sửa sau seed; không seed giá/BOM/tồn cho sản phẩm mới. Xem [data.md](../data.md) và [quy tắc/kiểm chứng danh mục](product_catalog_update.md). Bài kiểm tra riêng quy đổi/HSD/lô/FEFO đã được người dùng giao và chạy trên warehouse_test rollback; không là nghiệm thu29UC hoặc chạy toàn bộ bộ test lịch sử.

Cấu hình hiện hành ngày23/10/2026: project Docker Compose tên **warehouse**, gồm SQL Server2022Developer, db-init, migrate, backend Express/mssql và frontend React. Không thay frontend/SRS/29UC hoặc migration đã apply. Cấu hình SQL Server Windows được giữ riêng.

## Khởi động lần đầu

Bật Docker Desktop ở chế độ Linux containers. Từ thư mục gốc:

```powershell
node scripts/setup-docker.js
docker compose up -d --build
```

Script setup chỉ cần Node để sinh secrets, không cần npm install. Backend dùng Node24.21.0 được đóng gói trong image. Nếu chưa cài Node trên máy người nhận, có thể tạo secrets bằng Docker:

```powershell
docker run --rm -v "${PWD}:/workspace" -w /workspace node:24.21.0-bookworm-slim node scripts/setup-docker.js
docker compose up -d --build
```

Trên máy phát triển hiện tại cũng có thể dùng:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-docker.ps1
```

Script start-docker mới chạy SQL Server Docker, không cần HTTT02/Windows Authentication và không dò cổng Windows nữa. Cần thời gian tải image SQL Server lần đầu; không tắt container trong lúc đang khởi tạo/migrate.

## Các lần tiếp theo

```powershell
docker compose up -d
docker compose ps -a
```

Không còn cần `-f infra/compose.yaml --profile app` khi đứng tại root: compose.yaml ở root include cấu hình infra. Docker Desktop hiển thị nhóm **warehouse** và các container warehouse-sqlserver-1, warehouse-db-init-1, warehouse-migrate-1, warehouse-backend-1, warehouse-frontend-1. db-init/migrate **Exited(0)** là hoàn tất bình thường; ba service SQL Server/backend/frontend phải healthy. Exited(1) cần xem log, không reset dữ liệu để thử lại.

| Thành phần | Địa chỉ |
|---|---|
| App | http://localhost:8080 |
| Backend health | http://localhost:3001/health |
| Swagger | http://localhost:3001/docs |
| SQL Server trong mạng Docker | sqlserver:1433 |
| SQL Server từ Windows/SSMS | localhost,14330 |

Backend dùng login warehouse_app, không sa. Migration và test có login riêng. Dữ liệu trong **warehouse_sqlserver_data**, file credentials demo private trong **warehouse_demo_artifacts**, uploads trong **warehouse_uploads**. Stop/start/recreate container giữ volume. Không `docker compose down -v`, `docker volume prune` hoặc xóa secrets để sửa lỗi đăng nhập.

Port SQL Server Docker cố định theo ánh xạ14330→1433, không phụ thuộc dynamic port của HTTT02. Nếu đổi SQLSERVER_PORT/BACKEND_PORT/FRONTEND_PORT bằng biến môi trường, dùng đúng cổng mới ở SSMS/trình duyệt; frontend origin mặc định chỉ cho localhost8080/5173, thay frontend port cần đồng bộ CORS. Không cần đổi port mặc định cho cấu hình chuẩn.

## Kết nối SSMS trên máy tính

1. Mở SSMS → Connect → Database Engine.
2. **Server name: localhost,14330** (dấu phẩy trước port, không dùng `\HTTT02`).
3. **Authentication: SQL Server Authentication**.
4. User: warehouse_app; password xem file riêng `infra/secrets/docker/SSMS.local.md`. Đây là password database, khác password đăng nhập app.
5. Database: warehouse_db; Encrypt bật, Trust Server Certificate bật cho development cục bộ.
6. Connect → Databases → warehouse_db → Tables. Refresh nếu danh sách chưa cập nhật.

warehouse_app có quyền DML trong warehouse_db. Nếu cần quản trị server/database, credentials sa nằm trong cùng file private; chỉ dùng tại SSMS cho quản trị, không đưa vào backend/Git/chat/log. SQL Server Docker không dùng Windows Authentication hiện hành của máy.

Bạn có thể mở kết nối thứ hai tới **NGUYENTRONG-200\HTTT02** bằng Windows Authentication. Hai server xuất hiện cùng SSMS nhưng có database **độc lập**. Không đồng bộ, Linked Server hoặc copy dữ liệu tự động. Dữ liệu nhập trên app Docker mới chỉ nằm ở Docker. SQL Server Windows/MySQL cũ được giữ nguyên.

## Khởi tạo và seed

SQL Server image chính thức2022 được pin digest trong Compose để không tự thay engine mỗi lần pull. Developer dùng cho development/demo. SQL Server được cấp memory limit2048MiB cho engine; Docker Desktop cần đủ RAM cho cả SQL Server và ứng dụng. Máy nhận cần Docker Linux trên x86_64; không khẳng định tương thích ARM/macOS emulation nếu chưa xác minh.

Trình tự: SQL Server healthy → db-init kiểm nhận diện/installation marker → tạo DB/login/marker test nếu chưa có → migrate dev/test → seed demo được duyệt → backend → frontend. Không thêm bảng nghiệp vụ; marker ownership dùng extended property cấp database. Giữ schema76bảng/237FK và checksum native migration. SQL Server container là default instance nên InstanceName NULL; guard kiểm MachineName=warehouse-sqlserver thay HTTT02, cùng database/login/endpoint/test UUID. Không bỏ kiểm tra identity hoặc guard test.

Secrets riêng mỗi máy trong `infra/secrets/docker/`, Git/Docker ignore. Setup dừng khi cấu hình dở dang/xung đột, không ghi đè hoặc tự đổi mật khẩu server đã có volume. Mất secrets khi vẫn giữ volume cần phục hồi secrets/DB theo kế hoạch, không sinh mới tùy tiện.

Seed chỉ tái tạo fixture giả:9roles/19accounts/1KH,3kho/5vịtrí và danh mục/BOM/calendar/factors/scopes như trước, không tồn đầu/chứng từ/QC. Tài khoản uc01.* nhận mật khẩu ngẫu nhiên lưu private trong volume demo; chín account dễ nhớ dùng secret demo riêng. Trên máy hiện tại setup dùng password demo local đã duyệt nếu có; máy mới không có file đó sẽ sinh password ngẫu nhiên, lưu ở `infra/secrets/docker/simpleDemoPassword` và `SSMS.local.md`. Không commit password hoặc copy WindowsDBcredentials sang người khác.

Seed chạy một lần theo installation ID và revision, lưu dấu hoàn tất trong warehouse_demo_artifacts. Những lần up tiếp theo chỉ kiểm/apply migration mới, không tự seed lại dữ liệu demo đã chỉnh qua app. Nếu initialization trước đó gián đoạn hoặc mất dấu hoàn tất, seed lặp lại phải khớp fixture và không overwrite; xung đột dừng rõ thay vì reset. Không xóa dấu hoàn tất hoặc hạ policy/transaction để bỏ lỗi seed.

## Giữ chế độ SQL Server Windows

Các file `infra/compose.windows.yaml` và `scripts/start-docker-windows.ps1` giữ chức năng host.docker.internal/HTTT02, project tên warehouse-windows. `backend/.env` native Windows không thay trong cấu hình portable. Nếu muốn dùng chế độ Windows:

```powershell
# Dừng app portable để nhường cổng, giữ toàn bộ volumes.
docker compose stop frontend backend
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-docker-windows.ps1
```

Quay về portable:

```powershell
docker compose -f infra/compose.windows.yaml --profile app stop frontend backend
docker compose up -d
```

Không chạy hai frontend/backend cùng cổng8080/3001. Container warehouse-foundation cũ có thể còn hiển thị dưới nhóm cũ; giữ lại ở trạng thái dừng để bảo toàn hiện trạng, không phải service của project warehouse mới. Không chạy Start nhóm cũ cùng lúc. Các MySQL/Prisma history/volumes giữ nguyên, không dùng trong bản mới.

## Chia sẻ cho bạn hoặc giảng viên

Gửi mã nguồn, compose.yaml, infra/ và Dockerfiles/scripts. Không gửi `.env`, infra/secrets, .artifacts, node_modules, uploads hoặc dump database. Người nhận chạy setup để có credentials riêng, rồi docker compose up -d --build. Chỉ gửi image mà thiếu Compose/secrets/setup/migrations thì chưa đủ để khởi tạo hệ thống.

Không tự mang dữ liệu database Windows/MySQL sang máy người nhận. Nếu cần dữ liệu thật, cần backup/mapping/quyền chia sẻ/restore riêng đã được duyệt. Backup Docker SQL Server cần sao lưu database theo SQL Server, volume không thay thế backup có kiểm tra restore.

## Kết quả khởi động thực tế — 23/10/2026

| Hạng mục | Bằng chứng |
|---|---|
| Compose project | warehouse, config root/include hợp lệ |
| Engine Docker | SQL Server2022Developer16.0.4305.5, hostname warehouse-sqlserver |
| SSMS endpoint | Kết nối SQL Authentication từ Windows tới localhost:14330 thành công bằng mssql; không cần HTTT02 |
| Database/schema | warehouse_db và warehouse_test, mỗi DB76bảng/237FK enabled/trusted, migration202610160001_native_schema checksum hợp lệ, pending0 |
| Fixture | warehouse_db19accounts; warehouse_test0accounts, không seed test |
| Test guard | Kiểm đọc DB_NAME/principal/machine/endpoint/UUID test marker thành công; không test ghi dữ liệu |
| Initialization | db-init exit0, migrate exit0; lần sau ghi demo_already_initialized_no_reseed |
| App readiness | Backend /health connected; frontendHTTP200; frontend proxy /api/v1/health connected |
| Cú pháp/config | CommonJS check đạt; OpenAPI validate đạt;151handler,unbound[],missingReferences[],duplicateOperationIds[] |
| Dữ liệu cũ | Hai volume warehouse_mysql_dev_data/warehouse_mysql_test_data còn tồn tại; không thao tác Windows database hoặc import dữ liệu |
| Git | Không commit/reset/stage/restore; giữ nguyên11tracked deletions có sẵn và các file/thư mục untracked. Secrets/bootstrap/SSMS guide local bị ignore |

Files chính: root compose.yaml; infra/compose.yaml, compose.windows.yaml, sqlserver/entrypoint.sh và healthcheck.sh; scripts/setup-docker.js, start-docker.ps1, start-docker-windows.ps1; backend scripts bootstrap-docker-sqlserver/initialize-docker/inspect-docker-foundation; helper config/sqlserver-identity và các guard/migrator/seed dùng helper. Script kiểm kết nối/schema cũng hỗ trợ target Docker; SQL migration đã apply giữ nguyên. README/AGENTS/decisions/architecture/runbook/handoff/data có chỉ dẫn hiện hành. Frontend và contract API không đổi.

## Phân biệt kiểm tra hạ tầng và kiểm thử

Trong thay đổi này chỉ kiểm cú pháp/config/image/bootstrap/migration/schema/health cần để khởi động; không unit/integration/E2E/regression hoặc nghiệp vụ29UC. Các UC giữ **DA_CODE_CHUA_TEST**, không HOAN_THANH. Kết quả thực tế được bổ sung sau khi khởi động, không suy ra pass chức năng từ container healthy.
