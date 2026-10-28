#!/bin/bash
set -euo pipefail
export SQLCMDPASSWORD="$(cat /run/secrets/sa_password)"
if [ -x /opt/mssql-tools18/bin/sqlcmd ]; then
  exec /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -b -l 3 -Q 'SET NOCOUNT ON; SELECT 1' >/dev/null
else
  exec /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -C -b -l 3 -Q 'SET NOCOUNT ON; SELECT 1' >/dev/null
fi
