-- SQL Server 2022 native schema; final approved model from immutable MySQL lineage.

-- UTF-16 NVARCHAR; BIN2 identifiers; filtered nullable uniqueness; transactional DDL.

SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON; SET ANSI_PADDING ON; SET ANSI_WARNINGS ON;

SET CONCAT_NULL_YIELDS_NULL ON; SET ARITHABORT ON; SET NUMERIC_ROUNDABORT OFF;

CREATE TABLE dbo.[KhachHang] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [name] NVARCHAR(255) NOT NULL,
  [phone] NVARCHAR(32) NULL,
  [email] NVARCHAR(255) NULL,
  [address] NVARCHAR(MAX) NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [updated_at] DATETIME2(3) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([status] IN ('ACTIVE', 'LOCKED')),
  CHECK ([version] >= 0)
);

CREATE TABLE dbo.[VaiTroQuyen] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [name] NVARCHAR(255) NOT NULL,
  [description] NVARCHAR(MAX) NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([status] IN ('ACTIVE', 'LOCKED'))
);

CREATE TABLE dbo.[Quyen] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [description] NVARCHAR(255) NULL,
  PRIMARY KEY ([id]),
  CHECK ([id] > 0)
);

CREATE TABLE dbo.[VaiTro_Quyen] (
  [role_id] BIGINT NOT NULL,
  [permission_id] BIGINT NOT NULL,
  PRIMARY KEY ([role_id], [permission_id]),
  CHECK ([role_id] >= 0),
  CHECK ([permission_id] >= 0)
);

CREATE TABLE dbo.[TaiKhoan] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [login] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [password_hash] NVARCHAR(255) NOT NULL,
  [display_name] NVARCHAR(255) NOT NULL,
  [role_id] BIGINT NOT NULL,
  [customer_id] BIGINT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  [failed_attempt_count] BIGINT NOT NULL DEFAULT 0,
  [failed_window_started_at] DATETIME2(3) NULL,
  [locked_until] DATETIME2(3) NULL,
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [updated_at] DATETIME2(3) NOT NULL,
  PRIMARY KEY ([id]),
  CONSTRAINT TaiKhoan_login_normalized CHECK ((LEN([login]) BETWEEN 1 AND 100 AND [login] COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^a-z0-9_.-]%' AND LEFT([login],1) COLLATE Latin1_General_100_BIN2 LIKE '[a-z0-9]')),
  CHECK ([id] > 0),
  CHECK ([role_id] >= 0),
  CHECK ([customer_id] >= 0),
  CHECK ([status] IN ('ACTIVE', 'LOCKED')),
  CHECK ([failed_attempt_count] >= 0),
  CHECK ([version] >= 0)
);

CREATE TABLE dbo.[PhienDangNhap] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [account_id] BIGINT NOT NULL,
  [token_hash] CHAR(64) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [csrf_hash] CHAR(64) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [last_seen_at] DATETIME2(3) NOT NULL,
  [idle_expires_at] DATETIME2(3) NOT NULL,
  [absolute_expires_at] DATETIME2(3) NOT NULL,
  [revoked_at] DATETIME2(3) NULL,
  PRIMARY KEY ([id]),
  CONSTRAINT PhienDangNhap_expiry_bounds CHECK ([created_at] < [idle_expires_at] AND [idle_expires_at] <= [absolute_expires_at] AND [last_seen_at] >= [created_at]),
  CHECK ([id] > 0),
  CHECK ([account_id] >= 0)
);

CREATE TABLE dbo.[AuditLog] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [actor_id] BIGINT NULL,
  [action] NVARCHAR(100) NOT NULL,
  [target_type] NVARCHAR(100) NOT NULL,
  [target_id] BIGINT NOT NULL,
  [before] NVARCHAR(MAX) NULL,
  [after] NVARCHAR(MAX) NULL,
  [correlation_id] NVARCHAR(64) NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [actor_kind] NVARCHAR(40) NOT NULL DEFAULT 'ACCOUNT',
  PRIMARY KEY ([id]),
  CHECK(([actor_kind]='ACCOUNT' AND [actor_id] IS NOT NULL) OR ([actor_kind]='SYSTEM' AND [actor_id] IS NULL)),
  CHECK ([id] > 0),
  CHECK ([actor_id] >= 0),
  CHECK ([target_id] >= 0),
  CHECK ([before] IS NULL OR ISJSON([before])=1),
  CHECK ([after] IS NULL OR ISJSON([after])=1),
  CHECK ([actor_kind] IN ('ACCOUNT','SYSTEM'))
);

CREATE TABLE dbo.[IdempotencyRequest] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [account_id] BIGINT NOT NULL,
  [operation] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [key] NVARCHAR(128) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [request_hash] CHAR(64) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [response] NVARCHAR(MAX) NULL,
  [response_code] INT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [expires_at] DATETIME2(3) NOT NULL,
  PRIMARY KEY ([id]),
  CONSTRAINT Idempotency_expiry_bounds CHECK ([expires_at] > [created_at]),
  CHECK ([id] > 0),
  CHECK ([account_id] >= 0),
  CHECK ([response] IS NULL OR ISJSON([response])=1),
  CHECK ([response_code] >= 0)
);

CREATE TABLE dbo.[DonViTinh] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [name] NVARCHAR(255) NOT NULL,
  [dimension] NVARCHAR(40) NOT NULL,
  [discrete] BIT NOT NULL,
  [scale] TINYINT NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([scale]<=6),
  CHECK([discrete]=0 OR [scale]=0),
  CHECK ([id] > 0),
  CHECK ([dimension] IN ('COUNT','MASS','VOLUME','CAPACITY_VOLUME')),
  CHECK ([scale] >= 0)
);

CREATE TABLE dbo.[NguyenLieu] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [name] NVARCHAR(255) NOT NULL,
  [base_unit_id] BIGINT NOT NULL,
  [requires_expiry] BIT NOT NULL,
  [storage_condition] NVARCHAR(1000) NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [updated_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([base_unit_id] >= 0),
  CHECK ([status] IN ('ACTIVE','LOCKED')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[ThanhPham] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [name] NVARCHAR(255) NOT NULL,
  [base_unit_id] BIGINT NOT NULL,
  [container_type] NVARCHAR(40) NOT NULL,
  [volume_ml] DECIMAL(20,6) NOT NULL,
  [shelf_life_days] BIGINT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [updated_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK([volume_ml]>0),
  CHECK([shelf_life_days] IS NULL OR [shelf_life_days]>0),
  CHECK ([id] > 0),
  CHECK ([base_unit_id] >= 0),
  CHECK ([container_type] IN ('PET','GLASS','CAN')),
  CHECK ([shelf_life_days] >= 0),
  CHECK ([status] IN ('ACTIVE','LOCKED')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[QuyCachDongGoi] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [product_id] BIGINT NOT NULL,
  [unit_id] BIGINT NOT NULL,
  [revision] BIGINT NOT NULL,
  [units_per_pack] DECIMAL(20,9) NOT NULL,
  [effective_from] DATE NOT NULL,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK([units_per_pack]>0),
  CHECK([revision]>0),
  CHECK ([id] > 0),
  CHECK ([product_id] >= 0),
  CHECK ([unit_id] >= 0),
  CHECK ([revision] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[GiaBanThanhPham] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [product_id] BIGINT NOT NULL,
  [unit_id] BIGINT NOT NULL,
  [revision] BIGINT NOT NULL,
  [unit_price] DECIMAL(20,6) NOT NULL,
  [effective_at] DATETIME2(3) NOT NULL,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK([unit_price]>=0),
  CHECK([revision]>0),
  CHECK ([id] > 0),
  CHECK ([product_id] >= 0),
  CHECK ([unit_id] >= 0),
  CHECK ([revision] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[Kho] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [name] NVARCHAR(255) NOT NULL,
  [type] NVARCHAR(40) NOT NULL,
  [capacity] DECIMAL(20,6) NOT NULL,
  [capacity_unit_id] BIGINT NOT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [updated_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK([capacity]>=0),
  CHECK ([id] > 0),
  CHECK ([type] IN ('MATERIAL','FINISHED','CONTROLLED')),
  CHECK ([capacity_unit_id] >= 0),
  CHECK ([status] IN ('ACTIVE','LOCKED')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[ViTriLuuKho] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [warehouse_id] BIGINT NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [name] NVARCHAR(255) NOT NULL,
  [area] NVARCHAR(255) NULL,
  [capacity] DECIMAL(20,6) NOT NULL,
  [capacity_unit_id] BIGINT NOT NULL,
  [storage_rule] NVARCHAR(1000) NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  [version] BIGINT NOT NULL DEFAULT 0,
  [lock_generation] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [updated_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK([capacity]>=0),
  CHECK ([id] > 0),
  CHECK ([warehouse_id] >= 0),
  CHECK ([capacity_unit_id] >= 0),
  CHECK ([status] IN ('ACTIVE','LOCKED')),
  CHECK ([version] >= 0),
  CHECK ([lock_generation] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[TaiKhoan_Kho] (
  [account_id] BIGINT NOT NULL,
  [warehouse_id] BIGINT NOT NULL,
  PRIMARY KEY([account_id],[warehouse_id]),
  CHECK ([account_id] >= 0),
  CHECK ([warehouse_id] >= 0)
);

CREATE TABLE dbo.[XuongSanXuat] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [name] NVARCHAR(255) NOT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([status] IN ('ACTIVE','LOCKED'))
);

CREATE TABLE dbo.[TaiKhoan_Xuong] (
  [account_id] BIGINT NOT NULL,
  [workshop_id] BIGINT NOT NULL,
  PRIMARY KEY([account_id],[workshop_id]),
  CHECK ([account_id] >= 0),
  CHECK ([workshop_id] >= 0)
);

CREATE TABLE dbo.[NhaCungCap] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [name] NVARCHAR(255) NOT NULL,
  [address] NVARCHAR(MAX) NULL,
  [phone] NVARCHAR(32) NULL,
  [email] NVARCHAR(255) NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([status] IN ('ACTIVE','LOCKED'))
);

CREATE TABLE dbo.[LoNguyenLieu] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [material_id] BIGINT NOT NULL,
  [manufactured_on] DATE NOT NULL,
  [expires_on] DATE NULL,
  [first_received_at] DATETIME2(3) NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [updated_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK([expires_on] IS NULL OR [expires_on]>=[manufactured_on]),
  CHECK ([id] > 0),
  CHECK ([material_id] >= 0),
  CHECK ([status] IN ('ACTIVE','LOCKED')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[LoThanhPham] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [product_id] BIGINT NOT NULL,
  [packaging_version_id] BIGINT NOT NULL,
  [manufactured_on] DATE NOT NULL,
  [expires_on] DATE NOT NULL,
  [first_received_at] DATETIME2(3) NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [updated_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK([expires_on]>=[manufactured_on]),
  CHECK ([id] > 0),
  CHECK ([product_id] >= 0),
  CHECK ([packaging_version_id] >= 0),
  CHECK ([status] IN ('ACTIVE','LOCKED')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[HeSoChiemCho] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [material_id] BIGINT NULL,
  [product_id] BIGINT NULL,
  [capacity_unit_id] BIGINT NOT NULL,
  [revision] BIGINT NOT NULL,
  [factor_per_base] DECIMAL(20,9) NOT NULL,
  [effective_at] DATETIME2(3) NOT NULL,
  [item_kind] AS (CASE WHEN [material_id] IS NULL THEN 'PRODUCT' ELSE 'MATERIAL' END) PERSISTED,
  [item_key] AS (COALESCE([material_id],[product_id])) PERSISTED,
  PRIMARY KEY ([id]),
  CHECK((([material_id] IS NULL AND [product_id] IS NOT NULL) OR ([material_id] IS NOT NULL AND [product_id] IS NULL))),
  CHECK([factor_per_base]>0),
  CHECK ([id] > 0),
  CHECK ([material_id] >= 0),
  CHECK ([product_id] >= 0),
  CHECK ([capacity_unit_id] >= 0),
  CHECK ([revision] >= 0)
);

CREATE TABLE dbo.[DinhMuc] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [product_id] BIGINT NOT NULL,
  [revision] BIGINT NOT NULL,
  [output_qty_base] DECIMAL(20,6) NOT NULL,
  [wastage_percent] DECIMAL(20,6) NOT NULL DEFAULT 0,
  [effective_from] DATE NOT NULL,
  [effective_to] DATE NULL,
  [created_by_id] BIGINT NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([output_qty_base]>0),
  CHECK([wastage_percent]=0),
  CHECK([effective_to] IS NULL OR [effective_to]>=[effective_from]),
  CHECK ([id] > 0),
  CHECK ([product_id] >= 0),
  CHECK ([revision] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[ChiTietDinhMuc] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [bom_id] BIGINT NOT NULL,
  [material_id] BIGINT NOT NULL,
  [unit_id] BIGINT NOT NULL,
  [qty_per_output] DECIMAL(20,6) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_per_output]>0),
  CHECK ([id] > 0),
  CHECK ([bom_id] >= 0),
  CHECK ([material_id] >= 0),
  CHECK ([unit_id] >= 0)
);

CREATE TABLE dbo.[LichNangLucXuong] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [workshop_id] BIGINT NOT NULL,
  [product_id] BIGINT NOT NULL,
  [business_date] DATE NOT NULL,
  [capacity_base] DECIMAL(20,6) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([capacity_base]>=0),
  CHECK ([id] > 0),
  CHECK ([workshop_id] >= 0),
  CHECK ([product_id] >= 0)
);

CREATE TABLE dbo.[DonHang] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [customer_id] BIGINT NOT NULL,
  [due_date] DATE NOT NULL,
  [delivery_address] NVARCHAR(1000) NOT NULL,
  [recipient] NVARCHAR(255) NOT NULL,
  [recipient_phone] NVARCHAR(32) NOT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'NHAP',
  [currency] CHAR(3) NOT NULL DEFAULT 'VND',
  [total_amount] DECIMAL(20,0) NULL,
  [rounding_revision] NVARCHAR(50) NULL,
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [updated_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK([currency]='VND'),
  CHECK([total_amount] IS NULL OR [total_amount]>=0),
  CHECK ([id] > 0),
  CHECK ([customer_id] >= 0),
  CHECK ([status] IN ('NHAP','XAC_NHAN','DANG_GIAO','DA_GIAO','HUY')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[ChiTietDonHang] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [order_id] BIGINT NOT NULL,
  [line_no] BIGINT NOT NULL,
  [product_id] BIGINT NOT NULL,
  [unit_id] BIGINT NOT NULL,
  [packaging_id] BIGINT NOT NULL,
  [qty_input] DECIMAL(20,6) NOT NULL,
  [factor_snapshot] DECIMAL(20,9) NOT NULL,
  [qty_base] DECIMAL(20,6) NOT NULL,
  [price_id] BIGINT NULL,
  [unit_price] DECIMAL(20,6) NULL,
  [amount] DECIMAL(20,0) NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_input]>0 AND [qty_base]>0 AND [factor_snapshot]>0),
  CHECK([unit_price] IS NULL OR [unit_price]>=0),
  CHECK([amount] IS NULL OR [amount]>=0),
  CHECK ([id] > 0),
  CHECK ([order_id] >= 0),
  CHECK ([line_no] >= 0),
  CHECK ([product_id] >= 0),
  CHECK ([unit_id] >= 0),
  CHECK ([packaging_id] >= 0),
  CHECK ([price_id] >= 0)
);

CREATE TABLE dbo.[KeHoachSanXuat] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [order_id] BIGINT NOT NULL,
  [start_date] DATE NOT NULL,
  [end_date] DATE NOT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'CHO_DUYET',
  [approver_id] BIGINT NULL,
  [decided_at] DATETIME2(3) NULL,
  [rejection_reason] NVARCHAR(1000) NULL,
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [updated_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK([start_date]<=[end_date]),
  CHECK ([id] > 0),
  CHECK ([order_id] >= 0),
  CHECK ([status] IN ('CHO_DUYET','DA_DUYET','TU_CHOI','DANG_THUC_HIEN','HOAN_THANH','HUY')),
  CHECK ([approver_id] >= 0),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[ChiTietKeHoachSanXuat] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [plan_id] BIGINT NOT NULL,
  [order_line_id] BIGINT NOT NULL,
  [product_id] BIGINT NOT NULL,
  [workshop_id] BIGINT NOT NULL,
  [bom_version_id] BIGINT NOT NULL,
  [qty_base] DECIMAL(20,6) NOT NULL,
  [start_date] DATE NOT NULL,
  [end_date] DATE NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_base]>0),
  CHECK([start_date]<=[end_date]),
  CHECK ([id] > 0),
  CHECK ([plan_id] >= 0),
  CHECK ([order_line_id] >= 0),
  CHECK ([product_id] >= 0),
  CHECK ([workshop_id] >= 0),
  CHECK ([bom_version_id] >= 0)
);

CREATE TABLE dbo.[PhanBoLichSanXuat] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [plan_line_id] BIGINT NOT NULL,
  [calendar_id] BIGINT NOT NULL,
  [qty_base] DECIMAL(20,6) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_base]>0),
  CHECK ([id] > 0),
  CHECK ([plan_line_id] >= 0),
  CHECK ([calendar_id] >= 0)
);

CREATE TABLE dbo.[NhuCauNguyenLieuKHSX] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [plan_line_id] BIGINT NOT NULL,
  [bom_line_id] BIGINT NOT NULL,
  [material_id] BIGINT NOT NULL,
  [unit_id] BIGINT NOT NULL,
  [qty_required] DECIMAL(20,6) NOT NULL,
  [snapshot_available] DECIMAL(20,6) NOT NULL DEFAULT 0,
  [shortage] DECIMAL(20,6) NOT NULL,
  [policy_revision] NVARCHAR(50) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_required]>=0 AND [snapshot_available]>=0 AND [shortage]>=0),
  CHECK ([id] > 0),
  CHECK ([plan_line_id] >= 0),
  CHECK ([bom_line_id] >= 0),
  CHECK ([material_id] >= 0),
  CHECK ([unit_id] >= 0)
);

