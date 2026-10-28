Cập nhật 28/10: user duyệt migration 202610280003_material_location_rules đã APPLIED Docker dev/test và tạo VITRi-A–F tại kho nguyên liệu, sức chứa 2000/1000/2000/1500/3000/500 kg và 24 liên kết vật tư đúng nhóm. Lập/xác nhận/ghi sổ nhập NL vào kho có mapping phải chọn vị trí cho phép; UI lọc theo vật tư QC. Xuất/kiểm kê tồn cũ VT_NVL_KHOITAO vẫn hoạt động, không tự chuyển 20 dòng tồn, không seed pallet/cấp scope; audit marker không overwrite. docs/material_location_layout.md. Không test nghiệp vụ/commit/reset.

Cập nhật 28/10: mỗi lô nguyên liệu thuộc đúng một material_id, không được đổi nguyên liệu/mã sau khi tạo; server cấp mã LO-<nguyên liệu>-<số thứ tự>, form mã chỉ đọc. Đã chuẩn hóa 20 lô mẫu, ví dụ LO-DUONG-01; giữ ID/tồn/chứng từ, audit mã cũ/mới, bootstrap marker ngăn ghi đè. Không migration, không test nghiệp vụ/commit/reset; xem docs/material_lot_naming.md.

Cập nhật 28/10: đơn vị cơ sở trong phiếu xuất nguyên liệu là chỉ đọc, tự điền theo dòng nguồn/lô; đổi nguyên liệu xóa lô/vị trí cũ và lấy đơn vị nguồn. Backend ngoài unitQuantity đối chiếu NguyenLieu.base_unit_id còn kiểm đơn vị trùng dòng yêu cầu trong validateQuota (tạo/xác nhận/ghi sổ). Không ảnh hưởng phiếu thành phẩm/nhập kho, không migration/seed/test nghiệp vụ. docs/unified_material_issue.md.

Cập nhật 28/10: form xuất nguyên liệu gợi ý toàn bộ dòng lô/vị trí theo từng nguyên liệu, tách nhiều lô theo FEFO thực tế của backend, tính lượng còn lại bằng DECIMAL; thông báo phần thiếu, người dùng có thể chỉnh/tải lại. Gợi ý chỉ đọc, không giữ/trừ tồn; xác nhận vẫn kiểm QC/FEFO/quota/tồn. Endpoint issues.materialSuggestions chỉ issues.allocate, scope kho và gate mua; không migration/seed. Đã đọc phiếu 1 có 8 dòng gợi ý, không tạo phiếu thử. docs/unified_material_issue.md. DA_CODE_CHUA_TEST.

Cập nhật 28/10: Thêm mới Xuất kho nguyên liệu gộp chọn phiếu, kho, nhân viên, dòng vật tư, lô/vị trí/số lượng. Với phiếu chưa điều phối, assignment và tạo phiếu xuất cùng transaction/idempotency: lỗi rollback cả hai, không tự giữ/trừ tồn. Số đỏ menu lấy tổng queue thực theo quyền, không đếm unread; cập nhật khi điều hướng/focus/thao tác, không polling. API/contract bổ sung assignment và pending, không migration/seed; FEFO/QC/scope/quota giữ nguyên. docs/unified_material_issue.md. DA_CODE_CHUA_TEST; không test nghiệp vụ/commit/reset.

Cập nhật danh mục kho 28/10: kho Docker hiện có được đổi tên thành Kho nguyên liệu (MATERIAL), Kho thành phẩm (FINISHED), Kho hàng lỗi (CONTROLLED). Giữ ID, mã nội bộ, loại, vị trí, tồn, chứng từ, sức chứa và scope; kho CONTROLLED vẫn phục vụ nghiệp vụ kiểm soát/cách ly như cũ. Script name-warehouse-catalog.js có guard/transaction/audit và marker chống ghi đè sau khi chạy lại, bootstrap chạy trên volume mới. Không migration, không đổi HTTT02; không test nghiệp vụ. Xem docs/warehouse_catalog_names.md.

Cập nhật giao diện 28/10: gộp phân công nhân viên vào Xuất kho nguyên liệu (/materials/issues). Bỏ menu Phân công riêng; /warehouse-assignments chuyển hướng về trang xuất nguyên liệu. Trang xuất gồm phiếu xưởng/nhân viên và chứng từ xuất. Nút Điều phối xuất trên phiếu đã phân công điền sẵn sourceId/kho, tải lại lookup nguồn. Trang chủ dẫn đến trang gộp. Không đổi API/schema/dữ liệu/quyền hoặc kiểm FEFO/QC/hold/posting. Kiểm cú pháp/build/health, không test nghiệp vụ.

Hiện hành 28/10 — phân công cấp nguyên liệu: user đã duyệt migration 202610280002_material_staff_assignment trên Docker dev/test và seed Nguyễn Trọng (nguyentrong), Vũ Thịnh (vuthinh), Trường Thịnh (truongthinh), role/scope kho như nhanvienkho01, không cấp scope xưởng. Phiếu DA_GUI chuyển queue quản lý issues.allocate theo kho (không đòi scope xưởng); quản lý chọn Cung cấp nguyên vật liệu, phiếu, kho và một/nhiều nhân viên. Nhân viên chỉ nhận việc được giao; xuất NL kiểm lại người/kho phân công. Chưa điều phối mới được đổi người; giữ quota/QC/FEFO/reservation/transaction/audit, không ghi tồn khi phân công. Migration đã APPLIED bất biến; seed completion không regrant/unlock. Guide chỉ backend/.artifacts/WAREHOUSE-STAFF-logins.local.md ignored; không password trong docs/log. docs/material_staff_assignment.md. DA_CODE_CHUA_TEST, không test nghiệp vụ/commit/reset.

Hiện hành 28/10/2026 — gate cấp nguyên liệu: kế hoạch thiếu phải được duyệt và có PO tương ứng đã duyệt đủ lượng theo từng nhu cầu (không tính nháp/chờ duyệt/từ chối/hủy). Áp dụng lookup MATERIAL, queue/handoff và API create/submit; kế hoạch đủ vật tư không bắt mua. Duyệt PO chỉ cho lập yêu cầu, không bỏ kiểm tồn/QC khi xuất. Lookup PRODUCT giữ nguồn nhập thành phẩm. Không schema/migration/dữ liệu mới; DA_CODE_CHUA_TEST. Chi tiết docs/material_request_approval_gate.md.

