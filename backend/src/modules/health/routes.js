const express = require('express');
const { createHealthController } = require('./controller.js');
function createHealthRouter(probe) {
  const router = express.Router();
  const controller = createHealthController(probe);
  router.get('/health', controller);
  router.get('/api/v1/health', controller);
  return router;
}
module.exports = { createHealthRouter };
