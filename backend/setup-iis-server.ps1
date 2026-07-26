# Script de Configuración IIS - Bital.ApiNegocio
# Ejecutar ESTE SCRIPT EN EL SERVIDOR 10.238.97.67 como Administrador

#Requires -RunAsAdministrator

param(
	[string]$SitePath = "C:\inetpub\wwwroot\bital-api-negocio",
	[string]$SiteName = "BitalApiNegocio",
	[string]$AppPoolName = "BitalApiNegocioPool",
	[int]$Port = 2000,
	[string]$IPAddress = "10.238.97.67"
)

$ErrorActionPreference = "Stop"

# Colores
function Write-Step { param([string]$Message); Write-Host "`n==> $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message); Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Error { param([string]$Message); Write-Host "✗ $Message" -ForegroundColor Red }
function Write-Warning { param([string]$Message); Write-Host "⚠ $Message" -ForegroundColor Yellow }

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        Bital.ApiNegocio - Configuración IIS Server       ║
║                   Servidor: 10.238.97.67                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

# Verificar que se ejecuta en servidor
Write-Step "Verificando entorno del servidor..."
$computerIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "10.238.*" }).IPAddress
if ($computerIP) {
	Write-Success "Servidor detectado: $computerIP"
} else {
	Write-Warning "Este servidor no tiene la IP esperada 10.238.97.67"
	$continue = Read-Host "¿Continuar de todos modos? (s/n)"
	if ($continue -ne 's' -and $continue -ne 'S') { exit 0 }
}

# Verificar módulo WebAdministration
Write-Step "Verificando módulo IIS..."
if (-not (Get-Module -ListAvailable -Name WebAdministration)) {
	Write-Error "Módulo WebAdministration no disponible. ¿Está instalado IIS?"
	exit 1
}
Import-Module WebAdministration
Write-Success "Módulo WebAdministration cargado"

# Verificar .NET 8 Hosting Bundle
Write-Step "Verificando .NET 8 Hosting Bundle..."
try {
	$runtimes = dotnet --list-runtimes | Where-Object { $_ -like "*Microsoft.AspNetCore.App 8.*" }
	if ($runtimes) {
		$version = ($runtimes | Select-Object -First 1) -replace ".*?(\d+\.\d+\.\d+).*", '$1'
		Write-Success "ASP.NET Core 8.0 Runtime encontrado: $version"
	} else {
		Write-Error ".NET 8 Hosting Bundle NO está instalado"
		Write-Host "Descargar desde: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Yellow
		Write-Host "Archivo: dotnet-hosting-8.0.x-win.exe" -ForegroundColor Yellow
		exit 1
	}
} catch {
	Write-Error "No se pudo verificar .NET. ¿Está instalado?"
	exit 1
}

# Crear estructura de directorios
Write-Step "Creando estructura de directorios..."
if (-not (Test-Path $SitePath)) {
	New-Item -ItemType Directory -Path $SitePath -Force | Out-Null
	Write-Success "Carpeta creada: $SitePath"
} else {
	Write-Warning "La carpeta ya existe: $SitePath"
}

$logsPath = Join-Path $SitePath "logs"
if (-not (Test-Path $logsPath)) {
	New-Item -ItemType Directory -Path $logsPath -Force | Out-Null
	Write-Success "Carpeta de logs creada: $logsPath"
}

# Configurar permisos
Write-Step "Configurando permisos de carpeta..."
try {
	$acl = Get-Acl $SitePath

	# Permisos para IIS_IUSRS
	$iisUsersRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
		"IIS_IUSRS",
		"FullControl",
		"ContainerInherit,ObjectInherit",
		"None",
		"Allow"
	)
	$acl.SetAccessRule($iisUsersRule)

	# Permisos para IUSR (usuario anónimo)
	$iusrRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
		"IUSR",
		"ReadAndExecute",
		"ContainerInherit,ObjectInherit",
		"None",
		"Allow"
	)
	$acl.SetAccessRule($iusrRule)

	Set-Acl $SitePath $acl
	Write-Success "Permisos configurados para IIS_IUSRS y IUSR"

	# Permisos especiales para logs
	$aclLogs = Get-Acl $logsPath
	$logsRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
		"IIS_IUSRS",
		"FullControl",
		"ContainerInherit,ObjectInherit",
		"None",
		"Allow"
	)
	$aclLogs.SetAccessRule($logsRule)
	Set-Acl $logsPath $aclLogs
	Write-Success "Permisos de escritura configurados para logs"
} catch {
	Write-Error "Error configurando permisos: $_"
	exit 1
}

# Crear Application Pool
Write-Step "Configurando Application Pool..."
$poolPath = "IIS:\AppPools\$AppPoolName"
if (Test-Path $poolPath) {
	Write-Warning "Application Pool '$AppPoolName' ya existe. Se reconfigurará."
	Stop-WebAppPool -Name $AppPoolName -ErrorAction SilentlyContinue
	Start-Sleep -Seconds 2
	Remove-WebAppPool -Name $AppPoolName
}

New-WebAppPool -Name $AppPoolName | Out-Null
Write-Success "Application Pool creado: $AppPoolName"

