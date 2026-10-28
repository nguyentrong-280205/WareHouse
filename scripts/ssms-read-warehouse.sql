-- Run in SSMS connected to .\HTTT02 with Windows Authentication after setup.
-- Read-only examples; queries inside OPENQUERY use MySQL syntax.
SELECT * FROM OPENQUERY(WAREHOUSE_MYSQL, 'SELECT DATABASE() AS database_name');
SELECT * FROM OPENQUERY(WAREHOUSE_MYSQL, 'SHOW TABLES FROM warehouse_db');
SELECT * FROM OPENQUERY(WAREHOUSE_MYSQL, 'SELECT id, code, name, type, capacity FROM warehouse_db.Kho ORDER BY id');
SELECT * FROM OPENQUERY(WAREHOUSE_MYSQL, 'SELECT id, code, name FROM warehouse_db.NguyenLieu ORDER BY id');
SELECT * FROM OPENQUERY(WAREHOUSE_MYSQL, 'SELECT id, code, name FROM warehouse_db.ThanhPham ORDER BY id');
