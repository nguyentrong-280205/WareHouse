<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

## Chuyển công nghệ 16/10/2026

Đã code đủ UC01–UC27/UC29/UC30 trước chuyển engine; giữ DA_CODE_CHUA_TEST, không UC28. Đợt chuyển đổi hiện hành thay pool/repos/migration sang SQL Server Windows, giữ API/FE/business. Không đặt lại 29UC về CHUA_LAM và không đánh HOAN_THANH. Phần kiểm chứng hiện hành được ghi trong sqlserver_conversion.md; việc sao chép nguồn MySQL chưa được thực hiện.

# Nhiệm vụ triển khai toàn hệ thống — 15/10/2026

## Bàn giao mã nguồn — 16/10/2026

29UC đã tạo code FE/BE/MySQL/API/validation/RBAC, **DA_CODE_CHUA_TEST**. [Bàn giao thao tác/demo/giới hạn](full_system_handoff.md), [manifest API/bảng/file](full_system_manifest.md), [checkpoint](full_system_code_checkpoint.md). Bảy migration đã apply cả dev/test, seed FS11 đã chạy, UI Home/Dashboard dùng API, Compose build/khởi động. Chưa chạy các bộ test hoặc kiểm tay luồng nghiệp vụ, chưa nghiệm thu. Những báo cáo tiến độ/chặn FS trong các mục15/10 bên dưới là lịch sử trước checkpoint này; không còn chờ FS01–12. Không commit/reset/xóa dữ liệu/volumes.

## Cập nhật sau phê duyệt FS01–FS12

Người dùng đã duyệt toàn bộ nguyên văn FS01–FS12 và yêu cầu code ngay; không còn chặn nghiệp vụ ở phiếu đó. Đã bắt đầu mã nguồn thực tế: hai migration additive, shared decimal/validation/idempotency/transaction, catalog/order/production/purchasing services+repositories/controllers, lookup và frontend form/table tích hợp. Chưa hoàn tất29UC, chưa apply migration/seed mới, chưa chạy test/Docker. [Hồ sơ tiếp tục và giới hạn thực tế](full_system_resume.md). Mục nói “FS còn CHUA_DUYET” phía dưới là ghi nhận trước xác nhận, không được dùng để hỏi duyệt lại.

## Lệnh hiện hành

Người dùng giao trọn bộ29UC trong một nhiệm vụ, FE+BE+MySQL+API+RBAC theo SRS, thay quy trình từng UC ngày14/10. Không dừng sau mỗi UC, không yêu cầu người dùng test giữa quá trình. Không chạy unit/integration/E2E/regression, không restart Docker để kiểm từng UC; giữ tất cả test hiện có. Chỉ kiểm cú pháp/cấu hình tối thiểu khi cần. Chưa được tuyên bố PASS hoặc nghiệm thu cả hệ thống.

**TOÀN BỘ HỆ THỐNG CHƯA ĐƯỢC KIỂM THỬ VÀ CHƯA ĐƯỢC NGHIỆM THU.** UC01 có bằng chứng test riêng ngày14/10; không suy rộng sang hệ thống29UC và không tự đóng HOAN_THANH.

## Tiến độ thực tế lúc tiếp nhận

- Nguồn hiện có: health/auth MVC CommonJS/mysql2; React login/session/protected routes và Home/Dashboard mock/placeholder. Chưa có module nghiệp vụ của28UC còn lại.
- Source migrations chỉ2bản nền tảng; không giả định database đang có bảng nghiệp vụ chỉ vì có blueprint. Chưa chạy truy vấn DB/runtime trong nhiệm vụ mới.
- backend/prisma chỉ archive DA_THAY_THE; kiểm source/package/scripts không có dependency/import thực thi Prisma. Migrator đọc _prisma_migrations bằng mysql2 để verify legacy; giữ folder/history nguyên trạng.
- Git giữ11tracked deletions và các thư mục untracked có sẵn; không stage/commit/reset/restore. Không đọc secrets/env hoặc credentials demo.
- Đã phát hiện chặn nghiệp vụ/contract tại [phiếu FS01–12](full_system_policy_approval.md). Chưa tự chọn policy để bắt đầu migration ảnh hưởng tồn/tiền/phân quyền. Không đánh UC mới DANG_CODE hoặc DA_CODE_CHUA_TEST khi chưa có implementation.

