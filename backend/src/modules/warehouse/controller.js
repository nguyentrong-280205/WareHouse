function requestContext(req,res) { return {body:req.body,params:req.params,query:req.validatedQuery || {},principal:res.locals.principal,permissions:req.operationPermissions,key:req.get('Idempotency-Key'),correlationId:res.locals.correlationId}; }
function createWarehouseController(service) {
  const handlers={};
  for (const kind of ['materials','products','warehouses','materialLots','productLots']) {
    handlers[kind+'.list']=async(req,res)=>res.json(await service.list(kind,requestContext(req,res)));
    handlers[kind+'.read']=async(req,res)=>res.json(await service.read(kind,requestContext(req,res)));
    for (const action of ['create','update','lock']) handlers[kind+'.'+action]=async(req,res)=>{ const result=await service.mutate(kind,action,requestContext(req,res)); res.status(result.status).json(result.body); };
  }
  handlers['locations.list']=async(req,res)=>res.json(await service.locations(requestContext(req,res)));
  handlers['warehouses.createLocation']=async(req,res)=>{const r=await service.createLocation(requestContext(req,res));res.status(r.status).json(r.body);};
  handlers['warehouses.updateLocation']=async(req,res)=>{const r=await service.updateLocation(requestContext(req,res));res.status(r.status).json(r.body);};
  return handlers;
}
module.exports={createWarehouseController,requestContext};