Cập nhật form cấp nguyên liệu 28/10: phân công hiển thị tên kế hoạch/thành phẩm/xưởng, chọn nguồn tự điền vật tư và lượng còn được yêu cầu (trừ cả phiếu nháp). Giữ nguồn/quota/transaction tại backend; không ghi tồn hoặc tạo phiếu tự động. Sửa regex DECIMAL quantityBase của yêu cầu cấp nguyên liệu. [Phạm vi và kiểm chứng](material_request_form.md). DA_CODE_CHUA_TEST.

Cập nhật 28/10/2026: dùng duy nhất tài khoản xưởng `xuong01` quản lý cả ba xưởng XSX002 (Nước giải khát), XSX003 (Trà và nước trái cây), XSX004 (Nước tinh khiết). Mở lại xuong01, giữ mật khẩu và scope kho hiện có; khóa xuong_ngk/xuong_tra/xuong_nuoc và giữ uc01.workshop khóa, thu hồi phiên cả năm tài khoản. Không xóa tài khoản hoặc lịch sử, không gộp thêm xưởng. Script use-shared-workshop-account.js chạy transaction có guard và audit một lần sau consolidate; chạy lại không tự mở khóa/cấp lại scope. Các ghi nhận dùng ba tài khoản riêng bên dưới là lịch sử đã được thay thế. Không migration, không thay tồn/BOM/giá, không test nghiệp vụ/commit/reset.

<!-- PRODUCT_CATALOG_20261023 -->
Quyết định27/10 đã thực hiện: gộp XSX001 vào XSX002 tên Xưởng nước giải khát; giữ XSX003/XSX004, xóa xưởng mẫu sau preflight. User duyệt khóa xuong01/uc01.workshop và tạo xuong_ngk/xuong_tra/xuong_nuoc dùng mật khẩu cục bộ ngắn riêng allowlist. Mỗi account1scope, chỉ trả phần phân công xưởng mình kể cả kế hoạch nhiều xưởng; đủ vật tư vẫn xét toàn kế hoạch. Không schema migration/reset/đổi tồn. [Bằng chứng](workshop_consolidation.md), DA_CODE_CHUA_TEST.

Sửa hiển thị27/10: queue xưởng đã có kế hoạch đủ/đã duyệt nhưng UI chưa hiện ở trang chủ/chuông. Bổ sung queue vào trang chủ và các lối vào của vai trò xưởng, chuông lấy số thật và link tiếp nhận, cập nhật khi quay lại tab/mở chuông, không keep-alive polling. Không dữ liệu/scope/schema mới. [Bằng chứng](workshop_receiving_visibility.md), DA_CODE_CHUA_TEST.

Yêu cầu27/10: đơn vị cơ sở của nguyên liệu trong PO tự điền và chỉ đọc; mua hàng không thay được. Backend giữ kiểm nguồn và bổ sung đối chiếu NguyenLieu.base_unit_id khi tạo/duyệt, không quy đổi ngầm hoặc sửa đơn cũ. [Chi tiết](purchase_supplier_design.md). Không migration/seed/test nghiệp vụ, DA_CODE_CHUA_TEST.

Sửa lỗi27/10: form mua gửi currency VND bắt buộc, sửa regex dấu chấm bị escape sai ở PurchaseInput và Quantity/UnitPrice dùng chung để nhận DECIMAL hợp lệ; hiển thị tên trường validation lỗi. Không sửa schema/data/giá hoặc bỏ gate nghiệp vụ. [Chi tiết](purchase_save_fix.md), DA_CODE_CHUA_TEST.

Phê duyệt26/10: user chấp thuận migration và dữ liệu mẫu theo docs/purchase_supplier_design.md. Thêm9NCC/48báo giá cho24vật tư, gợi ý NCC bao phủ đủ dòng và tổng tham khảo thấp nhất, giá chỉnh trước lưu; ghi chú tùy chọn cuối PO. Bảng BaoGiaNguyenLieu và notes được duyệt, không ghi đè NCC/giá/PO cũ. Không tự thêm thuế/chiết khấu. DA_CODE_CHUA_TEST.

Quyết định mới nhất26/10: mua hàng nhận yêu cầu vật tư thiếu và lập đơn mua độc lập xưởng; thay gate scope xưởng của luồng mua, không cấp thêm scope. DTO yêu cầu không trả phân công/BOM/lịch; không cấp plans.read. Giữ role/action/kho/nguồn/quota/transaction/maker-checker. Các ghi mua bị chặn do thiếu scope xưởng bên dưới là lịch sử đã thay. [Hiện thực](production_plan_handoff.md). DA_CODE_CHUA_TEST.

Bổ sung26/10: duyệt đủ vật tư chuyển queue xưởng, thiếu chuyển queue yêu cầu mua dùng nhu cầu hiện có; từ chối bắt buộc lý do và trả queue lập kế hoạch. Người dùng xác nhận giữ nguyên phạm vi mua hàng, nên thiếu người nhận đủ scope báo blocked, không tự cấp bốn xưởng. Không bảng/model/migration mới hoặc tự tạo PO. [Thiết kế và giới hạn](production_plan_handoff.md). DA_CODE_CHUA_TEST.

Bổ sung26/10 theo yêu cầu: chi tiết KHSX hiển thị mã đơn, mã/tên thành phẩm và xưởng, số dòng đơn, phiên bản định mức thực thay ID liên kết. API bổ sung nhãn chỉ đọc sau kiểm scope, không đổi ID/permission/dữ liệu. [Phạm vi và bằng chứng](production_plan_display.md). DA_CODE_CHUA_TEST.

Yêu cầu bổ sung23/10: số lượng phân nhóm hàng nghìn `2.000`, bỏ phần 0 thừa; tình trạng vật tư tách trạng thái duyệt KHSX. Kế hoạch `CHO_DUYET` cho bộ phận lập kế hoạch sửa bằng quyền `plans.create` hiện có, kiểm version/scope/quota/lịch và audit trong transaction; từ `DA_DUYET` không sửa. Không migration hoặc sửa nguồn SRS/Domain. [Thiết kế và hướng dẫn kiểm tay](production_plan_edit.md), [định dạng số](quantity_display.md). DA_CODE_CHUA_TEST, bộ test tiếp tục hoãn.

Lệnh mới23/10 về vật tư/xưởng: người dùng giao tự quy định bộ vật tư mẫu có tồn và cho planner thêm/xóa/sửa gợi ý, đổi xưởng. Đã xác nhận trực tiếp mở scope4xưởng cho ba nhóm planner/board/workshop hiện có, thay quyết định giữ scope trước đó trong đúng ba nhóm. Đã bổ sung20vật tư/15BOM/lịch mẫu và tồn qua kiểm kê–điều chỉnh đã duyệt. Migration202610230002 bổ sung metadata BOM riêng bất biến để không sửa gợi ý chung/kế hoạch cũ. Không phải công thức nhà sản xuất, không thêm UC hoặc sửa SRS/Domain. [Thiết kế](planning_suggestions_design.md), [dữ liệu](../data.md). Chưa nghiệm thu chức năng/29UC, tiếp tục hoãn test.

