# Dot-source in a PowerShell terminal; does not change global Node or your profile.
$taskRepoRoot = Split-Path $PSScriptRoot -Parent
$taskLocalNode = Join-Path $taskRepoRoot '.tools-runtime/node_modules/node/bin/node.exe'
$script:taskNodePath = if (Test-Path -LiteralPath $taskLocalNode) { $taskLocalNode } else { (Get-Command node.exe -ErrorAction Stop).Source }
$taskVersion = & $script:taskNodePath --version
if ($taskVersion -ne 'v24.21.0') { throw 'Node24.21.0 required. Install the approved runtime or use Docker.' }
$script:taskNpmCli = Join-Path (Split-Path (Get-Command npm.cmd -ErrorAction Stop).Source) 'node_modules/npm/bin/npm-cli.js'
$env:PATH = "$(Split-Path $script:taskNodePath);$env:PATH"
function global:npm { & $script:taskNodePath $script:taskNpmCli @args }
Write-Output "Terminal runtime: $taskVersion (session only)"