CREATE TABLE dbo.[DonMuaNguyenLieu] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [plan_id] BIGINT NOT NULL,
  [supplier_id] BIGINT NOT NULL,
  [currency] CHAR(3) NOT NULL DEFAULT 'VND',
  [total_amount] DECIMAL(20,0) NULL,
  [rounding_revision] NVARCHAR(50) NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'NHAP',
  [approver_id] BIGINT NULL,
  [decided_at] DATETIME2(3) NULL,
  [rejection_reason] NVARCHAR(1000) NULL,
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [updated_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK([currency]='VND'),
  CHECK([total_amount] IS NULL OR [total_amount]>=0),
  CHECK ([id] > 0),
  CHECK ([plan_id] >= 0),
  CHECK ([supplier_id] >= 0),
  CHECK ([status] IN ('NHAP','CHO_DUYET','DA_DUYET','TU_CHOI','NHAN_MOT_PHAN','HOAN_THANH','HUY')),
  CHECK ([approver_id] >= 0),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[ChiTietDonMuaNguyenLieu] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [purchase_id] BIGINT NOT NULL,
  [material_id] BIGINT NOT NULL,
  [unit_id] BIGINT NOT NULL,
  [qty_base] DECIMAL(20,6) NOT NULL,
  [unit_price] DECIMAL(20,6) NOT NULL,
  [amount] DECIMAL(20,0) NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_base]>0 AND [unit_price]>=0),
  CHECK ([id] > 0),
  CHECK ([purchase_id] >= 0),
  CHECK ([material_id] >= 0),
  CHECK ([unit_id] >= 0)
);

CREATE TABLE dbo.[PhanBoMuaChoNhuCau] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [demand_id] BIGINT NOT NULL,
  [purchase_line_id] BIGINT NOT NULL,
  [qty_base] DECIMAL(20,6) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_base]>0),
  CHECK ([id] > 0),
  CHECK ([demand_id] >= 0),
  CHECK ([purchase_line_id] >= 0)
);

CREATE TABLE dbo.[PhieuXuatKhoNguyenLieu] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [plan_line_id] BIGINT NOT NULL,
  [workshop_id] BIGINT NOT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'NHAP',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [updated_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([plan_line_id] >= 0),
  CHECK ([workshop_id] >= 0),
  CHECK ([status] IN ('NHAP','DA_GUI','DANG_CAP','HOAN_THANH','HUY')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[ChiTietYeuCauXuatNL] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [request_id] BIGINT NOT NULL,
  [demand_id] BIGINT NOT NULL,
  [material_id] BIGINT NOT NULL,
  [unit_id] BIGINT NOT NULL,
  [qty_base] DECIMAL(20,6) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_base]>0),
  CHECK ([id] > 0),
  CHECK ([request_id] >= 0),
  CHECK ([demand_id] >= 0),
  CHECK ([material_id] >= 0),
  CHECK ([unit_id] >= 0)
);

CREATE TABLE dbo.[PhieuNhapKhoThanhPham] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [plan_line_id] BIGINT NOT NULL,
  [workshop_id] BIGINT NOT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'NHAP',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [updated_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([plan_line_id] >= 0),
  CHECK ([workshop_id] >= 0),
  CHECK ([status] IN ('NHAP','CHO_QC','QC_HOAN_TAT','DANG_NHAP','HOAN_THANH')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[ChiTietYeuCauNhapTP] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [request_id] BIGINT NOT NULL,
  [plan_line_id] BIGINT NOT NULL,
  [product_lot_id] BIGINT NOT NULL,
  [qty_completed] DECIMAL(20,6) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_completed]>0),
  CHECK ([id] > 0),
  CHECK ([request_id] >= 0),
  CHECK ([plan_line_id] >= 0),
  CHECK ([product_lot_id] >= 0)
);

CREATE TABLE dbo.[DotGiaoNguyenLieu] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [purchase_id] BIGINT NOT NULL,
  [warehouse_id] BIGINT NOT NULL,
  [received_at] DATETIME2(3) NOT NULL,
  [supplier_reference] NVARCHAR(200) NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'CHO_QC',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([purchase_id] >= 0),
  CHECK ([warehouse_id] >= 0),
  CHECK ([status] IN ('CHO_QC','QC_HOAN_TAT','NHAN_MOT_PHAN','HOAN_THANH')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[ChiTietGiaoNL] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [delivery_id] BIGINT NOT NULL,
  [purchase_line_id] BIGINT NOT NULL,
  [material_lot_id] BIGINT NOT NULL,
  [unit_id] BIGINT NOT NULL,
  [qty_received] DECIMAL(20,6) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_received]>0),
  CHECK ([id] > 0),
  CHECK ([delivery_id] >= 0),
  CHECK ([purchase_line_id] >= 0),
  CHECK ([material_lot_id] >= 0),
  CHECK ([unit_id] >= 0)
);

CREATE TABLE dbo.[PhieuXuatKho] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [kind] NVARCHAR(40) NOT NULL,
  [warehouse_id] BIGINT NOT NULL,
  [order_id] BIGINT NULL,
  [material_request_id] BIGINT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'NHAP',
  [version] BIGINT NOT NULL DEFAULT 0,
  [allocation_generation] BIGINT NOT NULL DEFAULT 0,
  [confirmed_at] DATETIME2(3) NULL,
  [expires_at] DATETIME2(3) NULL,
  [hard_expires_at] DATETIME2(3) NULL,
  [renew_count] BIGINT NOT NULL DEFAULT 0,
  [posted_at] DATETIME2(3) NULL,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK(([kind]='SALE' AND [order_id] IS NOT NULL AND [material_request_id] IS NULL) OR ([kind]='MATERIAL' AND [order_id] IS NULL AND [material_request_id] IS NOT NULL)),
  CHECK ([id] > 0),
  CHECK ([kind] IN ('SALE','MATERIAL')),
  CHECK ([warehouse_id] >= 0),
  CHECK ([order_id] >= 0),
  CHECK ([material_request_id] >= 0),
  CHECK ([status] IN ('NHAP','DA_PHAN_BO','DA_XAC_NHAN','HOAN_THANH','HUY','HET_HAN')),
  CHECK ([version] >= 0),
  CHECK ([allocation_generation] >= 0),
  CHECK ([renew_count] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[ChiTietPhieuXuat] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [issue_id] BIGINT NOT NULL,
  [generation] BIGINT NOT NULL,
  [order_line_id] BIGINT NULL,
  [material_request_line_id] BIGINT NULL,
  [material_lot_id] BIGINT NULL,
  [product_lot_id] BIGINT NULL,
  [location_id] BIGINT NOT NULL,
  [unit_id] BIGINT NOT NULL,
  [packaging_version_id] BIGINT NULL,
  [qty_input] DECIMAL(20,6) NOT NULL,
  [factor_snapshot] DECIMAL(20,9) NOT NULL,
  [qty_base] DECIMAL(20,6) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK((([order_line_id] IS NULL AND [material_request_line_id] IS NOT NULL) OR ([order_line_id] IS NOT NULL AND [material_request_line_id] IS NULL))),
  CHECK((([material_lot_id] IS NULL AND [product_lot_id] IS NOT NULL) OR ([material_lot_id] IS NOT NULL AND [product_lot_id] IS NULL))),
  CHECK([qty_input]>0 AND [qty_base]>0 AND [factor_snapshot]>0),
  CHECK ([id] > 0),
  CHECK ([issue_id] >= 0),
  CHECK ([generation] >= 0),
  CHECK ([order_line_id] >= 0),
  CHECK ([material_request_line_id] >= 0),
  CHECK ([material_lot_id] >= 0),
  CHECK ([product_lot_id] >= 0),
  CHECK ([location_id] >= 0),
  CHECK ([unit_id] >= 0),
  CHECK ([packaging_version_id] >= 0)
);

