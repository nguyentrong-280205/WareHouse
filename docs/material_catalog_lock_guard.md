**Đã mở rộng sửa mã 16/11/2026:** khoảng trống updateLocation nêu trong hồ sơ bên dưới đã được xử lý: chỉ sửa kho/vị trí ACTIVE, khóa/mở khóa riêng, không mở lại vị trí đã ngưng sử dụng sau chuyển tồn; giữ khóa kiểm kê/version/audit. Chưa chạy test nghiệp vụ. [Chi tiết](system_fixes_20261116.md).

# Khóa danh mục (NVL/TP/Kho/Lô) không chặn sửa — 03/11/2026

Phát hiện khi kiểm tra kỹ nghiệp vụ/bảo mật UC10 (Quản lý nguyên liệu) và UC30 (Quản lý lô nguyên liệu) đối chiếu `docs/Đặc tả UseCase Hệ thống kho Final.docx`, demo trực tiếp qua API thật trên Docker (không phải suy luận từ đọc code).

## Lỗi

`warehouse/service.js:mutate()` xử lý chung action `update` cho 6 kind (`materials`, `products`, `warehouses`, `materialLots`, `productLots`) nhưng không kiểm `before.status==='ACTIVE'` trước khi cho sửa field. Vì `status` cũng là một field thường trong `entity.fields` (gán tự động ở `repository.js:33`), action `update` còn vô tình cho phép tự đổi `status` qua lại ACTIVE↔LOCKED trong cùng request sửa field.

Bằng chứng tái hiện: khóa `NVL001` (`POST /materials/5/lock`) → thành công, `status=LOCKED`. Ngay sau đó `PUT /materials/5` với `{name:'...', status:'ACTIVE'}` vẫn trả 200: tên bị đổi trong khi đang khóa, và bản ghi tự mở khóa — vô hiệu hóa hoàn toàn ý nghĩa "đã khóa" của UC10/UC30 (không xóa cứng, không sửa sau khi khóa).

## Đã sửa

Không đổi schema/migration. Thay trong `backend/src/modules/warehouse/service.js`:

- Thêm action `unlock` song song với `lock` (cùng khuôn mẫu: `expectState` + đổi `status`/`version` trong transaction, audit `<kind>.unlock`).
- Action `lock` yêu cầu `expectState(before,['ACTIVE'])`; action `update` yêu cầu `expectState(before,['ACTIVE'])` trước khi cho sửa field — bản ghi `LOCKED` không còn tự sửa hoặc tự mở khóa qua `update` được nữa.
- Loại field `status` khỏi tập field được ghi trong action `update` — đổi trạng thái chỉ còn qua `lock`/`unlock`, không lẫn vào sửa field thường.

Nối dây: `warehouse/controller.js` đăng ký thêm action `unlock`; `docs/api_contract.yaml` thêm 5 operation `<kind>.unlock` (`POST /materials|products|warehouses|material-lots|product-lots/{id}/unlock`), copy nguyên khuôn `x-permissions`/response/`CommandInput` của `lock` tương ứng — không tạo quyền mới, dùng chung `<kind>.write`.

Frontend `ResourcePage.jsx`: nút "Sửa" ẩn khi `status==='LOCKED'`; thêm nút "Mở khóa" cạnh nút "Khóa"; bỏ dropdown trạng thái trong form Sửa (không còn tác dụng vì backend không còn nhận `status` qua `update`).

## Phạm vi không đổi

- Không đụng `warehouses/{id}/locations` (`updateLocation()` là hàm riêng, không đi qua `mutate()`); đây có cùng dạng thiếu kiểm trạng thái nhưng **chưa được duyệt sửa trong lần này**, ghi nhận là khoảng trống còn lại.
- Không đổi RBAC/permission, không migration, không seed/test nghiệp vụ.
- Đã kiểm cú pháp (`node -c` hai file backend, cân bằng dấu `{}` cho JSX, `JSON.parse` lại `docs/api_contract.yaml`), rebuild `docker compose build backend` + recreate container, rồi gọi API thật trên Docker bằng `quanlykho01` (role Quản lý kho) trên `NVL020` (id 24):
  1. `POST /materials/24/lock` → `200 LOCKED`.
  2. `PUT /materials/24` đổi tên + `status:'ACTIVE'` trong khi đang `LOCKED` → `409 INVALID_STATE`, tên và trạng thái giữ nguyên (trước đây lọt qua, tự đổi tên và tự mở khóa).
  3. `POST /materials/24/unlock` → `200 ACTIVE`.
  4. `POST /materials/24/unlock` lần nữa khi đã `ACTIVE` → `409 INVALID_STATE` (không mở khóa hai lần).
  5. `PUT /materials/24` sau khi mở khóa, gửi kèm `status:'LOCKED'` → `200`, đổi tên thành công nhưng `status` vẫn `ACTIVE` (xác nhận trạng thái chỉ còn đổi qua lock/unlock, không lẫn vào sửa field).
  6. Phục hồi lại tên gốc `CO2 thực phẩm` bằng `PUT /materials/24`.
  Tác dụng phụ duy nhất còn lại: `version` tăng từ 0 lên 4 do 4 lần ghi thật (bản chất của mọi update/lock/unlock), không có thay đổi dữ liệu nghiệp vụ nào khác. Chưa rebuild/kiểm lại frontend (nút Sửa/Mở khóa) qua UI thật, chỉ xác nhận qua API; DA_CODE_CHUA_TEST tiếp tục áp dụng cho toàn hệ thống.
