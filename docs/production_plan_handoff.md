# Duyệt và chuyển xử lý kế hoạch — 26/10/2026

## Quyết định hiện hành: mua hàng độc lập xưởng

Phản hồi mới nhất26/10 thay điều kiện scope xưởng đối với mua hàng: bộ phận mua hàng chỉ nhận thông báo vật tư thiếu và lập đơn mua, không tham gia phân công xưởng. Không cấp thêm TaiKhoan_Xuong. Những đoạn mô tả mua hàng bị chặn bởi phạm vi xưởng bên dưới là lịch sử đã thay thế trong đúng luồng mua hàng; scope của xưởng/lập kế hoạch và kho vẫn giữ.

Đã bỏ điều kiện xưởng tại đếm người nhận mua hàng, queue PURCHASING, lookup nguồn mua và thao tác danh sách/chi tiết/tạo/gửi/duyệt/xóa bản nháp đơn mua. RBAC cho từng thao tác, tài khoản nội bộ, nhu cầu thuộc đúng nguồn, trạng thái kế hoạch, quota mua sau tồn/PO, NCC, DECIMAL, version/CSRF/idempotency, phụ thuộc chứng từ và maker-checker vẫn giữ. Không trao quyền plans.read hoặc xem phân công sản xuất cho người mua.

Queue mua hàng trả DTO riêng PurchaseRequirementResult, chỉ mã nguồn truy vết, tên vật tư/đơn vị, lượng thiếu, lượng đã có đơn mua và lượng cần mua thêm. Không trả mã/tên xưởng, BOM, thành phẩm, dòng đơn hàng hay lịch sản xuất. Giao diện có bảng chi tiết yêu cầu riêng và nút lập đơn mua điền sẵn vật tư, không dùng chi tiết KHSX cho mua hàng. Chọn NCC/giá và gửi duyệt vẫn do người mua thực hiện. Thông báo giám đốc không còn yêu cầu scope xưởng của người mua; chỉ báo thiếu người nhận khi không có tài khoản nội bộ ACTIVE có quyền purchases.create.

Không migration/seed hoặc ghi dữ liệu/scopes khi triển khai. Trạng thái DA_CODE_CHUA_TEST, tiếp tục hoãn bộ test nghiệp vụ.

