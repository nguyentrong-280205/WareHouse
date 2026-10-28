-- Technical maintenance has no fabricated human account. Existing audit rows retain ACCOUNT.
ALTER TABLE AuditLog MODIFY actor_id BIGINT UNSIGNED NULL,
 ADD actor_kind ENUM('ACCOUNT','SYSTEM') NOT NULL DEFAULT 'ACCOUNT',
 ADD CHECK((actor_kind='ACCOUNT' AND actor_id IS NOT NULL) OR (actor_kind='SYSTEM' AND actor_id IS NULL));
