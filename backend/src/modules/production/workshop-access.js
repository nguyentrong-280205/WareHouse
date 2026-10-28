function workshopReader(principal){return principal.permissions?.includes('materialRequests.create')&&!principal.permissions.includes('plans.create')&&!principal.permissions.includes('plans.decide');}
module.exports={workshopReader};
