<!-- WAREHOUSE_PORTABLE_20261023 -->
## Docker warehouse hiện hành — 23/10/2026

Người dùng đã giao thêm SQL Server container và đổi project Docker thành **warehouse**. Compose mặc định tại root chạy SQL Server2022Developer riêng (SSMS: localhost,14330), db-init/migrate/Express/frontend; app http://localhost:8080, backend3001. Lần đầu chạy `node scripts/setup-docker.js` rồi `docker compose up -d --build`; những lần sau `docker compose up -d`. `scripts/start-docker.ps1` nay dùng bản portable, không phụ thuộc SQL Server Windows/dynamic port. [Hướng dẫn hiện hành](docker_warehouse.md).

Giữ nguyên HTTT02/Windows .env/data và các MySQL/Prisma archives. Chế độ Windows chuyển sang `infra/compose.windows.yaml`/`scripts/start-docker-windows.ps1` (project warehouse-windows); hướng dẫn cũ bên dưới về start-docker dò Windows port là lịch sử đã được thay thế cho chế độ mặc định. Không đồng bộ/copy dữ liệu giữa SQL Server Docker và HTTT02; cả hai có thể mở cùng SSMS. Volumes mới warehouse_sqlserver_data/warehouse_demo_artifacts/warehouse_uploads riêng; credentials riêng local ignored, backend không dùng sa. Seed fixture19accounts trong Docker, không import dữ liệu cũ; seed một lần, không overwrite. Schema76bảng/237FK/native checksum và 29UC giữ nguyên, DA_CODE_CHUA_TEST; chỉ kiểm cú pháp/config/bootstrap/migration/health, không unit/integration/E2E/regression. Không commit/reset/drop/delete volume. Nhóm warehouse-foundation cũ giữ ở trạng thái dừng, không tự xóa.

---

<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

# Bàn giao mã nguồn 29 UC — 16/10/2026

Bổ sung theo lệnh mới cùng ngày: đã thêm9account demo dễ nhớ theo9role, giữ10account cũ; [danh sách đăng nhập](../data.md). Có kiemke01 để đếm độc lập với uc01.council, tổng19accounts/9roles/1KH. Ngoại lệ mật khẩu ngắn chỉ allowlist LOCAL_SIMPLE_* trong môi trường local/flag được bật; tài khoản khác giữ12–128. Các ghi chỉ10account/mộtHộiđồng trong bàn giao ban đầu bên dưới là lịch sử trước lần bổ sung được yêu cầu này.

**TOÀN BỘ HỆ THỐNG CHƯA ĐƯỢC KIỂM THỬ VÀ CHƯA ĐƯỢC NGHIỆM THU.**

Trạng thái mã nguồn: **29 UC DA_CODE_CHUA_TEST**, không có UC28; chưa UC nào được đóng HOAN_THANH trong đợt này. Đây là bàn giao implementation để người dùng kiểm thử, không phải chứng nhận nghiệp vụ hoạt động đúng. Giới hạn của bộ dữ liệu demo được ghi riêng bên dưới.

## Những gì đã tạo và triển khai

