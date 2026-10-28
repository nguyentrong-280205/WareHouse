Cập nhật 28/10/2026: dùng duy nhất tài khoản xưởng `xuong01` quản lý cả ba xưởng XSX002 (Nước giải khát), XSX003 (Trà và nước trái cây), XSX004 (Nước tinh khiết). Mở lại xuong01, giữ mật khẩu và scope kho hiện có; khóa xuong_ngk/xuong_tra/xuong_nuoc và giữ uc01.workshop khóa, thu hồi phiên cả năm tài khoản. Không xóa tài khoản hoặc lịch sử, không gộp thêm xưởng. Script use-shared-workshop-account.js chạy transaction có guard và audit một lần sau consolidate; chạy lại không tự mở khóa/cấp lại scope. Các ghi nhận dùng ba tài khoản riêng bên dưới là lịch sử đã được thay thế. Không migration, không thay tồn/BOM/giá, không test nghiệp vụ/commit/reset.

<!-- PRODUCT_CATALOG_20261023 -->
## Ba xưởng và tài khoản riêng hiện hành — 27/10/2026

Hệ thống hiện chỉ có **3xưởng ACTIVE**. Đã gộp đóng lon/PET và xóa xưởng mẫu chưa có chứng từ.

| Mã | Xưởng | Tài khoản nhận phân công |
|---|---|---|
| XSX002 | Xưởng nước giải khát | xuong_ngk |
| XSX003 | Xưởng trà và nước trái cây | xuong_tra |
| XSX004 | Xưởng nước tinh khiết | xuong_nuoc |

Mỗi tài khoản có đúng1scope xưởng; kế hoạch nhiều xưởng chỉ hiển thị phần được giao. Mật khẩu cục bộ theo lựa chọn người dùng, chỉ lưu trong file ignored [WORKSHOP-logins.local.md](backend/.artifacts/WORKSHOP-logins.local.md). Hai tài khoản chung xuong01/uc01.workshop đã LOCKED, thu hồi phiên; giữ lịch sử tài khoản/audit.

XSX001 đã gộp sang XSX002, không dùng lại. Chuyển350lịch đóng lon; tổng lịch hiện hành: NGK1050, trà/trái cây700, nước tinh khiết70. Giữ lịch thay thế đã cấu hình. Xóa33lịch mẫu chưa dùng, không xóa phiếu/tồn/ledger/BOM. Ba dòng KHSX hiện hữu giữ id/sản lượng/định mức; kế hoạch#2 chuyển xưởng và tăng version. Những danh sách4/5xưởng và tài khoản chung hoạt động bên dưới là lịch sử trước thay đổi này.

Queue đọc hiện tại: xuong_ngk nhận kế hoạch#1 đủ vật tư; kế hoạch#2 vẫn thiếu, chưa sang xưởng. Xưởng trà có kế hoạch#3 bị từ chối nên queue rỗng; nước tinh khiết chưa có kế hoạch được giao. [Thiết kế và bằng chứng](docs/workshop_consolidation.md), DA_CODE_CHUA_TEST.

## Nhà cung cấp và giá mua mẫu — 26/10/2026

Đã được duyệt thiết kế/migration/seed. Đây là NCC và giá **hư cấu cho đồ án**, không phải danh sách hoặc báo giá thương mại xác nhận. Thêm9NCC,48báo giá cho24vật tư hiện có; giữ NCC và đơn mua cũ. Tên mới không có chữ demo. Thông tin liên hệ để trống, địa chỉ ghi rõ dữ liệu mẫu.

| Mã NCC | Tên | Nhóm cung cấp |
|---|---|---|
| NCC001 | Bao bì lon Việt Thành | Vỏ lon, nắp lon |
| NCC002 | Bao bì PET An Phú | Vỏ chai PET, nắp chai |
| NCC003 | Nhãn và thùng Đông Nam | Nhãn, thùng carton |
| NCC004 | Đường Minh Phát | Đường tinh luyện |
| NCC005 | Nước xử lý Thanh Bình | Nước đã xử lý |
| NCC006 | Hương liệu và phụ gia Hương Việt | Hương Cola/cam/chanh/dâu/đào, nguyên liệu tăng lực |
| NCC007 | Trà và chiết xuất An Nhiên | Trà chiết xuất |
| NCC008 | Khí thực phẩm Nam Việt | CO2 thực phẩm |
| NCC009 | Vật tư tổng hợp Phú Gia | Toàn bộ24vật tư, giá dự phòng bằng108%giá chuyên nhóm |

Giá dưới đây theo **một đơn vị cơ sở**, VND; không tự thêm thuế/chiết khấu/vận chuyển. Đơn giá đơn mua có thể chỉnh trước lưu; giá tham khảo mới không sửa snapshot đơn cũ.

| Mã vật tư | Tên | Đơn vị | Giá NCC chuyên nhóm |
|---|---|---|---:|
| NVL001 | Vỏ lon250ml | Cái | 1.100 |
| NVL002 | Vỏ lon330ml | Cái | 1.200 |
| NVL003 | Nắp lon | Cái | 120 |
| NVL004 | Vỏ chai PET350ml | Cái | 950 |
| NVL005 | Vỏ chai PET450ml | Cái | 1.050 |
| NVL006 | Vỏ chai PET500ml | Cái | 1.100 |
| NVL007 | Vỏ chai PET1.5L | Cái | 1.800 |
| NVL008 | Nắp chai | Cái | 180 |
| NVL009 | Nhãn chai | Cái | 120 |
| NVL010 | Thùng carton | Cái | 4.500 |
| NVL011 | Đường tinh luyện | Kilogram | 22.000 |
| NVL012 | Nước đã xử lý | Lít | 1.800 |
| NVL013 | Hương Cola | Kilogram | 180.000 |
| NVL014 | Hương cam | Kilogram | 175.000 |
| NVL015 | Hương chanh | Kilogram | 170.000 |
| NVL016 | Hương dâu | Kilogram | 190.000 |
| NVL017 | Nguyên liệu tăng lực | Kilogram | 210.000 |
| NVL018 | Trà chiết xuất | Kilogram | 240.000 |
| NVL019 | Hương đào | Kilogram | 200.000 |
| NVL020 | CO2 thực phẩm | Kilogram | 18.000 |

Bốn vật tư cũ `FS_DEMO_20261015_PET/CAP/LABEL/BOX` cũng có giá theo Cái tương ứng1.100/180/120/4.500, cùng NCC chuyên nhóm và NCC009; giữ mã/tên/lịch sử cũ. NCC cũ giữ nguyên, không tự gán các báo giá chưa có căn cứ. Giá hiệu lực được lưu phiên bản trong BaoGiaNguyenLieu; không ghi đè.

Khi lập mua5kg Hương chanh, gợi ý Hương liệu và phụ gia Hương Việt,170.000VND/kg, tạm tính850.000VND; NCC009 dự phòng183.600VND/kg. Một đơn nhiều nhóm có thể được gợi ý NCC009. Form có Ghi chú cuối đơn, tối đa2000ký tự. Xem [thiết kế đã duyệt](docs/purchase_supplier_design.md). DA_CODE_CHUA_TEST.

