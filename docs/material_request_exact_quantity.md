# Ràng buộc phiếu yêu cầu cấp nguyên liệu — 28/10/2026

Yêu cầu mới thay việc cho xưởng giảm lượng/xóa dòng: phiếu mới phải có đủ các dòng nhu cầu của phân công được duyệt, đúng nguyên liệu và đúng số lượng snapshot KHSX. Giao diện chỉ đọc nguyên liệu/đơn vị/lượng, không thêm/xóa dòng. Backend so sánh DECIMAL bằng BigInt, chặn thiếu/thừa/trùng dòng và lượng khác cả khi gọi API trực tiếp; kiểm lại khi gửi nháp. Giữ kiểm quota chống yêu cầu trùng, scope, version, transaction, idempotency và audit. Không sửa KHSX hoặc công thức/tồn. Cấp phát vật lý từng phần ở các bước kho vẫn giữ nguyên.

Nếu đã có phiếu chưa hủy cho phân công, phiếu mới đủ toàn lượng sẽ vượt quota và bị chặn; dùng phiếu hiện có. Không tự cộng phần còn lại hoặc sửa phiếu cũ. Nháp cũ có lượng khác snapshot bị chặn gửi, báo cần lập lại theo kế hoạch; không tự xóa nháp hoặc sửa lịch sử chứng từ đã gửi.

Ghi chú tùy chọn Unicode, tối đa 2000 ký tự, trim và lưu NULL nếu trống; hiển thị trong chi tiết phiếu, lưu cùng transaction/audit. Không thêm model/bảng.

Migration chờ duyệt: `202610280001_material_request_notes.sql` chỉ ADD `PhieuXuatKhoNguyenLieu.notes NVARCHAR(2000) NULL`. Dữ liệu cũ mặc định NULL, không UPDATE/DROP/reset; không sửa migration đã APPLIED. Phạm vi đề xuất áp dụng Docker warehouse_db và warehouse_test; không đụng HTTT02/Windows/MySQL volumes. Không rollback bằng DROP cột; nếu cần hoàn tác app giữ nguyên cột và dữ liệu ghi chú.

Người dùng đã duyệt trực tiếp migration trong chat ngày 28/10. Đã kiểm trạng thái chỉ có đúng migration này pending và áp dụng thành công trên Docker warehouse_db/warehouse_test, pending còn rỗng. Migration đã APPLIED phải bất biến; chữ Pending trong comment SQL là ghi nhận lúc soạn trước duyệt, không phải trạng thái hiện tại. Không chạm HTTT02 hoặc sửa dữ liệu phiếu cũ.

Kiểm cú pháp frontend 63 file, backend request-service, validate OpenAPI và build ba image backend/frontend/migrate đạt. Đã triển khai container sau migration. Không chạy bộ test nghiệp vụ hoặc tạo/gửi phiếu thử; DA_CODE_CHUA_TEST. Kiểm tay: chọn phân công để thấy đủ vật tư và lượng chỉ đọc, nhập ghi chú rồi lưu; mở chi tiết đối chiếu ghi chú; API sửa lượng/thiếu dòng phải bị chặn, tạo phiếu trùng không vượt quota.