CREATE TABLE dbo.[DotGiaoHang] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [issue_id] BIGINT NOT NULL,
  [order_id] BIGINT NOT NULL,
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([issue_id] >= 0),
  CHECK ([order_id] >= 0),
  CHECK ([version] >= 0)
);

CREATE TABLE dbo.[ChiTietGiaoHang] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [delivery_id] BIGINT NOT NULL,
  [issue_line_id] BIGINT NOT NULL,
  [qty_dispatched] DECIMAL(20,6) NOT NULL,
  [qty_delivered] DECIMAL(20,6) NOT NULL DEFAULT 0,
  [last_delivered_at] DATETIME2(3) NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_dispatched]>0 AND [qty_delivered]>=0 AND [qty_delivered]<=[qty_dispatched]),
  CHECK ([id] > 0),
  CHECK ([delivery_id] >= 0),
  CHECK ([issue_line_id] >= 0)
);

CREATE TABLE dbo.[YeuCauTraHang] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [order_id] BIGINT NOT NULL,
  [customer_id] BIGINT NOT NULL,
  [reason] NVARCHAR(1000) NOT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'DA_GUI',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([order_id] >= 0),
  CHECK ([customer_id] >= 0),
  CHECK ([status] IN ('DA_GUI','TIEP_NHAN_MOT_PHAN','DA_TIEP_NHAN','HOAN_THANH','HUY')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[ChiTietTraHang] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [request_id] BIGINT NOT NULL,
  [delivery_line_id] BIGINT NOT NULL,
  [issue_line_id] BIGINT NOT NULL,
  [product_lot_id] BIGINT NOT NULL,
  [qty_base] DECIMAL(20,6) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_base]>0),
  CHECK ([id] > 0),
  CHECK ([request_id] >= 0),
  CHECK ([delivery_line_id] >= 0),
  CHECK ([issue_line_id] >= 0),
  CHECK ([product_lot_id] >= 0)
);

CREATE TABLE dbo.[TiepNhanTra] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [request_id] BIGINT NOT NULL,
  [warehouse_id] BIGINT NOT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'CHO_QC',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([request_id] >= 0),
  CHECK ([warehouse_id] >= 0),
  CHECK ([status] IN ('CHO_QC','QC_HOAN_TAT','HOAN_THANH')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[ChiTietTiepNhanTra] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [reception_id] BIGINT NOT NULL,
  [return_line_id] BIGINT NOT NULL,
  [product_lot_id] BIGINT NOT NULL,
  [location_id] BIGINT NOT NULL,
  [unit_id] BIGINT NOT NULL,
  [qty_base] DECIMAL(20,6) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_base]>0),
  CHECK ([id] > 0),
  CHECK ([reception_id] >= 0),
  CHECK ([return_line_id] >= 0),
  CHECK ([product_lot_id] >= 0),
  CHECK ([location_id] >= 0),
  CHECK ([unit_id] >= 0)
);

CREATE TABLE dbo.[BienBanQCNguyenLieu] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [source_id] BIGINT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'NHAP',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [confirmed_at] DATETIME2(3) NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [rework_batch_id] BIGINT NULL,
  PRIMARY KEY ([id]),
  CHECK((([source_id] IS NULL AND [rework_batch_id] IS NOT NULL) OR ([source_id] IS NOT NULL AND [rework_batch_id] IS NULL))),
  CHECK ([id] > 0),
  CHECK ([source_id] >= 0),
  CHECK ([status] IN ('NHAP','DA_XAC_NHAN')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0),
  CHECK ([rework_batch_id] >= 0)
);

CREATE TABLE dbo.[ChiTietQCNguyenLieu] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [qc_id] BIGINT NOT NULL,
  [source_line_id] BIGINT NULL,
  [material_lot_id] BIGINT NOT NULL,
  [batch_sequence] BIGINT NOT NULL,
  [qty_inspected] DECIMAL(20,6) NOT NULL,
  [qty_accepted] DECIMAL(20,6) NOT NULL,
  [qty_rejected] DECIMAL(20,6) NOT NULL,
  [rejection_reason] NVARCHAR(1000) NULL,
  [condition_note] NVARCHAR(1000) NULL,
  [rework_batch_id] BIGINT NULL,
  PRIMARY KEY ([id]),
  CHECK([batch_sequence]>0 AND [qty_inspected]>0 AND [qty_accepted]>=0 AND [qty_rejected]>=0 AND [qty_inspected]=[qty_accepted]+[qty_rejected]),
  CHECK((([source_line_id] IS NULL AND [rework_batch_id] IS NOT NULL) OR ([source_line_id] IS NOT NULL AND [rework_batch_id] IS NULL))),
  CHECK ([id] > 0),
  CHECK ([qc_id] >= 0),
  CHECK ([source_line_id] >= 0),
  CHECK ([material_lot_id] >= 0),
  CHECK ([batch_sequence] >= 0),
  CHECK ([rework_batch_id] >= 0)
);

CREATE TABLE dbo.[BienBanQCThanhPham] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [source_id] BIGINT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'NHAP',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [confirmed_at] DATETIME2(3) NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [rework_batch_id] BIGINT NULL,
  PRIMARY KEY ([id]),
  CHECK((([source_id] IS NULL AND [rework_batch_id] IS NOT NULL) OR ([source_id] IS NOT NULL AND [rework_batch_id] IS NULL))),
  CHECK ([id] > 0),
  CHECK ([source_id] >= 0),
  CHECK ([status] IN ('NHAP','DA_XAC_NHAN')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0),
  CHECK ([rework_batch_id] >= 0)
);

CREATE TABLE dbo.[ChiTietQCThanhPham] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [qc_id] BIGINT NOT NULL,
  [source_line_id] BIGINT NULL,
  [product_lot_id] BIGINT NOT NULL,
  [batch_sequence] BIGINT NOT NULL,
  [qty_inspected] DECIMAL(20,6) NOT NULL,
  [qty_accepted] DECIMAL(20,6) NOT NULL,
  [qty_rejected] DECIMAL(20,6) NOT NULL,
  [rejection_reason] NVARCHAR(1000) NULL,
  [condition_note] NVARCHAR(1000) NULL,
  [rework_batch_id] BIGINT NULL,
  PRIMARY KEY ([id]),
  CHECK([batch_sequence]>0 AND [qty_inspected]>0 AND [qty_accepted]>=0 AND [qty_rejected]>=0 AND [qty_inspected]=[qty_accepted]+[qty_rejected]),
  CHECK((([source_line_id] IS NULL AND [rework_batch_id] IS NOT NULL) OR ([source_line_id] IS NOT NULL AND [rework_batch_id] IS NULL))),
  CHECK ([id] > 0),
  CHECK ([qc_id] >= 0),
  CHECK ([source_line_id] >= 0),
  CHECK ([product_lot_id] >= 0),
  CHECK ([batch_sequence] >= 0),
  CHECK ([rework_batch_id] >= 0)
);

CREATE TABLE dbo.[KetQuaKiemTraHangTra] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [source_id] BIGINT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'NHAP',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [confirmed_at] DATETIME2(3) NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [rework_batch_id] BIGINT NULL,
  PRIMARY KEY ([id]),
  CHECK((([source_id] IS NULL AND [rework_batch_id] IS NOT NULL) OR ([source_id] IS NOT NULL AND [rework_batch_id] IS NULL))),
  CHECK ([id] > 0),
  CHECK ([source_id] >= 0),
  CHECK ([status] IN ('NHAP','DA_XAC_NHAN')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0),
  CHECK ([rework_batch_id] >= 0)
);

CREATE TABLE dbo.[ChiTietQCHangTra] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [qc_id] BIGINT NOT NULL,
  [source_line_id] BIGINT NULL,
  [product_lot_id] BIGINT NOT NULL,
  [batch_sequence] BIGINT NOT NULL,
  [qty_inspected] DECIMAL(20,6) NOT NULL,
  [qty_accepted] DECIMAL(20,6) NOT NULL,
  [qty_rejected] DECIMAL(20,6) NOT NULL,
  [rejection_reason] NVARCHAR(1000) NULL,
  [condition_note] NVARCHAR(1000) NULL,
  [rework_batch_id] BIGINT NULL,
  PRIMARY KEY ([id]),
  CHECK([batch_sequence]>0 AND [qty_inspected]>0 AND [qty_accepted]>=0 AND [qty_rejected]>=0 AND [qty_inspected]=[qty_accepted]+[qty_rejected]),
  CHECK((([source_line_id] IS NULL AND [rework_batch_id] IS NOT NULL) OR ([source_line_id] IS NOT NULL AND [rework_batch_id] IS NULL))),
  CHECK ([id] > 0),
  CHECK ([qc_id] >= 0),
  CHECK ([source_line_id] >= 0),
  CHECK ([product_lot_id] >= 0),
  CHECK ([batch_sequence] >= 0),
  CHECK ([rework_batch_id] >= 0)
);

CREATE TABLE dbo.[PhieuNhapKho] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [kind] NVARCHAR(40) NOT NULL,
  [warehouse_id] BIGINT NOT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'NHAP',
  [version] BIGINT NOT NULL DEFAULT 0,
  [allocation_generation] BIGINT NOT NULL DEFAULT 0,
  [confirmed_at] DATETIME2(3) NULL,
  [posted_at] DATETIME2(3) NULL,
  [capacity_snapshot] NVARCHAR(MAX) NULL,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [source_qc_type] NVARCHAR(40) NULL,
  PRIMARY KEY ([id]),
  CHECK(([kind]='REJECTED' AND [source_qc_type] IS NOT NULL) OR ([kind]<>'REJECTED' AND [source_qc_type] IS NULL)),
  CHECK ([id] > 0),
  CHECK ([kind] IN ('MATERIAL','FINISHED','RETURN','REJECTED')),
  CHECK ([warehouse_id] >= 0),
  CHECK ([status] IN ('NHAP','DA_PHAN_BO','DA_XAC_NHAN','HOAN_THANH','HUY')),
  CHECK ([version] >= 0),
  CHECK ([allocation_generation] >= 0),
  CHECK ([capacity_snapshot] IS NULL OR ISJSON([capacity_snapshot])=1),
  CHECK ([created_by_id] >= 0),
  CHECK ([source_qc_type] IN ('MATERIAL','PRODUCT','RETURN'))
);

CREATE TABLE dbo.[ChiTietPhieuNhap] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [receipt_id] BIGINT NOT NULL,
  [generation] BIGINT NOT NULL,
  [material_qc_line_id] BIGINT NULL,
  [product_qc_line_id] BIGINT NULL,
  [return_qc_line_id] BIGINT NULL,
  [material_lot_id] BIGINT NULL,
  [product_lot_id] BIGINT NULL,
  [location_id] BIGINT NOT NULL,
  [unit_id] BIGINT NOT NULL,
  [packaging_version_id] BIGINT NULL,
  [qty_input] DECIMAL(20,6) NOT NULL,
  [factor_snapshot] DECIMAL(20,9) NOT NULL,
  [qty_base] DECIMAL(20,6) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK((CASE WHEN [material_qc_line_id] IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN [product_qc_line_id] IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN [return_qc_line_id] IS NOT NULL THEN 1 ELSE 0 END)=1),
  CHECK((([material_lot_id] IS NULL AND [product_lot_id] IS NOT NULL) OR ([material_lot_id] IS NOT NULL AND [product_lot_id] IS NULL))),
  CHECK([qty_input]>0 AND [qty_base]>0 AND [factor_snapshot]>0),
  CHECK ([id] > 0),
  CHECK ([receipt_id] >= 0),
  CHECK ([generation] >= 0),
  CHECK ([material_qc_line_id] >= 0),
  CHECK ([product_qc_line_id] >= 0),
  CHECK ([return_qc_line_id] >= 0),
  CHECK ([material_lot_id] >= 0),
  CHECK ([product_lot_id] >= 0),
  CHECK ([location_id] >= 0),
  CHECK ([unit_id] >= 0),
  CHECK ([packaging_version_id] >= 0)
);

CREATE TABLE dbo.[TonKho] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [location_id] BIGINT NOT NULL,
  [material_lot_id] BIGINT NULL,
  [product_lot_id] BIGINT NULL,
  [lot_kind] AS (CASE WHEN [material_lot_id] IS NULL THEN 'P' ELSE 'M' END) PERSISTED,
  [lot_key] AS (COALESCE([material_lot_id],[product_lot_id])) PERSISTED,
  [quality_bucket] NVARCHAR(40) NOT NULL,
  [qty_on_hand] DECIMAL(20,6) NOT NULL DEFAULT 0,
  [qty_reserved] DECIMAL(20,6) NOT NULL DEFAULT 0,
  [capacity_factor_id] BIGINT NOT NULL,
  [capacity_factor_snapshot] DECIMAL(20,9) NOT NULL,
  [version] BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY ([id]),
  CHECK((([material_lot_id] IS NULL AND [product_lot_id] IS NOT NULL) OR ([material_lot_id] IS NOT NULL AND [product_lot_id] IS NULL))),
  CHECK([qty_on_hand]>=0 AND [qty_reserved]>=0 AND [qty_reserved]<=[qty_on_hand]),
  CHECK([capacity_factor_snapshot]>0),
  CHECK ([id] > 0),
  CHECK ([location_id] >= 0),
  CHECK ([material_lot_id] >= 0),
  CHECK ([product_lot_id] >= 0),
  CHECK ([quality_bucket] IN ('DAT','QUARANTINE','FAILED','EXPIRED')),
  CHECK ([capacity_factor_id] >= 0),
  CHECK ([version] >= 0)
);

