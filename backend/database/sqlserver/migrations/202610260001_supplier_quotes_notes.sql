-- Approved 26/10/2026: supplier/material quotations and optional purchase notes.
ALTER TABLE dbo.DonMuaNguyenLieu ADD notes NVARCHAR(2000) NULL;
CREATE TABLE dbo.BaoGiaNguyenLieu (
 id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT BaoGiaNguyenLieu_pk PRIMARY KEY,
 supplier_id BIGINT NOT NULL,
 material_id BIGINT NOT NULL,
 unit_id BIGINT NOT NULL,
 revision BIGINT NOT NULL,
 unit_price DECIMAL(20,6) NOT NULL,
 effective_at DATETIME2(3) NOT NULL,
 created_at DATETIME2(3) NOT NULL CONSTRAINT BaoGiaNguyenLieu_created DEFAULT SYSUTCDATETIME(),
 CONSTRAINT BaoGiaNguyenLieu_supplier_fk FOREIGN KEY(supplier_id) REFERENCES dbo.NhaCungCap(id),
 CONSTRAINT BaoGiaNguyenLieu_material_fk FOREIGN KEY(material_id) REFERENCES dbo.NguyenLieu(id),
 CONSTRAINT BaoGiaNguyenLieu_unit_fk FOREIGN KEY(unit_id) REFERENCES dbo.DonViTinh(id),
 CONSTRAINT BaoGiaNguyenLieu_revision_check CHECK(revision>0),
 CONSTRAINT BaoGiaNguyenLieu_price_check CHECK(unit_price>=0),
 CONSTRAINT BaoGiaNguyenLieu_unique UNIQUE(supplier_id,material_id,unit_id,revision)
);
CREATE INDEX BaoGiaNguyenLieu_current ON dbo.BaoGiaNguyenLieu(supplier_id,material_id,unit_id,effective_at,revision);
