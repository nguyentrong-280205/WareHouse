<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

# Đề xuất phạm vi UC01 — Đăng nhập hệ thống

Ngày 14/10/2026. **DA_GIAO_UC01** theo lệnh tiếp tục Giai đoạn 2 và xác nhận Argon2id/demo/landing. Hiện UC01 CHO_NGUOI_DUNG_XAC_NHAN. Nội dung đề xuất bên dưới là lịch sử trước lệnh; triển khai hiện hành tại [usecases/UC01.md](usecases/UC01.md), [review](usecases/UC01_review.md). 28 UC khác CHUA_LAM. Căn cứ SRS FR001–FR003, AC-01-01–03, permissions.md, NT07/NT08/AU01–03 và auth contract hiện có.

## Phạm vi có thể giao sau nghiệm thu

| Phần | Đề xuất công việc của UC01 |
|---|---|
| Frontend | Trang /login theo phong cách hiện có; form username/password, validation/loading/error; session context, kiểm phiên khi reload, route guard và logout. Chỉ bổ sung phần auth cần thiết, không đổi layout/màu/font/mock hoặc xây trang nghiệp vụ khác. Điểm đến sau login cần xác nhận theo actor, không mặc định mọi actor vào dashboard nội bộ. |
| Backend | Auth routes → controllers → services → repositories CommonJS. Parameterized SQL; password Argon2id; validate session từ MySQL trước RBAC/scope; lỗi chuẩn, correlation ID, không log password/cookie/token. Thêm dependency hash tương thích Node/Windows/Docker khi được giao, pin sau kiểm chứng. |
| API | POST /api/v1/auth/login, GET /api/v1/auth/me, POST /api/v1/auth/logout theo operationId auth.login/me/logout. Payload username/password và SessionResult đúng contract; không tự thêm register/reset/manage-account APIs. Logout giữ X-CSRF-Token và Idempotency-Key bắt buộc. |
| Database | Tái sử dụng TaiKhoan/VaiTroQuyen/Quyen/VaiTro_Quyen/KhachHang/PhienDangNhap/AuditLog, và IdempotencyRequest nếu thực hiện logout theo contract. KhachHang 1:N accounts, internal customer_id NULL; không UNIQUE customer_id. Chưa cần migration nghiệp vụ hoặc FK kho/xưởng mới. Mọi thay đổi schema/contract phát hiện khi refinement phải trình duyệt trước. |
| Session | Opaque token ngẫu nhiên, lưu hash trong DB, cookie HttpOnly/SameSite=Lax/Path=/; Secure với HTTPS, ngoại lệ HTTP local phải cấu hình rõ. Rotate session khi login, revoke logout; idle 30 phút/hard 8 giờ; không refresh token/remember-me. Không dùng cookie có mặt làm chứng cứ xác thực. |
| Chống login sai | Account ACTIVE, role hợp lệ; phân biệt admin LOCKED và khóa tạm. 5 lần sai/account trong 15 phút khóa 15 phút; cập nhật counter/window/locked_until không mất update khi cạnh tranh. Password 12–128 ký tự, không cắt chuỗi. Threshold IP chưa duyệt không gán mặc định. |
| CSRF/RBAC | Login công khai: Origin bắt buộc/allowlist và JSON đúng contract; CSRF session-bound cho thao tác ghi authenticated. Login/me cấp token CSRF đúng contract; không tự thêm bootstrap endpoint. Xử lý cookie hết hạn không để scaffold chặn đăng nhập lại sai; cần chốt flow trước code. Principal/permissions/customer scope lấy từ account hiện hành, không từ payload/header giả. |
| Kiểm thử | Unit validation/password bounds/session timeout/counter/CSRF/RBAC; API integration trên MySQL thật; browser login/reload/logout/route guard; regression toàn bộ 15 tests nền tảng và health/proxy/UI smoke. |

## Các điểm cần xác nhận/refinement trước code

