<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

## Thay thế nền tảng đã được người dùng xác nhận 16/10/2026

Quyết định chuyển database trong chat/attachment thay NT02/NT03 và phần MySQL của NT04/NT09/NT10/NT11: dùng mssql/T-SQL/SQL Server Windows; không Prisma/mysql2. Node24.21.0, Express5.2.1, CommonJS/MVC và frontend giữ nguyên. NT06 precision/VND, NT07 KhachHang1:N TaiKhoan và các quyết định auth/timeout/Argon2id vẫn có hiệu lực; FS01–FS12 không đổi. Kết nối và migration SQL Server đã thực hiện, không suy rộng thành nghiệm thu nền tảng hoặc UC.

# Phiếu phê duyệt thiết kế nền tảng

## Xác nhận UC01 bổ sung — 14/10/2026

Người dùng đã giao Giai đoạn 2 chỉ UC01 và chốt NT08 hash Argon2id memoryCost=65536 KiB/timeCost=3/parallelism=1, cấu hình qua env được kiểm hợp lệ; seed demo theo SRS/permissions được phép, không plaintext password DB/GitHub/log, landing `/` và menu theo quyền. AU01–03 giữ nguyên. Hiện UC01 CHO_NGUOI_DUNG_XAC_NHAN, không là nghiệm thu tự động hoặc lệnh UC tiếp theo. [Bằng chứng](usecases/UC01_review.md). Quyết định TypeScript/Prisma lịch sử vẫn DA_THAY_THE; các policy nghiệp vụ chưa duyệt giữ mở.

## Quyết định công nghệ hiện hành — 12/10/2026

Người dùng chính thức thay thế TypeScript/Prisma bằng Express JavaScript thuần CommonJS + mysql2/promise, SQL migration versioned, Modular Monolith + MVC và Jest/Supertest. Quyết định này thay phần công nghệ của D08/NT01/NT02/NT09/NT12; Node 24.21.0, Express 5.2.1, MySQL 8.4.8 và toàn bộ quyết định dữ liệu/nghiệp vụ giữ hiệu lực. Không ORM, không TypeScript/Prisma runtime hoặc build. Nền tảng CHO_NGUOI_DUNG_XAC_NHAN; 29 UC CHUA_LAM.

| Quyết định | Trạng thái hiện hành |
|---|---|
| NT01 TypeScript 5.9.3/ESM backend | DA_THAY_THE bằng JavaScript CommonJS; Node/Express giữ hiệu lực |
| NT02 Prisma 7/Client/adapter | DA_THAY_THE bằng mysql2/promise 3.24.0 |
| NT09/NT12 Prisma migration/transaction client/schema DSL | DA_THAY_THE bằng SQL migration và mysql2 connection; versioning/review/transaction vẫn bắt buộc |
| NT03–08, NT10–11, AU01–03 và chính sách nghiệp vụ | Giữ hiệu lực; phần CHUA_DUYET không được tự chốt |

Hai SQL migrations giữ nguyên byte/checksum. Runner kiểm schema/history trước BASELINED_LEGACY, giữ _prisma_migrations và dữ liệu/volumes. _sql_migrations là metadata công cụ được yêu cầu, không bảng nghiệp vụ mới. DDL implicit commit: lỗi dở dang dừng ở APPLYING để review, không reset/drop hoặc giả rollback. [Báo cáo](backend_stack_migration_review.md).

**Các mục phê duyệt/bằng chứng bên dưới là lịch sử trước đổi stack; TypeScript/Prisma trong đó DA_THAY_THE, không là chỉ dẫn công nghệ hiện hành.**


Ngày 12/10/2026. **Thiết kế nền tảng đã được xác nhận; người dùng đã giao Giai đoạn 1. Nền tảng đã kiểm chứng kỹ thuật, đang CHO_NGUOI_DUNG_XAC_NHAN.** NT02 đã kiểm kết nối, migration và replay thực tế bằng Prisma 7.10.0 với MySQL 8.4.8; các policy nghiệp vụ còn CHUA_DUYET được giữ mở. Các phương án B chưa được chọn chỉ là lịch sử so sánh. Không sửa SRS/tám Domain Model.

