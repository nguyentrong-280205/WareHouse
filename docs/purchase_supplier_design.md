# Nhà cung cấp, giá mua và ghi chú — thiết kế26/10/2026

Bổ sung27/10 theo yêu cầu: đơn vị cơ sở trong đơn mua tự gắn theo NguyenLieu.base_unit_id, hiển thị mã/tên bằng ô chỉ đọc, không còn dropdown để người mua đổi. Chọn nguyên liệu/nhu cầu hoặc tải form từ yêu cầu tự đồng bộ unitId trong state; payload vẫn gửi ID để backend kiểm. Backend kiểm đồng thời đơn vị của nhu cầu nguồn và đơn vị cơ sở hiện hành của nguyên liệu khi tạo/duyệt PO; sai đơn vị thì từ chối, không tự đổi số lượng/đơn giá hoặc lịch sử. Không thay các màn hình chọn đơn vị khác, schema/database hoặc seed.

Kiểm triển khai phần đơn vị27/10: 61file frontend phân tích cú pháp thành công; CommonJS trong image kiểm cú pháp và build backend/frontend thành công. Đã cập nhật hai container ứng dụng riêng bằng --no-deps, health qua frontend connected sau khi khởi động xong. Không chạy unit/integration/E2E/regression hoặc ghi PO thử; DA_CODE_CHUA_TEST.

**DA_XAC_NHAN:** người dùng trả lời trực tiếp “Duyệt migration và dữ liệu mẫu theo thiết kế” ngày26/10. Được áp dụng migration mới trên hai DB Docker và seed NCC/giá theo nội dung dưới đây; không cần hỏi lại, không mở rộng sang dữ liệu HTTT02 hoặc ghi đè đơn cũ.

Phạm vi được giao: bổ sung NCC mẫu bao phủ toàn bộ vật tư đang có; gợi ý NCC theo vật tư thiếu và điền giá, nhân viên được đổi; ghi chú cuối đơn. Dữ liệu mẫu đồ án, không danh sách toàn bộ NCC ngoài thị trường hoặc báo giá thương mại được xác nhận. Không sửa SRS/Domain gốc, đơn cũ, tồn kho hoặc scope xưởng.

## Thay đổi database đề xuất để duyệt

Migration mới `202610260001_supplier_quotes_notes.sql`:

- Thêm `DonMuaNguyenLieu.notes NVARCHAR(2000) NULL`; đơn cũ NULL, không cập nhật nội dung cũ.
- Thêm bảng `BaoGiaNguyenLieu`: id BIGINT IDENTITY PK; supplier_id/material_id/unit_id BIGINT FK lần lượt tới NhaCungCap/NguyenLieu/DonViTinh; revision BIGINT dương; unit_price DECIMAL(20,6) không âm; effective_at/created_at UTC DATETIME2(3); UNIQUE(supplier_id,material_id,unit_id,revision). Một phiên bản mới thay giá hiệu lực, không sửa snapshot đơn cũ. Đây là dữ liệu quan hệ NCC–vật tư–đơn vị–giá theo yêu cầu mới, không thêm lớp điều phối.
- Không sửa migration APPLIED. Chỉ apply mới trên SQL Server Docker warehouse_db/warehouse_test, không đụng HTTT02 hoặc MySQL archives. Seed NCC và báo giá chỉ bổ sung mã/cặp còn thiếu, không ghi đè NCC/giá cũ. Không tạo PO hay tồn thử.

## Gợi ý và giá

NCC chuyên nhóm: lon; PET/nắp; nhãn/carton; đường; nước xử lý; hương/phụ gia; trà chiết xuất; CO2. Thêm NCC tổng hợp có thể cung ứng toàn bộ danh mục hiện tại để lập được một đơn nhiều nhóm vật tư. Giá mẫu theo đơn vị cơ sở, không tự thêm thuế/chiết khấu/vận chuyển. NCC tổng hợp là phương án dự phòng giá cao hơn; không giả danh NCC thật.

