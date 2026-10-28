Cập nhật 28/10/2026: dùng duy nhất tài khoản xưởng `xuong01` quản lý cả ba xưởng XSX002 (Nước giải khát), XSX003 (Trà và nước trái cây), XSX004 (Nước tinh khiết). Mở lại xuong01, giữ mật khẩu và scope kho hiện có; khóa xuong_ngk/xuong_tra/xuong_nuoc và giữ uc01.workshop khóa, thu hồi phiên cả năm tài khoản. Không xóa tài khoản hoặc lịch sử, không gộp thêm xưởng. Script use-shared-workshop-account.js chạy transaction có guard và audit một lần sau consolidate; chạy lại không tự mở khóa/cấp lại scope. Các ghi nhận dùng ba tài khoản riêng bên dưới là lịch sử đã được thay thế. Không migration, không thay tồn/BOM/giá, không test nghiệp vụ/commit/reset.

# Gộp và tách tài khoản ba xưởng — 27/10/2026

User giao gộp đóng lon/PET, giữ ba xưởng nước giải khát / trà và nước trái cây / nước tinh khiết, xóa xưởng mẫu. User xác nhận riêng **khóa xuong01 và uc01.workshop**, cho ba tài khoản mới dùng mật khẩu cục bộ ngắn đã chỉ định. Không thay quyền tác nghiệp của role xưởng; chỉ cấp mỗi account một xưởng.

## Cách chuyển dữ liệu đã chuẩn bị

- Giữ ID/mã XSX002 và đổi tên “Xưởng nước giải khát”; gộp các liên kết của XSX001 sang XSX002 rồi xóa XSX001. XSX003/XSX004 giữ nguyên mã/tên. Không tái đánh số các mã hiện hữu để tránh xáo trộn lịch sử.
- Preflight thực tế: XSX001 có350lịch và1dòng KHSX; XSX002 có700lịch và1dòng KHSX. Không trùng ngày/SKU, nên chỉ chuyển workshop_id của350lịch, không cộng/đoán năng lực và không đổi calendar_id, sản lượng, BOM, phân bổ hay quota. Phiếu liên quan tăng version, giữ trạng thái/người duyệt/giá và audit ánh xạ trước/sau. Các yêu cầu xuất/nhập nếu có cũng chuyển cùng transaction.
- Xưởng mẫu có33lịch mẫu không dùng,16scope và không có KHSX/yêu cầu xuất/nhập. Kiểm lại trong transaction; phát hiện chứng từ hoặc phân bổ lịch phát sinh thì dừng review, không ép xóa. Xóa đúng33lịch chưa dùng, scope liên kết và dòng xưởng mẫu; audit lưu snapshot trước. Không xóa phiếu/BOM/tồn/ledger.
- Các quyền XSX001 đang có được hợp nhất sang XSX002, không nhân bản scope hoặc cấp cho nhóm khác. Chỉ bỏ liên kết tới xưởng mẫu bị xóa. Hai tài khoản xưởng chung bị LOCKED, revoke phiên hiện hữu; không xóa tài khoản hoặc audit cũ.
- Tạo xuong_ngk → XSX002; xuong_tra → XSX003; xuong_nuoc → XSX004. Role UC01_DEMO_workshop hiện có, customer_id NULL, mỗi tài khoản một scope xưởng. Cấp cùng ba scope kho nghiệp vụ cũ để tra cứu/cấp phát theo role, không thêm quyền hành động. Argon2id65536/3/1, không plaintext trong DB. Ngoại lệ mật khẩu ngắn chỉ đúng ba username+LOCAL_SIMPLE_code mới, flag/môi trường cục bộ như trước. Không mở chính sách cho account khác.
- Mật khẩu lấy Docker secret đã có theo lựa chọn người dùng, không hardcode/in log. Hướng dẫn riêng ghi `.artifacts/WORKSHOP-logins.local.md` trong volume demo_artifacts, không Git/GitHub.

Script consolidate-workshops chạy atomic với guard Docker warehouse_db và applock, completion AuditLog. Chạy lại không refill, không cấp lại scope, không mở khóa hoặc đổi mật khẩu. Bootstrap gọi script sau các seed nền; seed xưởng có nhánh ba xưởng khi đã consolidate. Seed legacy được chặn sau marker để không tạo lại xưởng mẫu/cấp lại scope cũ. Không schema migration mới, không sửa migrations APPLIED hoặc HTTT02.

## Nhận đúng phân công

Queue/workshop reader dùng EXISTS một dòng thuộc scope, không yêu cầu scope mọi xưởng trong cùng KHSX. DTO/list/read/material-demands chỉ trả các dòng của xưởng đang đăng nhập. Phần nhu cầu xưởng khác chỉ được dùng nội bộ để xét đủ vật tư toàn kế hoạch, không trả chi tiết ra tài khoản này. Scope của người lập/giám đốc và luồng mua hàng độc lập xưởng giữ nguyên. Sửa/duyệt/PO/nhập/xuất vẫn có gates cũ, không thêm LenhSanXuat.

Gợi ý CAN và PET dùng XSX002 chung; trà/trái cây XSX003, nước tinh khiết XSX004. Giữ các lịch thay thế đã được cấu hình. Không tự xóa hoặc đổi năng lực của các lịch này.

Trạng thái DA_CODE_CHUA_TEST. Không chạy unit/integration/E2E/regression, không tự tạo/duyệt KHSX/PO thử. Chỉ kiểm cú pháp/OpenAPI/build, preflight và đối chiếu dữ liệu/handoff hiện hữu sau thao tác đã được giao. Không commit/reset/drop database/volume.

## Kết quả thực tế27/10

- Còn XSX002/XSX003/XSX004; chuyển350lịch, xóa33lịch mẫu chưa dùng, chuyển liên kết kế hoạch#2. Dòng KHSX4/5/6 giữ lượng36/50/150 và BOM35/36/37.
- Account20 xuong_ngk,21 xuong_tra,22 xuong_nuoc ACTIVE, mỗi account1scope xưởng. Hai account chung LOCKED và revoke phiên. Guide riêng đã sao chép vào backend/.artifacts/WORKSHOP-logins.local.md sau kiểm git check-ignore, không in password/hash.
- Queue đọc bằng quyền/scope thực: NGK trả kế hoạch#1/XSX002; hai account khác không có phiếu đủ điều kiện. List chỉ có kế hoạch thuộc xưởng được giao. Dữ liệu hiện hữu chưa có kế hoạch nhiều xưởng: nhánh phân tách mới khảo sát code, chưa kiểm ghi/HTTP.
- --verify danh mục trả3xưởng; chạy lại consolidate trả ALREADY_CONSOLIDATED/noScopeRegrant/noAccountUnlock. Chưa thử khởi tạo volume trống; bootstrap/legacy guards đã được sửa và kiểm cú pháp.
- CommonJS trong image,62file frontend, OpenAPI và build thành công. Health connected sau cập nhật. Không chạy bộ test hoặc đăng nhập thử (auth ghi phiên), không sửa schema/migrations. Không commit/reset.
