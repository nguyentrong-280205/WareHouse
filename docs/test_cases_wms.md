# Bộ test case WMS Nhà Máy

Bộ kiểm thử gồm **29 UC, 8 ca mỗi UC, tổng cộng 232 ca**. Các ca bao phủ luồng nghiệp vụ, dữ liệu sai, phân quyền, trạng thái, kiểm tra kho/vị trí, cập nhật đồng thời và hành vi giao diện.

## Cách đọc và chuẩn bị

- `D` là ngày nghiệp vụ tại thời điểm chạy ca, theo `Asia/Ho_Chi_Minh`. `D+7` là bảy ngày lịch sau `D`. Dùng ngày tương đối khi dựng lại dữ liệu.
- Mã phiếu, mã mặt hàng, lô, tên và lượng trong bảng là dữ liệu mẫu. Tạo dữ liệu tương đương trong môi trường kiểm thử. Hai lượt thử trong một ca phải bắt đầu từ cùng tiền điều kiện nếu lượt đầu đã thay đổi dữ liệu.
- `KHSX` là kế hoạch sản xuất, `NL` là nguyên liệu, `TP` là thành phẩm, `QC` là kiểm tra chất lượng, `PO` là đơn mua nguyên liệu, `HSD` là hạn sử dụng. FEFO ưu tiên lô hết hạn sớm trong các lô đủ điều kiện.
- Một tác vụ ghi sổ cần đối chiếu trạng thái chứng từ, tồn thực tế, lượng giữ và sổ biến động. Ca phân quyền dùng đúng vai trò và phạm vi khách hàng, kho hoặc xưởng. Với ca duyệt độc lập, chuẩn bị hai tài khoản riêng.
- Các ca có thao tác ghi dùng Docker `warehouse_test` sau khi kiểm tra định danh máy chủ, cơ sở dữ liệu, tài khoản kết nối và marker. Dùng dữ liệu thử có mã riêng để đối chiếu và dọn sau khi chạy.

## Kết quả chạy trực tiếp trên trình duyệt ngày 22/11/2026

Chạy bằng Chrome với frontend build từ mã hiện tại, backend Express thật và SQL Server Docker `warehouse_test`. Kết quả cuối của lượt chạy là **24 đạt, 0 lỗi trong các ca đã chạy, 208 chưa chạy**. Các mã bên dưới đã đạt. Mọi mã khác trong tài liệu là kịch bản chưa chạy trên trình duyệt.

- **UC01** `UC01-T01` đến `UC01-T06`. Đăng nhập, từ chối sai mật khẩu/tài khoản khóa, điều hướng khi chưa có phiên, tải lại và đăng xuất.
- **UC05** `UC05-T06`, `UC05-T07`, `UC05-T08`. Báo cáo rỗng, chặn khách hàng xem tổng quan kho, kiểm tra giao diện ở 390 × 844 px.
- **UC06** `UC06-T06`. Tìm mã lô không tồn tại và hiển thị trạng thái rỗng.
- **UC10** `UC10-T01`, `UC10-T02`, `UC10-T03`, `UC10-T04`, `UC10-T06`. Tạo, chặn mã trùng và thiếu đơn vị, sửa điều kiện bảo quản, khóa rồi mở khóa nguyên liệu.
- **UC11** `UC11-T01` đến `UC11-T05`, và `UC11-T08`. Tạo nháp, tự điền và bổ sung dữ liệu giao, giới hạn ngày giao, xác nhận đơn, đóng biểu mẫu bằng bàn phím. Xác nhận hai thùng ghi đúng 48 lon và 50.000 VND.
- **UC30** `UC30-T01` đến `UC30-T03`. Sinh mã lô, giữ nguyên mã và nguyên liệu khi sửa, chặn lô thiếu HSD bắt buộc. Phiên thử dùng nguyên liệu riêng nên mã sinh chứa thêm ID nguyên liệu, theo quy tắc cho mã ngoài danh mục chuẩn.

Đăng nhập thành công với **9 vai trò** và tải được **34 tuyến giao diện**. Tuyến `/users` chặn khách hàng đúng quyền. Không ghi nhận lỗi JavaScript trên trang hoặc phản hồi API 5xx trong các lượt hoàn tất. Kiểm tra mở trang xác nhận điều hướng và quyền truy cập. Các ca ghi sổ, kiểm kê, duyệt kế hoạch và QC còn ở trạng thái chưa chạy trên trình duyệt.

Chứng từ, danh mục và tài khoản có mã riêng của lượt thử đã được dọn trong `warehouse_test`. Sau một lần bộ chạy bị ngắt, mục tham chiếu đơn vị dùng chung được giữ lại vì chưa xác định được mục nào đã có trước đó.

- Nhật ký cục bộ [tuyến giao diện và xác thực](../.artifacts/wms-browser-evidence-20261122/results.json), [báo cáo và danh mục](../.artifacts/wms-browser-evidence-20261122/catalog-results.json), [đặt hàng](../.artifacts/wms-browser-evidence-20261122/orders-results.json). Các tệp này nằm trong thư mục kiểm thử cục bộ.

## Tài liệu đối chiếu

- Đặc tả use case và tiêu chí chấp nhận trong [SRS](srs.md), cùng [ma trận phân quyền](permissions.md).
- Quy tắc tồn kho, giữ tồn, kiểm kê và chốt tiền trong [FS01–FS12](full_system_policy_approval.md), cùng [quyết định dự án](decisions.md).
- Các thay đổi nghiệp vụ hiện hành trong [trạng thái hệ thống](current_status.md), [sửa lỗi ngày 16/11/2026](system_fixes_20261116.md), [điều kiện cấp nguyên liệu](material_request_approval_gate.md), [số lượng yêu cầu cấp](material_request_exact_quantity.md), [phân công cấp nguyên liệu](material_staff_assignment.md) và [tiếp nhận phiếu xuất nguyên liệu](material_issue_acceptance.md).

## UC01 – Đăng nhập hệ thống

**Vai trò** Cả 9 vai trò trong hệ thống.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC01-T01** Đăng nhập đúng | Tài khoản Ban giám đốc đang hoạt động | Mở Đăng nhập, nhập thông tin rồi bấm Đăng nhập | Tài khoản BGĐ test, mật khẩu đúng | Về Trang chủ, thấy menu Tổng quan kho theo quyền. |
| **UC01-T02** Mật khẩu sai | Tài khoản BGĐ đang hoạt động, chưa chạm ngưỡng khóa | Nhập đúng tên đăng nhập và mật khẩu sai | BGĐ test, mật khẩu sai một lần | Báo thông tin không hợp lệ, xóa giá trị ô mật khẩu, vẫn ở trang Đăng nhập. |
| **UC01-T03** Truy cập trực tiếp khi chưa đăng nhập | Phiên trình duyệt chưa có cookie đăng nhập | Mở URL Tổng quan kho trực tiếp | /dashboard | Chuyển sang /login và hiện biểu mẫu Đăng nhập hệ thống. |
| **UC01-T04** Tài khoản bị khóa | Tài khoản QC test đã được khóa | Thử đăng nhập bằng mật khẩu đúng | QC test, trạng thái LOCKED | Đăng nhập bị từ chối. Tài khoản vẫn bị khóa. |
| **UC01-T05** Phiên sau khi tải lại | Đã đăng nhập thành công với BGĐ | Tải lại Trang chủ và kiểm tra lưu trữ trình duyệt | Phiên đang còn hiệu lực | Menu theo quyền vẫn hiển thị. Cookie phiên là HttpOnly, thông tin phiên không nằm trong localStorage hoặc sessionStorage. |
| **UC01-T06** Đăng xuất | BGĐ đã đăng nhập | Mở menu tài khoản, chọn Đăng xuất rồi kiểm tra lại phiên | Phiên hiện hành | Về Đăng nhập. Yêu cầu kiểm tra phiên cũ trả 401. |
| **UC01-T07** Khóa tạm sau nhiều lần sai | Tài khoản test hoạt động, bộ đếm ban đầu bằng 0 | Nhập sai liên tiếp rồi thử mật khẩu đúng | 5 lần sai trong 15 phút | Lần thử đúng trong thời gian khóa tạm 15 phút vẫn bị chặn. |
| **UC01-T08** Hết hạn phiên | Có phiên test đã được thiết lập mốc hết hạn | Tải lại một trang nghiệp vụ sau mốc hết hạn | Idle 30 phút hoặc tổng thời gian 8 giờ | Phiên hết hiệu lực, trình duyệt chuyển về Đăng nhập và chức năng nghiệp vụ không hiện. |

## UC02 – Lập kế hoạch sản xuất

**Vai trò** Bộ phận lập kế hoạch.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC02-T01** Lập kế hoạch hợp lệ | Lập kế hoạch có quyền tạo và scope xưởng. Đơn đã xác nhận, định mức và lịch có hiệu lực | Mở Kế hoạch sản xuất → Thêm mới. Chọn đơn, SKU, xưởng, lịch rồi lưu | Đơn còn 2.000 lon, phân công 1.200 lon | Tạo KHSX Chờ duyệt, lưu đúng dòng đơn, xưởng, lịch và sản lượng. |
| **UC02-T02** Đơn nguồn chưa đủ điều kiện | Có một đơn nháp và một đơn đã xác nhận | Mở danh sách chọn đơn khi tạo KHSX | DH-NHAP, DH-XAC-NHAN | Chỉ đơn đủ điều kiện xuất hiện. Đơn nháp không trở thành nguồn KHSX. |
| **UC02-T03** Xem ngữ cảnh đơn và định mức | Đơn đã xác nhận có SKU, BOM và tồn nguyên liệu | Chọn đơn rồi chọn dòng sản phẩm | TP-T01, 1.000 lon, định mức đường 25 kg | Hiện đúng SKU, lượng và nhu cầu vật tư của đơn. Xem trước không thay tồn hay giữ tồn. |
| **UC02-T04** Năng lực xưởng không đủ | Lịch đã cấu hình cho SKU, năng lực còn 1.000 lon | Nhập lượng lớn hơn mức xưởng có thể nhận | 1.001 lon trong ngày duy nhất | Không thể lưu phân công vượt năng lực. Không ghi thêm phân bổ lịch. |
| **UC02-T05** Vượt chỉ tiêu đơn | Đơn còn 500 lon chưa lập KHSX, xưởng vẫn đủ năng lực | Nhập sản lượng lớn hơn lượng đơn còn lại | 501 lon | Bị chặn do vượt quota đơn. Không tạo kế hoạch. |
| **UC02-T06** Điều chỉnh vật tư gợi ý | SKU có BOM hiệu lực và người lập có quyền chỉnh | Sửa dòng vật tư gợi ý, lưu rồi mở chi tiết | Đường 25 kg sửa thành 27 kg | KHSX lưu định mức riêng đúng lượng mới. Định mức dùng chung giữ giá trị ban đầu. |
| **UC02-T07** Sửa kế hoạch đang chờ | Có một KHSX Chờ duyệt đúng scope và một KHSX Đã duyệt | Sửa lịch trên KHSX Chờ duyệt, thử tìm nút sửa trên KHSX Đã duyệt | Phiên bản hiện hành, lịch mới còn năng lực | Bản Chờ duyệt cập nhật và vẫn Chờ duyệt. Bản Đã duyệt không cho sửa theo luồng này. |
| **UC02-T08** Phạm vi xưởng | Người lập chỉ có scope Xưởng A | Chọn đơn rồi kiểm danh sách xưởng khi phân công | Xưởng A được cấp, Xưởng B ngoài scope | Chỉ xưởng đủ điều kiện và trong scope được chọn. Không tồn tại phân công ở Xưởng B. |

