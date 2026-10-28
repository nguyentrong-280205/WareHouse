-- FS01–FS12 approved 2026-10-15. Additive schema; do not apply separately from reviewed dependencies.
-- No opening balances, fake QC, seed credentials or changes to legacy migration history.
CREATE TABLE DotGiaoNguyenLieu (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, code VARCHAR(50) COLLATE utf8mb4_0900_bin NOT NULL UNIQUE,
 purchase_id BIGINT UNSIGNED NOT NULL, warehouse_id BIGINT UNSIGNED NOT NULL, received_at DATETIME(3) NOT NULL, supplier_reference VARCHAR(200) NULL,
 status ENUM('CHO_QC','QC_HOAN_TAT','NHAN_MOT_PHAN','HOAN_THANH') NOT NULL DEFAULT 'CHO_QC',
 version INT UNSIGNED NOT NULL DEFAULT 0, created_by_id BIGINT UNSIGNED NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(purchase_id) REFERENCES DonMuaNguyenLieu(id), FOREIGN KEY(warehouse_id) REFERENCES Kho(id), FOREIGN KEY(created_by_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE ChiTietGiaoNL (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, delivery_id BIGINT UNSIGNED NOT NULL, purchase_line_id BIGINT UNSIGNED NOT NULL,
 material_lot_id BIGINT UNSIGNED NOT NULL, unit_id BIGINT UNSIGNED NOT NULL, qty_received DECIMAL(20,6) NOT NULL,
 CHECK(qty_received>0), UNIQUE(delivery_id,purchase_line_id,material_lot_id),
 FOREIGN KEY(delivery_id) REFERENCES DotGiaoNguyenLieu(id), FOREIGN KEY(purchase_line_id) REFERENCES ChiTietDonMuaNguyenLieu(id),
 FOREIGN KEY(material_lot_id) REFERENCES LoNguyenLieu(id), FOREIGN KEY(unit_id) REFERENCES DonViTinh(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE PhieuXuatKho (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, code VARCHAR(50) COLLATE utf8mb4_0900_bin NOT NULL UNIQUE,
 kind ENUM('SALE','MATERIAL') NOT NULL, warehouse_id BIGINT UNSIGNED NOT NULL,
 order_id BIGINT UNSIGNED NULL, material_request_id BIGINT UNSIGNED NULL,
 status ENUM('NHAP','DA_PHAN_BO','DA_XAC_NHAN','HOAN_THANH','HUY','HET_HAN') NOT NULL DEFAULT 'NHAP',
 version INT UNSIGNED NOT NULL DEFAULT 0, allocation_generation INT UNSIGNED NOT NULL DEFAULT 0,
 confirmed_at DATETIME(3) NULL, expires_at DATETIME(3) NULL, hard_expires_at DATETIME(3) NULL, renew_count INT UNSIGNED NOT NULL DEFAULT 0,
 posted_at DATETIME(3) NULL, created_by_id BIGINT UNSIGNED NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CHECK((kind='SALE' AND order_id IS NOT NULL AND material_request_id IS NULL) OR (kind='MATERIAL' AND order_id IS NULL AND material_request_id IS NOT NULL)),
 FOREIGN KEY(warehouse_id) REFERENCES Kho(id), FOREIGN KEY(order_id) REFERENCES DonHang(id),
 FOREIGN KEY(material_request_id) REFERENCES PhieuXuatKhoNguyenLieu(id), FOREIGN KEY(created_by_id) REFERENCES TaiKhoan(id), INDEX(status,expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE ChiTietPhieuXuat (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, issue_id BIGINT UNSIGNED NOT NULL, generation INT UNSIGNED NOT NULL,
 order_line_id BIGINT UNSIGNED NULL, material_request_line_id BIGINT UNSIGNED NULL,
 material_lot_id BIGINT UNSIGNED NULL, product_lot_id BIGINT UNSIGNED NULL,
 location_id BIGINT UNSIGNED NOT NULL, unit_id BIGINT UNSIGNED NOT NULL, packaging_version_id BIGINT UNSIGNED NULL,
 qty_input DECIMAL(20,6) NOT NULL, factor_snapshot DECIMAL(20,9) NOT NULL, qty_base DECIMAL(20,6) NOT NULL,
 CHECK((order_line_id IS NULL)<>(material_request_line_id IS NULL)), CHECK((material_lot_id IS NULL)<>(product_lot_id IS NULL)),
 CHECK(qty_input>0 AND qty_base>0 AND factor_snapshot>0), UNIQUE(id,issue_id),
 FOREIGN KEY(issue_id) REFERENCES PhieuXuatKho(id), FOREIGN KEY(order_line_id) REFERENCES ChiTietDonHang(id),
 FOREIGN KEY(material_request_line_id) REFERENCES ChiTietYeuCauXuatNL(id), FOREIGN KEY(material_lot_id) REFERENCES LoNguyenLieu(id),
 FOREIGN KEY(product_lot_id) REFERENCES LoThanhPham(id), FOREIGN KEY(location_id) REFERENCES ViTriLuuKho(id),
 FOREIGN KEY(unit_id) REFERENCES DonViTinh(id), FOREIGN KEY(packaging_version_id) REFERENCES QuyCachDongGoi(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE DotGiaoHang (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, issue_id BIGINT UNSIGNED NOT NULL UNIQUE, order_id BIGINT UNSIGNED NOT NULL,
 version INT UNSIGNED NOT NULL DEFAULT 0, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(issue_id) REFERENCES PhieuXuatKho(id), FOREIGN KEY(order_id) REFERENCES DonHang(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE ChiTietGiaoHang (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, delivery_id BIGINT UNSIGNED NOT NULL, issue_line_id BIGINT UNSIGNED NOT NULL UNIQUE,
 qty_dispatched DECIMAL(20,6) NOT NULL, qty_delivered DECIMAL(20,6) NOT NULL DEFAULT 0, last_delivered_at DATETIME(3) NULL,
 CHECK(qty_dispatched>0 AND qty_delivered>=0 AND qty_delivered<=qty_dispatched),
 FOREIGN KEY(delivery_id) REFERENCES DotGiaoHang(id), FOREIGN KEY(issue_line_id) REFERENCES ChiTietPhieuXuat(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE YeuCauTraHang (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, code VARCHAR(50) COLLATE utf8mb4_0900_bin NOT NULL UNIQUE,
 order_id BIGINT UNSIGNED NOT NULL, customer_id BIGINT UNSIGNED NOT NULL, reason VARCHAR(1000) NOT NULL,
 status ENUM('DA_GUI','TIEP_NHAN_MOT_PHAN','DA_TIEP_NHAN','HOAN_THANH','HUY') NOT NULL DEFAULT 'DA_GUI',
 version INT UNSIGNED NOT NULL DEFAULT 0, created_by_id BIGINT UNSIGNED NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(order_id) REFERENCES DonHang(id), FOREIGN KEY(customer_id) REFERENCES KhachHang(id), FOREIGN KEY(created_by_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE ChiTietTraHang (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, request_id BIGINT UNSIGNED NOT NULL, delivery_line_id BIGINT UNSIGNED NOT NULL,
 issue_line_id BIGINT UNSIGNED NOT NULL, product_lot_id BIGINT UNSIGNED NOT NULL, qty_base DECIMAL(20,6) NOT NULL,
 CHECK(qty_base>0), UNIQUE(request_id,delivery_line_id),
 FOREIGN KEY(request_id) REFERENCES YeuCauTraHang(id), FOREIGN KEY(delivery_line_id) REFERENCES ChiTietGiaoHang(id),
 FOREIGN KEY(issue_line_id) REFERENCES ChiTietPhieuXuat(id), FOREIGN KEY(product_lot_id) REFERENCES LoThanhPham(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE TiepNhanTra (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, request_id BIGINT UNSIGNED NOT NULL, warehouse_id BIGINT UNSIGNED NOT NULL,
 status ENUM('CHO_QC','QC_HOAN_TAT','HOAN_THANH') NOT NULL DEFAULT 'CHO_QC', version INT UNSIGNED NOT NULL DEFAULT 0,
 created_by_id BIGINT UNSIGNED NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(request_id) REFERENCES YeuCauTraHang(id), FOREIGN KEY(warehouse_id) REFERENCES Kho(id), FOREIGN KEY(created_by_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE ChiTietTiepNhanTra (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, reception_id BIGINT UNSIGNED NOT NULL, return_line_id BIGINT UNSIGNED NOT NULL,
 product_lot_id BIGINT UNSIGNED NOT NULL, location_id BIGINT UNSIGNED NOT NULL, unit_id BIGINT UNSIGNED NOT NULL, qty_base DECIMAL(20,6) NOT NULL,
 CHECK(qty_base>0), FOREIGN KEY(reception_id) REFERENCES TiepNhanTra(id), FOREIGN KEY(return_line_id) REFERENCES ChiTietTraHang(id),
 FOREIGN KEY(product_lot_id) REFERENCES LoThanhPham(id), FOREIGN KEY(location_id) REFERENCES ViTriLuuKho(id), FOREIGN KEY(unit_id) REFERENCES DonViTinh(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE BienBanQCNguyenLieu (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, source_id BIGINT UNSIGNED NOT NULL,
 status ENUM('NHAP','DA_XAC_NHAN') NOT NULL DEFAULT 'NHAP', version INT UNSIGNED NOT NULL DEFAULT 0,
 created_by_id BIGINT UNSIGNED NOT NULL, confirmed_at DATETIME(3) NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(source_id) REFERENCES DotGiaoNguyenLieu(id), FOREIGN KEY(created_by_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE ChiTietQCNguyenLieu (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, qc_id BIGINT UNSIGNED NOT NULL, source_line_id BIGINT UNSIGNED NOT NULL, material_lot_id BIGINT UNSIGNED NOT NULL,
 batch_sequence INT UNSIGNED NOT NULL, qty_inspected DECIMAL(20,6) NOT NULL, qty_accepted DECIMAL(20,6) NOT NULL, qty_rejected DECIMAL(20,6) NOT NULL,
 rejection_reason VARCHAR(1000) NULL, condition_note VARCHAR(1000) NULL,
 CHECK(batch_sequence>0 AND qty_inspected>0 AND qty_accepted>=0 AND qty_rejected>=0 AND qty_inspected=qty_accepted+qty_rejected),
 UNIQUE(qc_id,source_line_id,batch_sequence), FOREIGN KEY(qc_id) REFERENCES BienBanQCNguyenLieu(id),
 FOREIGN KEY(source_line_id) REFERENCES ChiTietGiaoNL(id), FOREIGN KEY(material_lot_id) REFERENCES LoNguyenLieu(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE BienBanQCThanhPham (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, source_id BIGINT UNSIGNED NOT NULL,
 status ENUM('NHAP','DA_XAC_NHAN') NOT NULL DEFAULT 'NHAP', version INT UNSIGNED NOT NULL DEFAULT 0,
 created_by_id BIGINT UNSIGNED NOT NULL, confirmed_at DATETIME(3) NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(source_id) REFERENCES PhieuNhapKhoThanhPham(id), FOREIGN KEY(created_by_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE ChiTietQCThanhPham (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, qc_id BIGINT UNSIGNED NOT NULL, source_line_id BIGINT UNSIGNED NOT NULL, product_lot_id BIGINT UNSIGNED NOT NULL,
 batch_sequence INT UNSIGNED NOT NULL, qty_inspected DECIMAL(20,6) NOT NULL, qty_accepted DECIMAL(20,6) NOT NULL, qty_rejected DECIMAL(20,6) NOT NULL,
 rejection_reason VARCHAR(1000) NULL, condition_note VARCHAR(1000) NULL,
 CHECK(batch_sequence>0 AND qty_inspected>0 AND qty_accepted>=0 AND qty_rejected>=0 AND qty_inspected=qty_accepted+qty_rejected),
 UNIQUE(qc_id,source_line_id,batch_sequence), FOREIGN KEY(qc_id) REFERENCES BienBanQCThanhPham(id),
 FOREIGN KEY(source_line_id) REFERENCES ChiTietYeuCauNhapTP(id), FOREIGN KEY(product_lot_id) REFERENCES LoThanhPham(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE KetQuaKiemTraHangTra (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, source_id BIGINT UNSIGNED NOT NULL,
 status ENUM('NHAP','DA_XAC_NHAN') NOT NULL DEFAULT 'NHAP', version INT UNSIGNED NOT NULL DEFAULT 0,
 created_by_id BIGINT UNSIGNED NOT NULL, confirmed_at DATETIME(3) NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(source_id) REFERENCES TiepNhanTra(id), FOREIGN KEY(created_by_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE ChiTietQCHangTra (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, qc_id BIGINT UNSIGNED NOT NULL, source_line_id BIGINT UNSIGNED NOT NULL, product_lot_id BIGINT UNSIGNED NOT NULL,
 batch_sequence INT UNSIGNED NOT NULL, qty_inspected DECIMAL(20,6) NOT NULL, qty_accepted DECIMAL(20,6) NOT NULL, qty_rejected DECIMAL(20,6) NOT NULL,
 rejection_reason VARCHAR(1000) NULL, condition_note VARCHAR(1000) NULL,
 CHECK(batch_sequence>0 AND qty_inspected>0 AND qty_accepted>=0 AND qty_rejected>=0 AND qty_inspected=qty_accepted+qty_rejected),
 UNIQUE(qc_id,source_line_id,batch_sequence), FOREIGN KEY(qc_id) REFERENCES KetQuaKiemTraHangTra(id),
 FOREIGN KEY(source_line_id) REFERENCES ChiTietTiepNhanTra(id), FOREIGN KEY(product_lot_id) REFERENCES LoThanhPham(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE PhieuNhapKho (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, code VARCHAR(50) COLLATE utf8mb4_0900_bin NOT NULL UNIQUE,
 kind ENUM('MATERIAL','FINISHED','RETURN') NOT NULL, warehouse_id BIGINT UNSIGNED NOT NULL,
 status ENUM('NHAP','DA_PHAN_BO','DA_XAC_NHAN','HOAN_THANH','HUY') NOT NULL DEFAULT 'NHAP',
 version INT UNSIGNED NOT NULL DEFAULT 0, allocation_generation INT UNSIGNED NOT NULL DEFAULT 0,
 confirmed_at DATETIME(3) NULL, posted_at DATETIME(3) NULL, capacity_snapshot JSON NULL, created_by_id BIGINT UNSIGNED NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(warehouse_id) REFERENCES Kho(id), FOREIGN KEY(created_by_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE ChiTietPhieuNhap (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, receipt_id BIGINT UNSIGNED NOT NULL, generation INT UNSIGNED NOT NULL,
 material_qc_line_id BIGINT UNSIGNED NULL, product_qc_line_id BIGINT UNSIGNED NULL, return_qc_line_id BIGINT UNSIGNED NULL,
 material_lot_id BIGINT UNSIGNED NULL, product_lot_id BIGINT UNSIGNED NULL, location_id BIGINT UNSIGNED NOT NULL,
 unit_id BIGINT UNSIGNED NOT NULL, packaging_version_id BIGINT UNSIGNED NULL,
 qty_input DECIMAL(20,6) NOT NULL, factor_snapshot DECIMAL(20,9) NOT NULL, qty_base DECIMAL(20,6) NOT NULL,
 CHECK((material_qc_line_id IS NOT NULL)+(product_qc_line_id IS NOT NULL)+(return_qc_line_id IS NOT NULL)=1),
 CHECK((material_lot_id IS NULL)<>(product_lot_id IS NULL)), CHECK(qty_input>0 AND qty_base>0 AND factor_snapshot>0),
 FOREIGN KEY(receipt_id) REFERENCES PhieuNhapKho(id), FOREIGN KEY(material_qc_line_id) REFERENCES ChiTietQCNguyenLieu(id),
 FOREIGN KEY(product_qc_line_id) REFERENCES ChiTietQCThanhPham(id), FOREIGN KEY(return_qc_line_id) REFERENCES ChiTietQCHangTra(id),
 FOREIGN KEY(material_lot_id) REFERENCES LoNguyenLieu(id), FOREIGN KEY(product_lot_id) REFERENCES LoThanhPham(id),
 FOREIGN KEY(location_id) REFERENCES ViTriLuuKho(id), FOREIGN KEY(unit_id) REFERENCES DonViTinh(id),
 FOREIGN KEY(packaging_version_id) REFERENCES QuyCachDongGoi(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE TonKho (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, location_id BIGINT UNSIGNED NOT NULL,
 material_lot_id BIGINT UNSIGNED NULL, product_lot_id BIGINT UNSIGNED NULL,
 lot_kind CHAR(1) GENERATED ALWAYS AS (IF(material_lot_id IS NULL,'P','M')) STORED,
 lot_key BIGINT UNSIGNED GENERATED ALWAYS AS (COALESCE(material_lot_id,product_lot_id)) STORED,
 quality_bucket ENUM('DAT','QUARANTINE','FAILED','EXPIRED') NOT NULL,
 qty_on_hand DECIMAL(20,6) NOT NULL DEFAULT 0, qty_reserved DECIMAL(20,6) NOT NULL DEFAULT 0,
 capacity_factor_id BIGINT UNSIGNED NOT NULL, capacity_factor_snapshot DECIMAL(20,9) NOT NULL, version BIGINT UNSIGNED NOT NULL DEFAULT 0,
 CHECK((material_lot_id IS NULL)<>(product_lot_id IS NULL)), CHECK(qty_on_hand>=0 AND qty_reserved>=0 AND qty_reserved<=qty_on_hand),
 CHECK(capacity_factor_snapshot>0), UNIQUE(location_id,lot_kind,lot_key,quality_bucket),
 FOREIGN KEY(location_id) REFERENCES ViTriLuuKho(id), FOREIGN KEY(material_lot_id) REFERENCES LoNguyenLieu(id),
 FOREIGN KEY(product_lot_id) REFERENCES LoThanhPham(id), FOREIGN KEY(capacity_factor_id) REFERENCES HeSoChiemCho(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE DatGiuTon (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, issue_id BIGINT UNSIGNED NOT NULL, issue_line_id BIGINT UNSIGNED NOT NULL UNIQUE,
 balance_id BIGINT UNSIGNED NOT NULL, demand_id BIGINT UNSIGNED NULL,
 qty_initial DECIMAL(20,6) NOT NULL, qty_consumed DECIMAL(20,6) NOT NULL DEFAULT 0, qty_released DECIMAL(20,6) NOT NULL DEFAULT 0,
 status ENUM('ACTIVE','CONSUMED','RELEASED','EXPIRED') NOT NULL DEFAULT 'ACTIVE', expires_at DATETIME(3) NOT NULL,
 CHECK(qty_initial>0 AND qty_consumed>=0 AND qty_released>=0 AND qty_consumed+qty_released<=qty_initial),
 FOREIGN KEY(issue_id) REFERENCES PhieuXuatKho(id), FOREIGN KEY(issue_line_id) REFERENCES ChiTietPhieuXuat(id),
 FOREIGN KEY(balance_id) REFERENCES TonKho(id), FOREIGN KEY(demand_id) REFERENCES NhuCauNguyenLieuKHSX(id), INDEX(status,expires_at), INDEX(demand_id,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE BienBanKiemKe (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, code VARCHAR(50) COLLATE utf8mb4_0900_bin NOT NULL UNIQUE,
 warehouse_id BIGINT UNSIGNED NOT NULL, mode ENUM('FROZEN_SCOPE') NOT NULL DEFAULT 'FROZEN_SCOPE',
 status ENUM('NHAP','DANG_DEM','CHO_XAC_NHAN','DA_XAC_NHAN','HOAN_THANH','HUY','HET_HAN') NOT NULL DEFAULT 'NHAP',
 scope_generation INT UNSIGNED NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 0,
 planned_cutoff DATETIME(3) NULL, cutoff_at DATETIME(3) NULL, hard_expires_at DATETIME(3) NULL,
 created_by_id BIGINT UNSIGNED NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(warehouse_id) REFERENCES Kho(id), FOREIGN KEY(created_by_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE KhoaViTriKiemKe (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, location_id BIGINT UNSIGNED NOT NULL UNIQUE,
 stocktake_id BIGINT UNSIGNED NOT NULL, scope_generation INT UNSIGNED NOT NULL,
 expires_at DATETIME(3) NOT NULL, hard_expires_at DATETIME(3) NOT NULL,
 FOREIGN KEY(location_id) REFERENCES ViTriLuuKho(id), FOREIGN KEY(stocktake_id) REFERENCES BienBanKiemKe(id), CHECK(expires_at<=hard_expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE StockPosting (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, receipt_id BIGINT UNSIGNED NULL UNIQUE, issue_id BIGINT UNSIGNED NULL UNIQUE,
 return_reception_id BIGINT UNSIGNED NULL UNIQUE, stocktake_id BIGINT UNSIGNED NULL,
 adjustment_id BIGINT UNSIGNED NULL UNIQUE, disposition_id BIGINT UNSIGNED NULL UNIQUE,
 created_by_id BIGINT UNSIGNED NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CHECK((receipt_id IS NOT NULL)+(issue_id IS NOT NULL)+(return_reception_id IS NOT NULL)+(stocktake_id IS NOT NULL)+(adjustment_id IS NOT NULL)+(disposition_id IS NOT NULL)=1),
 FOREIGN KEY(receipt_id) REFERENCES PhieuNhapKho(id), FOREIGN KEY(issue_id) REFERENCES PhieuXuatKho(id),
 FOREIGN KEY(return_reception_id) REFERENCES TiepNhanTra(id), FOREIGN KEY(stocktake_id) REFERENCES BienBanKiemKe(id),
 FOREIGN KEY(created_by_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE LichSuBienDongTon (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, posting_id BIGINT UNSIGNED NOT NULL, balance_id BIGINT UNSIGNED NOT NULL,
 quantity_delta DECIMAL(20,6) NOT NULL, qty_before DECIMAL(20,6) NOT NULL, qty_after DECIMAL(20,6) NOT NULL,
 receipt_line_id BIGINT UNSIGNED NULL, issue_line_id BIGINT UNSIGNED NULL, return_reception_line_id BIGINT UNSIGNED NULL,
 reason VARCHAR(1000) NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CHECK(quantity_delta<>0 AND qty_before>=0 AND qty_after>=0 AND qty_after=qty_before+quantity_delta),
 FOREIGN KEY(posting_id) REFERENCES StockPosting(id), FOREIGN KEY(balance_id) REFERENCES TonKho(id),
 FOREIGN KEY(receipt_line_id) REFERENCES ChiTietPhieuNhap(id), FOREIGN KEY(issue_line_id) REFERENCES ChiTietPhieuXuat(id),
 FOREIGN KEY(return_reception_line_id) REFERENCES ChiTietTiepNhanTra(id), INDEX(balance_id,created_at,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
