# Cấp workshop scope cho quanlykho01 để lập được phiếu Nhập kho thành phẩm — 04/11/2026

## Phát hiện khi chuẩn bị click-test "Nhập kho thành phẩm"

Dropdown "Kết quả QC đã xác nhận" trên form Nhập kho thành phẩm (role Quản lý kho, quyền `receipts.allocate`) luôn rỗng với mọi dòng QC thành phẩm. Không phải do hết quota demo (khác với lỗi nhập kho nguyên liệu đã sửa trước đó) — lỗi do RBAC/scope.

## Nguyên nhân

`backend/src/modules/qc/repository.js:4`: `productQc` được cấu hình `scope:'workshop'` vì bảng nguồn `PhieuNhapKhoThanhPham` chỉ có `workshop_id`, không có `warehouse_id` để lọc theo kho như nguyên liệu. `backend/src/modules/customers/source-repository.js:qcLines()` dùng đúng cấu hình này để lọc `/lookups/allocation-sources` theo workshop scope của người gọi.

Tra DB: trong 9 role demo, chỉ role "Quản lý kho / Bộ phận quản lý kho" có quyền `receipts.allocate`, và không tài khoản nào của role này (`quanlykho01`) có bất kỳ workshop scope nào (`TaiKhoan_Xuong` trống). Vì vậy không ai có thể lập phiếu Nhập kho thành phẩm qua UI thật kể từ khi hệ thống được tạo — bản ghi nhập kho thành phẩm duy nhất có sẵn trong demo (`qcLineId=1`, đã dùng hết) là do fixture khởi tạo ghi thẳng, không qua kiểm RBAC này.

## Đã làm (được người dùng duyệt trực tiếp: "Cấp workshop scope cho quanlykho01")

Thêm script một lần `backend/scripts/grant-warehouse-manager-workshop-scope.js`, đúng khuôn mẫu đã dùng cho `grant-qc-workshop-scope.js` (03/11/2026, cấp qc01): guard (`warehouse-sqlserver`), transaction, `sp_getapplock`, marker chống cấp lại (`AuditLog action='warehouseManager.workshopScope.granted'`), kiểm vai trò thật có `receipts.allocate` trước khi cấp, kiểm `TaiKhoan_Xuong` rỗng trước khi ghi (không overwrite), audit đầy đủ. Chỉ **thêm 3 dòng** `TaiKhoan_Xuong(account_id=quanlykho01, workshop_id∈{XSX002,XSX003,XSX004})` — không đụng quyền/scope kho/role khác.

Chạy một lần: `docker compose run --rm migrate node scripts/grant-warehouse-manager-workshop-scope.js` →
```
{"status":"GRANTED","accountId":"15","login":"quanlykho01","workshopIds":["3","4","5"],"workshopCodes":["XSX002","XSX003","XSX004"]}
```

Cũng bổ sung script demo data riêng `backend/scripts/seed-product-receipt-demo-batch.js` (cùng khuôn mẫu `seed-material-receipt-demo-batch.js` trước đó) tạo thêm một chuỗi yêu cầu nhập TP + QC thành phẩm hư cấu mới (200 đơn vị, SP `TP001`/lô `LO-TP001-01`) vì chuỗi QC thành phẩm gốc duy nhất đã dùng hết 100%. Marker: `AuditLog action='demo.productReceiptBatch.seed.20261104'`.

## Đã xác minh qua API thật

1. Đăng nhập lại `quanlykho01` → `workshopIds:["3","4","5"]` xuất hiện.
2. `GET /lookups/allocation-sources` → nay có 2 dòng `kind:"FINISHED"` (QC 1 đã hết, QC 2 còn nguyên `acceptedBase:200`).
3. `POST /receipts` chọn QC line 2, lô `LO-TP001-01`, kho "Kho thành phẩm" (id 2), vị trí `VITRi-TP-A`, đơn vị "Lon", số lượng 50 → `201`, phiếu `DA_PHAN_BO` tạo thành công.
4. Hủy ngay phiếu test (`POST /receipts/10011/cancel`) → `status:"HUY"` — quota QC line 2 còn nguyên 200 để người dùng tự demo lại trên UI (quản lý kho lập/xác nhận phân bổ → nhân viên kho `nhanvienkho01` ghi sổ nhập kho).

## Không đổi

Không migration/schema mới (chỉ `INSERT` vào bảng scope đã có và bảng nghiệp vụ đã có). Không revoke/sửa scope kho hoặc quyền nào khác của `quanlykho01`. Không RBAC role mới. Chưa test tay qua trình duyệt thật — cần người dùng tự click lập/xác nhận/ghi sổ để nghiệm thu.