## UC03 – Duyệt kế hoạch sản xuất

**Vai trò** Ban giám đốc. Bộ phận lập kế hoạch, bộ phận mua hàng và xưởng sản xuất đối chiếu kết quả bàn giao.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC03-T01** Duyệt đủ nguyên liệu | BGĐ có đủ scope xưởng, khác người lập và người sửa cuối. KHSX Chờ duyệt | Mở chi tiết rồi bấm Phê duyệt | Nhu cầu 100 kg, khả dụng 130 kg | KHSX Đã duyệt, ghi snapshot nhu cầu và xuất hiện tại luồng tiếp nhận của xưởng. |
| **UC03-T02** Duyệt thiếu nguyên liệu | KHSX Chờ duyệt và có người mua hàng đủ quyền | Duyệt rồi mở queue yêu cầu mua bằng tài khoản mua hàng | Cần 100 kg, có 70 kg | KHSX Đã duyệt, queue mua thấy phần thiếu 30 kg với dữ liệu vật tư cần thiết. |
| **UC03-T03** Từ chối có lý do | KHSX Chờ duyệt và BGĐ đủ quyền | Mở chi tiết, chọn Từ chối và nhập lý do | Cần điều chỉnh lịch xưởng | KHSX Từ chối. Bộ phận lập kế hoạch xem được lý do. |
| **UC03-T04** Từ chối thiếu lý do | KHSX đang Chờ duyệt | Để trống hoặc nhập khoảng trắng rồi gửi Từ chối | Chuỗi ba dấu cách | Bị chặn. KHSX vẫn Chờ duyệt. |
| **UC03-T05** Tách người lập và người duyệt | Tài khoản test có cả quyền lập và duyệt để thử quy tắc tách nhiệm vụ | Dùng người lập hoặc người sửa cuối thử duyệt chính kế hoạch | KHSX do chính actor lập hoặc sửa | Thao tác bị từ chối. Không sinh snapshot nhu cầu mới. |
| **UC03-T06** Duyệt ngoài scope | KHSX có phân công ở xưởng ngoài phạm vi BGĐ test | Mở chi tiết và thử tìm thao tác duyệt | KHSX gồm Xưởng A và Xưởng B, BGĐ chỉ scope A | Không duyệt được toàn bộ KHSX. Không mở rộng phạm vi tài khoản. |
| **UC03-T07** Duyệt lại hoặc phiên bản cũ | Mở cùng KHSX ở hai tab có quyền, tab thứ nhất đã duyệt | Thử duyệt tiếp từ tab thứ hai | Cùng mã KHSX, phiên bản cũ | Báo trạng thái hoặc phiên bản không hợp lệ. Không tạo trùng nhu cầu và không bàn giao hai lần. |
| **UC03-T08** Thiếu người nhận bàn giao | KHSX Chờ duyệt còn thiếu vật tư, không có tài khoản mua phù hợp trong fixture | Phê duyệt và kiểm tra thông tin bàn giao | Thiếu 30 kg, không có người nhận ACTIVE đủ quyền | Giao diện báo bàn giao bị chặn. Phần nhu cầu và trạng thái duyệt vẫn truy vết được. |

## UC04 – QC thành phẩm

**Vai trò** Bộ phận QC.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC04-T01** Lập biên bản hợp lệ | QC đúng scope, yêu cầu nhập TP đã gửi và có lô hợp lệ | Mở QC thành phẩm, chọn nguồn rồi lưu kết quả | Kiểm 100 lon, đạt 90, lỗi 10, có lý do lỗi | Tạo biên bản nháp liên kết đúng nguồn và lô. Tồn kho chưa tăng. |
| **UC04-T02** Xác nhận biên bản | Có biên bản QC thành phẩm nháp hợp lệ | Bấm Xác nhận kết quả QC, mở chi tiết | 90 lon đạt, 10 lon lỗi | Biên bản Đã xác nhận. Phần đạt có thể làm nguồn điều phối nhập. Lượng lỗi đi theo luồng xử lý. |
| **UC04-T03** Tổng lượng sai | Nguồn còn ít nhất 100 lon chưa kiểm | Lưu biên bản có tổng không khớp | Kiểm 100, đạt 85, lỗi 10 | Bị chặn do tổng không khớp. Không giảm quota còn kiểm. |
| **UC04-T04** Thiếu lý do lỗi | Nguồn đang chờ QC | Nhập lượng không đạt dương rồi bỏ trống lý do | Kiểm 100, đạt 95, lỗi 5 | Biên bản chưa hợp lệ, hệ thống yêu cầu lý do phần lỗi. |
| **UC04-T05** Kiểm nhiều đợt | Nguồn có 100 lon và đã xác nhận đợt đầu 60 | Lập đợt thứ hai rồi thử tạo đợt vượt | Đợt 2 kiểm 40, lần thử thêm 1 | Đợt 2 hợp lệ. Đợt thêm bị chặn vì đã kiểm đủ 100. |
| **UC04-T06** Sai lô nguồn | Yêu cầu nhập tham chiếu Lô A | Thử sử dụng Lô B cùng SKU | Lô A của nguồn, Lô B không thuộc dòng nguồn | Không lưu được kết quả cho lô ngoài nguồn. |
| **UC04-T07** Sai quyền hoặc scope xưởng | Có QC đúng scope và QC xưởng khác | Mở nguồn khi đăng nhập bằng QC xưởng khác | Phiếu TP thuộc Xưởng A, actor chỉ scope B | Nguồn không truy cập được hoặc thao tác bị từ chối. Biên bản giữ nguyên. |
| **UC04-T08** Tái xử lý | Có hồ sơ tái xử lý TP hoàn tất với quota riêng | Lập đợt QC từ nguồn tái xử lý | 10 lon tái xử lý, đạt 8, lỗi 2 | Lưu đợt QC liên kết hồ sơ tái xử lý. QC gốc bất biến, phần đạt chỉ được tính khi ghi sổ nhập. |

## UC05 – Thống kê báo cáo và cảnh báo

**Vai trò** Ban giám đốc và quản lý kho theo quyền báo cáo.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC05-T01** Xem báo cáo tồn | BGĐ hoặc quản lý kho có quyền báo cáo và scope kho | Mở Báo cáo & Cảnh báo, chọn Tổng hợp tồn rồi lọc kho | Kho A có 90 kg đường và 200 lon TP | Số liệu đúng kho và đơn vị. Không cộng kg với lon. |
| **UC05-T02** Báo cáo theo kỳ | Có chứng từ và ledger trong kỳ kiểm thử | Mở Tồn theo kỳ rồi chọn khoảng ngày | Đầu kỳ 100 kg, nhập 30, xuất 20 | Đúng số đầu kỳ, tăng, giảm, cuối kỳ 110 kg khi không có biến động khác. |
| **UC05-T03** Khoảng ngày không hợp lệ | Có quyền báo cáo theo kỳ | Chọn ngày bắt đầu sau ngày kết thúc | D+1 tới D | Báo khoảng ngày không hợp lệ. Không hiện tổng có vẻ hợp lệ cho bộ lọc sai. |
| **UC05-T04** Cảnh báo tồn thấp | Quản lý kho có quyền cấu hình cảnh báo, tồn khả dụng 90 kg | Đặt ngưỡng, mở Cảnh báo và lọc Tồn dưới ngưỡng | Ngưỡng 95 kg | Xuất hiện đúng dòng cảnh báo với khả dụng 90 kg và ngưỡng 95 kg. |
| **UC05-T05** Cảnh báo hạn sử dụng | Hai lô còn tồn và có cấu hình ngưỡng | Mở báo cáo hạn dùng và đối chiếu ngày | Một lô HSD D−1, một lô HSD D+3. Ngưỡng 5 ngày | Tách rõ lô đã hết hạn và lô sắp hết hạn, đúng mã lô và ngày còn lại. |
| **UC05-T06** Không có dữ liệu | Có quyền với một kho trống hoặc khoảng ngày trống | Lọc báo cáo theo kho hoặc khoảng ngày không có giao dịch | Kỳ không có bản ghi | Hiện trạng thái rỗng rõ ràng. Không lẫn với lỗi tải dữ liệu. |
| **UC05-T07** Khách hàng không có quyền báo cáo | Đã đăng nhập bằng khách hàng không có reports.read | Kiểm menu rồi mở trực tiếp /dashboard | Tài khoản khách hàng test | Menu Tổng quan kho không hiện. Truy cập trực tiếp báo không có quyền. |
| **UC05-T08** Tổng quan kho trên di động | BGĐ có reports.read và phiên hợp lệ | Mở Tổng quan kho ở khổ 390 px | Viewport 390 × 844 | Khối Cảnh báo hạn sử dụng hiển thị và trang không tràn ngang. |

## UC06 – Tra cứu dữ liệu kho

**Vai trò** Quản lý kho và nhân viên kho có quyền tra cứu.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC06-T01** Tìm theo mã lô | Nhân viên kho có inventory.search và scope Kho A | Mở Tra cứu kho, tìm theo mã lô | LO-DUONG-T01 | Hiện đúng lô, mặt hàng, kho, vị trí, đơn vị và tồn. |
| **UC06-T02** Tìm theo SKU hoặc tên | Có hai mặt hàng tên gần giống, ở các vị trí được cấp | Tìm theo mã rồi theo một phần tên | NL-T01, từ khóa Đường | Kết quả phù hợp điều kiện và không lẫn mặt hàng ngoài scope. |
| **UC06-T03** Đối chiếu tồn và giữ tồn | Có lô đạt và reservation còn hiệu lực | Mở tồn theo lô/vị trí và đọc ba cột | Thực có 100 kg, giữ 30 kg | Hiện 100 thực có, 30 đang giữ và 70 khả dụng. |
| **UC06-T04** Tồn không khả dụng | Kho có lô cách ly hoặc vị trí đang khóa kiểm kê | Tra cứu các dòng liên quan | Lô cách ly có 30 kg | Tồn thực vẫn hiển thị, khả dụng cho xuất bằng 0. |
| **UC06-T05** Tra sổ biến động | Có một phiếu nhập và một phiếu xuất đã ghi sổ | Mở Sổ biến động, lọc ngày và kho | Nhập +40, xuất −15 cùng lô | Dấu, số trước/sau, chứng từ và đơn vị đúng. Có thể đối chiếu với tồn cuối. |
| **UC06-T06** Không tìm thấy | Actor có quyền tra cứu | Tìm mã lô không tồn tại | LO-KHONG-CO-T99 | Hiện trạng thái không có kết quả, không lấy kết quả bộ lọc cũ. |
| **UC06-T07** Kho ngoài phạm vi | Tài khoản chỉ có scope Kho A. Kho B có một lô riêng | Kiểm danh sách kho rồi tìm mã lô Kho B | LO-KHO-B-T01 | Không thấy dữ liệu của Kho B. Điều hướng hoặc tìm theo mã không mở rộng scope. |
| **UC06-T08** Đổi trang khi đổi bộ lọc | Có hơn 20 dòng trong danh sách kho test | Sang trang sau rồi chọn kho hoặc từ khóa mới | Trang 2, lọc LO-DUONG-T01 | Hiện kết quả bộ lọc mới ở trang phù hợp và tổng đếm đúng. |

## UC07 – Lập biên bản kiểm kê