CREATE TABLE dbo.[DatGiuTon] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [issue_id] BIGINT NOT NULL,
  [issue_line_id] BIGINT NOT NULL,
  [balance_id] BIGINT NOT NULL,
  [demand_id] BIGINT NULL,
  [qty_initial] DECIMAL(20,6) NOT NULL,
  [qty_consumed] DECIMAL(20,6) NOT NULL DEFAULT 0,
  [qty_released] DECIMAL(20,6) NOT NULL DEFAULT 0,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  [expires_at] DATETIME2(3) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_initial]>0 AND [qty_consumed]>=0 AND [qty_released]>=0 AND [qty_consumed]+[qty_released]<=[qty_initial]),
  CHECK ([id] > 0),
  CHECK ([issue_id] >= 0),
  CHECK ([issue_line_id] >= 0),
  CHECK ([balance_id] >= 0),
  CHECK ([demand_id] >= 0),
  CHECK ([status] IN ('ACTIVE','CONSUMED','RELEASED','EXPIRED'))
);

CREATE TABLE dbo.[BienBanKiemKe] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [code] NVARCHAR(50) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [warehouse_id] BIGINT NOT NULL,
  [mode] NVARCHAR(40) NOT NULL DEFAULT 'FROZEN_SCOPE',
  [status] NVARCHAR(40) NOT NULL DEFAULT 'NHAP',
  [scope_generation] BIGINT NOT NULL DEFAULT 0,
  [version] BIGINT NOT NULL DEFAULT 0,
  [planned_cutoff] DATETIME2(3) NULL,
  [cutoff_at] DATETIME2(3) NULL,
  [hard_expires_at] DATETIME2(3) NULL,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([warehouse_id] >= 0),
  CHECK ([mode] IN ('FROZEN_SCOPE')),
  CHECK ([status] IN ('NHAP','DANG_DEM','CHO_XAC_NHAN','DA_XAC_NHAN','HOAN_THANH','HUY','HET_HAN')),
  CHECK ([scope_generation] >= 0),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[KhoaViTriKiemKe] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [location_id] BIGINT NOT NULL,
  [stocktake_id] BIGINT NOT NULL,
  [scope_generation] BIGINT NOT NULL,
  [expires_at] DATETIME2(3) NOT NULL,
  [hard_expires_at] DATETIME2(3) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([expires_at]<=[hard_expires_at]),
  CHECK ([id] > 0),
  CHECK ([location_id] >= 0),
  CHECK ([stocktake_id] >= 0),
  CHECK ([scope_generation] >= 0)
);

CREATE TABLE dbo.[StockPosting] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [receipt_id] BIGINT NULL,
  [issue_id] BIGINT NULL,
  [return_reception_id] BIGINT NULL,
  [stocktake_id] BIGINT NULL,
  [adjustment_id] BIGINT NULL,
  [disposition_id] BIGINT NULL,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK((CASE WHEN [receipt_id] IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN [issue_id] IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN [return_reception_id] IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN [stocktake_id] IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN [adjustment_id] IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN [disposition_id] IS NOT NULL THEN 1 ELSE 0 END)=1),
  CHECK ([id] > 0),
  CHECK ([receipt_id] >= 0),
  CHECK ([issue_id] >= 0),
  CHECK ([return_reception_id] >= 0),
  CHECK ([stocktake_id] >= 0),
  CHECK ([adjustment_id] >= 0),
  CHECK ([disposition_id] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[LichSuBienDongTon] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [posting_id] BIGINT NOT NULL,
  [balance_id] BIGINT NOT NULL,
  [quantity_delta] DECIMAL(20,6) NOT NULL,
  [qty_before] DECIMAL(20,6) NOT NULL,
  [qty_after] DECIMAL(20,6) NOT NULL,
  [receipt_line_id] BIGINT NULL,
  [issue_line_id] BIGINT NULL,
  [return_reception_line_id] BIGINT NULL,
  [reason] NVARCHAR(1000) NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK([quantity_delta]<>0 AND [qty_before]>=0 AND [qty_after]>=0 AND [qty_after]=[qty_before]+[quantity_delta]),
  CHECK ([id] > 0),
  CHECK ([posting_id] >= 0),
  CHECK ([balance_id] >= 0),
  CHECK ([receipt_line_id] >= 0),
  CHECK ([issue_line_id] >= 0),
  CHECK ([return_reception_line_id] >= 0)
);

CREATE TABLE dbo.[PhamViKiemKe] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [stocktake_id] BIGINT NOT NULL,
  [location_id] BIGINT NOT NULL,
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([stocktake_id] >= 0),
  CHECK ([location_id] >= 0)
);

CREATE TABLE dbo.[ThanhVienKiemKe] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [stocktake_id] BIGINT NOT NULL,
  [account_id] BIGINT NOT NULL,
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([stocktake_id] >= 0),
  CHECK ([account_id] >= 0)
);

CREATE TABLE dbo.[SnapshotKiemKe] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [stocktake_id] BIGINT NOT NULL,
  [scope_generation] BIGINT NOT NULL,
  [balance_id] BIGINT NOT NULL,
  [location_id] BIGINT NOT NULL,
  [qty_system] DECIMAL(20,6) NOT NULL,
  [qty_reserved] DECIMAL(20,6) NOT NULL,
  [material_lot_id] BIGINT NULL,
  [product_lot_id] BIGINT NULL,
  [quality_bucket] NVARCHAR(40) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_system]>=0 AND [qty_reserved]>=0 AND [qty_reserved]<=[qty_system]),
  CHECK ([id] > 0),
  CHECK ([stocktake_id] >= 0),
  CHECK ([scope_generation] >= 0),
  CHECK ([balance_id] >= 0),
  CHECK ([location_id] >= 0),
  CHECK ([material_lot_id] >= 0),
  CHECK ([product_lot_id] >= 0),
  CHECK ([quality_bucket] IN ('DAT','QUARANTINE','FAILED','EXPIRED'))
);

CREATE TABLE dbo.[LanDemKiemKe] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [stocktake_id] BIGINT NOT NULL,
  [scope_generation] BIGINT NOT NULL,
  [sequence] BIGINT NOT NULL,
  [counter_id] BIGINT NOT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'NHAP',
  [version] BIGINT NOT NULL DEFAULT 0,
  [empty_location_ids] NVARCHAR(MAX) NOT NULL,
  [submitted_at] DATETIME2(3) NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK([sequence]>0),
  CHECK ([id] > 0),
  CHECK ([stocktake_id] >= 0),
  CHECK ([scope_generation] >= 0),
  CHECK ([sequence] >= 0),
  CHECK ([counter_id] >= 0),
  CHECK ([status] IN ('NHAP','DA_NOP')),
  CHECK ([version] >= 0),
  CHECK ([empty_location_ids] IS NULL OR ISJSON([empty_location_ids])=1)
);

CREATE TABLE dbo.[ChiTietLanDem] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [count_id] BIGINT NOT NULL,
  [location_id] BIGINT NOT NULL,
  [material_lot_id] BIGINT NULL,
  [product_lot_id] BIGINT NULL,
  [reported_lot_code] NVARCHAR(100) NULL,
  [quality_bucket] NVARCHAR(40) NOT NULL,
  [qty_counted] DECIMAL(20,6) NOT NULL,
  [condition_note] NVARCHAR(1000) NOT NULL,
  [breakdown] NVARCHAR(MAX) NOT NULL,
  [factors_snapshot] NVARCHAR(MAX) NOT NULL,
  [evidence_ids] NVARCHAR(MAX) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_counted]>=0),
  CHECK((CASE WHEN [material_lot_id] IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN [product_lot_id] IS NOT NULL THEN 1 ELSE 0 END)<=1),
  CHECK ([id] > 0),
  CHECK ([count_id] >= 0),
  CHECK ([location_id] >= 0),
  CHECK ([material_lot_id] >= 0),
  CHECK ([product_lot_id] >= 0),
  CHECK ([quality_bucket] IN ('DAT','QUARANTINE','FAILED','EXPIRED','UNKNOWN')),
  CHECK ([breakdown] IS NULL OR ISJSON([breakdown])=1),
  CHECK ([factors_snapshot] IS NULL OR ISJSON([factors_snapshot])=1),
  CHECK ([evidence_ids] IS NULL OR ISJSON([evidence_ids])=1)
);

CREATE TABLE dbo.[ChiTietKiemKe] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [stocktake_id] BIGINT NOT NULL,
  [scope_generation] BIGINT NOT NULL,
  [snapshot_id] BIGINT NULL,
  [balance_id] BIGINT NULL,
  [accepted_count_id] BIGINT NOT NULL,
  [location_id] BIGINT NOT NULL,
  [material_lot_id] BIGINT NULL,
  [product_lot_id] BIGINT NULL,
  [quality_bucket] NVARCHAR(40) NOT NULL,
  [qty_system] DECIMAL(20,6) NOT NULL,
  [qty_counted] DECIMAL(20,6) NOT NULL,
  [delta] DECIMAL(20,6) NOT NULL,
  [version] BIGINT NOT NULL DEFAULT 0,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'CHO_XAC_MINH',
  PRIMARY KEY ([id]),
  CHECK([qty_system]>=0 AND [qty_counted]>=0 AND [delta]=[qty_counted]-[qty_system]),
  CHECK ([id] > 0),
  CHECK ([stocktake_id] >= 0),
  CHECK ([scope_generation] >= 0),
  CHECK ([snapshot_id] >= 0),
  CHECK ([balance_id] >= 0),
  CHECK ([accepted_count_id] >= 0),
  CHECK ([location_id] >= 0),
  CHECK ([material_lot_id] >= 0),
  CHECK ([product_lot_id] >= 0),
  CHECK ([quality_bucket] IN ('DAT','QUARANTINE','FAILED','EXPIRED','UNKNOWN')),
  CHECK ([version] >= 0),
  CHECK ([status] IN ('CHO_XAC_MINH','DA_XAC_MINH','CHO_DUYET','DA_DIEU_CHINH','KHONG_DIEU_CHINH','VO_HIEU'))
);

CREATE TABLE dbo.[XuLyChenhLech] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [stocktake_line_id] BIGINT NOT NULL,
  [verifier_id] BIGINT NOT NULL,
  [reason] NVARCHAR(1000) NOT NULL,
  [accepted_count_round] BIGINT NOT NULL,
  [evidence_ids] NVARCHAR(MAX) NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK ([id] > 0),
  CHECK ([stocktake_line_id] >= 0),
  CHECK ([verifier_id] >= 0),
  CHECK ([accepted_count_round] >= 0),
  CHECK ([evidence_ids] IS NULL OR ISJSON([evidence_ids])=1)
);

CREATE TABLE dbo.[DeNghiDieuChinhTon] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [stocktake_line_id] BIGINT NOT NULL,
  [verification_id] BIGINT NOT NULL,
  [stocktake_id] BIGINT NOT NULL,
  [scope_generation] BIGINT NOT NULL,
  [qty_signed] DECIMAL(20,6) NOT NULL,
  [proposer_id] BIGINT NOT NULL,
  [approver_id] BIGINT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'CHO_DUYET',
  [reason] NVARCHAR(1000) NULL,
  [version] BIGINT NOT NULL DEFAULT 0,
  [decided_at] DATETIME2(3) NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_signed]<>0),
  CHECK ([id] > 0),
  CHECK ([stocktake_line_id] >= 0),
  CHECK ([verification_id] >= 0),
  CHECK ([stocktake_id] >= 0),
  CHECK ([scope_generation] >= 0),
  CHECK ([proposer_id] >= 0),
  CHECK ([approver_id] >= 0),
  CHECK ([status] IN ('CHO_DUYET','DA_DUYET','TU_CHOI','VO_HIEU')),
  CHECK ([version] >= 0)
);