Bổ sung xưởng theo yêu cầu23/10: XSX001 Xưởng nước giải khát đóng lon; XSX002 Xưởng nước giải khát chai PET; XSX003 Xưởng trà và nước trái cây; XSX004 Xưởng nước tinh khiết. Thêm ACTIVE, không chữ demo trong tên, giữ xưởng cũ và phân quyền. Auto-review từ chối mở rộng scope; sau khi hỏi riêng, người dùng xác nhận “Giữ nguyên phân quyền, chỉ thêm4xưởng”. Script không ghi TaiKhoan_Xuong. Không tự đặt lịch/năng lực/BOM hoặc thay trạng thái sẵn sàng suy diễn. Seed idempotent, không migration. Chi tiết tại [data.md](../data.md).

Cải tiến UC02 theo yêu cầu23/10: chọn đơn trong form tạo KHSX hiển thị thông tin đơn/giao nhận/tiền, tự điền SKU và lượng còn cần lập; preview vật tư/BOM/tồn theo scope. Xưởng “sẵn sàng” suy ra ACTIVE+có scope+còn năng lực đúng SKU trong lịch đã chọn, không thêm trạng thái/schema. GET chỉ đọc không giữ tài nguyên, lưu/duyệt vẫn kiểm lại như cũ. TP002 trong đơn hiện hữu chưa có BOM/lịch năng lực nên báo thiếu cấu hình, không tự seed. [Phạm vi và kết quả](production_planning_form.md).

Sửa hiển thị giá23/10: sau khi khách báo đơn nháp vẫn không có giá, bổ sung preview tạm tính chỉ đọc từ giá hiệu lực; các trường estimated* tách khỏi snapshot unitPrice/amount/totalAmount. Chốt giá khi xác nhận vẫn giữ FS01, đơn cũ không định giá lại. [Chi tiết](order_price_preview.md).

Yêu cầu giao diện bổ sung23/10: nút thao tác có nền/viền, Xóa trước Xác nhận và xác nhận cuối. Xóa bản NHAP không có phụ thuộc cho orders/purchases/materialRequests/productRequests theo quyền tạo và scope hiện có; audit giữ snapshot, không đụng tồn/ledger, không xóa chứng từ đã xác nhận. Các loại chứng từ khác giữ quy trình hủy/điều chỉnh và nút Xóa vô hiệu hóa khi không hỗ trợ. [Phạm vi và kiểm chứng](action_buttons_update.md). Chưa kiểm thử/nghiệm thu chức năng xóa.

Phê duyệt bổ sung cùng ngày: người dùng giao tự chọn giá mẫu phù hợp loại/dung tích cho15SKU và thêm vào hệ thống. Được seed60giá theo4đơn vị, chỉ thêm cặp chưa có giá, giữ lịch sử/snapshot, không tự xác nhận đơn. Giá VND ở [data.md](../data.md), không phải báo giá thị trường. Không thay chính sách thuế/chiết khấu hoặc FS01. BOM/hệ số chiếm chỗ vẫn chưa được giao giá trị.

Quyết định danh mục23/10/2026 DA_XAC_NHAN:15SKU TP001–TP015, HSD365/540/270ngày theo nhóm, Lốc6/Thùng24, Pallet60thùng cho TP001–014 và80 cho TP015; khóa SKU FS_DEMO_20261015_PET_500 giữ lịch sử. Đây là dữ liệu mẫu, không thông số nhà sản xuất. Cho phép người quản lý sửa HSD và thêm phiên bản hệ số bất biến, không sửa snapshot đơn cũ hoặc HSD lô cũ. HSD lô mới lấy NSX+default, cho nhập thực tế. Được kiểm tập trung quy đổi/HSD/lô/FEFO trên warehouse_test rollback, không mở lại toàn bộ test hoặc nghiệm thu29UC. [Hồ sơ triển khai và kết quả](product_catalog_update.md).

<!-- WAREHOUSE_PORTABLE_20261023 -->
## Docker warehouse hiện hành — 23/10/2026

Người dùng đã giao thêm SQL Server container và đổi project Docker thành **warehouse**. Compose mặc định tại root chạy SQL Server2022Developer riêng (SSMS: localhost,14330), db-init/migrate/Express/frontend; app http://localhost:8080, backend3001. Lần đầu chạy `node scripts/setup-docker.js` rồi `docker compose up -d --build`; những lần sau `docker compose up -d`. `scripts/start-docker.ps1` nay dùng bản portable, không phụ thuộc SQL Server Windows/dynamic port. [Hướng dẫn hiện hành](docker_warehouse.md).

Giữ nguyên HTTT02/Windows .env/data và các MySQL/Prisma archives. Chế độ Windows chuyển sang `infra/compose.windows.yaml`/`scripts/start-docker-windows.ps1` (project warehouse-windows); hướng dẫn cũ bên dưới về start-docker dò Windows port là lịch sử đã được thay thế cho chế độ mặc định. Không đồng bộ/copy dữ liệu giữa SQL Server Docker và HTTT02; cả hai có thể mở cùng SSMS. Volumes mới warehouse_sqlserver_data/warehouse_demo_artifacts/warehouse_uploads riêng; credentials riêng local ignored, backend không dùng sa. Seed fixture19accounts trong Docker, không import dữ liệu cũ; seed một lần, không overwrite. Schema76bảng/237FK/native checksum và 29UC giữ nguyên, DA_CODE_CHUA_TEST; chỉ kiểm cú pháp/config/bootstrap/migration/health, không unit/integration/E2E/regression. Không commit/reset/drop/delete volume. Nhóm warehouse-foundation cũ giữ ở trạng thái dừng, không tự xóa.

---

# Quyết định và điểm cần duyệt

## Quyết định database mới16/10/2026 — DA_XAC_NHAN

Hiện thực tiếp theo cùng ngày: SQL Server warehouse_db/warehouse_test đã tạo mới không ghi đè; migration T-SQL202610160001_native_schema APPLIED,76bảng/237FK. Express dùng mssql12.7.9/lossless-json, SQL Authentication bằng4login app/migration dev/test riêng, bootstrap bằng Windows Authentication. NVARCHAR/Latin1_General_100_CI_AI_SC; mã/login/hash BIN2; precision và FS01–12 không đổi. Backend Windows và Docker host connection đã trả health connected. MySQL/mysql2 chỉ archive; không dependency runtime. Fixture demo mới đã seed trên SQL Server, dữ liệu MySQL chưa copy. [Hồ sơ hiện hành](sqlserver_conversion.md), [runbook](sqlserver_runbook.md), [kế hoạch import chờ duyệt](sqlserver_data_migration_plan.md). Kết nối/schema/health không là nghiệm thu hoặc PASS29UC.

