# Nhập kho thành phẩm không demo được — 03/11/2026

Phát hiện khi khảo sát demo5chức năng (báo cáo, nhập kho NL/TP, quản lý lô NL/TP, xuất kho NL): không tài khoản QC nào xem được phiếu yêu cầu nhập TP đang chờ QC, nên không thể hoàn thành luồng QC thành phẩm → nhập kho TP qua UI/API.

**Đính chính so với chẩn đoán ban đầu:** lúc đầu tưởng là lỗi code ở `source-repository.js` (lookup scope theo xưởng thay vì kho, không nhất quán với `materialDeliveries`/`returnReceptions`). Đọc kỹ `qc/repository.js` và `qc/service.js` mới thấy `productQc` được khai báo `scope:'workshop'` **có chủ đích** (QC thành phẩm diễn ra tại xưởng, trước khi hàng được gán kho; bảng `PhieuNhapKhoThanhPham` không có cột `warehouse_id`). `qc/service.js:sourceScope()` áp đúng cùng quy tắc ở chính luồng tạo/xác nhận QC, không chỉ ở lookup. Vậy đây không phải lỗi code, mà là **thiếu dữ liệu scope**: chưa tài khoản QC demo nào (`qc01`, `uc01.qc`) được cấp `TaiKhoan_Xuong`.

Thử tiếp mới phát hiện điểm chặn thứ hai: `receipts.confirmAllocation` cho phiếu nhập TP báo `CAPACITY_FACTOR_REQUIRED` vì bảng `HeSoChiemCho` (hệ số quy đổi sang đơn vị sức chứa kho) chưa từng có dòng nào cho thành phẩm — chỉ nguyên liệu được cấu hình hệ số khi lập vị trí kho (migration `202610280003_material_location_rules`). Đây là khoảng trống dữ liệu từ trước, không liên quan QC.

## Đã sửa

Không sửa code nghiệp vụ, không schema/migration. Bổ sung đúng dữ liệu còn thiếu bằng 2 script một lần (transaction, guard `sqlserver-demo-guard`, audit, chống chạy lại ghi đè — cùng khuôn mẫu các script seed hiện có):

- `backend/scripts/grant-qc-workshop-scope.js`: cấp `TaiKhoan_Xuong` cho `qc01` tại 3 xưởng đang hoạt động (XSX002/003/004). Kiểm tra role có đúng quyền `productQc.write`, chặn chạy lại qua `AuditLog action='qc.workshopScope.granted'`, chặn ghi đè nếu tài khoản đã có scope xưởng từ trước.
- `backend/scripts/seed-product-capacity-factors.js`: thêm `HeSoChiemCho` cho 15 SKU TP001–TP015, hệ số ước lượng `= thể tích(L) × 1.05` (dữ liệu đồ án hư cấu, không phải số liệu nhà sản xuất), dùng `capacity_unit_id` thật của kho (KG). Chỉ thêm SKU còn thiếu (`FILL_MISSING_ONLY`), không sửa hệ số đã có.

Cả hai đã chạy một lần trên Docker `warehouse_db` qua `docker compose run --rm migrate node scripts/<tên>.js`, kết quả:
```
{"status":"GRANTED","accountId":"17","login":"qc01","workshopIds":["3","4","5"],"workshopCodes":["XSX002","XSX003","XSX004"]}
{"capacityUnitId":"7","inserted":15,"preserved":0,"products":15,"mode":"FILL_MISSING_ONLY"}
```

## Bằng chứng — chạy lại được toàn luồng qua API thật

Sau khi áp 2 script trên, lặp lại nguyên luồng Nhập kho thành phẩm bằng tài khoản demo thật trên Docker (không phải unit test):

1. `qc01` đăng nhập → `workshopIds:["3","4","5"]` xuất hiện trong session.
2. `GET /lookups/qc-sources` → phiếu `YCN-...` (yêu cầu nhập TP) hiện đúng, trước đó không có.
3. `POST /qc/products` + `POST /qc/products/{id}/confirm` → `DA_XAC_NHAN`.
4. `POST /receipts` (kind=FINISHED) → `DA_PHAN_BO`.
5. `POST /receipts/{id}/confirm-allocation` → `DA_XAC_NHAN`, capacity snapshot đúng `100 lon × 0.3465kg = 34.65kg` tại vị trí thành phẩm A.
6. `POST /receipts/{id}/post-product` (nhân viên kho) → `HOAN_THANH`, `onHandChanged:true`.
7. Đối soát tồn: SKU TP001 lô `LO-TP001-01` lên đúng `onHand=100.000000`, `available=100.000000`.

Không migration, không đổi RBAC/scope ngoài 1 tài khoản demo nêu trên, không đổi API/contract. Chỉ xác minh qua gọi API thật trên Docker dev, không chạy bộ test unit/integration/E2E. DA_CODE_CHUA_TEST tiếp tục áp dụng cho toàn hệ thống; đây chỉ là bằng chứng một luồng cụ thể chạy được, không phải nghiệm thu.