## Vật tư và xưởng tự gợi ý, có thể chỉnh — 23/10/2026

Theo lệnh mới nhất, đã thêm20vật tư/15bộ gợi ý cho TP001–TP015, tồn mẫu qua kiểm kê khởi tạo và điều chỉnh đã duyệt, cùng lịch xưởng. Phần này thay các ghi chú lịch sử “chưa có BOM/lịch/tồn” ở bên dưới. **Đây là dữ liệu hư cấu cho đồ án, không phải công thức hoặc thông số nhà sản xuất.**

| Mã | Nguyên vật liệu | Đơn vị | Tồn khởi tạo |
|---|---|---|---:|
| NVL001 | Vỏ lon 250ml | Cái | 2.000 |
| NVL002 | Vỏ lon 330ml | Cái | 2.000 |
| NVL003 | Nắp lon | Cái | 2.000 |
| NVL004 | Vỏ chai PET 350ml | Cái | 2.000 |
| NVL005 | Vỏ chai PET 450ml | Cái | 2.000 |
| NVL006 | Vỏ chai PET 500ml | Cái | 2.000 |
| NVL007 | Vỏ chai PET 1.5L | Cái | 2.000 |
| NVL008 | Nắp chai | Cái | 2.000 |
| NVL009 | Nhãn chai | Cái | 2.000 |
| NVL010 | Thùng carton | Cái | 500 |
| NVL011 | Đường tinh luyện | KG | 500 |
| NVL012 | Nước đã xử lý | Lít | 1.000 |
| NVL013 | Hương Cola | KG | 20 |
| NVL014 | Hương cam | KG | 20 |
| NVL015 | Hương chanh | KG | 20 |
| NVL016 | Hương dâu | KG | 20 |
| NVL017 | Nguyên liệu tăng lực | KG | 20 |
| NVL018 | Trà chiết xuất | KG | 20 |
| NVL019 | Hương đào | KG | 20 |
| NVL020 | CO2 thực phẩm | KG | 100 |

Tồn tại `VT_NVL_KHOITAO` trong kho nguyên liệu hiện có, không ghi đè vị trí/lô cũ. Giá trị trong bảng là **tồn lúc khởi tạo**, số hiện tại trên app lấy từ database và sẽ giảm/thay đổi theo chứng từ; restart không nạp lại. Biên bản kiểm kê#2 có hai lượt đếm khác tài khoản, bằng chứng PDF ghi rõ số liệu mẫu,20điều chỉnh được duyệt và20StockPosting/ledger. Không tạo đơn mua hoặc kế hoạch giả; không cộng tay số dư kho. Hệ số chiếm chỗ được tạo cho20vật tư, tổng ban đầu khoảng2.088KG trong vị trí3.000KG. Lô cần HSD có NSX01/10/2026, HSD01/10/2027; ngày nhập dùng thời điểm ghi sổ để giữ thứ tự FIFO.

Ví dụ **36chai TP002** được gợi ý:

| Vật tư | Cần dùng | Tồn ban đầu |
|---|---:|---:|
| Vỏ chai PET 500ml | 36cái | 2.000cái |
| Nắp chai | 36cái | 2.000cái |
| Nhãn chai | 36cái | 2.000cái |
| Thùng carton | 2cái | 500cái |
| Đường tinh luyện | 1,44KG | 500KG |
| Nước đã xử lý | 18lít | 1.000lít |
| Hương Cola | 0,018KG | 20KG |
| CO2 thực phẩm | 0,108KG | 100KG |

Trong form KHSX có thể thêm vật tư ngoài gợi ý, xóa bớt và sửa lượng, khôi phục gợi ý. Hệ thống giữ tổng nhu cầu theo các phân công và hiển thị tồn vật lý/khả dụng/phần thiếu. Khi lưu, danh sách đã chỉnh thành phiên bản vật tư riêng của kế hoạch; không sửa bộ gợi ý chung hoặc kế hoạch cũ. Thiếu vật tư vẫn lập chờ duyệt được theo luồng mua bổ sung; không cho lượng âm/0, vật tư lặp/khóa hoặc sai đơn vị cơ sở.

Xưởng được tự gợi ý ưu tiên: XSX001 đóng lon, XSX002 PET có gas, XSX003 trà/trái cây, XSX004 nước tinh khiết. PET có lịch thay thế ở XSX002/XSX003; nước tinh khiết có XSX004/XSX002/XSX003. Người lập có thể đổi trong các xưởng đủ năng lực, scope và trạng thái hoạt động. Lịch mẫu **23/10–31/12/2026, 9.600đơn vị cơ sở/SKU/ngày**,1820dòng lịch mới; không ghi đè lịch cũ. Ngoài khoảng này cần cấu hình lịch mới.

Người dùng đã xác nhận thay lựa chọn giữ scope cũ: cấp4xưởng cho **6tài khoản hiện có thuộc lập kế hoạch, giám đốc, xưởng**, thêm24liên kết. Không cấp khách hàng/nhóm khác; tổng scope xưởng40. Seed chỉ cấp một lần, không khôi phục quyền đã thu hồi. Các nghiệp vụ sau có thể cần scope riêng cho vai trò khác; không tự mở rộng ngoài phê duyệt này.

Nguồn: [planning-sample-profile.js](backend/scripts/planning-sample-profile.js), [seed-planning-suggestions.js](backend/scripts/seed-planning-suggestions.js), [thiết kế](docs/planning_suggestions_design.md). Chỉ trên SQL Server Docker warehouse, HTTT02 độc lập không đổi. Không chạy bộ test tự động hoặc nghiệm thu29UC trong lần seed này.

## Bốn xưởng sản xuất bổ sung — 23/10/2026

Theo yêu cầu người dùng, thêm xưởng với tên chính thức dưới đây, không có chữ demo:

| Mã | Tên xưởng | Nhóm thành phẩm dự kiến |
|---|---|---|
| XSX001 | Xưởng nước giải khát đóng lon | TP001, TP004, TP006, TP009, TP010 |
| XSX002 | Xưởng nước giải khát chai PET | TP002, TP003, TP005, TP007, TP008 |
| XSX003 | Xưởng trà và nước trái cây | TP011, TP012, TP013, TP014 |
| XSX004 | Xưởng nước tinh khiết | TP015 |

Thêm với trạng thái ACTIVE. Nhóm sản phẩm trong bảng là phương án phân công đã thống nhất, **chưa phải lịch năng lực được cấu hình trong database**. Không tự đặt sản lượng/ngày, lịch làm việc hoặc BOM. Muốn xưởng hiện “Sẵn sàng” trên form KHSX phải có lịch năng lực phù hợp SKU/ngày/sản lượng.