Lệnh người dùng trong chat và attachment ea144ab5 thay toàn bộ MySQL/mysql2 bằng Microsoft SQL Server/T-SQL/mssql. Các quyết định engine/driver/collation/locking/migration MySQL trước đây **DA_THAY_THE**; nghiệp vụ, precision20,0/20,6/20,9, FS01–12, session/RBAC và frontend/API giữ nguyên. Không chuyển dữ liệu thật tự động. Mục tiêu là native database trong SSMS Databases → warehouse_db → Tables, không Linked Server. Đã kiểm Windows auth/quyền sysadmin và TCP named instance60026 trên NGUYENTRONG-200\HTTT02; SQL2022Developer16.0.1210.3/mixed authentication; hai DB chưa tồn tại. Các trạng thái MySQL đã apply/seed dưới đây là lịch sử, không chứng minh schema/data đã có trên SQLServer.

Lệnh bổ sung16/10/2026: người dùng yêu cầu các tài khoản dễ nhớ theo9role và mật khẩu chung6ký tự cho bộ demo mới. Đã thêm9account LOCAL_SIMPLE_* vào role/customer/scope giả hiện có, không overwrite10account uc01.*. Ngoại lệ min6 chỉ allowlist username+code DB, bật rõ bằng AUTH_ALLOW_SIMPLE_DEMO và giới hạn môi trường loopback/warehouse_db; các tài khoản khác giữ min12. Không đổi hash Argon2id, session, khóa đăng nhập, CSRF/RBAC. Bộ demo nay19accounts/9roles/1KH, có2Hộiđồng; các giới hạn seed10accounts bên dưới là lịch sử. Xem [data.md](../data.md).

Hiện trạng16/10/2026: triển khai mã nguồn29UC theo FS01–12, **DA_CODE_CHUA_TEST**; bảy migration đã áp dụng dev/test, cấu hình demo FS11 đã seed và Compose đã build/khởi động. [Bàn giao và giới hạn](full_system_handoff.md). Chưa có nghiệm thu hoặc kết quả test nghiệp vụ. Không tự bổ sung account Hội đồng thứ hai vì bộ demo chỉ duyệt10accounts; ngoài phạm vi FS/các phê duyệt cũ vẫn CHUA_DUYET. Các ghi “migration chưa apply/chờ gate riêng UC01” trước16/10 dưới đây là lịch sử.

## Phê duyệt FS01–FS12 — 15/10/2026

Người dùng đã **DA_XAC_NHAN toàn bộ FS01–FS12 đúng nguyên văn** [phiếu](full_system_policy_approval.md), đồng thời giao tiếp tục code ngay cả29UC. Các điểm rounding/price/BOM/reservation/capacity/HSD/stocktake/delivery/return/rework/support-scope/API nguồn trong phiếu không còn là điểm chặn. Những ghi CHUA_DUYET trước xác nhận này giữ làm lịch sử; ngoại lệ ngoài phiếu vẫn chưa được mở. Không dừng chỉ để phân tích hoặc cập nhật docs; không chạy unit/integration/E2E/regression, không reset/drop/volume delete/commit.

## Lệnh hiện hành — 15/10/2026: toàn bộ29UC, hoãn chạy test

Người dùng đã thay D14/quy trình triển khai: giao FE+BE+MySQL/API/RBAC cho đủ29UC trong một nhiệm vụ, không dừng sau mỗi UC/chờ test tay trung gian. Không chạy unit/integration/E2E/regression hoặc restart Docker để kiểm từng UC; giữ tất cả test và cơ chế bảo vệ dữ liệu. Được kiểm cú pháp/cấu hình tối thiểu khi cần. Trạng thái code xong chưa kiểm là DA_CODE_CHUA_TEST; HOAN_THANH chỉ sau người dùng nghiệm thu. Không commit/reset/xóa dữ liệu/volumes.

Phạm vi code đã được giao, **không cần lệnh riêng cho từng UC**. Lệnh thay quy trình không thay SRS/8Domain hoặc tự duyệt D01/D03/D05/D06/D09/D10/D11/D12/D13. [Phiếu FS01–12](full_system_policy_approval.md) ghi phương án review được cho các điểm chặn: rounding/giá, BOM/năng lực, hold/capacity, FEFO/HSD, kiểm kê, quyền giao/return/disposition và các API nguồn/lookup thiếu. FS01–FS12 đã được duyệt theo xác nhận trực tiếp ngày 15/10/2026. Contract đã đồng bộ; migration mới chưa áp dụng vào database. [Kế hoạch nhiệm vụ](full_system_execution.md).

Các mục “hiện hành14/10”, “một UC/lần”, “chờ nghiệm thu UC01 mới giao tiếp” bên dưới là lịch sử đã bị thay phần quy trình bởi lệnh15/10. Bằng chứng UC01 cũ giữ nguyên, không là nghiệm thu toàn hệ thống.

## Lệnh và xác nhận UC01 hiện hành — 14/10/2026

Người dùng giao tiếp tục Giai đoạn 2, chỉ UC01; xác nhận Argon2id **65536 KiB / timeCost 3 / parallelism 1**, tham số qua env có validation. Cho phép demo theo vai trò SRS/permissions, không password plaintext DB/GitHub/log; thông tin demo chỉ hướng dẫn ignored cục bộ. Landing `/` mọi account, menu theo quyền, phong cách FE cũ. UC01 CHO_NGUOI_DUNG_XAC_NHAN sau test, 28 UC CHUA_LAM; chưa nghiệm thu hoặc cho phép UC kế tiếp. Các trạng thái 29 UC CHUA_LAM/Giai đoạn 1 dưới đây là lịch sử.

D07 refinement theo auth contract đã có: Origin allowlist+JSON trước login, token phiên cấp login/me; rotate thành công/revoke cookie cũ, cookie hết hạn không chặn login lại. Warehouse/workshop scope=[] khi chưa migrate/cấp quyền, deny scope mặc định, không tạo bảng demo thiếu nghiệp vụ. Logout giữ valid session+CSRF+Idempotency-Key, revoked retry401, key xung đột phiên409; không đổi schema/contract. AU02 commit counter bảo mật khi password sai, không ghi chứng từ/tồn; unknown user không actor giả. IP limits/cấp-reset/support và tất cả policy nghiệp vụ CHUA_DUYET vẫn mở. [Thiết kế UC01](usecases/UC01.md), [hướng dẫn local](uc01_local_runbook.md).

