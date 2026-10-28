# Tổng hợp tám Domain Model — bản nháp

Ngày 11/10/2026; nguồn tám file docs/domain và SRS 2.3 mục 9. Không sửa sơ đồ nguồn. **33 lớp khác nhau trong tám view**, 34 lớp SRS: NhaCungCap có trong SRS nhưng không có trong các view. Thuộc tính trùng tên giữa các view đã đối chiếu, không phát hiện khác nội dung. Một domain/DB chung, không tám DB.

## Class–thuộc tính–view

| Class | Thuộc tính gốc (kiểu, tên) | View xuất hiện |
|---|---|---|
| TaiKhoan | VARCHAR maTaiKhoan; VARCHAR tenDangNhap; VARCHAR matKhau; NVARCHAR hoTen; VARCHAR soDienThoai; VARCHAR email; NVARCHAR diaChi; VARCHAR trangThai | banGiamDoc.md |
| VaiTroQuyen | VARCHAR maVaiTro; NVARCHAR tenVaiTro; NVARCHAR moTa; NVARCHAR danhSachQuyen; VARCHAR trangThai | banGiamDoc.md |
| KeHoachSanXuat | VARCHAR maKHSX; DATETIME ngayLap; DATE ngayBatDau; DATE ngayKetThuc; DATETIME ngayDuyet; VARCHAR ketQuaDuyet; NVARCHAR lyDoTuChoi; VARCHAR trangThai | banGiamDoc.md, boPhanLapKeHoach.md, xuongSanXuat.md |
| ChiTietKeHoachSanXuat | VARCHAR maCTKHSX; DECIMAL soLuongSanXuat; DATE ngayBatDau; DATE ngayKetThuc; NVARCHAR ghiChu | banGiamDoc.md, boPhanLapKeHoach.md, xuongSanXuat.md |
| DonMuaNguyenLieu | VARCHAR maDonMua; DATETIME ngayLap; DECIMAL tongSoLuong; DECIMAL tongTien; DATETIME ngayDuyet; VARCHAR ketQuaDuyet; NVARCHAR lyDoTuChoi; VARCHAR trangThai | banGiamDoc.md, boPhanLapKeHoach.md, boPhanQC.md |
| BienBanKiemKe | VARCHAR maBienBanKiemKe; DATETIME ngayKiemKe; NVARCHAR noiDung; NVARCHAR ghiChu; VARCHAR trangThai | banGiamDoc.md, hoiDongKiemKe.md |
| ChiTietKiemKe | VARCHAR maCTKiemKe; DECIMAL soLuongHeThong; DECIMAL soLuongThucTe; DECIMAL chenhLech; NVARCHAR ghiChu | banGiamDoc.md, hoiDongKiemKe.md |
| DeNghiDieuChinhTon | VARCHAR maDeNghi; DATETIME ngayLap; DECIMAL soLuongDieuChinh; NVARCHAR lyDo; DATETIME ngayDuyet; VARCHAR ketQuaDuyet; NVARCHAR ghiChu; VARCHAR trangThai | banGiamDoc.md, hoiDongKiemKe.md |
| XuLyChenhLech | VARCHAR maXuLy; DATETIME ngayXuLy; NVARCHAR nguyenNhan; NVARCHAR phuongAnXuLy; NVARCHAR ketQuaXuLy; VARCHAR trangThai | banGiamDoc.md, hoiDongKiemKe.md |
| DonHang | VARCHAR maDonHang; DATETIME ngayDat; DATE ngayGiaoDuKien; NVARCHAR diaChiGiaoHang; NVARCHAR nguoiNhan; VARCHAR soDienThoaiNhan; VARCHAR trangThai | boPhanLapKeHoach.md, khachhang.md |
| ChiTietDonHang | VARCHAR maChiTietDH; DECIMAL soLuong; NVARCHAR donViTinh; DECIMAL donGia; DECIMAL thanhTien; NVARCHAR ghiChu | boPhanLapKeHoach.md, khachhang.md |
| XuongSanXuat | VARCHAR maXuong; NVARCHAR tenXuong; NVARCHAR viTri; DECIMAL nangLucSanXuat; VARCHAR trangThai | boPhanLapKeHoach.md, xuongSanXuat.md |
| ThanhPham | VARCHAR maThanhPham; NVARCHAR tenThanhPham; NVARCHAR donViTinh; NVARCHAR quyCachDongGoi; INT hanSuDungMacDinh; VARCHAR trangThai | boPhanLapKeHoach.md, boPhanQuanLiKho.md, khachhang.md, xuongSanXuat.md |
| ChiTietDonMuaNguyenLieu | VARCHAR maCTDonMua; DECIMAL soLuong; NVARCHAR donViTinh; DECIMAL donGia; DECIMAL thanhTien; NVARCHAR ghiChu | boPhanLapKeHoach.md |
| NguyenLieu | VARCHAR maNguyenLieu; NVARCHAR tenNguyenLieu; NVARCHAR donViTinh; NVARCHAR quyCachDongGoi; NVARCHAR dieuKienBaoQuan; VARCHAR trangThai | boPhanLapKeHoach.md, boPhanQuanLiKho.md |
| BienBanQCNguyenLieu | VARCHAR maBienBanQCNL; DATETIME ngayKiemTra; DECIMAL tongSoLuongKiem; DECIMAL soLuongDat; DECIMAL soLuongKhongDat; VARCHAR ketQua; NVARCHAR lyDoKhongDat; NVARCHAR ghiChu | boPhanQC.md, nhanVienKho.md |
| PhieuNhapKhoThanhPham | VARCHAR maPhieuYCNK; DATETIME ngayLap; DECIMAL soLuongHoanThanh; NVARCHAR ghiChu; VARCHAR trangThai | boPhanQC.md, nhanVienKho.md, xuongSanXuat.md |
| BienBanQCThanhPham | VARCHAR maBienBanQCTP; DATETIME ngayKiemTra; DECIMAL tongSoLuongKiem; DECIMAL soLuongDat; DECIMAL soLuongKhongDat; VARCHAR ketQua; NVARCHAR lyDoKhongDat; NVARCHAR ghiChu | boPhanQC.md, nhanVienKho.md, xuongSanXuat.md |
| YeuCauTraHang | VARCHAR maYeuCauTra; DATETIME ngayYeuCau; DECIMAL soLuongYeuCauTra; NVARCHAR lyDoTra; NVARCHAR ghiChu; VARCHAR trangThai | boPhanQC.md, khachhang.md |
| KetQuaKiemTraHangTra | VARCHAR maKetQuaKiemTra; DATETIME ngayKiemTra; DECIMAL soLuongThucTe; DECIMAL soLuongDat; DECIMAL soLuongKhongDat; NVARCHAR tinhTrangHang; VARCHAR ketQua; NVARCHAR ghiChu | boPhanQC.md, khachhang.md |
| XuLyHangLoiTraVe | VARCHAR maXuLyHang; DATETIME ngayXuLy; DECIMAL soLuongXuLy; NVARCHAR tinhTrangHang; NVARCHAR phuongAnXuLy; NVARCHAR ketQuaXuLy; NVARCHAR ghiChu; VARCHAR trangThai | boPhanQC.md, khachhang.md |
| PhieuNhapKho | VARCHAR maPhieuNhap; DATETIME ngayNhap; VARCHAR loaiNhap; DECIMAL tongSoLuong; NVARCHAR lyDoNhap; VARCHAR trangThai | boPhanQC.md, nhanVienKho.md |
| Kho | VARCHAR maKho; NVARCHAR tenKho; VARCHAR loaiKho; NVARCHAR viTri; DECIMAL sucChua; VARCHAR trangThai | boPhanQuanLiKho.md, hoiDongKiemKe.md, nhanVienKho.md |
| ViTriLuuKho | VARCHAR maViTri; NVARCHAR tenViTri; NVARCHAR khuVuc; DECIMAL sucChua; DECIMAL sucChuaConLai; NVARCHAR quyTacSapXep; VARCHAR trangThai | boPhanQuanLiKho.md, hoiDongKiemKe.md, nhanVienKho.md |
| TonKho | VARCHAR maTonKho; DECIMAL soLuongTon; DECIMAL soLuongKhaDung; DATETIME ngayCapNhat | boPhanQuanLiKho.md, hoiDongKiemKe.md, nhanVienKho.md |
| LoNguyenLieu | VARCHAR maLoNL; DATE ngayNhap; DATE ngaySanXuat; DATE hanSuDung; DECIMAL soLuongBanDau; DECIMAL soLuongConLai; VARCHAR trangThai | boPhanQuanLiKho.md, nhanVienKho.md |
| LoThanhPham | VARCHAR maLoTP; DATE ngaySanXuat; DATE hanSuDung; DECIMAL soLuongBanDau; DECIMAL soLuongConLai; VARCHAR trangThai | boPhanQuanLiKho.md, nhanVienKho.md, xuongSanXuat.md |
| CanhBaoKho | VARCHAR maCanhBao; VARCHAR loaiCanhBao; NVARCHAR noiDung; VARCHAR mucDo; DATETIME ngayPhatSinh; VARCHAR trangThai | boPhanQuanLiKho.md |
| KhachHang | VARCHAR maKhachHang; NVARCHAR hoTen; VARCHAR soDienThoai; VARCHAR email; NVARCHAR diaChi; VARCHAR trangThai | khachhang.md |
| ChiTietPhieuNhap | VARCHAR maCTPhieuNhap; DECIMAL soLuongNhap; NVARCHAR donViTinh; NVARCHAR ghiChu | nhanVienKho.md |
| PhieuXuatKho | VARCHAR maPhieuXuat; DATETIME ngayXuat; VARCHAR loaiXuat; DECIMAL tongSoLuong; NVARCHAR lyDoXuat; VARCHAR trangThai | nhanVienKho.md, xuongSanXuat.md |
| ChiTietPhieuXuat | VARCHAR maCTPhieuXuat; DECIMAL soLuongXuat; NVARCHAR donViTinh; NVARCHAR ghiChu | nhanVienKho.md |
| PhieuXuatKhoNguyenLieu | VARCHAR maPhieuYCXK; DATETIME ngayLap; DECIMAL tongSoLuongYeuCau; NVARCHAR lyDo; NVARCHAR ghiChu; VARCHAR trangThai | nhanVienKho.md, xuongSanXuat.md |
| NhaCungCap (chỉ SRS) | maNCC VARCHAR, tenNCC NVARCHAR, diaChi NVARCHAR, soDienThoai VARCHAR, email VARCHAR, trangThai VARCHAR | SRS mục 9/9.1 |

