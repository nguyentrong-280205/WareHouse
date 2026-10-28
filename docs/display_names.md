# Hiển thị tên trên giao diện — 28/10/2026

Theo yêu cầu người dùng, ô chọn danh mục hiển thị tên; tra cứu tồn và báo cáo hiển thị tên kho, vị trí, mặt hàng và đơn vị thay cho ID nội bộ. Trạng thái chất lượng và loại hàng được dịch sang tiếng Việt. Bảng tồn bỏ cột mã hàng trùng thông tin tên hàng. Các thành phần chi tiết, lựa chọn vật tư/xưởng và phần tổng quan dùng tên dễ đọc.

Backend bổ sung các trường tên tùy chọn trên kết quả đọc đã qua kiểm tra quyền/phạm vi: warehouseName, locationName, itemName, unitName, lotCode; sổ biến động có actorName khi có tài khoản liên quan. Lô nguyên liệu/thành phẩm trả thêm itemName. Hợp đồng API bổ sung các trường đọc tùy chọn tương ứng. Không đổi ID lưu trữ, input API, phân quyền, schema, migration hay dữ liệu nghiệp vụ. Vị trí cũ đã khóa vẫn có thể hiện tên trong sổ lịch sử.

Frontend phân giải tên từ trường tên trên kết quả hoặc danh mục mà tài khoản được phép đọc; không hiện ID thay cho tên khi thiếu quyền/dữ liệu. Các mã chứng từ và mã lô vẫn được giữ tại trường định danh chứng từ/lô vì không có thuộc tính tên riêng, phục vụ truy vết.

Trạng thái DA_CODE_CHUA_TEST. Xác minh giới hạn ở cú pháp JavaScript/JSX, OpenAPI, build Docker và health; không chạy unit/integration/E2E/regression.

Theo yêu cầu dọn trang tra cứu, danh sách tồn hiện tại bỏ các số dư có cả on_hand và reserved bằng 0 tại vị trí đã khóa. Điều kiện áp dụng trước COUNT và phân trang để không tạo trang rỗng; các dòng tồn còn hàng ở A–F được đưa lên trang đầu. Sổ biến động, chứng từ chuyển, lịch sử kiểm kê và bản ghi số dư được giữ nguyên.
