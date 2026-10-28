-- Approved FS07/FS09/FS10/FS12 support; append-only snapshots/counts/evidence, finite leases.
CREATE TABLE PhamViKiemKe (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, stocktake_id BIGINT UNSIGNED NOT NULL, location_id BIGINT UNSIGNED NOT NULL,
 UNIQUE(stocktake_id,location_id), FOREIGN KEY(stocktake_id) REFERENCES BienBanKiemKe(id), FOREIGN KEY(location_id) REFERENCES ViTriLuuKho(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE ThanhVienKiemKe (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, stocktake_id BIGINT UNSIGNED NOT NULL, account_id BIGINT UNSIGNED NOT NULL,
 UNIQUE(stocktake_id,account_id), FOREIGN KEY(stocktake_id) REFERENCES BienBanKiemKe(id), FOREIGN KEY(account_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE SnapshotKiemKe (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, stocktake_id BIGINT UNSIGNED NOT NULL, scope_generation INT UNSIGNED NOT NULL,
 balance_id BIGINT UNSIGNED NOT NULL, location_id BIGINT UNSIGNED NOT NULL, qty_system DECIMAL(20,6) NOT NULL, qty_reserved DECIMAL(20,6) NOT NULL,
 material_lot_id BIGINT UNSIGNED NULL, product_lot_id BIGINT UNSIGNED NULL, quality_bucket ENUM('DAT','QUARANTINE','FAILED','EXPIRED') NOT NULL,
 UNIQUE(stocktake_id,scope_generation,balance_id), CHECK(qty_system>=0 AND qty_reserved>=0 AND qty_reserved<=qty_system),
 FOREIGN KEY(stocktake_id) REFERENCES BienBanKiemKe(id), FOREIGN KEY(balance_id) REFERENCES TonKho(id),
 FOREIGN KEY(location_id) REFERENCES ViTriLuuKho(id), FOREIGN KEY(material_lot_id) REFERENCES LoNguyenLieu(id), FOREIGN KEY(product_lot_id) REFERENCES LoThanhPham(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE LanDemKiemKe (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, stocktake_id BIGINT UNSIGNED NOT NULL, scope_generation INT UNSIGNED NOT NULL,
 sequence INT UNSIGNED NOT NULL, counter_id BIGINT UNSIGNED NOT NULL, status ENUM('NHAP','DA_NOP') NOT NULL DEFAULT 'NHAP',
 version INT UNSIGNED NOT NULL DEFAULT 0, empty_location_ids JSON NOT NULL, submitted_at DATETIME(3) NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE(stocktake_id,scope_generation,sequence), CHECK(sequence>0), FOREIGN KEY(stocktake_id) REFERENCES BienBanKiemKe(id), FOREIGN KEY(counter_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE ChiTietLanDem (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, count_id BIGINT UNSIGNED NOT NULL, location_id BIGINT UNSIGNED NOT NULL,
 material_lot_id BIGINT UNSIGNED NULL, product_lot_id BIGINT UNSIGNED NULL, reported_lot_code VARCHAR(100) NULL,
 quality_bucket ENUM('DAT','QUARANTINE','FAILED','EXPIRED','UNKNOWN') NOT NULL, qty_counted DECIMAL(20,6) NOT NULL,
 condition_note VARCHAR(1000) NOT NULL, breakdown JSON NOT NULL, factors_snapshot JSON NOT NULL, evidence_ids JSON NOT NULL,
 CHECK(qty_counted>=0), CHECK((material_lot_id IS NOT NULL)+(product_lot_id IS NOT NULL)<=1),
 FOREIGN KEY(count_id) REFERENCES LanDemKiemKe(id), FOREIGN KEY(location_id) REFERENCES ViTriLuuKho(id),
 FOREIGN KEY(material_lot_id) REFERENCES LoNguyenLieu(id), FOREIGN KEY(product_lot_id) REFERENCES LoThanhPham(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE ChiTietKiemKe (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, stocktake_id BIGINT UNSIGNED NOT NULL, scope_generation INT UNSIGNED NOT NULL,
 snapshot_id BIGINT UNSIGNED NULL, balance_id BIGINT UNSIGNED NULL, accepted_count_id BIGINT UNSIGNED NOT NULL,
 location_id BIGINT UNSIGNED NOT NULL, material_lot_id BIGINT UNSIGNED NULL, product_lot_id BIGINT UNSIGNED NULL,
 quality_bucket ENUM('DAT','QUARANTINE','FAILED','EXPIRED','UNKNOWN') NOT NULL,
 qty_system DECIMAL(20,6) NOT NULL, qty_counted DECIMAL(20,6) NOT NULL, delta DECIMAL(20,6) NOT NULL,
 version INT UNSIGNED NOT NULL DEFAULT 0, status ENUM('CHO_XAC_MINH','DA_XAC_MINH','CHO_DUYET','DA_DIEU_CHINH','KHONG_DIEU_CHINH','VO_HIEU') NOT NULL DEFAULT 'CHO_XAC_MINH',
 CHECK(qty_system>=0 AND qty_counted>=0 AND delta=qty_counted-qty_system), UNIQUE(stocktake_id,scope_generation,balance_id),
 FOREIGN KEY(stocktake_id) REFERENCES BienBanKiemKe(id), FOREIGN KEY(snapshot_id) REFERENCES SnapshotKiemKe(id), FOREIGN KEY(balance_id) REFERENCES TonKho(id),
 FOREIGN KEY(accepted_count_id) REFERENCES LanDemKiemKe(id), FOREIGN KEY(location_id) REFERENCES ViTriLuuKho(id),
 FOREIGN KEY(material_lot_id) REFERENCES LoNguyenLieu(id), FOREIGN KEY(product_lot_id) REFERENCES LoThanhPham(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE XuLyChenhLech (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, stocktake_line_id BIGINT UNSIGNED NOT NULL UNIQUE,
 verifier_id BIGINT UNSIGNED NOT NULL, reason VARCHAR(1000) NOT NULL, accepted_count_round INT UNSIGNED NOT NULL, evidence_ids JSON NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), FOREIGN KEY(stocktake_line_id) REFERENCES ChiTietKiemKe(id), FOREIGN KEY(verifier_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE DeNghiDieuChinhTon (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, stocktake_line_id BIGINT UNSIGNED NOT NULL UNIQUE,
 verification_id BIGINT UNSIGNED NOT NULL, stocktake_id BIGINT UNSIGNED NOT NULL, scope_generation INT UNSIGNED NOT NULL,
 qty_signed DECIMAL(20,6) NOT NULL, proposer_id BIGINT UNSIGNED NOT NULL, approver_id BIGINT UNSIGNED NULL,
 status ENUM('CHO_DUYET','DA_DUYET','TU_CHOI','VO_HIEU') NOT NULL DEFAULT 'CHO_DUYET', reason VARCHAR(1000) NULL,
 version INT UNSIGNED NOT NULL DEFAULT 0, decided_at DATETIME(3) NULL,
 CHECK(qty_signed<>0), FOREIGN KEY(stocktake_line_id) REFERENCES ChiTietKiemKe(id), FOREIGN KEY(verification_id) REFERENCES XuLyChenhLech(id),
 FOREIGN KEY(stocktake_id) REFERENCES BienBanKiemKe(id), FOREIGN KEY(proposer_id) REFERENCES TaiKhoan(id), FOREIGN KEY(approver_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE BangChung (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, stocktake_id BIGINT UNSIGNED NULL, issue_id BIGINT UNSIGNED NULL,
 warehouse_id BIGINT UNSIGNED NOT NULL, storage_key VARCHAR(100) COLLATE utf8mb4_0900_bin NOT NULL UNIQUE,
 checksum CHAR(64) COLLATE utf8mb4_0900_bin NOT NULL, media_type VARCHAR(100) NOT NULL, byte_size BIGINT UNSIGNED NOT NULL,
 original_name VARCHAR(255) NOT NULL, uploader_id BIGINT UNSIGNED NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CHECK((stocktake_id IS NOT NULL)+(issue_id IS NOT NULL)=1), CHECK(byte_size>0),
 FOREIGN KEY(stocktake_id) REFERENCES BienBanKiemKe(id), FOREIGN KEY(issue_id) REFERENCES PhieuXuatKho(id),
 FOREIGN KEY(warehouse_id) REFERENCES Kho(id), FOREIGN KEY(uploader_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE TiepNhanChuaDinhDanh (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, warehouse_id BIGINT UNSIGNED NOT NULL, location_id BIGINT UNSIGNED NOT NULL,
 reported_lot_code VARCHAR(100) NOT NULL, material_id BIGINT UNSIGNED NULL, product_id BIGINT UNSIGNED NULL,
 quantity DECIMAL(20,6) NOT NULL, unit_id BIGINT UNSIGNED NOT NULL, occupied_capacity DECIMAL(35,15) NOT NULL,
 reason VARCHAR(1000) NOT NULL, status ENUM('CACH_LY','DA_DINH_DANH') NOT NULL DEFAULT 'CACH_LY', version INT UNSIGNED NOT NULL DEFAULT 0,
 resolved_return_reception_line_id BIGINT UNSIGNED NULL, created_by_id BIGINT UNSIGNED NOT NULL, resolved_by_id BIGINT UNSIGNED NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), resolved_at DATETIME(3) NULL,
 CHECK(quantity>0 AND occupied_capacity>0), CHECK((material_id IS NOT NULL)+(product_id IS NOT NULL)<=1),
 FOREIGN KEY(warehouse_id) REFERENCES Kho(id), FOREIGN KEY(location_id) REFERENCES ViTriLuuKho(id),
 FOREIGN KEY(material_id) REFERENCES NguyenLieu(id), FOREIGN KEY(product_id) REFERENCES ThanhPham(id), FOREIGN KEY(unit_id) REFERENCES DonViTinh(id),
 FOREIGN KEY(resolved_return_reception_line_id) REFERENCES ChiTietTiepNhanTra(id), FOREIGN KEY(created_by_id) REFERENCES TaiKhoan(id), FOREIGN KEY(resolved_by_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE XuLyHangLoiTraVe (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, source_qc_type ENUM('MATERIAL','PRODUCT','RETURN') NOT NULL,
 material_qc_line_id BIGINT UNSIGNED NULL, product_qc_line_id BIGINT UNSIGNED NULL, return_qc_line_id BIGINT UNSIGNED NULL,
 method ENUM('REWORK','SUPPLIER_RETURN','DISPOSAL') NOT NULL, qty_base DECIMAL(20,6) NOT NULL, reason VARCHAR(1000) NOT NULL,
 status ENUM('NHAP','CHO_DUYET','DA_DUYET','TU_CHOI','DA_THUC_HIEN') NOT NULL DEFAULT 'NHAP', version INT UNSIGNED NOT NULL DEFAULT 0,
 proposed_by_id BIGINT UNSIGNED NOT NULL, approved_by_id BIGINT UNSIGNED NULL, decided_at DATETIME(3) NULL, executed_at DATETIME(3) NULL,
 CHECK(qty_base>0), CHECK((material_qc_line_id IS NOT NULL)+(product_qc_line_id IS NOT NULL)+(return_qc_line_id IS NOT NULL)=1),
 FOREIGN KEY(material_qc_line_id) REFERENCES ChiTietQCNguyenLieu(id), FOREIGN KEY(product_qc_line_id) REFERENCES ChiTietQCThanhPham(id),
 FOREIGN KEY(return_qc_line_id) REFERENCES ChiTietQCHangTra(id), FOREIGN KEY(proposed_by_id) REFERENCES TaiKhoan(id), FOREIGN KEY(approved_by_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
ALTER TABLE StockPosting ADD FOREIGN KEY(adjustment_id) REFERENCES DeNghiDieuChinhTon(id), ADD FOREIGN KEY(disposition_id) REFERENCES XuLyHangLoiTraVe(id);
CREATE TABLE CauHinhNghiepVu (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, warehouse_id BIGINT UNSIGNED NOT NULL,
 material_id BIGINT UNSIGNED NULL, product_id BIGINT UNSIGNED NULL,
 item_kind CHAR(1) GENERATED ALWAYS AS (IF(material_id IS NULL,'P','M')) STORED,
 item_key BIGINT UNSIGNED GENERATED ALWAYS AS (COALESCE(material_id,product_id)) STORED,
 revision INT UNSIGNED NOT NULL, low_stock_base DECIMAL(20,6) NOT NULL, near_expiry_days INT UNSIGNED NOT NULL, slow_moving_days INT UNSIGNED NOT NULL,
 created_by_id BIGINT UNSIGNED NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CHECK((material_id IS NULL)<>(product_id IS NULL)), CHECK(low_stock_base>=0 AND slow_moving_days>0), UNIQUE(warehouse_id,item_kind,item_key,revision),
 FOREIGN KEY(warehouse_id) REFERENCES Kho(id), FOREIGN KEY(material_id) REFERENCES NguyenLieu(id), FOREIGN KEY(product_id) REFERENCES ThanhPham(id), FOREIGN KEY(created_by_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
