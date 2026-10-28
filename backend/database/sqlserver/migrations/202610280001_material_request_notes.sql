-- Pending approval: optional workshop notes; preserves all existing request rows.
ALTER TABLE dbo.PhieuXuatKhoNguyenLieu ADD notes NVARCHAR(2000) NULL;
