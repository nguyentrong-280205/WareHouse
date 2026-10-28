# Bổ sung gợi ý vật tư23/10/2026 — Docker warehouse

Bổ sung26/10 đã được duyệt: migration202610260001_supplier_quotes_notes thêm DonMuaNguyenLieu.notes NVARCHAR(2000) NULL và bảng BaoGiaNguyenLieu (NCC/vật tư/đơn vị/phiên bản/giá DECIMAL20,6/hiệu lực UTC). Sau migration Docker dev/test có77bảng nghiệp vụ/241FK, gồm3FK báo giá mới. Không thay schema HTTT02. Các số76/238 bên dưới là mốc trước migration này. [Thiết kế](purchase_supplier_design.md).

Migration202610230002_planning_material_overrides đã thêm DinhMuc.source_bom_id (FK tự tham chiếu) và is_plan_override BIT/CHECK đi đôi. Không thêm bảng: vẫn76bảng nghiệp vụ, **238FK** trên Docker dev/test sau migration. Metadata237FK bên dưới là mốc native16/10/2026, HTTT02 không thay đổi. [Thiết kế](planning_suggestions_design.md).

# Schema SQL Server thực tế — 16/10/2026

Metadata đọc trên HTTT02 sau migration; không thực hiện kiểm thử UC. Mô hình gồm **76 bảng nghiệp vụ, 237 FK**, CHECK và index dưới đây; không thêm lớp nghiệp vụ. Tên bảng giữ nguyên MySQL nguồn. `_sql_migrations` kỹ thuật và `_warehouse_environment` test được liệt kê riêng.

| Database | Bảng nghiệp vụ | FK | CHECK | Index (gồm PK/metadata) | Filtered unique |
|---|---:|---:|---:|---:|---:|
| warehouse_db | 76 | 237 | 512 | 164 | 9 |
| warehouse_test | 76 | 237 | 514 | 165 | 9 |

Tất cả FK/CHECK đang enabled và trusted. Collation database Latin1_General_100_CI_AI_SC; cột mã/login/hash theo BIN2 trong migration. Ngày UTC datetime2(3), lượng/giá decimal(20,6), tiền(20,0), hệ số(20,9).

## Mapping và thống kê nguồn trước chuyển dữ liệu

Số liệu nguồn là COUNT/MAX ID read-only, không phải dữ liệu đã chuyển. Seed SQL Server được tái tạo từ fixture; không import hàng nguồn. Mọi copy dữ liệu thật phải duyệt mapping/quota/FK/row count/rollback trước.

| Bảng SQL Server dbo (cũng là tên nguồn) | Cột | FK đi ra | Dòng MySQL nguồn | Max ID MySQL |
|---|---:|---:|---:|---|
| AuditLog | 10 | 1 | 7 | 7 |
| BangChung | 11 | 4 | 0 | — |
| BienBanKiemKe | 12 | 2 | 0 | — |
| BienBanQCNguyenLieu | 8 | 3 | 0 | — |
| BienBanQCThanhPham | 8 | 3 | 0 | — |
| CauHinhNghiepVu | 12 | 4 | 0 | — |
| ChiTietDinhMuc | 5 | 3 | 4 | 4 |
| ChiTietDonHang | 12 | 5 | 0 | — |
| ChiTietDonMuaNguyenLieu | 7 | 3 | 0 | — |
| ChiTietGiaoHang | 6 | 2 | 0 | — |
| ChiTietGiaoNL | 6 | 4 | 0 | — |
| ChiTietKeHoachSanXuat | 9 | 5 | 0 | — |
| ChiTietKiemKe | 15 | 7 | 0 | — |
| ChiTietLanDem | 12 | 4 | 0 | — |
| ChiTietPhieuNhap | 14 | 9 | 0 | — |
| ChiTietPhieuXuat | 13 | 8 | 0 | — |
| ChiTietQCHangTra | 11 | 4 | 0 | — |
| ChiTietQCNguyenLieu | 11 | 4 | 0 | — |
| ChiTietQCThanhPham | 11 | 4 | 0 | — |
| ChiTietTiepNhanTra | 7 | 5 | 0 | — |
| ChiTietTraHang | 6 | 4 | 0 | — |
| ChiTietYeuCauNhapTP | 5 | 3 | 0 | — |
| ChiTietYeuCauXuatNL | 6 | 4 | 0 | — |
| DatGiuTon | 10 | 4 | 0 | — |
| DeNghiDieuChinhTon | 12 | 5 | 0 | — |
| DinhMuc | 8 | 2 | 1 | 1 |
| DonHang | 15 | 2 | 0 | — |
| DonMuaNguyenLieu | 15 | 4 | 0 | — |
| DonViTinh | 6 | 0 | 9 | 9 |
| DotGiaoHang | 5 | 2 | 0 | — |
| DotGiaoNguyenLieu | 10 | 3 | 0 | — |
| DotTaiXuLy | 12 | 6 | 0 | — |
| GiaBanThanhPham | 8 | 3 | 4 | 4 |
| HeSoChiemCho | 9 | 3 | 10 | 10 |
| IdempotencyRequest | 9 | 1 | 2 | 2 |
| KeHoachSanXuat | 13 | 3 | 0 | — |
| KetQuaKiemTraHangTra | 8 | 3 | 0 | — |
| KhachHang | 10 | 0 | 1 | 1 |
| Kho | 11 | 2 | 3 | 3 |
| KhoaViTriKiemKe | 6 | 2 | 0 | — |
| LanDemKiemKe | 10 | 2 | 0 | — |
| LichNangLucXuong | 5 | 2 | 33 | 33 |
| LichSuBienDongTon | 11 | 5 | 0 | — |
| LoNguyenLieu | 11 | 2 | 0 | — |
| LoThanhPham | 12 | 3 | 0 | — |
| NguyenLieu | 11 | 2 | 4 | 4 |
| NhaCungCap | 7 | 0 | 1 | 1 |
| NhuCauNguyenLieuKHSX | 9 | 4 | 0 | — |
| PhamViKiemKe | 3 | 2 | 0 | — |
| PhanBoLichSanXuat | 4 | 2 | 0 | — |
| PhanBoMuaChoNhuCau | 4 | 2 | 0 | — |
| PhanBoTonDuKien | 4 | 2 | 0 | — |
| PhienDangNhap | 9 | 1 | 3 | 3 |
| PhieuNhapKho | 13 | 2 | 0 | — |
| PhieuNhapKhoThanhPham | 9 | 3 | 0 | — |
| PhieuXuatKho | 16 | 4 | 0 | — |
| PhieuXuatKhoNguyenLieu | 9 | 3 | 0 | — |
| QuyCachDongGoi | 8 | 3 | 4 | 4 |
| Quyen | 3 | 0 | 63 | 63 |
| SnapshotKiemKe | 10 | 5 | 0 | — |
| StockPosting | 9 | 7 | 0 | — |
| TaiKhoan | 14 | 2 | 19 | 19 |
| TaiKhoan_Kho | 2 | 2 | 48 | — |
| TaiKhoan_Xuong | 2 | 2 | 16 | — |
| ThanhPham | 12 | 2 | 1 | 1 |
| ThanhVienKiemKe | 3 | 2 | 0 | — |
| TiepNhanChuaDinhDanh | 17 | 8 | 0 | — |
| TiepNhanTra | 7 | 3 | 0 | — |
| TonKho | 12 | 4 | 0 | — |
| VaiTro_Quyen | 2 | 2 | 65 | — |
| VaiTroQuyen | 5 | 0 | 9 | 9 |
| ViTriLuuKho | 14 | 3 | 5 | 5 |
| XuLyChenhLech | 7 | 2 | 0 | — |
| XuLyHangLoiTraVe | 15 | 6 | 0 | — |
| XuongSanXuat | 4 | 0 | 1 | 1 |
| YeuCauTraHang | 9 | 3 | 0 | — |

