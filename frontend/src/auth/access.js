const routes = {
  '/warehouse-assignments':['issues.allocate','issues.postMaterial'],
  '/materials/catalog':['materials.read'], '/finished-goods/catalog':['products.read'], '/orders':['orders.read'],
  '/dashboard': ['reports.read'], '/reports': ['reports.read'],
  '/purchases':['purchases.read','purchases.decide'],
  '/material-deliveries':['receipts.postMaterial','materialQc.read','receipts.allocate'],
  '/material-requests':['materialRequests.read'], '/product-requests':['productRequests.read'],
  '/finished-goods/qc':['productQc.read'], '/returns/qc':['returnQc.read'],
  '/deliveries':['deliveries.confirm','returnRequests.create'],
  '/returns/requests':['returnRequests.create','returnReceptions.post','unknownReturns.resolve'],
  '/returns/receptions':['returnReceptions.post','returnQc.read'],
  '/returns/receipts':['receipts.allocate','receipts.postReturn'],
  '/returns/unidentified':['returnReceptions.post','unknownReturns.resolve'],
  '/returns/dispositions':['dispositions.create','dispositions.execute','dispositions.decide'],
  '/returns/rejected-receipts':['receipts.allocate','dispositions.execute'],
  '/inventory':['inventory.search'], '/reports/alert-rules':['reports.configureAlerts'],
  '/production-orders':['plans.read','plans.decide'],
  '/production-plans': ['plans.read', 'plans.decide'], '/workshop-assignments': ['plans.read'],
  '/materials/receipts': ['receipts.postMaterial', 'receipts.allocate'],
  '/materials/issues': ['issues.postMaterial', 'issues.allocate'],
  '/materials/qc': ['materialQc.read', 'materialQc.create'],
  '/finished-goods/receipts': ['receipts.postProduct', 'receipts.allocate'],
  '/finished-goods/issues': ['issues.postSale', 'issues.allocate'],
  '/inventory-counts': ['stocktakes.create','stocktakes.count', 'variances.verify', 'adjustments.decide'],
  '/lots': ['productLots.read', 'materialLots.read'], '/storage-locations': ['warehouses.read'],
};
export function canAccessPath(session, path) {
  if (!session) return false;
  if (path === '/') return true;
  return (routes[path] || []).some(permission => session.permissions.includes(permission));
}
