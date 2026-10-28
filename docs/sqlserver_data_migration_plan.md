# Kế hoạch dữ liệu MySQL → SQL Server — chờ duyệt import

**Chưa sao chép dữ liệu MySQL.** Schema SQL Server và fixture demo đã được tạo riêng. Lệnh người dùng cho phép tạo schema nhưng yêu cầu duyệt mapping/FK/count/rollback trước dữ liệu thật. Không chạy importer trong đợt này.

## Thống kê nguồn đọc thực tế

MySQL warehouse_db có 79 bảng (76 nghiệp vụ + marker/history kỹ thuật), 25 bảng có dữ liệu. Các bảng đơn hàng, KHSX, PO, QC, tồn kho, reservation, posting/ledger, kiểm kê và hàng trả đều đang rỗng tại thời điểm inventory. Bảng chi tiết và max ID: [manifest](sqlserver_schema_manifest.md). JSON inventory chỉ COUNT/MAX ID, lưu ignored tại `backend/.artifacts/sqlserver/mysql-source-inventory.json`.

| Nhóm | Bảng và số dòng nguồn |
|---|---|
| Tài khoản/quyền | VaiTroQuyen9; TaiKhoan19; Quyen63; VaiTro_Quyen65; KhachHang1 |
| Scope | TaiKhoan_Kho48; TaiKhoan_Xuong16 |
| Danh mục/nguồn | DonViTinh9; NguyenLieu4; ThanhPham1; NhaCungCap1; XuongSanXuat1 |
| Kho/cấu hình | Kho3; ViTriLuuKho5; QuyCachDongGoi4; GiaBanThanhPham4; HeSoChiemCho10 |
| Định mức/lịch | DinhMuc1; ChiTietDinhMuc4; LichNangLucXuong33 |
| Lịch sử cần lựa chọn riêng | AuditLog7; PhienDangNhap3; IdempotencyRequest2 |
| Migration, không copy | _prisma_migrations2; _sql_migrations9 |

Đây là ảnh chụp inventory, không khóa MySQL. Nếu tiếp tục ghi nguồn, phải chụp lại counts/max IDs và lập cut-off trước import. Không lấy số liệu cũ để chứng minh dữ liệu mới đã đối chiếu.

## Mapping đã chuẩn bị

Tên 76 bảng và FK giữ tương ứng 1:1. Không thêm bảng nghiệp vụ cho quá trình chuyển đổi.

- ID unsigned → signed BIGINT: giữ ID chỉ nếu mọi giá trị ≤9223372036854775807 và đích sạch; nếu đích đã seed thì lập bảng đối chiếu theo business key và FK, **không INSERT đè theo ID**. MAX ID nguồn hiện nhỏ, chưa có overflow; phải rà lại khi import thật.
- Unicode VARCHAR/TEXT → NVARCHAR; mã/login/hash BIN2, nội dung CI_AI. Kiểm tra độ dài UTF-16, trailing spaces/collation/unique trước ghi; không tự trim hoặc đổi mã để tránh lỗi.
- DECIMAL chuyển bằng chuỗi chính xác, giữ precision/scale; DATE giữ ngày, DATETIME UTC → datetime2(3), không qua floating point hoặc chuyển múi giờ lần nữa.
- ENUM → NVARCHAR + CHECK, BOOLEAN → BIT; JSON parse/serialize hợp lệ và giữ decimal/ID đã là chuỗi. Generated fields không import, SQL Server tự tính.
- KhachHang1:N TaiKhoan, customer_id NULL nội bộ và mọi FK/scope giữ nguyên. Không sửa role hoặc cấp scope rộng để giải quyết xung đột.
- Các unique nullable đã dùng filtered index; đối chiếu nguồn QC/rework/stock posting và dòng kiểm kê không bị gom NULL thành một khóa chung.
- `_prisma_migrations`, `_sql_migrations`, marker test không copy. SQL Server giữ lineage/marker riêng.
- PhienDangNhap và IdempotencyRequest cần quyết định riêng; đề xuất không mang session/token sang engine mới, yêu cầu đăng nhập lại. AuditLog cần quyết định lưu nguồn archive hoặc import với nguyên actor/target/correlation. Không tự xóa nguồn.

## Trình tự nếu người dùng duyệt sao chép

1. Chọn mục tiêu: giữ SQL Server fixture hiện tại và không import; hoặc nhập dữ liệu chọn lọc với conflict report; hoặc rehearsal sang database staging mới được duyệt. Không tự làm rỗng SQL Server đã seed.
2. Dừng ghi nguồn/đích trong cửa sổ cut-off đã thống nhất; chụp source counts/max IDs/checksum dữ liệu và backup nguồn/đích. Không in tài khoản/hash/token vào log.
3. Đối chiếu unique/check/FK/type/collation trước import; xuất bảng conflict theo mã/ID, không tự overwrite/merge. Cho người dùng duyệt những xung đột cụ thể.
4. Nạp theo dependency: quyền/roles/khách → accounts → đơn vị/danh mục/xưởng/NCC → kho/vị trí/scope → version giá/quy cách/BOM/lịch/factor → chứng từ sản xuất/mua/giao/QC → receipt/issue/returns → balances/holds → kiểm kê/disposition/rework và trace. Graph bảng có vòng rework: sắp theo quan hệ record thật QC gốc → hồ sơ xử lý → đợt rework → QC mới. Không bịa nguồn, đặt cả hai nguồn XOR NULL hoặc vô hiệu constraint để nạp. Nếu record thực sự tham chiếu thành vòng thì dừng review mapping.
5. Đối chiếu số dòng từng bảng và từng scope; không chỉ tổng dòng. So sánh SUM on_hand/reserved/delta chính xác, qty QC inspected=accepted+rejected, quota nguồn, delivered/returns, BOM/version, ledger trước/sau và chứng từ liên quan; kiểm FK/CHECK trusted và unique. Các kiểm chứng nghiệp vụ này chỉ chạy khi được giao lại kiểm thử/import.
6. Chỉ chuyển ứng dụng sang dữ liệu nhập sau khi có đối chiếu và người dùng duyệt. Ghi nhật ký import batch/version/mapping vào hồ sơ kỹ thuật private, không thêm bảng nghiệp vụ tùy ý.

## Rollback và quyết định chờ

Trước import phải có backup SQL Server và phương án phục hồi sang tên DB mới; không RESTORE WITH REPLACE hoặc drop dữ liệu đang dùng. Nếu transaction import thất bại thì rollback toàn batch, không retry âm thầm; giữ source/target trước import để điều tra. Nếu đã cut-over và phát sinh dữ liệu mới, không tự trỏ ngược MySQL vì có thể bỏ mất giao dịch SQL Server; phải đối chiếu delta và người dùng duyệt.

MySQL containers/volumes và cấu hình cũ được giữ; Compose MySQL chỉ archive. Backend hiện tại đã dùng mssql, nên rollback ứng dụng cần artifact/code MySQL đúng phiên bản đã được kiểm chứng, không dùng code SQL Server trỏ vào MySQL. Không giả định Git đã lưu bản cũ vì repository còn nhiều file untracked.

**Cần người dùng lựa chọn:** tiếp tục SQL Server với fixture mới (hiện trạng), hay chuyển dữ liệu nguồn nào; có cần import AuditLog7 dòng; xử lý 3session/2idempotency cũ; cách giải quyết record đã seed trùng business key; cửa sổ cut-off và backup/rollback. Chưa có lựa chọn nào được tự phê duyệt.
