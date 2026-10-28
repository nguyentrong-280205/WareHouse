-- Additive design: employees assigned to a submitted workshop material request.
CREATE TABLE dbo.PhanCongCapNguyenLieu (
 request_id BIGINT NOT NULL,
 staff_id BIGINT NOT NULL,
 warehouse_id BIGINT NOT NULL,
 assigned_by_id BIGINT NOT NULL,
 assigned_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PhanCongCapNguyenLieu_pk PRIMARY KEY(request_id,staff_id),
 CONSTRAINT PhanCongCapNguyenLieu_request_fk FOREIGN KEY(request_id) REFERENCES dbo.PhieuXuatKhoNguyenLieu(id),
 CONSTRAINT PhanCongCapNguyenLieu_staff_fk FOREIGN KEY(staff_id) REFERENCES dbo.TaiKhoan(id),
 CONSTRAINT PhanCongCapNguyenLieu_warehouse_fk FOREIGN KEY(warehouse_id) REFERENCES dbo.Kho(id),
 CONSTRAINT PhanCongCapNguyenLieu_assigner_fk FOREIGN KEY(assigned_by_id) REFERENCES dbo.TaiKhoan(id)
);
CREATE INDEX PhanCongCapNguyenLieu_staff_idx ON dbo.PhanCongCapNguyenLieu(staff_id,warehouse_id,request_id);