**Vai trò** Quản lý kho tạo và chốt phạm vi. Hội đồng kiểm kê thực hiện phiên đếm.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC07-T01** Tạo và chốt phạm vi | Quản lý có quyền kiểm kê và scope. Có thành viên đủ điều kiện | Tạo biên bản, chọn phạm vi và bấm Chốt snapshot và khóa phạm vi | Kho A, VT-A, hai thành viên test | Biên bản chuyển Đang đếm, có snapshot, khóa đúng vị trí và thế hệ chốt. |
| **UC07-T02** Ghi phiên đếm đủ phạm vi | Biên bản Đang đếm, thành viên đã được phân công | Nhập lượng thực tế và đánh dấu các vị trí trống | VT-A có 90 kg, VT-B xác nhận trống | Tạo phiên đếm nháp bao phủ đủ mọi vị trí trong phạm vi. |
| **UC07-T03** Đếm thành phẩm theo quy cách | SKU có quy cách phiên bản chốt theo lô | Nhập pallet nguyên, thùng/lốc/chai lẻ theo từng cấp | 1 thùng 24, 1 lốc 6, 3 lon lẻ | Tổng cơ sở 33 lon. Không đếm lại lon bên trong thùng và lốc. |
| **UC07-T04** Thiếu vị trí | Biên bản chốt hai vị trí | Đếm một vị trí, bỏ trống vị trí còn lại mà không xác nhận trống | VT-A có dòng đếm, VT-B chưa xử lý | Không nộp hoặc lưu kết quả thiếu phạm vi. Chưa đóng biên bản. |
| **UC07-T05** Người ngoài Hội đồng | Tài khoản có scope kho nhưng không được phân công vào biên bản | Mở trực tiếp biên bản rồi thử nhập/nộp phiên đếm | Actor khác hai thành viên chỉ định | Không được sửa hoặc nộp kết quả đếm của biên bản. |
| **UC07-T06** Chênh lệch cần đếm lại độc lập | Snapshot là 100 kg, vòng đầu đếm 90 kg | Nộp vòng 1 rồi thử xác nhận hoặc đếm lại bằng cùng người | Người A đếm 90 và cầm vòng 2 | Yêu cầu đếm lại độc lập. Vòng 2 của cùng người bị chặn. |
| **UC07-T07** Không chênh lệch và đóng biên bản | Phiên đếm đã nộp, đủ phạm vi và khớp snapshot | Thành viên có quyền bấm xác nhận biên bản | Sổ 100 kg, thực 100 kg | Hoàn thành, mở khóa vị trí và không tạo bút toán điều chỉnh. |
| **UC07-T08** Hủy hoặc hết hạn khóa | Biên bản đang giữ khóa hữu hạn trên vị trí test | Hủy có lý do hoặc dùng fixture đã quá hạn rồi tải lại | Lease 60 phút từ cut-off. Kịch bản hủy tách riêng | Khóa được giải phóng theo trạng thái. Phiên/đề nghị cũ không được dùng để ghi sổ sau khi mở khóa. |

## UC08 – Xử lý chênh lệch kiểm kê

**Vai trò** Quản lý kho xác minh. Hội đồng kiểm kê đếm lại theo phân công.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC08-T01** Xác minh và đề nghị điều chỉnh | Đã xác nhận hai vòng độc lập, có chênh lệch và khóa còn hiệu lực | Quản lý mở dòng chênh lệch, ghi lý do, đính bằng chứng rồi chọn đề nghị điều chỉnh | Sổ 100 kg, vòng đếm chấp nhận 90 kg, PDF giả | Lưu xác minh và đề nghị Chờ duyệt với lượng điều chỉnh −10 kg. Tồn hiện hành chưa đổi. |
| **UC08-T02** Thiếu bằng chứng | Có dòng Chờ xác minh | Điền lý do nhưng không chọn bằng chứng | Lý do có nội dung, 0 tệp | Không thể hoàn thành xác minh. Dòng vẫn chờ. |
| **UC08-T03** Lý do không hợp lệ | Có tệp hợp lệ thuộc biên bản | Để lý do trống hoặc chỉ nhập dấu cách | PDF giả đúng phạm vi | Bị chặn. Không tạo xác minh hoặc đề nghị sai. |
| **UC08-T04** Bằng chứng sai phạm vi | Có hai biên bản hoặc hai kho khác nhau | Chọn hoặc đối chiếu tệp thuộc biên bản khác khi xác minh | PDF-B thuộc Kho B | Tệp ngoài phạm vi không dùng được. Dòng kiểm kê chưa thay đổi. |
| **UC08-T05** Sai vòng đếm | Hệ thống đã chốt vòng 2 làm kết quả đối chiếu | Thử xác minh từ dữ liệu cũ chưa tải lại | Phiên bản/vòng 1 đang lưu ở tab cũ | Bị chặn nếu vòng đếm chấp nhận không còn đúng. Không tạo đề nghị trùng. |
| **UC08-T06** Xác minh không điều chỉnh | Có chênh lệch đã làm rõ, người có quyền xác minh | Lưu lý do và bằng chứng, bỏ chọn đề nghị điều chỉnh | Dòng lệch −2 kg, có hồ sơ xác minh | Lưu kết quả Không điều chỉnh, tồn không đổi. Nếu mọi dòng đã giải quyết, biên bản được đóng và mở khóa. |
| **UC08-T07** Không điều chỉnh từ hàng chưa định danh | Dòng chênh lệch thuộc bucket UNKNOWN | Thử đề nghị tăng tồn đã định danh từ dòng này | 5 đơn vị không rõ lô | Không tạo được đề nghị. Dữ liệu hàng chưa định danh tiếp tục được truy vết. |
| **UC08-T08** Từ chối actor sai quyền | Thành viên Hội đồng chỉ có quyền đếm/xác nhận | Mở dòng Chờ xác minh bằng tài khoản Hội đồng | Biên bản đúng scope nhưng thiếu variances.verify | Nút xác minh không khả dụng và bản ghi giữ nguyên. |

## UC09 – Phê duyệt điều chỉnh tồn

**Vai trò** Ban giám đốc.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC09-T01** Duyệt chênh lệch thiếu | Đề nghị Chờ duyệt, khóa còn hạn, BGĐ đúng scope, khác người đề nghị | Mở chi tiết và bấm Phê duyệt và ghi sổ | Tồn 100 kg, số đếm 90 kg | Tồn thành 90 kg. Sổ có một dòng −10 kg. Đề nghị Đã duyệt. |
| **UC09-T02** Duyệt chênh lệch thừa | Có đề nghị tăng tồn hợp lệ và vị trí còn sức chứa | Duyệt điều chỉnh tăng | Tồn 100 kg, thực đếm 105 kg | Tồn thành 105 kg, ledger +5 kg và audit đúng người duyệt. |
| **UC09-T03** Từ chối có lý do | Đề nghị Chờ duyệt | Chọn Từ chối, nhập lý do | Cần kiểm tra chứng cứ | Đề nghị Từ chối và không thay tồn; xử lý khóa theo trạng thái biên bản. |
| **UC09-T04** Từ chối thiếu lý do | Đề nghị Chờ duyệt | Chọn Từ chối rồi bỏ trống lý do | Chuỗi rỗng | Không ghi quyết định. Đề nghị vẫn Chờ duyệt. |
| **UC09-T05** Người đề nghị tự duyệt | Fixture có actor đồng thời có quyền đề nghị và duyệt | Dùng người đề nghị thử duyệt | Cùng actor trên một đề nghị | Quy tắc tách người đề nghị và người duyệt chặn thao tác. |
| **UC09-T06** Bấm lặp hoặc hai tab cùng duyệt | Cùng đề nghị đang mở ở hai tab | Duyệt từ tab 1 rồi thử tiếp tại tab 2 | Phiên bản cũ của cùng đề nghị | Chỉ một lần ghi sổ. Không giảm tồn hai lần. |
| **UC09-T07** Xung đột tồn đang giữ | Đề nghị giảm tồn xuống dưới số lượng giữ còn hiệu lực | Thử duyệt điều chỉnh | Tồn 100 kg, giữ 80 kg, đề nghị còn 70 kg | Bị chặn. Tồn, reservation và ledger giữ nguyên sau lỗi. |
| **UC09-T08** Khóa hoặc thế hệ đã hết hiệu lực | Đề nghị được tạo trước khi phạm vi hết hạn/bị hủy | Duyệt từ trang cũ sau khi khóa đã được giải phóng | Đề nghị dùng thế hệ kiểm kê cũ | Yêu cầu bị chặn; đề nghị cũ không sinh bút toán. |

## UC10 – Quản lý nguyên liệu

**Vai trò** Quản lý kho.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC10-T01** Tạo nguyên liệu hợp lệ | Quản lý có quyền ghi danh mục. Đơn vị kg tồn tại | Vào Danh mục nguyên liệu → Thêm mới, nhập thông tin và lưu | NL-T01, Đường thử, kg, yêu cầu HSD | Danh mục có một dòng đúng mã, tên, đơn vị cơ sở và cờ HSD. |
| **UC10-T02** Trùng mã | NL-T01 đã tồn tại | Thêm nguyên liệu có cùng mã | NL-T01, tên khác | Hệ thống không tạo bản ghi trùng; bản gốc giữ nguyên. |
| **UC10-T03** Thiếu dữ liệu bắt buộc | Đang ở biểu mẫu thêm mới | Bỏ đơn vị cơ sở hoặc bỏ tên, bấm lưu | Mã hợp lệ nhưng không chọn đơn vị | Hiện lỗi, không phát sinh bản ghi. |
| **UC10-T04** Sửa thông tin mô tả | Nguyên liệu ACTIVE và người dùng có quyền sửa | Sửa tên hoặc điều kiện bảo quản rồi mở chi tiết | Đổi bảo quản thành Khô ráo | Lưu được thuộc tính cho phép, ID và lịch sử giao dịch không đổi. |
| **UC10-T05** Đổi đơn vị đã có lịch sử | Nguyên liệu đã có lô hoặc chứng từ liên quan | Sửa đơn vị cơ sở | kg → lít | Bị chặn nếu đã phát sinh lịch sử ràng buộc. Tồn và chứng từ cũ giữ đơn vị. |
| **UC10-T06** Khóa và mở khóa | Nguyên liệu ACTIVE trong fixture và có quyền ghi | Khóa nguyên liệu rồi mở khóa theo thao tác danh mục | NL-T01 | Cùng bản ghi chuyển `LOCKED` rồi trở lại `ACTIVE` sau khi mở khóa. |
| **UC10-T07** Xóa nguyên liệu có lịch sử | Nguyên liệu đang tham chiếu nhiều chứng từ | Xem các thao tác có thể thực hiện | NL-T01 có phiếu nhập đã ghi sổ | Không có đường xóa cứng từ giao diện. Giữ lịch sử và định danh. |
| **UC10-T08** Chỉ có quyền xem | Actor có materials.read, thiếu materials.write | Mở Danh mục nguyên liệu và xem chi tiết | Tài khoản test chỉ đọc | Xem dữ liệu theo quyền, không thấy hoặc không thực hiện được Thêm, Sửa, Khóa. |

## UC11 – Đặt đơn hàng

