// Approved targets: Windows HTTT02 or the isolated warehouse SQL Server container.
function matchesIdentity(row, config) {
  if (config?.machine === 'warehouse-sqlserver') {
    return row.instance_name === null && row.machine_name?.toLowerCase() === config.machine;
  }
  return row.instance_name === (config?.instance || 'HTTT02');
}
module.exports = { matchesIdentity };
