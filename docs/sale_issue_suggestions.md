# Tên dòng nguồn và gợi ý xuất thành phẩm — 04/11/2026

Trạng thái: **DA_CODE_CHUA_TEST**. Áp dụng cho mọi đơn hàng được phép chọn trong form Xuất thành phẩm giao hàng, không gắn riêng một ID đơn demo.

- Lookup nguồn xuất bổ sung mã, tên đầy đủ và đơn vị cơ sở cho từng dòng thành phẩm/nguyên liệu sau kiểm quyền/phạm vi hiện có. Dòng nguồn hiển thị mã — tên — lượng nguồn — đơn vị thay cho `TP + ID`; ô chọn chiếm cả chiều rộng. Bảng nguồn trong form thành phẩm hiển thị đủ tên của mọi dòng.
- Chọn đơn hàng và kho khi lập phiếu thành phẩm tự tải gợi ý cho tất cả dòng nguồn. Tự điền dòng nguồn, lô, vị trí, đơn vị cơ sở và lượng xuất; chia nhiều lô/vị trí theo cùng `repository.candidates` dùng khi kiểm FEFO tại backend.
- `GET /orders/{id}/issue-suggestions?warehouseId=...` (`issues.saleSuggestions`) yêu cầu `issues.allocate`, scope kho, kho ACTIVE loại FINISHED/CONTROLLED và đơn XAC_NHAN/DANG_GIAO. Tính bằng DECIMAL BigInt, trừ lượng nguồn đã HOAN_THANH/đang giữ còn hạn; dùng chung pool tồn cho các dòng trùng sản phẩm để không gợi ý quá lượng khả dụng.
- Loại tồn không đạt QC, lô/vị trí khóa, lô hết hạn và vị trí bị khóa kiểm kê theo truy vấn FEFO hiện có. Cảnh báo rõ sản phẩm và lượng còn thiếu. Nguồn đã xuất/giữ đủ không được gợi ý lại.
- Cho chỉnh/xóa/thêm dòng hoặc tải lại gợi ý. Đổi đơn/kho xóa phân bổ cũ; hủy phản hồi đang tải khi đổi nguồn; không cho lưu trong lúc tải. Khi sửa phiếu cũ giữ nguyên các dòng đã lưu, chỉ thay bằng gợi ý khi bấm Tải lại gợi ý.
- Gợi ý là thao tác chỉ đọc, không lập chứng từ, không giữ/trừ tồn. Không thay luồng xác nhận, reservation, ghi sổ, quota, QC, FEFO, audit hoặc phân quyền. Gợi ý nguyên liệu hiện có tiếp tục hoạt động như trước.

Không migration/seed hoặc thay dữ liệu thật. OpenAPI planned/runtime bổ sung cùng endpoint; không sửa migration đã áp dụng.

## Kiểm tra kỹ thuật và kiểm tay

Kiểm cú pháp các file backend, OpenAPI và build frontend; không chạy unit/integration/E2E/regression hoặc lưu phiếu thử. Build Windows ban đầu bị sandbox chặn tạo tiến trình (EPERM); chạy lại ngoài sandbox thành công. Lint hai file giao diện không có lỗi; cảnh báo hiện có ở ResourcePage về effect/fast refresh vẫn còn.

Đã build và cập nhật riêng backend/frontend Docker bằng `docker compose up -d --no-deps backend frontend`. Backend `/health` và health qua frontend `/api/v1/health` trả `database: connected`; trang frontend phục vụ bundle mới `index-DTpDb6y3.js`. Không chạy migrate/bootstrap.

Đã đọc chẩn đoán nguồn trong ảnh `DH-fe1787c2-2572-43fd-8f6f-b83ff03889e7` trên Docker warehouse_db, lấy quyền/scope hiện có của quanlykho01; không đăng nhập/reset mật khẩu hoặc ghi dữ liệu. Lookup trả đúng TP001 — Nước ngọt Cola lon 330ml — 50 Lon và TP010 — Nước tăng lực lon 330ml — 480 Lon. Gợi ý tại thời điểm đọc không có tồn đủ điều kiện cho hai dòng, trả thiếu lần lượt 50 và 480 Lon. Đây là bằng chứng đọc dữ liệu hiện hữu, không phải kiểm thử nghiệp vụ/nghiệm thu.

Kiểm tay cần người dùng thực hiện:

1. Mở Thêm mới ở Xuất thành phẩm giao hàng, chọn một đơn và kho thành phẩm. Đối chiếu mã/tên đầy đủ/đơn vị trong bảng nguồn và dropdown.
2. Kiểm các dòng gợi ý tự có lô, vị trí, đơn vị và lượng. Với nhiều dòng/trùng sản phẩm/nhiều lô, đối chiếu tổng theo từng dòng nguồn và thứ tự FEFO.
3. Chọn đơn khác hoặc đổi kho: phân bổ cũ phải được thay; khi thiếu tồn phải hiện đúng mặt hàng và lượng thiếu. Đơn đã xuất/giữ đủ không gợi ý xuất thêm.
4. Chỉnh dòng rồi bấm Tải lại gợi ý để chủ động thay phân bổ. Mở sửa phiếu đã lưu: chưa bấm tải lại thì dòng cũ vẫn nguyên.
5. Chỉ chọn/tải lại gợi ý rồi Hủy: không có chứng từ mới hoặc biến động tồn.
