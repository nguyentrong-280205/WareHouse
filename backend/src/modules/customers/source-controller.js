const{requestContext}=require('../warehouse/controller');
function createSourceLookupController(service){return Object.fromEntries(['material-deliveries','qc-sources','allocation-sources','rework-batches','count-members','approved-plans','warehouses','product-lots','count-lots','material-lots','alert-items','approved-purchases'].map(k=>['lookups.'+k,async(req,res)=>res.json(await service.lookup(k,requestContext(req,res)))]));}
module.exports={createSourceLookupController};
