const {requestContext}=require('../warehouse/controller');
function createLookupController(service){return Object.fromEntries(['units','products','materials','workshops','suppliers','orders','planLines'].map(kind=>['lookups.'+kind,async(req,res)=>res.json(await service.lookup(kind,requestContext(req,res)))]));}
module.exports={createLookupController};
