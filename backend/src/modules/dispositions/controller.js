const{requestContext}=require('../warehouse/controller');
function createDispositionController(service){const h={};for(const a of ['list','read'])h['dispositions.'+a]=async(req,res)=>res.json(await service[a](requestContext(req,res)));h['dispositions.create']=async(req,res)=>{const r=await service.create(requestContext(req,res));res.status(r.status).json(r.body);};for(const a of ['submit','decide','execute'])h['dispositions.'+a]=async(req,res)=>{const r=await service.command(a,requestContext(req,res));res.status(r.status).json(r.body);};return h;}
module.exports={createDispositionController};
