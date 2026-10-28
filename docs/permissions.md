Cập nhật 28/10/2026: dùng duy nhất tài khoản xưởng `xuong01` quản lý cả ba xưởng XSX002 (Nước giải khát), XSX003 (Trà và nước trái cây), XSX004 (Nước tinh khiết). Mở lại xuong01, giữ mật khẩu và scope kho hiện có; khóa xuong_ngk/xuong_tra/xuong_nuoc và giữ uc01.workshop khóa, thu hồi phiên cả năm tài khoản. Không xóa tài khoản hoặc lịch sử, không gộp thêm xưởng. Script use-shared-workshop-account.js chạy transaction có guard và audit một lần sau consolidate; chạy lại không tự mở khóa/cấp lại scope. Các ghi nhận dùng ba tài khoản riêng bên dưới là lịch sử đã được thay thế. Không migration, không thay tồn/BOM/giá, không test nghiệp vụ/commit/reset.

# Ma trận quyền — bản nháp Giai đoạn 0

Hiện hành27/10: ba account xưởng riêng chỉ có một TaiKhoan_Xuong; không đổi role/actions. Xưởng chỉ nhận lines/materialDemands của mình, cho cả kế hoạch phân công nhiều xưởng; queue dùng EXISTS phần được giao. Người lập/giám đốc vẫn kiểm scope toàn phiếu; mua hàng vẫn độc lập xưởng. Hai account xưởng chung đã khóa theo duyệt người dùng. [Chi tiết](workshop_consolidation.md).

Quyết định thay thế mới nhất26/10: PURCHASING cần tài khoản nội bộ và purchases.create để nhận yêu cầu vật tư thiếu, không cần TaiKhoan_Xuong. Đơn mua dùng quyền từng thao tác purchases.* độc lập xưởng; không tự cấp plans.read hoặc trả phân công/BOM. PLANNING/WORKSHOP vẫn kiểm scope xưởng. Scope kho và quota tồn/mua giữ nguyên. Các ghi gate xưởng cho mua hàng dưới đây là lịch sử đã thay trong phạm vi này.

Bổ sung26/10: queue KHSX `/production-plans/receiving-queue` kiểm `audience` cụ thể: PLANNING cần `plans.create`, PURCHASING cần `purchases.create`, WORKSHOP cần `materialRequests.create`; mỗi phiếu cần đủ scope xưởng. Ban giám đốc vẫn dùng `plans.decide`, giữ maker-checker. Người dùng xác nhận không mở rộng phạm vi mua hàng cho4xưởng mới. Thiếu người nhận đủ phạm vi thì báo blocked, không thay permission/scope. [Chi tiết](production_plan_handoff.md).

Bổ sung theo yêu cầu23/10: `PUT /production-plans/{id}` tái sử dụng `plans.create` cho bộ phận lập kế hoạch sửa phiếu `CHO_DUYET` trong phạm vi xưởng được cấp. Không thêm/cấp permission. Chặn API sửa khi đã duyệt hoặc có phụ thuộc; kiểm CSRF/idempotency/version, scope cũ/mới và maker-checker gồm người sửa cuối. [Chi tiết](production_plan_edit.md).

Hiện thực16/10/2026: permission bổ sung FS01–12 và scope kho/xưởng đã được seed tường minh cho demo cũ; API nghiệp vụ có middleware RBAC và kiểm scope/customer tại service. Business write nạp lại role/actions/customer/scopes dưới khóa account, không dùng created_by thay customer boundary. `/me` trả quyền hiện hành; cần đăng nhập lại để UI nhận scope/quyền mới. **DA_CODE_CHUA_TEST**, chưa kiểm bảo mật/quyền29UC. [Manifest API/quyền](full_system_manifest.md), [bàn giao/demo](full_system_handoff.md). Những ghi chưa seed/chỉ UC01 ngày14–15 bên dưới là lịch sử đã thay; không cho wildcard/NULL=toàn kho. Bộ demo giữ10account, chỉ một người Hội đồng; chưa tự thêm người đếm lại thứ hai.

## Bổ sung đã phê duyệt15/10/2026

Theo FS04/07/08/09/10/12: reservations.renew → Bộ phận QLK đúng kho/phiếu (1lần, hard240phút); stocktakes.create/cutoff/cancel/renew → QLK đúng scope; deliveries.confirm và returnReceptions.post → NVKho đúng scope; returnRequests.create → KH đúng customer; dispositions.decide → BGĐ khác proposer; reports.configureAlerts → QLK. Không mở quyền admin/toàn scope. Lookup nguồn chỉ dữ liệu tối thiểu để thao tác UC, không cấp toàn quyền orders.read/inventory.search cho actor chỉ cần lookup. Việc phê duyệt quyền không là chứng minh đã seed hoặc endpoint đã chạy. Đợt15/10 chưa sửa quyền trong database; triển khai seed/migrations còn tiếp tục.

