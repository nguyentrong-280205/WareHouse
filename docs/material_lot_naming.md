# Mã lô nguyên liệu — 28/10/2026

Mỗi LoNguyenLieu có một material_id NOT NULL và khóa ngoại NguyenLieu; kiểm nhận NCC đối chiếu nguyên liệu đơn mua, kiểm xuất/QC theo lô. Bổ sung không cho đổi nguyên liệu hoặc mã sau khi tạo, kể cả khi chưa phát sinh tồn; tên lô nhập tay không được dùng làm định danh nguyên liệu. Một nguyên liệu vẫn có nhiều lô và cùng lô có thể nhận nhiều đợt phù hợp.

Mã tạo mới do backend cấp `LO-<tên viết tắt>-<số thứ tự>`, ví dụ LO-DUONG-01, LO-DUONG-02; mã nguyên liệu mẫu dùng bảng tiền tố cố định trong material-lot-codes.js. Vật tư mới ngoài bộ mẫu dùng tên không dấu kết hợp ID nguyên liệu để tránh trùng tiền tố. Số thứ tự lấy từ mã cùng nguyên liệu, có applock transaction tránh hai yêu cầu cùng chọn số. Mã người gọi gửi ở create chỉ là placeholder do contract chung LotInput yêu cầu, server sinh mã thực; form hiển thị chỉ đọc. Mã lô NCC nếu khác chưa có trường riêng để lưu; không tự tạo cột hoặc mặc định trùng mã nội bộ.

Người dùng yêu cầu chuẩn hóa những lô hiện có: script normalize-material-lots.js đổi đúng 20 lô khởi tạo NVL001–020 theo ánh xạ cố định, trong đó NVL011 đổi thành LO-DUONG-01. Kiểm marker seed, mã gốc, loại nguyên liệu và xung đột trước transaction; giữ ID, ngày/HSD, trạng thái, liên kết, tồn, chứng từ, scope, chỉ tăng version và audit ánh xạ cũ/mới. Lô khác giữ nguyên, không đổi lịch sử snapshot/audit đã ghi. Completion audit ngăn rename lặp/ghi đè; bootstrap gọi sau seed để volume mới đồng bộ. Backfill first_received_at của seed chấp nhận mã gốc hoặc mã mới của chính lô mẫu.

Chỉ SQL Server Docker warehouse_db, không HTTT02; không schema/migration, không xóa dữ liệu/volume hoặc commit. Không tạo phiếu thử hoặc chạy unit/integration/E2E/regression. DA_CODE_CHUA_TEST.

Đã chuẩn hóa thực tế 20 lô, audit đủ 20 cặp mã cũ/mới; đọc lại thấy 20 lô, 20 nguyên liệu khác nhau, 20 mã theo chuẩn, và lô đường/lô vỏ chai PET 500ml vẫn có liên kết tồn. Chạy lại script trả ALREADY_NORMALIZED/noOverwrite. Kiểm cú pháp frontend/backend, OpenAPI và build Docker đạt; chưa chạy test nghiệp vụ hoặc tạo lô mới để thử cấp mã.