**Vai trò** Khách hàng.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC11-T01** Tạo đơn với hồ sơ giao đủ | Khách có orders.create và hồ sơ đủ người nhận, điện thoại, địa chỉ. Có SKU bán được | Mở Đơn hàng → Thêm mới, kiểm các giá trị tự điền, chọn hàng và lưu | 2 thùng × 24 lon, ngày giao D+7 | Tạo đơn Nháp đúng khách và đúng thông tin giao. Lượng cơ sở là 48 lon. |
| **UC11-T02** Hồ sơ thiếu số điện thoại | Khách đã lưu địa chỉ và người nhận, thiếu SĐT | Mở Thêm mới, bổ sung trường còn thiếu rồi lưu | SĐT test 0900000001 | Hai trường có dữ liệu được tự điền. Có thể lưu sau khi bổ sung hợp lệ. |
| **UC11-T03** Thông tin riêng của đơn | Hồ sơ có địa chỉ A, đang lập đơn nháp | Thay địa chỉ trong form và mở lại chi tiết sau lưu | Địa chỉ giao B | Đơn lưu địa chỉ B. Hồ sơ khách vẫn là địa chỉ A. |
| **UC11-T04** Ngày giao ít hơn 7 ngày | Ngày nghiệp vụ hiện tại là D theo giờ Việt Nam | Chọn hoặc thử gửi ngày giao trước giới hạn | D+6 | Ngày giao không hợp lệ, không tạo đơn với ngày sai. Giao diện cho biết ngày giao sớm nhất. |
| **UC11-T05** Xác nhận đơn và chốt tiền | Đơn Nháp còn hợp lệ khi xác nhận, SKU có giá hiệu lực | Bấm Xác nhận đơn trên dòng đơn hàng | 2 thùng, giá tham khảo 25.000 VND/thùng | Đơn chuyển Xác nhận. Đơn giá và thành tiền chốt theo giá hiệu lực và quy tắc VND từng dòng. |
| **UC11-T06** Xác nhận bản nháp muộn | Đơn tạo ngày D có ngày giao D+7, hôm nay đã sang D+1 | Mở và bấm Xác nhận đơn | Ngày giao còn cách ngày xác nhận 6 ngày | Xác nhận bị chặn cho tới khi ngày giao đáp ứng giới hạn hiện hành. |
| **UC11-T07** Phạm vi khách hàng | Có hai khách hàng khác nhau và đơn riêng của mỗi bên | Đăng nhập khách B rồi tìm đơn của khách A | DH-A-T01 | Không thấy đơn A hoặc không được mở bản ghi. Dữ liệu giao hàng không bị lộ. |
| **UC11-T08** Đóng form bằng bàn phím | Khách hàng test có quyền thêm đơn | Mở Thêm mới rồi bấm Esc, quan sát focus | Chưa gửi form | Hộp thoại đóng. Focus trở về nút Thêm mới. Không tạo đơn. |

## UC12 – Xuất kho thành phẩm giao hàng

**Vai trò** Nhân viên kho thực hiện xuất và ghi nhận giao hàng theo quyền.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC12-T01** Ghi sổ xuất đã giữ tồn | Phiếu SALE đã xác nhận phân bổ, giữ tồn còn hiệu lực, nhân viên đúng kho | Mở Xuất kho thành phẩm, đối chiếu lô/vị trí rồi bấm Ghi sổ xuất kho | Tồn 100 lon, phiếu giữ 40 lon | Phiếu Hoàn thành, tồn còn 60 lon, giữ của phiếu được tiêu thụ và có ledger −40. |
| **UC12-T02** Phiếu chưa xác nhận phân bổ | Phiếu xuất đang Nháp hoặc Đã phân bổ | Tìm thao tác ghi sổ bằng tài khoản nhân viên | Phiếu SALE chưa có hold hiệu lực | Chưa ghi sổ được. Tồn và ledger không đổi. |
| **UC12-T03** Sai kho | Nhân viên chỉ scope Kho A, phiếu thuộc Kho B | Mở chi tiết hoặc thử thao tác với phiếu | PX-TP-KHO-B | Bị từ chối theo scope. Không dùng được hold của phiếu ngoài kho. |
| **UC12-T04** Lô mất điều kiện sau phân bổ | Phiếu đã giữ tồn, fixture lô sau đó hết hạn hoặc mất điều kiện | Thử ghi sổ phiếu cũ | 40 lon, HSD đã qua ngày nghiệp vụ | Bị chặn. Tồn thực và ledger không bị giảm. |
| **UC12-T05** Giữ tồn hết hạn | Hold đã hết TTL trước lúc ghi sổ | Mở phiếu ở tab cũ và thử ghi sổ | Phiếu có hạn giữ trước thời điểm hiện tại | Không ghi sổ. Phải quay lại luồng điều phối hợp lệ. |
| **UC12-T06** Thao tác lặp | Phiếu đủ điều kiện, hai tab cùng phiên bản | Ghi sổ tại tab thứ nhất rồi thử lại ở tab thứ hai | Cùng mã phiếu và cùng dòng lô | Chỉ một StockPosting và một lần giảm tồn. |
| **UC12-T07** Xác nhận giao một phần | Phiếu đã ghi sổ 40 lon, có đợt giao hàng | Mở Giao hàng thành công, xác nhận lượng thực giao | Giao 30/40 lon | Ghi nhận 30 lon đã giao, còn phần chưa giao. Xác nhận giao không trừ kho lần hai. |
| **UC12-T08** Giao vượt lượng đã xuất | Đã ghi sổ 40 lon và xác nhận giao 30 lon | Thử xác nhận thêm lượng lớn hơn phần còn lại | Giao thêm 11 lon | Bị chặn vì vượt quota giao. Số đã giao vẫn là 30 lon. |

## UC13 – Điều phối nhập kho

**Vai trò** Quản lý kho điều phối. Nhân viên kho xử lý ở UC ghi sổ tương ứng.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC13-T01** Phân bổ đúng nguồn QC | Quản lý có receipts.allocate, đúng kho và scope nguồn. QC đã chốt còn 100 đạt | Mở phiếu nhập, phân bổ hai vị trí rồi bấm Xác nhận phân bổ | VT-A 60, VT-B 40, đúng cùng lô/đơn vị | Phiếu Đã xác nhận đúng phân bổ. Tồn và ledger chưa tăng, sức chứa không bị giữ trước. |
| **UC13-T02** Nguồn chưa chốt QC | Có yêu cầu nhập nhưng QC còn Nháp | Mở danh sách nguồn khi điều phối | QC-TP-NHAP | Nguồn chưa đủ điều kiện không được phân bổ thành nhập đạt. |
| **UC13-T03** Vượt lượng QC còn lại | QC còn được phép nhập 100 đơn vị | Nhập tổng phân bổ 101 đơn vị | VT-A 60, VT-B 41 | Không xác nhận được. Không tăng tồn hoặc chiếm quota sai. |
| **UC13-T04** Sai lô hoặc đơn vị | Nguồn QC thuộc Lô A, đơn vị lon | Chọn Lô B hoặc thử lượng theo đơn vị khác nguồn | Lô B cùng SKU hoặc đơn vị không hợp lệ | Bị chặn do sai nguồn/lô/đơn vị. Không ghi tồn. |
| **UC13-T05** Sai vị trí nguyên liệu | Kho đã cấu hình mapping vật tư–vị trí | Chọn nguyên liệu và kiểm danh sách vị trí | Đường chỉ được phép VT-A, thử VT-C | Chỉ vị trí được phép xuất hiện hoặc được chấp nhận. Phiếu không lưu vào VT-C. |
| **UC13-T06** Thiếu sức chứa hoặc vị trí khóa | Lượng nhập vượt chỗ còn hoặc vị trí bị khóa | Thử phân bổ rồi xác nhận | Cần 51 kg, vị trí còn tối đa 50 kg | Bị chặn. Không tăng tồn và không tạo giữ chỗ. |
| **UC13-T07** Mở lại phân bổ | Phiếu đã xác nhận nhưng chưa ghi sổ, quản lý đủ quyền | Bấm Mở lại phân bổ, sửa vị trí hợp lệ rồi xác nhận lại | VT-A đổi sang VT-B, phiên bản hiện hành | Chứng từ phản ánh phân bổ mới. Tồn và ledger giữ nguyên. |
| **UC13-T08** Phân bổ cũ hoặc ngoài scope | Có hai tab hoặc nguồn thuộc xưởng/kho khác | Thử cập nhật bằng phiên bản cũ hoặc bằng actor ngoài scope | Phiếu vừa được điều phối ở tab 1 | Thao tác không thành công. Không ghi đè phương án mới. |

## UC14 – Kiểm tra hàng trả về

**Vai trò** Khách hàng yêu cầu trả. Nhân viên kho tiếp nhận. Bộ phận QC kiểm tra hàng trả.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC14-T01** Yêu cầu trả đúng lượng đã giao | Khách sở hữu đơn và có lượng giao thành công | Mở Yêu cầu trả hàng, chọn dòng giao và nhập lý do | Đã giao 6 lon, yêu cầu trả 4 lon | Tạo yêu cầu đúng đơn/dòng giao/lô. Tồn chưa thay đổi tại bước yêu cầu. |
| **UC14-T02** Trả vượt lượng giao | Xuất 10 lon, thực giao 6 lon và chưa có yêu cầu trả khác | Thử tạo yêu cầu trả 7 lon | 7 lon từ cùng dòng giao | Bị chặn vì vượt lượng giao thành công. |
| **UC14-T03** Tiếp nhận vật lý vào cách ly | Nhân viên đúng kho, yêu cầu trả hợp lệ | Mở Tiếp nhận hàng trả vào cách ly, chọn kho/vị trí và ghi nhận | 4 lon tại vị trí kiểm soát | Ghi nhận vật lý vào QUARANTINE. Tồn đạt/khả dụng không tăng. |
| **UC14-T04** QC hàng trả | Đợt tiếp nhận đã ghi, QC được phân phạm vi kho | Mở QC hàng trả, lập và xác nhận biên bản | Kiểm 4 lon, đạt 3, lỗi 1, có lý do | Kết quả QC lưu đúng nguồn và lô. Chỉ phần đạt trở thành nguồn nhập lại. |
| **UC14-T05** Tổng QC không khớp | Nguồn có 4 lon còn chờ kiểm | Nhập tổng đạt và lỗi khác lượng kiểm | Kiểm 4, đạt 2, lỗi 1 | Bị chặn. Quota còn kiểm không giảm. |
| **UC14-T06** Hàng chưa định danh | Nhân viên tiếp nhận hàng vật lý nhưng thiếu lô/nguồn khớp | Lập phiếu Hàng trả chưa định danh, quản lý xem xác minh | Mã khai báo LO-CHUA-XAC-MINH | Hàng nằm cách ly và có truy vết khai báo. Chưa có tồn đạt hoặc lô được bịa. |
| **UC14-T07** Không đủ quyền/scope | Tài khoản QC ngoài kho nhận hoặc khách khác chủ đơn | Thử mở nguồn hoặc yêu cầu trả | Kho A, actor chỉ scope B. Khách B mở đơn A | Không xem hoặc không thao tác được bản ghi ngoài phạm vi. |
| **UC14-T08** Kiểm lại vượt quota | Một nguồn đã được QC chốt đủ 4 lon | Thử mở đợt QC mới thêm 1 lon | Nguồn vừa xác nhận đủ lượng | Bị chặn. Biên bản đã chốt không bị ghi đè. |

## UC15 – Điều phối xuất kho

