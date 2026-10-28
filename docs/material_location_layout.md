# Phân nhóm vị trí kho nguyên liệu — 28/10/2026

Người dùng chốt phương án A–F, sức chứa mẫu và mã `VITRi-A`…`VITRi-F` như đã trao đổi. Mỗi vị trí thuộc Kho nguyên liệu và giữ đơn vị sức chứa KG:

| Mã | Nhóm | Sức chứa | Nguyên liệu hiện có |
|---|---|---:|---|
| VITRi-A | Nguyên liệu sản xuất khô | 2.000 kg | NVL011 Đường, NVL017 Nguyên liệu tăng lực, NVL018 Trà chiết xuất |
| VITRi-B | Hương liệu | 1.000 kg | NVL013, NVL014, NVL015, NVL016, NVL019 |
| VITRi-C | Bao bì chai, lon | 2.000 kg | NVL001–NVL008; FS_DEMO_20261015_CAP, FS_DEMO_20261015_PET |
| VITRi-D | Vật tư đóng gói | 1.500 kg | NVL009, NVL010; FS_DEMO_20261015_BOX, FS_DEMO_20261015_LABEL |
| VITRi-E | Nước đã xử lý | 3.000 kg | NVL012 |
| VITRi-F | Khí thực phẩm | 500 kg | NVL020 |

Các sức chứa là dữ liệu mẫu theo xác nhận, không phải thông số thiết kế thực tế. Pallet chưa có trong danh mục: không tạo vật tư/tồn tự ý. Bốn mã FS cũ vẫn ACTIVE nên ánh xạ theo đúng loại để giữ khả năng sử dụng; không đổi/xóa chúng.

Thiết kế schema: thêm duy nhất bảng `ViTriNguyenLieuDuocPhep` với PK(location_id,material_id), FK NO ACTION tới ViTriLuuKho/NguyenLieu. Không thêm entity kho/nhóm nghiệp vụ; quan hệ thể hiện phân nhóm đã được người dùng xác nhận, cho phép tương lai cấu hình lại mà không dựa vào tên/mã vật tư. Migration `202610280003_material_location_rules.sql` tạo bảng rỗng, không ghi đè dữ liệu; SQL Server Docker dev/test. Seed một lần tạo 6 vị trí và 24 liên kết trong warehouse_db, DRY theo điều kiện dữ liệu mẫu hiện tại, transaction + audit + guard, dừng nếu trùng mã hoặc thiếu nguyên liệu; không tạo tồn, không cấp scope mới, không cập nhật vị trí cũ. Completion audit ngăn tự tái tạo/ghi đè sau restart.

Khi một kho có danh sách cho phép, API chỉ cho **điều phối nhập/nhập thực tế** nguyên liệu vào vị trí cho phép vật tư đó, đồng thời giữ kiểm kho, QC, điều kiện DRY và sức chứa. Vị trí cũ không có mapping nên không tiếp nhận mới vào kho này. Xuất tồn cũ, kiểm kê, xử lý các vị trí cũ vẫn hoạt động; các kho chưa cấu hình mapping giữ quy tắc cũ. Đơn vị KG là đơn vị sức chứa quy đổi theo hệ số hàng, không bắt buộc mọi vật tư dùng kg làm đơn vị đếm.

Hiện còn 20 dòng tồn đạt chất lượng tại VT_NVL_KHOITAO; không có phiếu nhập nguyên liệu chưa hoàn tất và không có khóa kiểm kê tại thời điểm khảo sát. Không tự chuyển tồn hoặc xóa vị trí cũ. Hệ thống chưa có quy trình chuyển vị trí được xác minh; cần thiết kế chứng từ/transaction và xác nhận riêng nếu người dùng yêu cầu chuyển sau.

Không sửa migrations APPLIED, không seed pallet, không đụng HTTT02, không drop/commit/reset/test nghiệp vụ.

Người dùng đã duyệt trực tiếp migration và seed trong chat. Giao diện nhập chọn vị trí theo itemId từ dòng QC; khi kho có mapping thì chỉ gợi ý vị trí cho phép, backend vẫn kiểm độc lập khi lập, xác nhận và ghi sổ nhập. Các lô/vị trí cũ vẫn xem và xuất được; không tự thay tồn.

Đã áp dụng migration `202610280003_material_location_rules` trên warehouse_db/warehouse_test Docker, pending rỗng; giữ file migration bất biến. Seed warehouse_db tạo các vị trí id 8–13 và đúng 24 liên kết; chạy lại trả ALREADY_CONFIGURED/noOverwrite/noRegrant. Đọc lookup quản lý xác nhận số nguyên liệu A=3, B=5, C=10, D=4, E=1, F=1; các kho thành phẩm/hàng lỗi không bật mapping. 20 dòng tồn vẫn ở VT_NVL_KHOITAO. Kiểm cú pháp 65 file frontend, backend, OpenAPI và build; không chạy unit/integration/E2E/regression hay tạo phiếu thử. DA_CODE_CHUA_TEST.

Người dùng yêu cầu xóa ba vị trí cũ: đã xóa an toàn hai vị trí NL_A/NL_B không có FK/tồn; VT_NVL_KHOITAO còn 20 dòng tồn và lịch sử kiểm kê nên được giữ. Trang Vị trí lưu kho hiển thị A–F trực tiếp và thông báo vị trí cũ còn tồn. Xem [phương án xử lý phần còn lại](legacy_location_retirement.md).
