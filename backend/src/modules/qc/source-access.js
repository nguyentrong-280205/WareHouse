const { fail, scope } = require('../../shared/business-context');

// QC and warehouse allocation must authorize the same source, including rework.
function assertSourceScope(principal, definition, origin) {
	if (origin._rework || definition.scope === 'warehouse')
		return scope(principal, origin.warehouse_id);
	if (!principal.workshopIds.includes(String(origin.workshop_id)))
		fail(403, 'WORKSHOP_SCOPE', 'Không được cấp phạm vi xưởng nguồn QC.');
}
module.exports = { assertSourceScope };
