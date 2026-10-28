async function getHealth(probe) {
  let database = 'connected';
  try { await probe(); } catch { database = 'unavailable'; }
  return { status: database === 'connected' ? 'ok' : 'degraded',
    application: 'running', database, service: 'warehouse-foundation' };
}
module.exports = { getHealth };
