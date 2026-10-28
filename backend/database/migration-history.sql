-- Migration-tool metadata only; existing business tables remain unchanged.
CREATE TABLE IF NOT EXISTS _sql_migrations (
  version VARCHAR(100) COLLATE utf8mb4_0900_bin PRIMARY KEY,
  checksum CHAR(64) COLLATE utf8mb4_0900_bin NOT NULL,
  state ENUM('APPLYING','APPLIED','BASELINED_LEGACY') NOT NULL,
  started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  finished_at DATETIME(3) NULL,
  CHECK ((state='APPLYING' AND finished_at IS NULL)
    OR (state IN ('APPLIED','BASELINED_LEGACY') AND finished_at IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
