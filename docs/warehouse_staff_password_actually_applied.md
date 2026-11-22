# Mật khẩu 5 tài khoản nhân viên kho — áp dụng thật lần đầu trên Docker hiện tại — 04/11/2026

## Phát hiện khi click-test "Xuất kho nguyên liệu"

Người dùng đăng nhập `truongthinh` bằng mật khẩu ngắn `[mật khẩu cục bộ trong .artifacts]` (ghi nhận trong AGENTS.md ngày 28/10/2026 là "đã đổi") nhưng bị từ chối đăng nhập.

## Nguyên nhân

Tra `AuditLog` trên Docker `warehouse_db` hiện tại: marker `warehouse.staff.password.changed.20261028` **không tồn tại**. Verify trực tiếp qua API: mật khẩu dài ngẫu nhiên cũ trong `.artifacts/WAREHOUSE-STAFF-logins.local.md` vẫn đăng nhập được. Kết luận: script `set-warehouse-staff-passwords.js --apply` **chưa từng thực sự chạy** trên volume Docker hiện có — ghi nhận "Đã đổi" trong AGENTS.md là sai lệch so với trạng thái dữ liệu thật (có thể đã chạy trên một volume trước đó đã mất, hoặc chỉ được lên kế hoạch).

## Đã làm (được người dùng xác nhận trực tiếp: "chuyển mk sang [mật khẩu cục bộ trong .artifacts] cho các tài khoản")

Chạy thật `docker compose run --rm -e AUTH_ALLOW_SIMPLE_DEMO=true migrate node scripts/set-warehouse-staff-passwords.js --apply` (script có sẵn, không sửa code) — đổi cả 5 tài khoản `uc01.staff`, `nhanvienkho01`, `nguyentrong`, `vuthinh`, `truongthinh` sang `[mật khẩu cục bộ trong .artifacts]` (đồng bộ secret `infra/secrets/docker/simpleDemoPassword` đã đặt `[mật khẩu cục bộ trong .artifacts]` từ 03/11/2026). Kết quả: `{"status":"CHANGED",...,"hashesVerified":true}`.

## Đã xác minh qua API thật

`POST /auth/login` cho cả 4 tài khoản `truongthinh`/`nguyentrong`/`vuthinh`/`nhanvienkho01` với mật khẩu `[mật khẩu cục bộ trong .artifacts]` → 200 OK.

## Không đổi

Không migration/schema/RBAC/scope mới. Không đụng role/trạng thái/mã tài khoản. Không ghi mật khẩu vào docs/log — chỉ hash trong DB và guide `.artifacts/WAREHOUSE-STAFF-logins.local.md` (ignored).
