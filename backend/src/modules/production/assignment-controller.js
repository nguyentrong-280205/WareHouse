const{requestContext}=require('../warehouse/controller');
function createAssignmentController(service){return Object.fromEntries(['list','options','assign'].map(action=>['materialAssignments.'+action,async(req,res)=>{const result=await service[action](requestContext(req,res));if(action==='assign')res.status(result.status).json(result.body);else res.json(result);} ]));}
module.exports={createAssignmentController};
