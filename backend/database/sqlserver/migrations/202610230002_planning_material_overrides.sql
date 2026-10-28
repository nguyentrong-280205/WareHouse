-- Preserve historical and default BOMs; plan-specific choices become immutable private revisions.
ALTER TABLE dbo.DinhMuc ADD source_bom_id bigint NULL,
 is_plan_override bit NOT NULL CONSTRAINT DinhMuc_plan_override_default DEFAULT 0;
EXEC(N'ALTER TABLE dbo.DinhMuc ADD CONSTRAINT DinhMuc_source_bom_fk FOREIGN KEY(source_bom_id) REFERENCES dbo.DinhMuc(id);');
EXEC(N'ALTER TABLE dbo.DinhMuc ADD CONSTRAINT DinhMuc_override_source_check CHECK(
 (is_plan_override=0 AND source_bom_id IS NULL) OR
 (is_plan_override=1 AND source_bom_id IS NOT NULL AND source_bom_id<>id));');