- React/JavaScript/Vite/Tailwind, giữ AppLayout/sidebar/header/phong cách bảng, form và modal; các trang nghiệp vụ dùng API MySQL thật. Home/Dashboard lấy dữ liệu theo quyền, không dùng số liệu mock để kết luận tồn/cảnh báo.
- Express/CommonJS/mysql2: authentication, danh mục/kho/lô, đơn hàng, KHSX/BOM/lịch xưởng, mua hàng, ba loại QC, điều phối, nhập/xuất, reservation, giao/nhận/trả, hàng chưa định danh, xử lý lỗi/tái xử lý, kiểm kê/điều chỉnh, báo cáo/cảnh báo và bằng chứng.
- 151 handler nghiệp vụ được bind; auth có 3 operation riêng. [Danh mục API/bảng/file](full_system_manifest.md) được xuất từ nguồn hiện có; [OpenAPI runtime](runtime_api.json) là tài liệu health/auth/business đã bind, [contract](api_contract.yaml) chứa schema đầu vào/đầu ra và quyền.
- Bảy SQL migration `202610150001_catalogs` đến `202610150007_demand_forecast` đã APPLIED trên cả warehouse_db và warehouse_test. Hai migration legacy giữ BASELINED_LEGACY, không sửa checksum/history/archive Prisma. Từ thời điểm apply, bảy file mới cũng phải bất biến; sửa schema tiếp theo phải thêm migration version mới.
- Seed giả `FS_DEMO_20261015` đã thêm đơn vị, SKU/quy cách/giá, bốn NL bao gói, NCC/xưởng, BOM vật tư bao gói, lịch/quota rõ từng ngày, hệ số KG/M3, 3 kho/5 vị trí và scope tường minh cho bộ tài khoản cũ. Không tạo công thức pha chế, tài khoản mới, tồn đầu hoặc chứng từ nghiệp vụ.
- Docker Compose đã build/khởi động ứng dụng chung; backend/frontend/mysql-dev/mysql-test báo healthy, migrate kết thúc 0. Uploads có bind mount riêng; giữ nguyên `warehouse_mysql_dev_data`, `warehouse_mysql_test_data`.

## Đối chiếu 29 UC và hướng dẫn kiểm tay

Mọi dòng bên dưới đều **DA_CODE_CHUA_TEST**. Tiền tố API là `/api/v1`; các đường dẫn FE dùng chung cho điều phối và ghi sổ nhưng nút thao tác/phân quyền khác nhau. UC13 và UC15 vẫn là hai nghiệp vụ độc lập. Bảng nêu tiêu chí cần người dùng kiểm sau bàn giao, chưa có kết quả PASS.

