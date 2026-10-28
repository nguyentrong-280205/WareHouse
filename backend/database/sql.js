// Split reviewed SQL while respecting strings, identifiers and comments.
function splitSql(source) {
  const statements = [];
  let current = '', quote = null, lineComment = false, blockComment = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i], next = source[i + 1];
    if (lineComment) { if (char === '\n') { lineComment = false; current += '\n'; } continue; }
    if (blockComment) { if (char === '*' && next === '/') { blockComment = false; i++; current += ' '; } continue; }
    if (quote) {
      current += char;
      if (char === '\\' && next) { current += next; i++; }
      else if (char === quote) {
        if (next === quote) { current += next; i++; } else quote = null;
      }
      continue;
    }
    if (char === '-' && next === '-' && /\s/.test(source[i + 2] || ' ')) { lineComment = true; i++; continue; }
    if (char === '#') { lineComment = true; continue; }
    if (char === '/' && next === '*') { blockComment = true; i++; continue; }
    if (["'", '"', '`'].includes(char)) quote = char;
    if (char === ';') { if (current.trim()) statements.push(current.trim()); current = ''; }
    else current += char;
  }
  if (quote || blockComment) throw new Error('INVALID_MIGRATION_SQL');
  if (current.trim()) statements.push(current.trim());
  return statements;
}
module.exports = { splitSql };
