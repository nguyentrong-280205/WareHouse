<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

# Danh mục và gói triển khai 29 UC — bản nháp

Nguồn SRS2.3 mục5/6/11/12/14. Giữ nguyên29mã/tên và actor UC13/15. Lệnh15/10 đã giao toàn bộ29UC trong một nhiệm vụ, không dừng/test theo từng UC. Hiện UC01 có code/bằng chứng cũ, 28UC khác CHUA_LAM; gói dưới đây là kế hoạch, không là implementation. Các mục AC/test giữ làm thiết kế cho giai đoạn kiểm sau. [Kế hoạch](full_system_execution.md), [FS01–12 còn CHUA_DUYET](full_system_policy_approval.md).

## UC01 – Đăng nhập hệ thống

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Tất cả người dùng; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | — |
| Tiền điều kiện cụ thể | Tài khoản/role ACTIVE, không khóa đăng nhập tạm; login không yêu cầu phiên trước |
| Luồng chính SRS | Đăng nhập đúng và được giới hạn chức năng theo vai trò. |
| Đầu vào | Login JSON username/password + Origin allowlist; logout valid session/X-CSRF-Token/Idempotency-Key; không expectedVersion hoặc scope tùy ý |
| Đầu ra/hậu điều kiện/trạng thái | Session/quyền xác định; không tồn |
| Frontend | /login, AuthProvider, protected routes, logout, tên/vai trò/menu theo quyền; giữ phong cách cũ, landing `/` đã duyệt |
| Backend/API | auth.login/me/logout, Argon2id65536/3/1, session resolver/MySQL transaction, CSRF/RBAC/customer scope |
| Database/chứng từ | Tái dùng 8 bảng nền tảng; không migration/schema mới; chỉ security/session/audit/idempotency, không tồn |
| Kiểm thử riêng | Sai mật khẩu/locked; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-01-01–03 → T-UC01-AC01–03: tự động PASS; chờ test tay/nghiệm thu. [Evidence](usecases/UC01_review.md) |
| Khoảng trống | IP limits/cấp-reset/support CHUA_DUYET; kho/xưởng scope=[] deny, UC nghiệp vụ khác chưa code. [Thiết kế](usecases/UC01.md) |

