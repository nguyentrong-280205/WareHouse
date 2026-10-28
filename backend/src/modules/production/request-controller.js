const {requestContext}=require('../warehouse/controller');
function createRequestController(service){
  const handlers={};
  for(const kind of ['materialRequests','productRequests'])for(const action of ['list','read','create','submit'])handlers[kind+'.'+action]=async(req,res)=>{
    const result=await service[action](kind,requestContext(req,res));
    if(action==='list'||action==='read')res.json(result);else res.status(result.status).json(result.body);
  };
  return handlers;
}
module.exports={createRequestController};
