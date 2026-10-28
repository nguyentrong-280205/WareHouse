-- Approved 28/10: audited same-warehouse material location transfer.
CREATE TABLE dbo.PhieuChuyenViTri (
 id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 code NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL UNIQUE,
 warehouse_id BIGINT NOT NULL REFERENCES dbo.Kho(id),
 source_location_id BIGINT NOT NULL REFERENCES dbo.ViTriLuuKho(id),
 created_by_id BIGINT NOT NULL REFERENCES dbo.TaiKhoan(id),
 status NVARCHAR(20) NOT NULL CONSTRAINT PhieuChuyenViTri_status CHECK(status='HOAN_THANH'),
 created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE dbo.ChiTietChuyenViTri (
 id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 transfer_id BIGINT NOT NULL REFERENCES dbo.PhieuChuyenViTri(id),
 source_balance_id BIGINT NOT NULL REFERENCES dbo.TonKho(id),
 destination_balance_id BIGINT NOT NULL REFERENCES dbo.TonKho(id),
 material_lot_id BIGINT NOT NULL REFERENCES dbo.LoNguyenLieu(id),
 unit_id BIGINT NOT NULL REFERENCES dbo.DonViTinh(id),
 qty_base DECIMAL(20,6) NOT NULL,
 capacity_factor_snapshot DECIMAL(20,9) NOT NULL,
 CONSTRAINT ChiTietChuyenViTri_positive CHECK(qty_base>0 AND capacity_factor_snapshot>0 AND source_balance_id<>destination_balance_id),
 CONSTRAINT ChiTietChuyenViTri_unique_source UNIQUE(transfer_id,source_balance_id)
);
ALTER TABLE dbo.StockPosting ADD transfer_id BIGINT NULL CONSTRAINT StockPosting_transfer_fk REFERENCES dbo.PhieuChuyenViTri(id);
DECLARE @old_check sysname, @matches int;
SELECT @old_check=MIN(name),@matches=COUNT(*) FROM sys.check_constraints
 WHERE parent_object_id=OBJECT_ID(N'dbo.StockPosting') AND definition LIKE N'%receipt_id%' AND definition LIKE N'%issue_id%' AND definition LIKE N'%return_reception_id%' AND definition LIKE N'%stocktake_id%' AND definition LIKE N'%adjustment_id%' AND definition LIKE N'%disposition_id%';
IF @matches<>1 THROW 51000,'STOCK_POSTING_CHECK_REVIEW_REQUIRED',1;
DECLARE @drop_check nvarchar(max)=N'ALTER TABLE dbo.StockPosting DROP CONSTRAINT '+QUOTENAME(@old_check);
EXEC sp_executesql @drop_check;
EXEC(N'ALTER TABLE dbo.StockPosting WITH CHECK ADD CONSTRAINT StockPosting_exactly_one_source CHECK(
 (CASE WHEN receipt_id IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN issue_id IS NOT NULL THEN 1 ELSE 0 END)+
 (CASE WHEN return_reception_id IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN stocktake_id IS NOT NULL THEN 1 ELSE 0 END)+
 (CASE WHEN adjustment_id IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN disposition_id IS NOT NULL THEN 1 ELSE 0 END)+
 (CASE WHEN transfer_id IS NOT NULL THEN 1 ELSE 0 END)=1
)');
EXEC(N'CREATE UNIQUE INDEX StockPosting_transfer_unique ON dbo.StockPosting(transfer_id) WHERE transfer_id IS NOT NULL');