Bằng chứng sau điều chỉnh: CommonJS trong image kiểm cú pháp thành công, 59file frontend phân tích cú pháp thành công, OpenAPI và build backend/frontend hợp lệ; health connected. Đọc dữ liệu hiện hữu bằng tài khoản mua hàng vẫn chỉ có1scope xưởng nhưng nhận được1yêu cầu (#2), thiếu5kg Hương chanh, nguồn lập mua có1mục. Giám đốc đọc kế hoạch#2 DA_DUYET: target PURCHASING,2người nhận, blocked=false. Không tự duyệt hoặc sửa các phiếu này. DTO chỉ giữ các dòng thiếu, không trả lượng nhu cầu đầy đủ hay vật tư đã đủ. Chưa chạy bộ test nghiệp vụ hoặc thực hiện ghi PO thử.

Yêu cầu người dùng: giám đốc quyết định ngay trong chi tiết kế hoạch; duyệt đủ vật tư chuyển xưởng, duyệt thiếu chuyển yêu cầu mua bổ sung; từ chối bắt buộc lý do và phản hồi cho lập kế hoạch. Người dùng đã được hỏi riêng và chọn **giữ nguyên phạm vi mua hàng**, không cấp thêm bốn xưởng mới. Không tự thay quyết định này.

## Hiện thực

- Giữ `CHO_DUYET` → `DA_DUYET` / `TU_CHOI`; giám đốc cần `plans.decide`, khác người tạo và người sửa cuối, đúng scope/version/CSRF/idempotency như cũ. Nút Phê duyệt/Từ chối xuất hiện cuối chi tiết. Từ chối mở form lý do bắt buộc, trim, tối đa1000ký tự; lưu `rejection_reason` sẵn có và trả trong API.
- Duyệt tạo `NhuCauNguyenLieuKHSX` từ snapshot BOM và phân bổ tồn dự kiến trong transaction hiện có. Nhu cầu thiếu chính là nguồn yêu cầu mua; không thêm loại phiếu/bảng hoặc tự tạo PO khi chưa biết nhà cung cấp/giá. Ghi audit `plans.handoff.purchasing/workshop/planning` cùng transaction, snapshot gồm nguồn, lượng thiếu, nơi nhận và tình trạng thiếu người nhận.
- `handoffTarget`: `PURCHASING` nếu đã duyệt còn thiếu, `WORKSHOP` nếu đủ, `PLANNING` nếu từ chối; trạng thái chờ duyệt/chấm dứt khác không có nơi nhận. `handoffRecipientCount` đếm tài khoản nội bộ ACTIVE, role ACTIVE, có quyền thao tác của bộ phận nhận và đầy đủ phạm vi xưởng của kế hoạch. Không có người nhận thì `handoffBlocked=true`, thông báo rõ, không báo đã gửi thành công, không mở quyền hoặc tự tạo tài khoản.
- `GET /production-plans/receiving-queue?audience=...`: queue trong ứng dụng dựa trên chứng từ và nhu cầu đã lưu; chỉ đọc, kiểm quyền cụ thể của audience và toàn bộ phạm vi xưởng. Không email hoặc tin nhắn bên ngoài. Không bảng thông báo giả. Phân trang sau khi lọc đúng loại phiếu, trả total thực.
- Mua hàng thấy mục “Yêu cầu mua nguyên liệu thiếu…” tại trang Đơn mua nguyên liệu. Hiển thị nguyên liệu/lượng thiếu và nút lập đơn mua; điền sẵn kế hoạch, nhu cầu, vật tư, đơn vị và lượng còn cần mua. Người mua chọn NCC/đơn giá trước lưu; không gửi/duyệt PO tự động. Phần gợi ý trừ PO đã duyệt chưa nhận và bản NHAP/CHO_DUYET để không gợi ý mua lặp. Backend vẫn kiểm quota thật khi tạo/duyệt PO như cũ.
- Xưởng thấy kế hoạch đủ vật tư, đã duyệt tại Phân công xưởng (`/workshop-assignments`); có chi tiết đầy đủ. Kế hoạch còn thiếu không xuất hiện trong queue này.
- Lập kế hoạch thấy danh sách phiếu bị từ chối và lý do tại trang KHSX. Phiếu bị từ chối vẫn không được sửa bằng API sửa CHO_DUYET; không tự mở lại phiếu vì người dùng chưa giao quy trình gửi duyệt lại. Có thể dùng luồng lập kế hoạch mới hiện có.

## Khi nhập nguyên liệu bổ sung

Tải lại queue tính khả dụng thật theo scope, QC, HSD, giữ tồn, kiểm kê và forecast của các kế hoạch khác. Cộng nhu cầu theo từng vật tư trên toàn kế hoạch, trừ phần đã cấp/giữ. Khi tính lượng có thể dùng cho chính kế hoạch, loại claim forecast của chính nó để không trừ hai lần; giữ claim của kế hoạch khác. Vì vậy vật tư đã nhập đạt QC có thể đưa phiếu sang queue xưởng mà không cần duyệt lại hoặc ghi forecast trong GET. Đây là chuyển danh sách xử lý khi đọc, không giữ/trừ tồn; cấp phát/xuất kho vẫn phải qua transaction, reservation và kiểm tồn như cũ. Snapshot nhu cầu lúc duyệt không thay đổi.

## Giới hạn do phạm vi đã chọn

Hai tài khoản mua hàng hiện chỉ được thấy xưởng được cấp trước đây. Kế hoạch thuộc một trong bốn xưởng mới mà họ chưa có scope sẽ **không hiện** cho họ, API mua cũng không được bỏ kiểm scope. Giám đốc thấy thông báo chưa có người mua hàng đủ phạm vi; yêu cầu thiếu vẫn giữ trong nhu cầu/audit, không mất. Đây là hệ quả của lựa chọn giữ nguyên phạm vi, không phải lỗi đã được khắc phục bằng cách mở quyền ngầm.

Không migration/seed hoặc thay scope/dữ liệu khi triển khai; không sửa SRS/Domain. **DA_CODE_CHUA_TEST**, không chạy unit/integration/E2E/regression, không tự duyệt/từ chối/mua trên phiếu thật để kiểm. Kiểm tay cần bao gồm ba nhánh duyệt đủ/duyệt thiếu/từ chối; lý do trống; version cũ và maker-checker; audience/scope trái phép; thiếu người nhận; PO đang chờ; nhập bổ sung và tải lại chuyển queue; không đổi ledger tại duyệt/GET.

## Bằng chứng triển khai26/10

CommonJS kiểm cú pháp thành công trong image Node24.21.0; 58 file frontend phân tích cú pháp thành công; OpenAPI foundation/planned/runtime hợp lệ. Docker build backend/frontend và Vite thành công (còn cảnh báo chunk lớn có sẵn). Đã cập nhật riêng backend/frontend bằng `--no-deps`, health qua frontend trả database connected. Không chạy migrate/seed.

Đọc bằng các tài khoản/quyền hiện hữu: lập kế hoạch có5scope xưởng, mua hàng1scope, xưởng5scope; ba queue đều0 do hiện chỉ có kế hoạch#1 CHO_DUYET, chưa có phiếu đã duyệt hoặc từ chối. Phiếu này vẫn không có handoffTarget hoặc lý do từ chối. Đây là đối chiếu dữ liệu hiện có, **không phải** kiểm thử ba nhánh duyệt/chuyển/từ chối; chưa kiểm chức năng ghi, cạnh tranh, rollback hoặc UI trình duyệt. Git status/diff đã kiểm, không commit/reset, giữ thay đổi cũ.
