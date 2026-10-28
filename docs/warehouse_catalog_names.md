# Danh mục ba kho — 28/10/2026

Yêu cầu: Kho nguyên liệu, Kho thành phẩm và Kho hàng lỗi. SQL Server Docker đã có đúng ba kho ACTIVE tương ứng MATERIAL, FINISHED, CONTROLLED, nhưng tên còn nhãn dữ liệu mẫu. Đổi tên ba bản ghi hiện có thay vì tạo trùng, giữ ID, mã nội bộ, loại kỹ thuật, vị trí, sức chứa, tồn, chứng từ và phạm vi tài khoản. Kho hàng lỗi dùng kho CONTROLLED hiện có: loại này còn phục vụ hàng kiểm soát/cách ly theo các quy tắc nghiệp vụ hiện hành; việc đổi tên không tự thay đổi phân loại tồn hay chuyển hàng.

Script name-warehouse-catalog.js chỉ chạy có guard portable warehouse_db/warehouse_app, applock, transaction và audit trước/sau. Kiểm đúng ba mã/loại/trạng thái và chỉ chấp nhận tên gốc hoặc tên mới. Completion audit khiến lần chạy sau không ghi đè tên quản trị viên sửa; bootstrap gọi một lần khi chạy volume mới. Không migration, seed tồn, cấp thêm quyền hoặc thay HTTT02.

Không chạy unit/integration/E2E/regression, không tự tạo chứng từ hoặc thao tác tồn. Xác minh qua đọc danh mục hiện hữu, lặp script không overwrite, health và syntax; DA_CODE_CHUA_TEST.
