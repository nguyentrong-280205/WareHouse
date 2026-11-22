---
name: WMS Nhà Máy
description: Giao diện vận hành kho cho nhà máy nước ngọt đóng chai và đóng lon
colors:
  canvas: "#f8fafc"
  surface: "#ffffff"
  ink: "#0f172a"
  muted: "#475569"
  line: "#e2e8f0"
  control-border: "#64748b"
  primary: "#1d4ed8"
  primary-hover: "#1e40af"
  focus: "#2563eb"
  info-bg: "#eff6ff"
  info-text: "#1e40af"
  success-bg: "#f0fdf4"
  success-text: "#166534"
  warning-bg: "#fffbeb"
  warning-text: "#92400e"
  danger-bg: "#fef2f2"
  danger-text: "#991b1b"
  qc-bg: "#faf5ff"
  qc-text: "#6b21a8"
  neutral-bg: "#f1f5f9"
  neutral-text: "#334155"
typography:
  page:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "-0.02em"
  section:
    fontSize: "18px"
    fontWeight: 650
    lineHeight: "26px"
  body:
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  caption:
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "18px"
rounded:
  control: "8px"
  panel: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
---

## Overview

Thiết kế theo phương án **Bàn làm việc vận hành**. Đưa việc đến lượt xử lý lên trước. Khi xem một chứng từ, người dùng cần xác định được mã, nguồn, phạm vi, trạng thái và bước tiếp theo. Hiển thị hậu quả của việc xác nhận, điều phối hoặc ghi sổ ở đúng nơi người có quyền ra quyết định.

`PRODUCT.md` mô tả người dùng và bối cảnh. SRS, ma trận quyền và các quyết định hiện hành xác định luồng, điều kiện và quyền. `frontend/src/index.css` hiện thực token `--wms-*` và lớp dùng chung `wms-*`. Tên **WMS Nhà Máy**, biểu tượng khối hộp, tiếng Việt và các component React hiện hữu là nền của hệ thống.

## Colors

- Dùng xanh lam cho thao tác chính, liên kết và mục điều hướng đang chọn. Chữ trắng trên primary đạt khoảng 6,70:1.
- Dùng chữ cùng nền nhẹ cho thông tin, thành công, chờ xử lý, lỗi, công đoạn QC và trạng thái trung tính. Nhãn trạng thái mang nghĩa của chứng từ. **Đã duyệt**, **Đã giữ tồn** và **Đã ghi sổ** là các bước khác nhau.
- Dùng đường chia nhẹ giữa các dòng. Dùng viền control đủ rõ ở nơi viền xác định vùng nhập liệu. Trạng thái focus dùng viền 2 px cách vùng điều khiển 2 px.
- Biểu đồ dùng chuỗi màu riêng và nhãn chuỗi rõ ràng. Bảng và báo cáo lưu giữ ngữ cảnh như đơn vị, ngày, kho và khoảng thời gian.

## Typography

Dùng system font để giữ dấu tiếng Việt rõ trên thiết bị doanh nghiệp. Body và bảng dùng 14/20 px. Tiêu đề trang desktop dùng 24/32 px. Trên điện thoại, header có thể dùng 18 px và xuống dòng. Giữ ID dài có thể đọc được trong chi tiết.

Căn phải và dùng chữ số tabular cho số lượng, đơn giá, tổng tiền và chênh lệch. Dùng các formatter hiện hữu cho DECIMAL, VND và ngày nghiệp vụ theo giờ Việt Nam. Hiển thị số lượng như `2.000` và đặt đơn vị cơ sở hoặc đơn vị đóng gói cạnh số khi dữ liệu nguồn có đơn vị.

## Layout

- Header cao tối thiểu 64 px với tiêu đề, tìm kiếm, chuông theo quyền và tài khoản. Sidebar desktop 256 px hoặc 80 px khi thu gọn. Nội dung rộng tối đa 1.600 px, padding 16 px và tăng lên 24 px từ 1.024 px.
- Dưới 640 px, ưu tiên một cột. Danh sách chứng từ, báo cáo và bảng cần đọc theo bản ghi hiển thị tên trường cùng dữ liệu. Giữ mã và thao tác có thể tìm thấy trên từng bản ghi.
- Từ 640 đến 1.023 px, dùng sidebar dạng ngăn kéo. Nhóm trường liên quan có thể lên hai cột. Từ 1.024 px, dùng sidebar cố định và bảng đầy đủ. Bảng có nhiều cột đối chiếu được cuộn trong vùng bảng.
- Dùng mật độ gọn khi đọc nhiều lô hoặc chứng từ. Dùng khoảng cách rộng hơn cho nhập liệu, phê duyệt và kiểm kê. Thanh bộ lọc xuống dòng khi thiếu chiều ngang. Duy trì thứ tự đọc nguồn, nội dung và hành động trên mọi kích thước.

## Elevation & Depth

Dùng bề mặt trắng và đường chia cho bảng, bộ lọc và nhóm công việc. Giữ bóng nhẹ cho cửa sổ nổi và dialog. Nền phía sau dialog giảm sáng để giữ sự chú ý vào bước đang thực hiện.

## Shapes

Control bo 8 px, panel và dialog bo 12 px. Dùng pill cho nhãn trạng thái và số việc chờ. Biểu tượng dùng Lucide cùng nhãn hoặc tên truy cập phù hợp.

## Components