## Quyết định công nghệ hiện hành — 12/10/2026

Người dùng chính thức thay thế TypeScript/Prisma bằng Express JavaScript thuần CommonJS + mysql2/promise, SQL migration versioned, Modular Monolith + MVC và Jest/Supertest. Quyết định này thay phần công nghệ của D08/NT01/NT02/NT09/NT12; Node 24.21.0, Express 5.2.1, MySQL 8.4.8 và toàn bộ quyết định dữ liệu/nghiệp vụ giữ hiệu lực. Không ORM, không TypeScript/Prisma runtime hoặc build. Nền tảng CHO_NGUOI_DUNG_XAC_NHAN; 29 UC CHUA_LAM.

| Quyết định | Trạng thái hiện hành |
|---|---|
| NT01 TypeScript 5.9.3/ESM backend | DA_THAY_THE bằng JavaScript CommonJS; Node/Express giữ hiệu lực |
| NT02 Prisma 7/Client/adapter | DA_THAY_THE bằng mysql2/promise 3.24.0 |
| NT09/NT12 Prisma migration/transaction client/schema DSL | DA_THAY_THE bằng SQL migration và mysql2 connection; versioning/review/transaction vẫn bắt buộc |
| NT03–08, NT10–11, AU01–03 và chính sách nghiệp vụ | Giữ hiệu lực; phần CHUA_DUYET không được tự chốt |

Hai SQL migrations giữ nguyên byte/checksum. Runner kiểm schema/history trước BASELINED_LEGACY, giữ _prisma_migrations và dữ liệu/volumes. _sql_migrations là metadata công cụ được yêu cầu, không bảng nghiệp vụ mới. DDL implicit commit: lỗi dở dang dừng ở APPLYING để review, không reset/drop hoặc giả rollback. [Báo cáo](backend_stack_migration_review.md).

**Các mục phê duyệt/bằng chứng bên dưới là lịch sử trước đổi stack; TypeScript/Prisma trong đó DA_THAY_THE, không là chỉ dẫn công nghệ hiện hành.**


Ngày 11/10/2026. **LỊCH SỬ BẢN NHÁP 2.2; trạng thái hiện hành ở cuối tài liệu**. Người dùng đã xác nhận 29 UC và yêu cầu khôi phục UC13/UC15 độc lập, không ghi tồn, tận dụng Domain hiện có ngày 11/10/2026. Yêu cầu đã cố định: chỉ Giai đoạn 0, giữ frontend, 29 UC, MySQL 8.0+ InnoDB utf8mb4, Prisma; chưa backend/DB/migration.

## Lịch sử đề xuất trước xác nhận hiện tại (không còn là trạng thái hiện hành)

| ID | Ưu tiên/nguồn | Vấn đề và đề xuất để duyệt | Tác động nếu chưa chốt |
|---|---|---|---|
| D01 | P0; BR03/RULE03, UC03/22/26 | Thêm định mức nguyên liệu theo SKU và phiên bản (không lưu công thức pha chế bí mật), snapshot nhu cầu theo dòng KHSX. Nhu cầu = sản lượng cơ sở × định mức; hao hụt chỉ khi duyệt cấu hình. Tồn khả dụng không trừ hai lần reservation; PO chưa nhận chỉ giảm nhu cầu mua khi chính sách cho phép, không cấp phát. Có phân bổ nhu cầu–PO và reservation để tránh hai kế hoạch cùng dùng tồn | không thể tính thiếu/vượt định mức đúng |
| D02 | P0; README 4/7.1, SRS mở đầu; frontend /production-orders | Đề xuất KHSX đã duyệt + dòng phân xưởng là căn cứ thực hiện, không bảng LenhSanXuat. Route hiện tại vẫn giữ, sau duyệt có thể hiển thị kế hoạch đã duyệt với nhãn phù hợp. Nếu cần lệnh riêng phải bổ sung phạm vi/quan hệ/vòng đời | chặn schema production và thay nhãn UI |
| D03 | P0; README 1.6/9 vs SRS 5/15/BR05 | Giữ 29 UC. UC13 Điều phối nhập kho và UC15 Điều phối xuất kho có UI/task riêng, dùng chung dòng dự thảo phiếu thực tế; chỉ phân bổ vị trí/lô, không ghi tồn, không thêm lớp DieuPhoi. ĐÃ XÁC NHẬN phạm vi 29 UC và hai UC độc lập; SRS 2.2 đã thêm FR094–FR105/AC13/15. Actor Quản lý kho vẫn đề xuất; cần chốt reservation, hiệu lực và quyền sửa phân bổ | chỉ tài liệu; chờ duyệt actor/policy trước triển khai |
| D04 | P0; RULE01/02/09, SRS 11 chung chung | Duyệt bảng trạng thái business_rules; draft sửa được, gửi khóa nội dung, từ chối có lý do rồi tạo revision, duyệt tách người lập, posted không sửa/hủy trực tiếp; reversal phải có chứng từ được duyệt | ảnh hưởng mọi API/transaction |
| D05 | P0; BR10, RULE11, KK02/04/07, UC18 | Quarantine là lượng vật lý riêng trạng thái và vị trí kiểm soát, không khả dụng. QC theo dòng/lô, tránh đổi cả lô khi đạt/không đạt một phần. Nhận trả/cách ly bằng chứng từ vật lý; UC17 chuyển lượng được QC cho phép sang tồn đạt, không cộng lần hai. Hàng không rõ lô nằm sổ tiếp nhận chưa định danh, không bịa mã lô; ai tiếp nhận/lập yêu cầu trả và BGĐ duyệt xử lý lỗi? | thiếu mắt xích nhận trả, tiêu hủy/trả NCC |
| D06 | P0; BR14/RULE08/14/15, SRS 8 | Đơn vị cơ sở và hệ số từng SKU có phiên bản, chốt trên lô và dòng chứng từ. Chai/lon/cái bắt buộc số nguyên; kg/lít decimal. Đề xuất DECIMAL(20,6), tiền (20,2), giá/hệ số (20,6)/(20,9). Không làm tròn trung gian; capacity theo kg/m3/pallet-slot riêng thay vì cộng chai/kg; cung cấp hệ số/cách tính chiếm chỗ | chặn tồn/sức chứa/kiểm kê |
| D07 | P0; BR01/NFR05/06, Domain TaiKhoan/KhachHang | Đề xuất session opaque HttpOnly + CSRF, Argon2id; một vai trò/tài khoản theo sơ đồ, quyền tách bảng; FK khách hàng tùy chọn unique (đề xuất mỗi KH một account), scope xưởng/kho. Tài khoản khách được cấp bởi quản trị; đăng ký/reset mật khẩu/multi-role chưa thuộc UC rõ ràng | chặn hạ tầng auth và phạm vi khách |
| D08 | P0; README 5/7.1 | Node.js + Express + TypeScript chỉ backend, Prisma bản tương thích MySQL được pin, MySQL >=8.0.16 để enforce CHECK; frontend JS/React/Tailwind giữ nguyên. Duyệt việc thêm route/component/service/form nhất quán khi UC được giao và sau duyệt thay mock trái ngành | cần trước dựng Giai đoạn 1 |
| D09 | P0; SRS 8.5 vs UC07 actor | Đề xuất khóa toàn bộ vị trí thuộc phạm vi từ cut-off đến điều chỉnh/đóng; Quản lý kho tạo phạm vi/phân công, Hội đồng đếm/nộp/xác nhận, BGĐ duyệt. Chốt timeout/mở khóa khi từ chối/hủy. Nếu vận hành cuốn chiếu cần thiết kế thêm đối chiếu giao dịch tại thời điểm từng lần đếm | chặn snapshot/lock và phân quyền UC07 |
| D10 | P1; Domain QC 0..1 PNK vs SRS 4.2.1/FR087/088 | Cho phép một dòng QC nhiều dòng nhập/nhiều lần nhập, khóa quota QC đạt; một yêu cầu nhiều lô/đợt QC, có dòng QC duy nhất theo lượng nhận để không kiểm trùng. Đổi quan hệ logic sang 1:N; sơ đồ khái niệm nguồn giữ nguyên | chặn cardinality nhập từng phần |
| D11 | P1; UC02 FR006, Xuong.nangLucSanXuat | Cần đơn vị năng lực theo SKU/ca/ngày, lịch ca và quy tắc trùng lịch; bổ sung capacity calendar. Cách quản lý NCC/xưởng/định mức/khách ngoài 29 UC: hạ tầng seed hay màn hình hỗ trợ được duyệt? | chưa thể xác nhận năng lực tự động |
| D12 | P1; UC11/12/14 | Chính sách giá/tiền tệ, xác nhận/hủy đơn, giao từng phần, overproduction, lượng trả <= lượng đã giao trừ đã nhận trả; ai xác nhận đã giao? Không coi POST phiếu xuất là giao thành công | order state/delivery/return |
| D13 | P1; FEFO/RULE06, NFR11 | FEFO rồi first_received_at rồi id; ngày hết hạn chặn từ đầu ngày HSD theo Asia/Bangkok (đề xuất cần chọn); hạn tối thiểu khi giao và quyền duyệt ngoại lệ. Ngưỡng cận hạn 30 ngày chỉ tham khảo, không mặc định nhà máy | test biên ngày/expiry |
| D14 | P1; README 10/CI, NFR01/02/09 | Chọn branch từng UC hay checkpoint; CI GitHub Actions tùy duyệt, ngưỡng p95/load demo, RPO/RTO và backup; .gitignore root bảo vệ .env trước commit. Không tự xử lý Git dirty hiện tại | nghiệm thu/vận hành |