| UC | Trang FE / vai trò thao tác | API/module và dữ liệu | Thao tác cần kiểm và kết quả mong đợi |
|---|---|---|---|
| UC01 | `/login`, mọi vai trò | `/auth/login`, `/auth/me`, `/auth/logout`; auth | Đúng/sai mật khẩu, tài khoản khóa, session/CSRF; về `/`; menu/route đúng quyền, KH không đọc dữ liệu KH khác. |
| UC02 | `/production-plans`, Planner | `/production-plans`; production, KHSX/BOM/calendar | Chọn đơn đã xác nhận, phân xưởng/lịch/BOM; lưu CHO_DUYET; vượt lượng đơn/năng lực/ngày thiếu cấu hình bị chặn. |
| UC03 | `/production-plans`, BGĐ | `/{id}/decision`; production/demands/forecast | Người khác người lập duyệt hoặc từ chối có lý do; tính nhu cầu theo BOM phiên bản, không cập nhật tồn; xem lượng đã cấp/giữ/tồn dự kiến/thiếu. |
| UC04 | `/finished-goods/qc`, QC | `/qc/products`; QC TP | QC từng lô/nhiều đợt, đạt + lỗi = lượng kiểm; kiểm trùng/vượt nguồn bị chặn, xác nhận QC không ghi tồn. |
| UC05 | `/dashboard`, `/reports`, `/reports/alert-rules`; QLK/BGĐ | `/reports/*`; reports, cấu hình revision | Tồn hiện tại/theo kỳ, nhập xuất, HSD, hàng lỗi, kiểm kê/nguyên nhân/tỷ lệ; lọc kho/ngày, không cộng khác đơn vị. Chưa có ngưỡng hiển thị cần cấu hình. |
| UC06 | `/inventory`, QLK/NV kho | `/inventory`, `/inventory/ledger`; inventory/reports | Tìm mã/tên hàng/lô, lọc kho; xem vị trí/quality/reserved/available và liên kết ID chứng từ trong sổ. Lọc không được hỗ trợ trả 422. |
| UC07 | `/inventory-counts`, QLK chuẩn bị, Hội đồng đếm | `/stocktakes`, cutoff/count/submit/confirm; stocktake | Chốt snapshot khóa hữu hạn, đếm từng cấp bao gói, xác nhận trống mọi vị trí, nộp/xác nhận. Có chênh lệch phải đếm lại bởi người khác; hết lease/hủy mở khóa an toàn. |
| UC08 | Chi tiết kiểm kê, QLK | `/stocktake-variances/{id}/verify`; stocktake/evidence | Chọn vòng đã xác nhận, lý do và bằng chứng; đề nghị điều chỉnh tùy chọn; không có bằng chứng không được xác minh. UNKNOWN không được biến thành tồn định danh. |
| UC09 | Chi tiết kiểm kê, BGĐ | `/adjustments/{id}/decision`; adjustment/ledger | Duyệt độc lập với người đề nghị: tồn + ledger một lần; không giảm dưới reserved. Từ chối giữ nguyên tồn; generation/lease cũ không được ghi sổ. |
| UC10 | `/materials/catalog`, QLK | `/materials`; warehouse | Thêm/sửa/khóa NL, đơn vị và điều kiện bảo quản; không sửa đơn vị đã có tham chiếu. Không xóa cứng. |
| UC11 | `/orders`, KH | `/orders`, `/{id}/submit`; orders/prices | Hai account cùng KH cùng thấy đơn KH; server lấy giá phiên bản và chốt HALF_UP từng dòng; giá tùy ý từ client bị từ chối. |
| UC12 | `/finished-goods/issues`, `/deliveries`; NV kho | `/issues/{id}/post-sale`, `/deliveries/{id}/confirm`; inventory/returns | Ghi phiếu đã điều phối, tiêu thụ hold và giảm tồn cùng transaction. Lượng giao ban đầu 0; xác nhận từng lần <= lượng xuất, chỉ lượng giao thành công được trả. |
| UC13 | Các trang nhập NL/TP/hàng trả, QLK | `/receipts`, confirm/reopen/cancel; inventory | Phân bổ QC/lô/vị trí, kiểm quota/sức chứa/điều kiện/khóa, lưu snapshot khi xác nhận. Không ghi on_hand/ledger, không giữ sức chứa. |
| UC14 | `/returns/requests`, `/returns/receptions`, `/returns/qc`, `/returns/unidentified`; KH/NV/QC/QLK theo thao tác | returnRequests/receptions/returnQc/unknownReturns | Tiếp nhận CONTROLLED → QUARANTINE, QC nhiều đợt theo lượng nhận; không rõ lô ghi sổ cách ly chưa định danh, QLK xác minh nguồn/lô/quota/bằng chứng trước chuyển định danh. |
| UC15 | `/materials/issues`, `/finished-goods/issues`, QLK | `/issues`, confirm/reopen/cancel/renew; inventory/DatGiuTon | Xác nhận FEFO tạo hold 120 phút, chỉ thay reserved/available; gia hạn một lần <=120 phút thêm, hard 240; hủy/hết hạn vô hiệu phân bổ và trả hold. |
| UC16 | `/finished-goods/receipts`, NV kho | `/receipts/{id}/post-product`; inventory | Nhập phiếu đã điều phối, kiểm lại QC/quota/capacity/lot/location, ghi phiếu+tồn+sổ nguyên tử một lần. |
| UC17 | `/returns/receipts`, NV kho | `/receipts/{id}/post-return`; inventory | Chuyển phần QUARANTINE đã QC đạt sang DAT; giảm nguồn cách ly cùng transaction, không cộng vật lý hai lần. |
| UC18 | `/returns/rejected-receipts`, `/returns/dispositions`; QLK/BGĐ/QC | rejected receipt/dispositions/rework batches | Phần lỗi chưa ghi sổ phải nhập FAILED trước. Đề xuất→BGĐ độc lập duyệt→thực hiện: tiêu hủy/trả NCC giảm vật lý, REWORK chuyển cách ly và tạo đợt QC mới quota riêng; QC gốc bất biến. |
| UC19 | `/storage-locations`, QLK | `/warehouses`, `/{id}/locations`, PUT location; warehouse | Thêm/sửa/khóa kho, vị trí/khu vực, sức chứa; không giảm dưới occupied hoặc đổi đơn vị đã dùng. Không sửa vị trí đang kiểm kê; kho mới chỉ cấp scope người tạo. |
| UC20 | `/lots?type=product`, QLK | `/product-lots`; warehouse/packaging | Ghi SKU/lô/NSX/HSD/quy cách; bất biến định danh khi có tham chiếu; chất lượng nằm theo từng balance và HSD, không coi ACTIVE là QC đạt. |
| UC21 | `/materials/receipts`, NV kho | `/receipts/{id}/post-material`; inventory | Nhập đúng phần đạt QC chưa nhập; kiểm lại quota/capacity/storage/lock, lặp cùng key không cộng lần hai. |
| UC22 | `/material-requests`, Xưởng | `/material-requests`; production/request-service | Chọn phân công đã duyệt và demand; lượng tổng yêu cầu không vượt định mức, đúng scope xưởng/đơn vị rời. |
| UC23 | `/materials/issues`, NV kho | `/issues/{id}/post-material`; inventory | Chỉ phiếu xác nhận còn hold hiệu lực/FEFO mới ghi; không cấp vượt lượng nguồn, nguồn cập nhật DANG_CAP/HOAN_THANH theo lượng đã ghi. |
| UC24 | `/product-requests`, Xưởng | `/product-requests`; production/request-service | Chọn KHSX duyệt, lô đúng SKU, lượng hoàn thành nguyên và trong sản lượng; gửi CHO_QC, chưa tăng tồn. |
| UC25 | `/finished-goods/catalog`, QLK | `/products`; warehouse/packaging/prices | SKU chai/lon/dung tích, quy cách chai/lốc/thùng/pallet, thêm phiên bản và giá theo đơn vị; không sửa quy cách cũ đã lưu. |
| UC26 | `/purchases`, Mua hàng | `/purchases`, submit; purchasing | Chọn KHSX/NL thiếu/NCC/giá/đơn vị; trừ nhu cầu đã cấp/hold/tồn dự kiến phân riêng và PO duyệt chưa nhận; PO không là tồn khả dụng. |
| UC27 | `/purchases`, BGĐ | `/purchases/{id}/decision`; purchasing | Duyệt khác người lập hoặc từ chối có lý do; khóa nhu cầu khi kiểm lại lượng mua, không duyệt hồ sơ sai trạng thái. |
| UC29 | `/material-deliveries`, `/materials/qc`; NV kho/QC | `/material-deliveries`, `/qc/materials`; qc | Ghi đợt giao theo PO/lô/quota, QC từng đợt không vượt nguồn; lỗi không thành DAT. PO hoàn tất khi đã giao đủ, không đồng nghĩa mọi lượng đều đạt QC/đã nhập kho. |
| UC30 | `/lots?type=material`, QLK | `/material-lots`; warehouse | Thêm/sửa/khóa lô NL, HSD bắt buộc nếu NL yêu cầu; không đổi định danh/ngày hồi tố khi có tham chiếu. |