CREATE TABLE dbo.[BangChung] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [stocktake_id] BIGINT NULL,
  [issue_id] BIGINT NULL,
  [warehouse_id] BIGINT NOT NULL,
  [storage_key] NVARCHAR(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [checksum] CHAR(64) COLLATE Latin1_General_100_BIN2 NOT NULL,
  [media_type] NVARCHAR(100) NOT NULL,
  [byte_size] BIGINT NOT NULL,
  [original_name] NVARCHAR(255) NOT NULL,
  [uploader_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK((CASE WHEN [stocktake_id] IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN [issue_id] IS NOT NULL THEN 1 ELSE 0 END)=1),
  CHECK([byte_size]>0),
  CHECK ([id] > 0),
  CHECK ([stocktake_id] >= 0),
  CHECK ([issue_id] >= 0),
  CHECK ([warehouse_id] >= 0),
  CHECK ([byte_size] >= 0),
  CHECK ([uploader_id] >= 0)
);

CREATE TABLE dbo.[TiepNhanChuaDinhDanh] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [warehouse_id] BIGINT NOT NULL,
  [location_id] BIGINT NOT NULL,
  [reported_lot_code] NVARCHAR(100) NOT NULL,
  [material_id] BIGINT NULL,
  [product_id] BIGINT NULL,
  [quantity] DECIMAL(20,6) NOT NULL,
  [unit_id] BIGINT NOT NULL,
  [occupied_capacity] DECIMAL(35,15) NOT NULL,
  [reason] NVARCHAR(1000) NOT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'CACH_LY',
  [version] BIGINT NOT NULL DEFAULT 0,
  [resolved_return_reception_line_id] BIGINT NULL,
  [created_by_id] BIGINT NOT NULL,
  [resolved_by_id] BIGINT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  [resolved_at] DATETIME2(3) NULL,
  PRIMARY KEY ([id]),
  CHECK([quantity]>0 AND [occupied_capacity]>0),
  CHECK((CASE WHEN [material_id] IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN [product_id] IS NOT NULL THEN 1 ELSE 0 END)<=1),
  CHECK ([id] > 0),
  CHECK ([warehouse_id] >= 0),
  CHECK ([location_id] >= 0),
  CHECK ([material_id] >= 0),
  CHECK ([product_id] >= 0),
  CHECK ([unit_id] >= 0),
  CHECK ([status] IN ('CACH_LY','DA_DINH_DANH')),
  CHECK ([version] >= 0),
  CHECK ([resolved_return_reception_line_id] >= 0),
  CHECK ([created_by_id] >= 0),
  CHECK ([resolved_by_id] >= 0)
);

CREATE TABLE dbo.[XuLyHangLoiTraVe] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [source_qc_type] NVARCHAR(40) NOT NULL,
  [material_qc_line_id] BIGINT NULL,
  [product_qc_line_id] BIGINT NULL,
  [return_qc_line_id] BIGINT NULL,
  [method] NVARCHAR(40) NOT NULL,
  [qty_base] DECIMAL(20,6) NOT NULL,
  [reason] NVARCHAR(1000) NOT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'NHAP',
  [version] BIGINT NOT NULL DEFAULT 0,
  [proposed_by_id] BIGINT NOT NULL,
  [approved_by_id] BIGINT NULL,
  [decided_at] DATETIME2(3) NULL,
  [executed_at] DATETIME2(3) NULL,
  [balance_id] BIGINT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_base]>0),
  CHECK((CASE WHEN [material_qc_line_id] IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN [product_qc_line_id] IS NOT NULL THEN 1 ELSE 0 END)+(CASE WHEN [return_qc_line_id] IS NOT NULL THEN 1 ELSE 0 END)=1),
  CHECK ([id] > 0),
  CHECK ([source_qc_type] IN ('MATERIAL','PRODUCT','RETURN')),
  CHECK ([material_qc_line_id] >= 0),
  CHECK ([product_qc_line_id] >= 0),
  CHECK ([return_qc_line_id] >= 0),
  CHECK ([method] IN ('REWORK','SUPPLIER_RETURN','DISPOSAL')),
  CHECK ([status] IN ('NHAP','CHO_DUYET','DA_DUYET','TU_CHOI','DA_THUC_HIEN')),
  CHECK ([version] >= 0),
  CHECK ([proposed_by_id] >= 0),
  CHECK ([approved_by_id] >= 0),
  CHECK ([balance_id] >= 0)
);

CREATE TABLE dbo.[CauHinhNghiepVu] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [warehouse_id] BIGINT NOT NULL,
  [material_id] BIGINT NULL,
  [product_id] BIGINT NULL,
  [item_kind] AS (CASE WHEN [material_id] IS NULL THEN 'P' ELSE 'M' END) PERSISTED,
  [item_key] AS (COALESCE([material_id],[product_id])) PERSISTED,
  [revision] BIGINT NOT NULL,
  [low_stock_base] DECIMAL(20,6) NOT NULL,
  [near_expiry_days] BIGINT NOT NULL,
  [slow_moving_days] BIGINT NOT NULL,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK((([material_id] IS NULL AND [product_id] IS NOT NULL) OR ([material_id] IS NOT NULL AND [product_id] IS NULL))),
  CHECK([low_stock_base]>=0 AND [slow_moving_days]>0),
  CHECK ([id] > 0),
  CHECK ([warehouse_id] >= 0),
  CHECK ([material_id] >= 0),
  CHECK ([product_id] >= 0),
  CHECK ([revision] >= 0),
  CHECK ([near_expiry_days] >= 0),
  CHECK ([slow_moving_days] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[DotTaiXuLy] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [disposition_id] BIGINT NOT NULL,
  [source_qc_type] NVARCHAR(40) NOT NULL,
  [warehouse_id] BIGINT NOT NULL,
  [location_id] BIGINT NOT NULL,
  [material_lot_id] BIGINT NULL,
  [product_lot_id] BIGINT NULL,
  [qty_processed] DECIMAL(20,6) NOT NULL,
  [status] NVARCHAR(40) NOT NULL DEFAULT 'CHO_QC',
  [version] BIGINT NOT NULL DEFAULT 0,
  [created_by_id] BIGINT NOT NULL,
  [created_at] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY ([id]),
  CHECK((([material_lot_id] IS NULL AND [product_lot_id] IS NOT NULL) OR ([material_lot_id] IS NOT NULL AND [product_lot_id] IS NULL))),
  CHECK([qty_processed]>0),
  CHECK ([id] > 0),
  CHECK ([disposition_id] >= 0),
  CHECK ([source_qc_type] IN ('MATERIAL','PRODUCT','RETURN')),
  CHECK ([warehouse_id] >= 0),
  CHECK ([location_id] >= 0),
  CHECK ([material_lot_id] >= 0),
  CHECK ([product_lot_id] >= 0),
  CHECK ([status] IN ('CHO_QC','QC_HOAN_TAT')),
  CHECK ([version] >= 0),
  CHECK ([created_by_id] >= 0)
);

CREATE TABLE dbo.[PhanBoTonDuKien] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [demand_id] BIGINT NOT NULL,
  [warehouse_id] BIGINT NOT NULL,
  [qty_assigned] DECIMAL(20,6) NOT NULL,
  PRIMARY KEY ([id]),
  CHECK([qty_assigned]>=0),
  CHECK ([id] > 0),
  CHECK ([demand_id] >= 0),
  CHECK ([warehouse_id] >= 0)
);

CREATE UNIQUE INDEX [KhachHang_code_key] ON dbo.[KhachHang] ([code]);

CREATE INDEX [KhachHang_email_idx] ON dbo.[KhachHang] ([email]);

CREATE INDEX [KhachHang_phone_idx] ON dbo.[KhachHang] ([phone]);

CREATE UNIQUE INDEX [VaiTroQuyen_code_key] ON dbo.[VaiTroQuyen] ([code]);

CREATE UNIQUE INDEX [Quyen_code_key] ON dbo.[Quyen] ([code]);

CREATE INDEX [VaiTro_Quyen_permission_id_idx] ON dbo.[VaiTro_Quyen] ([permission_id]);

CREATE UNIQUE INDEX [TaiKhoan_code_key] ON dbo.[TaiKhoan] ([code]);

CREATE UNIQUE INDEX [TaiKhoan_login_key] ON dbo.[TaiKhoan] ([login]);

CREATE INDEX [TaiKhoan_role_id_idx] ON dbo.[TaiKhoan] ([role_id]);

CREATE INDEX [TaiKhoan_customer_id_idx] ON dbo.[TaiKhoan] ([customer_id]);

CREATE UNIQUE INDEX [PhienDangNhap_token_hash_key] ON dbo.[PhienDangNhap] ([token_hash]);

CREATE INDEX [PhienDangNhap_account_id_idle_expires_at_absolute_expires_at_idx] ON dbo.[PhienDangNhap] ([account_id],[idle_expires_at],[absolute_expires_at]);

CREATE INDEX [AuditLog_target_type_target_id_created_at_idx] ON dbo.[AuditLog] ([target_type],[target_id],[created_at]);

CREATE UNIQUE INDEX [IdempotencyRequest_account_id_operation_key_key] ON dbo.[IdempotencyRequest] ([account_id],[operation],[key]);

CREATE UNIQUE INDEX [IX_DonViTinh_1] ON dbo.[DonViTinh] ([code]);

CREATE UNIQUE INDEX [IX_NguyenLieu_2] ON dbo.[NguyenLieu] ([code]);

CREATE UNIQUE INDEX [IX_ThanhPham_3] ON dbo.[ThanhPham] ([code]);

CREATE UNIQUE INDEX [IX_QuyCachDongGoi_4] ON dbo.[QuyCachDongGoi] ([product_id],[unit_id],[revision]);

CREATE UNIQUE INDEX [IX_QuyCachDongGoi_5] ON dbo.[QuyCachDongGoi] ([id],[product_id]);

CREATE UNIQUE INDEX [IX_GiaBanThanhPham_6] ON dbo.[GiaBanThanhPham] ([product_id],[unit_id],[revision]);

CREATE INDEX [IX_GiaBanThanhPham_7] ON dbo.[GiaBanThanhPham] ([product_id],[unit_id],[effective_at]);

CREATE UNIQUE INDEX [IX_Kho_8] ON dbo.[Kho] ([code]);

CREATE UNIQUE INDEX [IX_ViTriLuuKho_9] ON dbo.[ViTriLuuKho] ([warehouse_id],[code]);

CREATE UNIQUE INDEX [IX_ViTriLuuKho_10] ON dbo.[ViTriLuuKho] ([id],[warehouse_id]);

CREATE UNIQUE INDEX [IX_XuongSanXuat_11] ON dbo.[XuongSanXuat] ([code]);

CREATE UNIQUE INDEX [IX_NhaCungCap_12] ON dbo.[NhaCungCap] ([code]);

CREATE UNIQUE INDEX [IX_LoNguyenLieu_13] ON dbo.[LoNguyenLieu] ([material_id],[code]);

CREATE INDEX [IX_LoNguyenLieu_14] ON dbo.[LoNguyenLieu] ([material_id],[expires_on],[first_received_at]);

CREATE UNIQUE INDEX [IX_LoThanhPham_15] ON dbo.[LoThanhPham] ([product_id],[code]);

CREATE INDEX [IX_LoThanhPham_16] ON dbo.[LoThanhPham] ([product_id],[expires_on],[first_received_at]);

CREATE UNIQUE INDEX [IX_HeSoChiemCho_17] ON dbo.[HeSoChiemCho] ([item_kind],[item_key],[capacity_unit_id],[revision]);

CREATE UNIQUE INDEX [IX_DinhMuc_18] ON dbo.[DinhMuc] ([product_id],[revision]);

CREATE UNIQUE INDEX [IX_DinhMuc_19] ON dbo.[DinhMuc] ([id],[product_id]);

CREATE UNIQUE INDEX [IX_ChiTietDinhMuc_20] ON dbo.[ChiTietDinhMuc] ([bom_id],[material_id]);

CREATE UNIQUE INDEX [IX_LichNangLucXuong_21] ON dbo.[LichNangLucXuong] ([workshop_id],[product_id],[business_date]);

CREATE UNIQUE INDEX [IX_DonHang_22] ON dbo.[DonHang] ([code]);

CREATE INDEX [IX_DonHang_23] ON dbo.[DonHang] ([customer_id],[created_at]);

CREATE INDEX [IX_DonHang_24] ON dbo.[DonHang] ([status],[due_date]);

CREATE UNIQUE INDEX [IX_ChiTietDonHang_25] ON dbo.[ChiTietDonHang] ([order_id],[line_no]);

CREATE UNIQUE INDEX [IX_ChiTietDonHang_26] ON dbo.[ChiTietDonHang] ([id],[order_id]);

CREATE UNIQUE INDEX [IX_KeHoachSanXuat_27] ON dbo.[KeHoachSanXuat] ([code]);

CREATE INDEX [IX_KeHoachSanXuat_28] ON dbo.[KeHoachSanXuat] ([order_id],[status]);

CREATE INDEX [IX_ChiTietKeHoachSanXuat_29] ON dbo.[ChiTietKeHoachSanXuat] ([order_line_id]);

CREATE UNIQUE INDEX [IX_PhanBoLichSanXuat_30] ON dbo.[PhanBoLichSanXuat] ([plan_line_id],[calendar_id]);