## Quan hệ và bội số nguyên bản

Các quan hệ sau được trích nguyên bản để không tự đổi bội số; quan hệ tương tự khác nhãn vẫn giữ nguồn riêng. Physical FK/ràng buộc cụ thể tại database_design.

| Quan hệ (Mermaid gốc) | Nguồn view |
|---|---|
| `VaiTroQuyen "1" --> "0..*" TaiKhoan : phan_quyen` | banGiamDoc.md |
| `TaiKhoan "1" --> "0..*" KeHoachSanXuat : phe_duyet` | banGiamDoc.md |
| `TaiKhoan "1" --> "0..*" DonMuaNguyenLieu : phe_duyet` | banGiamDoc.md |
| `TaiKhoan "1" --> "0..*" DeNghiDieuChinhTon : phe_duyet` | banGiamDoc.md |
| `KeHoachSanXuat "1" *-- "1..*" ChiTietKeHoachSanXuat : gom` | banGiamDoc.md, boPhanLapKeHoach.md, xuongSanXuat.md |
| `BienBanKiemKe "1" *-- "1..*" ChiTietKiemKe : gom` | banGiamDoc.md, hoiDongKiemKe.md |
| `ChiTietKiemKe "1" --> "0..1" DeNghiDieuChinhTon : de_nghi` | banGiamDoc.md |
| `DeNghiDieuChinhTon "1" --> "0..1" XuLyChenhLech : xu_ly` | banGiamDoc.md, hoiDongKiemKe.md |
| `DonHang "1" *-- "1..*" ChiTietDonHang : gom` | boPhanLapKeHoach.md, khachhang.md |
| `DonHang "1" --> "0..*" KeHoachSanXuat : co_ke_hoach` | boPhanLapKeHoach.md |
| `XuongSanXuat "1" --> "0..*" ChiTietKeHoachSanXuat : duoc_phan_cong` | boPhanLapKeHoach.md |
| `ChiTietDonHang "0..*" --> "1" ThanhPham : san_pham` | boPhanLapKeHoach.md, khachhang.md |
| `ChiTietKeHoachSanXuat "0..*" --> "1" ThanhPham : san_xuat` | boPhanLapKeHoach.md, xuongSanXuat.md |
| `KeHoachSanXuat "1" --> "0..*" DonMuaNguyenLieu : nhu_cau_mua` | boPhanLapKeHoach.md |
| `DonMuaNguyenLieu "1" *-- "1..*" ChiTietDonMuaNguyenLieu : gom` | boPhanLapKeHoach.md |
| `ChiTietDonMuaNguyenLieu "0..*" --> "1" NguyenLieu : nguyen_lieu` | boPhanLapKeHoach.md |
| `DonMuaNguyenLieu "1" --> "0..*" BienBanQCNguyenLieu : kiem_tra_NL` | boPhanQC.md |
| `BienBanQCNguyenLieu "1" --> "0..1" PhieuNhapKho : ket_qua_dat` | boPhanQC.md |
| `PhieuNhapKhoThanhPham "1" --> "0..1" BienBanQCThanhPham : kiem_tra_TP` | boPhanQC.md |
| `BienBanQCThanhPham "1" --> "0..1" PhieuNhapKho : ket_qua_dat` | boPhanQC.md |
| `YeuCauTraHang "1" --> "0..1" KetQuaKiemTraHangTra : kiem_tra` | boPhanQC.md, khachhang.md |
| `KetQuaKiemTraHangTra "1" --> "0..*" XuLyHangLoiTraVe : xu_ly` | boPhanQC.md, khachhang.md |
| `BienBanQCNguyenLieu "1" --> "0..*" XuLyHangLoiTraVe : hang_khong_dat` | boPhanQC.md |
| `BienBanQCThanhPham "1" --> "0..*" XuLyHangLoiTraVe : hang_khong_dat` | boPhanQC.md |
| `Kho "1" *-- "1..*" ViTriLuuKho : gom` | boPhanQuanLiKho.md, hoiDongKiemKe.md, nhanVienKho.md |
| `ViTriLuuKho "1" --> "0..*" TonKho : luu_tru` | boPhanQuanLiKho.md, hoiDongKiemKe.md |
| `NguyenLieu "1" --> "0..*" LoNguyenLieu : gom_lo` | boPhanQuanLiKho.md |
| `ThanhPham "1" --> "0..*" LoThanhPham : gom_lo` | boPhanQuanLiKho.md, xuongSanXuat.md |
| `LoNguyenLieu "1" --> "0..*" TonKho : ton_lo_NL` | boPhanQuanLiKho.md |
| `LoThanhPham "1" --> "0..*" TonKho : ton_lo_TP` | boPhanQuanLiKho.md |
| `Kho "1" --> "0..*" CanhBaoKho : phat_sinh` | boPhanQuanLiKho.md |
| `Kho "1" --> "0..*" BienBanKiemKe : kiem_ke` | hoiDongKiemKe.md |
| `TonKho "1" --> "0..*" ChiTietKiemKe : doi_chieu` | hoiDongKiemKe.md |
| `ChiTietKiemKe "1" --> "0..1" DeNghiDieuChinhTon : phat_sinh` | hoiDongKiemKe.md |
| `KhachHang "1" --> "0..*" DonHang : dat` | khachhang.md |
| `DonHang "1" --> "0..*" YeuCauTraHang : phat_sinh` | khachhang.md |
| `Kho "1" --> "0..*" PhieuNhapKho : nhap_tai` | nhanVienKho.md |
| `Kho "1" --> "0..*" PhieuXuatKho : xuat_tu` | nhanVienKho.md |
| `PhieuNhapKho "1" *-- "1..*" ChiTietPhieuNhap : gom` | nhanVienKho.md |
| `PhieuXuatKho "1" *-- "1..*" ChiTietPhieuXuat : gom` | nhanVienKho.md |
| `ChiTietPhieuNhap "0..*" --> "1" ViTriLuuKho : vi_tri_nhap` | nhanVienKho.md |
| `ChiTietPhieuXuat "0..*" --> "1" ViTriLuuKho : vi_tri_xuat` | nhanVienKho.md |
| `ChiTietPhieuNhap "0..*" --> "0..1" LoNguyenLieu : lo_NL` | nhanVienKho.md |
| `ChiTietPhieuNhap "0..*" --> "0..1" LoThanhPham : lo_TP` | nhanVienKho.md |
| `ChiTietPhieuXuat "0..*" --> "0..1" LoNguyenLieu : lo_NL` | nhanVienKho.md |
| `ChiTietPhieuXuat "0..*" --> "0..1" LoThanhPham : lo_TP` | nhanVienKho.md |
| `PhieuXuatKhoNguyenLieu "1" --> "0..*" PhieuXuatKho : can_cu` | nhanVienKho.md |
| `PhieuNhapKhoThanhPham "1" --> "0..*" PhieuNhapKho : can_cu` | nhanVienKho.md |
| `BienBanQCNguyenLieu "1" --> "0..1" PhieuNhapKho : du_dieu_kien` | nhanVienKho.md |
| `BienBanQCThanhPham "1" --> "0..1" PhieuNhapKho : du_dieu_kien` | nhanVienKho.md |
| `ViTriLuuKho "1" --> "0..*" TonKho : ton_tai` | nhanVienKho.md |
| `XuongSanXuat "1" --> "0..*" ChiTietKeHoachSanXuat : thuc_hien` | xuongSanXuat.md |
| `ChiTietKeHoachSanXuat "1" --> "0..*" PhieuXuatKhoNguyenLieu : yeu_cau_NL` | xuongSanXuat.md |
| `ChiTietKeHoachSanXuat "1" --> "0..*" PhieuNhapKhoThanhPham : yeu_cau_nhap_TP` | xuongSanXuat.md |
| `XuongSanXuat "1" --> "0..*" PhieuXuatKhoNguyenLieu : lap_phieu` | xuongSanXuat.md |
| `XuongSanXuat "1" --> "0..*" PhieuNhapKhoThanhPham : lap_phieu` | xuongSanXuat.md |
| `PhieuXuatKhoNguyenLieu "1" --> "0..*" PhieuXuatKho : can_cu_xuat` | xuongSanXuat.md |
| `PhieuNhapKhoThanhPham "1" --> "0..*" LoThanhPham : lo_hoan_thanh` | xuongSanXuat.md |
| `PhieuNhapKhoThanhPham "1" --> "0..1" BienBanQCThanhPham : QC` | xuongSanXuat.md |