Form chỉ gợi ý NCC ACTIVE có báo giá hiện hành cho toàn bộ các dòng đang chọn, đúng đơn vị cơ sở. Chọn giá tổng thấp nhất theo số lượng bằng BigInt, không làm tròn trung gian; tie theo mã NCC. Hiển thị lý do gợi ý; người mua được đổi sang NCC phù hợp và điều chỉnh đơn giá trước lưu. Nếu không có một NCC bao phủ tất cả, báo cần tách đơn theo nhóm, không tự tạo nhiều đơn hoặc đoán NCC. Đổi NCC cập nhật giá tham khảo của các dòng theo NCC đó; đổi vật tư/đơn vị kiểm lại tương thích. Không sửa tiền của đơn đã lưu/đã duyệt.

Backend kiểm từng vật tư có thể cung cấp bởi NCC ở thời điểm tạo mới; đơn lịch sử chưa có mapping vẫn đọc/gửi/duyệt theo giá snapshot cũ. Ghi chú là plain text tùy chọn, trim/max2000, lưu và hiển thị trong chi tiết, audit. Tính thành tiền tiếp tục theo FS01 ở bước gửi duyệt, dùng giá người mua đã chốt khi tạo, không tự lấy giá mới ghi đè.

Contract bổ sung notes, báo giá NCC trong lookup, nhãn NCC/vật tư cho chi tiết. Giữ React/CommonJS/mssql, luồng mua độc lập xưởng, RBAC/nguồn/quota/CSRF/idempotency/maker-checker. DA_CODE_CHUA_TEST; chỉ syntax/OpenAPI/build/migration/seed được duyệt/health và đọc chẩn đoán, không bộ test nghiệp vụ hoặc tạo đơn mua thử.

## Bằng chứng triển khai26/10

- Migration `202610260001_supplier_quotes_notes` APPLIED dev/test, pending[]. Bất biến từ thời điểm áp dụng. Docker dev có77bảng nghiệp vụ/241FK; notes NVARCHAR(2000) xác minh max_length4000byte. Không đổi HTTT02 hoặc migration cũ.
- Seed thành công9NCC/48báo giá, bao phủ24vật tư ACTIVE, giữ1NCC cũ (tổng10NCC ACTIVE). Hai lần seed đầu chưa nạp đủ cấu hình của script setup nên dừng trước ghi dữ liệu; đã bổ sung việc nạp CSRF nội bộ từ Docker secret, không in secret. Không có NCC/giá thêm dở dang. Seed chỉ bổ sung cặp chưa có trong transaction/applock; restart không ghi đè giá hiện hữu.
- Lookup thực tế trả9NCC có báo giá. Hương chanh: Hương Việt170.000VND/kg (5kg=850.000VND), NCC tổng hợp183.600VND/kg (5kg=918.000VND). Đây là đọc báo giá thực đã seed, chưa phải kiểm thử UI tự chọn.
- CommonJS trong image kiểm cú pháp thành công; 60file frontend phân tích cú pháp thành công, OpenAPI foundation/planned/runtime hợp lệ, build backend/frontend/Vite thành công. Backend/frontend được cập nhật riêng; health qua frontend trả database connected. Cảnh báo bundle lớn có sẵn còn nguyên.
- Không chạy unit/integration/E2E/regression, không tạo PO thử hoặc kiểm ghi notes. Chưa kiểm thử lưu/gửi/duyệt/maker-checker trên dữ liệu test; không tuyên bố nghiệm thu. Giữ trạng thái DA_CODE_CHUA_TEST. Git status/diff kiểm lại, không commit/reset/xóa dữ liệu.

## Các bước kiểm tay khi được giao kiểm thử

Mở yêu cầu5kg Hương chanh: dự kiến chọn Hương Việt/170.000, tổng tạm850.000; đổi NCC tổng hợp →183.600/tổng918.000. Chỉnh giá rồi sửa ghi chú/số lượng phải giữ giá đã chỉnh, đổi NCC mới lấy lại giá tham khảo. Thêm vật tư nhóm khác → chọn được NCC bao phủ cả đơn, hoặc báo phải tách đơn. Ghi chú nhiều dòng/tiếng Việt/để trống/quá2000ký tự cần kiểm lưu và chi tiết. Giá mới không làm đổi PO cũ; NCC không cung ứng vật tư phải bị backend chặn khi tạo. Kiểm ghi dữ liệu nếu được giao vẫn trên warehouse_test có guard.
