# Danh mục thành phẩm — phê duyệt 23/10/2026

**Bổ sung sau bàn giao:** người dùng đã giao tự chọn và thêm giá mẫu cho15SKU. Bảng giá VND và quy tắc tại [data.md](../data.md); script seed-product-prices.js chỉ thêm cặp sản phẩm/đơn vị chưa có giá, giữ giá đã tồn tại và snapshot đơn đã chốt. Giá Lốc/Thùng/Pallet nhân theo hệ số hiện hành, không thêm chiết khấu/thuế/phí. Nội dung “chưa có giá” phía dưới mô tả mốc bàn giao danh mục trước phê duyệt giá mới này; BOM/sức chứa/tồn/lô vẫn chưa seed. Không tự xác nhận đơn nháp.

Người dùng duyệt TP001–TP015, khóa FS_DEMO_20261015_PET_500 nhưng giữ lịch sử. Đây là dữ liệu mẫu đồ án, không phải thông số xác nhận của nhà sản xuất.

| Nhóm | HSD mặc định (ngày) | Thùng/pallet | Đơn vị cơ sở/pallet |
|---|---:|---:|---:|
| TP001–TP008 | 365 | 60 | 1440 |
| TP009–TP010 | 540 | 60 | 1440 |
| TP011–TP012 | 270 | 60 | 1440 |
| TP013–TP014 | 270 | 60 | 1440 |
| TP015 | 365 | 80 | 1920 |

Mỗi sản phẩm có bốn phiên bản quy cách v1: Chai hoặc Lon = 1; Lốc = 6; Thùng = 24; Pallet theo bảng. Ngày hiệu lực 23/10/2026. Chỉ đơn vị phù hợp loại chai/lon được chọn. Người có quyền products.write theo RBAC hiện hành chỉnh HSD và thêm phiên bản quy cách mới; không sửa hệ số/ngày hiệu lực của phiên bản đã lưu. Pallet lưu snapshot số thùng và hệ số thùng tại lúc tạo, tránh bị thay đổi khi quy cách thùng có phiên bản mới.

Tác động schema được thực hiện trong migration mới 202610230001_product_description: thêm ThanhPham.description nullable, QuyCachDongGoi.cartons_per_pallet và carton_factor_snapshot nullable với CHECK đi đôi và dương. Không tạo bảng mới; không sửa migration đã áp dụng, không backfill suy đoán các quy cách lịch sử. Giữ nguyên DECIMAL(20,9) cho hệ số. API ProductInput/Update/Result bổ sung mô tả và thông tin pallet, không đổi endpoint hay danh sách UC.

Khi lập đơn, qty_input × factor_snapshot = qty_base bằng số nguyên BigInt theo scale, không làm tròn trung gian. Đơn đã lưu tiếp tục giữ packaging_id/factor_snapshot/qty_base, không tính lại theo phiên bản mới. Không tự tạo giá bán, BOM hoặc hệ số chiếm chỗ cho 15 sản phẩm: chưa có thông số được duyệt. Xác nhận đơn vẫn yêu cầu giá hợp lệ; sản xuất/nhập kho vẫn giữ gate BOM/sức chứa/QC.

Khi tạo lô thành phẩm, HSD mặc định = NSX + shelf_life_days theo ngày lịch UTC để tránh lệch ngày; cho phép nhập HSD thực tế. Backend là nguồn kiểm tra cuối cùng. Thay HSD mặc định không viết lại lô cũ. Lô đã có lịch sử không được sửa hồi tố ngày/định danh. FEFO tiếp tục dựa HSD thực tế của lô, FIFO theo ngày nhập khi cùng HSD; loại lô hết hạn, bị khóa, chưa đạt QC hoặc hết khả dụng.

Seed mới chạy trong transaction, preflight toàn bộ mã sản phẩm và dừng nếu có xung đột, không ghi đè. Marker riêng nhận biết lần seed đã chạy để restart không nhân đôi hoặc ghi đè chỉnh sửa. Không tạo tồn, lô hoặc chứng từ trong warehouse_db; không đổi dữ liệu SQL Server Windows độc lập.

## Phạm vi kiểm chứng được giao

Lệnh mới cho phép kiểm tra tập trung quy đổi, HSD/lô và FEFO. Chỉ chạy bài kiểm tra riêng trên warehouse_test có guard tên DB, login, endpoint, identity và marker; fixture thật trong một transaction luôn rollback. Không chạy toàn bộ unit/integration/E2E/regression cũ; không thay trạng thái nghiệm thu 29 UC. Kiểm tra service/repository SQL thật không thay thế nghiệm thu UI, RBAC, concurrency hay hồi quy toàn hệ thống.

## Kết quả thực tế 23/10/2026

Giá bổ sung sau bàn giao: seed đã commit60giá mới/15SKU/4đơn vị; đối chiếu chỉ đọc nhận đủ60giá có hiệu lực qua currentPrice của module orders. TP001:10.000/lon,60.000/lốc,240.000/thùng,14.400.000/pallet; hàm money hiện hành cho5thùng=1.200.000VND. Seed lấy UTC từ SQL Server để khớp bộ chọn giá; lần đầu giá chưa hiệu lực đã rollback toàn transaction rồi sửa nguồn timestamp và chạy thành công. Không xác nhận đơn của người dùng; không chạy bộ test tự động trong lần thêm giá này. Bảng giá đầy đủ tại data.md. Các kết quả bên dưới là lần kiểm danh mục trước đó.

