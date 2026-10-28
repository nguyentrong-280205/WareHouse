<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

## Kết nối trực tiếp hiện hành

SSMS → Database Engine → Server `NGUYENTRONG-200\HTTT02` → Windows Authentication → Connect (Trust Server Certificate cho chứng chỉ development cục bộ) → Databases → Refresh → warehouse_db → Tables. Không cần Linked Server/ODBC. [Các bước và truy vấn an toàn](sqlserver_runbook.md#mở-trong-ssms). Hướng dẫn Linked Server bên dưới đã DA_THAY_THE; không thực thi script đó.

# Xem MySQL của dự án trong SSMS

SSMS không có kết nối MySQL native. Phương án giữ stack đã duyệt: **SSMS → SQL Server local HTTT02 → MySQL ODBC → MySQL Docker warehouse_db**. Không chuyển backend/schema/migration sang SQL Server.

## Kết quả khảo sát16/10/2026

- SQL Server `NguyenTrong-2005\HTTT02` đang chạy; truy cập local bằng `.\HTTT02` và Windows Authentication đã thành công. Windows login hiện tại có SQL sysadmin.
- Máy chưa có MySQL ODBC64-bit hoặc System DSN MySQL; chưa có Linked Server trên instance HTTT02 tại thời điểm khảo sát.
- Windows process hiện tại không có quyền Administrator. Quyền SQL sysadmin không thay quyền cài driver/System DSN của Windows.
- MySQL dự án publish tại127.0.0.1:3307, schema warehouse_db. Không mở cổng LAN/Internet, không sửa dữ liệu/schema/volumes hoặc tạo database SQL Server.
- Đã chuẩn bị [setup-ssms-mysql.ps1](../scripts/setup-ssms-mysql.ps1), chưa thực thi cài driver/tạo DSN/Linked Server. Không tuyên bố kết nối đã hoàn tất trước kết quả readiness.

Bộ duyệt tự động đã từ chối thực thi phiên bản ánh xạ warehouse_app vì có quyền ghi bypass RBAC/transaction. Script đã được sửa thành tài khoản kỹ thuật chỉ SELECT để xử lý đúng rủi ro này; không dùng bản cấu hình quyền ghi.

## Chạy thiết lập một lần

Tải MySQL Connector/ODBC64-bit từ [trang Oracle/MySQL chính thức](https://dev.mysql.com/downloads/connector/odbc/). Đã tải bản26.7.1 từ CDN chính thức MySQL và xác minh chữ ký Oracle hợp lệ; tương thích MySQL8.0+ theo trang nhà cung cấp. Script dùng MSI ở `backend/.artifacts/ssms-setup/mysql-connector-odbc-26.7.1-winx64.msi`, kiểm chữ ký Authenticode hợp lệ của Oracle trước khi cài. Binary nằm trong thư mục ignored, không đưa vào Git. Nếu tải tự động không thành công, tải MSI bằng trình duyệt và lưu đúng vị trí trên; không dùng file từ nguồn không rõ.

Mở **Windows PowerShell64-bit → Run as administrator**, dùng cùng Windows user đã kiểm, rồi chạy:

```powershell
Set-Location 'D:\Năm 4 HK1\PTUD\Code'
& .\scripts\setup-ssms-mysql.ps1
```

Nếu Execution Policy chặn script, chỉ đặt cho phiên này rồi chạy lại:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
& .\scripts\setup-ssms-mysql.ps1
```

Script cài driver nếu thiếu, không tự reboot; tạo System DSN64-bit `WarehouseMySQL` và Linked Server `WAREHOUSE_MYSQL` trên đúng local HTTT02. DSN không lưu password. Tạo tài khoản kỹ thuật warehouse_ssms_reader chỉ GRANT SELECT trên warehouse_db; mật khẩu ngẫu nhiên lưu trong backend/.artifacts/ssms-reader.local.json ignored và truyền SQL parameter, không in/log hoặc chép vào file SQL/arguments. Mapping chỉ cho Windows login chạy setup; không cấp mapping mặc định cho mọi SQL login. Không tạo/mở quyền cho tài khoản sa; dùng Windows Authentication trong SSMS.

Nếu DSN/Linked Server trùng tên nhưng cấu hình khác thì dừng, không ghi đè. Script không tự thay tùy chọn provider dùng chung, không xóa/reset dữ liệu. Provider/driver có thể cần cấu hình bổ sung theo lỗi thực tế; nếu readiness lỗi sau khi tạo một phần cấu hình, cần review hiện trạng, không drop/retry ép. Nếu thiếu Visual C++ runtime, cài prerequisite theo [hướng dẫn Oracle](https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-installation-binary-windows.html) rồi chạy lại.

## Dùng trong SSMS

1. Server name: `.\HTTT02` hoặc `NguyenTrong-2005\HTTT02`.
2. Authentication: **Windows Authentication**, đúng Windows user đã chạy setup.
3. Mở **Server Objects → Linked Servers → WAREHOUSE_MYSQL → Catalogs → warehouse_db** rồi Refresh nếu cần.
4. Mở [ssms-read-warehouse.sql](../scripts/ssms-read-warehouse.sql) trong New Query để xem ví dụ SELECT/OPENQUERY.

Database vẫn thuộc MySQL nên không xuất hiện như một database SQL Server ở mục Databases. Query bên trong OPENQUERY dùng cú pháp MySQL. Linked Server chỉ dùng warehouse_ssms_reader với SELECT; không có INSERT/UPDATE/DELETE hoặc quyền schema/GRANT. Không ánh xạ warehouse_app. Không dùng tài khoản ứng dụng khach01/giamdoc01 hoặc mật khẩu demo làm thông tin xác thực MySQL/SQL Server.

Nguồn kỹ thuật: [Microsoft — ODBC Linked Server/MSDASQL](https://learn.microsoft.com/en-us/sql/relational-databases/system-stored-procedures/sp-addlinkedserver-transact-sql), [Oracle — DSN Windows](https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-configuration-dsn-windows.html).
