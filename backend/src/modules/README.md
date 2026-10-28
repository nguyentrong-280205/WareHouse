# Module boundaries — SQL Server

All 29 assigned UC are DA_CODE_CHUA_TEST; no UC28. Express CommonJS modules:
auth, health, warehouse, customers, orders, production, purchasing, qc,
inventory, returns, dispositions, stocktake, reports and evidence.

Router → controller → service → repository. Repository SQL uses T-SQL and bound
mssql parameters. Services share one mssql.Transaction and physical connection
for source quotas, reservation, stock posting, ledger, idempotency and audit.
Use READ COMMITTED and reviewed UPDLOCK/HOLDLOCK/ROWLOCK ordering. Never create a
second transaction inside a business transaction or update physical stock from QC,
UC13 or UC15 allocation. DECIMAL/BIGINT stay exact through SQL JSON serialization.

Authenticate from the real SQL Server session resolver before RBAC/customer/warehouse/
workshop scope checks. Never trust client principal headers or created_by as scope.
See docs/sqlserver_runbook.md and docs/architecture.md. Legacy MySQL/Prisma sources
are archives; no runtime mysql2/ORM dependency and no SQL in controllers.

Automatic tests remain deferred by user instruction. Keep test DB guards and fixtures;
never run writing tests on warehouse_db or reset existing data/volumes.
