const { getHealth } = require('./service.js');
function createHealthController(probe) {
  return async (_request, response) => {
    const data = await getHealth(probe);
    response.status(data.database === 'connected' ? 200 : 503)
      .json({ data, meta: { correlationId: response.locals.correlationId } });
  };
}
module.exports = { createHealthController };