# Configurar Application Pool
Set-ItemProperty $poolPath -Name managedRuntimeVersion -Value ""
Set-ItemProperty $poolPath -Name managedPipelineMode -Value "Integrated"
Set-ItemProperty $poolPath -Name startMode -Value "AlwaysRunning"
Set-ItemProperty $poolPath -Name processModel.idleTimeout -Value "00:00:00"
Set-ItemProperty $poolPath -Name recycling.periodicRestart.time -Value "00:00:00"
Set-ItemProperty $poolPath -Name processModel.identityType -Value "ApplicationPoolIdentity"
Write-Success "Application Pool configurado (No Managed Code, AlwaysRunning)"

# Crear sitio web
Write-Step "Configurando sitio web IIS..."
$sitePath = "IIS:\Sites\$SiteName"
if (Test-Path $sitePath) {
	Write-Warning "Sitio web '$SiteName' ya existe. Se eliminará y recreará."
	Stop-Website -Name $SiteName -ErrorAction SilentlyContinue
	Start-Sleep -Seconds 2
	Remove-Website -Name $SiteName
}

New-Website -Name $SiteName `
			-PhysicalPath $SitePath `
			-ApplicationPool $AppPoolName `
			-Port $Port `
			-IPAddress $IPAddress `
			-Force | Out-Null

Write-Success "Sitio web creado: $SiteName en puerto $Port"

# Verificar archivos de la aplicación
Write-Step "Verificando archivos de la aplicación..."
$dllFile = Join-Path $SitePath "Bital.ApiNegocio.dll"
if (Test-Path $dllFile) {
	Write-Success "Aplicación encontrada: Bital.ApiNegocio.dll"
} else {
	Write-Warning "Bital.ApiNegocio.dll NO encontrado en $SitePath"
	Write-Host "Debes copiar los archivos publicados a esta carpeta" -ForegroundColor Yellow
}

# Configurar firewall
Write-Step "Configurando Windows Firewall..."
$ruleName = "Bital API Negocio - Puerto $Port"
$existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existingRule) {
	Write-Warning "Regla de firewall ya existe. Se recreará."
	Remove-NetFirewallRule -DisplayName $ruleName
}

New-NetFirewallRule -DisplayName $ruleName `
					-Direction Inbound `
					-LocalPort $Port `
					-Protocol TCP `
					-Action Allow `
					-Enabled True | Out-Null

Write-Success "Regla de firewall creada para puerto $Port"

# Iniciar sitio
Write-Step "Iniciando sitio web..."
Start-Website -Name $SiteName
Start-WebAppPool -Name $AppPoolName
Start-Sleep -Seconds 3

$siteState = (Get-Website -Name $SiteName).State
if ($siteState -eq "Started") {
	Write-Success "Sitio web iniciado correctamente"
} else {
	Write-Warning "Estado del sitio: $siteState"
}

# Verificar binding
Write-Step "Verificando configuración..."
$binding = Get-WebBinding -Name $SiteName
Write-Host "Binding configurado:" -ForegroundColor White
Write-Host "  Protocolo: $($binding.protocol)" -ForegroundColor Cyan
Write-Host "  IP: $($binding.bindingInformation.Split(':')[0])" -ForegroundColor Cyan
Write-Host "  Puerto: $($binding.bindingInformation.Split(':')[1])" -ForegroundColor Cyan

# Probar conectividad local
Write-Step "Probando conectividad local..."
Start-Sleep -Seconds 5
try {
	$testUrl = "http://localhost:$Port/"
	$response = Invoke-WebRequest -Uri $testUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
	Write-Success "Respuesta HTTP $($response.StatusCode) desde $testUrl"
} catch {
	Write-Warning "No se pudo conectar a $testUrl"
	Write-Host "Esto es normal si aún no has copiado los archivos de la aplicación" -ForegroundColor Yellow
}

# Resumen
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "           CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Gray

Write-Host @"

SITIO WEB IIS:
  Nombre:           $SiteName
  Application Pool: $AppPoolName
  Ruta física:      $SitePath
  Puerto:           $Port
  IP:               $IPAddress

PRÓXIMOS PASOS:
  1. Copiar archivos publicados a: $SitePath
	 (Si aún no lo has hecho)

  2. Verificar que appsettings.Production.json tenga la contraseña correcta

  3. Reiniciar el sitio:
	 Restart-WebAppPool -Name $AppPoolName
	 Restart-Website -Name $SiteName

  4. Probar endpoints:
	 Invoke-RestMethod http://localhost:$Port/health
	 Invoke-RestMethod http://localhost:$Port/

  5. Acceso externo:
	 http://190.242.127.238:$Port/swagger
	 http://190.242.127.238:$Port/health

LOGS:
  IIS Stdout: $SitePath\logs\stdout*.log
  App Logs:   $SitePath\logs\app-*.log

COMANDOS ÚTILES:
  # Reiniciar
  Restart-Website -Name $SiteName

  # Ver estado
  Get-Website -Name $SiteName
  Get-WebAppPoolState -Name $AppPoolName

  # Ver logs
  Get-Content '$logsPath\stdout*.log' -Tail 50

  # Detener/Iniciar
  Stop-Website -Name $SiteName
  Start-Website -Name $SiteName

"@ -ForegroundColor White

Write-Host ("=" * 60) -ForegroundColor Gray
Write-Success "`n¡Configuración de IIS completada!"
Write-Host "`nPresiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
