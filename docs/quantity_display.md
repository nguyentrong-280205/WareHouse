# Hiển thị số lượng — 23/10/2026

Theo yêu cầu mới nhất của người dùng, số lượng dùng dấu chấm phân cách hàng nghìn và không giữ số 0 thừa cuối phần thập phân. Ví dụ: `36.000000` → `36`, `2000.000000` → `2.000`, `1.440000` → `1,44`, `0.018000` → `0,018`. Tiền tiếp tục dùng dấu chấm hàng nghìn: `324.000 VND`. Quyết định này thay yêu cầu hiển thị `2000` trước đó.

Áp dụng formatter dùng chung cho kế hoạch sản xuất, vật tư gợi ý, chi tiết chứng từ, danh mục có số lượng/sức chứa, tồn kho, báo cáo và các giá trị số lượng trên dashboard. Ô nhập số lượng nhận dấu phẩy hoặc dấu chấm thập phân; khi focus hiển thị số không phân nhóm để nhập, giữ phần đang gõ; khi rời ô bỏ số 0 thừa và nhóm hàng nghìn. Không gõ dấu phân cách hàng nghìn lúc nhập. Mã định danh, điện thoại và ngày tháng không áp dụng formatter số lượng. Tính toán nội bộ vẫn dùng chuỗi dấu chấm thập phân không phân nhóm.

Chỉ thay hiển thị/frontend; API và dữ liệu vẫn dùng chuỗi DECIMAL chuẩn với dấu chấm thập phân, không đổi precision, không làm tròn bằng Number và không thay quy tắc tính tiền. Không migration, seed hoặc thay dữ liệu nghiệp vụ. Tiếp tục hoãn unit/integration/E2E/regression; chỉ kiểm cú pháp, build và health, chưa nghiệm thu chức năng.

Kiểm chứng triển khai: 55 file JavaScript/JSX phân tích cú pháp thành công; Docker build frontend/Vite thành công (còn cảnh báo chunk lớn có sẵn). Đã cập nhật riêng container frontend bằng `docker compose up -d --no-deps frontend`; health qua frontend `/api/v1/health` trả `application=running`, `database=connected`. Không chạy bộ test nghiệp vụ hoặc thay dữ liệu. Git status đã kiểm lại, giữ các thay đổi/xóa có sẵn, không commit/reset.

Lần cập nhật tiếp theo cùng ngày đã build và triển khai cùng chức năng sửa kế hoạch, áp dụng dấu chấm hàng nghìn cho số lượng. Các giá trị trung gian tính toán và dữ liệu gửi API vẫn không phân nhóm. Xem [bằng chứng triển khai](production_plan_edit.md).
