const argon2 = require('argon2');
function passwordOptions(config) {
  return { type: argon2.argon2id, memoryCost: config.ARGON2_MEMORY_COST,
    timeCost: config.ARGON2_TIME_COST, parallelism: config.ARGON2_PARALLELISM };
}
function hashPassword(password, config) { return argon2.hash(password, passwordOptions(config)); }
async function verifyPassword(hash, password) {
  if (!hash.startsWith('$argon2id$')) return false;
  try { return await argon2.verify(hash, password); } catch { return false; }
}
module.exports = { hashPassword, verifyPassword, passwordOptions };