CREATE UNIQUE INDEX [IX_NhuCauNguyenLieuKHSX_31] ON dbo.[NhuCauNguyenLieuKHSX] ([plan_line_id],[material_id]);

CREATE UNIQUE INDEX [IX_DonMuaNguyenLieu_32] ON dbo.[DonMuaNguyenLieu] ([code]);

CREATE INDEX [IX_DonMuaNguyenLieu_33] ON dbo.[DonMuaNguyenLieu] ([plan_id],[status]);

CREATE INDEX [IX_DonMuaNguyenLieu_34] ON dbo.[DonMuaNguyenLieu] ([supplier_id],[status]);

CREATE UNIQUE INDEX [IX_PhanBoMuaChoNhuCau_35] ON dbo.[PhanBoMuaChoNhuCau] ([demand_id],[purchase_line_id]);

CREATE UNIQUE INDEX [IX_PhieuXuatKhoNguyenLieu_36] ON dbo.[PhieuXuatKhoNguyenLieu] ([code]);

CREATE UNIQUE INDEX [IX_PhieuNhapKhoThanhPham_37] ON dbo.[PhieuNhapKhoThanhPham] ([code]);

CREATE UNIQUE INDEX [IX_DotGiaoNguyenLieu_38] ON dbo.[DotGiaoNguyenLieu] ([code]);

CREATE UNIQUE INDEX [IX_ChiTietGiaoNL_39] ON dbo.[ChiTietGiaoNL] ([delivery_id],[purchase_line_id],[material_lot_id]);

CREATE UNIQUE INDEX [IX_PhieuXuatKho_40] ON dbo.[PhieuXuatKho] ([code]);

CREATE INDEX [IX_PhieuXuatKho_41] ON dbo.[PhieuXuatKho] ([status],[expires_at]);

CREATE UNIQUE INDEX [IX_ChiTietPhieuXuat_42] ON dbo.[ChiTietPhieuXuat] ([id],[issue_id]);

CREATE UNIQUE INDEX [IX_DotGiaoHang_43] ON dbo.[DotGiaoHang] ([issue_id]);

CREATE UNIQUE INDEX [IX_ChiTietGiaoHang_44] ON dbo.[ChiTietGiaoHang] ([issue_line_id]);

CREATE UNIQUE INDEX [IX_YeuCauTraHang_45] ON dbo.[YeuCauTraHang] ([code]);

CREATE UNIQUE INDEX [IX_ChiTietTraHang_46] ON dbo.[ChiTietTraHang] ([request_id],[delivery_line_id]);

CREATE UNIQUE INDEX [IX_ChiTietQCNguyenLieu_47] ON dbo.[ChiTietQCNguyenLieu] ([qc_id],[source_line_id],[batch_sequence]) WHERE [source_line_id] IS NOT NULL;

CREATE UNIQUE INDEX [IX_ChiTietQCThanhPham_48] ON dbo.[ChiTietQCThanhPham] ([qc_id],[source_line_id],[batch_sequence]) WHERE [source_line_id] IS NOT NULL;

CREATE UNIQUE INDEX [IX_ChiTietQCHangTra_49] ON dbo.[ChiTietQCHangTra] ([qc_id],[source_line_id],[batch_sequence]) WHERE [source_line_id] IS NOT NULL;

CREATE UNIQUE INDEX [IX_PhieuNhapKho_50] ON dbo.[PhieuNhapKho] ([code]);

CREATE UNIQUE INDEX [IX_TonKho_51] ON dbo.[TonKho] ([location_id],[lot_kind],[lot_key],[quality_bucket]);

CREATE UNIQUE INDEX [IX_DatGiuTon_52] ON dbo.[DatGiuTon] ([issue_line_id]);

CREATE INDEX [IX_DatGiuTon_53] ON dbo.[DatGiuTon] ([status],[expires_at]);

CREATE INDEX [IX_DatGiuTon_54] ON dbo.[DatGiuTon] ([demand_id],[status]);

CREATE UNIQUE INDEX [IX_BienBanKiemKe_55] ON dbo.[BienBanKiemKe] ([code]);

CREATE UNIQUE INDEX [IX_KhoaViTriKiemKe_56] ON dbo.[KhoaViTriKiemKe] ([location_id]);

CREATE UNIQUE INDEX [IX_StockPosting_57] ON dbo.[StockPosting] ([receipt_id]) WHERE [receipt_id] IS NOT NULL;

CREATE UNIQUE INDEX [IX_StockPosting_58] ON dbo.[StockPosting] ([issue_id]) WHERE [issue_id] IS NOT NULL;

CREATE UNIQUE INDEX [IX_StockPosting_59] ON dbo.[StockPosting] ([return_reception_id]) WHERE [return_reception_id] IS NOT NULL;

CREATE UNIQUE INDEX [IX_StockPosting_60] ON dbo.[StockPosting] ([adjustment_id]) WHERE [adjustment_id] IS NOT NULL;

CREATE UNIQUE INDEX [IX_StockPosting_61] ON dbo.[StockPosting] ([disposition_id]) WHERE [disposition_id] IS NOT NULL;

CREATE INDEX [IX_LichSuBienDongTon_62] ON dbo.[LichSuBienDongTon] ([balance_id],[created_at],[id]);

CREATE UNIQUE INDEX [IX_PhamViKiemKe_63] ON dbo.[PhamViKiemKe] ([stocktake_id],[location_id]);

CREATE UNIQUE INDEX [IX_ThanhVienKiemKe_64] ON dbo.[ThanhVienKiemKe] ([stocktake_id],[account_id]);

CREATE UNIQUE INDEX [IX_SnapshotKiemKe_65] ON dbo.[SnapshotKiemKe] ([stocktake_id],[scope_generation],[balance_id]);

CREATE UNIQUE INDEX [IX_LanDemKiemKe_66] ON dbo.[LanDemKiemKe] ([stocktake_id],[scope_generation],[sequence]);

CREATE UNIQUE INDEX [IX_ChiTietKiemKe_67] ON dbo.[ChiTietKiemKe] ([stocktake_id],[scope_generation],[balance_id]) WHERE [balance_id] IS NOT NULL;

CREATE UNIQUE INDEX [IX_XuLyChenhLech_68] ON dbo.[XuLyChenhLech] ([stocktake_line_id]);

CREATE UNIQUE INDEX [IX_DeNghiDieuChinhTon_69] ON dbo.[DeNghiDieuChinhTon] ([stocktake_line_id]);

CREATE UNIQUE INDEX [IX_BangChung_70] ON dbo.[BangChung] ([storage_key]);

CREATE UNIQUE INDEX [IX_CauHinhNghiepVu_71] ON dbo.[CauHinhNghiepVu] ([warehouse_id],[item_kind],[item_key],[revision]);

CREATE UNIQUE INDEX [IX_DotTaiXuLy_72] ON dbo.[DotTaiXuLy] ([disposition_id]);

CREATE UNIQUE INDEX [IX_PhanBoTonDuKien_73] ON dbo.[PhanBoTonDuKien] ([demand_id],[warehouse_id]);

ALTER TABLE dbo.[VaiTro_Quyen] ADD CONSTRAINT VaiTro_Quyen_role_id_fkey FOREIGN KEY ([role_id]) REFERENCES [VaiTroQuyen]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.[VaiTro_Quyen] ADD CONSTRAINT VaiTro_Quyen_permission_id_fkey FOREIGN KEY ([permission_id]) REFERENCES [Quyen]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.[TaiKhoan] ADD CONSTRAINT TaiKhoan_role_id_fkey FOREIGN KEY ([role_id]) REFERENCES [VaiTroQuyen]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.[TaiKhoan] ADD CONSTRAINT TaiKhoan_customer_id_fkey FOREIGN KEY ([customer_id]) REFERENCES [KhachHang]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.[PhienDangNhap] ADD CONSTRAINT PhienDangNhap_account_id_fkey FOREIGN KEY ([account_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.[AuditLog] ADD CONSTRAINT AuditLog_actor_id_fkey FOREIGN KEY ([actor_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.[IdempotencyRequest] ADD CONSTRAINT IdempotencyRequest_account_id_fkey FOREIGN KEY ([account_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.[NguyenLieu] ADD FOREIGN KEY([base_unit_id]) REFERENCES [DonViTinh]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[NguyenLieu] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ThanhPham] ADD FOREIGN KEY([base_unit_id]) REFERENCES [DonViTinh]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ThanhPham] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[QuyCachDongGoi] ADD FOREIGN KEY([product_id]) REFERENCES [ThanhPham]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[QuyCachDongGoi] ADD FOREIGN KEY([unit_id]) REFERENCES [DonViTinh]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[QuyCachDongGoi] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[GiaBanThanhPham] ADD FOREIGN KEY([product_id]) REFERENCES [ThanhPham]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[GiaBanThanhPham] ADD FOREIGN KEY([unit_id]) REFERENCES [DonViTinh]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[GiaBanThanhPham] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[Kho] ADD FOREIGN KEY([capacity_unit_id]) REFERENCES [DonViTinh]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[Kho] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ViTriLuuKho] ADD FOREIGN KEY([warehouse_id]) REFERENCES [Kho]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ViTriLuuKho] ADD FOREIGN KEY([capacity_unit_id]) REFERENCES [DonViTinh]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ViTriLuuKho] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[TaiKhoan_Kho] ADD FOREIGN KEY([account_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[TaiKhoan_Kho] ADD FOREIGN KEY([warehouse_id]) REFERENCES [Kho]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[TaiKhoan_Xuong] ADD FOREIGN KEY([account_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[TaiKhoan_Xuong] ADD FOREIGN KEY([workshop_id]) REFERENCES [XuongSanXuat]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[LoNguyenLieu] ADD FOREIGN KEY([material_id]) REFERENCES [NguyenLieu]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[LoNguyenLieu] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[LoThanhPham] ADD FOREIGN KEY([product_id]) REFERENCES [ThanhPham]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[LoThanhPham] ADD FOREIGN KEY([packaging_version_id],[product_id]) REFERENCES [QuyCachDongGoi]([id],[product_id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[LoThanhPham] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[HeSoChiemCho] ADD FOREIGN KEY([material_id]) REFERENCES [NguyenLieu]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[HeSoChiemCho] ADD FOREIGN KEY([product_id]) REFERENCES [ThanhPham]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[HeSoChiemCho] ADD FOREIGN KEY([capacity_unit_id]) REFERENCES [DonViTinh]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[DinhMuc] ADD FOREIGN KEY([product_id]) REFERENCES [ThanhPham]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[DinhMuc] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietDinhMuc] ADD FOREIGN KEY([bom_id]) REFERENCES [DinhMuc]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietDinhMuc] ADD FOREIGN KEY([material_id]) REFERENCES [NguyenLieu]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietDinhMuc] ADD FOREIGN KEY([unit_id]) REFERENCES [DonViTinh]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[LichNangLucXuong] ADD FOREIGN KEY([workshop_id]) REFERENCES [XuongSanXuat]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[LichNangLucXuong] ADD FOREIGN KEY([product_id]) REFERENCES [ThanhPham]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[DonHang] ADD FOREIGN KEY([customer_id]) REFERENCES [KhachHang]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[DonHang] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietDonHang] ADD FOREIGN KEY([order_id]) REFERENCES [DonHang]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietDonHang] ADD FOREIGN KEY([product_id]) REFERENCES [ThanhPham]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietDonHang] ADD FOREIGN KEY([unit_id]) REFERENCES [DonViTinh]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietDonHang] ADD FOREIGN KEY([packaging_id],[product_id]) REFERENCES [QuyCachDongGoi]([id],[product_id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietDonHang] ADD FOREIGN KEY([price_id]) REFERENCES [GiaBanThanhPham]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[KeHoachSanXuat] ADD FOREIGN KEY([order_id]) REFERENCES [DonHang]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[KeHoachSanXuat] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[KeHoachSanXuat] ADD FOREIGN KEY([approver_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietKeHoachSanXuat] ADD FOREIGN KEY([plan_id]) REFERENCES [KeHoachSanXuat]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietKeHoachSanXuat] ADD FOREIGN KEY([order_line_id]) REFERENCES [ChiTietDonHang]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietKeHoachSanXuat] ADD FOREIGN KEY([product_id]) REFERENCES [ThanhPham]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietKeHoachSanXuat] ADD FOREIGN KEY([workshop_id]) REFERENCES [XuongSanXuat]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietKeHoachSanXuat] ADD FOREIGN KEY([bom_version_id],[product_id]) REFERENCES [DinhMuc]([id],[product_id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[PhanBoLichSanXuat] ADD FOREIGN KEY([plan_line_id]) REFERENCES [ChiTietKeHoachSanXuat]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[PhanBoLichSanXuat] ADD FOREIGN KEY([calendar_id]) REFERENCES [LichNangLucXuong]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[NhuCauNguyenLieuKHSX] ADD FOREIGN KEY([plan_line_id]) REFERENCES [ChiTietKeHoachSanXuat]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[NhuCauNguyenLieuKHSX] ADD FOREIGN KEY([bom_line_id]) REFERENCES [ChiTietDinhMuc]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[NhuCauNguyenLieuKHSX] ADD FOREIGN KEY([material_id]) REFERENCES [NguyenLieu]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[NhuCauNguyenLieuKHSX] ADD FOREIGN KEY([unit_id]) REFERENCES [DonViTinh]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[DonMuaNguyenLieu] ADD FOREIGN KEY([plan_id]) REFERENCES [KeHoachSanXuat]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[DonMuaNguyenLieu] ADD FOREIGN KEY([supplier_id]) REFERENCES [NhaCungCap]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[DonMuaNguyenLieu] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[DonMuaNguyenLieu] ADD FOREIGN KEY([approver_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietDonMuaNguyenLieu] ADD FOREIGN KEY([purchase_id]) REFERENCES [DonMuaNguyenLieu]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietDonMuaNguyenLieu] ADD FOREIGN KEY([material_id]) REFERENCES [NguyenLieu]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietDonMuaNguyenLieu] ADD FOREIGN KEY([unit_id]) REFERENCES [DonViTinh]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[PhanBoMuaChoNhuCau] ADD FOREIGN KEY([demand_id]) REFERENCES [NhuCauNguyenLieuKHSX]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[PhanBoMuaChoNhuCau] ADD FOREIGN KEY([purchase_line_id]) REFERENCES [ChiTietDonMuaNguyenLieu]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[PhieuXuatKhoNguyenLieu] ADD FOREIGN KEY([plan_line_id]) REFERENCES [ChiTietKeHoachSanXuat]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[PhieuXuatKhoNguyenLieu] ADD FOREIGN KEY([workshop_id]) REFERENCES [XuongSanXuat]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[PhieuXuatKhoNguyenLieu] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietYeuCauXuatNL] ADD FOREIGN KEY([request_id]) REFERENCES [PhieuXuatKhoNguyenLieu]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietYeuCauXuatNL] ADD FOREIGN KEY([demand_id]) REFERENCES [NhuCauNguyenLieuKHSX]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietYeuCauXuatNL] ADD FOREIGN KEY([material_id]) REFERENCES [NguyenLieu]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietYeuCauXuatNL] ADD FOREIGN KEY([unit_id]) REFERENCES [DonViTinh]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[PhieuNhapKhoThanhPham] ADD FOREIGN KEY([plan_line_id]) REFERENCES [ChiTietKeHoachSanXuat]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[PhieuNhapKhoThanhPham] ADD FOREIGN KEY([workshop_id]) REFERENCES [XuongSanXuat]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[PhieuNhapKhoThanhPham] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietYeuCauNhapTP] ADD FOREIGN KEY([request_id]) REFERENCES [PhieuNhapKhoThanhPham]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietYeuCauNhapTP] ADD FOREIGN KEY([plan_line_id]) REFERENCES [ChiTietKeHoachSanXuat]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[ChiTietYeuCauNhapTP] ADD FOREIGN KEY([product_lot_id]) REFERENCES [LoThanhPham]([id]) ON DELETE NO ACTION;

