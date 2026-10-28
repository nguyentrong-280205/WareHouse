function createAuthenticate(service) {
  return async (req, res, next) => {
    try {
      res.locals.principal = await service.me(req.cookies?.warehouse_session);
      res.set('X-Session-Idle-Expires-At',res.locals.principal.idleExpiresAt);
      next();
    } catch (error) { next(error); }
  };
}
module.exports = { createAuthenticate };
