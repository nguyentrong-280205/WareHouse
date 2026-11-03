# Rút ngắn mật khẩu 9 tài khoản demo cục bộ — 03/11/2026

User yêu cầu đổi mật khẩu 9 tài khoản demo (`khach01`, `kehoach01`, `muahang01`, `giamdoc01`, `quanlykho01`, `nhanvienkho01`, `qc01`, `xuong01`, `kiemke01`) sang một chuỗi ngắn, dễ nhớ để thao tác demo, thay cho chuỗi ngẫu nhiên dài đang dùng.

## Giới hạn đã nêu rõ trước khi làm

`"123"` (3 ký tự) không được chấp nhận vì dưới mức tối thiểu đã quy ước cho ngoại lệ mật khẩu ngắn ở local Docker demo (6 ký tự — theo đúng guard `INVALID_LOCAL_PASSWORD` đã áp dụng ngày 28/10/2026 cho nhóm tài khoản nhân viên kho). User đã chọn phương án giữ quy ước 6 ký tự: mật khẩu mới là `123456`, dùng chung cho cả 9 tài khoản.

## Đã làm

Không đổi schema/RBAC/scope. Thêm script một lần `backend/scripts/set-simple-demo-password.js` (cùng khuôn mẫu `set-warehouse-staff-passwords.js`): transaction, `sp_getapplock`, kiểm đúng 9 tài khoản/role/`code` theo `auth/simple-demo.js`, hash Argon2id + verify lại hash trước khi ghi, thu hồi phiên đăng nhập cũ, reset bộ đếm đăng nhập sai, audit `demo.simpleAccounts.password.changed.20261103`, marker chống chạy lại ghi đè (`ALREADY_CHANGED` khi gọi lại). File `infra/secrets/docker/simpleDemoPassword` (đã `.gitignore`) được ghi lại thành `123456`; guide cục bộ `.artifacts/SIMPLE-demo-login.local.md` được cập nhật lại đúng mật khẩu mới.

Đã rebuild `backend`/`migrate` Docker image để nạp script mới, chạy qua `docker compose run --rm -e AUTH_ALLOW_SIMPLE_DEMO=true migrate node scripts/set-simple-demo-password.js --apply` trên `warehouse_db`. Kết quả `status:"CHANGED"` cho cả 9 tài khoản; chạy lại lần hai trả `status:"ALREADY_CHANGED"` (xác nhận marker chống ghi đè hoạt động).

## Đã xác minh qua API thật

`POST /api/v1/auth/login` với `quanlykho01` / `123456` → `200`, nhận đủ session/permissions/CSRF như trước.

## Không đổi

- Không đụng 5 tài khoản nhân viên kho đã đổi mật khẩu riêng ngày 28/10 (`uc01.staff`, `nguyentrong`, `vuthinh`, `truongthinh`, và `nhanvienkho01` lúc đó — `nhanvienkho01` đã được cả hai lần đổi mật khẩu cùng chạm tới, lần này ghi đè lại đúng theo marker mới `demo.simpleAccounts.password.changed.20261103`, không xung đột vì guard của từng script kiểm độc lập theo bộ tài khoản riêng của nó).
- Không migration, không RBAC/scope mới, không test nghiệp vụ/commit/reset.
