function cookieOptions(config) {
  return { httpOnly: true, secure: config.AUTH_COOKIE_SECURE, sameSite: 'lax', path: '/' };
}
function createAuthController(service, config) {
  return {
    async login(req, res) {
      const result = await service.login(req.body.username, req.body.password, req.cookies.warehouse_session, res.locals.correlationId);
      res.cookie('warehouse_session', result.token, { ...cookieOptions(config), maxAge: 8 * 60 * 60_000 });
      res.json(result.session);
    },
    async me(req, res) { res.json(await service.me(req.cookies.warehouse_session)); },
    async logout(req, res) {
      await service.logout(req.cookies.warehouse_session, req.get('X-CSRF-Token'), req.get('Idempotency-Key'), res.locals.correlationId);
      res.clearCookie('warehouse_session', cookieOptions(config));
      res.status(204).end();
    },
  };
}
module.exports = { createAuthController, cookieOptions };