Đã đối chiếu [phase0_review.md](phase0_review.md), [decisions.md](decisions.md), [database_design.md](database_design.md), [architecture.md](architecture.md), [README.md](../README.md) và [AGENTS.md](../AGENTS.md). Bảng D01–D14 đầu decisions là lịch sử; bảng xác nhận hiện hành và phần CHUA_DUYET mới là căn cứ.

## 1. Đối chiếu trước duyệt (lịch sử; trạng thái hiện hành tại mục 2 và 8)

| Nguồn | Quyết định còn CHUA_DUYET | Ảnh hưởng |
|---|---|---|
| D08 | Phiên bản Node/Express/Prisma/MySQL, driver, ESM, cấu trúc backend | Package/config, Prisma Client, môi trường chạy và migration |
| D06/D08 | Collation, chuẩn mã/login, PK/FK, precision/scale, timestamp | Kiểu cột, uniqueness, khả năng đổi schema sau khi có dữ liệu |
| D07 | Account–customer–role cardinality, session store, hash mật khẩu, CSRF, scope | FK/unique, cột phiên đăng nhập và middleware RBAC |
| D07 | TTL/refresh/rate limit/khóa account | Cột trạng thái/expiry; giá trị vận hành có thể chốt trước UC01 |
| D04/D08 | Constraint ngoài Prisma DSL, idempotency, transaction/lock order | SQL migration, ledger/tồn/quota không bị trùng hoặc tranh chấp |
| D08/D14 | Migration workflow, credential, test/shadow DB và Compose volumes | Quyền DDL, reset test và sự cách ly dữ liệu |
| D03/D09 | Capacity reservation UC13, hold expiry/renew, freeze/rolling stocktake | Bảng/cột/constraint chỉ được migrate khi phần tương ứng được duyệt |
| D01/D05/D10/D11/D12 | BOM/capacity/rounding; reinspection; delivery/reception/approval và unknown lot | Schema nghiệp vụ đã có thiết kế logic, nhưng chưa đủ để migrate toàn bộ ngay |

Không phải mọi dòng đều chặn **CREATE DATABASE trống**. MySQL/charset/collation/database isolation chặn bước đó; cardinality/kiểu dữ liệu/constraints chặn **migration bảng**; stack/module boundary chặn **khởi tạo backend**. Nếu yêu cầu migration toàn bộ schema ngay ở Giai đoạn 1, các policy ảnh hưởng cấu trúc cũng phải duyệt trước. Đề xuất migration tăng dần để không âm thầm chốt nghiệp vụ còn mở.

## 2. Bảng nền tảng đã xác nhận

Các phiên bản NT01/NT03 đã được phê duyệt; patch Prisma 7.10.0 ở NT02 đã pin và chạy tích hợp trong Giai đoạn 1. Nguồn phiên bản và nhận xét trước triển khai ở các mục bên dưới được giữ làm lịch sử; bằng chứng hiện hành tại mục cuối và phase1_review.md. Pin exact version trong manifest/lockfile; nâng patch có kiểm tra release notes và regression. Trước triển khai kiểm lại package/image availability, dependency audit và runtime compatibility. Không tự đổi major hoặc database provider.