Hiện 14/10/2026: UC01 đã triển khai theo lệnh riêng, CHO_NGUOI_DUNG_XAC_NHAN. Argon2id65536 KiB/3/1, session resolver thực, authenticate middleware trước RBAC; /me lấy quyền hiện hành. Demo 9 vai trò theo SRS §14 (Quản lý kho bao gồm Bộ phận quản lý kho UC13/15), 10 accounts, 2 cùng KH. Không cấp role quản trị hỗ trợ hoặc actions CHUA_DUYET (dispositions.decide, deliveries.confirm, reservations.renew, stocktakes.cancel/renew/create, capacity holds...). Mapping dùng x-permissions auth contract hiện có, không cấp wildcard toàn quyền. Scope kho/xưởng=[] chưa được gán không là toàn quyền. FE ẩn/chặn chức năng theo quyền, nhưng các API UC khác chưa được triển khai. [Thiết kế](usecases/UC01.md), [evidence](usecases/UC01_review.md), [local demo](uc01_local_runbook.md). Nội dung scaffold chưa login phía dưới là lịch sử Giai đoạn 1.

Nguồn SRS 2.3 mục 14. **Actor UC13/15 là Bộ phận quản lý kho, đã xác nhận**. Deny by default; quyền backend, ẩn nút chỉ hỗ trợ UI. Không tự cấp admin toàn quyền nghiệp vụ.

| Actor | UC cho phép theo nguồn | Permission/API tương ứng | Scope bắt buộc |
|---|---|---|---|
| Tất cả tài khoản | UC01 | auth.login/logout/me | login công khai; me/logout đúng session |
| Khách hàng | UC11 | orders.create/read/submit | customer_id lấy từ account, không nhận tùy ý trong body; đơn thuộc cùng KhachHang; không chỉ lọc theo created_by |
| Lập kế hoạch | UC02 | plans.create/read | đơn nguồn hợp lệ; xưởng được phân công; lookup SKU/xưởng/định mức chỉ đọc |
| Mua hàng | UC26 | purchases.create/read/update/submit | PO/nhu cầu/NCC hợp lệ; không tự duyệt |
| Ban giám đốc | UC03/05/09/27 | plans.decide, reports.read, adjustments.decide, purchases.decide | nguồn chờ duyệt; maker-checker đề xuất D04 |
| Quản lý kho | UC05/06/08/10/18/19/20/25/30 | reports.read, inventory.search, variances.verify, materials.*, dispositions.*, warehouses.*, productLots.*, products.*, materialLots.* | chỉ scope kho được cấp, quyền catalog cụ thể; không sửa tồn trực tiếp |
| Bộ phận quản lý kho | UC13/15 | receipts.allocate/confirmAllocation/reopen/cancel, issues.allocate/confirmAllocation/reopen/cancel | kho/lô/vị trí và nguồn hợp lệ; không receipts/issues.post |
| Nhân viên kho | UC06/12/16/17/21/23 | inventory.search, issues.postSale/postMaterial, receipts.postProduct/postReturn/postMaterial | scope kho; chỉ phiếu CHO_NHAP_XUAT đã điều phối, không âm thầm đổi phân bổ |
| QC | UC04/14/29 | productQc.*, returnQc.*, materialQc.* | nguồn đúng loại, lô/request/đợt nhận; không post tồn đạt |
| Xưởng sản xuất | UC22/24 | materialRequests.*, productRequests.* | workshop_id của account trùng dòng KHSX; không xem/sửa xưởng khác |
| Hội đồng kiểm kê | UC07 | stocktakes.count/submitCount/confirm | được phân công đúng phạm vi/đợt; không verify hoặc approve adjustment |
| Quản trị hỗ trợ | hạ tầng, chưa UC quản trị độc lập | accounts/roles cấp tài khoản/quyền nếu D07 duyệt | không mặc định quyền duyệt/chỉnh tồn; không UC28 |

Lookup tối thiểu được cấp với UC (SKU cho KH, nguồn QC cho điều phối, phiếu đã phân bổ cho kho, dữ liệu nguồn cho BGĐ) không đồng nghĩa cấp UC06 toàn bộ dữ liệu kho. API đọc chứng từ dùng quyền UC tương ứng và object scope; không expose email/giá mua/dữ liệu KH qua lookup tồn công khai. GET danh sách và GET/:id cùng kiểm scope; 404 có thể dùng khi ngoài scope để tránh lộ đối tượng.

Quyền chưa rõ: tiếp nhận hàng trả/cách ly và tạo yêu cầu trả (D05/D12), BGĐ duyệt phương án UC18 (đề xuất), Quản lý kho tạo scope/phân công UC07 (D09), FEFO exception, quản lý NCC/xưởng/định mức (D11). Chưa coi chúng được cấp chỉ vì schema có cột approver.

## Luồng đăng nhập đã xác nhận NT08/AU01–03