## Chuẩn hóa đề xuất và khoảng trống

- KhachHang/TaiKhoan khác entity: profile khách và credential; liên kết còn thiếu, D07. VaiTroQuyen 1:N TaiKhoan theo view; không tự đổi multi-role.
- Phiếu yêu cầu PhieuXuatKhoNguyenLieu/PhieuNhapKhoThanhPham khác phiếu thực tế, cần dòng NL/TP/lô nguồn. UC13/15 chỉ quản lý phân bổ của phiếu thực tế chưa post, không class điều phối mới.
- Quan hệ QC→PNK 0..1, request→QC 0..1 chưa phù hợp nhập từng phần/nhiều lô; logic1:N và dòng QC theo lượng nhận đã xác nhận, D10.
- TonKho/chi tiết có hai lô nullable: đúng một lô, cần XOR và unique normalized; không hai nguồn tồn theo actor. Lượng còn lại lô và sức chứa còn lại chỉ projection.
- SRS thêm NCC FK PO, SKU chai/lon/dung tích, quy cách version, snapshot/lần đếm/audit; view thiếu FK/thuộc tính để thực hiện.
- Không có định mức/chi tiết nhu cầu NL dù UC03/22 cần; D01. Không có LenhSanXuat trong nguồn hiện tại; frontend còn nhãn, D02.
- YeuCauTraHang/QC return chỉ lượng header, thiếu source issue line/lô; xử lý lỗi thiếu approval và stock document link, D05/D12.
- ChiTietKiemKe phải đếm cả hàng thừa chưa có TonKho, vị trí trống, bucket/condition; không bắt buộc balance FK cho mọi số đếm.
- XuLyChenhLech nối từ đề nghị nhưng UC08 xác minh trước đề nghị: logic FK stocktake_line cho hồ sơ xác minh, đề nghị tham chiếu lại; D04.

