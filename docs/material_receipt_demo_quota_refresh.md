# Bổ sung lô QC nguyên liệu demo còn quota — 04/11/2026

Sau khi sửa lỗi khóa đơn vị nhập ([docs/material_receipt_unit_lock.md](material_receipt_unit_lock.md)), click-test tiếp "Nhập kho nguyên liệu" vẫn bị chặn: `409 QC_RECEIPT_QUOTA — Lượng nhập/đang phân bổ vượt phần lượng QC tương ứng.`

## Không phải lỗi code

Tra DB: toàn bộ demo chỉ có **1 đơn mua nguyên liệu** (`PO-a17eb0ff-...`, đã `HOAN_THANH`), **1 lô giao hàng** (`GN-4ae44167-...`) và **2 kết quả QC nguyên liệu** (QC line 1 — Vỏ lon 330ml, QC line 2 — Nắp lon), cả hai đều đã được **nhập kho đủ 100%** từ một phiếu trước đó (`PN-3164c41c-...`, `HOAN_THANH`). `backend/src/modules/inventory/service.js:validateQuota()` chặn đúng vì không còn lượng QC nào dư để nhập thêm — không phải bug.

## Đã làm

Không có PO/giao hàng/QC nào còn dư để demo tiếp, và tạo mới đúng luồng nghiệp vụ thật (PO → duyệt → giao hàng → QC) đòi hỏi nhiều bước ngoài phạm vi "sửa lỗi demo". Theo đúng khuôn mẫu đã dùng cho 2 lần bổ sung dữ liệu demo trước (`grant-qc-workshop-scope.js`, `seed-product-capacity-factors.js`), thêm script một lần `backend/scripts/seed-material-receipt-demo-batch.js`: guard (`warehouse-sqlserver`/`development`), transaction, marker chống chạy lại (`AuditLog action='demo.materialReceiptBatch.seed.20261104'`), audit đầy đủ. Script chèn trực tiếp một chuỗi PO/giao hàng/QC **mới, hư cấu, đã ở trạng thái hoàn tất** (không qua luồng duyệt thật, không giả lập nghiệp vụ mua hàng) cho đúng nguyên liệu/lô/đơn vị đã có sẵn (`NVL003 — Nắp lon`, lô `LO-NAP-LON-01`, đơn vị `Cái`), với lượng đạt QC = 5.000 (đồ án hư cấu).

Chạy một lần trên Docker `warehouse_db` qua `docker compose run --rm migrate node scripts/seed-material-receipt-demo-batch.js`, kết quả:
```
{"status":"SEEDED","poId":"2","deliveryId":"2","qcHeaderId":"2","qcLineId":"10002","materialLotId":"3","qtyBase":"5000.000000"}
```

## Đã xác minh qua API thật

1. `GET /lookups/allocation-sources` (quanlykho01) → xuất hiện `QC 10002 / lô LO-NAP-LON-01`, đạt `5000.000000`.
2. `POST /receipts` chọn đúng QC line mới, lô 3, vị trí "Bao bì chai và lon", đơn vị "Cái", số lượng 300 → `201`, phiếu `DA_PHAN_BO` tạo thành công (tái hiện đúng thao tác người dùng vừa làm trên UI, lần này qua được).
3. Hủy ngay phiếu test vừa tạo (`POST /receipts/{id}/cancel`) để không để lại rác demo — `qcLineId 10002` vẫn còn nguyên 5.000 lượng dư (hủy không tính vào quota đã dùng) để người dùng tự demo lại trên UI.

## Không đổi

Không migration/schema mới (chỉ ghi dữ liệu vào bảng đã có). Không động tới PO/QC/giao hàng cũ (`id 1`). Không RBAC/scope mới. docs/material_receipt_unit_lock.md là lỗi UI đã sửa trước đó; đây là lỗi hết dữ liệu demo, xử lý riêng.