Xưởng cũ `FS_DEMO_20261015_WS_A` giữ nguyên tên, trạng thái và lịch sử; tổng cộng5xưởng. Script [seed-production-workshops.js](backend/scripts/seed-production-workshops.js) chỉ thêm mã chưa có và báo xung đột nếu mã đã dùng tên khác. Lần tạo4xưởng ban đầu giữ nguyên phân quyền; **lệnh mới đã cho cấp phạm vi ba nhóm tài khoản như đầu file** bằng seed riêng, script tạo xưởng vẫn không ghi TaiKhoan_Xuong. Chạy lại không tạo trùng. SQL Server Windows HTTT02 độc lập không thay đổi.

## Giá bán mẫu đã bổ sung — 23/10/2026

Người dùng giao tự chọn và thêm giá cho TP001–TP015. Giá dưới đây là **giá mẫu VND dùng cho đồ án**, không phải báo giá thị trường hoặc nhà sản xuất. Giá theo loại/dung tích; Lốc = giá cơ sở ×6, Thùng ×24, Pallet ×1440 (TP001–014) hoặc ×1920 (TP015). Không thêm chính sách chiết khấu/thuế/phí mới.

| Mã | Giá Chai/Lon | Giá Lốc | Giá Thùng | Giá Pallet |
|---|---:|---:|---:|---:|
| TP001 | 10.000 | 60.000 | 240.000 | 14.400.000 |
| TP002 | 9.000 | 54.000 | 216.000 | 12.960.000 |
| TP003 | 18.000 | 108.000 | 432.000 | 25.920.000 |
| TP004 | 10.000 | 60.000 | 240.000 | 14.400.000 |
| TP005 | 9.000 | 54.000 | 216.000 | 12.960.000 |
| TP006 | 10.000 | 60.000 | 240.000 | 14.400.000 |
| TP007 | 9.000 | 54.000 | 216.000 | 12.960.000 |
| TP008 | 9.000 | 54.000 | 216.000 | 12.960.000 |
| TP009 | 12.000 | 72.000 | 288.000 | 17.280.000 |
| TP010 | 15.000 | 90.000 | 360.000 | 21.600.000 |
| TP011 | 9.000 | 54.000 | 216.000 | 12.960.000 |
| TP012 | 9.000 | 54.000 | 216.000 | 12.960.000 |
| TP013 | 11.000 | 66.000 | 264.000 | 15.840.000 |
| TP014 | 12.000 | 72.000 | 288.000 | 17.280.000 |
| TP015 | 5.000 | 30.000 | 120.000 | 9.600.000 |

Giá có hiệu lực từ lúc seed. Script [seed-product-prices.js](backend/scripts/seed-product-prices.js) chỉ thêm cặp sản phẩm/đơn vị chưa có giá, không ghi đè giá người quản lý đã lưu và không sửa đơn hàng cũ. Khi có quy cách đã được quản lý chỉnh, giá mới lấy hệ số thực tế đang hiệu lực, không ép quy cách về fixture. Chạy lại không nhân đôi giá. Quản lý kho có thể thêm giá mới qua Danh mục thành phẩm → Sửa → Giá bán theo đơn vị theo cơ chế phiên bản hiện có.

**Đơn nháp hiển thị đơn giá/thành tiền và tổng tiền tạm tính theo giá hiệu lực.** Sau khi bấm Xác nhận đơn, server chọn lại giá hiệu lực theo đơn vị đặt, tính thành tiền từng dòng và tổng tiền rồi lưu snapshot. Giá đã chốt của đơn cũ không thay đổi. Ví dụ6lốc TP002 =6×54.000 =324.000VND;5thùng TP001 =5×240.000 =1.200.000VND. Không tự xác nhận đơn của người dùng khi seed giá. SQL Server Windows HTTT02 độc lập không đổi. [Quy tắc hiển thị tạm tính](docs/order_price_preview.md).

## Danh mục thành phẩm hiện hành — 23/10/2026

Đã thêm **15 thành phẩm, 60 quy cách v1** vào `warehouse_db` của SQL Server Docker (`localhost,14330`). Sản phẩm cũ `FS_DEMO_20261015_PET_500` đã **LOCKED**, giữ lịch sử. Tổng hiện có 16 sản phẩm: 15 hoạt động, 1 khóa; 64 quy cách gồm 4 quy cách cũ. Chưa thay dữ liệu SQL Server Windows HTTT02 độc lập.

| Mã | Tên thành phẩm | Cơ sở | Bao bì | Dung tích ml | HSD ngày | Thùng/pallet | Cơ sở/pallet |
|---|---|---|---|---:|---:|---:|---:|
| TP001 | Nước ngọt Cola lon 330ml | Lon | CAN | 330 | 365 | 60 | 1440 |
| TP002 | Nước ngọt Cola chai PET 500ml | Chai | PET | 500 | 365 | 60 | 1440 |
| TP003 | Nước ngọt Cola chai PET 1.5L | Chai | PET | 1500 | 365 | 60 | 1440 |
| TP004 | Nước ngọt cam lon 330ml | Lon | CAN | 330 | 365 | 60 | 1440 |
| TP005 | Nước ngọt cam chai PET 500ml | Chai | PET | 500 | 365 | 60 | 1440 |
| TP006 | Nước ngọt chanh lon 330ml | Lon | CAN | 330 | 365 | 60 | 1440 |
| TP007 | Nước ngọt chanh chai PET 500ml | Chai | PET | 500 | 365 | 60 | 1440 |
| TP008 | Nước ngọt dâu chai PET 500ml | Chai | PET | 500 | 365 | 60 | 1440 |
| TP009 | Nước tăng lực lon 250ml | Lon | CAN | 250 | 540 | 60 | 1440 |
| TP010 | Nước tăng lực lon 330ml | Lon | CAN | 330 | 540 | 60 | 1440 |
| TP011 | Trà xanh chai PET 500ml | Chai | PET | 500 | 270 | 60 | 1440 |
| TP012 | Trà chanh chai PET 500ml | Chai | PET | 500 | 270 | 60 | 1440 |
| TP013 | Nước cam chai PET 350ml | Chai | PET | 350 | 270 | 60 | 1440 |
| TP014 | Nước đào chai PET 450ml | Chai | PET | 450 | 270 | 60 | 1440 |
| TP015 | Nước tinh khiết chai PET 500ml | Chai | PET | 500 | 365 | 80 | 1920 |

Mỗi thành phẩm: 1 Chai/Lon = 1 cơ sở, 1 Lốc = 6, 1 Thùng = 24; Pallet theo bảng. Quy cách v1 hiệu lực **2026-10-23**. Đơn vị hiển thị phù hợp bao bì; form đặt hàng hiển thị lượng quy đổi theo phiên bản được chọn. Ví dụ 2 pallet TP001 = 2880 lon; 2 pallet TP015 = 3840 chai. Các giá trị này là **dữ liệu mẫu đồ án, không phải thông số xác nhận của nhà sản xuất**, cũng được lưu trong mô tả từng sản phẩm.