| ID | Phương án đề xuất A | Phương án B / đánh đổi | Thời điểm áp dụng | Trạng thái ngày 12/10/2026 |
|---|---|---|---|---|
| NT01 | Node.js **24.21.0 LTS**, Express **5.2.1**, backend TypeScript **5.9.3**, ESM; npm với lockfile backend riêng | Node 22 LTS đáp ứng Prisma v7 nhưng vòng đời ngắn hơn; Express 4 chỉ khi có middleware bắt buộc | Trước khởi tạo backend; không đổi package/frontend hiện có | DA_XAC_NHAN |
| NT02 | Prisma **7.x** và adapter tương thích MySQL; datasource `mysql`, `relationMode=foreignKeys`; pin CLI/Client/adapter đồng bộ sau kiểm chứng. **CLI/Client/adapter-mariadb 7.10.0 đã pin và kiểm chứng; 7.8.0 là ứng viên lịch sử** | Chọn patch Prisma 7 khác sau cùng kiểm chứng; không tự dùng latest hoặc Prisma major khác | Trước scaffold ORM/schema. Tên adapter không đổi MySQL Server thành MariaDB | DA_XAC_NHAN phạm vi; DA_KIEM_CHUNG runtime nền tảng, chờ nghiệm thu |
| NT03 | MySQL Community **8.4.8 LTS** (ngoại lệ đã được người dùng xác nhận khi tag 8.4.12 không tồn tại), InnoDB; cùng version cho dev/test | MySQL 8.0 chỉ nếu có môi trường bắt buộc; không ưu tiên cho dự án mới | Trước tạo MySQL/database; đáp ứng yêu cầu 8.0+ | DA_XAC_NHAN |
| NT04 | Charset `utf8mb4`; văn bản `utf8mb4_0900_ai_ci`; mã kỹ thuật/login/token hash dùng collation `utf8mb4_0900_bin` hoặc kiểu binary phù hợp | `utf8mb4_0900_as_cs` cho văn bản cần so sánh phân biệt dấu/chữ hoa | Trước database và các bảng. Login trim/lowercase ASCII; mã nghiệp vụ chuẩn hóa rõ trước unique; permission IDs giữ nguyên case theo contract | DA_XAC_NHAN |
| NT05 | PK/FK `BIGINT UNSIGNED`, autoincrement; ID API là chuỗi; lịch sử FK RESTRICT, status/version/audit theo thiết kế; `DATETIME(3)` UTC, NSX/HSD là DATE | UUID có thể dùng nếu cần tạo ID phân tán, hiện chưa có nhu cầu | Trước migration bảng; join tables có PK ghép như thiết kế, không một bảng mỗi actor | DA_XAC_NHAN |
| NT06 | VND; số lượng **DECIMAL(20,6)**; đơn giá **(20,6)**; thành tiền **(20,0)**; hệ số **(20,9)**; không làm tròn trung gian, rule tại xác nhận chứng từ phải được duyệt | Lịch sử: thành tiền(20,2) không được chọn; thuật toán làm tròn còn CHUA_DUYET | Trước migration bảng định lượng. Dùng Decimal và chuỗi ở API; chai/lon/cái phải nguyên | DA_XAC_NHAN |
| NT07 | VaiTroQuyen 1:N TaiKhoan, mỗi account một role; **KhachHang 1:N TaiKhoan**; customer_id nullable FK, **không UNIQUE**, account nội bộ NULL; scope theo KhachHang | Lịch sử: mỗi KH tối đa một account không được chọn; multi-role/account chưa duyệt | Trước migration auth/customer. Nhiều role/account cần duyệt riêng, không thêm join multi-role ngầm | DA_XAC_NHAN |
| NT08 | Session opaque HttpOnly cookie, lưu hash token trong PhienDangNhap MySQL; Argon2id; CSRF ràng buộc session; backend RBAC và object scope | Redis session store khi có nhu cầu scale; hiện một monolith/MySQL đủ căn cứ | Trước scaffold auth/schema; endpoint đăng nhập thuộc UC01 được giao riêng | DA_XAC_NHAN |
| NT09 | Migrate có version/review, không db push; SQL bổ sung CHECK/generated column/collation trong migration; Prisma transaction client dùng chung orchestration | Tách hai balance tables thay XOR/generated unique chỉ khi thử nghiệm xác nhận Prisma không đáp ứng và người dùng duyệt lại | Trước migration bảng liên quan; transaction/locking phải kiểm trên MySQL thật | DA_XAC_NHAN |
| NT10 | Hai MySQL instances dev/test, DB lần lượt `warehouse_db`/`warehouse_test`, credential và volumes riêng; shadow DB riêng trên môi trường migration | Một instance chứa hai DB tiết kiệm RAM nhưng cách ly yếu hơn, vẫn cần user/grants/guard riêng | Trước database/test migration; shadow DB chỉ công cụ dev, không database nghiệp vụ thứ ba | DA_XAC_NHAN |
| NT11 | Docker Compose V2 sau lệnh triển khai; dịch vụ MySQL dev + test profile, BE/FE profile tùy chọn; named volume riêng `/var/lib/mysql`, healthcheck và secrets ngoài Git | Chạy MySQL/BE/FE trực tiếp nếu chưa dùng Docker, nhưng vẫn cùng version/DB isolation | Trước dựng môi trường. Image `mysql:8.4.8` đã kiểm manifest/pull/run theo xác nhận mới; Compose đã được giao và kiểm thực tế | DA_XAC_NHAN |
| NT12 | Giữ monorepo; backend modules/shared/prisma/tests như architecture, schema/migrations tăng dần theo phạm vi đã duyệt; module gọi application service công khai | Migration toàn bộ ngay đòi duyệt tất cả cấu trúc nghiệp vụ còn mở | Trước scaffold backend. Không tạo controllers nghiệp vụ UC chưa được giao | DA_XAC_NHAN |

