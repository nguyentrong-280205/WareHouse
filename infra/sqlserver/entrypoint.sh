#!/bin/bash
set -euo pipefail
export MSSQL_SA_PASSWORD="$(cat /run/secrets/sa_password)"
exec /opt/mssql/bin/sqlservr
