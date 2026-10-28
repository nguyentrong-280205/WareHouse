# Hiển thị kế hoạch xưởng tiếp nhận — 27/10/2026

Sửa lặp vật tư cùng ngày: RecordSummary trước đây hiển thị materialDemands, còn ProductionPlanDetail lại hiển thị materials cùng phân công. Đã gộp thành một bảng nguyên vật liệu ngay dưới thông tin mỗi phân công. Phiếu đã duyệt dùng nhu cầu đã chốt, giữ đủ cột đã cấp/giữ/khả dụng/thiếu và snapshot lúc duyệt; phiếu chưa có nhu cầu dùng vật tư đã chọn. RecordSummary chỉ giữ tóm tắt trạng thái/luồng chuyển, không lặp bảng nhu cầu. Áp dụng cả chi tiết tiếp nhận và chi tiết KHSX dùng chung, không sửa API hoặc dữ liệu.

Người dùng báo đủ vật tư, đã duyệt nhưng xưởng chưa nhận. Đối chiếu chỉ đọc dữ liệu thực: kế hoạch#1 Cola PET500ml tại XSX002 đã DA_DUYET/DU_NGUYEN_VAT_LIEU, handoffTarget WORKSHOP, không blocked; queue WORKSHOP của cả xuong01 và uc01.workshop đều có#1. Hai tài khoản có đủ scope5xưởng/3kho. Kế hoạch#2 vẫn thiếu5kg Hương chanh nên target PURCHASING; PO chưa làm tăng tồn, cần nhập đạt QC/ghi sổ hợp lệ trước khi tính đủ.

Trên giao diện, queue xưởng chỉ có ở “Phân công xưởng”; trang chủ chưa hiển thị, chuông header là mẫu3thông báo kho, không thể hiện kế hoạch đã duyệt. Sửa phần hiển thị cho vai trò có materialRequests.create:

- Trang chủ hiển thị ngay PlanInbox WORKSHOP.
- Các đường dẫn Kế hoạch sản xuất/Phân công xưởng/alias production-orders đều vào danh sách xưởng tiếp nhận cho vai trò xưởng. Vai trò lập/duyệt vẫn dùng ResourcePage cũ, không đổi quyền.
- Chuông của xưởng đọc queue thật, đếm meta.total và dẫn tới danh sách nhận; bỏ số3/thông báo kho giả đối với vai trò xưởng. Số đếm là số kế hoạch tiếp nhận, không giả làm số chưa đọc; không thêm cơ chế xác nhận đã đọc hoặc bảng thông báo.
- Queue cập nhật khi mở trang, bấm Tải lại hoặc quay về tab; chuông cập nhật khi mở và quay lại tab. Không polling giữ sống session lúc người dùng không hoạt động, không thay idle30phút/hard8giờ. Không tự đóng chi tiết đang đọc khi tab được focus lại.

Không sửa phiếu, duyệt lại, tăng tồn hoặc scope; không backend/API/schema/migration/seed. Giữ QC/khả dụng/giữ tồn/forecast/phạm vi như cũ. DA_CODE_CHUA_TEST, chỉ syntax/build/health và đọc dữ liệu có sẵn, không unit/integration/E2E/regression hoặc tạo phiếu thử.

Kiểm triển khai27/10: 62file frontend phân tích cú pháp thành công; Docker/Vite build thành công, còn cảnh báo bundle lớn có sẵn. Chỉ cập nhật container frontend, health qua proxy trả database connected. Không kiểm UI trình duyệt hoặc nghiệm thu nghiệp vụ; Git status/diff giữ nguyên thay đổi cũ, không commit/reset.
