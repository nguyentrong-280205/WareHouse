# Tiến độ mã nguồn và điểm tiếp tục —15/10/2026

**Nhật ký15/10 đã được thay bởi [checkpoint16/10](full_system_code_checkpoint.md).** Hiện29UC DA_CODE_CHUA_TEST; migration/seed và Compose đã triển khai, chưa kiểm thử nghiệp vụ/nghiệm thu. Xem [bàn giao](full_system_handoff.md) và [manifest](full_system_manifest.md). Các dòng DANG_CODE/chưaapply/chưaFE phía dưới giữ làm lịch sử, không là việc còn thiếu hiện tại.

**DANG_CODE; CHUA_KIEM_THU, CHUA_NGHIEM_THU. Chưa hoàn tất29UC.** Không unit/integration/E2E/regression hoặc restart Docker trong nhiệm vụ này.

## Đã viết code sau phê duyệt

- SQL additive 202610150001_catalogs.sql và 202610150002_orders_production.sql; **chưa apply vào database**. Hai SQL cũ/prisma archive/history/volumes không bị sửa/xóa.
- Shared business-policy, decimal BigInt (không Number cho lượng/giá, HALF_UP dòng, CEILING nhu cầu cuối, conversion exact), repository parameterized/identifier registry, Zod từ OpenAPI, transaction+idempotency/audit. Write kiểm account/role hiện hành dưới khóa account, nạp lại permissions/customer/scope, kiểm header/CSRF và version.
- Warehouse module: list/read/create/update/lock NL/TP/kho/lô, giá/quy cách append version, tạo/list vị trí; chặn sửa các định danh đã có tham chiếu. Scope kho mới chỉ creator. **Phần occupancy thực/capacity update khi đã có tồn còn cần hoàn thiện cùng inventory**; không coi UC19 xong.
- Orders: list/read theo customer, draft→confirm, giá server chọn khi confirm, amount HALF_UP/tổng dòng, packaging/quantity snapshot, audit/idempotency.
- Production: plan CHO_DUYET, kiểm source quota/BOM/calendar/workshop, phân lịch theo ngày đã cấu hình, approve/reject và tạo demand đúng BOM/unit/rounding; không LenhSanXuat. **Forecast free/demand cần hoàn thiện tích hợp giữa các kế hoạch và stock/reservation**, chưa đánh UC03 xong.
- Purchasing: draft/submit/approve/reject, FK nguồn plan/demand/supplier, unit/decimal, tính tiền, actor/scope/maker-checker. Chưa có UI PO và chưa hoàn thiện nhu cầu mua với tất cả nhánh stock/QC/PO nhận lỗi.
- Auth nạp TaiKhoan_Kho/TaiKhoan_Xuong sau migration; trước migration scope=[] deny. Health/Swagger giữ public, business router dùng auth+RBAC+validation. Source server chỉ đưa handlers đã đăng ký vào runtime contract, không coi105operations là đã code.
- React: ResourcePage/Fields theo Tailwind/layout hiện có; form lồng dòng, chọn units/SKU/packaging/BOM, list/search/page/error/loading/detail/lock, form vị trí; routes cho danh mục NL/TP, lô, kho, orders, plans. Form PO, màn inventory/QC/điều phối/return/stocktake/report chưa viết.
- docs/api_contract.yaml đã có bản mở rộng FS ban đầu từ sync-fs-contract.js (giá/packaging/lookups/detail); **bản script cập nhật tiếp theo đã chạy thành công sau xác nhận trực tiếp trong chat**. Không quảng cáo contract đang đồng bộ hoàn chỉnh.

## Trở ngại automatic approval review — ĐÃ GỠ CHẶN

Lệnh chạy sync-fs-contract.js bị automatic approval review từ chối2lần. Lý do được trả về: hệ thống duyệt vẫn coi scope “chỉ UC01” là đang có hiệu lực và nói xác nhận trong attachment không ghi đè scope đó. Đã đọc lại attachment ad168b97, AGENTS/decisions hiện hành để làm bằng chứng rồi yêu cầu xét lại riêng lệnh đồng bộ; vẫn bị từ chối. Không thực hiện cách vòng qua rejection (không chạy script bằng đường gián tiếp/không thay contract bằng công cụ khác để né).

