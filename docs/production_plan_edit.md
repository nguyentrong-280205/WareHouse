# Sửa kế hoạch và tình trạng vật tư — 23/10/2026

Người dùng giao: số hàng nghìn hiển thị `2.000`, vẫn bỏ số 0 thừa; thiếu vật tư có trạng thái riêng; bộ phận lập kế hoạch sửa được phiếu chờ duyệt và không sửa được phiếu đã duyệt.

## Trạng thái

Giữ vòng đời `status` hiện có của KHSX. Thêm `materialStatus` chỉ đọc: `THIEU_NGUYEN_VAT_LIEU` / `DU_NGUYEN_VAT_LIEU`, hiển thị cột “Tình trạng vật tư” và danh sách thiếu trong chi tiết phiếu. Phiếu có thể đồng thời “Chờ duyệt” và “Thiếu nguyên vật liệu”. Không thay `DA_DUYET` bằng trạng thái thiếu, vì nghiệp vụ mua nguyên liệu/cấp phát vẫn cần kế hoạch đã duyệt.

Trước duyệt: cộng nhu cầu của toàn bộ các phân công theo từng nguyên liệu, so với khả dụng thực trong phạm vi kho tài khoản. Không sử dụng tồn vật lý thay cho khả dụng; không đếm một tồn nhiều lần giữa các dòng. Sau duyệt: dùng nhu cầu đã chốt, lượng đã cấp/giữ và phần tồn dự kiến hiện hành theo cơ chế đang có. `materialShortages` và `materialObservedAt` mô tả lượng thiếu và thời điểm quan sát; tải lại phiếu cập nhật tình trạng, không ghi đè lịch sử/snapshot. Tình trạng có thể khác giữa người có phạm vi kho khác nhau, không đại diện toàn hệ thống khi tài khoản chỉ được cấp một phần kho. Không giữ/trừ tồn qua GET, không tự chặn duyệt chỉ vì thiếu nguyên liệu.

## Sửa phiếu

- `PUT /api/v1/production-plans/{id}`, tái sử dụng quyền `plans.create` của bộ phận lập kế hoạch, không tự cấp quyền mới.
- Body giống `PlanInput`, bổ sung `expectedVersion`; bắt buộc CSRF và Idempotency-Key. Backend nạp lại quyền/scope hiện hành trong transaction.
- Chỉ sửa khi `CHO_DUYET`. `DA_DUYET`, `DANG_THUC_HIEN`, `HOAN_THANH`, `TU_CHOI`, `HUY` đều bị chặn ở API, không chỉ ẩn nút.
- Giữ đơn hàng nguồn và người tạo. Cho sửa lịch, phân công, sản lượng, xưởng, định mức và vật tư. Kiểm scope mọi xưởng cũ/mới, SKU nguồn, quota đơn, định mức hiệu lực, đơn vị rời và năng lực lịch như khi tạo.
- Khóa đơn nguồn rồi header kế hoạch; kiểm version/state dưới khóa. Kiểm không có nhu cầu, đơn mua, yêu cầu xuất/nhập hoặc chi tiết nhập tham chiếu trước khi thay các dòng sở hữu/phân bổ lịch. Tái tạo dòng và phân bổ trong cùng transaction; bất kỳ lỗi nào rollback toàn bộ, giữ phiếu/lịch cũ. Snapshot BOM cũ giữ bất biến, không xóa; lần sửa tạo snapshot mới. Audit lưu đầy đủ phiếu và vật tư trước/sau; ID dòng có thể đổi sau sửa.
- Người lập và người sửa cuối không được tự duyệt/từ chối. Sau khi duyệt, không có API sửa phiếu hoặc vật tư đã chốt.
- GET ngữ cảnh có `editPlanId` tùy chọn: chỉ cho phiếu chờ duyệt cùng đơn, đủ phạm vi xưởng. Loại chính kế hoạch đó khỏi tổng đã lập và lịch đã phân để form không tự báo hết quota/năng lực. Không loại các kế hoạch khác.

Không tạo bảng/model/trạng thái database mới, không migration, không seed, không sửa SRS/Domain nguồn. Chỉ cập nhật backend/frontend/OpenAPI và tài liệu. Trạng thái **DA_CODE_CHUA_TEST**; tiếp tục hoãn unit/integration/E2E/regression. Không tạo/sửa/duyệt kế hoạch thật để kiểm tra triển khai.

## Bằng chứng triển khai

- Kiểm cú pháp CommonJS trong image Node24.21.0 thành công; 55 file frontend phân tích cú pháp thành công. OpenAPI foundation/planned/runtime xác thực thành công. Build backend/frontend và Vite thành công, còn cảnh báo chunk lớn có sẵn.
- Đã cập nhật riêng backend/frontend bằng `docker compose up -d --no-deps backend frontend`, không chạy migrate/seed. Ba dịch vụ frontend/backend/SQL Server healthy; health qua frontend trả database connected.
- Đối chiếu chỉ đọc kế hoạch hiện hữu #1: `CHO_DUYET`, version0, `THIEU_NGUYEN_VAT_LIEU`, thiếu5kg Hương Cola. Ngữ cảnh có `editPlanId=1` trả TP002 còn36chai để sửa và2ứng viên xưởng. Không tạo fixture, không sửa/duyệt phiếu này, không chạy kiểm thử ghi dữ liệu.
- Chưa kiểm thử thao tác lưu sửa, cạnh tranh, rollback hoặc duyệt thực tế; các bước đó nằm trong danh sách kiểm tay bên dưới. Không coi health/build/đối chiếu dữ liệu là nghiệm thu nghiệp vụ.

## Kiểm tay sau khi người dùng cho kiểm thử

1. Mở kế hoạch chờ duyệt bằng tài khoản lập kế hoạch, sửa vật tư/lượng/xưởng/lịch; lưu và kiểm tra version tăng, chỉ phiếu này thay đổi.
2. Nhập nhu cầu lớn hơn khả dụng: phiếu vẫn lưu chờ duyệt, cột và chi tiết báo thiếu đúng lượng cộng tất cả phân công. Mua/nhập bổ sung rồi tải lại để xem tình trạng cập nhật theo phần tồn dự kiến thực tế.
3. Mở hai tab cùng phiếu: tab lưu sau với version cũ phải nhận 409, không mất thay đổi tab đầu.
4. Duyệt phiếu rồi thử lại yêu cầu sửa cũ: API từ chối; nút Sửa không còn. Tài khoản thiếu quyền/scope và người lập/sửa tự duyệt phải bị chặn.
5. Thử lịch thiếu năng lực hoặc vượt lượng đơn: lưu thất bại và phiếu/lịch cũ vẫn nguyên vẹn; snapshot các kế hoạch đã duyệt không đổi.
