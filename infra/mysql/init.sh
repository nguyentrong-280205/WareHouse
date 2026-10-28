#!/bin/bash
set -eu
read_secret() {
  local value
  value="$(cat "$1")"
  [[ "$value" =~ ^[a-f0-9]{64}$ ]] || { echo 'Invalid secret format' >&2; exit 1; }
  printf '%s' "$value"
}
export MYSQL_PWD="$(read_secret /run/secrets/root_password)"
APP_PASS="$(read_secret /run/secrets/app_password)"
MIGRATION_PASS="$(read_secret /run/secrets/migration_password)"
if [ "$WAREHOUSE_ENV" = development ]; then
  mysql --protocol=socket -uroot <<SQL
CREATE DATABASE IF NOT EXISTS warehouse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'warehouse_app'@'%' IDENTIFIED BY '$APP_PASS';
CREATE USER IF NOT EXISTS 'warehouse_migration'@'%' IDENTIFIED BY '$MIGRATION_PASS';
GRANT SELECT, INSERT, UPDATE, DELETE ON warehouse_db.* TO 'warehouse_app'@'%';
GRANT ALL PRIVILEGES ON warehouse_db.* TO 'warehouse_migration'@'%';
SQL
elif [ "$WAREHOUSE_ENV" = test ]; then
  SHADOW_PASS="$(read_secret /run/secrets/shadow_password)"
  [[ "$TEST_INSTANCE_ID" =~ ^[a-f0-9-]{36}$ ]] || { echo 'Invalid test marker' >&2; exit 1; }
  mysql --protocol=socket -uroot <<SQL
CREATE DATABASE IF NOT EXISTS warehouse_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS warehouse_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'warehouse_test_app'@'%' IDENTIFIED BY '$APP_PASS';
CREATE USER IF NOT EXISTS 'warehouse_test_migration'@'%' IDENTIFIED BY '$MIGRATION_PASS';
CREATE USER IF NOT EXISTS 'warehouse_shadow'@'%' IDENTIFIED BY '$SHADOW_PASS';
GRANT SELECT, INSERT, UPDATE, DELETE ON warehouse_test.* TO 'warehouse_test_app'@'%';
GRANT ALL PRIVILEGES ON warehouse_test.* TO 'warehouse_test_migration'@'%';
GRANT ALL PRIVILEGES ON warehouse_shadow.* TO 'warehouse_shadow'@'%';
CREATE TABLE warehouse_test._warehouse_environment (id TINYINT UNSIGNED PRIMARY KEY,
  environment VARCHAR(16) NOT NULL, instance_id CHAR(36) NOT NULL, CHECK(id=1), CHECK(environment='test'))
  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO warehouse_test._warehouse_environment VALUES(1,'test','$TEST_INSTANCE_ID');
SQL
else
  echo 'Invalid warehouse environment' >&2; exit 1
fi
unset MYSQL_PWD APP_PASS MIGRATION_PASS SHADOW_PASS