ALTER TABLE dbo.[DotGiaoNguyenLieu] ADD FOREIGN KEY([purchase_id]) REFERENCES [DonMuaNguyenLieu]([id]);

ALTER TABLE dbo.[DotGiaoNguyenLieu] ADD FOREIGN KEY([warehouse_id]) REFERENCES [Kho]([id]);

ALTER TABLE dbo.[DotGiaoNguyenLieu] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[ChiTietGiaoNL] ADD FOREIGN KEY([delivery_id]) REFERENCES [DotGiaoNguyenLieu]([id]);

ALTER TABLE dbo.[ChiTietGiaoNL] ADD FOREIGN KEY([purchase_line_id]) REFERENCES [ChiTietDonMuaNguyenLieu]([id]);

ALTER TABLE dbo.[ChiTietGiaoNL] ADD FOREIGN KEY([material_lot_id]) REFERENCES [LoNguyenLieu]([id]);

ALTER TABLE dbo.[ChiTietGiaoNL] ADD FOREIGN KEY([unit_id]) REFERENCES [DonViTinh]([id]);

ALTER TABLE dbo.[PhieuXuatKho] ADD FOREIGN KEY([warehouse_id]) REFERENCES [Kho]([id]);

ALTER TABLE dbo.[PhieuXuatKho] ADD FOREIGN KEY([order_id]) REFERENCES [DonHang]([id]);

ALTER TABLE dbo.[PhieuXuatKho] ADD FOREIGN KEY([material_request_id]) REFERENCES [PhieuXuatKhoNguyenLieu]([id]);

ALTER TABLE dbo.[PhieuXuatKho] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[ChiTietPhieuXuat] ADD FOREIGN KEY([issue_id]) REFERENCES [PhieuXuatKho]([id]);

ALTER TABLE dbo.[ChiTietPhieuXuat] ADD FOREIGN KEY([order_line_id]) REFERENCES [ChiTietDonHang]([id]);

ALTER TABLE dbo.[ChiTietPhieuXuat] ADD FOREIGN KEY([material_request_line_id]) REFERENCES [ChiTietYeuCauXuatNL]([id]);

ALTER TABLE dbo.[ChiTietPhieuXuat] ADD FOREIGN KEY([material_lot_id]) REFERENCES [LoNguyenLieu]([id]);

ALTER TABLE dbo.[ChiTietPhieuXuat] ADD FOREIGN KEY([product_lot_id]) REFERENCES [LoThanhPham]([id]);

ALTER TABLE dbo.[ChiTietPhieuXuat] ADD FOREIGN KEY([location_id]) REFERENCES [ViTriLuuKho]([id]);

ALTER TABLE dbo.[ChiTietPhieuXuat] ADD FOREIGN KEY([unit_id]) REFERENCES [DonViTinh]([id]);

ALTER TABLE dbo.[ChiTietPhieuXuat] ADD FOREIGN KEY([packaging_version_id]) REFERENCES [QuyCachDongGoi]([id]);

ALTER TABLE dbo.[DotGiaoHang] ADD FOREIGN KEY([issue_id]) REFERENCES [PhieuXuatKho]([id]);

ALTER TABLE dbo.[DotGiaoHang] ADD FOREIGN KEY([order_id]) REFERENCES [DonHang]([id]);

ALTER TABLE dbo.[ChiTietGiaoHang] ADD FOREIGN KEY([delivery_id]) REFERENCES [DotGiaoHang]([id]);

ALTER TABLE dbo.[ChiTietGiaoHang] ADD FOREIGN KEY([issue_line_id]) REFERENCES [ChiTietPhieuXuat]([id]);

ALTER TABLE dbo.[YeuCauTraHang] ADD FOREIGN KEY([order_id]) REFERENCES [DonHang]([id]);

ALTER TABLE dbo.[YeuCauTraHang] ADD FOREIGN KEY([customer_id]) REFERENCES [KhachHang]([id]);

ALTER TABLE dbo.[YeuCauTraHang] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[ChiTietTraHang] ADD FOREIGN KEY([request_id]) REFERENCES [YeuCauTraHang]([id]);

ALTER TABLE dbo.[ChiTietTraHang] ADD FOREIGN KEY([delivery_line_id]) REFERENCES [ChiTietGiaoHang]([id]);

ALTER TABLE dbo.[ChiTietTraHang] ADD FOREIGN KEY([issue_line_id]) REFERENCES [ChiTietPhieuXuat]([id]);

ALTER TABLE dbo.[ChiTietTraHang] ADD FOREIGN KEY([product_lot_id]) REFERENCES [LoThanhPham]([id]);

ALTER TABLE dbo.[TiepNhanTra] ADD FOREIGN KEY([request_id]) REFERENCES [YeuCauTraHang]([id]);

ALTER TABLE dbo.[TiepNhanTra] ADD FOREIGN KEY([warehouse_id]) REFERENCES [Kho]([id]);

ALTER TABLE dbo.[TiepNhanTra] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[ChiTietTiepNhanTra] ADD FOREIGN KEY([reception_id]) REFERENCES [TiepNhanTra]([id]);

ALTER TABLE dbo.[ChiTietTiepNhanTra] ADD FOREIGN KEY([return_line_id]) REFERENCES [ChiTietTraHang]([id]);

ALTER TABLE dbo.[ChiTietTiepNhanTra] ADD FOREIGN KEY([product_lot_id]) REFERENCES [LoThanhPham]([id]);

ALTER TABLE dbo.[ChiTietTiepNhanTra] ADD FOREIGN KEY([location_id]) REFERENCES [ViTriLuuKho]([id]);

ALTER TABLE dbo.[ChiTietTiepNhanTra] ADD FOREIGN KEY([unit_id]) REFERENCES [DonViTinh]([id]);

ALTER TABLE dbo.[BienBanQCNguyenLieu] ADD FOREIGN KEY([source_id]) REFERENCES [DotGiaoNguyenLieu]([id]);

ALTER TABLE dbo.[BienBanQCNguyenLieu] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[ChiTietQCNguyenLieu] ADD FOREIGN KEY([qc_id]) REFERENCES [BienBanQCNguyenLieu]([id]);

ALTER TABLE dbo.[ChiTietQCNguyenLieu] ADD FOREIGN KEY([source_line_id]) REFERENCES [ChiTietGiaoNL]([id]);

ALTER TABLE dbo.[ChiTietQCNguyenLieu] ADD FOREIGN KEY([material_lot_id]) REFERENCES [LoNguyenLieu]([id]);

ALTER TABLE dbo.[BienBanQCThanhPham] ADD FOREIGN KEY([source_id]) REFERENCES [PhieuNhapKhoThanhPham]([id]);

ALTER TABLE dbo.[BienBanQCThanhPham] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[ChiTietQCThanhPham] ADD FOREIGN KEY([qc_id]) REFERENCES [BienBanQCThanhPham]([id]);

ALTER TABLE dbo.[ChiTietQCThanhPham] ADD FOREIGN KEY([source_line_id]) REFERENCES [ChiTietYeuCauNhapTP]([id]);

ALTER TABLE dbo.[ChiTietQCThanhPham] ADD FOREIGN KEY([product_lot_id]) REFERENCES [LoThanhPham]([id]);

ALTER TABLE dbo.[KetQuaKiemTraHangTra] ADD FOREIGN KEY([source_id]) REFERENCES [TiepNhanTra]([id]);

ALTER TABLE dbo.[KetQuaKiemTraHangTra] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[ChiTietQCHangTra] ADD FOREIGN KEY([qc_id]) REFERENCES [KetQuaKiemTraHangTra]([id]);

ALTER TABLE dbo.[ChiTietQCHangTra] ADD FOREIGN KEY([source_line_id]) REFERENCES [ChiTietTiepNhanTra]([id]);

ALTER TABLE dbo.[ChiTietQCHangTra] ADD FOREIGN KEY([product_lot_id]) REFERENCES [LoThanhPham]([id]);

ALTER TABLE dbo.[PhieuNhapKho] ADD FOREIGN KEY([warehouse_id]) REFERENCES [Kho]([id]);

ALTER TABLE dbo.[PhieuNhapKho] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[ChiTietPhieuNhap] ADD FOREIGN KEY([receipt_id]) REFERENCES [PhieuNhapKho]([id]);

ALTER TABLE dbo.[ChiTietPhieuNhap] ADD FOREIGN KEY([material_qc_line_id]) REFERENCES [ChiTietQCNguyenLieu]([id]);

ALTER TABLE dbo.[ChiTietPhieuNhap] ADD FOREIGN KEY([product_qc_line_id]) REFERENCES [ChiTietQCThanhPham]([id]);

ALTER TABLE dbo.[ChiTietPhieuNhap] ADD FOREIGN KEY([return_qc_line_id]) REFERENCES [ChiTietQCHangTra]([id]);

ALTER TABLE dbo.[ChiTietPhieuNhap] ADD FOREIGN KEY([material_lot_id]) REFERENCES [LoNguyenLieu]([id]);

ALTER TABLE dbo.[ChiTietPhieuNhap] ADD FOREIGN KEY([product_lot_id]) REFERENCES [LoThanhPham]([id]);

ALTER TABLE dbo.[ChiTietPhieuNhap] ADD FOREIGN KEY([location_id]) REFERENCES [ViTriLuuKho]([id]);

ALTER TABLE dbo.[ChiTietPhieuNhap] ADD FOREIGN KEY([unit_id]) REFERENCES [DonViTinh]([id]);

ALTER TABLE dbo.[ChiTietPhieuNhap] ADD FOREIGN KEY([packaging_version_id]) REFERENCES [QuyCachDongGoi]([id]);

ALTER TABLE dbo.[TonKho] ADD FOREIGN KEY([location_id]) REFERENCES [ViTriLuuKho]([id]);