P0 cần chốt trước Giai đoạn 1. P1 cần chốt trước migration/UC liên quan; có thể duyệt thiết kế nền tảng giới hạn nếu người dùng chỉ rõ phạm vi, không âm thầm tạo schema chưa chốt.

## Lịch sử khoảng trống phát hiện ở bản 2.2

| Mã | Bằng chứng nguồn | Khoảng trống/đề xuất giải quyết |
|---|---|---|
| GAP01 | README 29 UC; SRS 2.1 trước hiệu chỉnh có 27 UC | ĐÃ GIẢI QUYẾT số lượng/mã bằng SRS 2.2 theo yêu cầu; actor/reservation hai UC vẫn chờ D03 |
| GAP02 | SRS 34 lớp; tám sơ đồ không có NhaCungCap/TaiKhoan–KhachHang | NCC thuộc SRS, thiếu view actor; thêm FK PO–NCC, account–KH có duyệt |
| GAP03 | UC03 tính thiếu, UC22 kiểm định mức; không lớp định mức/nhu cầu | D01; phân biệt định mức tiêu hao với công thức bí mật ngoài phạm vi |
| GAP04 | QC TP request 0..1 QC, QC→PNK 0..1 nhưng request→nhiều lô và SRS nhiều lần nhập | D10, chi tiết QC gắn lượng nhận/lô, nhiều lần nhập quota |
| GAP05 | TonKho trỏ cả hai loại lô; nullable FK trong chi tiết | XOR bắt buộc, khóa unique không để NULL tạo tồn trùng |
| GAP06 | Lo.soLuongConLai, Ton.soLuongKhaDung, ViTri.sucChuaConLai | là projection/tính toán; không ba nguồn cập nhật độc lập |
| GAP07 | SRS 8 cần cut-off/lần đếm/QC/evidence; 34 lớp thiếu thuộc tính | bảng kỹ thuật snapshot/count/scope lock/audit; count hàng không có dòng tồn và kiểm vị trí trống |
| GAP08 | XuLyChenhLech nối sau DeNghi; UC08 xác minh trước UC09 | giữ FK đề nghị–xử lý tùy chọn, xử lý xác minh có thể tồn tại trước đề nghị; D04 |
| GAP09 | YeuCauTraHang chỉ lượng tổng, không lô/chi tiết giao; chưa UC tạo/nhận hàng trả | dòng trả gắn dòng xuất, chứng từ cách ly, actor và phạm vi cần D05/D12 |
| GAP10 | UC18 yêu cầu có duyệt, RBAC chỉ Quản lý kho | đề xuất BGĐ duyệt xử lý, chưa có FR riêng; không mặc định được cấp |
| GAP11 | Danh mục TP thiếu loại chai/lon/dung tích/quy cách số và version | D06, bổ sung logic; không lưu quy cách như text làm nguồn quy đổi |
| GAP12 | PO/phiếu có tongSoLuong nhiều đơn vị; capacity chưa đơn vị | không cộng kg+lít+cái; tổng theo nhóm đơn vị, D06 |
| GAP13 | UC07 Hội đồng nhưng SRS 8.5 quản lý lập phạm vi | quyền tạo phạm vi vs quyền đếm cần D09 |
| GAP14 | SRS tiền/hậu điều kiện lặp chung, FR001 auth trước login | UC01 ngoại lệ công khai; các điều kiện cụ thể trong uc_catalog là đề xuất, không thay SRS |
| GAP15 | /production-orders và mock nhựa/kg so với SRS nước ngọt/bỏ lệnh | giữ UI hiện tại, D02/D08 trước thay nhãn/mock |
| GAP16 | thiếu lịch năng lực, cấu hình QC, reservation, giao/nhận từng phần, reversal | cần xác nhận bộ dữ liệu và policy thay vì tự suy diễn |

