# Hiển thị tên cụ thể mặt hàng chưa cấu hình ngưỡng cảnh báo — 04/11/2026 (ĐÃ HOÀN TÁC)

**Hoàn tác 04/11/2026**: user xem demo thật, liệt kê tên cụ thể (20 mặt hàng khi lọc "Tất cả kho") chiếm quá nhiều chỗ, đẩy bảng kết quả xuống dưới — yêu cầu bỏ. Đã revert `DataPage.jsx` về đúng bản gốc (chỉ hiện số lượng, không liệt kê tên), rebuild + deploy lại frontend. Giữ lại phần mô tả bên dưới làm lịch sử; không áp dụng nữa.

Phát hiện khi demo tab "Cảnh báo" trong `/reports`: banner vàng chỉ hiện **số lượng** mặt hàng/kho chưa cấu hình ngưỡng ("Có 21 mặt hàng/kho chưa được cấu hình..."), không hiện **tên cụ thể** mặt hàng nào — dù backend (`reports/service.js:alerts()`) đã trả đủ `configurationRequired:[{warehouseId,itemKind,itemId}]`. Đây không phải lỗi nghiệp vụ (bảng cảnh báo trống là đúng vì chưa có ngưỡng nào được cấu hình, không có ngưỡng mặc định), chỉ là UI bỏ qua dữ liệu đã có sẵn, gây khó hiểu khi demo.

Đã xác minh qua API thật: toàn hệ thống demo ban đầu có 0 ngưỡng cấu hình (21 mặt hàng/kho — 19 nguyên liệu tại Kho nguyên liệu + 1 sản phẩm tại Kho thành phẩm + 1 tại kho khác — chưa cấu hình), nên tab Cảnh báo trống đúng theo thiết kế. Sau khi tạo 1 ngưỡng demo cho `NVL020` tại Kho nguyên liệu (`lowStockBase` cao hơn tồn hiện có, `nearExpiryDays=400`), `/reports/alerts` trả đúng 2 dòng (`LOW_STOCK` + `NEAR_EXPIRY`) cho đúng mặt hàng đó, và số còn thiếu giảm từ 21 xuống 19 — khớp dữ liệu thật trên Docker.

## Đã sửa

Chỉ frontend, không đổi API/backend/schema. `frontend/src/features/DataPage.jsx`: banner thiếu cấu hình nay liệt kê từng dòng "Tên kho — Tên mặt hàng" bằng cách tái dùng `resolve()` của `useReferenceNames()` (đã có sẵn, dùng chung các cột khác trong bảng), thay vì chỉ đếm `missing.length`.

```diff
- {missing.length>0&&<p ...>Có {missing.length} mặt hàng/kho chưa được cấu hình ngưỡng cảnh báo...</p>}
+ {missing.length>0&&<div ...><p>Có {missing.length} mặt hàng/kho chưa được cấu hình ngưỡng cảnh báo...</p>
+   <ul>{missing.map((m,i)=><li key={i}>{resolve('warehouseId',m.warehouseId,m)} — {resolve('itemId',m.itemId,m)}</li>)}</ul></div>}
```

Đã rebuild `frontend` Docker image và deploy lại; build Vite không lỗi. Chưa tự click lại qua trình duyệt thật — cần người dùng xác nhận hiển thị đúng tên tại `/reports` tab "Cảnh báo".

## Không đổi

Không migration/schema/API. Hành vi nghiệp vụ (chỉ sinh cảnh báo cho mặt hàng đã có ngưỡng, không có ngưỡng mặc định) giữ nguyên như thiết kế ban đầu.