ALTER TABLE dbo.[TonKho] ADD FOREIGN KEY([material_lot_id]) REFERENCES [LoNguyenLieu]([id]);

ALTER TABLE dbo.[TonKho] ADD FOREIGN KEY([product_lot_id]) REFERENCES [LoThanhPham]([id]);

ALTER TABLE dbo.[TonKho] ADD FOREIGN KEY([capacity_factor_id]) REFERENCES [HeSoChiemCho]([id]);

ALTER TABLE dbo.[DatGiuTon] ADD FOREIGN KEY([issue_id]) REFERENCES [PhieuXuatKho]([id]);

ALTER TABLE dbo.[DatGiuTon] ADD FOREIGN KEY([issue_line_id]) REFERENCES [ChiTietPhieuXuat]([id]);

ALTER TABLE dbo.[DatGiuTon] ADD FOREIGN KEY([balance_id]) REFERENCES [TonKho]([id]);

ALTER TABLE dbo.[DatGiuTon] ADD FOREIGN KEY([demand_id]) REFERENCES [NhuCauNguyenLieuKHSX]([id]);

ALTER TABLE dbo.[BienBanKiemKe] ADD FOREIGN KEY([warehouse_id]) REFERENCES [Kho]([id]);

ALTER TABLE dbo.[BienBanKiemKe] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[KhoaViTriKiemKe] ADD FOREIGN KEY([location_id]) REFERENCES [ViTriLuuKho]([id]);

ALTER TABLE dbo.[KhoaViTriKiemKe] ADD FOREIGN KEY([stocktake_id]) REFERENCES [BienBanKiemKe]([id]);

ALTER TABLE dbo.[StockPosting] ADD FOREIGN KEY([receipt_id]) REFERENCES [PhieuNhapKho]([id]);

ALTER TABLE dbo.[StockPosting] ADD FOREIGN KEY([issue_id]) REFERENCES [PhieuXuatKho]([id]);

ALTER TABLE dbo.[StockPosting] ADD FOREIGN KEY([return_reception_id]) REFERENCES [TiepNhanTra]([id]);

ALTER TABLE dbo.[StockPosting] ADD FOREIGN KEY([stocktake_id]) REFERENCES [BienBanKiemKe]([id]);

ALTER TABLE dbo.[StockPosting] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[LichSuBienDongTon] ADD FOREIGN KEY([posting_id]) REFERENCES [StockPosting]([id]);

ALTER TABLE dbo.[LichSuBienDongTon] ADD FOREIGN KEY([balance_id]) REFERENCES [TonKho]([id]);

ALTER TABLE dbo.[LichSuBienDongTon] ADD FOREIGN KEY([receipt_line_id]) REFERENCES [ChiTietPhieuNhap]([id]);

ALTER TABLE dbo.[LichSuBienDongTon] ADD FOREIGN KEY([issue_line_id]) REFERENCES [ChiTietPhieuXuat]([id]);

ALTER TABLE dbo.[LichSuBienDongTon] ADD FOREIGN KEY([return_reception_line_id]) REFERENCES [ChiTietTiepNhanTra]([id]);

ALTER TABLE dbo.[PhamViKiemKe] ADD FOREIGN KEY([stocktake_id]) REFERENCES [BienBanKiemKe]([id]);

ALTER TABLE dbo.[PhamViKiemKe] ADD FOREIGN KEY([location_id]) REFERENCES [ViTriLuuKho]([id]);

ALTER TABLE dbo.[ThanhVienKiemKe] ADD FOREIGN KEY([stocktake_id]) REFERENCES [BienBanKiemKe]([id]);

ALTER TABLE dbo.[ThanhVienKiemKe] ADD FOREIGN KEY([account_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[SnapshotKiemKe] ADD FOREIGN KEY([stocktake_id]) REFERENCES [BienBanKiemKe]([id]);

ALTER TABLE dbo.[SnapshotKiemKe] ADD FOREIGN KEY([balance_id]) REFERENCES [TonKho]([id]);

ALTER TABLE dbo.[SnapshotKiemKe] ADD FOREIGN KEY([location_id]) REFERENCES [ViTriLuuKho]([id]);

ALTER TABLE dbo.[SnapshotKiemKe] ADD FOREIGN KEY([material_lot_id]) REFERENCES [LoNguyenLieu]([id]);

ALTER TABLE dbo.[SnapshotKiemKe] ADD FOREIGN KEY([product_lot_id]) REFERENCES [LoThanhPham]([id]);

ALTER TABLE dbo.[LanDemKiemKe] ADD FOREIGN KEY([stocktake_id]) REFERENCES [BienBanKiemKe]([id]);

ALTER TABLE dbo.[LanDemKiemKe] ADD FOREIGN KEY([counter_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[ChiTietLanDem] ADD FOREIGN KEY([count_id]) REFERENCES [LanDemKiemKe]([id]);

ALTER TABLE dbo.[ChiTietLanDem] ADD FOREIGN KEY([location_id]) REFERENCES [ViTriLuuKho]([id]);

ALTER TABLE dbo.[ChiTietLanDem] ADD FOREIGN KEY([material_lot_id]) REFERENCES [LoNguyenLieu]([id]);

ALTER TABLE dbo.[ChiTietLanDem] ADD FOREIGN KEY([product_lot_id]) REFERENCES [LoThanhPham]([id]);

ALTER TABLE dbo.[ChiTietKiemKe] ADD FOREIGN KEY([stocktake_id]) REFERENCES [BienBanKiemKe]([id]);

ALTER TABLE dbo.[ChiTietKiemKe] ADD FOREIGN KEY([snapshot_id]) REFERENCES [SnapshotKiemKe]([id]);

ALTER TABLE dbo.[ChiTietKiemKe] ADD FOREIGN KEY([balance_id]) REFERENCES [TonKho]([id]);

ALTER TABLE dbo.[ChiTietKiemKe] ADD FOREIGN KEY([accepted_count_id]) REFERENCES [LanDemKiemKe]([id]);

ALTER TABLE dbo.[ChiTietKiemKe] ADD FOREIGN KEY([location_id]) REFERENCES [ViTriLuuKho]([id]);

ALTER TABLE dbo.[ChiTietKiemKe] ADD FOREIGN KEY([material_lot_id]) REFERENCES [LoNguyenLieu]([id]);

ALTER TABLE dbo.[ChiTietKiemKe] ADD FOREIGN KEY([product_lot_id]) REFERENCES [LoThanhPham]([id]);

ALTER TABLE dbo.[XuLyChenhLech] ADD FOREIGN KEY([stocktake_line_id]) REFERENCES [ChiTietKiemKe]([id]);

ALTER TABLE dbo.[XuLyChenhLech] ADD FOREIGN KEY([verifier_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[DeNghiDieuChinhTon] ADD FOREIGN KEY([stocktake_line_id]) REFERENCES [ChiTietKiemKe]([id]);

ALTER TABLE dbo.[DeNghiDieuChinhTon] ADD FOREIGN KEY([verification_id]) REFERENCES [XuLyChenhLech]([id]);

ALTER TABLE dbo.[DeNghiDieuChinhTon] ADD FOREIGN KEY([stocktake_id]) REFERENCES [BienBanKiemKe]([id]);

ALTER TABLE dbo.[DeNghiDieuChinhTon] ADD FOREIGN KEY([proposer_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[DeNghiDieuChinhTon] ADD FOREIGN KEY([approver_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[BangChung] ADD FOREIGN KEY([stocktake_id]) REFERENCES [BienBanKiemKe]([id]);

ALTER TABLE dbo.[BangChung] ADD FOREIGN KEY([issue_id]) REFERENCES [PhieuXuatKho]([id]);

ALTER TABLE dbo.[BangChung] ADD FOREIGN KEY([warehouse_id]) REFERENCES [Kho]([id]);

ALTER TABLE dbo.[BangChung] ADD FOREIGN KEY([uploader_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[TiepNhanChuaDinhDanh] ADD FOREIGN KEY([warehouse_id]) REFERENCES [Kho]([id]);

ALTER TABLE dbo.[TiepNhanChuaDinhDanh] ADD FOREIGN KEY([location_id]) REFERENCES [ViTriLuuKho]([id]);

ALTER TABLE dbo.[TiepNhanChuaDinhDanh] ADD FOREIGN KEY([material_id]) REFERENCES [NguyenLieu]([id]);

ALTER TABLE dbo.[TiepNhanChuaDinhDanh] ADD FOREIGN KEY([product_id]) REFERENCES [ThanhPham]([id]);

ALTER TABLE dbo.[TiepNhanChuaDinhDanh] ADD FOREIGN KEY([unit_id]) REFERENCES [DonViTinh]([id]);

ALTER TABLE dbo.[TiepNhanChuaDinhDanh] ADD FOREIGN KEY([resolved_return_reception_line_id]) REFERENCES [ChiTietTiepNhanTra]([id]);

ALTER TABLE dbo.[TiepNhanChuaDinhDanh] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[TiepNhanChuaDinhDanh] ADD FOREIGN KEY([resolved_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[XuLyHangLoiTraVe] ADD FOREIGN KEY([material_qc_line_id]) REFERENCES [ChiTietQCNguyenLieu]([id]);

ALTER TABLE dbo.[XuLyHangLoiTraVe] ADD FOREIGN KEY([product_qc_line_id]) REFERENCES [ChiTietQCThanhPham]([id]);

ALTER TABLE dbo.[XuLyHangLoiTraVe] ADD FOREIGN KEY([return_qc_line_id]) REFERENCES [ChiTietQCHangTra]([id]);

ALTER TABLE dbo.[XuLyHangLoiTraVe] ADD FOREIGN KEY([proposed_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[XuLyHangLoiTraVe] ADD FOREIGN KEY([approved_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[StockPosting] ADD FOREIGN KEY([adjustment_id]) REFERENCES [DeNghiDieuChinhTon]([id]);

ALTER TABLE dbo.[StockPosting] ADD FOREIGN KEY([disposition_id]) REFERENCES [XuLyHangLoiTraVe]([id]);

ALTER TABLE dbo.[CauHinhNghiepVu] ADD FOREIGN KEY([warehouse_id]) REFERENCES [Kho]([id]);

ALTER TABLE dbo.[CauHinhNghiepVu] ADD FOREIGN KEY([material_id]) REFERENCES [NguyenLieu]([id]);

ALTER TABLE dbo.[CauHinhNghiepVu] ADD FOREIGN KEY([product_id]) REFERENCES [ThanhPham]([id]);

ALTER TABLE dbo.[CauHinhNghiepVu] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[DotTaiXuLy] ADD FOREIGN KEY([disposition_id]) REFERENCES [XuLyHangLoiTraVe]([id]);

ALTER TABLE dbo.[DotTaiXuLy] ADD FOREIGN KEY([warehouse_id]) REFERENCES [Kho]([id]);

ALTER TABLE dbo.[DotTaiXuLy] ADD FOREIGN KEY([location_id]) REFERENCES [ViTriLuuKho]([id]);

ALTER TABLE dbo.[DotTaiXuLy] ADD FOREIGN KEY([material_lot_id]) REFERENCES [LoNguyenLieu]([id]);

ALTER TABLE dbo.[DotTaiXuLy] ADD FOREIGN KEY([product_lot_id]) REFERENCES [LoThanhPham]([id]);

ALTER TABLE dbo.[DotTaiXuLy] ADD FOREIGN KEY([created_by_id]) REFERENCES [TaiKhoan]([id]);

ALTER TABLE dbo.[BienBanQCNguyenLieu] ADD FOREIGN KEY([rework_batch_id]) REFERENCES [DotTaiXuLy]([id]);

ALTER TABLE dbo.[BienBanQCThanhPham] ADD FOREIGN KEY([rework_batch_id]) REFERENCES [DotTaiXuLy]([id]);

ALTER TABLE dbo.[KetQuaKiemTraHangTra] ADD FOREIGN KEY([rework_batch_id]) REFERENCES [DotTaiXuLy]([id]);

ALTER TABLE dbo.[ChiTietQCNguyenLieu] ADD FOREIGN KEY([rework_batch_id]) REFERENCES [DotTaiXuLy]([id]);

ALTER TABLE dbo.[ChiTietQCThanhPham] ADD FOREIGN KEY([rework_batch_id]) REFERENCES [DotTaiXuLy]([id]);

ALTER TABLE dbo.[ChiTietQCHangTra] ADD FOREIGN KEY([rework_batch_id]) REFERENCES [DotTaiXuLy]([id]);

ALTER TABLE dbo.[XuLyHangLoiTraVe] ADD FOREIGN KEY([balance_id]) REFERENCES [TonKho]([id]);

ALTER TABLE dbo.[PhanBoTonDuKien] ADD FOREIGN KEY([demand_id]) REFERENCES [NhuCauNguyenLieuKHSX]([id]);

ALTER TABLE dbo.[PhanBoTonDuKien] ADD FOREIGN KEY([warehouse_id]) REFERENCES [Kho]([id]);
