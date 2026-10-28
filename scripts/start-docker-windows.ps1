param([int]$BackendPort=3001)
$ErrorActionPreference='Stop'
if($BackendPort -lt 1 -or $BackendPort -gt 65535){throw 'INVALID_BACKEND_PORT'}
$workspace=Split-Path $PSScriptRoot -Parent
Add-Type -AssemblyName System.Data
$builder=New-Object System.Data.SqlClient.SqlConnectionStringBuilder
$builder['Data Source']='tcp:NGUYENTRONG-200\HTTT02'
$builder['Initial Catalog']='master'
$builder['Integrated Security']=$true
$builder['Encrypt']=$true
$builder['TrustServerCertificate']=$true
$builder['Connect Timeout']=8
$connection=New-Object System.Data.SqlClient.SqlConnection($builder.ConnectionString)
try{
 $connection.Open()
 $command=$connection.CreateCommand()
 $command.CommandText="SELECT CONVERT(nvarchar(128),SERVERPROPERTY('InstanceName')) AS instance_name,local_tcp_port FROM sys.dm_exec_connections WHERE session_id=@@SPID"
 $reader=$command.ExecuteReader()
 try{
  if(!$reader.Read() -or $reader.GetString(0) -ne 'HTTT02' -or $reader.IsDBNull(1)){throw 'UNVERIFIED_SQLSERVER_TCP_ENDPOINT'}
  $discoveredPort=[int]$reader.GetValue(1)
 }finally{$reader.Dispose();$command.Dispose()}
}catch{throw 'SQLSERVER_DISCOVERY_FAILED: ensure HTTT02 is running and current Windows login can connect; no database changes performed.'}
finally{$connection.Dispose()}
Push-Location $workspace
try{
 . ./scripts/use-node.ps1
 node backend/scripts/refresh-sqlserver-endpoint.js $discoveredPort
 if($LASTEXITCODE -ne 0){throw 'SQLSERVER_ENDPOINT_REFRESH_FAILED'}
 $env:BACKEND_PORT=[string]$BackendPort
 docker compose -f infra/compose.windows.yaml --profile app up -d --build
 if($LASTEXITCODE -ne 0){throw 'DOCKER_COMPOSE_START_FAILED'}
}finally{Pop-Location}
