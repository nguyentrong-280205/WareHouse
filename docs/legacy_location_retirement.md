# Phương án xử lý vị trí nguyên liệu cũ — 28/10/2026

Người dùng yêu cầu xóa ba vị trí nguyên liệu cũ và đưa vị trí mới ra màn hình. Đã xóa `FS_DEMO_20261015_NL_A` và `FS_DEMO_20261015_NL_B` sau khi xác minh không có bất kỳ FK/tồn nào; audit ghi snapshot, script có guard/transaction/marker và bootstrap xóa đúng hai vị trí rỗng trong volume mới. Trang Vị trí lưu kho hiển thị A–F trực tiếp; vị trí cũ còn liên kết lịch sử được khóa sau khi chuyển hết tồn.

`VT_NVL_KHOITAO` có 20 dòng TonKho, một PhamViKiemKe, 40 ChiTietLanDem và 20 ChiTietKiemKe. Các dòng đó còn liên kết sổ tồn/kiểm kê và phải bất biến. Xóa vật lý vị trí sẽ phá khóa ngoại hoặc buộc xóa/sửa lịch sử; điều đó không thực hiện. Ngưng sử dụng (LOCKED) sau khi đã chuyển hết tồn sẽ loại vị trí khỏi lựa chọn tác nghiệp, còn giữ bản ghi để truy vết.

## Đề xuất chuyển tồn để ngưng sử dụng vị trí cũ

Đọc tại thời điểm 28/10: 20 dòng DAT, không có lượng reserved/khóa kiểm kê; đối chiếu mapping hiện tại và hệ số sức chứa snapshot:

| Đích | Số dòng | Sức chứa dự kiến tăng (kg quy đổi) | Giới hạn vị trí |
|---|---:|---:|---:|
| VITRi-A | 3 | 540 | 2.000 |
| VITRi-B | 5 | 100 | 1.000 |
| VITRi-C | 8 | 296 | 2.000 |
| VITRi-D | 2 | 52 | 1.500 |
| VITRi-E | 1 | 1.000 | 3.000 |
| VITRi-F | 1 | 100 | 500 |

Tổng 2.088 kg quy đổi, giữ nguyên số lượng, lô, chất lượng và hệ số snapshot; đây là ảnh chụp chỉ để duyệt, phải đọc lại và dừng nếu tồn, mapping, sức chứa, giữ tồn, vị trí hoặc khóa thay đổi. Không xóa các dòng TonKho cũ (kể cả sau khi về 0), sổ, kiểm kê, chứng từ hoặc AuditLog.

Hệ thống hiện không có chứng từ chuyển vị trí và StockPosting yêu cầu đúng một trong các nguồn sẵn có. Đề xuất thêm migration mới cho chứng từ chuyển vị trí và các dòng liên kết source balance/đích/lô/lượng, thêm transfer_id FK vào StockPosting và cập nhật CHECK đúng một nguồn; không sửa SQL migration đã APPLIED. Mỗi giao dịch khóa kho, vị trí, số dư và phân bổ theo thứ tự ổn định; kiểm trạng thái, mapping, chất lượng, capacity, không reservation/khóa kiểm kê, tạo chứng từ và StockPosting với hai bút toán âm/dương cho mỗi dòng, cập nhật đồng thời trong một transaction; audit, idempotency và optimistic version. Tổng lô và tổng kho trước/sau phải bằng nhau. Nếu bất kỳ kiểm tra thất bại thì rollback toàn bộ và giữ nguyên vị trí cũ. Khi hoàn tất xác nhận source tồn/reserved=0 mới LOCKED vị trí, bảo toàn history.

Người dùng đã duyệt migration, kiểm thử tập trung và chuyển tồn. Migration `202610280004_location_transfer` đã áp dụng trên warehouse_test và warehouse_db Docker. Kiểm thử tập trung trên warehouse_test đã đạt: rollback khi vượt sức chứa, từ chối snapshot sai, bảo toàn hai bút toán, khóa đồng thời và rollback toàn bộ fixture. Giao dịch chuyển thực tế đã hoàn tất 20 dòng, tạo chứng từ chuyển và sổ biến động, khóa vị trí cũ. Lịch sử kiểm kê vẫn được giữ; HTTT02 và MySQL volume không thay đổi. Trên volume Docker mới, bootstrap thực hiện cùng thao tác một lần đối với dữ liệu mẫu sau các kiểm tra an toàn; volume cũ không tự chuyển lại.
