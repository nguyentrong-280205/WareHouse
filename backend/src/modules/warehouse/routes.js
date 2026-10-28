const {Router}=require('express');
const {validateOperation}=require('../../shared/contract-validation');
const {AppError}=require('../../shared/http');
function createWarehouseRouter(handlers,contract) {
  const router=Router();
  for(const[path,item]of Object.entries(contract.paths))for(const[method,operation]of Object.entries(item)) {
    const handler=handlers[operation.operationId]; if(!handler)continue;
    router[method](path.replace(/\{(\w+)\}/g,':$1'),(req,res,next)=>{
      const principal=res.locals.principal;
      const grants=operation['x-permissions']||[];
      req.operationPermissions=grants;
      if(!principal || !grants.some(p=>principal.permissions.includes(p)))return next(new AppError(principal?403:401,'FORBIDDEN','Không có quyền thực hiện chức năng.'));
      next();
    },validateOperation(operation,contract),handler);
  }
  return router;
}
module.exports={createWarehouseRouter};
