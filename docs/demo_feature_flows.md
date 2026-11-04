# Flow 6 chức năng demo — 04/11/2026

Tóm tắt trình tự thao tác thực tế đã click-test thành công qua UI thật. Tài khoản/mật khẩu xem `docs/warehouse_accounts.md`. Route gốc: `http://localhost:8080`.

## 1. Xem báo cáo

```
Đăng nhập (quanlykho01/qc01/giamdoc01...) -> /reports -> chọn tab (Tổng hợp tồn, Nhập/xuất/điều chỉnh, Hạn sử dụng, Hàng lỗi, Chênh lệch kiểm kê, Cảnh báo)
```

Tab "Cảnh báo" chỉ hiện cảnh báo cho mặt hàng/kho đã cấu hình ngưỡng tại **Cấu hình cảnh báo**; không có ngưỡng mặc định — bảng trống là đúng thiết kế, không phải lỗi.

## 2. Nhập kho nguyên liệu

```
quanlykho01 -> /materials (Nhập kho nguyên liệu) -> Thêm mới
  -> chọn dòng "Kết quả QC đã xác nhận" (nguồn MATERIAL) -> lô/vị trí/đơn vị tự điền (khóa, không sửa) -> nhập số lượng
  -> Lưu (trạng thái DA_PHAN_BO)
  -> Xác nhận phân bổ (DA_XAC_NHAN)
-> nhanvienkho01 -> cùng danh sách -> Ghi sổ nhập kho (HOAN_THANH, cộng tồn)
```

## 3. Nhập kho thành phẩm

```
quanlykho01 (cần có workshop scope khớp xưởng sản xuất lô, do PhieuNhapKhoThanhPham chỉ lọc theo workshop_id)
  -> /warehouse (Nhập kho thành phẩm) -> Thêm mới
  -> chọn kho nhận -> chọn dòng "Kết quả QC đã xác nhận" (nguồn PRODUCT) -> vị trí/đơn vị/số lượng
  -> Lưu (DA_PHAN_BO) -> Xác nhận phân bổ (DA_XAC_NHAN)
-> nhanvienkho01 -> Ghi sổ nhập kho (HOAN_THANH, cộng tồn)
```

## 4. Quản lý lô nguyên liệu / lô thành phẩm

```
quanlykho01 hoặc nhanvienkho01 -> /lots?type=material (hoặc ?type=product)
  -> chọn lô ACTIVE -> Khóa (LOCKED, ẩn nút Sửa)
  -> Mở khóa (ACTIVE trở lại, hiện nút Sửa)
```

Khi LOCKED: không sửa được field nào của lô cho đến khi Mở khóa.

## 5. Xuất kho nguyên liệu (chuỗi đầy đủ, nhiều vai trò)

```
[Điều kiện] Nếu KHSX còn vật tư thiếu (shortage) chưa có PO duyệt đủ -> xưởng KHÔNG lập được yêu cầu cấp nguyên liệu (cổng material-release-gate chặn)

muahang01 -> /purchasing (Đơn mua nguyên liệu) -> Thêm mới
  -> chọn "Yêu cầu nguyên vật liệu" (hoặc nút "Lập đơn mua phần còn thiếu" trên banner gợi ý)
  -> chọn đúng cặp Nhu cầu định mức <-> Nguyên liệu (không chọn nhầm vật tư tên giống nhau), nhập đơn giá
  -> Lưu -> Gửi duyệt (CHO_DUYET)
-> giamdoc01 -> cùng danh sách -> Phê duyệt (DA_DUYET; tự động phân bổ mua cho đúng nhu cầu)

-> xuong01 -> /production (Yêu cầu cấp nguyên liệu) -> Thêm mới
  -> chọn kế hoạch (chỉ hiện KHSX đã đủ điều kiện cấp nguyên liệu) -> số lượng cố định theo kế hoạch (không sửa/thêm/xóa)
  -> Lưu -> Gửi yêu cầu (DA_GUI)

-> quanlykho01 -> /materials/issues (Xuất kho nguyên liệu) -> Thêm mới
  -> chọn "Phiếu xưởng đã gửi" -> chọn kho xuất -> chọn một/nhiều nhân viên thực hiện
  -> với mỗi dòng vật tư: chọn lô/vị trí theo gợi ý FEFO, nhập số lượng
    (dòng nào chưa đủ tồn thật trong kho — vì PO mới duyệt, chưa thực nhập — có thể Xóa dòng, xuất từng phần)
  -> Lập và gửi phiếu (DA_XAC_NHAN, giữ tồn — "Chờ nhân viên tiếp nhận")

-> nhân viên được giao (nguyentrong/vuthinh/truongthinh/nhanvienkho01) -> cùng danh sách
  -> Tiếp nhận phiếu (HOAN_THANH nếu đủ dòng, DANG_CAP nếu còn dòng chưa xuất — trừ tồn kho thật)
```

Lưu ý: phiếu yêu cầu gốc của xưởng chỉ chuyển "Hoàn thành" khi toàn bộ dòng đã được xuất đủ qua một hoặc nhiều phiếu xuất kho nguyên liệu.

## 6. Xuất kho thành phẩm giao hàng (bán hàng)

```
quanlykho01 -> /finished-goods/issues (Xuất thành phẩm giao hàng) -> Thêm mới
  -> chọn kho xuất -> chọn Đơn hàng (đã XAC_NHAN)
  -> dòng phân bổ: chọn lô/vị trí theo gợi ý FEFO, số lượng khớp đơn hàng
  -> Lưu (DA_PHAN_BO) -> Xác nhận và giữ tồn (DA_XAC_NHAN, giữ tồn theo FEFO)
-> nhanvienkho01 -> cùng danh sách -> Ghi sổ xuất kho (HOAN_THANH, trừ tồn thật)
-> nhanvienkho01 -> /deliveries (Giao hàng thành công) -> tìm bản ghi vừa phát sinh
  -> Xác nhận lượng đã giao -> chọn thời điểm giao THỰC TẾ sau thời điểm ghi sổ xuất kho (không được trước)
  -> nhập "Lượng giao thành công lần này" cho từng dòng -> Lưu
```

Lưu ý: ô "Thời điểm giao thực tế" mặc định có thể bị làm tròn mất phần giây và rơi trước thời điểm ghi sổ xuất kho — nếu báo lỗi "Thời điểm giao phải sau khi xuất kho", chỉnh lùi thêm 1 phút rồi lưu lại. Có thể xác nhận giao nhiều đợt (giao một phần) cho cùng một bản ghi.