Người có quyền quản lý thành phẩm chỉnh HSD và **thêm phiên bản quy cách** tại Danh mục thành phẩm → Sửa. Giữ dòng quy cách cũ, thêm dòng mới cùng đơn vị với số phiên bản mới; Pallet nhập số thùng và ngày hiệu lực, hệ thống tính theo quy cách Thùng hiệu lực ở ngày đó. Đơn hàng trước giữ nguyên hệ số snapshot. HSD lô mới = NSX + HSD mặc định, cho phép nhập HSD thực tế; sửa danh mục không làm đổi lô cũ. FEFO dùng HSD thực tế của lô.

**Đã bổ sung giá bán,15BOM gợi ý và vật tư/tồn nguyên liệu theo lệnh mới ở đầu file.** Chưa seed tồn hoặc lô thành phẩm TP001–TP015; hệ số chiếm chỗ thành phẩm vẫn cần cấu hình trước nhập kho. Seed có cơ chế chống lặp, không ghi đè chỉnh sửa hoặc nạp lại lượng đã dùng. [Quy tắc và kiểm chứng](docs/product_catalog_update.md).

Các mục về SKU mẫu cũ bên dưới là hồ sơ seed ban đầu, không còn là danh sách sản phẩm hoạt động hiện hành.

<!-- WAREHOUSE_PORTABLE_20261023 -->
## Docker warehouse hiện hành — 23/10/2026

Người dùng đã giao thêm SQL Server container và đổi project Docker thành **warehouse**. Compose mặc định tại root chạy SQL Server2022Developer riêng (SSMS: localhost,14330), db-init/migrate/Express/frontend; app http://localhost:8080, backend3001. Lần đầu chạy `node scripts/setup-docker.js` rồi `docker compose up -d --build`; những lần sau `docker compose up -d`. `scripts/start-docker.ps1` nay dùng bản portable, không phụ thuộc SQL Server Windows/dynamic port. [Hướng dẫn hiện hành](docs/docker_warehouse.md).

Giữ nguyên HTTT02/Windows .env/data và các MySQL/Prisma archives. Chế độ Windows chuyển sang `infra/compose.windows.yaml`/`scripts/start-docker-windows.ps1` (project warehouse-windows); hướng dẫn cũ bên dưới về start-docker dò Windows port là lịch sử đã được thay thế cho chế độ mặc định. Không đồng bộ/copy dữ liệu giữa SQL Server Docker và HTTT02; cả hai có thể mở cùng SSMS. Volumes mới warehouse_sqlserver_data/warehouse_demo_artifacts/warehouse_uploads riêng; credentials riêng local ignored, backend không dùng sa. Seed fixture19accounts trong Docker, không import dữ liệu cũ; seed một lần, không overwrite. Schema76bảng/237FK/native checksum và 29UC giữ nguyên, DA_CODE_CHUA_TEST; chỉ kiểm cú pháp/config/bootstrap/migration/health, không unit/integration/E2E/regression. Không commit/reset/drop/delete volume. Nhóm warehouse-foundation cũ giữ ở trạng thái dừng, không tự xóa.

---

<!-- SQLSERVER_CURRENT_20261016 -->
> Dữ liệu demo hiện đã được tái tạo từ fixture trên **SQL Server warehouse_db tại NGUYENTRONG-200\HTTT02**, cùng 9vai trò/19tài khoản/1KH. Danh sách dưới giữ ý nghĩa demo; không sao chép dữ liệu thật hoặc session/audit cũ từ MySQL. Mở SSMS → Databases → warehouse_db → Tables. Xem [hướng dẫn hiện hành](docs/sqlserver_runbook.md).

# Dữ liệu seed có sẵn

## Tài khoản dễ nhớ bổ sung theo yêu cầu

Đã tạo thêm9tài khoản bên dưới trong `warehouse_db`, mỗi vai trò một tài khoản. **Mật khẩu chung là `123456`** theo yêu cầu của người dùng, chỉ dùng cho bộ demo cục bộ.

| Vai trò | Tên đăng nhập | Mật khẩu demo |
|---|---|---|
| Khách hàng | `khach01` | `123456` |
| Bộ phận lập kế hoạch | `kehoach01` | `123456` |
| Bộ phận mua hàng | `muahang01` | `123456` |
| Ban giám đốc | `giamdoc01` | `123456` |
| Quản lý kho / Bộ phận quản lý kho | `quanlykho01` | `123456` |
| Nhân viên kho | `nhanvienkho01` | `123456` |
| Bộ phận QC | `qc01` | `123456` |
| Xưởng sản xuất | `xuong01` | `123456` |
| Hội đồng kiểm kê | `kiemke01` | `123456` |

Đăng nhập tại http://localhost:8080/login. Mã tài khoản mới là `LOCAL_SIMPLE_<tên đăng nhập>`, dùng các role `UC01_DEMO_*` đã có. `khach01` thuộc cùng khách hàng giả với `uc01.customer`; tám tài khoản nội bộ có scope ba kho giả và một xưởng giả. Không tạo thêm role/khách hàng hoặc đổi mật khẩu tài khoản cũ.

Ngoại lệ mật khẩu ngắn chỉ áp dụng9username này, yêu cầu `AUTH_ALLOW_SIMPLE_DEMO=true`, database `warehouse_db`, cấu hình origin loopback và code DB tương ứng. Compose local đã bật; chạy backend trực tiếp có thể bật bằng `$env:AUTH_ALLOW_SIMPLE_DEMO='true'` trước `npm start`. Các account khác vẫn yêu cầu12–128ký tự. Database lưu hash Argon2id, không lưu mật khẩu plaintext.

[Seed bổ sung](backend/scripts/seed-simple-demo.js) đọc mật khẩu từ file ignored cục bộ; [hướng dẫn đăng nhập riêng tư](backend/.artifacts/SIMPLE-demo-login.local.md). Mật khẩu demo đã được người dùng chỉ định công khai trong yêu cầu; không dùng nó cho tài khoản thật hoặc tài khoản `uc01.*` cũ. Thay đổi này chưa chạy test tự động/nghiệp vụ.

Tổng sau bổ sung: **9role, 19account, 1khách hàng**, 48liên kết account–kho và16liên kết account–xưởng trong phạm vi demo. Có hai người Hội đồng là `uc01.council` và `kiemke01`, có thể phân công đếm độc lập. Các số lượng10account/24scope-kho/8scope-xưởng và giới hạn một Hội đồng bên dưới mô tả bộ seed ban đầu trước lần bổ sung này.

Tổng hợp ngày **16/10/2026**, đối chiếu các script seed trong repository và kết quả seed đã ghi nhận tại [bàn giao hệ thống](docs/full_system_handoff.md).

Bảy bộ seed trên **`warehouse_db` của Docker** (ba bộ cũ, danh mục, giá bán, xưởng và gợi ý sản xuất23/10):

