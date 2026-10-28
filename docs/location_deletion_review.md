# Rà soát xóa vị trí mẫu — 28/10/2026

Khảo sát chỉ đọc trên SQL Server Docker `warehouse_db`, không thay đổi dữ liệu. Trước thao tác xóa phải đọc lại tồn và các liên kết trong cùng transaction vì dữ liệu có thể thay đổi.

| Vị trí | Kho | Trạng thái | Liên kết trực tiếp được tìm thấy |
|---|---|---|---|
| FS_DEMO_20261015_TP_A | Thành phẩm | Hoạt động | Không |
| FS_DEMO_20261015_TP_B | Thành phẩm | Hoạt động | Không |
| FS_DEMO_20261015_CTRL_A | Hàng lỗi | Hoạt động | Không |
| VT_NVL_KHOITAO | Nguyên liệu | Đã khóa | 20 số dư, 1 phạm vi kiểm kê, 40 dòng đếm, 20 dòng kiểm kê, 1 chứng từ chuyển vị trí |

Ba vị trí demo rỗng đã được thay theo yêu cầu bằng `VITRi-TP-A`, `VITRi-TP-B` (mỗi vị trí 5.000 kg) và `VITRi-HL-A` (1.000 kg), giữ sức chứa và điều kiện lưu từ vị trí cũ. Thao tác dùng một transaction, kiểm tra các khóa ngoại và có audit/marker; không đổi tồn hay quyền.

## Phương án xóa vật lý VT_NVL_KHOITAO — CHỜ DUYỆT

Kết quả đọc trên Docker `warehouse_db`: 20 số dư cũ đều bằng 0; 40 bút toán gắn với số dư cũ; một phạm vi kiểm kê, 40 dòng đếm, 20 dòng chi tiết kiểm kê, không có snapshot trực tiếp; một chứng từ chuyển gồm 20 dòng, một StockPosting và 40 bút toán chuyển (20 âm ở vị trí cũ, 20 dương ở vị trí mới). Có 20 số dư đích hiện còn hàng. Các tập bút toán có phần trùng nhau: không cộng 40 và 40 thành 80 bút toán riêng biệt.

Việc xóa chứng từ chuyển và 40 bút toán của nó sẽ làm **20 số dư đích mất bằng chứng nhận tồn**; xóa các bút toán ban đầu cũng làm mất bằng chứng hình thành tồn. Không được giữ số dư đích mà âm thầm xóa sổ nguồn, vì sẽ không còn đối chiếu được. Bản ghi audit có thể chứa mã vị trí, nhưng không thay thế chứng từ và sổ tồn.

Phương án cần chuẩn bị trước bất kỳ lệnh xóa nào:

1. Lập bản sao lưu khôi phục được của `warehouse_db` và lưu biên bản tổng tồn, từng lô, số dư nguồn/đích, sổ, chứng từ và danh sách ID liên quan; không can thiệp HTTT02 hay volume MySQL. Kiểm tra khả năng phục hồi trên một môi trường riêng trước khi thực hiện.
2. Phân tích đầy đủ khóa ngoại trực tiếp và gián tiếp của 20 số dư nguồn, các đợt đếm/kiểm kê, đề nghị điều chỉnh, StockPosting, sổ, chứng từ chuyển và cả dữ liệu ghi sau lúc khảo sát. Dừng nếu có chứng từ hoặc số dư mới ngoài danh sách được duyệt.
3. Trước khi xóa sổ chuyển, cần thiết kế và phê duyệt **chứng từ thay thế có thể đối chiếu** cho tồn hiện tại tại A–F, bảo toàn số lượng, lô, chất lượng, hệ số sức chứa và đối chiếu tồn theo từng lô. Đường đi cụ thể và cách xử lý lịch sử kiểm kê ban đầu cần duyệt riêng; không tự tạo chứng từ kiểm kê giả hoặc sửa số dư trực tiếp.
4. Sau khi chứng từ thay thế và phương án đối chiếu được duyệt, chuẩn bị script có danh sách ID chính xác, khóa giao dịch, kiểm tra cạnh tranh, kiểm tra trạng thái, thứ tự FK và audit; thử trên bản sao độc lập và chứng minh rollback. Bất kỳ khác biệt nào so với danh sách/đối chiếu phải dừng toàn bộ.
5. Chỉ sau phê duyệt phương án chi tiết và kết quả thử, thực hiện theo đúng phạm vi đã duyệt; đối chiếu lại từng lô/số dư trước và sau, kiểm tra chứng từ mới và khả năng nhập/xuất. Không tuyên bố lịch sử nguyên vẹn sau khi xóa.

Đây là **phương án sơ bộ**, chưa có script xóa lịch sử, chưa thống kê đầy đủ các phụ thuộc gián tiếp và chưa xác định được chứng từ thay thế hợp lệ. Cần quyết định về cách bảo toàn bằng chứng tồn trước khi trình một lệnh xóa cụ thể. Trong lúc chờ, `VT_NVL_KHOITAO` vẫn khóa và lịch sử được giữ.

Các vị trí A–F đang hoạt động và có dữ liệu tồn/quy tắc; không thuộc danh sách xóa. Mã `FS_DEMO_...` xuất hiện ở bảng trong ảnh là **mã kho**, không phải mã vị trí; ba kho này đang được sử dụng và không thuộc danh sách xóa.
