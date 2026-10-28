# Nhãn trong chi tiết kế hoạch — 26/10/2026

Bổ sung theo phản hồi cùng ngày: “Dòng đơn hàng” ghi `Dòng 1 — Nước ngọt Cola chai PET 500ml`; “Phiên bản định mức” ghi `Định mức Nước ngọt Cola chai PET 500ml — phiên bản 5 (riêng kế hoạch, từ định mức gợi ý phiên bản 1)`. Dùng tên thành phẩm liên kết thay nhãn chỉ có mã hoặc số phiên bản. Thay đổi này chỉ ở frontend, không đổi API hay dữ liệu.

Nguyên nhân: API trả các khóa liên kết (`orderId`, `productId`, `workshopId`, `bomVersionId`), còn chi tiết dùng trực tiếp cấu hình form để hiển thị ID. Người xem vì vậy thấy các số2/3/35 thay cho mã và tên.

Đã bổ sung nhãn trong `PlanResult`, giữ nguyên ID để dùng khi sửa/duyệt: `orderCode`, mã/tên thành phẩm, đơn vị cơ sở, mã/tên xưởng, số dòng đơn hàng, số phiên bản định mức, phiên bản gợi ý nguồn và cờ snapshot riêng. Số dòng/phiên bản BIGINT trả chuỗi để bảo toàn độ chính xác. Nhu cầu sau duyệt cũng có tên nguyên liệu và đơn vị. Nhãn được đọc từ đúng các bản ghi liên kết, kể cả danh mục đã khóa; không lấy BOM mới nhất thay snapshot.

Giao diện chi tiết KHSX dùng khối riêng cho mỗi phân công, hiển thị mã/tên và bảng vật tư dễ đọc. Định mức hiển thị `v<revision>` cùng nguồn gợi ý nếu là snapshot riêng; không nhầm ID với số phiên bản. Ẩn khối nhu cầu trống trước duyệt. Danh sách kế hoạch cũng hiển thị mã đơn nguồn. Giữ kiểu dáng, định dạng số, trạng thái vật tư và khóa sửa sau duyệt.

Không đổi schema/database, không migration/seed hoặc chỉnh dữ liệu. Backend kiểm phạm vi xưởng trước khi đọc nhãn; không tải thêm danh mục qua API mà vai trò giám đốc/xưởng chưa được cấp quyền. Không đổi permission hoặc mở scope. API nhận ID khi ghi như cũ; chỉ bổ sung các trường hiển thị trong OpenAPI.

Trạng thái **DA_CODE_CHUA_TEST**; không chạy unit/integration/E2E/regression hoặc tạo/sửa phiếu thử. Chỉ kiểm cú pháp, OpenAPI, build, health và đọc phiếu hiện hữu.

Kết quả thực tế26/10: 56 file frontend phân tích cú pháp thành công; CommonJS trong image Node24.21.0 và OpenAPI foundation/planned/runtime hợp lệ; Docker build backend/frontend thành công (còn cảnh báo chunk lớn có sẵn). Đã cập nhật riêng hai container ứng dụng bằng `--no-deps`, không chạy migrate/seed. Health qua frontend trả database connected. Đọc kế hoạch hiện hữu trả đúng mã đơn `DH-…`, dòng đơn1, TP002 — Nước ngọt Cola chai PET500ml, XSX002 — Xưởng nước giải khát chai PET, định mức riêng v5 từ gợi ý v1, đơn vị Chai. Chưa kiểm giao diện bằng browser hoặc chạy test nghiệp vụ. Git status đã kiểm, giữ thay đổi cũ, không commit/reset.
