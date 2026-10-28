# Hồ sơ stack cũ — DA_THAY_THE

Prisma đã được người dùng thay thế bằng mysql2/promise và SQL migrations.
Thư mục này chỉ giữ schema.prisma, migration_lock.toml và SQL nguyên byte để
truy vết quyết định/đối chiếu checksum lịch sử. Không có Prisma dependency,
client generated, config hoặc script thực thi. Không dùng thư mục này để
migrate. SQL hiện hành nằm tại ../database/migrations; runner không chạy lại
CREATE TABLE legacy đã được xác minh. Không xóa _prisma_migrations trong MySQL.