## UC02 – Lập kế hoạch sản xuất

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Bộ phận lập kế hoạch; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC11, UC10, UC25 |
| Tiền điều kiện cụ thể | Đơn hợp lệ, xưởng/capacity/định mức D01/D11 |
| Luồng chính SRS | Chọn đơn hàng, TP, xưởng, lượng, lịch, lưu chờ duyệt. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | KHSX CHO_DUYET có dòng phân công |
| Frontend | /production-plans; /workshop-assignments; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | plans.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | KHSX/CTKHSX/định mức/nhu cầu; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Lượng âm/trùng lịch/vượt năng lực; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-02-01–03 → T-UC02-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC03 – Duyệt KHSX

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Ban giám đốc; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC02 |
| Tiền điều kiện cụ thể | KHSX CHO_DUYET |
| Luồng chính SRS | Xem chi tiết, duyệt hoặc từ chối có lý do; tự tính NL thiếu khi duyệt. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | DA_DUYET/TU_CHOI + nhu cầu thiếu; không tồn |
| Frontend | /production-plans/:id; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | plans.decide; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | KHSX/nhu cầu/audit; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Duyệt lặp/snapshot nhu cầu sai; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-03-01–03 → T-UC03-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC04 – QC thành phẩm

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Bộ phận QC; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC24 |
| Tiền điều kiện cụ thể | request TP CHO_QC, lượng hoàn thành |
| Luồng chính SRS | Mở yêu cầu nhập TP, đếm đạt/không đạt, lập biên bản. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | DA_CHOT, lượng đạt/lỗi riêng; không DAT |
| Frontend | /finished-goods/qc (mới); tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | productQc.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | QC TP/detail/request; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | accepted+rejected sai/quá nhận; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-04-01–03 → T-UC04-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC05 – Thống kê báo cáo và cảnh báo

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Quản lý kho, Ban giám đốc; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC06, UC09 và giao dịch UC12/16/17/21/23/18 |
| Tiền điều kiện cụ thể | scope QLK/BGĐ, dữ liệu đã commit |
| Luồng chính SRS | Lọc báo cáo tồn, nhập/xuất, HSD, hàng lỗi, cảnh báo. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | report nhóm đúng unit, cảnh báo, không sửa tồn |
| Frontend | /reports; /dashboard; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | reports.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | balance/ledger/alerts (read/config); migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Không dữ liệu/quarantine lẫn DAT/mixed units; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-05-01–03 → T-UC05-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC06 – Tra cứu dữ liệu kho

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Quản lý kho, Nhân viên kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC19, UC20, UC30 |
| Tiền điều kiện cụ thể | scope kho |
| Luồng chính SRS | Tra cứu SKU, lô, kho, vị trí và lịch sử chứng từ. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | Kết quả lọc/pagination, không ghi |
| Frontend | /reports (tra cứu); tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | inventory.search; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | balance/ledger/chứng từ (read); migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Filter sai/ID ngoài scope/rỗng; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-06-01–03 → T-UC06-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC07 – Lập biên bản kiểm kê

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Hội đồng kiểm kê; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC19, UC20, UC30; balance/ledger hợp lệ |
| Tiền điều kiện cụ thể | Phạm vi/actor D09, không overlap |
| Luồng chính SRS | Chốt phạm vi/thời điểm, đếm thực tế, lưu chi tiết và chênh lệch. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | snapshot/số đếm submitted bất biến; không tồn |
| Frontend | /inventory-counts; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | stocktakes.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | biên bản/scope lock/snapshot/count; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Vị trí trống/hàng thừa/AC-KK01–04,08–10; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-07-01–03 → T-UC07-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC08 – Xử lý chênh lệch kiểm kê

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Quản lý kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC07 |
| Tiền điều kiện cụ thể | Count submitted, chênh lệch đủ chứng cứ |
| Luồng chính SRS | Xác minh nguyên nhân, đếm lại, lập đề nghị điều chỉnh khi cần. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | verified/CHO_DUYET; không tồn |
| Frontend | /inventory-counts/:id/variances; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | variances.verify; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | xác minh/evidence/đề nghị/count lại; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Thiếu evidence/sai thời điểm/AC-KK07,09; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-08-01–03 → T-UC08-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC09 – Phê duyệt điều chỉnh tồn

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Ban giám đốc; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC08 |
| Tiền điều kiện cụ thể | Verified+CHO_DUYET, scope/cutoff hợp lệ |
| Luồng chính SRS | Duyệt/từ chối đề nghị; khi duyệt mới cập nhật tồn một lần. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | DA_DUYET+post một lần hoặc TU_CHOI |
| Frontend | /inventory-counts/:id/adjustments; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | adjustments.decide; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | đề nghị/balance/posting/ledger; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | AC-KK05/06, duyệt cạnh tranh/rollback; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-09-01–03 → T-UC09-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC10 – Quản lý nguyên liệu

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Quản lý kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC01 |
| Tiền điều kiện cụ thể | đúng QLK |
| Luồng chính SRS | Thêm/sửa/khóa danh mục NL và đơn vị chuẩn. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | Danh mục active/locked; không tồn |
| Frontend | /materials/catalog (mới); tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | materials.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | NguyenLieu/DonViTinh; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Mã trùng/xóa đã dùng; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-10-01–03 → T-UC10-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC11 – Đặt đơn hàng

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Khách hàng; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC25 |
| Tiền điều kiện cụ thể | KH own account; SKU active |
| Luồng chính SRS | Chọn TP, số lượng, thông tin giao và xác nhận. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | Đơn XAC_NHAN, dòng đơn vị/giá snapshot |
| Frontend | /orders (mới); tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | orders.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | DonHang/ChiTietDonHang; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Lượng sai/SKU khóa/đơn khách khác; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-11-01–03 → T-UC11-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC12 – Xuất kho TP giao hàng

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Nhân viên kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC15 (nguồn UC11) |
| Tiền điều kiện cụ thể | PXK SALE CHO_NHAP_XUAT; nguồn/tồn/QC/HSD hợp lệ |
| Luồng chính SRS | Chọn đơn hàng, kho/lô/vị trí đạt QC theo FEFO, lập xuất. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | HOAN_THANH; giảm TP, tăng đã xuất; giao riêng D12 |
| Frontend | /finished-goods/issues; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | issues.postSale; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | PXK/order lines/balance/ledger; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Lô hết hạn/hold/xuất cạnh tranh; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-12-01–03 → T-UC12-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC13 – Điều phối nhập kho

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Bộ phận quản lý kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC29 hoặc UC04 hoặc UC14; UC19 |
| Tiền điều kiện cụ thể | QC chốt còn quota; vị trí/sức chứa hợp lệ |
| Luồng chính SRS | (1) Chọn nguồn và phần đạt chưa nhập. (2) Kiểm tra loại kho, điều kiện bảo quản, sức chứa và khóa phạm vi. (3) Phân bổ lượng theo lô/vị trí, quy đổi cơ sở. (4) Lưu phiếu nhập NHAP và chi tiết. (5) Xác nhận toàn bộ phân bổ hợp lệ, chuyển CHO_NHAP_XUAT, ghi người/thời điểm/phiên bản và audit. (6) Bàn giao UC16/17/21. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | CHO_NHAP_XUAT; on_hand/stock ledger không đổi |
| Frontend | /materials/receipts và /finished-goods/receipts, bước điều phối; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | receipts.allocate, receipts.confirmAllocation; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | PNK/chi tiết/coordinator/version/audit; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Vượt QC/capacity/stale/scope; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-13-01–05 → T-UC13-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC14 – Kiểm tra hàng trả về

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Bộ phận QC; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC12; tiếp nhận trả D05/D12 |
| Tiền điều kiện cụ thể | Có hàng nhận trả, đơn/lô giao nguồn hoặc cách ly chưa rõ |
| Luồng chính SRS | Đối chiếu yêu cầu/đơn gốc, QC số thực nhận và tình trạng. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | Kết luận QC và restock_permitted; không tự DAT |
| Frontend | /returns/qc (mới); tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | returnQc.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | yêu cầu trả/detail/QC/quarantine; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Không rõ lô/số trả vượt giao/seal lỗi; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-14-01–03 → T-UC14-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC15 – Điều phối xuất kho

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Bộ phận quản lý kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC11 hoặc UC22; tồn hợp lệ UC16/21/17 |
| Tiền điều kiện cụ thể | Nguồn còn cần, tồn DAT còn hạn |
| Luồng chính SRS | (1) Chọn nguồn và lượng còn cần xuất. (2) Tra cứu tồn/lô/vị trí trong phạm vi quyền. (3) Đề xuất FEFO/FIFO, kiểm tra QC/HSD/khóa. (4) Phân bổ vào phiếu xuất NHAP và chi tiết. (5) Kiểm tra lượng cơ sở/tồn/nguồn, xác nhận CHO_NHAP_XUAT + mandatory hold và audit atomic. (6) Bàn giao UC12/23. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | CHO_NHAP_XUAT; balance/ledger không đổi |
| Frontend | /materials/issues và /finished-goods/issues, bước điều phối; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | issues.allocate, issues.confirmAllocation; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | PXK/chi tiết/DatGiuTon/TonKho.qty_reserved/coordinator/version/audit; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | hai confirm tranh hold/source quota; FEFO/HSD/hold expiry/cancel/retry không double subtraction; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-15-01–05 → T-UC15-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC16 – Nhập kho TP

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Nhân viên kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC13 (nguồn UC04) |
| Tiền điều kiện cụ thể | PNK FINISHED CHO_NHAP_XUAT; quota/capacity hợp lệ |
| Luồng chính SRS | Chọn yêu cầu nhập đã QC đạt, lô/vị trí, lập PNK. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | HOAN_THANH; DAT TP tăng đúng quota |
| Frontend | /finished-goods/receipts; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | receipts.postProduct; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | PNK/QC TP/balance/ledger; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Nhập trùng/vượt đạt/stale/rollback; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-16-01–03 → T-UC16-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC17 – Nhập kho hàng trả

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Nhân viên kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC13 (nguồn UC14) |
| Tiền điều kiện cụ thể | QC cho phép, đã điều phối, quota/position hợp lệ |
| Luồng chính SRS | Nhập lại chỉ lượng hàng trả được QC cho phép. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | chuyển quarantine→DAT nếu đã nhận; không tăng vật lý hai lần |
| Frontend | /returns/receipts (mới); tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | receipts.postReturn; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | PNK/return QC/quarantine/balance/ledger; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Chưa QC/quota vượt/capacity/rollback; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-17-01–03 → T-UC17-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC18 – Xử lý hàng lỗi/trả về

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Quản lý kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC04 hoặc UC29 hoặc UC14; quyền duyệt D05 |
| Tiền điều kiện cụ thể | Nguồn lỗi và phương án đã duyệt khi thực hiện |
| Luồng chính SRS | Phân loại hàng cách ly, ghi phương án tái xử lý/trả/tiêu hủy có duyệt. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | phương án/lịch sử; tồn chỉ đổi bằng chứng từ thực tế |
| Frontend | /defective-goods (mới); tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | dispositions.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | xử lý lỗi/approval/stock docs/ledger; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Không duyệt/quá lượng lỗi/nhầm restock; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-18-01–03 → T-UC18-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC19 – Quản lý dữ liệu kho

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Quản lý kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC01 |
| Tiền điều kiện cụ thể | đúng QLK |
| Luồng chính SRS | Quản lý kho, khu vực (thuộc tính vị trí), vị trí và sức chứa. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | Kho/vị trí/capacity |
| Frontend | /storage-locations; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | warehouses.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | Kho/ViTriLuuKho; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Xóa vị trí có tồn/đơn vị sai; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-19-01–03 → T-UC19-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC20 – Quản lý lô thành phẩm

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Quản lý kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC25, UC19 |
| Tiền điều kiện cụ thể | SKU/version active |
| Luồng chính SRS | Ghi lô, NSX, HSD, trạng thái và truy vết. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | Metadata lô TP, không tồn |
| Frontend | /lots?type=product; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | productLots.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | LoThanhPham; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | HSD sai/xóa lô đã dùng; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-20-01–03 → T-UC20-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC21 – Nhập kho nguyên liệu

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Nhân viên kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC13 (nguồn UC29) |
| Tiền điều kiện cụ thể | PNK MATERIAL CHO_NHAP_XUAT; kiểm lại nguồn |
| Luồng chính SRS | Chọn lượng NL đạt QC, lô, kho/vị trí, lập PNK. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | HOAN_THANH; tăng DAT NL đúng accepted |
| Frontend | /materials/receipts; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | receipts.postMaterial; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | PNK/QC NL/balance/posting/ledger; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Hai nhập tranh quota/rollback/capacity; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-21-01–03 → T-UC21-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC22 – Lập yêu cầu xuất NL

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Xưởng sản xuất; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC03, UC10 |
| Tiền điều kiện cụ thể | KHSX DA_DUYET, đúng xưởng |
| Luồng chính SRS | Chọn chi tiết KHSX đã duyệt, NL và lượng cần cấp. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | DA_GUI, lượng yêu cầu; không tồn |
| Frontend | /material-requests (mới); tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | materialRequests.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | request NL/detail/nhu cầu; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Vượt định mức/sai xưởng; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-22-01–03 → T-UC22-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC23 – Xuất kho NL

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Nhân viên kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC15 (nguồn UC22) |
| Tiền điều kiện cụ thể | PXK MATERIAL CHO_NHAP_XUAT; check lại nguồn/tồn |
| Luồng chính SRS | Chọn yêu cầu hợp lệ, lô/vị trí theo FEFO, lập PXK. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | HOAN_THANH; giảm NL, cập nhật đã cấp |
| Frontend | /materials/issues; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | issues.postMaterial; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | PXK/request NL/balance/ledger; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Hai xuất cùng lô/overfulfill/rollback; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-23-01–03 → T-UC23-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC24 – Lập yêu cầu nhập TP

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Xưởng sản xuất; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC03, UC20; UC23 tùy điều kiện sản xuất |
| Tiền điều kiện cụ thể | KHSX duyệt, đúng xưởng, kết quả hoàn thành |
| Luồng chính SRS | Ghi xưởng, KHSX, TP/lô, số hoàn thành, gửi QC. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | CHO_QC, lô/request; không tồn |
| Frontend | /finished-goods-requests (mới); tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | productRequests.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | request TP/detail/lô hoàn thành; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Thiếu lô/vượt lượng nguồn/sai xưởng; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-24-01–03 → T-UC24-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC25 – Quản lý thành phẩm

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Quản lý kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC01 |
| Tiền điều kiện cụ thể | đúng QLK |
| Luồng chính SRS | Quản lý SKU chai/lon, dung tích, đơn vị, quy cách đóng gói. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | SKU/version; không hồi tố quy cách |
| Frontend | /finished-goods/catalog (mới); tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | products.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | ThanhPham/QuyCachDongGoi; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Hệ số sai/version đã dùng; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-25-01–03 → T-UC25-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC26 – Lập đơn mua NL

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Bộ phận mua hàng; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC03, UC10 |
| Tiền điều kiện cụ thể | nhu cầu thiếu, NCC hợp lệ |
| Luồng chính SRS | Chọn NL thiếu, NCC, chi tiết số lượng/giá, gửi BGĐ. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | PO CHO_DUYET, giá/đơn vị snapshot |
| Frontend | /purchases (mới); tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | purchases.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | PO/chi tiết/NCC/phân bổ nhu cầu; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Thiếu NCC/chi tiết/đặt trùng nhu cầu; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-26-01–03 → T-UC26-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC27 – Duyệt đơn mua NL

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Ban giám đốc; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC26 |
| Tiền điều kiện cụ thể | PO CHO_DUYET |
| Luồng chính SRS | Xem PO và duyệt/từ chối có lý do. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | DA_DUYET/TU_CHOI; không tồn |
| Frontend | /purchases/:id; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | purchases.decide; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | PO/audit; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Duyệt lặp/sai role; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-27-01–03 → T-UC27-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC29 – QC nguyên liệu

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Bộ phận QC; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC27, UC30 |
| Tiền điều kiện cụ thể | PO DA_DUYET, dòng giao/lô |
| Luồng chính SRS | Đối chiếu PO và lô giao, đếm đạt/không đạt, lập biên bản. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | QC DA_CHOT, quota accepted/rejected; không DAT |
| Frontend | /materials/qc; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | materialQc.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | giao NL/QC header/detail; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | Tổng QC sai/kiểm trùng/quá nhận; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-29-01–03 → T-UC29-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## UC30 – Quản lý lô nguyên liệu

