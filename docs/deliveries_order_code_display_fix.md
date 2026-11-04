# Thiếu mã đơn hàng trên danh sách Giao hàng thành công — 04/11/2026

## Phát hiện khi click-test "Xuất thành phẩm giao hàng" + "Giao hàng thành công"

Sau khi xác nhận giao hàng thành công qua UI, trang `/deliveries` hiện cột **"Đơn hàng"** luôn là **"Chưa có thông tin"** dù dữ liệu đã lưu đúng (verify qua DB: `ChiTietGiaoHang.qty_delivered = 100/100`).

## Nguyên nhân

`backend/src/modules/returns/service.js:result()` (dùng chung cho `deliveries`/`returnRequests`/`returnReceptions`) chỉ trả `orderId` (số), không trả kèm `orderCode`. Frontend `frontend/src/features/referenceNames.js:resolve()` với mọi field kết thúc bằng `Id` không có case riêng sẽ tìm sibling field `<key>Code` trên cùng row (dòng 40: `row[key.replace(/Id$/,'Code')]`); do `orderId` không có case riêng (khác `warehouseId`/`materialId`/... đã có) và không có `orderCode` nên luôn rơi về fallback "Chưa có thông tin" — xảy ra với **mọi** bản ghi giao hàng, không riêng bản ghi vừa tạo.

## Đã sửa

Chỉ backend, thêm 1 dòng: `result()` trong `backend/src/modules/returns/service.js` truy vấn thêm `DonHang.code` theo `order_id` đã có sẵn (không quyền/scope mới, record đã qua `visible()` kiểm scope) và trả kèm `orderCode` trong response của cả `deliveries`, `returnRequests` nếu có `orderId`. Không đổi DTO cho `returnReceptions` (không có order_id).

Đã rebuild + deploy lại `backend` Docker.

## Đã xác minh qua API thật

`GET /deliveries` (nhanvienkho01) → `orderCode:"DH-8c2be80a-9417-4857-922d-fc1c6abf67da"` xuất hiện đúng, kèm `quantityDeliveredBase:"100.000000"` khớp `quantityDispatchedBase:"100.000000"`.

## Không đổi

Không migration/schema/RBAC. Không đụng logic xác nhận giao hàng hay bất kỳ trường khác.
