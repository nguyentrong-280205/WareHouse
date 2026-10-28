<!-- SQLSERVER_CURRENT_20261016 -->
> **Công nghệ hiện hành 16/10/2026:** Microsoft SQL Server 2022 trên `NGUYENTRONG-200\HTTT02`, Express/JavaScript CommonJS + `mssql`, migration T-SQL. Các hướng dẫn MySQL/mysql2/Prisma/InnoDB/utf8mb4 và lệnh Compose cũ phía dưới là **DA_THAY_THE về công nghệ**, giữ làm lịch sử; quyết định nghiệp vụ vẫn theo FS01–FS12 và các phê duyệt còn hiệu lực. Không chạy test tự động hoặc tự nghiệm thu UC. Xem [hướng dẫn hiện hành](sqlserver_runbook.md) và [báo cáo chuyển đổi](sqlserver_conversion.md).

# Khảo sát frontend — bản nháp Giai đoạn 0

Khảo sát mã nguồn ngày 11/10/2026; **không chạy trình duyệt, chưa có screenshot, không khẳng định đã kiểm thử giao diện chạy**. Không sửa bất kỳ file frontend nào. Đã đọc toàn bộ JS/JSX/CSS, cấu hình, HTML, dữ liệu mock và SVG; PNG là asset nhị phân, không phải mã nguồn.

## Stack thực tế

| Thành phần | package.json khai báo |
|---|---|
| Framework/ngôn ngữ | React ^19.2.8, react-dom ^19.2.8; JavaScript JSX, ESM |
| Build | Vite ^8.3.0, @vitejs/plugin-react ^6.1.1 |
| CSS | Tailwind ^4.3.3, @tailwindcss/vite ^4.3.3; index.css @import tailwindcss |
| Routing | react-router-dom ^7.18.4, BrowserRouter/Routes/Route |
| HTTP | axios ^1.20.0, apiClient tạo instance nhưng chưa tích hợp nghiệp vụ |
| Icon/chart | lucide-react ^1.48.0, recharts ^3.10.1 |
| Lint | oxlint ^1.81.0, .oxlintrc.json; không phải ESLint |

Các số trên là range trong manifest, không khẳng định phiên bản thực cài. @types/react không có nghĩa project dùng TS. Script có dev/build/lint/preview, chưa có test. .env.example dùng VITE_API_URL=http://localhost:3000/api. Không đọc .env thật; không npm install/build vì cần giữ nguyên cả output hiện có trong giai đoạn khảo sát.

## Cấu trúc và luồng render

main.jsx → StrictMode/App → BrowserRouter/AppRoutes → page → AppLayout → Sidebar/Header/main. Layout được mỗi page dựng riêng; trạng thái collapse/menu có thể reset khi chuyển trang. App.css chứa CSS template Vite nhưng không được App import; react.svg/vite.svg/hero.png còn asset template. Không tự xóa.

| Nhóm | File đã khảo sát và hành vi |
|---|---|
| layout | AppLayout (mobile/collapse); Sidebar (NavLink + navigationData); Header (search local, notification/menu mock) |
| common | Badge, Button, Card, EmptyState, LoadingSkeleton, SearchBox, Table |
| home | WelcomeBanner, QuickActions, QuickAccess, RecentActivity, Notifications; props mặc định mock |
| dashboard | KPICard, InventoryChart (bar), StockStructureChart (donut), InventoryTrendChart (line), LowStockTable, ExpiringLotsTable, WarehouseActivity, WarehouseCapacity |
| pages | HomePage, DashboardPage, PlaceholderPage, NotFoundPage |
| dữ liệu/utils | navigationData, homeMockData, dashboardMockData; formatDate vi-VN, formatNumber/formatPercent vi-VN |

## Route hiện hữu và ánh xạ dự kiến

| Route | Hiện trạng | UC liên quan sau duyệt |
|---|---|---|
| / | HomePage mock có banner/shortcut/activity/notification | trang vào, không UC hoàn thành |
| /dashboard | DashboardPage mock, 5 KPI/3 chart/2 bảng/activity/capacity | UC05 |
| /production-plans | placeholder | UC02/03 |
| /workshop-assignments | placeholder | một phần UC02; không UC mới |
| /production-orders | placeholder | D02 đã xác nhận dùng KHSX đã duyệt, không LenhSanXuat; chưa đổi UI |
| /materials/receipts | placeholder | UC13/21 |
| /materials/issues | placeholder | UC15/23; liên kết UC22 |
| /materials/qc | placeholder | UC29 |
| /finished-goods/receipts | placeholder | UC13/16; liên kết UC24/04 |
| /finished-goods/issues | placeholder | UC15/12 |
| /inventory-counts | placeholder | UC07/08/09 |
| /lots | placeholder | UC20/30 |
| /storage-locations | placeholder | UC19 |
| /reports | placeholder | UC05/06 |
| /users | placeholder | hạ tầng tài khoản, phạm vi CRUD CHUA_DUYET |
| * | NotFoundPage có nút về trang chủ | giữ nguyên |

Còn thiếu route/login, đơn hàng, mua hàng, danh mục, QC TP, yêu cầu xưởng, hàng trả/lỗi; sẽ bổ sung dưới pages/routes hiện có khi UC được giao, không đổi cây hiện tại.

