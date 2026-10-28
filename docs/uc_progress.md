<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

# Tiến độ 29 UC

Hiện hành16/10/2026: **29 UC DA_CODE_CHUA_TEST**, không UC28, chưa HOAN_THANH/nghiệm thu. FE/BE/MySQL/API/RBAC đã tạo mã nguồn; bảy migration và seed hỗ trợ đã áp dụng; Compose đã build/khởi động. Không chạy unit/integration/E2E/regression hoặc kiểm tay nghiệp vụ. Home/Dashboard dùng API thật. Xem [bàn giao/kiểm tay29UC](full_system_handoff.md), [manifest](full_system_manifest.md), [checkpoint](full_system_code_checkpoint.md). Mọi ghi Giai đoạn0–1 hoặc trước16/10 bên dưới là lịch sử.

| UC | Tên theo SRS | Actor | Phụ thuộc | Trạng thái | Test tự động | Test thủ công | Commit | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| UC01 | Đăng nhập hệ thống | Tất cả người dùng | — | DA_CODE_CHUA_TEST | Không chạy15/10; lịch sử14/10 có14unit/17integration/browser PASS | Chờ kiểm tích hợp29UC sau bàn giao | Không commit | Code có sẵn; trạng thái chưa test áp dụng tích hợp toàn hệ thống mới, không phủ nhận bằng chứng cũ. [Evidence14/10](usecases/UC01_review.md) |
| UC02 | Lập kế hoạch sản xuất | Bộ phận lập kế hoạch | UC11, UC10, UC25 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC03 | Duyệt KHSX | Ban giám đốc | UC02 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC04 | QC thành phẩm | Bộ phận QC | UC24 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC05 | Thống kê báo cáo và cảnh báo | Quản lý kho, Ban giám đốc | UC06, UC09 và giao dịch UC12/16/17/21/23/18 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC06 | Tra cứu dữ liệu kho | Quản lý kho, Nhân viên kho | UC19, UC20, UC30 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC07 | Lập biên bản kiểm kê | Hội đồng kiểm kê | UC19, UC20, UC30; balance/ledger hợp lệ | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC08 | Xử lý chênh lệch kiểm kê | Quản lý kho | UC07 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC09 | Phê duyệt điều chỉnh tồn | Ban giám đốc | UC08 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC10 | Quản lý nguyên liệu | Quản lý kho | UC01 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC11 | Đặt đơn hàng | Khách hàng | UC25 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC12 | Xuất kho TP giao hàng | Nhân viên kho | UC15 (nguồn UC11) | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC13 | Điều phối nhập kho | Bộ phận quản lý kho | UC29 hoặc UC04 hoặc UC14; UC19 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | FS04/05 đã duyệt: UC13 không ghi tồn/giữ sức chứa; UC15 hold120phút, gia hạn1lần, hard240. Chưa kiểm chức năng. |
| UC14 | Kiểm tra hàng trả về | Bộ phận QC | UC12; tiếp nhận trả D05/D12 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC15 | Điều phối xuất kho | Bộ phận quản lý kho | UC11 hoặc UC22; tồn hợp lệ UC16/21/17 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | FS04/05 đã duyệt: UC13 không ghi tồn/giữ sức chứa; UC15 hold120phút, gia hạn1lần, hard240. Chưa kiểm chức năng. |
| UC16 | Nhập kho TP | Nhân viên kho | UC13 (nguồn UC04) | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC17 | Nhập kho hàng trả | Nhân viên kho | UC13 (nguồn UC14) | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC18 | Xử lý hàng lỗi/trả về | Quản lý kho | UC04 hoặc UC29 hoặc UC14; quyền duyệt D05 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC19 | Quản lý dữ liệu kho | Quản lý kho | UC01 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC20 | Quản lý lô thành phẩm | Quản lý kho | UC25, UC19 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC21 | Nhập kho nguyên liệu | Nhân viên kho | UC13 (nguồn UC29) | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC22 | Lập yêu cầu xuất NL | Xưởng sản xuất | UC03, UC10 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC23 | Xuất kho NL | Nhân viên kho | UC15 (nguồn UC22) | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC24 | Lập yêu cầu nhập TP | Xưởng sản xuất | UC03, UC20; UC23 tùy điều kiện sản xuất | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC25 | Quản lý thành phẩm | Quản lý kho | UC01 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC26 | Lập đơn mua NL | Bộ phận mua hàng | UC03, UC10 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC27 | Duyệt đơn mua NL | Ban giám đốc | UC26 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC29 | QC nguyên liệu | Bộ phận QC | UC27, UC30 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |
| UC30 | Quản lý lô nguyên liệu | Quản lý kho | UC10, UC19 | DA_CODE_CHUA_TEST | Chưa chạy | Chưa test | — | Đã tạo FE/BE/schema/validation/RBAC; chưa kiểm chức năng. Xem bàn giao và checklist. |

## Lịch sử đồng bộ thiết kế — đã thay bởi FS01–12

Actor điều phối đã xác nhận, reservation tồn UC15 bắt buộc; UC13 capacity hold/policy lease/TTL CHUA_DUYET. Không thay trạng thái thực hiện:29 UC vẫn CHUA_LAM, test runtime chưa chạy. Hồ sơ thiết kế không phải nghiệm thu UC và không phải quyền chuyển Giai đoạn 1.

## Tiến độ nền tảng Giai đoạn 1 — 12/10/2026

Nền tảng CHO_NGUOI_DUNG_XAC_NHAN. Backend/MySQL/SQL migrations, health/Swagger, frontend direct/Compose và tests hạ tầng đã chạy; xem [phase1_review.md](phase1_review.md). 29 UC phía trên vẫn CHUA_LAM. Chưa login hoặc CRUD nghiệp vụ. Chờ người dùng chạy thử, nghiệm thu nền tảng và giao UC riêng; không tự chuyển Giai đoạn 2.

## Kiểm lại nền tảng — 14/10/2026

Nền tảng giữ CHO_NGUOI_DUNG_XAC_NHAN; 29 UC vẫn CHUA_LAM. [Evidence](phase1_verification.md) ghi 11 unit/4 integration PASS và cảnh báo/chưa kiểm. [Đề xuất UC01](uc01_scope_proposal.md) chưa là lệnh code, không đổi UC01 sang DANG_CODE hoặc HOAN_THANH. Chờ người dùng xác nhận nghiệm thu/cảnh báo và giao UC01 riêng.
