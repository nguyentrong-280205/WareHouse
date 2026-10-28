const assert = require('node:assert/strict');
const { splitSql } = require('./sql.js');

// Legacy mysql CLI and ORM used different introducers for identical ASCII literals.
const normalizeCheck = value => value.replace(/_(?:utf8mb4|utf8mb3|latin1)(?=\\?')/g, '').replace(/\\'/g, "'")
  .replace(/[`\s()]/g, '').toLowerCase();
const normalizeType = value => {
  const normalized = value.replace(/^INTEGER/i, 'int').replace(/,\s+/g, ',');
  return /^ENUM/i.test(normalized) ? 'enum' + normalized.slice(4) : normalized.toLowerCase();
};
const sort = values => values.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

// This parser describes the two reviewed foundation migrations, not arbitrary SQL.
function expectedFoundation(source) {
  const expected = {};
  for (const statement of splitSql(source)) {
    const create = statement.match(/^CREATE TABLE `([^`]+)` \(([\s\S]+)\) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci$/);
    if (create) {
      const table = expected[create[1]] = { columns: [], indexes: [], foreignKeys: [], checks: [] };
      for (const line of create[2].split('\n').map(value => value.trim().replace(/,$/, ''))) {
        const column = line.match(/^`([^`]+)` ((?:ENUM\([^)]*\)|[A-Z]+(?:\(\d+(?:,\d+)?\))?)(?: UNSIGNED)?) (.*)$/);
        if (column) {
          const [, name, type, modifiers] = column;
          const defaultMatch = modifiers.match(/DEFAULT ('[^']*'|\S+)/);
          const defaultValue = defaultMatch ? defaultMatch[1].replace(/^'|'$/g, '') : null;
          table.columns.push({ name, type: normalizeType(type), nullable: !modifiers.includes('NOT NULL'),
            default: defaultValue, auto: modifiers.includes('AUTO_INCREMENT'),
            collation: /^(varchar|char|text|enum)/i.test(type) ? 'utf8mb4_0900_ai_ci' : null });
        }
        const index = line.match(/^(UNIQUE )?INDEX `([^`]+)`\(([^)]+)\)$/);
        if (index) table.indexes.push({ name: index[2], unique: !!index[1], columns: [...index[3].matchAll(/`([^`]+)`/g)].map(m => m[1]) });
        const primary = line.match(/^PRIMARY KEY \(([^)]+)\)$/);
        if (primary) table.indexes.push({ name: 'PRIMARY', unique: true, columns: [...primary[1].matchAll(/`([^`]+)`/g)].map(m => m[1]) });
      }
      continue;
    }
    const modify = statement.match(/^ALTER TABLE `([^`]+)` MODIFY `([^`]+)` .* COLLATE (\w+) NOT NULL$/);
    if (modify) { expected[modify[1]].columns.find(column => column.name === modify[2]).collation = modify[3]; continue; }
    const fk = statement.match(/^ALTER TABLE `([^`]+)` ADD CONSTRAINT `([^`]+)` FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)`\(`([^`]+)`\) ON DELETE (\w+) ON UPDATE (\w+)$/);
    if (fk) {
      const table = expected[fk[1]];
      table.foreignKeys.push({ name: fk[2], column: fk[3], table: fk[4], reference: fk[5], delete: fk[6], update: fk[7] });
      if (!table.indexes.some(index => index.columns[0] === fk[3])) table.indexes.push({ name: fk[2], unique: false, columns: [fk[3]] });
      continue;
    }
    const check = statement.match(/^ALTER TABLE `([^`]+)` ADD CONSTRAINT `([^`]+)` CHECK \(([\s\S]+)\)$/);
    if (check) { expected[check[1]].checks.push({ name: check[2], expression: normalizeCheck(check[3]) }); continue; }
    throw new Error('UNSUPPORTED_FOUNDATION_SQL');
  }
  if (Object.keys(expected).length !== 8) throw new Error('INVALID_FOUNDATION_TABLE_COUNT');
  return expected;
}

async function verifyFoundation(connection, source) {
  const expected = expectedFoundation(source);
  for (const [name, table] of Object.entries(expected)) {
    const [tables] = await connection.execute('SELECT ENGINE,TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?', [name]);
    assert.equal(tables.length, 1, 'MISSING_TABLE: ' + name);
    assert.deepEqual(tables[0], { ENGINE: 'InnoDB', TABLE_COLLATION: 'utf8mb4_0900_ai_ci' });
    const [columns] = await connection.execute('SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT,EXTRA,COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY ORDINAL_POSITION', [name]);
    assert.ok(columns.every(column => ['', 'auto_increment', 'DEFAULT_GENERATED'].includes(column.EXTRA)), 'COLUMN_EXTRA_DRIFT: ' + name);
    assert.deepEqual(columns.map(column => ({ name: column.COLUMN_NAME, type: normalizeType(column.COLUMN_TYPE),
      nullable: column.IS_NULLABLE === 'YES', default: column.COLUMN_DEFAULT,
      auto: column.EXTRA.includes('auto_increment'), collation: column.COLLATION_NAME })), table.columns, 'COLUMN_DRIFT: ' + name);
    const [indexes] = await connection.execute('SELECT INDEX_NAME,NON_UNIQUE,COLUMN_NAME,SEQ_IN_INDEX,SUB_PART,INDEX_TYPE,IS_VISIBLE,EXPRESSION FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY INDEX_NAME,SEQ_IN_INDEX', [name]);
    const grouped = {};
    for (const index of indexes) {
      assert.ok(index.SUB_PART === null && index.INDEX_TYPE === 'BTREE' && index.IS_VISIBLE === 'YES' && index.EXPRESSION === null, 'INDEX_DRIFT');
      grouped[index.INDEX_NAME] ??= { name: index.INDEX_NAME, unique: Number(index.NON_UNIQUE) === 0, columns: [] };
      grouped[index.INDEX_NAME].columns.push(index.COLUMN_NAME);
    }
    assert.deepEqual(sort(Object.values(grouped)), sort(table.indexes), 'INDEX_DRIFT: ' + name);
    const [keys] = await connection.execute('SELECT k.CONSTRAINT_NAME,k.COLUMN_NAME,k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,r.DELETE_RULE,r.UPDATE_RULE FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME WHERE k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME=?', [name]);
    assert.deepEqual(sort(keys.map(key => ({ name: key.CONSTRAINT_NAME, column: key.COLUMN_NAME, table: key.REFERENCED_TABLE_NAME,
      reference: key.REFERENCED_COLUMN_NAME, delete: key.DELETE_RULE, update: key.UPDATE_RULE }))), sort(table.foreignKeys), 'FK_DRIFT: ' + name);
    const [checks] = await connection.execute("SELECT tc.CONSTRAINT_NAME,tc.ENFORCED,cc.CHECK_CLAUSE FROM information_schema.TABLE_CONSTRAINTS tc JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME WHERE tc.CONSTRAINT_SCHEMA=DATABASE() AND tc.TABLE_NAME=? AND tc.CONSTRAINT_TYPE='CHECK'", [name]);
    assert.ok(checks.every(check => check.ENFORCED === 'YES'), 'CHECK_NOT_ENFORCED');
    assert.deepEqual(sort(checks.map(check => ({ name: check.CONSTRAINT_NAME, expression: normalizeCheck(check.CHECK_CLAUSE) }))), sort(table.checks), 'CHECK_DRIFT: ' + name);
  }
  const [markerColumns] = await connection.execute("SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='_warehouse_environment' ORDER BY ORDINAL_POSITION");
  assert.deepEqual(markerColumns.map(c => [c.COLUMN_NAME, c.COLUMN_TYPE, c.IS_NULLABLE]), [['id','tinyint unsigned','NO'],['environment','varchar(16)','NO'],['instance_id','char(36)','NO']]);
  const [marker] = await connection.execute("SELECT ENGINE,TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='_warehouse_environment'");
  assert.deepEqual(marker[0], { ENGINE: 'InnoDB', TABLE_COLLATION: 'utf8mb4_0900_ai_ci' });
  const [markerIndexes] = await connection.execute("SELECT INDEX_NAME,NON_UNIQUE,COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='_warehouse_environment'");
  assert.deepEqual(markerIndexes.map(index => ({ ...index, NON_UNIQUE: Number(index.NON_UNIQUE) })), [{ INDEX_NAME: 'PRIMARY', NON_UNIQUE: 0, COLUMN_NAME: 'id' }]);
  const [markerChecks] = await connection.execute("SELECT cc.CHECK_CLAUSE,tc.ENFORCED FROM information_schema.TABLE_CONSTRAINTS tc JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME WHERE tc.CONSTRAINT_SCHEMA=DATABASE() AND tc.TABLE_NAME='_warehouse_environment' AND tc.CONSTRAINT_TYPE='CHECK'");
  assert.ok(markerChecks.every(check => check.ENFORCED === 'YES'));
  assert.deepEqual(markerChecks.map(check => normalizeCheck(check.CHECK_CLAUSE)).sort(), ["environment='test'", 'id=1'].sort());
  return Object.keys(expected);
}
module.exports = { expectedFoundation, verifyFoundation, normalizeCheck };