| Mục | Thiết kế/nguồn |
|---|---|
| Actor/quyền | Quản lý kho; permission theo permissions.md; role+scope tại backend |
| Phụ thuộc | UC10, UC19 |
| Tiền điều kiện cụ thể | NL/unit active |
| Luồng chính SRS | Quản lý mã lô, NSX, HSD, truy vết và trạng thái. |
| Đầu vào | Dòng nguồn/danh mục, filter hoặc thông tin đăng nhập tùy UC; payload chính xác trong api_contract.yaml; gửi expectedVersion và Idempotency-Key khi ghi chứng từ |
| Đầu ra/hậu điều kiện/trạng thái | Metadata lô NL, không tồn |
| Frontend | /lots?type=material; tái sử dụng AppLayout/Table/Card/Button/Badge/SearchBox, loading/empty/error, form validation theo frontend_audit; route mới chỉ sau duyệt |
| Backend/API | materialLots.*; validation, RBAC/scope, state transition, business rules, transaction nếu ghi |
| Database/chứng từ | LoNguyenLieu; migration tối thiểu được duyệt, lịch sử bất biến; không sửa tồn qua form |
| Kiểm thử riêng | HSD<NSX/xóa lô đã dùng; luồng đúng + quyền/trạng thái sai + invalid/rollback; API/UI/DB và regression UC phụ thuộc |
| AC/test ID | AC-30-01–03 → T-UC30-ACxx; thêm AC-KK liên quan; chưa chạy |
| Khoảng trống | D01–D14 theo decisions; không tự triển khai policy chưa chốt |

