-- Additive mapping of locations to permitted materials. Does not move stock.
CREATE TABLE dbo.ViTriNguyenLieuDuocPhep (
 location_id BIGINT NOT NULL,
 material_id BIGINT NOT NULL,
 CONSTRAINT ViTriNguyenLieuDuocPhep_pk PRIMARY KEY(location_id,material_id),
 CONSTRAINT ViTriNguyenLieuDuocPhep_location_fk FOREIGN KEY(location_id) REFERENCES dbo.ViTriLuuKho(id),
 CONSTRAINT ViTriNguyenLieuDuocPhep_material_fk FOREIGN KEY(material_id) REFERENCES dbo.NguyenLieu(id)
);
CREATE INDEX ViTriNguyenLieuDuocPhep_material_idx ON dbo.ViTriNguyenLieuDuocPhep(material_id,location_id);
