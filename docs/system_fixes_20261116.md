# Sửa lỗi sau rà soát hệ thống — 16/11/2026

Người dùng giao sửa toàn bộ lỗi đã nêu trong báo cáo rà soát. Phạm vi dưới đây là mã nguồn đã sửa, không phải nghiệm thu hoặc bằng chứng đã triển khai trên Docker. Giữ nguyên thay đổi chưa commit có trước nhiệm vụ, bao gồm gợi ý xuất thành phẩm. Không sửa migration đã áp dụng, không thêm migration, không ghi dữ liệu hay cấp quyền trên DB.

| Phát hiện | Thay đổi |
| --- | --- |
| R01: cấp nguyên liệu từng phần đóng nguồn sớm | `inventory/repository.issuePosted()` chỉ cộng phiếu đã ghi sổ đúng generation. Tiến độ yêu cầu dùng lượng thực xuất; kiểm quota vẫn cộng cả reservation hiệu lực. |
| R02: bỏ qua scope xưởng nguồn QC khi gọi API trực tiếp | Dùng chung `qc/source-access.js` cho QC, điều phối nhập và xử lý lỗi. Tạo/sửa/xác nhận phân bổ kiểm xưởng nguồn; nhân viên ghi sổ phiếu đã xác nhận vẫn theo scope kho, không cần cấp scope xưởng mới. |
| R03: nhân viên kho không chọn được PO | Lookup PO nhận nguyên liệu độc lập scope xưởng; yêu cầu tài khoản nội bộ đang hoạt động và có scope kho nguyên liệu/kiểm soát ACTIVE. DTO không trả giá hay phân công xưởng. Endpoint vẫn dùng `receipts.postMaterial`. |
| R04: bootstrap thiếu cấu hình nhập thành phẩm | Nhánh cài mới gọi hai script scope đã được duyệt và script hệ số chiếm chỗ. Nhánh volume hoàn tất không tự cấp lại. Seed hệ số có application lock, completion marker, allowlist TP001–TP015 và BigInt/DECIMAL chính xác; giữ dữ liệu đã tồn tại. |
| R05: đọc reservation vượt phân công | Dùng chung kiểm truy cập đối tượng cho chi tiết phiếu và reservation; nhân viên phải được giao phiếu MATERIAL và phiếu đã gửi. Truy cập trực tiếp phiếu nháp cũng bị chặn. |
| R06: sửa vị trí đã khóa | Kho/vị trí phải ACTIVE mới sửa. PUT không đổi trạng thái. Thêm `POST /warehouses/{id}/locations/{locationId}/lock` và `/unlock`, cùng quyền `warehouses.write`, CSRF/idempotency/version/audit/transaction. Giữ kiểm khóa kiểm kê. Vị trí nguồn đã nghỉ sử dụng sau chuyển tồn không được mở khóa. Giao diện có nút riêng. |
| R07: kiểm tra schema cố định số cũ | Manifest nguồn hiện hành có 81 bảng/256 FK. Test kiểm chính xác tên bảng, đồ thị FK theo cột/đích, trạng thái enabled/trusted và lịch sử migration; không bỏ kiểm ràng buộc để làm xanh test. |
| R08: mật khẩu rõ trong tài liệu | Bỏ giá trị credential khỏi README, data và các hồ sơ đổi mật khẩu; chỉ dẫn tới guide `.artifacts` ignored. Không đổi mật khẩu, không sửa lịch sử Git. |

Quyết định bổ sung được người dùng chốt trong nhiệm vụ này: **KHSX chỉ tự hoàn thành khi đủ sản lượng kế hoạch đã nhập kho sau QC.** Áp dụng theo từng dòng phân công, không bù sản lượng thiếu của dòng này bằng lượng thừa dòng khác. Đếm lượng FINISHED đã ghi sổ từ QC thành phẩm đã xác nhận, đúng generation; truy ngược REWORK về phân công gốc để tính phần đạt tái xử lý đã nhập. Không tính reservation, phiếu chỉ phân bổ/xác nhận, nhập FAILED hoặc hàng trả nhập lại.

`production/progress.js` cập nhật trạng thái/version/audit cùng transaction nghiệp vụ. Gửi yêu cầu nhập TP hoặc thực xuất nguyên liệu bắt đầu tiến độ; nhập đủ từng dòng chuyển HOAN_THANH. Các thao tác phiếu nhập liên quan lấy khóa kế hoạch theo ID trước khóa header/nguồn để tuần tự hóa cập nhật tiến độ giữa các kho. Không backfill trạng thái kế hoạch/chứng từ lịch sử trong lần sửa này. Bản ghi cũ cần khảo sát riêng trước khi điều chỉnh dữ liệu.