## Bổ sung gói triển khai/kiểm thử hiện hành

| UC liên quan | FE tương lai | BE/database | Test dự kiến |
|---|---|---|---|
| UC02/03/22/26 | version BOM/needs/issued/held/free theo base unit | plan create CHO_DUYET; demands/source quotas, chỉ approved dùng | T-BOM-VERSION, T-DEMAND-NO-DOUBLE-RESERVE; rounding/hao hụt CHUA_DUYET |
| UC13/21/16/17 | QC batches/remaining quota/multi-position/capacity | eligible QC lines; revalidate locks/QC quota/capacity; capacity hold CHUA_DUYET | T-QC-PARTIAL, T-CONC-QC, T-CONC-CAPACITY |
| UC15/12/23 | onhand/reserved/available + hold state/expiry | confirm hold atomically, source quota; release/cancel invalidate allocation; post consume | T-CONC-RESERVE, T-RESERVE-CONSUME, T-RESERVE-EXPIRE |
| UC04/14/29/24 | batch/lot/partial result, source fulfillment state | QC source aggregate inspected/accepted/received counters, traceable1:N | T-QC-MULTIBATCH, T-QC-NO-OVERLAP, T-QC-PARTIAL |
| UC12/14/17/18 | dispatch vs delivered vs return/quarantine | delivery/reception source lines; typed helper API CHUA_DUYET actor | T-RETURN-DELIVERED, T-RETURN-PARTIAL, T-NO-DOUBLE-PHYSICAL |
| UC07/08/09 | scope/cutoff/round/lease/interruption and stale proposal errors | bounded locks/generation, invalidation before unlock, new snapshot after interruption | T-LOCK-RECOVERY, T-ADJUSTMENT-STALE, T-COUNT-IMMUTABLE |
| UC25/19/20/30/05/06 | SKU units/capacity unit grouped metrics | versioned factors; UTC/Asia/Ho_Chi_Minh | T-UOM-VERSION, T-CAPACITY-DIMENSION, T-TIMEZONE |

Tất cả chỉ kế hoạch, CHUA_CHAY; gói 29 UC phía trên giữ phạm vi FE/BE/DB/test độc lập. Support workflow không UC mới, actor/policy CHUA_DUYET không tự triển khai.

## Phê duyệt nền tảng tác động UC01/11/26 — 12/10/2026

UC01 dùng session HttpOnly+CSRF/Argon2id, idle 30 phút/hard 8 giờ,5 lần sai trong 15 phút khóa 15 phút, password 12–128. UC11 scope theoKhachHang1:N accounts, account_internalcustomer_idNULL, không chỉ created_by. UC11/26 dùngVND/amount20,0,qty-price20,6/factor20,9, không intermediate rounding; rounding lúc xác nhận mode/line-total CHUA_DUYET. API định nghĩa error/gates/test IDs trong testing_strategy. Không code hoặc nghiệm thu UC, tất cả 29 UC vẫnCHUA_LAM.
