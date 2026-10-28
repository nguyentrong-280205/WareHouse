<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

# Chạy và thử UC01 cục bộ

Bổ sung16/10: đã seed9account dễ nhớ theo role, cùng mật khẩu demo được người dùng chỉ định; [danh sách](../data.md), [hướng dẫn private](../backend/.artifacts/SIMPLE-demo-login.local.md). Giữ tài khoản uc01.* và mật khẩu cũ. Compose local bật AUTH_ALLOW_SIMPLE_DEMO; chạy trực tiếp đặt `$env:AUTH_ALLOW_SIMPLE_DEMO='true'` trước npm start nếu dùng bộ mới. Ngoại lệ min6 chỉ allowlist username+code DB; các account khác min12. Có thêm kiemke01 để phân công đếm độc lập với uc01.council. Không chạy tests tự động trong lần bổ sung.

**Hướng dẫn hiện hành16/10 cho toàn29UC: [bàn giao/chạy/demo/kiểm tay](full_system_handoff.md).** Runtime hiện có151handler nghiệp vụ, đã seed scope/kho/xưởng/danh mục FS11; phần “chỉ UC01/chưa code UC khác” bên dưới là lịch sử14–15/10. Mật khẩu vẫn chỉ ở file local ignored; không chạy lại tests trong đợt code29UC.

Ghi nhận15/10/2026: người dùng đã giao cả29UC trong cùng nhiệm vụ; hoãn chạy các bộ test tự động và không yêu cầu test tay UC01 giữa quá trình. Lệnh test/tiêu chí UC01 phía dưới là tham chiếu lịch sử, không chỉ thị chạy lại trong đợt code mới. Demo UC01 cũ vẫn giữ; [kế hoạch hiện hành](full_system_execution.md).

UC01 CHO_NGUOI_DUNG_XAC_NHAN, chưa code UC khác. Stack CommonJS/Express/mysql2/MySQL 8.4.8; không Prisma/TypeScript. [Thiết kế](usecases/UC01.md), [kết quả tự động](usecases/UC01_review.md).

## App Docker hiện có

Từ thư mục gốc Code, giữ cấu hình/secrets/volumes đã có:

~~~powershell
docker compose --env-file infra/.env -f infra/compose.yaml --profile app --profile test up -d --build
docker compose --env-file infra/.env -f infra/compose.yaml --profile app --profile test ps
~~~

Mở http://localhost:8080/login. Đăng nhập thành công về `/`. Swagger http://localhost:3000/docs; runtime chỉ health/login/me/logout. HTTP loopback dùng AUTH_COOKIE_SECURE=false rõ trong Compose; dùng HTTPS ở môi trường triển khai với true.

## Thông tin đăng nhập demo riêng tư

Seed được người dùng cho phép và đã chạy: 9 vai trò SRS, 10 account giả, 1 KhachHang; không kho/xưởng/chứng từ. Username công khai: uc01.customer, uc01.customer2, uc01.planner, uc01.purchasing, uc01.board, uc01.warehouse, uc01.staff, uc01.qc, uc01.workshop, uc01.council.

**Mở [hướng dẫn cục bộ có mật khẩu từng tài khoản](../backend/.artifacts/UC01-demo-login.local.md)**. File riêng tư này và [credentials JSON](../backend/.artifacts/uc01-demo-credentials.json) được .gitignore/.dockerignore loại bỏ, không xuất mật khẩu vào docs công khai/GitHub/log/chat. Mật khẩu database là Argon2id, không plaintext. Không gửi/upload hai file này.

Nếu cần tái kiểm seed từ workspace đã cấu hình (không tự seed khi app start):

~~~powershell
. ./scripts/use-node.ps1
cd backend
npm run seed:uc01:demo
~~~

Script chỉ warehouse_db, user warehouse_app, loopback port3307; kiểm SELECT DATABASE và dev không có marker test. Chạy lại kiểm hash với credentials đã có, không overwrite account/password/role/permission. Xung đột hoặc mất file riêng tư thì dừng; không reset/drop hay tự đổi mật khẩu.

## Backend/Vite trực tiếp

Theo phần direct của [phase1_runbook](phase1_runbook.md), dùng Node 24.21.0 và chỉ một app chiếm port3000. Terminal backend: npm start. Terminal frontend: npm run dev. Với HTTP local env AUTH_COOKIE_SECURE=false; CORS_ORIGINS phải có origin Vite chính xác. Env ARGON2_MEMORY_COST=65536, ARGON2_TIME_COST=3, ARGON2_PARALLELISM=1 được validate và default đúng giá trị đã duyệt. Cấu hình sai làm startup dừng, không hạ thuật toán/cost ngầm.

## Kiểm thử tự động biệt lập

Từ backend sau helper Node:

~~~powershell
npm test
npm run test:integration
npm run test:browser
npm run openapi:validate
npm run check
npm run db:status
npm run db:status:test
~~~

Unit không ghi DB. Integration/browser chỉ warehouse_test sau guard NODE_ENV/name/user/endpoint/instance marker/SELECT DATABASE. Mỗi lần dùng namespace riêng; rollback fixture không commit hoặc cleanup đúng IDs của fixture HTTP đã commit, không truncate/reset. Browser tự chạy Express3001 và Vite5174 cùng Edge headless (BROWSER_PATH nếu vị trí khác), sau đó đóng đúng process/fixture của nó; không sử dụng demo dev. Không chạy song song nếu các port test này đang được dùng. Screenshots ở backend/.artifacts/uc01-*.png không chụp password/token.

## Nghiệm thu thủ công của người dùng

1. Mở app chưa login hoặc truy cập trực tiếp /dashboard: chuyển /login. Nhập sai username/password: từ chối, không xuất thông tin tài khoản. Input 12–128 ký tự, không cắt password.
2. Login uc01.board bằng mật khẩu riêng tư: về `/`, header Ban giám đốc, có Dashboard/Báo cáo; reload vẫn có phiên. Mở Dashboard desktop/mobile để kiểm phong cách cũ.
3. Đăng xuất từ menu tên ở góc trên phải: về login, reload/direct protected route không dùng được phiên cũ.
4. Login uc01.customer và uc01.customer2: về `/`, cùng boundary khách hàng, không có menu Dashboard/Người dùng; gõ trực tiếp /dashboard bị chặn. UC11/đơn hàng chưa code; không có API/route dữ liệu khách để nghiệm thu ở UC01.
5. Lần lượt thử các username vai trò còn lại để xem menu. Scope kho/xưởng chưa cấp nên [] không mang nghĩa toàn quyền. Trang mock/placeholder vẫn chưa là các UC đã hoàn thành.
6. Có thể thử sai mật khẩu đủ 5 lần/15 phút trên một demo account, rồi thử đúng: tạm khóa 15 phút, chờ hết khóa. Không tự reset counter/đổi status dữ liệu bằng SQL. Admin LOCKED/role LOCKED, idle/hard, CSRF và cạnh tranh đã kiểm tự động với fixtures test; nếu cần quan sát tay trạng thái đó, dùng quy trình test riêng, không sửa dữ liệu demo tùy tiện.

Ghi lỗi/bằng chứng và xác nhận UC01; chưa đánh HOAN_THANH hoặc bắt đầu UC tiếp theo. Các chính sách IP/support account, rounding, reservation/QC/BOM/kiểm kê CHUA_DUYET vẫn mở.
