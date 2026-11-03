# Khóa đơn vị nhập cho dòng nguyên liệu trong phiếu nhập kho — 04/11/2026

Phát hiện khi click-test demo "Nhập kho nguyên liệu": lập phiếu cho `NVL003 — Nắp lon` (đơn vị cơ sở đã cấu hình là **Cái**), chọn nhầm "Đơn vị nhập" = **Lon** → lưu bị từ chối `422 UNIT_MISMATCH — Nguyên liệu dùng đơn vị cơ sở đã cấu hình.`

## Không phải lỗi backend

`backend/src/modules/inventory/stock-service.js:unitQuantity()` chặn đúng: dòng tồn kho nguyên liệu **bắt buộc** dùng đúng `base_unit_id` đã cấu hình, không chấp nhận đơn vị khác hay đơn vị đóng gói (`packagingId` phải rỗng). Đây là quy tắc nghiệp vụ đúng, giữ nguyên.

## Nguyên nhân thật: frontend chưa khóa field

`frontend/src/features/ResourcePage.jsx`: khi chọn "Kết quả QC đã xác nhận" (`qcLineId`), form đã **tự điền đúng** `unitId` từ `allocation-sources` (dòng RECEIPT đã có sẵn `unitId = item.base_unit_id` từ `source-service.js:26`) — cơ chế `set()` tại dòng ~92 đã làm đúng. Nhưng ô "Đơn vị nhập" vẫn là `<select>` **chỉnh được tự do**, nên dễ bị sửa đè sang giá trị sai sau khi tự điền — đúng lỗi mà luồng "Xuất kho nguyên liệu" đã khóa thành chỉ đọc ngày 28/10/2026 (`docs/unified_material_issue.md`), nhưng chưa áp dụng cho "Nhập kho".

## Đã sửa

Chỉ frontend, không đổi API/backend/schema. Thêm điều kiện `materialReceiptUnitLocked` (field `unitId`, có field `qcLineId` kiểu `receipt-qc` cùng mảng, và `kind==='MATERIAL'` hoặc `kind==='REJECTED'&&sourceQcType==='MATERIAL'`) để **disable** dropdown đơn vị nhập cho đúng các dòng nguyên liệu, kèm ghi chú "Đơn vị cơ sở cố định của nguyên liệu, tự điền theo dòng QC đã chọn." Dòng thành phẩm (FINISHED/RETURN, hoặc REJECTED nguồn PRODUCT/RETURN) **không đổi** — vẫn chỉnh được vì thành phẩm hợp lệ nhiều đơn vị đóng gói (Lon/Thùng/Pallet...).

Đã rebuild + deploy lại `frontend` Docker, build Vite không lỗi.

## Không đổi

Không migration/schema/API/RBAC. Chưa tự click lại qua trình duyệt thật sau fix — cần người dùng xác nhận ô "Đơn vị nhập" hiện khóa đúng khi chọn dòng QC nguyên liệu, và lưu phiếu thành công với đơn vị đúng (Cái) thay vì Lon.