## Hướng dẫn chạy

Ứng dụng Compose đang chạy ở [localhost:8080](http://localhost:8080), Swagger ở [localhost:3000/docs](http://localhost:3000/docs). Dùng localhost nhất quán cho cookie; đăng nhập lại để nhận permission/scope mới. Không cần seed lại để bắt đầu.

Từ thư mục gốc, khởi động lại ứng dụng khi cần:

```powershell
docker compose --env-file infra/.env -f infra/compose.yaml --profile app --profile test up -d
docker compose --env-file infra/.env -f infra/compose.yaml --profile app --profile test ps
```

Chỉ dùng `--build` khi mã thay đổi. Không dùng `down -v`, reset/drop/truncate hoặc chạy lại file SQL riêng lẻ. Runner migration dùng checksum/GET_LOCK; APPLYING dở dang phải review, không ép retry. Không sửa bất kỳ file migration đã apply.

Chạy trực tiếp: dừng đúng hai app container để giải phóng port3000, giữ MySQL:

```powershell
docker compose --env-file infra/.env -f infra/compose.yaml --profile app stop frontend backend
. ./scripts/use-node.ps1
cd backend
npm start
```

Terminal khác tại gốc:

```powershell
. ./scripts/use-node.ps1
cd frontend
npm run dev
```

Cấu hình local `.env` đã có; không đưa nội dung vào chat/log/Git. MySQL dev `127.0.0.1:3307/warehouse_db`; test `127.0.0.1:3308/warehouse_test`. Trực tiếp dùng Vite origin/CORS và `/api` proxy đã cấu hình. HTTPS/secure cookie thuộc môi trường triển khai thật; Compose localhost có ngoại lệ HTTP rõ ràng. Uploads trực tiếp nằm `backend/uploads/evidence`, Docker bind cùng thư mục; không upload lên Git hoặc đóng vào image.

Các lệnh vận hành từ backend nếu cần (không phải bộ test):

```powershell
npm run db:status
npm run db:status:test
```

Migrations/seed đã chạy; lệnh tái triển khai schema mới chỉ dùng sau review/phê duyệt. Không tự chạy `npm test`, `test:integration`, `test:browser` trong giai đoạn hiện tại.

## Demo và thứ tự thao tác

Giữ username cũ: `uc01.customer`, `uc01.customer2`, `uc01.planner`, `uc01.purchasing`, `uc01.board`, `uc01.warehouse`, `uc01.staff`, `uc01.qc`, `uc01.workshop`, `uc01.council`. Hai customer thuộc cùng KhachHang. Mật khẩu chỉ ở [hướng dẫn local ignored](../backend/.artifacts/UC01-demo-login.local.md); không sao chép vào tài liệu công khai/GitHub/log. Không hash/đổi mật khẩu hoặc tạo account mới trong seed FS11.

Dữ liệu giả có prefix `FS_DEMO_20261015_`; calendar cấu hình rõ các ngày trong 15/10–30/11/2026, quota9600 chai/ngày cho SKU/xưởng giả. Chọn lịch tương lai còn trong khoảng cấu hình; không suy diễn weekend/quota ngoài danh sách. Tạo lô nguyên liệu và thành phẩm qua UC30/20 trước dùng. Không có tồn đầu: muốn có tồn phải đi qua QC/điều phối/ghi sổ hợp lệ. Với bốn NL giả: PET/CAP/LABEL dùng24 cái, BOX1 cái cho24 chai; ví dụ đặt1 thùng=24 chai và sản xuất24 chai. Mua NL dùng đơn giá giả do người dùng nhập, không lấy giá bán TP làm giá mua.

1. QLK xem danh mục/quy cách/giá/kho/vị trí; đăng ký lô và HSD đúng ngày; KH tạo/xác nhận đơn.
2. Planner tạo KHSX theo đơn → BGĐ duyệt → Mua hàng tạo/gửi PO cho các demand thiếu → BGĐ duyệt.
3. NV ghi đợt giao NL → QC lập/chốt QC → QLK phân bổ/xác nhận nhập → NV ghi sổ nhập.
4. Xưởng tạo/gửi yêu cầu NL → QLK điều phối đúng FEFO/giữ tồn → NV xuất → Xưởng tạo/gửi yêu cầu nhập TP → QC/chốt → QLK điều phối nhập → NV ghi sổ.
5. QLK điều phối xuất TP theo đơn → NV ghi sổ xuất → NV xác nhận lượng giao thành công. Kiểm lượng dispatch, delivered, reserved/on_hand và ledger riêng biệt.
6. KH yêu cầu trả lượng đã giao → NV tiếp nhận kho CONTROLLED → QC → QLK điều phối → NV nhập lại đạt. Với lỗi: chuyển FAILED bằng chứng từ → QLK đề nghị/BGĐ duyệt/QLK thực hiện; tái xử lý có QC mới. Nhánh chưa định danh xác minh bằng bằng chứng trước chuyển sổ.
7. QLK tạo phạm vi kiểm kê, cutoff → Hội đồng đếm/nộp/xác nhận → QLK xác minh/bằng chứng/đề nghị → BGĐ quyết định; sau đó xem báo cáo/nguyên nhân/tỷ lệ/sổ.

Luân phiên vai trò bằng đăng xuất/đăng nhập; dùng browser profile khác nếu cần giữ nhiều phiên độc lập. Ghi lại mã hồ sơ trước chuyển người dùng. Không chỉnh số tồn bằng SQL để tạo đầu vào.

## Giới hạn và việc chưa kiểm chứng

- Chưa chạy unit/integration/E2E/regression, chưa thao tác luồng nghiệp vụ bằng browser/API để kiểm chứng. Kiểm cú pháp, validation tài liệu OpenAPI, build và health container không thay thế kiểm thử transaction/quota/FEFO/CSRF/RBAC/cạnh tranh.
- Bộ demo đã duyệt chỉ có **một** account Hội đồng kiểm kê. Nhánh có chênh lệch bắt buộc người đếm lại độc lập nên cần account Hội đồng thứ hai được cấp role/scope/phân công hợp lệ. Chưa tạo account thứ11 hoặc đổi vai trò account cũ; đây là phần dữ liệu cần người dùng duyệt trước bổ sung, không được hạ quy tắc đếm lại để chạy demo. Nhánh kiểm kê không chênh lệch có thể dùng người đếm hiện có.
- Kiểm xác lập customer isolation với KH khác cần fixture/account khách hàng khác trên database test có guard khi được giao kiểm thử; hai demo customer hiện cùng KH, không tự tạo KH thứ hai.
- Cấu hình cảnh báo chưa tự đặt ngưỡng. QLK phải nhập low-stock/near-expiry/slow-moving cho từng SKU/kho qua trang cấu hình; các ngày/quota/giá/factor/BOM seed chỉ là giả, không là cấu hình thật của nhà máy.
- Build FE có cảnh báo bundle lớn hơn500KB; chưa tự đổi dependency/framework hoặc tối ưu ngoài đợt code. Chưa kiểm hiệu năng50người, responsive/browser/accessibility, an ninh tải file, backup/restore/triển khai production hoặc phục hồi sự cố thực tế.
- Source/model không có quản trị tài khoản/NCC/xưởng/BOM/calendar/factor qua UI ngoài29UC; hỗ trợ seed/lookup theo FS11. `/users` giữ placeholder ẩn, không được tính là UC đã triển khai. `backend/prisma` là archive DA_THAY_THE, không dùng runtime, không xóa.
- Không có reversal posted/chấp thuận FEFO ngoại lệ/capacity hold/overproduction/rolling stocktake hoặc chính sách khác chưa duyệt. Trạng thái kỹ thuật DA_PHAN_BO/DA_XAC_NHAN thể hiện bước phân bổ/xác nhận chờ thực hiện; HOAN_THANH trên **chứng từ** là đã ghi sổ, không phải trạng thái nghiệm thu UC.
- Query contract trước đây gắn hàng loạt bộ lọc chung cả nơi không có ý nghĩa. Đã công khai thu hẹp theo repository thực tế: các catalog hỗ trợ q/status, chứng từ status/kind khi phù hợp; reports định nghĩa ngày theo HSD/ngày sổ/cutoff. Trường query không hỗ trợ trả422, không bị bỏ qua. DTO reservation và inventory đồng bộ tên Base/unitId với response thực tế; tham khảo OpenAPI, không dùng bản thiết kế cũ làm payload.

## Bằng chứng và bảo toàn

Ngày16/10: `npm run check` kiểm CommonJS; parser FE50file; kiểm cấu hình151handler không operation thiếu binding/$ref thiếu/trùng ID; `openapi:validate` kiểm đặc tả ba tài liệu; bảy migration apply thành công trên hai DB, seed FS non-overwrite thành công; Docker build và health khởi động đạt. Không gọi những bước này là PASS29UC. Đã đóng gói lại image chứa bản sửa tích hợp cuối; trạng thái cuối và giới hạn ghi ở [checkpoint](full_system_code_checkpoint.md).

Git vẫn có11tracked deletions cũ và source/docs untracked có sẵn; không stage/commit/reset/restore/xử lý thay người dùng. Không sửa SRS/tám Domain Model, không đọc/in secrets/mật khẩu. Vì mã nguồn vốn untracked, Git diff không đủ để xác định chính xác toàn bộ thay đổi so với trước đợt; [manifest](full_system_manifest.md) là inventory mã nguồn hiện có, không giả là diff lịch sử.