**Vai trò** Quản lý kho.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC15-T01** Giữ tồn đúng FEFO | Quản lý có quyền phân bổ/xác nhận, nguồn hợp lệ, hai lô đạt | Mở điều phối xuất, áp dụng phân bổ theo HSD rồi xác nhận | Lô A HSD sớm có 40, lô B có 60. Cần 70 | Giữ 40 ở A và 30 ở B. Thực có vẫn 100, đang giữ 70, khả dụng 30. |
| **UC15-T02** Sai thứ tự FEFO | Lô A còn đủ lượng và HSD sớm hơn Lô B | Chọn Lô B trước khi A cạn rồi xác nhận | Cần 20, A còn 40 | Bị chặn do không đúng FEFO. Không giữ tồn. |
| **UC15-T03** Lô không đủ điều kiện | Có lô hết hạn, lô cách ly, lô đạt | Mở lựa chọn lô khi điều phối | Lô A hết hạn, B QUARANTINE, C DAT | Chỉ lô đủ điều kiện được xác nhận. Lô hết hạn/cách ly không bị giữ. |
| **UC15-T04** Nguồn hoặc scope không hợp lệ | Nguồn chưa đủ điều kiện hoặc kho không thuộc quản lý test | Thử tạo/xác nhận phiếu ở kho ngoài phạm vi | Nguồn xưởng nháp hoặc Kho B ngoài scope | Bị chặn. Không sinh phiếu hợp lệ hoặc reservation. |
| **UC15-T05** Hai phiếu tranh cùng tồn | Tồn khả dụng 100, hai phiếu cùng cần 70 và đã nhập phân bổ | Xác nhận gần đồng thời trong hai tab | Phiếu A 70, phiếu B 70 | Chỉ một phiếu giữ được 70. Khả dụng còn 30. Thực có không đổi. |
| **UC15-T06** Gia hạn giữ tồn | Phiếu đã xác nhận có hold còn hạn. Quản lý đúng kho | Thử gia hạn một lần trong giới hạn rồi thử lần hai | TTL 120 phút, giới hạn tuyệt đối 240 phút từ xác nhận gốc | Lần hợp lệ được gia hạn. Lần tiếp theo hoặc vượt giới hạn bị chặn. |
| **UC15-T07** Mở lại hoặc hủy giữ tồn | Phiếu có hold chưa tiêu thụ và phiên bản hiện hành | Bấm Giải phóng giữ và mở lại hoặc hủy theo nghiệp vụ | Đang giữ 30 kg | Giải phóng lượng chưa tiêu thụ đúng một lần. Tồn thực không đổi. |
| **UC15-T08** Phiếu nguyên liệu quản lý lập và gửi | Có yêu cầu xưởng và nhân viên hợp lệ cùng kho | Chọn phân công, lô/vị trí rồi bấm Lập và gửi phiếu | 1 yêu cầu, 1 nhân viên, 30 kg | Phiếu Chờ nhân viên tiếp nhận, giữ đúng 30 kg và chỉ hiện cho nhân viên được giao. Chưa trừ tồn. |

## UC16 – Nhập kho thành phẩm

**Vai trò** Nhân viên kho.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC16-T01** Ghi sổ thành phẩm đạt QC | Phiếu FINISHED đã xác nhận phân bổ, actor có receipts.postProduct và đúng kho | Mở Nhập kho thành phẩm, đối chiếu rồi ghi sổ | QC đạt 90 lon, phiếu nhập 90 lon | Phiếu Hoàn thành, tăng đúng 90 lon theo lô/vị trí, có một ledger. |
| **UC16-T02** Nhập từng phần | QC đạt 90 lon, đã nhập 60 ở phiếu trước | Ghi sổ phiếu thứ hai đã điều phối | Còn được nhập 30 lon | Tổng đã nhập đạt 90. Quota còn lại bằng 0. |
| **UC16-T03** Vượt lượng đạt chưa nhập | Đã có phiếu khác dùng phần quota còn lại | Thử ghi sổ phiếu phân bổ cũ | Còn 30 lon, phiếu yêu cầu 31 lon | Bị chặn và rollback. Không có ledger bổ sung. |
| **UC16-T04** Sức chứa đổi trước ghi sổ | Phiếu đã xác nhận khi còn đủ chỗ. Giao dịch hợp lệ khác đã chiếm chỗ | Thử ghi sổ từ tab cũ | Chỗ còn 20, phiếu cần 30 theo đơn vị sức chứa | Bị chặn. Tồn và sổ không tăng sau thất bại. |
| **UC16-T05** Không đủ quyền hoặc sai kho | Nhân viên chỉ scope Kho A, phiếu ở Kho B | Mở chi tiết và thử ghi sổ | Phiếu FINISHED ở Kho B | Không xem hoặc thực hiện được ngoài scope. |
| **UC16-T06** Ghi sổ lặp | Hai tab cùng mở phiếu đủ điều kiện | Ghi sổ ở tab thứ nhất rồi thử lần nữa | Cùng phiếu và phiên bản cũ | Chỉ một posting, tồn tăng đúng một lần. |
| **UC16-T07** Hoàn thành từng phân công | KHSX có nhiều phân công, một dòng còn thiếu sản lượng nhập đạt | Nhập đủ dòng cuối rồi mở chi tiết KHSX | Dòng A 100/100, B từ 70/80 lên 80/80 | KHSX chỉ Hoàn thành sau khi từng dòng đủ sản lượng FINISHED đã ghi sổ. |
| **UC16-T08** Không cộng hàng lỗi hoặc hàng trả | KHSX còn thiếu sản lượng ở một phân công | Đối chiếu tiến độ sau khi xử lý lượng FAILED hoặc nhập lại hàng trả | Còn thiếu 10 lon, có 10 lon FAILED hoặc hàng trả | Tiến độ KHSX không tăng từ hai nguồn này. Phần tái xử lý đạt chỉ tính khi truy được nguồn và đã nhập. |

## UC17 – Nhập kho hàng trả

**Vai trò** Nhân viên kho.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC17-T01** Nhập lại phần QC đạt | Hàng trả đã tiếp nhận cách ly và QC xác nhận. Phiếu RETURN đã điều phối | Mở Nhập lại hàng trả rồi ghi sổ đúng phần đạt | 4 lon cách ly, QC đạt 3 | Tồn đạt tăng 3, cách ly giảm tương ứng. Tổng vật lý không tăng thêm lần hai. |
| **UC17-T02** Chưa có kết luận QC | Hàng trả đã tiếp nhận nhưng chưa có QC xác nhận | Mở danh sách nguồn nhập lại | 4 lon QUARANTINE, QC Nháp | Không đủ điều kiện nhập lại vào tồn đạt. |
| **UC17-T03** Vượt lượng được phép | QC đạt 3 lon, chưa nhập | Thử điều phối hoặc ghi sổ 4 lon | 4 lon từ cùng kết quả QC | Bị chặn. Tồn đạt và cách ly không thay đổi sau lỗi. |
| **UC17-T04** Sai kho nguồn | Lượng cách ly thuộc Kho kiểm soát A | Chọn kho khác khi điều phối hoặc dùng phiếu phân bổ sai | Kho B khác nơi tiếp nhận nguồn | Bị từ chối do kho nguồn không khớp. |
| **UC17-T05** Sai lô gốc | QC trả hàng tham chiếu Lô A | Thử dùng Lô B cùng SKU | Lô B không nằm trên QC | Không nhập lại được bằng lô thay thế. |
| **UC17-T06** Kho hoặc vị trí không khả dụng | Phiếu chuẩn bị ghi sổ, vị trí đã bị khóa/không đủ sức chứa | Thử ghi sổ với phân bổ cũ | Vị trí khóa kiểm kê | Không ghi sổ. Phần cách ly vẫn truy vết được. |
| **UC17-T07** Sai quyền ghi sổ | Quản lý chỉ có quyền điều phối, thiếu receipts.postReturn | Mở phiếu Đã xác nhận | Tài khoản chỉ điều phối | Không ghi sổ được phiếu RETURN. Quản lý vẫn xem theo scope được cấp. |
| **UC17-T08** Ghi sổ lặp | Phiếu RETURN vừa được ghi sổ thành công | Thử lại từ tab cũ | Cùng phiên bản và cùng lô | Chỉ có một posting. Tồn đạt không tăng lần hai. |

## UC18 – Xử lý hàng lỗi hoặc hàng trả

**Vai trò** Quản lý kho và người có quyền phê duyệt hoặc thực hiện tương ứng với từng phương án.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC18-T01** Lập phương án xử lý lỗi | Quản lý kho đúng scope, lô lỗi đã được tiếp nhận vật lý | Mở Xử lý hàng lỗi/hàng trả, tạo và gửi duyệt phương án | 20 lon FAILED, phương án tái xử lý 10 lon | Phương án Chờ duyệt, nêu nguồn/lô và lý do. Chưa ghi biến động xử lý. |
| **UC18-T02** Duyệt độc lập | Phương án Chờ duyệt. BGĐ đủ quyền và khác người lập | Phê duyệt phương án | Phương án REWORK 10 lon | Phương án Đã duyệt, có người duyệt và audit. Chưa tự tạo tồn đạt. |
| **UC18-T03** Tự duyệt bị chặn | Fixture có actor được phép lập và duyệt | Dùng người đề xuất phê duyệt phương án của chính mình | Cùng tài khoản trên cùng hồ sơ | Bị chặn theo quy tắc tách nhiệm vụ. |
| **UC18-T04** Từ chối hoặc thiếu lý do | Phương án Chờ duyệt | Thử từ chối không lý do rồi từ chối có lý do | Trống, sau đó Không phù hợp quy trình | Bước thiếu lý do bị chặn. Phương án Từ chối khi nhập hợp lệ và chưa thực hiện. |
| **UC18-T05** Thực hiện khi chưa duyệt | Phương án đang Nháp hoặc Chờ duyệt | Kiểm tra thao tác thực hiện | 20 lon FAILED đang cách ly | Không thực hiện được. Tồn và ledger không đổi. |
| **UC18-T06** Tái xử lý và QC lại | Phương án REWORK đã duyệt và đủ lượng | Thực hiện tái xử lý rồi kiểm nguồn QC mới | 10 lon tái xử lý, QC mới đạt 8 | Có đợt mới với quota 10, liên kết hồ sơ gốc. QC gốc còn nguyên, 8 lon chỉ thành tồn đạt khi nhập. |
| **UC18-T07** Tiêu hủy hoặc trả nhà cung cấp | Phương án đã duyệt, đủ tồn lỗi vật lý | Thực hiện phương án, kiểm sổ biến động | Có 20 đơn vị FAILED, thực hiện 5 đơn vị | Tồn lỗi giảm 5 và ledger có chứng từ tương ứng. Không sinh tồn âm hoặc tăng tồn đạt. |
| **UC18-T08** Lượng xử lý vượt tồn | Phương án đã duyệt nhưng tồn lỗi khả dụng đã giảm | Thử thực hiện với số liệu cũ | Cần 10, tồn lỗi vật lý chỉ còn 9 | Bị chặn. Không ghi một phần hoặc ghi ledger âm sai. |

## UC19 – Quản lý dữ liệu kho

**Vai trò** Quản lý kho.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC19-T01** Tạo kho hợp lệ | Quản lý có warehouses.write. Có đơn vị sức chứa phù hợp | Mở Vị trí lưu kho → thêm kho và lưu | KHO-A, loại MATERIAL, 6.000 kg | Tạo kho đúng loại, đơn vị và sức chứa. Scope cấp theo quy tắc hiện hành của người tạo. |
| **UC19-T02** Tạo vị trí trong kho | Kho ACTIVE, actor đủ scope | Quản lý vị trí rồi thêm vị trí | VT-A, 2.000 kg, bảo quản khô | Vị trí xuất hiện dưới đúng kho và có sức chứa cấu hình. |
| **UC19-T03** Đơn vị sức chứa sai | Có đơn vị kg và lon trong danh mục | Thử chọn đơn vị đếm làm đơn vị sức chứa | Đơn vị lon | Không tạo hoặc lưu cấu hình sức chứa sai chiều đo. |
| **UC19-T04** Hạ sức chứa dưới lượng chiếm | Vị trí đang chiếm 800 kg | Sửa sức chứa tối đa | 799 kg | Bị chặn. Sức chứa cũ và tồn giữ nguyên. |
| **UC19-T05** Khóa vị trí | Vị trí ACTIVE, chưa có khóa kiểm kê cản thao tác | Chọn Khóa ở quản lý vị trí, rồi mở lựa chọn trong phiếu kho | VT-A | Vị trí chuyển Đã khóa và không dùng cho phân bổ mới theo quy tắc. |
| **UC19-T06** Mở khóa vị trí hợp lệ | Vị trí khóa thủ công, kho ACTIVE, không ngưng sử dụng | Chọn Mở khóa và xác nhận | VT-A đã khóa | Vị trí ACTIVE trở lại. Lịch sử và tồn vẫn truy vết được. |
| **UC19-T07** Vị trí ngưng sử dụng | Có vị trí cũ đã chuyển tồn và ngưng sử dụng theo fixture | Thử mở khóa hoặc chỉnh trạng thái | VT-NL-CU đã nghỉ sử dụng | Không mở lại để phân bổ mới. Lịch sử chuyển vị trí vẫn còn. |
| **UC19-T08** Sửa ngoài scope hoặc xóa có tồn | Kho/vị trí có tồn hoặc thuộc scope khác | Kiểm nút sửa, khóa và xóa bằng actor không đủ quyền | VT-B thuộc Kho B, actor chỉ scope A | Không thao tác ngoài scope. Vị trí có tồn không được xóa cứng từ UI. |

