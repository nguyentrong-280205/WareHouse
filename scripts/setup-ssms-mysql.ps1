# Run in 64-bit Windows PowerShell as Administrator. Does not change application/database schema.
throw 'DA_THAY_THE: use scripts/setup-sqlserver.ps1 and docs/sqlserver_runbook.md'
$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $PSScriptRoot
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'WINDOWS_ADMIN_REQUIRED: Run Windows PowerShell as Administrator, then run this script.'
}
$installer = Join-Path $workspace 'backend/.artifacts/ssms-setup/mysql-connector-odbc-26.7.1-winx64.msi'
$driver = Get-OdbcDriver -Platform '64-bit' | Where-Object { $_.Name -match '^MySQL.*Unicode' } | Select-Object -First 1
if (-not $driver) {
    if (-not (Test-Path -LiteralPath $installer)) { throw 'MYSQL_ODBC_INSTALLER_REQUIRED: see docs/ssms_connection.md.' }
    $signature = Get-AuthenticodeSignature -LiteralPath $installer
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Oracle') { throw 'UNVERIFIED_INSTALLER: installation stopped.' }
    $install = Start-Process -FilePath msiexec.exe -ArgumentList @('/i',('"' + $installer + '"'),'/qn','/norestart') -WindowStyle Hidden -Wait -PassThru
    if ($install.ExitCode -notin @(0,3010)) { throw ('ODBC_INSTALL_FAILED: exit code ' + $install.ExitCode) }
    if ($install.ExitCode -eq 3010) { throw 'ODBC_REBOOT_REQUIRED: restart Windows when convenient, then rerun script.' }
    $driver = Get-OdbcDriver -Platform '64-bit' | Where-Object { $_.Name -match '^MySQL.*Unicode' } | Select-Object -First 1
    if (-not $driver) { throw 'MYSQL_ODBC_DRIVER_NOT_FOUND_AFTER_INSTALL' }
}