## Bảng kỹ thuật và migration

- SQL Server `_sql_migrations`: lineage mới `202610160001_native_schema`, APPLIED ở cả hai DB; không baseline hoặc copy history MySQL.
- `_warehouse_environment`: chỉ warehouse_test, marker UUID cục bộ; database/endpoint/principal/instance được kiểm trước ghi test.
- MySQL `_prisma_migrations` (2 dòng) và `_sql_migrations` (9 dòng) giữ nguyên tại nguồn; không tạo `_prisma_migrations` trên SQL Server.

## Index unique nullable có chủ đích

| Bảng | Index | Điều kiện lọc |
|---|---|---|
| ChiTietKiemKe | IX_ChiTietKiemKe_67 | `([balance_id] IS NOT NULL)` |
| ChiTietQCHangTra | IX_ChiTietQCHangTra_49 | `([source_line_id] IS NOT NULL)` |
| ChiTietQCNguyenLieu | IX_ChiTietQCNguyenLieu_47 | `([source_line_id] IS NOT NULL)` |
| ChiTietQCThanhPham | IX_ChiTietQCThanhPham_48 | `([source_line_id] IS NOT NULL)` |
| StockPosting | IX_StockPosting_57 | `([receipt_id] IS NOT NULL)` |
| StockPosting | IX_StockPosting_58 | `([issue_id] IS NOT NULL)` |
| StockPosting | IX_StockPosting_59 | `([return_reception_id] IS NOT NULL)` |
| StockPosting | IX_StockPosting_60 | `([adjustment_id] IS NOT NULL)` |
| StockPosting | IX_StockPosting_61 | `([disposition_id] IS NOT NULL)` |

## Hồ sơ chi tiết

Định nghĩa đầy đủ cột/PK/FK/CHECK/index/computed: `backend/database/sqlserver/migrations/202610160001_native_schema.sql`. Metadata đầy đủ đọc thực tế: `backend/.artifacts/sqlserver/schema-metadata.json` (ignored). Migration MySQL cũ giữ nguyên byte ở `backend/database/migrations`; Prisma chỉ archive.
# Bổ sung danh mục23/10/2026

Migration bất biến mới `202610230001_product_description` đã APPLIED trên warehouse_db/warehouse_test của SQL Server Docker warehouse. Giữ76bảng nghiệp vụ/237FK; thêm ThanhPham.description NVARCHAR(2000) NULL và QuyCachDongGoi.cartons_per_pallet BIGINT NULL, carton_factor_snapshot DECIMAL(20,9) NULL, CHECK đi đôi và dương. Không sửa native schema migration, không suy diễn backfill quy cách lịch sử. HTTT02 Windows độc lập không thay đổi. [Chi tiết và kiểm chứng](product_catalog_update.md).

