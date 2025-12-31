param(
  [string]$DbUser = $env:DB_USERNAME,
  [string]$DbPass = $env:DB_PASSWORD,
  [string]$DatasourceUrl = $env:SPRING_DATASOURCE_URL
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root "silk-road-frontend"
$backend = Join-Path $root "silk-road-backend"

function Load-DotEnv($path) {
  if (Test-Path $path) {
    Get-Content $path | ForEach-Object {
      if ($_ -match '^\s*$') { return }
      if ($_ -match '^\s*#') { return }
      $kv = $_ -split '=', 2
      if ($kv.Count -eq 2) {
        $key = $kv[0].Trim()
        $val = $kv[1].Trim()
        Set-Item -Path ("Env:{0}" -f $key) -Value $val
      }
    }
  }
}

Load-DotEnv (Join-Path $backend ".env.local")

if (-not $DatasourceUrl) {
  $DatasourceUrl = "jdbc:mysql://localhost:3306/silk_road_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false"
  Set-Item Env:SPRING_DATASOURCE_URL $DatasourceUrl
}

if ($DbUser) { Set-Item Env:DB_USERNAME $DbUser }
if ($DbPass) { Set-Item Env:DB_PASSWORD $DbPass }

function Start-Backend {
  Write-Host "Building backend..." -ForegroundColor Cyan
  Start-Process -NoNewWindow -WorkingDirectory $backend -FilePath "mvn.cmd" -ArgumentList @("-DskipTests","package") -Wait

  $jar = Get-ChildItem -Path (Join-Path $backend "target") -Filter "*.jar" |
    Where-Object { $_.Name -notlike "*.original" } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (-not $jar) {
    throw "Backend jar not found under $backend\\target"
  }

  Write-Host "Starting backend..." -ForegroundColor Cyan
  Start-Process -NoNewWindow -WorkingDirectory $backend -FilePath "java" -ArgumentList @("-jar", $jar.FullName)
}

function Start-Frontend {
  Write-Host "Starting frontend..." -ForegroundColor Cyan
  Start-Process -NoNewWindow -WorkingDirectory $frontend -FilePath "npm.cmd" -ArgumentList "run dev -- --port 5173"
}

function Get-LanIPs {
  try {
    $ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
      $_.IPAddress -match '^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)'
    } | Select-Object -ExpandProperty IPAddress
    return $ips
  } catch {
    $list = ipconfig | Select-String -Pattern 'IPv4.*: (\d{1,3}(?:\.\d{1,3}){3})' | ForEach-Object { $_.Matches[0].Groups[1].Value }
    return $list
  }
}

Start-Backend
Start-Frontend
Start-Sleep -Seconds 2

$ips = Get-LanIPs
Write-Host "Backend:  http://localhost:8080" -ForegroundColor Green
Write-Host "Local:   http://localhost:5173" -ForegroundColor Green
foreach ($ip in $ips) {
  Write-Host ("Network: http://{0}:5173" -f $ip) -ForegroundColor Green
}
