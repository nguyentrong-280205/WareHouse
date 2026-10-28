# Nút thao tác và xóa đơn nháp — 23/10/2026

Theo yêu cầu người dùng: các thao tác phải là nút có nền/viền thay vì chữ đơn lẻ; đơn nháp có Chi tiết → Xóa → Xác nhận đơn. Giữ React/JavaScript và phong cách xanh/slate hiện có. ActionButton dùng chung cho bảng nghiệp vụ, đỏ cho thao tác nguy hiểm và xanh đậm cho thao tác xác nhận cuối; CSS base áp dụng viền/bo góc/focus/disabled cho các button còn lại. Không thêm nút giả hoặc gọi endpoint chưa được hỗ trợ.

Xác nhận, gửi duyệt, phê duyệt và ghi sổ được xếp sau thao tác phụ/hủy; Từ chối trước Phê duyệt. Form lưu kiểm kê đặt Đóng trước Lưu. Các nút vẫn phụ thuộc quyền và trạng thái; khi đang gửi yêu cầu, nút thao tác hàng bị vô hiệu hóa.

## Xóa bản nháp

Thêm DELETE /orders/{id}, /purchases/{id}, /material-requests/{id}, /product-requests/{id}. Dùng quyền tạo cùng loại đơn hiện có; không tự thêm role/permission. Chỉ NHAP, expectedVersion đúng, customer/workshop scope hợp lệ, chưa có FK phụ thuộc ngoài các dòng thuộc bản nháp. Đơn mua được xóa cả PhanBoMuaChoNhuCau thuộc dòng của chính bản nháp sau khi kiểm tra chúng không có lịch sử phụ thuộc. Không tác động demand/forecast/tồn/reservation/stock ledger.

Thực hiện trong transaction có khóa header/dòng, kiểm FK metadata, giữ bản chụp header/dòng trong AuditLog rồi xóa dòng và header bằng SQL có tham số. Không cascade/delete dữ liệu nguồn. Xung đột phiên bản, trạng thái hoặc dữ liệu phụ thuộc trả409; FK phát sinh đồng thời cũng rollback. CSRF/session/RBAC/customer scope/idempotency dùng middleware và business context hiện có. Axios DELETE truyền body bằng config.data để expectedVersion đến đúng backend. Không migration hoặc sửa SRS/Domain Model.

Nút Xóa hiện nhưng vô hiệu hóa khi đã xác nhận hoặc loại chứng từ không hỗ trợ xóa trực tiếp. Phiếu nhập/xuất, kiểm kê, QC, giao hàng và chứng từ đã có lịch sử tiếp tục dùng quy trình hủy/điều chỉnh sẵn có nếu được phép; không thêm cách xóa để bỏ qua reservation, QC hoặc ghi sổ. Không xóa thử dữ liệu người dùng khi triển khai.

## Kiểm chứng

Kết quả: CommonJS syntax toàn backend đạt trong image Node24.21.0; frontend52file JS/JSX parse đạt; planned/runtime/foundation OpenAPI validate đạt; Vite production build thành công và Docker đã triển khai. Backend/proxy frontend health connected. OpenAPI đang chạy có4DELETE endpoint mới. Không gọi API xóa trên dữ liệu phát triển, không migration, không chạy unit/integration/E2E/regression theo lệnh hiện hành. Chức năng xóa mới DA_CODE_CHUA_TEST; build/readiness không là nghiệm thu chức năng hoặc toàn hệ thống.

Kiểm tra tay sau khi người dùng giao kiểm thử: tạo đơn nháp mới riêng, kiểm thứ tự ba nút, hủy hộp xác nhận phải giữ đơn; đồng ý xóa phải mất đơn khỏi danh sách nhưng còn audit. Thử phiên bản cũ, đơn đã xác nhận, khác customer/workshop và bản nháp có tham chiếu đều phải bị chặn, không thay tồn. Retry cùng idempotency key trả lại kết quả cũ. Kiểm các màn hình còn lại có nút với viền/nền, focus rõ và xác nhận cuối.
