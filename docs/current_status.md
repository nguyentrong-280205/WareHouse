# Trạng thái hiện hành — 16/11/2026

Hệ thống hiện hành là Docker project `warehouse`, Microsoft SQL Server + mssql/T-SQL, Express/CommonJS và React/JavaScript. HTTT02 Windows độc lập. MySQL/Prisma và các checkpoint trước đây chỉ là hồ sơ lịch sử; không dùng chúng để chạy/reset môi trường hiện hành.

29 UC giữ trạng thái **DA_CODE_CHUA_TEST** ở cấp toàn hệ thống. Một số luồng đã có bằng chứng thao tác riêng vào tháng 11; không suy ra nghiệm thu toàn bộ, không mở lại bộ test đang hoãn. FS01–FS12 đã được duyệt ngày 15/10 cùng các điều chỉnh sau đó.

Ngày 20/11/2026, form tạo đơn UC11 tự điền người nhận, địa chỉ và điện thoại từ hồ sơ khách hàng hiện hành. API tạo đơn dùng hồ sơ cho các trường được bỏ qua. Mỗi đơn lưu thông tin giao hàng riêng, gồm cả các giá trị khách sửa trên form. Docker backend/frontend đã cập nhật, kiểm tra OpenAPI, build, lint và health đạt.

Kiểm tra tay UC11 trên môi trường test bằng tài khoản có hồ sơ đầy đủ. Mở **Đơn hàng → Thêm mới**, kiểm tra ba mục đã tự điền, chọn sản phẩm và ngày giao rồi lưu. Mở chi tiết để đối chiếu thông tin giao hàng. Với hồ sơ thiếu số điện thoại, kiểm tra khách chỉ cần bổ sung mục đó. Ca nghiệp vụ này chưa chạy.

UC11 yêu cầu ngày giao cách ngày tạo đơn và ngày xác nhận đơn ít nhất 7 ngày lịch theo giờ Việt Nam. Form hiển thị ngày giao sớm nhất do API trả về. Kiểm tra tay trên môi trường test với ngày giao sau 6 ngày, sau đúng 7 ngày và bản nháp xác nhận muộn. Ca nghiệp vụ này chưa chạy.

Ngày 21/11/2026, đợt sửa giao diện cập nhật tìm kiếm theo mã, chuông cảnh báo kho và các liên kết báo cáo. Tìm kiếm kế hoạch và phiếu kho dùng bộ lọc mã trên các API danh sách hiện có, giữ điều kiện phạm vi tài khoản. Dấu đã đọc chỉ lưu trong tab trình duyệt. Bảng chứng từ và tra cứu hiển thị từng bản ghi trên điện thoại. Hộp thoại nghiệp vụ hỗ trợ phím Esc và trả tiêu điểm về nút mở.

Docker backend/frontend đã cập nhật. Build, lint, OpenAPI và truy vấn SQL Server chỉ đọc đạt. Kiểm tra hiển thị và điều hướng bằng dữ liệu minh họa cho khách hàng, xưởng và nhóm xem báo cáo. Đối chiếu thủ công khi nghiệm thu bằng mã đã có, bộ lọc cảnh báo từ dashboard, lối tắt Đặt hàng và thao tác Chi tiết trên điện thoại. Chưa nghiệm thu nghiệp vụ ghi chứng từ.

Đợt [sửa lỗi 16/11/2026](system_fixes_20261116.md) xử lý R01–R08 ở mã nguồn. Người dùng chốt tự hoàn thành KHSX khi đủ sản lượng từng phân công đã nhập kho sau QC. Tại thời điểm đó Docker Desktop chưa kết nối được và các ca nghiệp vụ vẫn được hoãn.

Schema mong đợi sau toàn bộ migration trong repository: **81 bảng và 256 FK**. Nguồn kiểm: `backend/database/sqlserver/schema-manifest.json`, sinh từ migration bất biến bằng `node scripts/update-schema-manifest.js` chạy trong backend; script chỉ đọc nguồn, không nối DB. Số này không phải kết quả đọc DB trong đợt 16/11. Các số 76/237, 77/241 trong hồ sơ cũ thuộc các revision trước.

Kiểm tra tĩnh: backend syntax, frontend JS/JSX parser, OpenAPI và frontend lint/build. Các kiểm tra này không xác minh nghiệp vụ, cạnh tranh cập nhật hoặc rollback thật. Các ca hồi quy mới đã chuẩn bị nhưng chưa chạy.

Kết quả cuối đợt sửa: 201 tệp CommonJS và 72 tệp frontend JS/JSX kiểm cú pháp đạt; OpenAPI foundation/planned/runtime hợp lệ; 172 operation planned khớp runtime, đủ handler cho 169 operation nghiệp vụ (3 auth bind riêng). Frontend lint không lỗi/cảnh báo, production build thành công và không còn cảnh báo chunk lớn. Compose config và `git diff --check` đạt. Migrations, SRS và tám Domain Model không thay đổi. Evidence máy đọc ở `.artifacts/reviews/system-fixes-verification-2026-11-16.json` ignored.

Mật khẩu chỉ ở credential/guide cục bộ ignored trong `.artifacts` hoặc Docker secrets. Tài liệu được theo dõi không chứa giá trị rõ. Không coi tài liệu bàn giao là nguồn để cấp lại scope, mở khóa account hoặc nạp lại tồn/chứng từ đã dùng.

Các tài liệu `uc_catalog`, `uc_progress`, `full_system_*`, `sqlserver_schema_manifest` giữ lịch sử để truy vết. Khi nội dung checkpoint cũ mâu thuẫn, dùng trạng thái hiện hành này cùng các quyết định người dùng mới hơn; không sửa SRS/Domain để khớp code.
