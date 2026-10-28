# Form yêu cầu cấp nguyên liệu — 28/10/2026

Lệnh bổ sung cùng ngày đã thay quy tắc giảm lượng/xóa dòng bên dưới: hiện phiếu phải đủ vật tư và đúng lượng kế hoạch, chỉ đọc; có ghi chú. Migration notes đã duyệt và APPLIED trên Docker dev/test. Xem [quy tắc hiện hành](material_request_exact_quantity.md). Phần cấp từng phần dưới đây là lịch sử trước thay đổi này.

Ảnh người dùng cho thấy phân công đã duyệt chỉ hiển thị ID (#4/#5), vật tư vẫn phải nhập tay. Form trước đây dùng Fields chung, lookup không có tên thành phẩm/xưởng hoặc số lượng còn được yêu cầu.

Đổi sang MaterialRequestForm theo phong cách giao diện hiện tại. Mỗi lần mở form tải lại phân công đã duyệt theo scope tài khoản. Lựa chọn hiển thị kế hoạch, thành phẩm và xưởng; chọn xong hiện sản lượng/lịch và tự điền từng dòng vật tư còn được yêu cầu. Nguyên liệu và đơn vị lấy từ nhu cầu đã duyệt, không chọn vật tư ngoài nguồn. Cho giảm/sửa lượng, xóa dòng và khôi phục gợi ý để cấp từng phần.

remainingBase = max(qty_required − tổng qty_base của các phiếu chưa hủy, 0). Tổng này bao gồm nháp để đồng bộ quota backend hiện có; không phải tồn khả dụng. Không giữ/trừ tồn, không tạo phiếu khi mở hoặc chọn phân công. Backend vẫn kiểm scope, trạng thái duyệt, khóa nhu cầu, lượng dương/đơn vị rời và quota trong transaction khi lưu. Kế hoạch thiếu vật tư không bị âm thầm khóa khỏi nguồn cấp từng phần.

Lookup bổ sung các trường hiển thị; API input không thay đổi. Sửa escape thừa của regex quantityBase trong MaterialRequestInput/Result để nhận chuỗi DECIMAL có phần lẻ hợp lệ như 36.000000. Không schema/migration/seed hoặc thay dữ liệu cũ, không thay auth/quyền.

Kiểm chứng: kiểm cú pháp frontend/backend, validate OpenAPI, build Docker, đọc nguồn phân công thực tế và health. Không chạy unit/integration/E2E/regression hoặc tạo/gửi chứng từ thử. Trạng thái DA_CODE_CHUA_TEST.

Lookup đọc thực tế của xuong01: phân công 4 là TP002 Cola chai PET 500ml, sản lượng 36; có 8 nhu cầu (vỏ chai 36, nắp 36, carton 2, nước 18 lít, nhãn 36, đường 1,44 kg, hương Cola 0,018 kg, CO2 0,108 kg). Phân công 5 là TP006 nước ngọt chanh lon 330ml, sản lượng 50, có 7 nhu cầu. Các lượng được đọc nguyên trạng từ snapshot đã duyệt, không sửa công thức hoặc chứng từ. Cả hai nguồn hiện chưa có phiếu yêu cầu đã lưu. Docker backend/frontend đã build và triển khai; kiểm cú pháp frontend 63 file và OpenAPI đạt. Chưa thực hiện thao tác Lưu/Gửi thử.

Kiểm tay: đăng nhập xuong01, thêm yêu cầu cấp nguyên liệu, chọn kế hoạch và đối chiếu thành phẩm/xưởng/lịch, danh sách vật tư/đơn vị/lượng; bỏ hoặc giảm một dòng khi cần cấp từng phần. Lưu nháp rồi mở phiếu mới: lượng gợi ý phải trừ nháp vừa lưu. Vượt quota hoặc sửa nguồn vật tư phải bị backend từ chối. Gửi/cấp phát vẫn thực hiện các bước nghiệp vụ hiện có.