# Connect only to the existing local HTTT02 instance, using the current Windows login.
Add-Type -AssemblyName System.Data
$connection = New-Object System.Data.SqlClient.SqlConnection('Server=.HTTT02;Database=master;Integrated Security=True;Encrypt=True;TrustServerCertificate=True;Connect Timeout=5')
$phase = 'SQL_INSTANCE_CHECK'
try {
    $connection.Open()
    $cmd = $connection.CreateCommand()
    $cmd.CommandText = "SELECT CONVERT(nvarchar(128),SERVERPROPERTY('InstanceName')), IS_SRVROLEMEMBER('sysadmin'), ORIGINAL_LOGIN()"
    $reader = $cmd.ExecuteReader()
    if (-not $reader.Read()) { throw 'SQL_INSTANCE_NOT_FOUND' }
    $instance = $reader.GetString(0); $admin = $reader.GetInt32(1); $localLogin = $reader.GetString(2)
    $reader.Close(); $cmd.Dispose()
    if ($instance -ne 'HTTT02' -or $admin -ne 1) { throw 'EXPECTED_LOCAL_HTTT02_SYSADMIN_REQUIRED' }

    $phase = 'SYSTEM_DSN_SETUP'
    $dsn = Get-OdbcDsn -Name 'WarehouseMySQL' -DsnType System -Platform '64-bit' -ErrorAction SilentlyContinue
    if ($dsn) {
        if ($dsn.DriverName -ne $driver.Name -or $dsn.Attribute['SERVER'] -ne '127.0.0.1' -or $dsn.Attribute['PORT'] -ne '3307' -or $dsn.Attribute['DATABASE'] -ne 'warehouse_db') { throw 'EXISTING_DSN_CONFLICT_NO_OVERWRITE' }
    } else {
        Add-OdbcDsn -Name 'WarehouseMySQL' -DriverName $driver.Name -DsnType System -Platform '64-bit' -SetPropertyValue @('SERVER=127.0.0.1','PORT=3307','DATABASE=warehouse_db','CHARSET=utf8mb4') | Out-Null
    }

    $phase = 'READ_ONLY_MYSQL_ACCOUNT'
    & (Join-Path $workspace 'scripts/use-node.ps1')
    Push-Location (Join-Path $workspace 'backend')
    try { & node scripts/setup-ssms-reader.js; if ($LASTEXITCODE -ne 0) { throw 'READ_ONLY_MYSQL_ACCOUNT_NOT_READY' } } finally { Pop-Location }
    $phase = 'LINKED_SERVER_SETUP'
    $cmd = $connection.CreateCommand()
    $cmd.CommandText = "SELECT provider,data_source FROM sys.servers WHERE name=N'WAREHOUSE_MYSQL'"
    $reader = $cmd.ExecuteReader(); $existing = $reader.Read()
    if ($existing) { $provider = $reader.GetString(0); $source = $reader.GetString(1) }
    $reader.Close(); $cmd.Dispose()
    if ($existing) {
        if ($provider -ne 'MSDASQL' -or $source -ne 'WarehouseMySQL') { throw 'EXISTING_LINKED_SERVER_CONFLICT_NO_OVERWRITE' }
        Write-Output 'Existing matching Linked Server retained; login mapping not overwritten.'
    } else {
        # Runtime secret consumption only: never write the password into SQL files, DSN, output or command-line arguments.
        $credentials = [IO.File]::ReadAllText((Join-Path $workspace 'backend/.artifacts/ssms-reader.local.json')) | ConvertFrom-Json
        $password = $credentials.password
        $cmd = $connection.CreateCommand()
        $cmd.CommandText = @'
EXEC master.dbo.sp_addlinkedserver @server=N'WAREHOUSE_MYSQL', @srvproduct=N'MySQL', @provider=N'MSDASQL', @datasrc=N'WarehouseMySQL', @catalog=N'warehouse_db';
EXEC master.dbo.sp_droplinkedsrvlogin @rmtsrvname=N'WAREHOUSE_MYSQL', @locallogin=NULL;
EXEC master.dbo.sp_addlinkedsrvlogin @rmtsrvname=N'WAREHOUSE_MYSQL', @useself=N'false', @locallogin=@localLogin, @rmtuser=N'warehouse_ssms_reader', @rmtpassword=@password;
'@
        [void]$cmd.Parameters.Add('@localLogin',[System.Data.SqlDbType]::NVarChar,128)
        $cmd.Parameters['@localLogin'].Value = $localLogin
        [void]$cmd.Parameters.Add('@password',[System.Data.SqlDbType]::NVarChar,4000)
        $cmd.Parameters['@password'].Value = $password
        [void]$cmd.ExecuteNonQuery()
        $cmd.Dispose(); $password = $null
    }
    $phase = 'CONNECTION_READINESS'
    $cmd = $connection.CreateCommand(); $cmd.CommandTimeout = 15
    $cmd.CommandText = "SELECT remote_database FROM OPENQUERY(WAREHOUSE_MYSQL, 'SELECT DATABASE() AS remote_database')"
    $database = $cmd.ExecuteScalar(); $cmd.Dispose()
    if ($database -ne 'warehouse_db') { throw 'UNEXPECTED_REMOTE_DATABASE' }
    Write-Output 'Ready: SSMS Windows Authentication -> .\HTTT02 -> Server Objects -> Linked Servers -> WAREHOUSE_MYSQL -> warehouse_db.'
    Write-Output 'Application remains MySQL/mysql2. No business rows/schema/volumes changed; no UC tests executed.'
} catch {
    # Do not print SQL statements, secret parameters or full provider exceptions.
    $errorCode = if ($_.Exception -is [System.Data.SqlClient.SqlException]) { $_.Exception.Number } else { $_.Exception.GetType().Name }
    Write-Output ('SSMS_SETUP_INCOMPLETE at ' + $phase + ' (' + $errorCode + '). Existing data retained; no automatic drop/reset/retry.')
    throw 'See docs/ssms_connection.md. Review current DSN/Linked Server state before retrying.'
} finally { if ($connection) { $connection.Dispose() } }