| Bộ seed | Script | Mục đích |
|---|---|---|
| `PLANNING_SUGGESTIONS_20261023` | [seed-planning-suggestions.js](backend/scripts/seed-planning-suggestions.js) | 20vật tư/15BOM/lịch và tồn khởi tạo qua kiểm kê, scope đúng ba nhóm được duyệt |
| `PRODUCTION_WORKSHOPS_20261023` | [seed-production-workshops.js](backend/scripts/seed-production-workshops.js) | 4 xưởng XSX001–XSX004, giữ nguyên phân quyền và xưởng cũ |
| `PRODUCT_PRICES_20261023` | [seed-product-prices.js](backend/scripts/seed-product-prices.js), [product-price-fixture.js](backend/scripts/product-price-fixture.js) | 60 giá theo4đơn vị cho15SKU, chỉ thêm giá còn thiếu |
| `PRODUCT_CATALOG_20261023` | [seed-product-catalog.js](backend/scripts/seed-product-catalog.js), [product-catalog-fixture.js](backend/scripts/product-catalog-fixture.js) | 15 thành phẩm/60 quy cách theo HSD và pallet đã duyệt; khóa SKU cũ, không ghi đè |
| `LOCAL_SIMPLE_` | [seed-simple-demo.js](backend/scripts/seed-simple-demo.js) | Thêm9account dễ nhớ theo9role, không đổi account cũ |
| `UC01_DEMO_` | [seed-uc01-demo.js](backend/scripts/seed-uc01-demo.js), [uc01-data.js](backend/scripts/uc01-data.js) | Vai trò, quyền, khách hàng và tài khoản đăng nhập giả |
| `FS_DEMO_20261015` | [seed-full-system-demo.js](backend/scripts/seed-full-system-demo.js), [full-system-fixture.js](backend/scripts/full-system-fixture.js) | Danh mục, kho, xưởng, BOM, giá, lịch, hệ số và phạm vi truy cập hỗ trợ 29 UC |

Đây là **dữ liệu giả để thao tác cục bộ**, không phải thông số sản xuất thực tế. Tài liệu mô tả dữ liệu do seed tạo, không phải bản xuất toàn bộ dữ liệu hiện tại: nếu người dùng đã thêm/sửa dữ liệu qua giao diện, nội dung đó không nằm trong danh sách này. ID tự tăng phụ thuộc database nên dùng mã nghiệp vụ để nhận diện, không giả định ID cố định.

## 1. Tổng quan số lượng

| Nhóm | Bảng | Số lượng trong bộ seed |
|---|---|---:|
| Vai trò | `VaiTroQuyen` | 9 |
| Tài khoản | `TaiKhoan` | 19 (10 cũ +9 mới) |
| Khách hàng | `KhachHang` | 1 |
| Đơn vị tính | `DonViTinh` | 9 |
| Nguyên liệu | `NguyenLieu` | 24 (4cũ,20mới) |
| Thành phẩm | `ThanhPham` | 16 (15 mới ACTIVE, 1 cũ LOCKED) |
| Quy cách đóng gói | `QuyCachDongGoi` | 64 (60 mới, 4 cũ) |
| Giá bán thành phẩm | `GiaBanThanhPham` | 64 (60 mới, 4 của SKU cũ) |
| Kho | `Kho` | 3 |
| Vị trí lưu kho | `ViTriLuuKho` | 6 (5cũ,1vị trí vật tư khởi tạo) |
| Xưởng | `XuongSanXuat` | 5 (4 xưởng mới, 1 xưởng cũ giữ nguyên) |
| Nhà cung cấp | `NhaCungCap` | 1 |
| Phiên bản định mức | `DinhMuc` | 16bộ gợi ý (1cũ,15mới); phiên bản riêng tăng theo kế hoạch |
| Chi tiết định mức | `ChiTietDinhMuc` | 113dòng gợi ý (4cũ,109mới) |
| Hệ số chiếm chỗ | `HeSoChiemCho` | 30 (10cũ,20vật tư mới) |
| Ngày năng lực sản xuất | `LichNangLucXuong` | 1853 (33cũ,1820mới) |
| Gán phạm vi tài khoản–kho | `TaiKhoan_Kho` | 48 liên kết cho16tài khoản nội bộ ×3kho giả |
| Gán phạm vi tài khoản–xưởng | `TaiKhoan_Xuong` | 40 (16cũ,24mới cho ba nhóm đã duyệt) |

Số lượng trên là phạm vi của bộ seed, không bao gồm dữ liệu khác có sẵn trong database. Bảng quyền có thể tái sử dụng permission đã tồn tại; không tạo permission trùng mã.

## 2. Khách hàng và tài khoản đăng nhập

Khách hàng giả:

| Mã | Tên |
|---|---|
| `UC01_DEMO_customer` | Khách hàng giả UC01 |

Các tài khoản UC01 ban đầu (giữ nguyên mật khẩu cũ):

| Tên đăng nhập | Mã tài khoản | Vai trò | Liên kết khách hàng |
|---|---|---|---|
| `uc01.customer` | `UC01_DEMO_customer` | Khách hàng | `UC01_DEMO_customer` |
| `uc01.customer2` | `UC01_DEMO_customer2` | Khách hàng | Cùng khách hàng với `uc01.customer` |
| `uc01.planner` | `UC01_DEMO_planner` | Bộ phận lập kế hoạch | `customer_id = NULL` |
| `uc01.purchasing` | `UC01_DEMO_purchasing` | Bộ phận mua hàng | `customer_id = NULL` |
| `uc01.board` | `UC01_DEMO_board` | Ban giám đốc | `customer_id = NULL` |
| `uc01.warehouse` | `UC01_DEMO_warehouse` | Quản lý kho / Bộ phận quản lý kho | `customer_id = NULL` |
| `uc01.staff` | `UC01_DEMO_staff` | Nhân viên kho | `customer_id = NULL` |
| `uc01.qc` | `UC01_DEMO_qc` | Bộ phận QC | `customer_id = NULL` |
| `uc01.workshop` | `UC01_DEMO_workshop` | Xưởng sản xuất | `customer_id = NULL` |
| `uc01.council` | `UC01_DEMO_council` | Hội đồng kiểm kê | `customer_id = NULL` |

**Mật khẩu của các tài khoản UC01 cũ không ghi trong file này.** Mở [hướng dẫn đăng nhập riêng tư cục bộ](backend/.artifacts/UC01-demo-login.local.md) để xem mật khẩu tương ứng. File đó đã được Git/Docker ignore. Database chỉ lưu hash Argon2id, cấu hình 65536 KiB / 3 vòng / parallelism 1.

Hai tài khoản khách hàng dùng chung một hồ sơ khách hàng; không có khách hàng thứ hai để mô phỏng truy cập chéo giữa hai khách hàng khác nhau. Bộ UC01 ban đầu có một Hội đồng; tài khoản mới kiemke01 ở đầu tài liệu bổ sung người đếm độc lập thứ hai.

## 3. Vai trò và quyền đã gán

Mã role có dạng `UC01_DEMO_<role>`. Danh sách dưới là tổng hợp quyền nền UC01 và quyền bổ sung FS11 đã seed.

