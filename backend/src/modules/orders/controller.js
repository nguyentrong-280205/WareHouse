const {requestContext}=require('../warehouse/controller');
function createOrderController(service){const handlers={};for(const action of ['list','read'])handlers['orders.'+action]=async(req,res)=>res.json(await service[action](requestContext(req,res)));for(const action of ['create','submit'])handlers['orders.'+action]=async(req,res)=>{const r=await service[action](requestContext(req,res));res.status(r.status).json(r.body);};return handlers;}
module.exports={createOrderController};
