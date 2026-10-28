const {createBusinessContext}=require('./shared/business-context');
function createBusiness(pool,config,contract){
  const context=createBusinessContext(pool,config);
  const handlers={
    ...require('./modules/production/assignment-controller').createAssignmentController(require('./modules/production/assignment-service').createAssignmentService(context)),
    ...require('./modules/orders/draft-deletion').createDraftDeletionHandlers(context),
    ...require('./modules/warehouse/controller').createWarehouseController(require('./modules/warehouse/service').createWarehouseService(context)),
    ...require('./modules/orders/controller').createOrderController(require('./modules/orders/service').createOrderService(context)),
    ...require('./modules/customers/controller').createLookupController(require('./modules/customers/service').createLookupService(context)),
    ...require('./modules/production/controller').createProductionController(require('./modules/production/service').createProductionService(context)),
    ...require('./modules/production/request-controller').createRequestController(require('./modules/production/request-service').createRequestService(context)),
    ...require('./modules/purchasing/controller').createPurchasingController(require('./modules/purchasing/service').createPurchasingService(context)),
    ...require('./modules/qc/controller').createQcController(require('./modules/qc/service').createQcService(context)),
    ...require('./modules/inventory/controller').createInventoryController(require('./modules/inventory/service').createInventoryService(context)),
    ...require('./modules/returns/controller').createReturnController(require('./modules/returns/service').createReturnService(context)),
    ...require('./modules/stocktake/controller').createStocktakeController(require('./modules/stocktake/service').createStocktakeService(context)),
    ...require('./modules/evidence/controller').createEvidenceController(require('./modules/evidence/service').createEvidenceService(context)),
    ...require('./modules/reports/controller').createReportController(require('./modules/reports/service').createReportService(context)),
    ...require('./modules/dispositions/controller').createDispositionController(require('./modules/dispositions/service').createDispositionService(context)),
    ...require('./modules/returns/unknown-controller').createUnknownReturnController(require('./modules/returns/unknown-service').createUnknownReturnService(context)),
    ...require('./modules/customers/source-controller').createSourceLookupController(require('./modules/customers/source-service').createSourceLookupService(context)),
  };
  return{context,handlers,router:require('./modules/warehouse/routes').createWarehouseRouter(handlers,contract)};
}
module.exports={createBusiness};