| Mã vai trò | Các permission |
|---|---|
| `UC01_DEMO_customer` | `orders.create`, `orders.read`, `orders.submit`, `returnRequests.create` |
| `UC01_DEMO_planner` | `plans.create`, `plans.read` |
| `UC01_DEMO_purchasing` | `purchases.create`, `purchases.read`, `purchases.submit` |
| `UC01_DEMO_board` | `plans.decide`, `reports.read`, `adjustments.decide`, `purchases.decide`, `dispositions.decide` |
| `UC01_DEMO_staff` | `inventory.search`, `issues.postSale`, `issues.postMaterial`, `receipts.postProduct`, `receipts.postReturn`, `receipts.postMaterial`, `deliveries.confirm`, `returnReceptions.post` |
| `UC01_DEMO_qc` | `productQc.read`, `productQc.write`, `returnQc.read`, `returnQc.write`, `materialQc.read`, `materialQc.write` |
| `UC01_DEMO_workshop` | `materialRequests.create`, `materialRequests.read`, `materialRequests.submit`, `productRequests.create`, `productRequests.read`, `productRequests.submit` |
| `UC01_DEMO_council` | `stocktakes.count`, `stocktakes.confirm` |

Role `UC01_DEMO_warehouse` có các nhóm quyền:

| Nhóm | Các permission |
|---|---|
| Báo cáo/tra cứu | `reports.read`, `reports.configureAlerts`, `inventory.search` |
| Danh mục | `materials.read`, `materials.write`, `products.read`, `products.write` |
| Kho/lô | `warehouses.read`, `warehouses.write`, `productLots.read`, `productLots.write`, `materialLots.read`, `materialLots.write` |
| Điều phối nhập | `receipts.read`, `receipts.allocate`, `receipts.confirmAllocation` |
| Điều phối xuất | `issues.read`, `issues.allocate`, `issues.confirmAllocation` |
| Reservation | `reservations.read`, `reservations.release`, `reservations.renew` |
| Kiểm kê/chênh lệch | `stocktakes.create`, `stocktakes.cancel`, `stocktakes.renew`, `variances.verify` |
| Hàng lỗi/chưa định danh | `dispositions.create`, `dispositions.execute`, `unknownReturns.resolve` |

Scope đã gán trong bộ demo:

- Mười sáu tài khoản nội bộ (8 cũ +8 mới) được gán tường minh cả ba kho giả và xưởng giả bên dưới.
- Ba tài khoản khách hàng (uc01.customer, uc01.customer2, khach01) không được gán scope kho/xưởng; truy cập dữ liệu theo `customer_id`.
- Scope kho/xưởng không tự cấp quyền hành động: mỗi thao tác vẫn kiểm role/permission và điều kiện nghiệp vụ.
- Không có role quản trị toàn quyền, permission wildcard hoặc quy tắc `NULL = tất cả kho`.

## 4. Đơn vị tính

| Mã | Tên | Nhóm đơn vị | Rời/nguyên | Scale |
|---|---|---|---|---:|
| `BOTTLE` | Chai | `COUNT` | Có | 0 |
| `CAN` | Lon | `COUNT` | Có | 0 |
| `PIECE` | Cái | `COUNT` | Có | 0 |
| `PACK` | Lốc | `COUNT` | Có | 0 |
| `CARTON` | Thùng | `COUNT` | Có | 0 |
| `PALLET` | Pallet | `COUNT` | Có | 0 |
| `KG` | Kilogram | `MASS` | Không | 6 |
| `L` | Lít | `VOLUME` | Không | 6 |
| `M3` | Mét khối sức chứa | `CAPACITY_VOLUME` | Không | 6 |

Đơn vị tồn tại trong danh mục không có nghĩa đã có SKU tương ứng. Ví dụ seed có đơn vị `CAN`, nhưng chưa tạo SKU lon; thành phẩm mẫu bên dưới dùng `BOTTLE`.

## 5. Nguyên liệu

| Mã | Tên | Đơn vị cơ sở | Bắt buộc HSD | Điều kiện bảo quản |
|---|---|---|---|---|
| `FS_DEMO_20261015_PET` | Vỏ chai PET giả 500ml | `PIECE` | Không | `DRY` |
| `FS_DEMO_20261015_CAP` | Nắp chai giả | `PIECE` | Không | `DRY` |
| `FS_DEMO_20261015_LABEL` | Nhãn chai giả | `PIECE` | Không | `DRY` |
| `FS_DEMO_20261015_BOX` | Thùng carton giả | `PIECE` | Không | `DRY` |

Đây chỉ là nguyên vật liệu bao gói. Không seed công thức nước giải khát, tỷ lệ pha chế hoặc thành phần bí mật. Chưa seed giá mua nguyên liệu; người lập PO nhập giá mua cho từng dòng theo luồng nghiệp vụ.

## 6. Hồ sơ thành phẩm mẫu cũ, quy cách và giá bán

SKU dưới đây đã bị khóa theo yêu cầu ngày 23/10/2026, giữ nguyên quy cách, giá và tham chiếu lịch sử. Danh sách hoạt động TP001–TP015 nằm ở đầu file.

Thành phẩm:

| Thuộc tính | Giá trị |
|---|---|
| Mã | `FS_DEMO_20261015_PET_500` |
| Tên | Thành phẩm PET 500ml giả FS |
| Đơn vị cơ sở | `BOTTLE` |
| Loại bao bì | `PET` |
| Dung tích | `500.000000` ml |
| Hạn sử dụng danh mục | 180 ngày |

Quy cách và giá bán của SKU này:

| Đơn vị | Số chai cơ sở / đơn vị | Phiên bản quy cách | Giá bán VND / đơn vị | Phiên bản giá |
|---|---:|---:|---:|---:|
| `BOTTLE` | `1.000000000` | 1 | `12000.000000` | 1 |
| `PACK` | `6.000000000` | 1 | `72000.000000` | 1 |
| `CARTON` | `24.000000000` | 1 | `288000.000000` | 1 |
| `PALLET` | `960.000000000` | 1 | `11520000.000000` | 1 |

Quy cách hiệu lực từ ngày nghiệp vụ **2026-10-15**. Giá có `effective_at = 2026-10-15 00:00:00.000 UTC`. Đây là giá giả; đơn hàng lấy giá do server quản lý khi xác nhận, không lấy giá tùy ý từ client.

Ví dụ quy đổi: 1 thùng = 24 chai; 1 pallet = 40 thùng = 960 chai. Những hệ số này thuộc SKU mẫu, không là quy cách mặc định cho mọi SKU.

## 7. Kho và vị trí lưu kho

Các kho dùng đơn vị sức chứa **KG**:

| Mã kho | Tên | Loại | Sức chứa KG |
|---|---|---|---:|
| `FS_DEMO_20261015_NL` | Kho nguyên liệu giả FS | `MATERIAL` | `10000.000000` |
| `FS_DEMO_20261015_TP` | Kho thành phẩm giả FS | `FINISHED` | `10000.000000` |
| `FS_DEMO_20261015_CTRL` | Kho kiểm soát giả FS | `CONTROLLED` | `1000.000000` |

