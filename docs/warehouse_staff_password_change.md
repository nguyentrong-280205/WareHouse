# Đổi mật khẩu nhân viên kho — 28/10/2026

Người dùng yêu cầu tất cả tài khoản nhân viên kho hiện có dùng cùng mật khẩu ngắn do họ chỉ định. Phạm vi Docker warehouse_db: uc01.staff, nhanvienkho01, nguyentrong, vuthinh, truongthinh; role UC01_DEMO_staff và code tài khoản giữ nguyên. Không mở rộng quyền/phạm vi hoặc đổi trạng thái tài khoản.

Ngoại lệ độ dài chỉ mở rộng cho đúng các username/code đã xác minh trên Docker cục bộ khi AUTH_ALLOW_SIMPLE_DEMO=true; các tài khoản khác vẫn 12–128 ký tự. Backend routes, kiểm account code khi login và frontend cùng nhận danh sách ngoại lệ; giá trị mật khẩu không được lưu trong source/docs/log.

Script set-warehouse-staff-passwords.js yêu cầu --apply, guard đúng SQL Server Docker/development/warehouse_db/warehouse_app, đối chiếu đầy đủ danh sách tài khoản và role, khóa transaction, hash Argon2id 65536 KiB/3 vòng/parallelism 1, verify hash trước/sau update, thu hồi phiên cũ và xóa bộ đếm lỗi đăng nhập. Audit ghi account IDs và thông tin thay đổi, không ghi mật khẩu/hash. Marker chống reset lại hoặc ghi đè mật khẩu thay đổi sau này; không gọi tự động trong bootstrap.

Hướng dẫn chứa mật khẩu chỉ lưu tại backend/.artifacts/WAREHOUSE-STAFF-logins.local.md và Docker demo_artifacts (Git ignored). Đồng bộ đúng dòng uc01.staff trong guide/credential cũ và mật khẩu của ba nhân viên trong credential JSON riêng. Nếu ghi guide lỗi sau commit, script được phép chạy lại để khôi phục hướng dẫn chỉ khi hash hiện tại còn khớp, không reset tài khoản lần nữa.

Không migration, seed lại, thay dữ liệu kho hoặc chạy bộ test nghiệp vụ. Xác minh giới hạn ở cú pháp/build/health và kiểm tính nhất quán của password hash trong thao tác đổi đã được yêu cầu.
