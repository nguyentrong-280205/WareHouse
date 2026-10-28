const{requestContext}=require('../warehouse/controller');
function createUnknownReturnController(service){const h={};for(const a of ['list','read','create','resolve'])h['unknownReturns.'+a]=async(req,res)=>{const r=await service[a](requestContext(req,res));if(a==='list'||a==='read')res.json(r);else res.status(r.status).json(r.body);};return h;}
module.exports={createUnknownReturnController};