Vị trí:

| Mã vị trí | Tên | Kho | Sức chứa KG | Quy tắc bảo quản |
|---|---|---|---:|---|
| `FS_DEMO_20261015_NL_A` | Vị trí giả NL_A | `FS_DEMO_20261015_NL` | `5000.000000` | `DRY` |
| `FS_DEMO_20261015_NL_B` | Vị trí giả NL_B | `FS_DEMO_20261015_NL` | `5000.000000` | `DRY` |
| `FS_DEMO_20261015_TP_A` | Vị trí giả TP_A | `FS_DEMO_20261015_TP` | `5000.000000` | `DRY` |
| `FS_DEMO_20261015_TP_B` | Vị trí giả TP_B | `FS_DEMO_20261015_TP` | `5000.000000` | `DRY` |
| `FS_DEMO_20261015_CTRL_A` | Vị trí giả CTRL_A | `FS_DEMO_20261015_CTRL` | `1000.000000` | `DRY` |

Seed không tạo hàng trong các kho. Sức chứa cấu hình không phải số lượng tồn; `PALLET` là đơn vị đóng gói, không phải đơn vị `PALLET_SLOT` giữ chỗ.

## 8. Xưởng và nhà cung cấp

| Loại | Mã | Tên | Thông tin bổ sung |
|---|---|---|---|
| Xưởng | `FS_DEMO_20261015_WS_A` | Xưởng giả FS A | Dùng lịch năng lực riêng bên dưới |
| Nhà cung cấp | `FS_DEMO_20261015_SUPPLIER` | Nhà cung cấp giả FS | Địa chỉ: Dữ liệu giả cho chạy cục bộ |

Không seed số điện thoại/email cho nhà cung cấp mẫu.

## 9. Định mức vật tư — BOM

BOM của `FS_DEMO_20261015_PET_500`: **revision 1**, hiệu lực từ **2026-10-15**, sản lượng chuẩn **24.000000 chai**, hao hụt **0.000000%**.

| Nguyên liệu | Lượng cho 24 chai | Đơn vị |
|---|---:|---|
| `FS_DEMO_20261015_PET` | `24.000000` | `PIECE` |
| `FS_DEMO_20261015_CAP` | `24.000000` | `PIECE` |
| `FS_DEMO_20261015_LABEL` | `24.000000` | `PIECE` |
| `FS_DEMO_20261015_BOX` | `1.000000` | `PIECE` |

Ví dụ kế hoạch 48 chai cần 48 vỏ, 48 nắp, 48 nhãn, 2 thùng carton theo BOM mẫu. Đây là định mức bao gói giả; không mô tả công thức pha chế.

## 10. Hệ số chiếm chỗ

Mỗi giá trị tính trên **một đơn vị cơ sở** của mặt hàng. Có hai bản ghi KG/M3 cho mỗi mặt hàng, tổng cộng 10 bản ghi; **revision 1**, hiệu lực **2026-10-15 00:00:00.000 UTC**.

| Mặt hàng | Đơn vị cơ sở | KG / đơn vị cơ sở | M3 / đơn vị cơ sở |
|---|---|---:|---:|
| `FS_DEMO_20261015_PET` | `PIECE` | `0.020000000` | `0.000800000` |
| `FS_DEMO_20261015_CAP` | `PIECE` | `0.002000000` | `0.000010000` |
| `FS_DEMO_20261015_LABEL` | `PIECE` | `0.001000000` | `0.000001000` |
| `FS_DEMO_20261015_BOX` | `PIECE` | `0.100000000` | `0.001000000` |
| `FS_DEMO_20261015_PET_500` | `BOTTLE` | `0.550000000` | `0.000900000` |

Ba kho mẫu dùng KG nên chọn hệ số KG tương ứng; có sẵn hệ số M3 không có nghĩa đã tạo kho M3. Ví dụ 24 chai chiếm `13.200000000000000` KG theo hệ số giả của thành phẩm.

## 11. Lịch và năng lực sản xuất

Áp dụng cho cặp **xưởng `FS_DEMO_20261015_WS_A` / SKU `FS_DEMO_20261015_PET_500`**. Mỗi ngày đã khai báo có năng lực **`9600.000000` chai cơ sở/ngày**.

| Tháng | Ngày làm việc được seed — ghi đầy đủ từng ngày |
|---|---|
| 10/2026 | 2026-10-15, 2026-10-16, 2026-10-19, 2026-10-20, 2026-10-21, 2026-10-22, 2026-10-23, 2026-10-26, 2026-10-27, 2026-10-28, 2026-10-29, 2026-10-30 |
| 11/2026 | 2026-11-02, 2026-11-03, 2026-11-04, 2026-11-05, 2026-11-06, 2026-11-09, 2026-11-10, 2026-11-11, 2026-11-12, 2026-11-13, 2026-11-16, 2026-11-17, 2026-11-18, 2026-11-19, 2026-11-20, 2026-11-23, 2026-11-24, 2026-11-25, 2026-11-26, 2026-11-27, 2026-11-30 |

Tổng 33 ngày. Không seed calendar ngoài danh sách, cho xưởng khác hoặc SKU khác. Không suy diễn mọi thứ Hai–thứ Sáu đều có năng lực; khi lập kế hoạch cần chọn lịch hợp lệ còn hiệu lực và phần năng lực chưa sử dụng.

## 12. Những dữ liệu chưa được seed

Các bộ seed **ban đầu trước PLANNING_SUGGESTIONS_20261023** không tạo sẵn các dữ liệu sau. Lệnh mới đã bổ sung20lô nguyên liệu, tồn/ledger, biên bản kiểm kê/hai lượt đếm/20điều chỉnh/bằng chứng theo phần đầu file; các loại chứng từ còn lại vẫn chưa seed:

- Lô nguyên liệu hoặc lô thành phẩm; người dùng đăng ký qua UC30/UC20.
- Tồn đầu, số dư `TonKho`, stock ledger hoặc reservation.
- Đơn hàng, KHSX, nhu cầu vật tư theo kế hoạch, PO hoặc giá mua NL.
- Đợt giao NL, yêu cầu nhập/xuất, biên bản QC, phiếu nhập/xuất, giao hàng thành công.
- Yêu cầu trả hàng, hàng cách ly/chưa định danh, phương án xử lý hoặc đợt tái xử lý.
- Biên bản kiểm kê, phiên đếm, chênh lệch, đề nghị điều chỉnh hoặc bằng chứng đính kèm.
- Ngưỡng cảnh báo tồn thấp/cận hạn/chậm luân chuyển. QLK cấu hình từng SKU/kho tại `/reports/alert-rules`.
- Khách hàng thứ hai, role quản trị hoặc phạm vi toàn quyền. Hội đồng thứ hai đã được tạo qua seed LOCAL_SIMPLE bổ sung.