## UC20 – Quản lý lô thành phẩm

**Vai trò** Quản lý kho.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC20-T01** Tạo lô dùng HSD mặc định | SKU ACTIVE có HSD mặc định 365 ngày. Có quy cách hiệu lực | Mở Lô hàng → Lô thành phẩm, nhập NSX và bỏ trống HSD | LOT-TP-T01, NSX D | Lưu lô đúng SKU, giữ phiên bản quy cách và tính HSD từ NSX + 365 ngày. |
| **UC20-T02** Nhập HSD thực tế | SKU cho phép khai báo HSD lô, có dữ liệu tem lô | Tạo lô với HSD thực tế khác mặc định | NSX D, HSD D+300 | Lưu HSD nhập từ tem nếu dữ liệu hợp lệ. |
| **UC20-T03** Ngày không hợp lệ | Đang tạo lô với NSX đã chọn | Nhập HSD trước NSX | NSX D, HSD D−1 | Bị chặn. Không tạo lô. |
| **UC20-T04** Mã lô trùng | LOT-TP-T01 đã tồn tại theo ràng buộc mã | Thêm lô dùng lại mã đó | LOT-TP-T01 | Bị từ chối do trùng mã; lô gốc còn nguyên. |
| **UC20-T05** Đổi HSD mặc định của SKU | Lô A đã tạo với mặc định 365 ngày, quản lý được sửa SKU | Đổi chuẩn SKU rồi tạo lô B | 365 → 540 ngày | Lô A giữ HSD snapshot. Lô B lấy mặc định mới nếu bỏ trống HSD. |
| **UC20-T06** Không sửa hồi tố lô đã giao dịch | Lô A có chứng từ nhập hoặc xuất | Thử sửa NSX/HSD hoặc phiên bản quy cách của lô cũ | Lô A, HSD mới | Thao tác sửa dữ liệu nguồn bất biến bị chặn. Ledger cũ không đổi. |
| **UC20-T07** Tra cứu tồn theo lô và HSD | Lô có tồn ở hai vị trí và actor đủ quyền | Mở chi tiết lô rồi đối chiếu màn Tra cứu kho | VT-A 50, VT-B 30 lon | Đọc đúng vị trí và lượng khi có inventory.search. HSD và định danh nhất quán. |
| **UC20-T08** Khóa hoặc xóa lô có lịch sử | Lô có giao dịch. Có actor được phép quản lý lô | Kiểm thao tác khóa và thử tìm xóa cứng | LOT-TP-T01 đã có ledger | Khóa theo điều kiện nghiệp vụ, giữ lịch sử. Không có thao tác xóa cứng cho lô đã sử dụng. |

## UC21 – Nhập kho nguyên liệu

**Vai trò** Nhân viên kho.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC21-T01** Ghi sổ nguyên liệu đạt QC | Nhân viên kho có quyền; phiếu nhập kho NL đã điều phối đúng kho/vị trí | Mở phiếu, kiểm tra lô và xác nhận ghi sổ | 50 kg đường đạt QC; VITRi-A được phép và còn 80 kg sức chứa | Tồn vật lý tăng đúng 50 kg tại lô/vị trí, ledger ghi một lần và lưu người thực hiện |
| **UC21-T02** Nhập nhiều đợt | QC đã xác nhận 100 kg đạt và chứng từ đợt đầu đã ghi sổ 60 kg | Lập và ghi sổ đợt 2 từ cùng dòng QC | Biên bản QC 100 kg; đợt 1 60 kg; đợt 2 40 kg | Đợt 2 được ghi đúng 40 kg; tổng nhập từ nguồn là 100 kg |
| **UC21-T03** Vượt lượng đạt còn lại | Đã ghi sổ 60 trên 100 kg đạt | Thử xác nhận phiếu đợt 2 vượt mức | Yêu cầu nhập 41 kg | Báo lượng vượt nguồn khả dụng; không tăng tồn và không sinh dòng ledger |
| **UC21-T04** Hàng không đạt QC | Biên bản có cả đạt và không đạt | Tìm nguồn để lập phiếu nhập kho NL và thử dùng dòng không đạt | 80 kg đạt; 20 kg không đạt | Kho NL chỉ nhận phần đủ điều kiện; 20 kg xử lý theo luồng trả hoặc cách ly |
| **UC21-T05** Vị trí không đúng nhóm vật tư | Kho đã cấu hình mapping vật tư–vị trí | Mở chọn vị trí lúc điều phối và thực hiện | Đường được phép ở VITRi-A, thử VITRi-C ngoài mapping của fixture | Danh sách chỉ hiện vị trí hợp lệ; địa chỉ ngoài quy tắc bị từ chối nếu phiếu cũ còn tham chiếu |
| **UC21-T06** Sức chứa hoặc khóa thay đổi trước ghi sổ | Phiếu đã điều phối nhưng chưa ghi; có fixture làm phát sinh thay đổi sau điều phối | Mở phiếu và thử ghi sổ sau khi thay đổi | 50 kg; lượt A vị trí chỉ còn 40 kg; lượt B vị trí đang bị khóa kiểm kê | Mỗi lượt báo trở ngại tương ứng; chứng từ và tồn giữ nguyên |
| **UC21-T07** Sai quyền hoặc sai phạm vi kho | Có phiếu kho A và tài khoản nhân viên chỉ có phạm vi kho B | Mở danh sách và thử URL chi tiết đã biết | Mã phiếu tại kho A | Không lộ dữ liệu phiếu A; không có thao tác ghi sổ |
| **UC21-T08** Ghi sổ lặp hoặc tab cũ | Nhân viên có quyền mở cùng phiếu ở hai tab | Ghi sổ tab 1 rồi tiếp tục từ tab 2 | Cùng phiếu 50 kg đã ghi sổ ở tab 1 | Kết quả duy nhất; tab 2 báo phiếu đã xử lý hoặc phiên bản cũ; không tăng tồn lần hai |

## UC22 – Lập yêu cầu xuất nguyên liệu

**Vai trò** Xưởng sản xuất gửi yêu cầu. Quản lý kho và nhân viên kho tham gia bước phân công.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC22-T01** Lập yêu cầu từ kế hoạch đủ vật tư | Xưởng có phạm vi phân công trên KHSX đã duyệt và không thiếu vật tư | Chọn kế hoạch trong yêu cầu xuất NL rồi lưu nháp | Hai dòng vật tư theo snapshot, đường 40 kg và hương 0,250 kg | Nháp có đủ hai dòng, chính xác số lượng, hiển thị đúng nguồn; không giữ tồn |
| **UC22-T02** Gửi yêu cầu hợp lệ | Có yêu cầu NHAP, đầy đủ dòng snapshot, thuộc phạm vi xưởng | Mở chi tiết rồi gửi yêu cầu | Một yêu cầu đủ định mức và ghi chú hợp lệ | Phiếu sang DA_GUI, xuất hiện trong hàng đợi điều phối theo quyền; chưa trừ tồn |
| **UC22-T03** Kế hoạch thiếu và PO chưa được duyệt đủ | KHSX đã duyệt nhưng thiếu đường 20 kg | Tìm kế hoạch ở nguồn và thử lại sau mỗi trạng thái mua | PO 20 kg CHO_DUYET; PO DA_DUYET chỉ 19 kg; PO DA_DUYET đủ 20 kg | Hai lượt đầu không tạo/gửi được; lượt đủ lượng hiện nguồn nếu các điều kiện khác hợp lệ |
| **UC22-T04** Đủ tổng nhưng sai vật tư | KHSX thiếu riêng cả đường và hương | Tìm kế hoạch sau khi duyệt PO lệch dòng | Thiếu đường 20 kg và hương 2 kg; PO đã duyệt mua 22 kg đường | Vẫn khóa nguồn vì thiếu hương; lượng dư đường không bù cho vật tư khác |
| **UC22-T05** Nguồn không đúng trạng thái hoặc phạm vi | Có KHSX CHO_DUYET của xưởng A và KHSX DA_DUYET chỉ thuộc xưởng B | Tìm nguồn bằng tài khoản chỉ có xưởng A và thử mở chi tiết theo URL | Hai kế hoạch trên | Không có nguồn hợp lệ và không lộ chi tiết kế hoạch xưởng B |
| **UC22-T06** Thừa, thiếu hoặc sai dòng snapshot | Fixture có KHSX đã duyệt với hai dòng nhu cầu | Kiểm tra dữ liệu được điền sẵn và thử gửi nháp cũ có chi tiết lệch | Thiếu một dòng, dư một dòng hoặc đường 40,001 kg khi phải là 40 kg | UI lấy đủ dòng từ snapshot; dữ liệu lệch không được gửi; chưa có phân công hoặc tồn thay đổi |
| **UC22-T07** Xóa phiếu nháp | Phiếu NHAP do xưởng có quyền tạo, chưa có ràng buộc downstream | Chọn Xóa, hủy xác nhận rồi thử lại và xác nhận | Mã 1 phiếu NHAP, so với 1 phiếu DA_GUI | Hủy hộp thoại giữ nháp; xác nhận xóa đúng nháp; DA_GUI không có thao tác xóa nháp |
| **UC22-T08** Phân công theo kho và người nhận | Phiếu DA_GUI của xưởng A, có hai nhân viên kho A và một nhân viên kho B | Quản lý kho A chọn Cung cấp nguyên vật liệu, phân công rồi kiểm tra màn hình mỗi nhân viên | Phân công hai nhân viên kho A; thử chọn người chỉ thuộc kho B | Hai người được giao thấy đúng việc; người ngoài kho không là lựa chọn hợp lệ; chưa phát sinh ledger |

## UC23 – Xuất kho nguyên liệu

