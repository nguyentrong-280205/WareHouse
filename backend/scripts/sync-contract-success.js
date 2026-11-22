// Align existing success responses with context.write/controller HTTP statuses.
// Source-only: no server, database, migrations, or tests are started.
const fs = require('node:fs'),
	path = require('node:path');
const created = new Set([
	'warehouses.createLocation',
	'receipts.allocate',
	'issues.allocate',
	'stocktakes.count',
	'reports.configureAlert',
	'materialDeliveries.register'
]);
let changed = 0;
const contracts = {};
for (const name of ['api_contract.yaml', 'runtime_api.json']) {
	const file = path.resolve(__dirname, '../../docs', name),
		api = JSON.parse(fs.readFileSync(file, 'utf8'));
	contracts[name] = api;
	for (const item of Object.values(api.paths))
		for (const [method, operation] of Object.entries(item)) {
			if (!operation.operationId) continue;
			const expected =
				operation.operationId === 'auth.logout'
					? '204'
					: method === 'post' &&
						  (operation.operationId.endsWith('.create') ||
								created.has(operation.operationId))
						? '201'
						: '200';
			const success = Object.keys(operation.responses).filter((code) => /^2\d\d$/.test(code));
			if (success.length !== 1)
				throw Error('SUCCESS_STATUS_REVIEW_REQUIRED: ' + operation.operationId);
			if (success[0] !== expected) {
				operation.responses[expected] = operation.responses[success[0]];
				delete operation.responses[success[0]];
				changed++;
			}
		}
}
const planned = contracts['api_contract.yaml'],
	runtime = contracts['runtime_api.json'];
// Mirror the server's planned-contract merge so newly added operations cannot
// disappear from the checked-in runtime documentation (including catalog unlock).
for (const [url, item] of Object.entries(planned.paths))
	runtime.paths['/api/v1' + url] = {
		...runtime.paths['/api/v1' + url],
		...structuredClone(item)
	};
for (const [group, values] of Object.entries(planned.components))
	runtime.components[group] = { ...runtime.components[group], ...structuredClone(values) };
for (const [name, api] of Object.entries(contracts))
	fs.writeFileSync(
		path.resolve(__dirname, '../../docs', name),
		JSON.stringify(api, null, 2) + '\n'
	);
console.log('Synchronized success responses: ' + changed + '; no application/database execution.');