Các sửa liên quan:

- Hỗ trợ SELECT có CTE trong lớp SQL để tổng DECIMAL của truy vết REWORK vẫn được serialize trước khi driver chuyển sang Number. Không đổi precision hoặc rounding.
- Phân trang/lọc scope tại SQL cho danh sách phương án xử lý lỗi và đợt giao nguyên liệu, tránh tải toàn bộ rồi mới cắt trang.
- Tách `Fields.jsx`/`formModel.js` khỏi trang tài nguyên, bỏ vòng import giữa trang và form chuyên biệt. Giữ hành vi các field đã có, kể cả phần gợi ý bán hàng chưa commit.
- Các màn danh sách và form lập kế hoạch/gợi ý nguyên liệu gắn kết quả tải với bộ lọc hiện hành; hủy hoặc bỏ qua phản hồi cũ khi đổi trang/nguồn/kho. Tên tham chiếu cũng gắn với account/permission/scope hiện hành. Không polling giữ phiên sống.
- Đồng bộ dependency của effect và giá tham khảo trong form mua; giữ giá người dùng đã chỉnh khi không đổi nguồn/nhà cung cấp. Nhận 401 thì xóa phiên trên giao diện.
- Tải Dashboard và trang tài nguyên theo nhu cầu. Build chia thành các chunk dưới ngưỡng cảnh báo hiện hành, thay vì tải toàn bộ biểu đồ cho mọi vai trò.
- Vite dùng native config loader trên Node 24; tránh lỗi bundle dependency native khi nạp config trên Windows. Không đổi framework/dependency.
- Đồng bộ mã HTTP thành công trong planned/runtime contract với controller/service; thao tác trạng thái trả 200, tạo mới trả 201, logout trả 204. Giữ schema response đã có.
- Bổ sung lại năm thao tác mở khóa danh mục còn thiếu trong file runtime contract; server đã merge từ planned, nay hồ sơ tĩnh cũng khớp đầy đủ.
- Script kiểm cú pháp dùng `vm.Script` trong cùng tiến trình, không báo nhầm lỗi cú pháp khi sandbox chặn spawn process.

Bộ kiểm tra hồi quy chuẩn bị tại `backend/tests/integration/review-regressions.test.js`: hai phiếu giữ tồn cùng yêu cầu; scope nguồn QC; scope người đọc reservation; nhập TP từng phần và hoàn thành KHSX; FAILED/REWORK; lookup PO không có scope xưởng; khóa/mở vị trí, stale version và vị trí ngưng sử dụng. Fixture dùng SQL Server thật với guard, savepoint cho nhánh bị từ chối và rollback toàn bộ. Không dùng mock DB để chứng minh transaction. Bộ test **chưa chạy**, tiếp tục theo lệnh hoãn unit/integration/E2E/regression. Test nền tảng cũng bổ sung kiểm exact DECIMAL qua CTE.

Kiểm tra được phép trong nhiệm vụ: CommonJS syntax, parse JS/JSX, cấu trúc OpenAPI, wiring handler, frontend lint/build và kiểm tra tĩnh manifest. Các kết quả cuối được ghi trong `current_status.md`. Đây không thay kết quả nghiệp vụ hoặc nghiệm thu 29 UC.

Cài mới Docker: trình tự chuẩn `initialize-docker.js` tự gọi cấu hình nhập TP một lần trước marker hoàn tất. Không tự nạp thêm PO/QC/chứng từ để bù lượng demo đã dùng hết. Volume đã khởi tạo vẫn giữ scope và cấu hình hiện có; script scope chỉ dùng theo đúng quyết định cấp quyền đã được duyệt, marker ngăn regrant. Lần sửa này không chạy bootstrap hay các script ghi DB.

Docker Desktop không kết nối được ở lần triển khai này (không có pipe `dockerDesktopLinuxEngine`). Vì vậy chưa rebuild/recreate container và chưa kiểm health runtime. Khi Docker hoạt động, có thể build và cập nhật riêng backend/frontend, không cần migration cho bản sửa này; giữ volume, dữ liệu và các nhóm container khác.