Người dùng đã xác nhận trực tiếp trong chat phạm vi29UC, FS01–12 và thay đổi contract/schema/migration để gỡ chặn hệ thống duyệt; đây không phải xin lại quyền nghiệp vụ vì thiếu phê duyệt FS. Phần mã không phụ thuộc thao tác bị chặn vẫn tiếp tục được viết. Chưa thực hiện apply SQL/seed/Docker.

Lệnh kiểm cú pháp CommonJS `npm run check` đã chạy thành công sau khi tách khỏi thao tác contract. Kết quả này ở trước phần Purchasing mới nhất; không được gọi là tests PASS hoặc syntax toàn bộ bản cuối nếu chưa chạy lại.

Xác nhận trực tiếp thay thế giới hạn UC01; lệnh `node scripts/sync-fs-contract.js` đã được duyệt và chạy thành công. Không còn chờ xác nhận phạm vi. Code mới tiếp tục có request-service (cấp NL/nhập TP), QC ba loại và migration additive 202610150003_inventory_sources.sql; tất cả CHUA_TEST, SQL chưa apply.

## Cần tiếp tục trong cùng nhiệm vụ

1. Gỡ chặn automatic review bằng xác nhận trực tiếp người dùng; chạy lại đồng bộ contract đã được duyệt, không xin prompt từng UC. Giữ nguyên endpoints hiện hữu, review chi tiết các bổ sung FS09/10/12 còn thiếu: unidentified intake/resolve, nguồn QC/rework, evidence, alert-rule operations và lookup phụ thuộc.
2. Hoàn thiện source/schema inventory/StockPosting/ledger/reservation/gates; hiện chưa có module inventory runtime. Đồng bộ tên cột demandUsage: issue_id/material_request_line_id/qty_base, hold qty_initial/consumed/released và expires_at. Không duy trì metrics giả nếu schema chưa đủ.
3. Viết QC NL/TP/return và nguồn giao/hoàn thành, transaction receipt/issues (QC quota, capacity, FEFO, source/stock reservation, idempotency, audit). UC13/15 không on_hand/stock ledger; posting consume giữ và thay on_hand đúng1lần.
4. Giao/return/unknown/rework/disposal; stocktake lease60/hard240, immutable snapshots/count rounds, independent recount/evidence, adjustment/recovery+lazy gate và không auto cắt hold.
5. Hoàn thiện UI còn thiếu; menu/nút theo quyền; bỏ mock ở các trang được nối dữ liệu thật, không dùng endpoint giả để tính đủ UC.
6. Seed versioned hỗ trợ FS11 không overwrite: units, NCC, workshops/calendar/BOM/factors/scopes/role permissions được duyệt. Chưa chạy seed mới; bộ demo UC01 vẫn bộ cũ, không đọc/in credentials.
7. Hoàn thiện các chi tiết source đang cần review: location occupancy fields theo contract; capacity thay đổi không được tùy tiện chặn cả tăng capacity khi có location; search/filter parameters không được lặng lẽ bỏ qua; product edit không chèn lại packaging revision cũ; forecast demand không phân trùng free giữa các plan; lookup đọc phải phù hợp actor (BGĐ đọc plan/PO), input choices phải đủ trang, không chỉ20records.
8. Kiểm cú pháp/cấu hình tối thiểu; không chạy bộ test. Chỉ apply migration additive sau đồng bộ đủ source phụ thuộc/kiểm tương thích và tuân thủ runner/guards; bất tương thích/lỗi APPLYING dừng, không reset/drop/retry ép. Bàn giao29UC thật, hướng dẫn manual/npm/Compose/demo và trạng thái DA_CODE_CHUA_TEST khi đủ code; không HOAN_THANH.

## Không làm mất hiện trạng

SRS/tám Domain sources giữ nguyên; không sửa/xóa test; frontend framework/CSS/layout nguồn giữ. Git vẫn11tracked deletions cũ + các thư mục untracked; không commit/stage/reset/restore. Không đọc secrets, không thay database/volumes hoặc bật backend/Docker bằng source chưa hoàn chỉnh. Các câu “đã code” phía trên mô tả files tồn tại, không chứng minh API/SQL/UI chạy đúng.
