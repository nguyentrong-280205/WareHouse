// SQL Server LIKE also treats '[' as a pattern character.
const contains = value => '%' + value.replace(/[~%_\[]/g, '~$&') + '%';
module.exports = { contains };
