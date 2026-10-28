-- FS03: private planning estimate per demand/warehouse. This is not a stock reservation.
CREATE TABLE PhanBoTonDuKien (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, demand_id BIGINT UNSIGNED NOT NULL,
 warehouse_id BIGINT UNSIGNED NOT NULL, qty_assigned DECIMAL(20,6) NOT NULL,
 UNIQUE(demand_id,warehouse_id), CHECK(qty_assigned>=0),
 FOREIGN KEY(demand_id) REFERENCES NhuCauNguyenLieuKHSX(id), FOREIGN KEY(warehouse_id) REFERENCES Kho(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