## Mẫu ghi duyệt và lịch sử cổng giai đoạn

Người dùng trả lời theo ID (ví dụ D01 đồng ý/điều chỉnh ...). Sau phản hồi mới ghi người duyệt, ngày, nội dung và tài liệu bị tác động. Đã xác nhận phục hồi 29 UC; **chưa duyệt toàn bộ kiến trúc hoặc chuyển giai đoạn**.

## Quyết định hiện hành — người dùng xác nhận ngày 11/10/2026

Nguồn: yêu cầu “Hoàn thiện và đồng bộ hồ sơ thiết kế Giai đoạn 0”, mục 2.1–2.11. Các bảng phía trên lưu lịch sử đề xuất trước phản hồi; không được dùng dòng lịch sử để phủ nhận xác nhận này. Chưa có lệnh chuyển giai đoạn.

| ID kế thừa | Nội dung DA_XAC_NHAN | Phần còn CHUA_DUYET |
|---|---|---|
| D01 | BOM vật tư M:N SKU–NL, phiên bản/hiệu lực, KHSX truy vết; tính thiếu xét đã cấp, đã giữ, tồn tự do; không công thức bí mật | hao hụt, thuật toán làm tròn, tính PO tương lai vào thiếu mua; precision/scale đã xác nhận NT06 |
| D02 | không LenhSanXuat; đơn hợp lệ → KHSX CHO_DUYET có SKU/lượng/lịch/xưởng; BGĐ duyệt/từ chối; chỉ DA_DUYET dùng sản xuất/cấp phát | giới hạn vượt sản lượng đơn, sửa kế hoạch đã duyệt, thay nhãn route hiện có |
| D03 | 29 UC, không UC28, UC13/15 độc lập, actor Bộ phận quản lý kho; dùng dòng phiếu hiện có, không lớp điều phối; UC15 reservation bắt buộc, không giảm on_hand/ledger | UC13 reservation sức chứa mới là đề xuất; TTL/gia hạn/ưu tiên và phân bổ dở dang |
| D04 | mọi ghi tồn có chứng từ/transaction/idempotency; KHSX CHO_DUYET ngay khi lập; không sửa tồn từ UI | maker-checker đa vai trò, hủy/reversal sau posting và quyền ngoại lệ |
| D05 | hàng trả cách ly trước QC, đạt một phần; nguồn đơn/dòng xuất/lô và giới hạn đã giao trừ đã trả; nhập lại không cộng vật lý hai lần; hàng lỗi có phương án/chứng từ hợp lệ | actor tạo yêu cầu/tiếp nhận/xác nhận giao, người duyệt UC18, hàng chưa định danh và ngoại lệ vượt trả |
| D06 | PET/GLASS/CAN/dung tích, base unit, lốc/thùng/pallet phiên bản; NL kg/lít/cái; capacity unit và factor chiếm chỗ riêng | hệ số thực tế, thuật toán làm tròn lúc chốt chứng từ, thuật toán chiếm chỗ/pallet lẻ, cập nhật capacity đang có hold; precision đã xác nhận NT06 |
| D07 | session HttpOnly cookie + CSRF, backend RBAC, Argon2id, AU01–03 đã xác nhận; KH1:N tài khoản, mỗi account một role; không secrets | rate limit IP cụ thể, quy trình cấp/reset/support ngoài UC; chi tiết bootstrap CSRF trước UC01. TTL/hard lifetime/password/khóa tạm và cardinality account–KH đã chốt |
| D08 | monorepo Modular Monolith Node.js Express TypeScript, MySQL8+ InnoDB utf8mb4, Prisma migration kiểm soát; warehouse_db/test riêng, REST/OpenAPI, Compose sau duyệt + direct dev; FE JS giữ nguyên | Prisma7 patch/adapter phải pin và kiểm chứng kết nối/migration thực; Node24.21.0/Express5.2.1/TS5.9.3/MySQL8.4.8/collation đã xác nhận. Mở rộng FE chỉ UC được giao |
| D09 | cut-off/snapshot/bất biến từng lần đếm; Hội đồng đếm, QLK xác minh/đề nghị, BGĐ duyệt mới ghi tồn; khóa/kiểm soát phạm vi, mở khóa an toàn có giới hạn khi xong/hủy/gián đoạn | loại kiểm soát freeze vs cuốn chiếu; TTL/renew/max lease/cancel role, quyền lập phạm vi, threshold/count evidence |
| D10 | QC từng mặt hàng/lô, nhiều đợt/yêu cầu, accepted+rejected=inspected, partial QC/receipt, nhập <= quota đạt còn lại; trace QC→receipt | tái QC/sửa kết luận đã chốt và quyền/phương án xử lý |
| D11 | từng dòng KHSX có xưởng/lịch | đơn vị năng lực/ca, lịch nghỉ/trùng, quản lý NCC/xưởng/BOM qua seed hay CRUD hỗ trợ |
| D12 | đã xuất khác đang giao/đã giao; returns không vượt delivered trừ returned trừ ngoại lệ duyệt | actor xác nhận giao, chính sách giá/làm tròn lúc chốt, giao/cancel từng phần, approval ngoại lệ; tiền tệ VND đã xác nhận |
| D13 | FEFO có HSD/FIFO phù hợp; Asia/Ho_Chi_Minh nghiệp vụ, UTC timestamp | tie-break cụ thể, biên đầu/cuối ngày HSD, hạn tối thiểu khi giao, cảnh báo cận hạn |
| D14 | một UC/lần, nghiệm thu người dùng, không tự commit/reset | CI/branch policy/perf/load/RPO/RTO/backup/retention |

## Khoảng trống còn lại sau đồng bộ

GAP01 đã giải quyết mã/actor và reservation tồn; chỉ policy giữ chỗ còn CHUA_DUYET. GAP03/GAP04/GAP11 đã xác nhận mở rộng logic BOM/QC/đóng gói; tám view gốc vẫn thiếu các chi tiết này và được bảo tồn. GAP02 còn thiếu NhaCungCap trong view (33 lớp unique trong tám view so với 34 lớp SRS); không thêm lớp vào nguồn. GAP05/GAP06 được xử lý thiết kế XOR/unique/projection, chưa kiểm chứng MySQL thực. GAP07 bổ sung snapshot/lease/generation, chính sách hữu hạn còn CHUA_DUYET. GAP08, GAP09, GAP10, GAP12–16 còn các thông số/quyền/support workflow nêu trong bảng.