Danh mục vấn đề chi tiết GAP01–GAP16 và trạng thái duyệt tại decisions.md; bảng kỹ thuật có căn cứ tại database_design.md. Các quan hệ1:N QC đã xác nhận; chi tiết vật lý còn là thiết kế logic, không âm thầm sửa 34 lớp khái niệm.

## Đối chiếu sau xác nhận hiện tại

Tám Mermaid giữ nguyên: 33 lớp unique trong view, SRS34 vì NhaCungCap chỉ có SRS. Một class nhiều actor chỉ một bảng. Không LenhSanXuat/DieuPhoi. BOM M:N version/demand, packaging/capacity factors, mandatory stock reservation, QC batch/detail1:N, delivery/reception/return lines, snapshot/count/finite lease/ledger là mở rộng logic có căn cứ tại database_design, không giả định có trong model nguồn.

QC request→biên bản0..1 và QC→receipt0..1 trong view khác yêu cầu nhiều đợt/partial; logic1:N đã xác nhận, nguồn vẫn bảo tồn. TonKho.soLuongKhaDung/Lo.soLuongConLai/ViTri.sucChuaConLai là projection. Actor điều phối Bộ phận quản lý kho đã xác nhận, không thêm bảng actor. Account–KH cardinality đã xác nhận NT07 ngày 12/10/2026: KH1:N accounts, customer_id nullable không UNIQUE; UC18 approval/support workflow CHUA_DUYET.
