param([string]$Server = 'NGUYENTRONG-200\HTTT02')
$ErrorActionPreference = 'Stop'
$workspace = Split-Path $PSScriptRoot -Parent
$privateDir = Join-Path $workspace 'backend/.artifacts/sqlserver'
New-Item -ItemType Directory -Force -Path $privateDir | Out-Null
Add-Type -AssemblyName System.Data
$connection = New-Object System.Data.SqlClient.SqlConnection
$builder = New-Object System.Data.SqlClient.SqlConnectionStringBuilder
$builder['Data Source'] = $Server
$builder['Initial Catalog'] = 'master'
$builder['Integrated Security'] = $true
$builder['Encrypt'] = $true
$builder['TrustServerCertificate'] = $true
$builder['Connect Timeout'] = 8
$connection.ConnectionString = $builder.ConnectionString
function Query([string]$Sql) {
    $command = $connection.CreateCommand()
    $command.CommandText = $Sql
    $command.CommandTimeout = 30
    $table = New-Object System.Data.DataTable
    $reader = $command.ExecuteReader()
    try { $table.Load($reader) } finally { $reader.Dispose(); $command.Dispose() }
    return ,$table
}
function Execute([string]$Sql) {
    $command = $connection.CreateCommand()
    $command.CommandText = $Sql
    $command.CommandTimeout = 60
    try { [void]$command.ExecuteNonQuery() } finally { $command.Dispose() }
}
function Secret {
    $bytes = New-Object byte[] 36
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return [Convert]::ToBase64String($bytes)
}
try {
    $connection.Open()
    # Force a second TCP connection to discover the named instance's actual endpoint.
    $builder['Data Source'] = 'tcp:' + $Server
    $connection.Close()
    $connection.ConnectionString = $builder.ConnectionString
    $connection.Open()
    $info = (Query "SELECT CONVERT(nvarchar(128),SERVERPROPERTY('InstanceName')) instance_name, CONVERT(int,SERVERPROPERTY('IsIntegratedSecurityOnly')) windows_only, IS_SRVROLEMEMBER('sysadmin') administrator, local_tcp_port port FROM sys.dm_exec_connections WHERE session_id=@@SPID").Rows[0]
    if ($info.instance_name -ne 'HTTT02' -or $info.administrator -ne 1 -or $info.windows_only -ne 0 -or !$info.port) { throw 'SQLSERVER_INSTANCE_OR_PERMISSION_MISMATCH' }
    $manifestPath = Join-Path $privateDir 'bootstrap.json'
    if (Test-Path -LiteralPath $manifestPath) { throw 'BOOTSTRAP_ALREADY_RECORDED_NO_OVERWRITE' }
    # No existing database or login is adopted, altered, dropped, or overwritten.
    foreach ($dbName in @('warehouse_db','warehouse_test')) {
        if ((Query "SELECT DB_ID(N'$dbName') AS id").Rows[0].id -isnot [DBNull]) { throw 'EXISTING_DATABASE_REQUIRES_REVIEW' }
    }
    $accounts = @('warehouse_app','warehouse_migration','warehouse_test_app','warehouse_test_migration')
    foreach ($login in $accounts) {
        if ((Query "SELECT COUNT(*) AS n FROM sys.server_principals WHERE name=N'$login'").Rows[0].n -ne 0) { throw 'EXISTING_LOGIN_REQUIRES_REVIEW' }
    }
    $credentials = @{}
    foreach ($login in $accounts) { $credentials[$login] = Secret }
    $marker = [guid]::NewGuid().ToString()
    # Persist recovery credentials BEFORE server writes; this directory is Git-ignored.
    @{ server=$Server; port=[int]$info.port; testMarker=$marker; credentials=$credentials; state='PREPARED' } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
    foreach ($dbName in @('warehouse_db','warehouse_test')) {
        Execute "CREATE DATABASE [$dbName] COLLATE Latin1_General_100_CI_AI_SC"
        Execute "ALTER DATABASE [$dbName] SET READ_COMMITTED_SNAPSHOT OFF"
        Execute "ALTER DATABASE [$dbName] SET ALLOW_SNAPSHOT_ISOLATION OFF"
    }
    foreach ($login in $accounts) {
        $dbName = if ($login.StartsWith('warehouse_test_')) { 'warehouse_test' } else { 'warehouse_db' }
        $passwordSql = $credentials[$login].Replace("'", "''")
        Execute "CREATE LOGIN [$login] WITH PASSWORD=N'$passwordSql', CHECK_POLICY=ON, CHECK_EXPIRATION=OFF, DEFAULT_DATABASE=[$dbName]"
        Execute "USE [$dbName]; CREATE USER [$login] FOR LOGIN [$login];"
        if ($login.EndsWith('_migration')) {
            Execute "USE [$dbName]; ALTER ROLE db_ddladmin ADD MEMBER [$login]; ALTER ROLE db_datareader ADD MEMBER [$login]; ALTER ROLE db_datawriter ADD MEMBER [$login];"
        } else {
            Execute "USE [$dbName]; GRANT SELECT,INSERT,UPDATE,DELETE ON SCHEMA::dbo TO [$login];"
        }
    }
    Execute "USE [warehouse_test]; CREATE TABLE dbo._warehouse_environment(id tinyint NOT NULL PRIMARY KEY CHECK(id=1), environment nvarchar(16) NOT NULL CHECK(environment=N'test'), instance_id char(36) NOT NULL); INSERT INTO dbo._warehouse_environment VALUES(1,N'test','$marker');"
    $envPath = Join-Path $workspace 'backend/.env'
    if (Test-Path -LiteralPath $envPath) { Copy-Item -LiteralPath $envPath -Destination (Join-Path $privateDir 'mysql.env.backup') }
    $lines = if (Test-Path -LiteralPath $envPath) { [System.IO.File]::ReadAllLines($envPath) | Where-Object { $_ -notmatch '^(DATABASE_URL|MIGRATION_DATABASE_URL|TEST_DATABASE_URL|TEST_MIGRATION_DATABASE_URL|TEST_ALLOWED_ENDPOINTS|TEST_INSTANCE_ID|SHADOW_DATABASE_URL|SQLSERVER_EXPECTED_INSTANCE|SQLSERVER_EXPECTED_MACHINE)(_|=)' } } else { @() }
    if (-not ($lines -match '^CSRF_SECRET(_FILE)?=')) { $lines += 'CSRF_SECRET=' + (Secret) }
    if (-not ($lines -match '^CORS_ORIGINS=')) { $lines += 'CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080' }
    if (-not ($lines -match '^NODE_ENV=')) { $lines += 'NODE_ENV=development' }
    if (-not ($lines -match '^HOST=')) { $lines += 'HOST=127.0.0.1' }
    $hostName = $Server.Split('\')[0]
    $portNumber = [int]$info.port
    $keys = @('DATABASE_URL','MIGRATION_DATABASE_URL','TEST_DATABASE_URL','TEST_MIGRATION_DATABASE_URL')
    for ($i=0; $i -lt $accounts.Count; $i++) {
        $login=$accounts[$i]; $dbName=if($login.StartsWith('warehouse_test_')){'warehouse_test'}else{'warehouse_db'}
        $encoded=[Uri]::EscapeDataString($credentials[$login])
        $lines += $keys[$i] + '=sqlserver://' + $login + ':' + $encoded + '@' + $hostName + ':' + $portNumber + '/' + $dbName + '?instance=HTTT02&trustServerCertificate=true'
    }
    $lines += "TEST_ALLOWED_ENDPOINTS=${hostName}:$portNumber"
    $lines += "TEST_INSTANCE_ID=$marker"
    [System.IO.File]::WriteAllLines($envPath, [string[]]$lines, (New-Object System.Text.UTF8Encoding($false)))
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $manifest.state='DATABASES_CREATED'
    $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
    Write-Output "SQLSERVER_BOOTSTRAP_OK instance=HTTT02 tcp_port=$portNumber databases=warehouse_db,warehouse_test authentication=SQL_LOGIN credentials=LOCAL_IGNORED"
} catch {
    # SqlException messages may include account information. Keep diagnostics private.
    $_.Exception.ToString() | Set-Content -LiteralPath (Join-Path $privateDir 'bootstrap-error.log') -Encoding UTF8
    Write-Error 'SQLSERVER_BOOTSTRAP_STOPPED; inspect local ignored bootstrap-error.log; no reset or retry performed.'
    exit 1
} finally { $connection.Dispose() }
