const{requestContext}=require('../warehouse/controller');
function createEvidenceController(service){return{'evidence.create':async(req,res)=>{const r=await service.create(requestContext(req,res));res.status(r.status).json(r.body);},'evidence.read':async(req,res)=>{const r=await service.read(requestContext(req,res));res.set('Content-Type',r.mediaType).set('Content-Disposition',"attachment; filename*=UTF-8''"+encodeURIComponent(r.fileName)).set('X-Content-Type-Options','nosniff').send(r.bytes);}};}
module.exports={createEvidenceController};
