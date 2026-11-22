// Source-only inventory. Never connects to SQL Server or applies migrations.
const fs = require('node:fs'),
	path = require('node:path');
const { loadMigrations } = require('../database/sqlserver/migrator');
const migrations = loadMigrations(),
	tables = [],
	foreignKeys = [];
const columns = (text) =>
	text
		.split(',')
		.map((c) => c.trim().replace(/[\[\]]/g, ''))
		.join(',');
const add = (table, fields, target, targetFields) =>
	foreignKeys.push(`${table}(${columns(fields)})->${target}(${columns(targetFields)})`);
for (const migration of migrations) {
	const sql = migration.sql.replace(/--[^\r\n]*/g, '');
	const before = foreignKeys.length;
	for (const match of sql.matchAll(
		/CREATE\s+TABLE\s+dbo\.\[?(\w+)\]?\s*\(([\s\S]*?)\r?\n\);/gi
	)) {
		tables.push(match[1]);
		for (const fk of match[2].matchAll(
			/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(?:dbo\.)?\[?(\w+)\]?\s*\(([^)]+)\)/gi
		))
			add(match[1], fk[1], fk[2], fk[3]);
		for (const fk of match[2].matchAll(
			/\b(\w+)\s+BIGINT\b[^,\r\n]*?\bREFERENCES\s+(?:dbo\.)?\[?(\w+)\]?\s*\(([^)]+)\)/gi
		))
			add(match[1], fk[1], fk[2], fk[3]);
	}
	for (const fk of sql.matchAll(
		/ALTER\s+TABLE\s+(?:dbo\.)?\[?(\w+)\]?[^\r\n;]*?\bFOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(?:dbo\.)?\[?(\w+)\]?\s*\(([^)]+)\)/gi
	))
		add(fk[1], fk[2], fk[3], fk[4]);
	for (const fk of sql.matchAll(
		/ALTER\s+TABLE\s+dbo\.\[?(\w+)\]?\s+ADD\s+(\w+)\s+BIGINT\b[^\r\n;]*?\bREFERENCES\s+(?:dbo\.)?\[?(\w+)\]?\s*\(([^)]+)\)/gi
	))
		add(fk[1], fk[2], fk[3], fk[4]);
	if (
		foreignKeys.length - before !==
		(sql.match(/\bREFERENCES\s+(?:dbo\.)?\[?\w+\]?\s*\(/gi) || []).length
	)
		throw Error('SCHEMA_MANIFEST_REFERENCE_REVIEW_REQUIRED: ' + migration.version);
}
if (new Set(tables).size !== tables.length) throw Error('SCHEMA_MANIFEST_TABLE_REVIEW_REQUIRED');
const manifest = {
	migrationVersions: migrations.map((m) => m.version),
	tables: tables.sort(),
	foreignKeys: foreignKeys.sort()
};
fs.writeFileSync(
	path.join(__dirname, '../database/sqlserver/schema-manifest.json'),
	JSON.stringify(manifest, null, 2) + '\n'
);
console.log(
	'Source schema manifest: ' +
		tables.length +
		' tables, ' +
		foreignKeys.length +
		' foreign keys; no database access.'
);
