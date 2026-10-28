-- Requested product catalog metadata; additive, no existing row/history changes.
ALTER TABLE dbo.ThanhPham ADD description nvarchar(2000) NULL;
-- Pallet configuration is snapshotted on its immutable packaging version.
ALTER TABLE dbo.QuyCachDongGoi ADD cartons_per_pallet bigint NULL, carton_factor_snapshot decimal(20,9) NULL;
-- Compile the constraint after ADD columns, while remaining in the same migration transaction.
EXEC(N'ALTER TABLE dbo.QuyCachDongGoi ADD CONSTRAINT QuyCachDongGoi_pallet_snapshot CHECK (
 (cartons_per_pallet IS NULL AND carton_factor_snapshot IS NULL)
 OR (cartons_per_pallet IS NOT NULL AND carton_factor_snapshot IS NOT NULL AND cartons_per_pallet>0 AND carton_factor_snapshot>0)
);');
