# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Ưu tiên thiết kế giao diện cho **tất cả actor** trong hệ thống. Mỗi vai trò cần thấy công việc đến lượt mình, dữ liệu trong phạm vi được cấp và kết quả sau khi thao tác.

| Vai trò | Công việc chính |
| --- | --- |
| Khách hàng | Đặt hàng, theo dõi đơn và yêu cầu trả hàng khi đủ điều kiện. |
| Bộ phận lập kế hoạch sản xuất | Lập kế hoạch từ đơn hàng, phân công xưởng và kiểm tra nhu cầu nguyên liệu. |
| Bộ phận mua hàng | Tiếp nhận nhu cầu nguyên liệu thiếu, chọn nhà cung cấp và lập đơn mua để trình duyệt. |
| Ban giám đốc | Duyệt hoặc từ chối kế hoạch, đơn mua và đề nghị điều chỉnh theo quyền, theo dõi tình hình kho qua báo cáo. |
| Bộ phận quản lý kho | Điều phối nhập/xuất, phân công cấp nguyên liệu, quản lý kho và vị trí, xác minh chênh lệch kiểm kê. |
| Nhân viên kho | Thực hiện nhập/xuất được giao, đối chiếu lô, vị trí và số lượng, tra cứu tồn kho và sổ biến động. |
| Bộ phận QC | Kiểm tra nguyên liệu, thành phẩm và hàng trả. Ghi kết quả để các bộ phận tiếp theo xử lý phần đạt hoặc phần lỗi. |
| Xưởng sản xuất | Tiếp nhận phân công đủ điều kiện, yêu cầu cấp nguyên liệu và đề nghị nhập thành phẩm sau sản xuất. |
| Hội đồng kiểm kê | Ghi và xác nhận số đếm theo phạm vi kiểm kê được giao. |
| Quản trị hệ thống | Quản lý tài khoản và quyền theo phạm vi SRS. Màn Người dùng hiện là trang giữ chỗ, cần xác định phạm vi triển khai trước khi thiết kế chi tiết. |

Quy trình giao hàng có bộ phận giao hàng phối hợp. SRS cũng theo dõi các lần giao nguyên liệu từ nhà cung cấp. Hai bên này chưa có phạm vi giao diện đăng nhập riêng được xác nhận. [SRS](docs/srs.md)

## Product Purpose

WMS Nhà Máy là hệ thống quản lý kho cho nhà máy sản xuất nước ngọt đóng chai/lon có nhiều kho và xưởng. Hệ thống nối đơn hàng, kế hoạch, nhu cầu mua và kết quả QC với phiếu nhập/xuất, giao hàng, hàng trả, kiểm kê và báo cáo.

Một luồng đạt yêu cầu khi người dùng xác định được chứng từ nguồn, trạng thái hiện tại và bước tiếp theo. Người có quyền tra cứu cần đối chiếu được biến động tồn với chứng từ, lô, vị trí và người thực hiện.

## Positioning

Đơn hàng là căn cứ lập kế hoạch theo xưởng. Nhu cầu thiếu dẫn đến mua nguyên liệu, còn QC, phân bổ và ghi sổ xác định lượng thực sự được nhập hoặc xuất. Cấu trúc này cho phép theo dõi cùng một luồng qua nhiều bộ phận và phân biệt tồn thực tế, lượng đang giữ và lượng khả dụng. [SRS](docs/srs.md)

## Operating Context

- Người dùng thao tác trên trình duyệt desktop, tablet hoặc điện thoại. Giao diện sử dụng tiếng Việt.
- Công việc hằng ngày xoay quanh danh sách chờ xử lý, chi tiết chứng từ, bộ lọc và tra cứu theo mã hàng, mã lô, vị trí hoặc mã chứng từ.
- Ngày nghiệp vụ tính theo giờ Việt Nam. Số lượng hiển thị cùng đơn vị. Thành phẩm có đơn vị cơ sở chai hoặc lon theo SKU và quy đổi lốc, thùng, pallet theo quy cách đã cấu hình.
- Dự án có môi trường đồ án chạy bằng Docker Compose và dữ liệu mẫu. Trạng thái nghiệm thu được theo dõi riêng theo use case. [Hướng dẫn Docker](docs/docker_warehouse.md) · [Hiện trạng dự án](docs/current_status.md)

## Capabilities and Constraints

- Giữ các trạng thái nghiệp vụ, quyền theo vai trò và phạm vi khách hàng, kho, xưởng. Cho người dùng biết lý do thao tác bị chặn và bước tiếp theo nếu có.
- Điều phối nhập/xuất và ghi sổ là các bước riêng. Phiếu xuất giữ tồn trước khi người có quyền thực hiện. Chỉ chứng từ hợp lệ đã ghi sổ mới thay đổi tồn thực tế. Giữ kiểm tra QC, số lượng, hạn dùng, FEFO, vị trí và sức chứa.
- Kế hoạch sản xuất tự hoàn thành khi đủ sản lượng của từng phân công đã đạt QC và nhập kho. Khi đặt đơn, hệ thống có thể điền thông tin giao hàng từ hồ sơ và kiểm tra thời gian giao sớm nhất theo quy tắc 7 ngày lịch.
- Phạm vi sản phẩm gồm quy trình kho, sản xuất ở mức theo dõi kết quả xưởng và các bước bàn giao. Công thức pha chế, điều khiển dây chuyền, thanh toán, hóa đơn thuế và kế toán tổng hợp nằm ngoài phạm vi. [SRS](docs/srs.md) · [Quyết định nghiệp vụ](docs/decisions.md) · [Hiện trạng dự án](docs/current_status.md)

## Brand Commitments

- Dùng tên **WMS Nhà Máy** và nhận diện khối hộp đang có.
- Dùng thuật ngữ tiếng Việt nhất quán với chứng từ và vai trò. Ưu tiên câu ngắn, nói rõ hành động và kết quả.

## Evidence on Hand

- [SRS](docs/srs.md) ghi vai trò, quy trình và 29 use case. [Quyết định nghiệp vụ](docs/decisions.md) và [hiện trạng dự án](docs/current_status.md) ghi các điều chỉnh sau SRS và trạng thái kiểm chứng.
- [Dữ liệu mẫu](data.md) dùng để trình bày và kiểm tra đồ án. [Ảnh kho](frontend/src/assets/login-warehouse.webp) là hình minh họa giao diện.

## Product Principles

1. Cân nhắc công việc của từng vai trò khi thay đổi giao diện chung. Giữ đường đến việc cần làm ngắn và dễ nhận ra.
2. Thể hiện rõ trạng thái, phạm vi, đơn vị và nguồn dữ liệu trước các thao tác ảnh hưởng đến tồn kho.
3. Khi bàn giao giữa bộ phận, hiển thị chứng từ liên quan và bước tiếp theo để người nhận tiếp tục được công việc.
4. Dùng dữ liệu và thao tác có thật. Diễn giải rõ trạng thái chưa có dữ liệu, chưa cấu hình hoặc thiếu quyền.

## Accessibility & Inclusion

- Giữ thao tác chính trong vùng nhìn thấy trên màn hình nhỏ, nhất là khi xem chứng từ và tra cứu kho.
- Hỗ trợ thao tác bàn phím. Hộp thoại có tiêu đề, đóng bằng Esc và trả tiêu điểm về nút đã mở. Nút chỉ có biểu tượng cần tên dễ hiểu.
- Dùng chữ để diễn đạt trạng thái và lỗi. Màu sắc hỗ trợ đọc nhanh. [Hiện trạng giao diện](docs/current_status.md)
