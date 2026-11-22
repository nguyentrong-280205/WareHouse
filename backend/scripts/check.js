const { Script } = require('node:vm');
const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
function walk(dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]
	);
}
for (const file of ['src', 'database', 'scripts', 'tests']
	.flatMap(walk)
	.filter((p) => p.endsWith('.js'))) {
	try {
		new Script(readFileSync(file, 'utf8'), { filename: file });
	} catch (error) {
		console.error('SYNTAX_CHECK_FAILED: ' + file + ' ' + error.message);
		process.exit(1);
	}
}
console.log('CommonJS JavaScript syntax checks passed.');
