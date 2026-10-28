const {requestContext}=require('../warehouse/controller');
function createPurchasingController(service){const h={};for(const a of ['list','read'])h['purchases.'+a]=async(req,res)=>res.json(await service[a](requestContext(req,res)));for(const a of ['create','submit','decide'])h['purchases.'+a]=async(req,res)=>{const r=await service[a](requestContext(req,res));res.status(r.status).json(r.body);};return h;}
module.exports={createPurchasingController};