- Migration 202610230001_product_description APPLIED trên warehouse_db và warehouse_test của SQL Server Docker; cả hai pending=[]; migration native cũ giữ nguyên checksum. Lần đầu gặp lỗi SQL207 khi CHECK tham chiếu cột mới trong cùng batch, transaction đã rollback; đã sửa migration khi chưa APPLIED bằng EXEC hằng cho CHECK và chạy thành công.
- Đối chiếu chỉ đọc: đủ 15 sản phẩm ACTIVE, 60 quy cách v1, HSD/hệ số/snapshot pallet đúng phê duyệt; sản phẩm cũ LOCKED. Restart sau build trả PRODUCT_CATALOG_CURRENT no_reseed_or_overwrite, không nhân đôi/ghi đè.
- Bài SQL thật `product-catalog.test.js`: **1/1 PASS**, kiểm quy đổi base/lốc/thùng/pallet1440/1920, từ chối đơn vị cơ sở không phù hợp và lượng chai/lon lẻ; đơn cũ giữ factor1440/qty2880 khi pallet mới đổi1920; phiên bản mới thùng30/pallet1800 không sửa snapshot cũ; từ chối sửa phiên bản đã lưu.
- Cùng bài SQL kiểm HSD mặc định, nhập HSD thực tế, đổi mặc định chỉ tác động lô mới, ngày nhuận; chặn sửa HSD lô có lịch sử. FEFO/FIFO loại lô hết hạn/khóa/QUARANTINE/hết khả dụng; chặn chọn lô nhập sau cùng HSD; giữ tồn không giảm on_hand; posting giảm100→90, reserved10→0, một ledger delta−10 và reservation CONSUMED. Fixture/kho/sản phẩm kiểm tra được rollback, truy vấn lại không còn fixture.
- `verify-product-catalog-ui.js` PASS: quy đổi BigInt chính xác, lọc Chai/Lon, ngày hiệu lực, pallet dùng phiên bản thùng đúng ngày, ngày nhuận/ngày không hợp lệ; kiểm contract cho phép sửa HSD khi sản phẩm chưa có giá bán. Đây là kiểm hàm giao diện/contract, chưa phải thao tác E2E trên trình duyệt.
- OpenAPI hợp lệ; cú pháp CommonJS đạt trên Node24.21.0; React/JSX parse và Vite production build đạt. Vite còn cảnh báo bundle lớn hơn500kB, không đổi cấu hình frontend để che cảnh báo.
- Health backend3001 và proxy frontend8080 trả database=connected. Không chạy bộ test cũ/toàn hệ thống; không nghiệm thu 29UC, không commit/reset/drop/xóa volume. HTTT02 Windows không thay đổi.

## Cách sử dụng và kiểm tra tay

1. Mở http://localhost:8080, đăng nhập tài khoản quản lý kho, mở Danh mục thành phẩm. Sửa HSD/mô tả theo nhu cầu; chưa có giá bán vẫn lưu được danh mục. Mảng giá trống không xóa giá cũ, xác nhận đơn vẫn giữ lỗi PRICE_NOT_CONFIGURED khi chưa có giá hiệu lực.
2. Sửa quy cách bằng cách giữ các dòng cũ và thêm dòng với revision mới, đơn vị và ngày hiệu lực phù hợp. Pallet nhập số thùng, hệ số tự tính theo dòng Thùng có revision cao nhất đã hiệu lực. Không sửa hệ số/ngày của dòng cũ. Nếu đồng thời thêm quy cách Thùng mới, chọn ngày và nhập lại số thùng/pallet để cập nhật phần xem trước trước khi lưu; server kiểm lại hệ số.
3. Đăng nhập khách hàng, tạo đơn nháp, chọn TP001: chỉ Lon/Lốc/Thùng/Pallet, không Chai. Chọn Pallet v1, nhập2: xem2880lon. TP015 tương tự:3840chai. Không bấm xác nhận đơn trước khi cấu hình giá bán đúng nghiệp vụ.
4. Tạo lô thành phẩm, chọn NSX và quy cách đã hiệu lực tại NSX; form gợi ý HSD, có thể sửa theo thực tế. Bỏ HSD khi tạo qua API thì backend tính. Quy cách mẫu mới hiệu lực23/10/2026, không áp vào lô NSX trước ngày đó.
5. Nghiệm thu nhập/xuất theo quy trình QC và chứng từ thực tế sau khi đã cấu hình BOM/sức chứa/giá tương ứng. Seed không tự tạo lô, tồn hoặc chứng từ để bỏ qua các gate này.

Chạy lại kiểm tra tập trung trên Docker test: từ root dot-source scripts/use-node.ps1 rồi `node backend/scripts/test-product-catalog.js`; kiểm hàm giao diện `node backend/scripts/verify-product-catalog-ui.js`. Không trỏ chúng sang warehouse_db. Đối chiếu seed chỉ đọc: `docker compose exec -T -e NODE_ENV=development backend node scripts/verify-product-catalog.js` (đối chiếu giá trị fixture gốc, sẽ báo khác nếu quản lý đã chủ động sửa HSD sau đó).