POST /auth/login không yêu cầu đã login; validate username/password, rate limit, so password hash (Argon2id đã xác nhận NT08), tài khoản ACTIVE; tạo session token random lưu hash và cookie HttpOnly/SameSite/Secure khi HTTPS. Trả accountId/displayName/role/permissions/scopes và CSRF token; không trả password/hash. GET /auth/me kiểm expiry/revoked/locked và tải quyền hiện hành. Logout hủy session và cookie, không có stock side effect. CSRF token bắt buộc thao tác ghi dùng cookie, CORS allowlist khi cross-origin; không lưu secret trong localStorage/log. AU01–03 đã xác nhận: idle 30 phút/hard 8 giờ, khóa tạm 15 phút sau 5 lần sai trong 15 phút, password 12–128; rate limit IP/cấp-reset còn CHUA_DUYET.

## Kiểm thử phân quyền mỗi UC

Ít nhất: chưa đăng nhập=401; sai role=403; đúng role sai warehouse/workshop/customer=403 hoặc 404 theo contract; sửa actor/scope_id trên body không đổi quyền; đường dẫn trực tiếp vẫn chặn; role bị khóa hoặc session revoke chặn ngay; account khách không xem đơn khách hàng khác. UC13/15 không thể gọi posting bằng quyền điều phối, kho không được sửa QC để mở quota. Hội đồng/QLK không duyệt điều chỉnh. Quyền duyệt không bỏ điều kiện trạng thái/version. Evidence phải có cả UI nút/route và API thật; không coi ẩn sidebar là bảo mật.

## Quyền bổ sung và trạng thái phê duyệt

| Permission/operation | Actor/scope | Trạng thái |
|---|---|---|
| issues.confirmAllocation/reservations.read/reservations.release | Bộ phận quản lý kho; phiếu chưa post và kho đã cấp | đã xác nhận quản lý phân bổ; release nguyên phiếu làm NHAP, không post khi mất hold |
| issues.postSale/postMaterial | Nhân viên kho đúng scope, own hold của phiếu hợp lệ | đã xác nhận; quyền điều phối không bao gồm posting |
| receipts.confirmAllocation | Bộ phận quản lý kho, QC chốt/scope/capacity | đã xác nhận; capacity reservation CHUA_DUYET |
| reservations.renew/capacityReservations.* | Bộ phận quản lý kho dự kiến | CHUA_DUYET; không cấp/triển khai khi chưa chốt TTL/policy |
| stocktakes.cancel/renew | actor quản lý phạm vi dự kiến | CHUA_DUYET; Hội đồng chỉ đếm/xác nhận, QLK verify, BGĐ approve; recovery hệ thống chỉ expire an toàn, không duyệt |
| deliveries.confirm, returnRequests.create, returnReceptions.post | actor tiếp nhận/giao hàng chưa được xác định trong 29 UC | CHUA_DUYET; API hỗ trợ nằm UC12/14, không UC mới |
| dispositions.decide | BGĐ dự kiến | CHUA_DUYET; UC18 vẫn có yêu cầu duyệt, không tự bypass |

Mọi endpoint đã có x-permissions; endpoint CHUA_DUYET chưa được cấp quyền chỉ vì có trong contract. API read receipt/issue cho NVKho dùng posting permission đúng loại thay vì bắt cấp quyền điều phối; OR quyền đọc tương ứng ghi x-permissions-mode=ANY_OF. ExpectedVersion, CSRF, idempotency không thay role/object scope. Session/AU01–03 và KhachHang1:N account đã xác nhận. Rate limit IP và cấp/reset tài khoản CHUA_DUYET. Múi giờ nghiệp vụ Asia/Ho_Chi_Minh.

## Nhiều tài khoản cùng khách hàng — NT07

customer_id lấy từ account hiện hành; nhiều account cùng KH có cùng boundary dữ liệu khách, vẫn phải đúng permission/action/state. Không tin customerId/creatorId trong body/query, không cho account khách truy cập KH khác hoặc account nội bộ NULL được suy ra toàn quyền KH. creator_id dùng audit, không là điều kiện ownership duy nhất. Không tự thêm vai trò/permission cho mỗi account mới; một account một VaiTroQuyen. GET/list/by-id và submit đều kiểm scope backend.

Session idle/hard/revoked/adminLOCKED được kiểm riêng; locked_until là khóa đăng nhập tạm AU02, không tự chuyển admin status LOCKED. Logout/lock/revoke không side effect tồn; renew idle không refresh hard expiry. Sai role403, khác khách404/403 theo contract; hết idle/hard401. AU03 kiểm12–128 ký tự, không cắt hoặc log password. Giới hạn IP/support workflow còn CHUA_DUYET.

## Scaffold nền tảng Giai đoạn 1 — 12/10/2026

Schema đã có role/permission/link/account/customer/session nhưng chưa seed quyền/tài khoản, chưa login hoặc session resolver. requirePermission mặc định từ chối principal thiếu (401), quyền thiếu (403); cookie có mặt không được coi là xác thực. assertCustomerScope kiểm principal và customer_id, không lấy created_by làm ownership. Các hàm này mới là primitives; kiểm scope ở từng controller/query của 29 UC vẫn phải thực hiện khi được giao. CSRF ràng buộc opaque cookie, không thay RBAC hoặc chứng minh phiên hợp lệ. [Bằng chứng](phase1_review.md).