1. **CSRF trước login và cookie cũ:** đề xuất giữ Origin+JSON cho login theo contract; token phiên cấp qua login/me. Chốt xử lý expired/revoked cookie, login khi đã có phiên, token rotation; không coi Origin hoặc cookie riêng lẻ là authentication.
2. **Tài khoản demo và fixtures:** tự động chỉ tạo fixtures giả trong warehouse_test sau guard. Development hiện không có account/role. Nếu cần test tay trên warehouse_db, phải được người dùng cho phép tạo đúng bộ account/role demo và cung cấp mật khẩu bằng cấu hình riêng tư; không seed tự động database dev trong bước này.
3. **Landing/menu theo actor:** thống nhất route sau login và guard, sử dụng routes hiện có; trang mock/placeholder không được coi là UC nghiệp vụ đã triển khai hoặc quyền truy cập dữ liệu thật.
4. **Kho/xưởng trong SessionResult:** warehouseIds/workshopIds bắt buộc trong contract, nhưng tables scope và danh mục kho/xưởng chưa migrate. Đề xuất trả [] cho scope chưa được gán, mặc định từ chối truy cập scope đó; không tự tạo kho/xưởng hoặc suy ra NULL là toàn quyền. Xác nhận trước implementation; customerId vẫn lấy từ account.
5. **Logout retry/idempotency:** contract yêu cầu phiên hợp lệ, CSRF và Idempotency-Key. Cần chốt kết quả retry khi phiên đã revoked/cookie đã clear; không tự đổi 401 thành 204 hoặc bỏ header bắt buộc. Nếu đổi contract, review/duyệt trước.
6. **Counter/audit và AC:** AU02 cần cập nhật counter khi sai mật khẩu; xác nhận cách diễn giải AC “không ghi dữ liệu” là không ghi nghiệp vụ/tồn sai, vẫn cho dữ liệu bảo mật đã duyệt. AuditLog.actor_id NOT NULL: không tạo actor giả cho username chưa tồn tại; đề xuất log bảo mật kỹ thuật không secrets cho trường hợp này, audit actor hợp lệ ở success/logout. Không sửa SRS hoặc nullable FK ngầm.
7. **Argon2id:** chốt thư viện/parameters sau kiểm tương thích và benchmark trên môi trường thực; không tự thay bằng plaintext/bcrypt hoặc đặt chi phí chưa thống nhất. Điều này chưa được kiểm bằng các primitives hiện tại.

Quy trình cấp/reset/support account, đa vai trò/account, MFA/SSO và IP thresholds chưa được duyệt không bổ sung như chức năng UC01. Các policy tồn/QC/BOM/rounding/stocktake chưa duyệt giữ mở, không liên quan việc đóng UC01.

## Kiểm thử và nghiệm thu đề xuất

- Thành công: đúng mật khẩu/account/role → cookie đúng flags, hash được lưu, SessionResult không trả opaque token; /me lấy permissions/customer scope hiện hành, hai accounts cùng customer hoạt động đúng.
- Thất bại: sai/missing input, unknown user, admin/role locked, temporary lock, hết idle/hard, revoked, session/cookie/header giả; không rò account/password/hash hoặc cấp quyền sai. Kiểm đồng thời failed counter đúng AU02.
- CSRF/Origin: thiếu/sai Origin ở login, thiếu/sai token ở logout, token phiên khác, stale cookie; không bypass hoặc khóa người dùng khỏi login lại sai flow.
- Logout: revoke và clear cookie đúng attributes; test retry/idempotency theo quyết định được duyệt. Không tác động on_hand/reserved/ledger hoặc chứng từ.
- UI: login loading/error/keyboard, reload khôi phục phiên, logout và route guard; giữ giao diện cũ. Test fixtures biệt lập, không reset/ghi dev hoặc thay dữ liệu UC đã hoàn thành.
- Ghi bằng chứng API/MySQL/browser và hướng dẫn test tay; chỉ chuyển UC01 sang HOAN_THANH khi người dùng nghiệm thu.

Đây là phạm vi đề xuất để người dùng lựa chọn sau báo cáo kiểm Giai đoạn 1. Chưa thay source backend/frontend/schema/contract hoặc tạo tài khoản. Dừng chờ xác nhận chuyển Giai đoạn 2 và giao UC01 riêng.