**Vai trò** Quản lý kho lập và gửi phiếu. Nhân viên kho được phân công tiếp nhận.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC23-T01** Tiếp nhận phiếu đã gửi | Quản lý đã phân bổ và gửi; reservation còn hạn; nhân viên khác người gửi được phân công đúng kho | Nhân viên mở phiếu Chờ nhân viên tiếp nhận rồi xác nhận Tiếp nhận phiếu | 40 kg đã giữ; tồn vật lý trước 100 kg; reserved trước 40 kg | Phiếu HOAN_THANH; tồn vật lý còn 60 kg, lượng giữ giảm 40 kg; ledger và audit tiếp nhận chỉ ghi một lần |
| **UC23-T02** Chọn lô theo FEFO và tách lượng | Có hai lô đạt QC và không bị khóa tại kho đã phân công | Quản lý lấy gợi ý phân bổ, kiểm tra lô/vị trí rồi gửi để nhân viên tiếp nhận | Lô A HSD D+30 còn 10 kg; lô B HSD D+60 còn 35 kg; cần 25 kg | Gợi ý A 10 kg và B 15 kg; tiếp nhận chỉ tiêu thụ các lượng phân bổ đã xác nhận |
| **UC23-T03** Loại lô không đủ điều kiện | Cùng vật tư có lô hết hạn, cách ly và lô đạt | Tải phân bổ rồi kiểm tra danh sách lô có thể sử dụng | HSD D−1; lô cách ly; lô đạt HSD D+30 còn đủ | Gợi ý chỉ dùng lô đạt; lô hết hạn/cách ly không thể ghi sổ như hàng đủ điều kiện |
| **UC23-T04** Thiếu tồn hoặc vượt hạn mức | Nguồn chỉ còn 50 kg được phép xuất; 30 kg khả dụng sau phần đã giữ | Quản lý thử gửi phiếu trên dữ liệu thiếu | Lượt A 40 kg; lượt B 51 kg | Cả hai lượt bị chặn theo lý do tương ứng; không tạo lượng giữ dở dang |
| **UC23-T05** Nhận ngoài phân công hoặc sai người | Phiếu đã gửi cho nhân viên A; B cùng kho nhưng không được giao | Đăng nhập B, kiểm tra danh sách/URL phiếu rồi thử với người lập | B không được phân công; người phân bổ là một tài khoản khác A | B không thấy phiếu được giao; người lập không thể tự tiếp nhận nếu vướng maker–checker; tồn không đổi |
| **UC23-T06** Lượng giữ hết hạn hoặc vị trí bị khóa | Phiếu còn chờ tiếp nhận; dùng fixture tạo hold hết hạn hoặc khóa vị trí | Mở chi tiết và thử tiếp nhận, tải lại hàng đợi | Lượt A reservation hết hạn; lượt B vị trí bị khóa kiểm kê | Báo lý do, không trừ tồn; phiếu hết hạn không còn được tính là chờ tiếp nhận hợp lệ |
| **UC23-T07** Ghi sổ trùng hoặc stale | Hai tab đồng thời tải cùng phiếu đã gửi | Tiếp nhận ở tab 1 rồi tiếp nhận ở tab 2 | Cùng nguồn, phiếu và phiên bản ban đầu | Một lần ghi sổ; tab cũ báo kết quả hiện có hoặc lỗi phiên bản; không giảm tồn thêm |
| **UC23-T08** Xuất từng phần | Nguồn cần 50 kg và cho tạo nhiều phiếu xuất | Tiếp nhận phiếu 20 kg và kiểm tra nguồn, rồi tiếp nhận phiếu 30 kg | Nguồn 50 kg; hai phiếu được phân bổ và tiếp nhận độc lập | Sau 20 kg nguồn còn lượng cần cấp; chỉ hoàn tất khi đủ 50 kg thực ghi sổ |

## UC24 – Lập yêu cầu nhập thành phẩm

**Vai trò** Xưởng sản xuất. Bộ phận QC nhận yêu cầu đã gửi.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC24-T01** Lưu và gửi QC | Xưởng có KHSX DA_DUYET, đúng phân công/SKU, có lô và sản lượng dương | Chọn phân công, lô, số lượng hoàn thành, lưu rồi gửi QC | SKU TP001, lô thành phẩm A, 240 đơn vị hợp lệ | Yêu cầu liên kết đúng kế hoạch và sang CHO_QC; QC thấy việc; chưa tăng tồn |
| **UC24-T02** Bắt buộc có lô | Xưởng được quyền tạo và đã chọn kế hoạch hợp lệ | Bỏ chọn lô rồi thử lưu/gửi | Sản lượng 240, lô để trống | Form báo thiếu lô ở đúng dòng; không gửi QC và không tạo nhập kho |
| **UC24-T03** Sai SKU của lô | Phân công sản xuất TP001; có lô TP001 và TP002 | Mở bộ chọn lô và kiểm tra nháp cũ tham chiếu lô sai SKU | KHSX TP001, lô của TP002 | Bộ chọn giới hạn theo SKU; dữ liệu lô không khớp không thể gửi QC |
| **UC24-T04** Lượng sai hoặc vượt mức của phân công | Phân công còn cho phép khai 100 đơn vị | Thử lưu hoặc gửi với dữ liệu sai | 0, −1 và 101 đơn vị so với mức còn 100 | Chặn lượng không hợp lệ; không chuyển trạng thái hoặc tăng tồn |
| **UC24-T05** Nhiều đợt kê khai cùng phân công | Kế hoạch 240 đơn vị, đã có đợt 1 hợp lệ 100 | Gửi đợt 2 rồi thử khai thêm vượt kế hoạch | Đợt 2 140; thử thêm 1 đơn vị qua yêu cầu mới | Giữ dấu vết từng đợt; chặn vượt phần còn lại theo trạng thái nguồn; chưa tăng tồn khi gửi QC |
| **UC24-T06** Kế hoạch chưa duyệt hoặc ngoài xưởng | Tài khoản được gán một xưởng; có hai nguồn không hợp lệ | Tìm kế hoạch và thử mở chi tiết theo URL đã biết | CHO_DUYET cùng xưởng và DA_DUYET thuộc xưởng khác | Không chọn được hai nguồn; không lộ nội dung ngoài phạm vi |
| **UC24-T07** Cập nhật sau khi chuyển QC | Yêu cầu đã CHO_QC, bên QC có thể xử lý | Mở bằng xưởng và thử sửa/gửi lần nữa từ tab cũ | Yêu cầu đã gửi với phiên bản cũ ở tab 2 | Không tạo yêu cầu QC trùng; hành động sau khi gửi theo đúng trạng thái và quyền |
| **UC24-T08** Hoàn tất KHSX theo nhập kho thực tế | Hai phân công trong cùng KHSX; có thành phẩm đạt, hàng lỗi và phần tái chế truy được nguồn | Theo dõi trạng thái khi gửi QC, nhập từng phần rồi ghi sổ phần đủ cho cả hai phân công | Chỉ FINISHED đã ghi sổ được tính; fixture có FAILED/cách ly và REWORK hợp lệ | KHSX giữ trạng thái xử lý khi mới gửi QC hoặc còn phân công thiếu; tự HOAN_THANH khi từng phân công đủ lượng nhập hợp lệ |

## UC25 – Quản lý thành phẩm

**Vai trò** Quản lý kho.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC25-T01** Tạo SKU chai hoặc lon | Quản lý có quyền danh mục, đơn vị cơ sở hợp lệ | Thêm SKU rồi tải lại danh mục và mở chi tiết | Mã TP-TEST-A; CAN; 330 ml; đơn vị lon; hạn mặc định 365 ngày | SKU hiển thị đủ thông tin tiếng Việt, đúng loại bao bì và đơn vị |
| **UC25-T02** Dữ liệu bắt buộc và mã duy nhất | Đã có mã TP-TEST-A | Thử lưu với mã lặp, tên trống và dung tích không dương | TP-TEST-A; tên trống; dung tích 0 và −330 ở hai lượt | Chỉ ra trường lỗi; không tạo SKU trùng hoặc dung tích sai |
| **UC25-T03** Quy cách lốc, thùng, pallet | Có TP001, TP015 và đơn vị đóng gói đúng | Kiểm tra chi tiết quy cách rồi dùng trong form chứng từ | Lốc 6, thùng 24; pallet TP001 60 thùng, TP015 80 thùng | Quy đổi lượng đúng 6/24 và 1.440/1.920 đơn vị tương ứng; không dùng hệ số SKU khác |
| **UC25-T04** Phiên bản quy cách có lịch sử | Phiên bản v1 đã được dùng trong chứng từ; có quyền bổ sung v2 | Thử sửa v1 rồi thêm v2 ngày hiệu lực mới | v1 24 đơn vị/thùng; v2 30 đơn vị/thùng cho SKU fixture | Giữ v1 và số lượng chứng từ cũ; chứng từ mới dùng phiên bản được chọn còn hiệu lực |
| **UC25-T05** Hạn mặc định và hạn thực tế của lô | Có SKU HSD mặc định và quyền tạo lô TP | Tạo hai lô, một bỏ trống HSD và một điền HSD hợp lệ; đổi hạn mặc định | NSX D; hạn mặc định 365 ngày; HSD thực tế D+300 ở lô thứ hai | Hai lô giữ HSD đã sinh/lưu tương ứng; đổi mặc định không đổi hai lô cũ |
| **UC25-T06** Giá theo đơn vị và snapshot | Có giá SKU fixture, có đơn đã xác nhận và đơn nháp | Cập nhật giá hiệu lực rồi mở đơn cũ và nháp | Giá cũ 100.000 VND/thùng; mới 110.000 VND/thùng | Đơn xác nhận giữ snapshot; đơn nháp hiển thị tạm tính theo giá hiệu lực và quy tắc làm tròn |
| **UC25-T07** Khóa SKU có lịch sử | SKU đang hoạt động và có chứng từ tham chiếu | Dùng thao tác khóa được phép rồi xem lại chứng từ và danh sách lựa chọn mới | SKU có một chứng từ đã xác nhận | Chứng từ cũ vẫn truy vết được; SKU khóa không còn là lựa chọn hợp lệ để tạo giao dịch mới |
| **UC25-T08** Tách quyền xem và sửa | Một tài khoản xem danh mục và một tài khoản ngoài phạm vi chức năng | Mở danh sách và thử dùng URL mở form quản lý | Hai tài khoản không có products.write | Tài khoản chỉ đọc thấy dữ liệu theo quyền, không có sửa/thêm; tài khoản ngoài quyền bị chặn |

## UC26 – Lập đơn mua nguyên liệu

**Vai trò** Bộ phận mua hàng.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC26-T01** Nhận thiếu vật tư mà không có scope xưởng | Nhân viên mua có quyền nội bộ/phạm vi kho, chưa được gán xưởng; KHSX thiếu đã duyệt | Mở hàng đợi mua và chi tiết nguồn cần mua | Thiếu đường 20 kg và hương 2 kg ở xưởng A | Thấy vật tư, lượng thiếu và nguồn theo quyền; không thấy BOM/phân công/lịch xưởng trong dữ liệu luồng mua |
| **UC26-T02** Lưu nháp và gửi duyệt | Nguồn thiếu đã duyệt; NCC đủ điều kiện; dòng giá và lượng hợp lệ | Chọn nguồn, NCC, chi tiết và ghi chú; lưu rồi gửi | 20 kg đường, 30.000 VND/kg, ghi chú giao buổi sáng | NHAP chuyển CHO_DUYET, Ban giám đốc thấy phiếu; tổng 600.000 VND; chưa tăng tồn |
| **UC26-T03** Gợi ý giá nhà cung cấp | Có NCC với báo giá hiệu lực cho vật tư nguồn | Chọn NCC, kiểm tra giá gợi ý rồi sửa trước khi gửi | Giá gợi ý 30.000; nhập 31.000 VND/kg cho 20 kg | Giá có thể sửa; PO chốt 620.000 VND khi gửi; dữ liệu báo giá gốc vẫn giữ |
| **UC26-T04** Thiếu dữ liệu hoặc lượng/giá sai | Có quyền lập PO và nguồn hợp lệ | Lần lượt thử lưu/gửi thiếu NCC hoặc thiếu dòng, thử lượng âm/giá không hợp lệ | NCC trống, 0 dòng, −2 kg, giá −1 VND | Form báo trường lỗi; không chuyển CHO_DUYET và không sinh giao nhận |
| **UC26-T05** Vượt nhu cầu còn được mua | Có nhu cầu 20 kg, đã duyệt PO 12 kg nguồn đó | Tạo PO bổ sung rồi gửi với lượng vượt phần còn lại | 9 kg khi chỉ còn 8 kg | Chặn lượng vượt; không làm tăng lượng PO đã duyệt trong nguồn |
| **UC26-T06** Đơn vị và làm tròn VND | Vật tư đủ khả năng mua theo lượng lẻ, chưa dùng hết quota | Nhập số lượng và đơn giá lẻ rồi đối chiếu tổng khi gửi | 1,5 kg × 10.001 VND/kg | Dòng ghi 15.002 VND theo HALF_UP; tổng cộng từ các dòng đã chốt |
| **UC26-T07** Nguồn không vào hàng đợi mua | Có kế hoạch đủ vật tư, chưa duyệt hoặc cần kho ngoài phạm vi | Tìm lần lượt từng nguồn khi lập PO | KHSX đủ; CHO_DUYET; DA_DUYET thiếu ở kho ngoài scope | Ba nguồn không được dùng trong luồng mua hiện hành; không lộ chi tiết nguồn ngoài quyền |
| **UC26-T08** Xóa nháp và giữ lịch sử đơn đã gửi | Người mua có quyền trên PO NHAP chưa phụ thuộc và PO CHO_DUYET | Thử hủy xác nhận xóa, xác nhận xóa nháp, rồi xem PO đã gửi | Hai mã PO khác nhau | Hủy giữ nháp, xác nhận chỉ xóa nháp đủ điều kiện; PO đã gửi vẫn còn và có lịch sử |