Các màn chưa có chứng từ mẫu vẫn có thể rỗng. Tồn mới chỉ tăng bằng chứng từ hợp lệ (nhập qua QC/điều phối/ghi sổ hoặc điều chỉnh kiểm kê đã duyệt), không nhập số tồn tùy ý. Bộ mới đã dùng quy trình kiểm kê khởi tạo cho20vật tư.

## 13. Đặc điểm vận hành của seed

- Các bộ dữ liệu demo được tạo trong `warehouse_db`; không khẳng định có cùng bộ demo trong `warehouse_test`. Database test đã có schema nhưng không chạy seed demo FS vào đó.
- Seed FS11 chỉ bổ sung bản ghi thiếu, đối chiếu dữ liệu đã có và dừng khi xung đột; không ghi đè. Không tự chạy seed khi ứng dụng khởi động.
- Seed FS11 giữ nguyên 9 vai trò/10 tài khoản, mật khẩu và khách hàng cũ; thêm quyền/scope hỗ trợ được duyệt. Có audit SYSTEM cho lần seed cấu hình hỗ trợ.
- `PhienDangNhap`, bộ đếm đăng nhập sai, audit thao tác và idempotency phát sinh khi sử dụng hệ thống; không phải các chứng từ nghiệp vụ mẫu được seed.
- Metadata migration/marker môi trường là dữ liệu kỹ thuật nền tảng, không phải hàng tồn hoặc dữ liệu kinh doanh demo.

Không chạy lại seed chỉ để đọc danh sách này. Hướng dẫn thao tác các UC bằng bộ dữ liệu trên nằm tại [full_system_handoff.md](docs/full_system_handoff.md).


## Nhân viên kho đã tạo — 28/10/2026

Cập nhật theo yêu cầu: năm tài khoản thuộc vai trò Nhân viên kho (`uc01.staff`, `nhanvienkho01`, `nguyentrong`, `vuthinh`, `truongthinh`) đã đổi sang cùng mật khẩu cục bộ do người dùng chọn. Hướng dẫn đăng nhập hiện hành ở `backend/.artifacts/WAREHOUSE-STAFF-logins.local.md`; phiên cũ đã thu hồi. Quyền và phân công giữ nguyên.

| Nhân viên | Tên đăng nhập | Vai trò |
|---|---|---|
| Nguyễn Trọng | nguyentrong | Nhân viên kho |
| Vũ Thịnh | vuthinh | Nhân viên kho |
| Trường Thịnh | truongthinh | Nhân viên kho |

Mật khẩu riêng nằm tại backend/.artifacts/WAREHOUSE-STAFF-logins.local.md (ignored), không ghi trong tài liệu public. Ba tài khoản có cùng scope kho với nhanvienkho01, không scope xưởng. Quản lý mở **Phân công → Cung cấp nguyên vật liệu**, chọn phiếu xưởng đã Gửi yêu cầu, kho cấp và nhân viên; nhân viên xem việc của mình tại Phân công/trang chủ. Chọn lô/vị trí/giữ tồn và ghi sổ xuất vẫn theo UC15/UC23.


Cập nhật giao diện 28/10: chức năng phân công nhân viên đã gộp vào **Xuất kho nguyên liệu**. Quản lý nhận phiếu xưởng, phân công rồi bấm Điều phối xuất trên cùng phiếu; nhân viên xem nhiệm vụ tại cùng trang này. Menu Phân công riêng đã bỏ.


## Danh mục kho hiện hành — 28/10/2026

| Kho | Loại hiện có |
|---|---|
| Kho nguyên liệu | MATERIAL |
| Kho thành phẩm | FINISHED |
| Kho hàng lỗi | CONTROLLED (kiểm soát/cách ly) |

Đổi tên ba kho hiện có, giữ vị trí, dữ liệu tồn, chứng từ và phạm vi tài khoản.


## Mã lô nguyên liệu mẫu hiện hành

| Mã nguyên liệu | Nguyên liệu | Mã lô |
|---|---|---|
| NVL001 | Vỏ lon 250ml | LO-VO-LON-250ML-01 |
| NVL002 | Vỏ lon 330ml | LO-VO-LON-330ML-01 |
| NVL003 | Nắp lon | LO-NAP-LON-01 |
| NVL004 | Vỏ chai PET 350ml | LO-VO-CHAI-PET-350ML-01 |
| NVL005 | Vỏ chai PET 450ml | LO-VO-CHAI-PET-450ML-01 |
| NVL006 | Vỏ chai PET 500ml | LO-VO-CHAI-PET-500ML-01 |
| NVL007 | Vỏ chai PET 1.5L | LO-VO-CHAI-PET-15L-01 |
| NVL008 | Nắp chai | LO-NAP-CHAI-01 |
| NVL009 | Nhãn chai | LO-NHAN-CHAI-01 |
| NVL010 | Thùng carton | LO-THUNG-CARTON-01 |
| NVL011 | Đường tinh luyện | LO-DUONG-01 |
| NVL012 | Nước đã xử lý | LO-NUOC-XU-LY-01 |
| NVL013 | Hương Cola | LO-HUONG-COLA-01 |
| NVL014 | Hương cam | LO-HUONG-CAM-01 |
| NVL015 | Hương chanh | LO-HUONG-CHANH-01 |
| NVL016 | Hương dâu | LO-HUONG-DAU-01 |
| NVL017 | Nguyên liệu tăng lực | LO-TANG-LUC-01 |
| NVL018 | Trà chiết xuất | LO-TRA-CHIET-XUAT-01 |
| NVL019 | Hương đào | LO-HUONG-DAO-01 |
| NVL020 | CO2 thực phẩm | LO-CO2-THUC-PHAM-01 |

Mã lô cũ NVLxxx_KHOITAO_20261023 là lịch sử trước chuẩn hóa; ID lô, tồn và chứng từ được giữ nguyên. Lô mới do hệ thống tự cấp mã theo nguyên liệu.


## Vị trí kho nguyên liệu A–F

| Vị trí | Nhóm | Sức chứa (kg) | Nguyên liệu |
|---|---|---:|---|
| VITRi-A | Nguyên liệu sản xuất khô | 2.000 | Đường, nguyên liệu tăng lực, trà chiết xuất |
| VITRi-B | Hương liệu | 1.000 | Hương Cola, cam, chanh, dâu, đào |
| VITRi-C | Bao bì chai/lon | 2.000 | Vỏ lon/chai PET và nắp |
| VITRi-D | Vật tư đóng gói | 1.500 | Nhãn và thùng carton |
| VITRi-E | Nước đã xử lý | 3.000 | Nước đã xử lý |
| VITRi-F | Khí thực phẩm | 500 | CO2 thực phẩm |

Pallet chưa có danh mục vật tư. Tồn mẫu cũ vẫn ở VT_NVL_KHOITAO, tiếp tục xem và xuất được; nhập mới phải chọn đúng nhóm. Sức chứa là số liệu mẫu quy đổi kg. Chi tiết: docs/material_location_layout.md.
