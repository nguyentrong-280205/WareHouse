async function checkConnection(connection) {
  await connection.execute('SELECT 1 AS ok');
}
module.exports = { checkConnection };
