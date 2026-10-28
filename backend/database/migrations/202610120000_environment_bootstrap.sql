
-- Docker establishes this test marker BEFORE migrations to guard every test write.
-- The guarded migration wrapper baselines this metadata only after verification.
CREATE TABLE IF NOT EXISTS _warehouse_environment (
  id TINYINT UNSIGNED PRIMARY KEY,
  environment VARCHAR(16) NOT NULL,
  instance_id CHAR(36) NOT NULL,
  CHECK (id = 1), CHECK (environment = 'test')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