**Nguồn phiên bản:** [Node 24.21.0 LTS](https://nodejs.org/en/blog/release/v24.21.0), [Express support](https://expressjs.com/en/support/) và [release history](https://github.com/expressjs/express/blob/master/History.md), [TypeScript 5.9.3 stable](https://github.com/microsoft/TypeScript/releases/tag/v5.9.3), [Prisma 7.8.0 stable](https://github.com/prisma/orm/releases/tag/7.8.0), [Prisma v7 requirements](https://www.prisma.io/docs/orm/v7/reference/system-requirements), [MySQL connector/adapter](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/mysql), [MySQL 8.4.12 release](https://dev.mysql.com/doc/relnotes/mysql/8.4/en/news-8-4-12.html). Tài liệu Prisma v7 yêu cầu TypeScript từ 5.4; package registry availability vẫn cần kiểm trước triển khai.

## 3. Decimal, collation và quan hệ

- DECIMAL(20,6) có 14 chữ số phần nguyên; (20,0) có 20 chữ số phần nguyên; (20,9) có 11 chữ số phần nguyên. Tổng/nhân tính bằng Decimal với độ chính xác đủ, kiểm overflow trước ghi. Không dùng JavaScript Number làm phép tính tồn/tiền.
- Scale lưu trữ không xác nhận quy tắc làm tròn nghiệp vụ. Đã xác nhận không làm tròn trung gian và bắt buộc rule làm tròn khi xác nhận chứng từ. Mode (HALF_UP/HALF_EVEN...), làm tròn theo dòng hay tổng, và cách tổng hợp tiền **CHUA_DUYET trước UC11/26**; không coi HALF_UP là đã được duyệt. Hao hụt/BOM fractional-to-discrete/occupancy rounding chưa đủ căn cứ: không âm thầm round/truncate/default zero. Payload vượt scale không được để MySQL tự làm tròn; báo validation error hoặc áp rule đã được duyệt.
- General text collation hỗ trợ tìm kiếm không phân biệt dấu/chữ hoa. Identifier dùng so sánh chính xác sau normalization để unique không gộp hai mã khác nhau vì dấu. Chính sách chuẩn hóa mã nghiệp vụ phải được review theo dữ liệu mẫu trước seed; không đổi tên/dữ liệu frontend hiện tại.
- FK role_id bắt buộc; FK customer_id chỉ có ở account khách hàng theo validation role, tài khoản nội bộ NULL. Profile KH và authentication account là hai thực thể, không nhập thành một bảng. DonHang vẫn trỏ KhachHang, audit trỏ TaiKhoan.
- Quyen/VaiTro_Quyen chuẩn hóa danhSachQuyen; TaiKhoan_Kho/TaiKhoan_Xuong theo các catalog FK đã duyệt. Không cấp quyền kho/xưởng khi chưa có assignment, không admin mặc định được duyệt tồn. Chỉ migrate scope links cùng bảng đích có căn cứ.
- BIGINT unsigned và CHECK/XOR/unique cần SQL review: generated lot_kind/lot_key giữ hai FK thật, chặn tồn trùng do NULL. Tổng QC/holds/return/capacity là invariant liên bảng, transaction/lock thực thi, không CHECK liên bảng.
- FK ghép kho–vị trí/chứng từ phải trỏ candidate key UNIQUE đầy đủ ở bảng cha, ví dụ UNIQUE(id,warehouse_id) trên vị trí và header phiếu. Không dựa index không unique để chứng minh quan hệ thuộc kho. DECIMAL của ledger/delta là kiểu có dấu, còn các lượng on_hand/reserved/accepted có CHECK không âm.

## 4. Authentication đã xác nhận; chưa triển khai

1. Account ACTIVE, username normalized unique, password_hash VARCHAR(255). Argon2id cấu hình ứng viên memory 19 MiB, iterations 2, parallelism 1; salt riêng do thư viện tạo. Benchmark hash khi được chạy hạ tầng, tăng cost nếu phù hợp. [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
2. Session token ngẫu nhiên 32 byte; cookie chứa opaque token, DB chỉ SHA-256 hash, account_id, created_at, last_seen_at, idle_expires_at, absolute_expires_at, revoked_at. FK account và UQ token_hash; index account/expiry. Renew idle timeout không kéo dài absolute timeout.
3. Cookie `warehouse_session`, HttpOnly, SameSite=Lax, Path=/, không Domain. Secure=true khi HTTPS; dev HTTP localhost mới cho Secure=false theo config môi trường. Không đưa session vào localStorage. Thay session ID khi login/đổi quyền; logout/revoke/khóa account chặn session ngay.
4. CSRF token ràng buộc phiên, gửi trong X-CSRF-Token cho thao tác ghi; server so sánh an toàn và kiểm Origin allowlist. Đề xuất derive token bằng HMAC với CSRF secret và opaque session token để GET /auth/me có thể cấp lại mà không lưu secret rõ trong log; csrf_hash giữ hash để kiểm nếu dùng cột hiện có. Secret rotation có quy trình, không tự log/copy token. Login chưa có phiên phải kiểm Origin và JSON Content-Type để chặn login-CSRF; cơ chế bootstrap cụ thể cần thống nhất contract trước UC01. SameSite không thay CSRF token. [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
5. RBAC deny by default, role permission + warehouse/workshop/customer scope tại backend; tải trạng thái/quyền hiện hành, không chỉ tin frontend/session snapshot. Actor/quyền quyết định còn CHUA_DUYET không được cấp tự động.
6. Tương lai ưu tiên proxy /api cùng origin với FE; khác origin dùng CORS allowlist và credentials. Bước này không sửa apiClient/Vite/frontend. Tích hợp login UI khi UC01 được người dùng giao.

| ID | Thông số vận hành DA_XAC_NHAN | Thời điểm bắt buộc |
|---|---|---|
| AU01 | Idle timeout 30 phút, absolute lifetime 8 giờ; không remember-me, không refresh token; hết hard timeout đăng nhập lại | Trước chạy UC01, không chặn tạo DB trống |
| AU02 | Sau 5 lần sai/account trong 15 phút, khóa tạm 15 phút; reset window khi hết hạn; tách admin LOCKED khỏi khóa tạm; endpoint thêm rate limit theo IP cấu hình | Trước UC01; cần duyệt threshold IP theo môi trường, không hardcode số chưa chọn |
| AU03 | Mật khẩu tối thiểu 12 và tối đa 128 ký tự, không cắt chuỗi; thay/reset tài khoản bằng quy trình hỗ trợ được duyệt, không UC mới | Trước UC01/seed account; cách cấp/reset ngoài phạm vi chưa duyệt vẫn chờ |

Cột expiry/failed-attempt/locked_until có căn cứ authentication, khác giá trị TTL/threshold. Đề xuất failed_attempt_count, failed_window_started_at và locked_until trên TaiKhoan cho AU02; khóa tạm không tự đổi trạng thái admin LOCKED. AU01–03 đã xác nhận: idle 30 phút/hard 8 giờ, 5 lần sai trong 15 phút khóa tạm 15 phút, password 12–128; threshold rate limit IP và quy trình cấp/reset vẫn CHUA_DUYET. Không code UC01 trong bước phê duyệt này.

## 5. Migration/test/Compose dự kiến

- Backend runtime user chỉ DML trong database của mình; migration user DDL riêng. Credential test không quyền warehouse_db, dev không warehouse_test. Không chạy ứng dụng bằng root.
- Migration candidate dùng môi trường authoring riêng và shadow DB riêng; review SQL trước áp warehouse_db. `migrate dev` chỉ môi trường authoring được phép, không trỏ dữ liệu dev người dùng để nhận đề nghị reset; `migrate deploy` áp migration reviewed lên dev/test. Sau apply không sửa migration lịch sử, tạo migration mới. MySQL DDL không coi rollback như DML; forward fix/backup restore trước thay đổi rủi ro.
- MySQL test instance/volume riêng; test chỉ warehouse_test khi NODE_ENV=test, tên DB exact, host allowlist, SELECT DATABASE(), marker và grants đúng. Fixture namespace/run_id, cleanup đúng rows; reset/rebuild test cần phạm vi cho phép, không reset dev. Shadow DB disposable không dùng làm test/real data store. [Prisma shadow database](https://www.prisma.io/docs/orm/v7/prisma-migrate/understanding-prisma-migrate/shadow-database), [unsupported SQL features](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/unsupported-database-features).
- Compose V2, một default dev service và test profile để không luôn dùng RAM hai instances. Named volumes dự kiến `warehouse_mysql_dev_data`, `warehouse_mysql_test_data`; projects/service names không để hai MySQL cùng volume. Credentials khác nhau, init chỉ tạo DB/user khi volume mới; đổi env không tự đổi mật khẩu trên volume cũ.
- Healthcheck xác minh MySQL sẵn sàng, migration service một lần sau DB healthy; BE ready sau migrations. Không chạy migrations cạnh tranh từ mọi BE instance. Chạy trực tiếp FE/BE bằng script dự án vẫn được hỗ trợ, không thay framework.
- DB server/session UTC, hiển thị/ngày nghiệp vụ Asia/Ho_Chi_Minh. Dev port chỉ bind localhost, test port khác; container dùng service hostname nội bộ. Connection time_zone kiểm khi mở pool, không chỉ dựa TZ của container.
- Volume giữ dữ liệu sau stop/down thông thường. Không dùng down -v/reset volume dev. Volume không phải backup; backup và restore được duyệt riêng. Secrets lấy file cục bộ ngoài Git/Compose secrets, không ghi password vào YAML/command/log. [Docker volumes](https://docs.docker.com/engine/storage/volumes/), [Compose secrets](https://docs.docker.com/compose/how-tos/use-secrets/).

## 6. Phạm vi hỗ trợ 29 UC và migration tăng dần

Thiết kế dự kiến giữ UC01–UC27/UC29/UC30, không UC28, không LenhSanXuat, không bảng điều phối hoặc entity trùng theo actor. Đề xuất nền tảng không rút gọn blueprint 29 UC.

| Năng lực cần hỗ trợ | Căn cứ / dữ liệu đã có trong database_design | Điều cần giữ trước migration liên quan |
|---|---|---|
| Auth, danh mục, đơn hàng/báo cáo | TaiKhoan/VaiTroQuyen/KhachHang;34 lớp SRS (33 unique trong8 view, NCC từ SRS) | NT04–08, FK/scope; không tự thêm UC quản trị |
| BOM/KHSX/cấp phát/mua NL | DinhMuc/ChiTietDinhMuc/NhuCauNL, FK BOM version theo dòng plan | M:N/version/effectivity; plan CHO_DUYET ngay sau lập; rounding/hao hụt chưa chốt không tính ngầm |
| Reservation UC15 | DatGiuTon, issue_line/source/stock/allocation version | initial/consumed/released/remaining, expiry; confirm chỉ reserved, post consume+on_hand+ledger atomic; TTL/priority trước UC15 |
| QC nhiều đợt/nhập từng phần | QC source/lot/batch lines, FK receipt→QC; source+batch unique | Không unique cả request để ép1:1; accepted+rejected=inspected, total inspected và received quota locks |
| Tồn/truy vết chứng từ | TonKho, StockPosting/LichSuBienDongTon/AuditLog/IdempotencyRequest | XOR FK lô, normalized unique, immutable ledger và UQ chứng từ nguồn; không balances sửa từ form |
| Kiểm kê | Scope/snapshot/round/lease/generation/verify/proposal | Gián đoạn/cancel invalidates pending proposals trước unlock; không lease vô hạn hoặc duyệt snapshot cũ |
| Giao/return/cách ly/xử lý | Delivery/reception/return detail và source documents | Delivered khác issued, quota trả theo delivered, quarantine trước QC; restock không double physical |
| Đơn vị/sức chứa | Units/packaging version/factor riêng occupancy | Không cộng khác dimension; capacity reservation UC13 vẫn CHUA_DUYET |

**Migration nền tảng ban đầu đề xuất:** chỉ auth/customer/role/permission/session và metadata audit/idempotency cần dùng đã được duyệt. Catalog/scope links được bổ sung cùng bảng đích khi phạm vi được duyệt; nếu chưa có warehouse/workshop scope thì quyền tương ứng bị deny, không seed assignment giả. Các bảng BOM/QC/hold/count/delivery trong blueprint không bắt buộc tạo toàn bộ ở migration đầu. Seed giả không thực thi nghiệp vụ UC hoặc tạo stock bằng update trực tiếp.

FK sang StockPosting/chứng từ chưa có không được tạo trước bảng đích. Nếu metadata idempotency có posting_id, hoãn cột/FK này đến migration inventory đã duyệt; không thay FK thật bằng ID không ràng buộc để vượt thứ tự phụ thuộc. Thiết kế chia migration cũng cần review và ghi trong phạm vi Giai đoạn 1.

Không thêm bảng business mới trong phiếu này. Các cột kỹ thuật được đề xuất dựa trên authentication/locking/migration, vẫn cần người dùng duyệt; không tự tạo model Prisma.

## 7. Có thể trì hoãn, nhưng phải chốt trước UC/migration tương ứng

| Quyết định | Trước UC/phần nào | Điều kiện trì hoãn |
|---|---|---|
| BOM rounding/wastage/PO future; năng lực/lịch xưởng; CRUD support | UC02/03/22/26; D01/11 | Không migration capacity calendar hoặc activate nhu cầu rule chưa duyệt |
| Capacity reservation UC13; occupancy rounding/factors | UC19/13/21/16/17; D03/06 | Không migrate DatGiuSucChua khi chưa chọn; giữ revalidation capacity trong blueprint |
| Hold TTL/renew/priority/partial allocation | UC15/12/23; D03 | Migration structural hold và policy được review trước UC15; nền tảng chưa confirm holds |
| Freeze vs rolling; stocktake lease max/renew/cancel/affected holds | UC07/08/09; D09/04 | Schema scope/lease và phương án đối chiếu phải duyệt trước migration liên quan, không mặc định frozen/rolling |
| Delivery/reception actor, exception return, unknown lot/disposition approver | UC12/14/17/18; D05/12 | Không cấp helper permissions hoặc migrate policy-dependent detail chưa duyệt |
| Reinspection/reversal/maker-checker/overproduction | QC/posting/approval UC liên quan; D02/04/10 | Không tự mở đường sửa posted/QC hoặc bypass approval |
| FEFO tie/HSD boundary/warnings, giá/tiền tệ | UC11/15/12/23/26/05; D12/13 | Chọn rule trước logic sử dụng; monetary rounding trước lưu thành tiền |
| Rate limit theo IP và quy trình cấp/reset tài khoản | UC01; D07 | AU01–03 đã xác nhận; không tự đặt ngưỡng IP/quy trình hỗ trợ chưa duyệt |
| CI/load/backup retention/RPO/RTO | Trước vận hành/kiểm thử hiệu năng; D14 | Không chặn schema nền tảng, không nhận là đã kiểm chứng |

## 8. Cách ghi phê duyệt và cổng dừng

Người dùng đã xác nhận NT01/03/04/05/08/09/10/11/12 theo A; NT02 Prisma7/adapter MySQL với điều kiện kết nối và migration thực tế; NT06 VND DECIMAL(20,0); NT07 KH1:N account; AU01–03 theo đề xuất. Nội dung phê duyệt chi tiết trong bảng hiện hành và decisions.md. Các chi tiết nghiệp vụ ngoài phạm vi này tiếp tục CHUA_DUYET.

Đã ghi ID/nội dung/ngày/người duyệt là người dùng ngày 12/10/2026 và đồng bộ hồ sơ bị tác động. Phê duyệt thiết kế chưa tự giao dựng nền tảng; cần lệnh thực hiện Giai đoạn 1 và phạm vi migration rõ ràng. Lần lập phiếu chỉ tạo Markdown. Lần xác nhận 12/10 hiện tại đồng bộ các tài liệu bị ảnh hưởng, giữ nguyên frontend/Domain và 29 UC; không tạo backend/database/schema/migration/Compose, không cài package/chạy test runtime/commit/reset.

Tài liệu chính thức xác nhận khả năng hỗ trợ của từng thành phần; bộ phiên bản kết hợp, generated columns/driver Decimal, FK/CHECK/locking, Compose image digest và OpenAPI validator còn **CHUA_KIEM_CHUNG bằng chạy thực tế**. Các kiểm tra đó chỉ thực hiện trong giai đoạn được cho phép.

## 9. Điều kiện dự kiến trước triển khai (lịch sử; bằng chứng hiện hành tại mục cuối)

NT02 chưa được đánh dấu đạt runtime: phải kết nối Prisma7/adapter với MySQL8.4.12, chạy migration thật trên môi trường được phép, kiểm engine/charset/collation/FK/unique/CHECK/generated columns/Decimal và migration replay/test isolation. Ghi exact patch/version/driver đã dùng và evidence. Lỗi tương thích không cho đổi provider/major ngầm. Chưa chạy các bước này trong lần đồng bộ tài liệu.

NT07: customer_id dùng index thường, không UNIQUE. Các account cùng customer_id thuộc cùng scope khách hàng; mọi GET/list/command kiểm role+customer_id từ account hiện hành, không lấy ID khách từ payload và không dùng created_by làm ranh giới khách hàng. created_by vẫn truy vết người thao tác. Quyền thao tác cụ thể vẫn theo UC/state, không cấp toàn quyền chỉ vì cùng khách hàng.

NT06: chỉ VND, thành tiền lưu số nguyên chuỗi ở API; đơn giá vẫn có6 số lẻ. Giá×lượng giữ Decimal không làm tròn trung gian. Nếu rule chốt tiền chưa được duyệt/cấu hình, bước xác nhận chứng từ cần chốt tiền bị chặn POLICY_NOT_APPROVED, không dựa cast DECIMAL(20,0) để tự làm tròn.

## Bằng chứng Giai đoạn 1 — 12/10/2026

NT03: người dùng chấp thuận MySQL 8.4.8 nếu tag tồn tại. Manifest, pull và hai instance dev/test đã kiểm thành công. 8.4.12 trong nguồn phê duyệt trước là lịch sử.

NT02: Prisma CLI/Client/adapter-mariadb 7.10.0 đã kiểm kết nối, hai migrations trên dev/test, shadow replay không khác biệt, build và 11 tests nền tảng. Những bảng nghiệp vụ chưa tạo không được coi đã kiểm chứng generated lot keys, posting, QC hoặc reservation. Chi tiết tại [phase1_review.md](phase1_review.md).

NT01/04–12 và AU01–03 giữ phạm vi đã chốt. Trạng thái nền tảng CHO_NGUOI_DUNG_XAC_NHAN; 29 UC vẫn CHUA_LAM. Workbench GUI và nghiệm thu thủ công của người dùng chưa thực hiện. Chính sách nghiệp vụ CHUA_DUYET vẫn mở.
