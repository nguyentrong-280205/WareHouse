param([int]$BackendPort=3001)
$ErrorActionPreference='Stop'
if($BackendPort -lt 1 -or $BackendPort -gt 65535){throw 'INVALID_BACKEND_PORT'}
$workspace=Split-Path $PSScriptRoot -Parent
Push-Location $workspace
try{
 . ./scripts/use-node.ps1
 node scripts/setup-docker.js
 if($LASTEXITCODE -ne 0){throw 'DOCKER_SECRET_SETUP_FAILED'}
 $env:BACKEND_PORT=[string]$BackendPort
 docker compose up -d --build
 if($LASTEXITCODE -ne 0){throw 'WAREHOUSE_DOCKER_START_FAILED'}
}finally{Pop-Location}