Trước Giai đoạn 1 cần duyệt phạm vi nền tảng và các policy chặn migration được dùng. Có thể giới hạn schema nền tảng khi nghiệp vụ chưa chốt; không tự triển khai các bảng CHUA_DUYET. Không diễn giải xác nhận công nghệ thành quyền dựng backend/MySQL/Docker.

Bổ sung D04/D09 CHUA_DUYET: cách vô hiệu/reallocate hold bị ảnh hưởng khi điều chỉnh giảm khiến reserved>on_hand; mặc định an toàn của contract là409/rollback, không cắt ưu tiên ngầm. D12 CHUA_DUYET: tạo/phân chuyến dispatch và actor xác nhận giao; chỉ delivered được dùng làm quota trả.

## Nhật ký phê duyệt nền tảng — 12/10/2026

Người duyệt: người dùng, qua yêu cầu xác nhận phiếu nền tảng. Nguồn chi tiết [foundation_approval.md](foundation_approval.md). Đây là phê duyệt thiết kế, không phải lệnh triển khai Giai đoạn 1 hoặc nghiệm thu nền tảng/UC.

| ID | Nội dung DA_XAC_NHAN | Điều kiện/giới hạn |
|---|---|---|
| NT01 | Node24.21.0 LTS, Express5.2.1, TypeScript5.9.3, ESM/npm/lockfile riêng | backend, không đổi frontend |
| NT02 | Prisma7 và adapter tương thích MySQL, datasource mysql/FK thật | exact patch pin khi dựng sau lệnh; kết nối và migration thật phải có evidence trước nền tảng hoàn thành; 7.8.0 chỉ là ứng viên |
| NT03/04/05 | MySQL 8.4.8 LTS InnoDB (ngoại lệ được duyệt); utf8mb4/0900_ai_ci văn bản, identifier binary; BIGINT UNSIGNED PK/FK, UTC DATETIME(3)/DATE, lịch sử RESTRICT | kiểm constraint/driver thực tế sau lệnh; API ID chuỗi |
| NT06 | VND, tiền DECIMAL(20,0), lượng/đơn giá(20,6), hệ số(20,9); không làm tròn trung gian, rule lúc xác nhận chứng từ | mode/thời điểm dòng-vs-tổng/cách tổng hợp CHUA_DUYET, không tự HALF_UP; chưa rule thì chặn chốt tiền |
| NT07 | KhachHang1:N TaiKhoan; account nội bộ customer_id NULL, không UNIQUE customer_id; mỗi account một role | kiểm scope theo KH hiện hành; không chỉ theo created_by; multi-role ngoài phạm vi |
| NT08/09 | Session opaque MySQL HttpOnly+CSRF/RBAC, Argon2id; migration versioned reviewed+SQL native, không db push | chưa code auth/Prisma/schema/migrations |
| NT10/11/12 | Dev/test MySQL instances/credentials/volumes riêng; warehouse_db/test, shadow riêng; ComposeV2/profiles/health/secrets; Modular Monolith/migrations tăng dần | chỉ tạo sau lệnh riêng, không migrate policy nghiệp vụ chưa duyệt |
| AU01 | idle 30 phút, hard 8 giờ, không refresh token/remember-me | renew idle không kéo dài hard lifetime |
| AU02 | 5 lần sai/account trong 15 phút khóa tạm 15 phút, tách admin LOCKED | threshold IP CHUA_DUYET, không nhầm với reservation TTL |
| AU03 | password 12–128 ký tự, không cắt chuỗi | cấp/reset/support workflow chưa có quyền tự triển khai |

Các policy còn CHUA_DUYET: làm tròn chốt tiền/hao hụt BOM, capacity reservation UC13/factors, reservation TTL/renew/priority, kiểm kê freeze/lease/renew/cancel/affected holds, delivery/reception/disposition actors, re-QC/reversal/maker-checker/giá/FEFO/HSD/CI/backup. Không gán AU01/AU02 làm TTL giữ tồn hoặc khóa kiểm kê. 29 UC giữ nguyên, tất cả CHUA_LAM.

## Thực hiện Giai đoạn 1 và ngoại lệ đã được duyệt — 12/10/2026

Người dùng giao riêng dựng nền tảng, không triển khai UC. Docker Hub báo mysql:8.4.12 không tồn tại; người dùng chấp thuận mysql:8.4.8 nếu tag tồn tại. Manifest/pull/run đã kiểm thành công; dev/test cùng 8.4.8. NT03 hiện hành là 8.4.8; bản 8.4.12 trong phê duyệt trước là lịch sử.

NT02 pin Prisma CLI/Client/adapter-mariadb 7.10.0 trong phạm vi major 7 đã duyệt; 7.8.0 chỉ là ứng viên trước kiểm chứng. Overrides mariadb 3.5.4, mysql2 3.24.0, deepmerge-ts 8.0.0 và Swagger Parser 10.1.1 xử lý dependency audit. Validate/generate/build/connection/migration/shadow replay/tests đã kiểm thực; npm audit backend báo 0 vulnerabilities. Các NT/AU khác giữ nguyên.

Phạm vi migration gồm 8 bảng nền tảng và marker kỹ thuật, không toàn bộ schema 29 UC. Nền tảng CHO_NGUOI_DUNG_XAC_NHAN; chính sách nghiệp vụ CHUA_DUYET vẫn mở. Không lấy kết quả hạ tầng để đóng UC01 hoặc cho phép tự chuyển giai đoạn.

## Ghi nhận kiểm tra — 14/10/2026

[Bằng chứng mới nhất](phase1_verification.md) xác minh stack đã duyệt, không thay quyết định công nghệ/nghiệp vụ hoặc duyệt chính sách CHUA_DUYET. Các cảnh báo audit/lint/bundle và phần fresh migration/recovery chưa kiểm được công khai; chưa là nghiệm thu người dùng. [UC01 scope đề xuất](uc01_scope_proposal.md) liệt kê các điểm cần chốt trước code; không tự thêm schema/endpoints/fixtures dev hoặc sửa SRS.


Cập nhật đã duyệt 28/10: phiếu cấp nguyên liệu phải đủ dòng và đúng lượng snapshot kế hoạch, không sửa lượng/xóa dòng; ghi chú tùy chọn 2000 ký tự. User đã duyệt trực tiếp migration 202610280001_material_request_notes thêm notes NVARCHAR(2000) NULL trên Docker dev/test, không HTTT02. Mã nguồn kiểm tại create/submit, giữ quota/scope/audit; không đổi lịch sử/tồn. Tài liệu: docs/material_request_exact_quantity.md.