## UC27 – Duyệt đơn mua nguyên liệu

**Vai trò** Ban giám đốc.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC27-T01** Duyệt PO hợp lệ | Ban giám đốc có quyền, khác người lập; PO CHO_DUYET còn hạn mức | Mở chi tiết, kiểm tổng tiền, chọn Duyệt và xác nhận | PO 20 kg đường × 30.000 VND, đúng nguồn | PO DA_DUYET, giữ snapshot 600.000 VND, ghi người duyệt; tồn chưa tăng |
| **UC27-T02** Từ chối có lý do | Có PO CHO_DUYET thuộc quyền, người duyệt độc lập | Từ chối, nhập lý do rồi xác nhận | Lý do “Giá vượt ngân sách” | PO bị từ chối, người mua thấy lý do; lượng PO này không cấp quota giao nhận |
| **UC27-T03** Bắt buộc lý do từ chối | PO còn CHO_DUYET | Chọn Từ chối và thử để trống hoặc chỉ nhập dấu cách | Chuỗi rỗng hoặc ba dấu cách | Hiện lỗi lý do; phiếu vẫn CHO_DUYET |
| **UC27-T04** Chặn tự duyệt | Fixture tài khoản có cả quyền lập và duyệt PO | Dùng chính tài khoản lập PO để thử duyệt phiếu đó | PO CHO_DUYET do người đang thao tác lập | Bị chặn bởi maker–checker; cần người duyệt độc lập; không mở nguồn giao nhận |
| **UC27-T05** Sai quyền hoặc ngoài phạm vi | Có PO ở kho A, tài khoản mua hoặc người duyệt chỉ có kho B | Mở trang duyệt và thử URL chi tiết PO kho A | Tài khoản chỉ lập, và tài khoản duyệt không có scope kho A | Tài khoản lập không thấy thao tác duyệt; người ngoài phạm vi không đọc/duyệt PO kho A |
| **UC27-T06** PO đã xử lý và phiên bản cũ | Hai người có quyền mở cùng PO khi vẫn CHO_DUYET | Người A duyệt; người B thử từ chối bằng tab cũ | Cùng mã PO và phiên bản cũ | Chỉ một quyết định có hiệu lực; tab B cập nhật trạng thái hiện hành hoặc báo xung đột |
| **UC27-T07** Hai PO cạnh tranh quota | KHSX còn thiếu 20 kg; có hai PO chờ 12 và 10 kg cùng vật tư/nguồn | Duyệt 12 kg trước rồi thử duyệt 10 kg | PO thứ hai vượt phần còn lại 8 kg | Chặn duyệt thứ hai nếu không còn quota; không tính lượng 22 kg là đã duyệt |
| **UC27-T08** Mở yêu cầu cấp NL đúng mức | KHSX thiếu nhiều dòng vật tư; có đủ quyền xưởng và mua riêng biệt | Duyệt từng PO rồi đổi sang tài khoản xưởng kiểm tra nguồn UC22 | Đường đủ sau PO đầu; hương chỉ đủ sau PO thứ hai | Xưởng chỉ lập yêu cầu cấp khi tất cả dòng đã đủ PO duyệt; không làm thay đổi kiểm tra tồn hoặc QC khi xuất |

## UC29 – QC nguyên liệu

**Vai trò** Nhân viên kho đăng ký đợt giao gắn với PO. Bộ phận QC kiểm tra nguyên liệu.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC29-T01** Tiếp nhận đúng PO và lô | Có PO DA_DUYET, kho đúng phạm vi và lô giao đúng nguyên liệu | Đăng ký lượng giao từ PO, mở hồ sơ chờ QC | PO đường 100 kg, lô đường A giao 60 kg | Tạo yêu cầu QC liên kết đúng PO/lô và số 60 kg; chưa tăng tồn đạt |
| **UC29-T02** QC chia đạt và không đạt | Hồ sơ chờ QC hợp lệ, có quyền và đúng kho | Nhập kết quả từng dòng, lưu và xác nhận biên bản | Kiểm 60 kg, đạt 55 kg, không đạt 5 kg | Biên bản được xác nhận với hai lượng; chỉ 55 kg đủ điều kiện nhập kho NL; 5 kg đi luồng xử lý |
| **UC29-T03** Toàn bộ lô không đạt | Nguồn QC 20 kg chờ xử lý | Xác nhận kiểm nghiệm với đạt bằng 0 và hướng xử lý theo luồng hiện hành | Đạt 0 kg, không đạt 20 kg | Không tạo nguồn nhập kho NL đạt; xử lý trả NCC/cách ly theo quyền, giữ dấu vết biên bản và lô |
| **UC29-T04** Tổng lượng QC không khớp | Hồ sơ đăng ký 60 kg | Thử lưu kết quả thiếu hoặc vượt tổng kiểm | Đạt 55 + không đạt 4; lượt sau 56 + 5 | Cả hai tổ hợp bị chặn; không xác nhận biên bản sai hoặc phát sinh nguồn nhập |
| **UC29-T05** PO chưa duyệt hoặc lô sai vật tư | Có PO CHO_DUYET, PO DA_DUYET mua đường và lô hương | Tìm nguồn khi đăng ký và thử chọn lô không khớp | PO đang chờ; PO đường với lô hương | Không dùng PO chưa duyệt; không ghi nhận giao sai vật tư vào PO đường |
| **UC29-T06** Nhận nhiều đợt và chặn vượt PO | PO 100 kg đã ghi nhận giao 60 kg | Đăng ký lần hai đúng 40 kg; thực hiện lượt thử riêng vượt lượng còn lại | Đợt 2 40 kg hoặc 41 kg | 40 kg được ghi nhận đúng đợt; 41 kg bị từ chối; tổng giao không vượt 100 kg |
| **UC29-T07** Thiếu quyền hoặc không đúng kho | Có hồ sơ QC thuộc kho A, người dùng chỉ thuộc kho B hoặc không có vai trò QC | Tìm hồ sơ và mở URL chi tiết tương ứng | Biên bản kho A | Không thể xem ngoài phạm vi hoặc xác nhận bằng quyền không phù hợp; tồn không đổi |
| **UC29-T08** Xác nhận lặp biên bản | QC có thể mở cùng một nháp ở hai tab hoặc hai người có quyền | Xác nhận một lần rồi thao tác tiếp từ dữ liệu cũ | Cùng biên bản và phiên bản trước xác nhận | Chỉ một kết quả có hiệu lực; nguồn lượng đạt không bị nhân đôi |

## UC30 – Quản lý lô nguyên liệu

**Vai trò** Quản lý kho.

| Chức năng | Tiền điều kiện | Mô tả | Dữ liệu test | Kết quả mong muốn |
| --- | --- | --- | --- | --- |
| **UC30-T01** Cấp mã lô tự động | Quản lý kho có quyền và nguyên liệu đường đang hoạt động | Mở Thêm lô nguyên liệu, chọn vật tư và lưu ngày hợp lệ | Đường danh mục chuẩn hoặc nguyên liệu thử tên Đường thử. NSX trước D, HSD sau NSX | Ô mã chỉ đọc, mã duy nhất được sinh theo vật tư. Ví dụ `LO-DUONG-01` với đường chuẩn, `LO-DUONG-THU-<ID>-01` với nguyên liệu thử. |
| **UC30-T02** Không đổi vật tư hoặc mã lô cũ | Một lô đường đã tồn tại | Mở sửa, kiểm trường mã và vật tư, đổi một trường được phép | LO-DUONG-01 thuộc DUONG, thử chuyển sang HUONG | Mã và vật tư cố định; phần được phép sửa mới thay đổi; tham chiếu lịch sử vẫn đúng lô |
| **UC30-T03** Bắt buộc HSD theo vật tư | Nguyên liệu bật quản lý hạn sử dụng | Tạo lô, chọn nguyên liệu và bỏ trống HSD | NSX hợp lệ, HSD trống | Báo “Lô phải có hạn sử dụng”. Không lưu lô thiếu HSD. |
| **UC30-T04** Thứ tự ngày và lô hết hạn | Có nguyên liệu theo dõi HSD | Thử HSD trước NSX rồi kiểm một lô đã quá HSD khi tra cứu xuất | NSX D−5, HSD D−6; lô có NSX D−20, HSD D−1 | Chặn thứ tự ngày sai; lô đã hết hạn không là nguồn xuất hợp lệ |
| **UC30-T05** Truy vết theo vị trí | Lô có tồn và chứng từ trong kho; một tài khoản có scope và một không | Lọc lô, xem vị trí và lịch sử từ màn tra cứu theo từng tài khoản | Lô đường A ở VITRi-A, có một phiếu nhập và một phiếu xuất | Người có quyền thấy liên kết đúng lô/vị trí; dữ liệu kho ngoài scope không lộ |
| **UC30-T06** Sinh mã khi thao tác đồng thời | Hai người quản lý tạo lô cùng vật tư và dữ liệu hợp lệ | Lưu từ hai trình duyệt trong khoảng thời gian trùng nhau | Cùng DUONG, cùng NSX/HSD | Không thể lưu hai lô trùng mã; nếu cả hai thành công mỗi lô có mã riêng |
| **UC30-T07** Lô đã phát sinh chứng từ | Lô đã được tham chiếu, quản lý có quyền khóa theo danh mục | Kiểm hành động xóa/khóa và thử chọn lô cho giao dịch mới | Một lô trên phiếu đã ghi sổ | Không xóa cứng lô; nếu khóa hợp lệ thì lô không dùng để cấp mới, chứng từ cũ vẫn đọc được |
| **UC30-T08** Người xem không được tạo hoặc sửa | Tài khoản có quyền xem phù hợp và một tài khoản ngoài nhóm quyền | Mở danh sách lô, kiểm menu thêm/sửa và URL quản lý | Tài khoản thiếu materialLots.write | Thao tác ghi bị ẩn hoặc bị chặn theo quyền; danh sách chỉ hiện dữ liệu mà tài khoản được phép xem |