## Quy ước giao diện phải giữ

- Nền #f8fafc/slate-50; chữ #1e293b/slate-800, tiêu đề slate-900; system font. Primary blue-600 (#2563eb), success emerald, warning amber/orange, danger rose, QC purple. Trạng thái có nhãn tiếng Việt bên cạnh màu.
- Sidebar trắng fixed: w-64 (256px), thu gọn w-20 (80px); desktop lg:pl-64/pl-20; mobile overlay, close. Header sticky h-16 (64px), border slate-200/80.
- Nội dung max-w-[1600px], p-4/lg:p-6, space-y-6; grid responsive sm/md/lg, gap-4/6. Card trắng rounded-2xl, border slate-200/80, shadow-2xs.
- Tiêu đề trang text-lg font-bold, tiêu đề khối text-base, body text-sm, bảng text-xs. Icon lucide thường 16–24px.
- Table giữ overflow-x-auto, rounded-xl, header slate-50 uppercase/tracking-wider, ô px-4 py-3, divider slate-100, hover slate-50. Component nhận columns/data/renderRow, chưa pagination/sort server.
- Button giữ primary/secondary/outline/ghost/danger, size sm/md/lg và disabled; Badge giữ variant hiện có. SearchBox focus:ring-blue-500/20, rounded-xl.
- Chưa có form nghiệp vụ/modal/date picker chuẩn; đề xuất input cùng SearchBox, label rõ, lỗi tại field, quantity có đơn vị, tổng cơ sở read-only, submit disabled khi gửi, confirm nghiệp vụ trong cùng phong cách. Đây là thiết kế mới cần duyệt, không khẳng định có sẵn.
- Dùng EmptyState/LoadingSkeleton; thêm trạng thái lỗi và retry khi UC thực hiện. Giữ bố cục chart Recharts, không thay UI kit.

## Điểm khác nghiệp vụ cần xử lý sau duyệt

Mock mang dữ liệu hạt nhựa PP/PE/phụ gia, ngày 2024, TP và tổng tồn đều kg; không phù hợp cộng tồn chai/lon/kg/lít. StockStructureChart hardcode tổng 245.680 kg kể cả props đổi. Filter Dashboard chưa có thao tác thay dateRange; dropdown/chart và notification chỉ minh họa. Header hardcode tên/quyền, logout chỉ #logout; search chưa gọi API; chưa guard route/RBAC.

Tên Lệnh sản xuất xuất hiện navigation/quick access/search và activity, trong khi SRS bỏ thực thể. Giữ nguyên hiện tại, chờ D02/D08 trước sửa nhãn hoặc ánh xạ. Banner/avatar dùng Unsplash ngoài; chưa kiểm tra khả năng tải/offline. index.html lang=en trong UI tiếng Việt. Một số clickable div/icon button thiếu label/focus; Button focus:outline-none cần đánh giá accessibility khi bổ sung UC. KPICard negative vẫn dùng ArrowUpRight; không tự sửa trong Giai đoạn 0.

## Baseline và kiểm chứng

Đối chiếu hash file nguồn/config frontend và README/SRS/domain trước/sau viết tài liệu; xem evidence cuối testing_strategy.md. Không coi Home/Dashboard mock là UC05 đã xong. Script frontend chỉ xác minh bằng đọc manifest, chưa chạy lint/build/E2E trong giai đoạn này.

## Đối chiếu xác nhận hiện tại — frontend giữ nguyên

Backend Express JavaScript CommonJS + mysql2 đã xác nhận; FE React/JavaScript/Vite/Tailwind giữ cấu trúc/component/styles đã khảo sát. /production-orders giữ nguyên, không tạo LenhSanXuat để khớp mock; khi UC được giao đề xuất dùng KHSX đã duyệt và nhãn phù hợp. UC13/15 riêng thao tác/nghiệm thu dù dùng layout phiếu chung posting. FE tương lai cần on_hand/reserved/available, quota QC batch, expiry errors/unit versions theo contract; chưa sửa service/component. Timezone mặc định hiện tại chưa chứng minh Asia/Ho_Chi_Minh, tương lai format explicit. Auth ưu tiên cookie/CSRF cần credentials/login handling khi được giao; chưa đổi apiClient.

## Kiểm chứng Giai đoạn 1 — 12/10/2026

UI, mock data, routes, components, assets, styles, dependencies và frontend lockfile giữ nguyên theo SHA-256 baseline. Chỉ thay frontend/src/services/apiClient.js (fallback /api), vite.config.js (/api proxy tới backend) và .env.example (VITE_API_URL=/api). Không sửa private frontend/.env hoặc chuyển trang sang API nghiệp vụ thật.

Frontend build Windows/Docker PASS, còn cảnh báo bundle >500 kB. Edge headless kiểm Home/Dashboard và gọi proxy health riêng PASS ở direct 5173 và Compose 8080; không page errors. Smoke test không thêm logic lên UI. Authentication credentials/session/CSRF trên frontend sẽ làm trong UC01 sau lệnh riêng. Audit Giai đoạn 0 ở các mục trước là lịch sử; [bằng chứng hiện hành](phase1_review.md).
