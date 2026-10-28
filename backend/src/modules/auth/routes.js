const { Router } = require('express');
const { z } = require('zod');
const { AppError, validateBody } = require('../../shared/http.js');
const { createAuthController } = require('./controller.js');
const password = z.string().refine(value => { const n = Array.from(value).length; return n >= 12 && n <= 128; });
const loginInput = z.object({ username: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_.-]{0,99}$/), password }).strict();
function inputFor(config){return loginInput.extend({password:z.string()}).superRefine((body,ctx)=>{const n=Array.from(body.password).length,min=require('./simple-demo').allowed(config,body.username)?6:12;if(n<min||n>128)ctx.addIssue({code:z.ZodIssueCode.custom,path:['password'],message:'Độ dài mật khẩu không hợp lệ.'});});}
function createAuthRouter(service, config) {
  const router = Router(), controller = createAuthController(service, config);
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.post('/login', (req, _res, next) => {
    if (!config.origins.includes(req.get('Origin'))) return next(new AppError(403, 'ORIGIN_FORBIDDEN', 'Origin required and must be allowed'));
    if (!req.is('application/json')) return next(new AppError(400, 'JSON_REQUIRED', 'JSON body required'));
    next();
  }, validateBody(inputFor(config)), controller.login);
  router.get('/me', controller.me);
  router.post('/logout', controller.logout);
  return router;
}
module.exports = { createAuthRouter, loginInput };
