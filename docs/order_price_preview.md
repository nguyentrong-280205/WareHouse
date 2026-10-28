# Hiển thị giá đơn nháp — 23/10/2026

Người dùng báo chi tiết đơn khách hàng không có giá sau khi đã seed giá. Nguyên nhân: UI và OrderResult chỉ hiển thị snapshot giá được lưu khi xác nhận; đơn NHAP chưa có unit_price/amount/total_amount. Lần thêm giá trước không sửa thiếu sót hiển thị này.

Bổ sung preview chỉ đọc cho đơn NHAP: lấy giá bán theo product_id/unit_id có effective_at<=SYSUTCDATETIME(), revision cao nhất, tính estimatedUnitPrice/estimatedAmount/estimatedTotalAmount bằng decimal BigInt và HALF_UP từng dòng giống FS01. Không làm tròn trung gian hoặc dùng Number cho tiền. Hiển thị tiêu đề “tạm tính”, tên thành phẩm/đơn vị và định dạng VND, thay dấu gạch không rõ nguyên nhân.

Giá preview không ghi database và không phải giá đã chốt. Submit vẫn kiểm và chốt giá hiệu lực khi xác nhận theo quy trình cũ. Đơn đã xác nhận đọc unitPrice/amount/totalAmount đã lưu, không lấy giá hiện hành để tính lại. Không migration, không tự xác nhận đơn hoặc sửa số tiền lịch sử, không sửa phân quyền customer scope. Đơn thiếu giá không hiện0: ghi rõ “Chưa cấu hình giá”, không cộng tổng thiếu dòng; vượt giới hạn tiền thì không trả tổng sai.

API bổ sung trường response riêng với pricingStatus ESTIMATED/CONFIRMED/UNAVAILABLE; productCode/productName/unitName giúp khách đọc tên thay ID ở bảng giá. Planned/runtime OpenAPI đồng bộ. Thay đổi chỉ hiển thị, không thay chính sách định giá, thuế, phí hay chốt chứng từ.

Bổ sung sửa sót ở danh sách đơn: cột Tổng tiền VND dùng estimatedTotalAmount cho NHAP, kèm nhãn “Tạm tính”; trạng thái khác dùng totalAmount đã lưu. Thiếu giá hiển thị “Chưa đủ giá”, không lấy tổng thiếu dòng hoặc số0. Danh sách và chi tiết dùng chung formatter chuỗi thập phân, ví dụ324000→324.000, không chuyển qua Number. Không thay dữ liệu backend hoặc tự xác nhận đơn. Lần sửa này kiểm parse frontend53file và build/triển khai riêng frontend, không chạy bộ test nghiệp vụ.

Kiểm chứng thực tế: planned/runtime/foundation OpenAPI validate đạt,52file frontend JS/JSX parse đạt, hai file CommonJS sửa đổi check syntax đạt; Docker Vite build thành công, backend khỏe. Đối chiếu chỉ đọc đơn nháp hiện hữu #2:6lốc TP002, giá54.000/lốc, dòng và tổng tạm tính324.000VND; storedTotal vẫnNULL, unit_price/amount/price_id vẫnNULL. Không submit, không cập nhật trạng thái/giá chốt của đơn. Không chạy unit/integration/E2E/regression hoặc ghi dữ liệu thử theo lệnh hiện hành; chưa nghiệm thu UI/E2E.