## Kế hoạch liên tục theo phụ thuộc

| Đợt công việc trong cùng nhiệm vụ | Phạm vi đầu ra |
|---|---|
| Cơ sở dữ liệu/chia sẻ | Migration additive theo PK/FK/check/unique/dependency trong database_design; units/scopes/catalog/source quotas/stock/ledger/reservation/QC/stocktake, decimal chính xác và idempotency. Mọi lớp/bảng bổ sung phải có căn cứ SRS/thiết kế; dừng nếu không tương thích dữ liệu hiện có, không reset/drop/volume delete. |
| Auth/danh mục | Giữ UC01, bổ sung scope kho/xưởng với FK thật, không NULL=toàn quyền. UC10→UC25→UC19→UC30→UC20→UC06, mỗi UC có UI/API/database/validation/RBAC. |
| Đơn/kế hoạch/mua | UC11→UC02→UC03→UC26→UC27; yêu cầu nguồn/giá/BOM/version/approval, không LenhSanXuat hoặc công thức bí mật. |
| Nguyên liệu/điều phối/xưởng | UC29→UC13→UC21→UC22→UC15→UC23; mandatory holds UC15, QC/capacity/source quota, ledger atomic; UC13/15 là haiUC riêng. |
| Thành phẩm/giao hàng | UC24→UC04→UC16→UC12; dùng lại điều phối, QC nhiều đợt, xuất không đồng nghĩa giao thành công. |
| Hàng trả/lỗi | UC14→UC17→UC18; cách ly/trace delivered, không double-count vật lý, các nhánh không rõ lô/rework phải được chốt. |
| Kiểm kê/báo cáo | UC07→UC08→UC09→UC05; snapshot/count bất biến, lease hữu hạn/generation/recovery, adjustment có audit+ledger, reports tách units/buckets. |
| Bàn giao code | Liệt kê29UC/trang/API/migration/cấu trúc/files/thiếu sót, hướng dẫn npm/Compose và demo riêng tư, checklist test tay theo3luồng SRS. Trạng thái DA_CODE_CHUA_TEST tới khi người dùng kiểm/nghiệm thu. Không dùng bảng kế hoạch này như bằng chứng đã viết code. |

Thứ tự29mã giữ nguyên: UC01→UC10→UC25→UC19→UC30→UC20→UC06→UC11→UC02→UC03→UC26→UC27→UC29→UC13→UC21→UC22→UC15→UC23→UC24→UC04→UC16→UC12→UC14→UC17→UC18→UC07→UC08→UC09→UC05. Các đợt chỉ tổ chức công việc, không cổng nghiệm thu trung gian.

## Phạm vi kiến trúc khi code

Một Express backend, modules auth/customers/orders/production/purchasing/quality/warehouse/inventory/returns/stocktaking/reporting; chỉ tạo files có chức năng thật. Routes→controllers→services→repositories, SQL có tham số trong repository; orchestration dùng cùng connection transaction, khóa theo giao thức dùng chung. Giữ Node24.21.0/Express5.2.1/mysql2 3.24.0/MySQL8.4.8, không tự nâng minor hoặc đổi stack vì lệnh ghi8.4. React/JS/Vite/Tailwind/component/layout hiện có tiếp tục làm chuẩn; thay mock bằng API thật khi UC tương ứng được code, không tạo lại project.

## Giới hạn dừng hợp lệ

Chỉ dừng khi toàn phạm vi code xong, quyết định nghiệp vụ quan trọng chưa duyệt, nguy cơ mất dữ liệu/thao tác phá hủy, hoặc giới hạn kỹ thuật/ngữ cảnh. Khi dừng ghi thật phần đã làm/chưa làm; không cam kết chạy nền. Điểm dừng hiện tại là quyết định nghiệp vụ và khoảng trống contract ở phiếu FS01–12, không phải đợi nghiệm thu UC01 hay yêu cầu giao tiếp từng UC.