| Thành phần | Quy chuẩn |
| --- | --- |
| Nút | Primary cho bước chính, secondary cho thao tác phụ, danger cho thao tác có tính hủy hoặc từ chối. Nút gọn dùng trên bảng desktop. Hướng tới vùng chạm tối thiểu 44 px cho thao tác chính và nút biểu tượng trên điện thoại. |
| Input và select | Nhãn nhìn thấy, nội dung mẫu dễ đọc, lỗi sát trường khi lỗi xác định được trường. Giá trị do nguồn quyết định được thể hiện ở chế độ chỉ đọc. Giữ dữ liệu đã nhập khi phản hồi lỗi. |
| Danh sách và bảng | Tiêu đề cột rõ ràng, mã dễ quét, cột số căn phải, đơn vị cạnh lượng khi có. Giữ bộ lọc và phân trang hiện hữu. Nhãn trên bản ghi mobile dùng cùng tên trường với tiêu đề desktop. |
| Badge | Dùng cặp chữ và nền theo ý nghĩa. Ví dụ **Chờ duyệt**, **Chờ nhân viên tiếp nhận**, **Hết hạn**. Màu hỗ trợ đọc nhanh, nhãn cho biết trạng thái. |
| Modal | Tiêu đề truy cập được, Esc và nút đóng, trả focus về nơi mở. Mã và trạng thái đặt cao trong chi tiết. Khi thao tác thất bại, ưu tiên đưa người dùng về phần báo lỗi. |
| Thông báo | Phân biệt số việc chờ xử lý với dấu đã đọc. Đặt lỗi cần xử lý trong ngữ cảnh. Khi thành công, nêu kết quả thực tế và mã chứng từ nếu có trong dữ liệu. |
| Dashboard | Cảnh báo và bảng cần xử lý đi trước biểu đồ. Cạnh số liệu có phạm vi, kỳ hoặc đơn vị. Dùng Recharts và liên kết tới bảng báo cáo hiện có để đối chiếu. Biểu đồ tồn theo đơn vị được chọn. |

**Trạng thái giao diện**

- **Đang tải** giữ bố cục ổn định, báo mục đang tải và phản ánh trạng thái gửi hiện có của nút.
- **Trống** phân biệt chưa có bản ghi, bộ lọc không khớp, chưa chọn điều kiện và chưa cấu hình.
- **Lỗi** đặt thông báo gần việc đang làm. Với nhiều trường lỗi, đưa focus đến tóm tắt lỗi và liên kết về trường tương ứng khi có định danh. Dùng thao tác tải lại hoặc đường dẫn đúng quy trình khi có.
- **Thành công** dùng câu mô tả kết quả đã xác nhận, ví dụ **Đã gửi phiếu** hoặc **Đã tiếp nhận và xuất kho**.
- **Bị chặn** giải thích lý do nếu người dùng có quyền thao tác nhưng chưa đủ điều kiện. Menu, danh sách, đường dẫn và thao tác bám quyền hiện hành. API xác định quyền và phạm vi của từng bản ghi.

**Theo nhóm actor**

| Actor | Ngữ cảnh cần thấy |
| --- | --- |
| Khách hàng | Đơn trong phạm vi khách hàng, thông tin giao, ngày sớm nhất từ API, giá tạm tính và lượng đã giao làm nguồn yêu cầu trả. |
| Lập kế hoạch | Đơn nguồn, SKU, lịch, năng lực, phân công và thiếu nguyên liệu. Điều kiện sửa theo trạng thái và quyền hiện hành. |
| Mua hàng | Vật tư thiếu, lượng cần mua, nhà cung cấp, đơn giá và bước gửi duyệt trong luồng mua hàng độc lập phạm vi xưởng. |
| Ban giám đốc | Nguồn, chênh lệch, hệ quả, lý do và nơi tiếp nhận trước khi duyệt hoặc từ chối. |
| Quản lý kho | Kho, vị trí, lô, hạn giữ, lượng khả dụng và phạm vi đang khóa. Phân biệt UC13 điều phối nhập, UC15 điều phối xuất và bước ghi sổ. |
| Nhân viên kho | Phiếu đúng kho và phân công, lô, vị trí, HSD, lượng và đơn vị. Với phiếu xuất nguyên liệu, xác định rõ tiếp nhận là bước ghi sổ. |
| QC | Nguồn, đợt, lô, lượng kiểm, lượng đạt, lượng lỗi, cách ly và bước xử lý tiếp. |
| Xưởng | Phân công được phép xem, yêu cầu cấp nguyên liệu/nhập thành phẩm và tiến độ dựa trên lượng đủ điều kiện đã nhập kho từng phân công. |
| Hội đồng kiểm kê | Phạm vi, cut-off, vòng đếm, lô, vị trí, bằng chứng, hạn khóa và bước chuyển xác minh. |

## Do's and Don'ts

- Kiểm tra theo mục tiêu WCAG 2.2 AA. Dùng `lang="vi"`, focus rõ, thứ tự Tab hợp lý, nhãn input, tên truy cập cho nút biểu tượng và ưu tiên giảm chuyển động. Kiểm tra chữ thường tối thiểu 4,5:1 và phần nhận diện control 3:1 ở nơi áp dụng.
- Rà màn hẹp, tablet và desktop ở 390, 768, 1.024 và 1.440 px. Thử thêm zoom, tên dài, lỗi API, trạng thái bị chặn và thao tác qua bàn phím. So sánh cùng chứng từ và cùng quyền giữa các kích thước.
- Tránh hero, KPI lặp, thẻ lồng và hiệu ứng trang trí trong màn nghiệp vụ. Tránh dùng tooltip làm nguồn duy nhất cho số liệu. Tránh cộng tồn khác đơn vị vào một tổng.
- Dùng UI UX Pro Max để tìm phương án cho vấn đề cụ thể. Dùng Impeccable để rà bố cục, mật độ, accessibility và trạng thái trên giao diện render. Tài liệu thiết kế dựa trên một bộ token và component đã duyệt.
