-- FS10: independent rework batch quota; original QC rows remain immutable.
CREATE TABLE DotTaiXuLy (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, disposition_id BIGINT UNSIGNED NOT NULL UNIQUE,
 source_qc_type ENUM('MATERIAL','PRODUCT','RETURN') NOT NULL, warehouse_id BIGINT UNSIGNED NOT NULL, location_id BIGINT UNSIGNED NOT NULL,
 material_lot_id BIGINT UNSIGNED NULL, product_lot_id BIGINT UNSIGNED NULL, qty_processed DECIMAL(20,6) NOT NULL,
 status ENUM('CHO_QC','QC_HOAN_TAT') NOT NULL DEFAULT 'CHO_QC', version INT UNSIGNED NOT NULL DEFAULT 0,
 created_by_id BIGINT UNSIGNED NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CHECK((material_lot_id IS NULL)<>(product_lot_id IS NULL)), CHECK(qty_processed>0),
 FOREIGN KEY(disposition_id) REFERENCES XuLyHangLoiTraVe(id), FOREIGN KEY(warehouse_id) REFERENCES Kho(id), FOREIGN KEY(location_id) REFERENCES ViTriLuuKho(id),
 FOREIGN KEY(material_lot_id) REFERENCES LoNguyenLieu(id), FOREIGN KEY(product_lot_id) REFERENCES LoThanhPham(id), FOREIGN KEY(created_by_id) REFERENCES TaiKhoan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
ALTER TABLE BienBanQCNguyenLieu MODIFY source_id BIGINT UNSIGNED NULL,
 ADD rework_batch_id BIGINT UNSIGNED NULL, ADD FOREIGN KEY(rework_batch_id) REFERENCES DotTaiXuLy(id),
 ADD CHECK((source_id IS NULL)<>(rework_batch_id IS NULL));
ALTER TABLE BienBanQCThanhPham MODIFY source_id BIGINT UNSIGNED NULL,
 ADD rework_batch_id BIGINT UNSIGNED NULL, ADD FOREIGN KEY(rework_batch_id) REFERENCES DotTaiXuLy(id),
 ADD CHECK((source_id IS NULL)<>(rework_batch_id IS NULL));
ALTER TABLE KetQuaKiemTraHangTra MODIFY source_id BIGINT UNSIGNED NULL,
 ADD rework_batch_id BIGINT UNSIGNED NULL, ADD FOREIGN KEY(rework_batch_id) REFERENCES DotTaiXuLy(id),
 ADD CHECK((source_id IS NULL)<>(rework_batch_id IS NULL));
ALTER TABLE ChiTietQCNguyenLieu MODIFY source_line_id BIGINT UNSIGNED NULL,
 ADD rework_batch_id BIGINT UNSIGNED NULL, ADD FOREIGN KEY(rework_batch_id) REFERENCES DotTaiXuLy(id),
 ADD CHECK((source_line_id IS NULL)<>(rework_batch_id IS NULL));
ALTER TABLE ChiTietQCThanhPham MODIFY source_line_id BIGINT UNSIGNED NULL,
 ADD rework_batch_id BIGINT UNSIGNED NULL, ADD FOREIGN KEY(rework_batch_id) REFERENCES DotTaiXuLy(id),
 ADD CHECK((source_line_id IS NULL)<>(rework_batch_id IS NULL));
ALTER TABLE ChiTietQCHangTra MODIFY source_line_id BIGINT UNSIGNED NULL,
 ADD rework_batch_id BIGINT UNSIGNED NULL, ADD FOREIGN KEY(rework_batch_id) REFERENCES DotTaiXuLy(id),
 ADD CHECK((source_line_id IS NULL)<>(rework_batch_id IS NULL));
ALTER TABLE PhieuNhapKho MODIFY kind ENUM('MATERIAL','FINISHED','RETURN','REJECTED') NOT NULL,
 ADD source_qc_type ENUM('MATERIAL','PRODUCT','RETURN') NULL,
 ADD CHECK((kind='REJECTED' AND source_qc_type IS NOT NULL) OR (kind<>'REJECTED' AND source_qc_type IS NULL));
ALTER TABLE XuLyHangLoiTraVe ADD balance_id BIGINT UNSIGNED NULL,
 ADD FOREIGN KEY(balance_id) REFERENCES TonKho(id);
