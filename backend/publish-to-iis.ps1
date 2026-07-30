# Script de Publicación - Bital.ApiNegocio
# Automatiza la compilación y preparación para despliegue en IIS

param(
	[string]$OutputPath = "",
	[switch]$SelfContained = $false,
	[switch]$OpenFolder = $true
)

$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"

# Colores para output
function Write-Step {
	param([string]$Message)
	Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Success {
	param([string]$Message)
	Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
	param([string]$Message)
	Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
	param([string]$Message)
	Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# Banner
Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║         Bital.ApiNegocio - Script de Publicación         ║
║              Despliegue en IIS Windows Server            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

# Verificar ubicación
$scriptRoot = Split-Path -Parent $PSCommandPath
$repoRoot = Split-Path -Parent $scriptRoot
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
	$OutputPath = Join-Path $repoRoot "deploy\apinegocio"
}
$projectPath = Join-Path $scriptRoot "Bital.ApiNegocio"
$csprojFile = Join-Path $projectPath "Bital.ApiNegocio.csproj"

Write-Step "Verificando estructura del proyecto..."
if (-not (Test-Path $csprojFile)) {
	Write-Error "No se encontró el archivo .csproj en: $csprojFile"
	Write-Host "Por favor ejecuta este script desde la carpeta 'backend'" -ForegroundColor Yellow
	exit 1
}
Write-Success "Proyecto encontrado: $csprojFile"

# Verificar .NET 8 SDK
Write-Step "Verificando .NET 8 SDK..."
try {
	$dotnetVersion = dotnet --version
	Write-Success ".NET SDK instalado: $dotnetVersion"

	$runtimes = dotnet --list-runtimes | Where-Object { $_ -like "*Microsoft.AspNetCore.App 8.*" }
	if ($runtimes) {
		Write-Success "ASP.NET Core 8.0 Runtime encontrado"
	} else {
		Write-Warning "ASP.NET Core 8.0 Runtime no encontrado en esta máquina"
		Write-Host "El servidor destino debe tener el runtime instalado" -ForegroundColor Yellow
	}
} catch {
	Write-Error ".NET SDK no encontrado. Instalar desde: https://dotnet.microsoft.com/download/dotnet/8.0"
	exit 1
}

# Verificar appsettings.Production.json
Write-Step "Verificando configuración de producción..."
$prodSettings = Join-Path $projectPath "appsettings.Production.json"
if (Test-Path $prodSettings) {
	$settingsContent = Get-Content $prodSettings -Raw
	if ($settingsContent -match "#{VITAL_DB_PASSWORD}#") {
		Write-Warning "IMPORTANTE: appsettings.Production.json contiene placeholder de contraseña"
		Write-Host "Debes reemplazar '#{VITAL_DB_PASSWORD}#' con la contraseña real antes de desplegar" -ForegroundColor Yellow

		$continue = Read-Host "¿Ya reemplazaste la contraseña? (s/n)"
		if ($continue -ne 's' -and $continue -ne 'S') {
			Write-Host "Cancelando publicación..." -ForegroundColor Red
			exit 0
		}
	}
	Write-Success "Archivo de configuración de producción encontrado"
} else {
	Write-Warning "No se encontró appsettings.Production.json"
}

# Limpiar output anterior
Write-Step "Limpiando publicaciones anteriores..."
if (Test-Path $OutputPath) {
	Remove-Item $OutputPath -Recurse -Force
	Write-Success "Carpeta de salida limpiada: $OutputPath"
}

# Limpiar builds anteriores
Write-Step "Limpiando builds anteriores..."
Push-Location $projectPath
try {
	dotnet clean -c Release -v minimal
	Write-Success "Proyecto limpiado"
} catch {
	Write-Error "Error al limpiar proyecto: $_"
	Pop-Location
	exit 1
}
Pop-Location

# Compilar
Write-Step "Compilando en modo Release..."
Push-Location $projectPath
try {
	dotnet build -c Release -v minimal --no-incremental
	if ($LASTEXITCODE -ne 0) {
		throw "Error en compilación"
	}
	Write-Success "Compilación exitosa"
} catch {
	Write-Error "Error al compilar: $_"
	Pop-Location
	exit 1
}
Pop-Location

# Publicar
Write-Step "Publicando aplicación..."
Push-Location $projectPath
try {
	$publishArgs = @(
		"publish"
		"-c", "Release"
		"-o", $OutputPath
		"-v", "minimal"
		"--no-build"
	)

	if ($SelfContained) {
		Write-Host "Publicando con runtime incluido (self-contained)..." -ForegroundColor Yellow
		$publishArgs += "--self-contained", "true"
		$publishArgs += "-r", "win-x64"
	} else {
		Write-Host "Publicando sin runtime (framework-dependent)..." -ForegroundColor Yellow
		$publishArgs += "--self-contained", "false"
	}

	& dotnet $publishArgs

	if ($LASTEXITCODE -ne 0) {
		throw "Error en publicación"
	}
	Write-Success "Publicación exitosa"
} catch {
	Write-Error "Error al publicar: $_"
	Pop-Location
	exit 1
}
Pop-Location

# Verificar archivos publicados
Write-Step "Verificando archivos publicados..."
$dllFile = Join-Path $OutputPath "Bital.ApiNegocio.dll"
$webConfigFile = Join-Path $OutputPath "web.config"
$appSettingsFile = Join-Path $OutputPath "appsettings.json"
$appSettingsProdFile = Join-Path $OutputPath "appsettings.Production.json"

$allFilesOk = $true

if (Test-Path $dllFile) {
	$dllSize = (Get-Item $dllFile).Length / 1KB
	Write-Success "Bital.ApiNegocio.dll ($([math]::Round($dllSize, 2)) KB)"
} else {
	Write-Error "DLL principal no encontrado"
	$allFilesOk = $false
}

if (Test-Path $webConfigFile) {
	Write-Success "web.config encontrado"
} else {
	Write-Warning "web.config no encontrado (se generará automáticamente en IIS)"
}

if (Test-Path $appSettingsFile) {
	Write-Success "appsettings.json encontrado"
} else {
	Write-Warning "appsettings.json no encontrado"
}

if (Test-Path $appSettingsProdFile) {
	Write-Success "appsettings.Production.json encontrado"
} else {
	Write-Warning "appsettings.Production.json no encontrado"
}

if (-not $allFilesOk) {
	Write-Error "Faltan archivos críticos en la publicación"
	exit 1
}

# Resumen de archivos
Write-Step "Resumen de publicación..."
$publishedFiles = Get-ChildItem $OutputPath -Recurse -File
$totalSize = ($publishedFiles | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "`nRuta de salida: " -NoNewline
Write-Host $OutputPath -ForegroundColor Cyan
Write-Host "Archivos publicados: " -NoNewline
Write-Host $publishedFiles.Count -ForegroundColor Cyan
Write-Host "Tamaño total: " -NoNewline
Write-Host "$([math]::Round($totalSize, 2)) MB" -ForegroundColor Cyan

# Información de despliegue
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "                  PRÓXIMOS PASOS" -ForegroundColor Yellow
Write-Host ("=" * 60) -ForegroundColor Gray

Write-Host @"

1. Transferir archivos al servidor IIS (10.238.97.67):

   Copiar desde: $OutputPath
   Copiar hacia: C:\inetpub\wwwroot\bital-api-negocio\

2. Métodos de transferencia:

   a) RDP (Recomendado):
	  - Conectarse al servidor 10.238.97.67
	  - Copiar y pegar la carpeta completa

   b) PowerShell Remoting:
	  `$session = New-PSSession -ComputerName 10.238.97.67
	  Copy-Item -Path "$OutputPath\*" -Destination "C:\inetpub\wwwroot\bital-api-negocio\" -ToSession `$session -Recurse -Force

   c) Usar herramientas FTP/SFTP (FileZilla, WinSCP)

3. Configurar IIS en el servidor:

   - Ver guía completa en: backend\DEPLOYMENT-IIS-GUIDE.md
	  - Crear Application Pool: BitalApiNegocioPool
   - Crear sitio web en puerto 2000
   - Verificar permisos de IIS_IUSRS

4. Probar el despliegue:

   Health Check: http://190.242.127.238:8080/health
   Swagger UI:    http://190.242.127.238:8080/swagger
   API Info:      http://190.242.127.238:8080/

"@ -ForegroundColor White

Write-Host ("=" * 60) -ForegroundColor Gray

# Crear archivo de instrucciones rápidas
$readmeFile = Join-Path $OutputPath "INSTRUCCIONES-DESPLIEGUE.txt"
$readmeContent = @"
=============================================================================
INSTRUCCIONES DE DESPLIEGUE - Bital.ApiNegocio
=============================================================================

FECHA DE PUBLICACIÓN: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

SERVIDOR DESTINO:
  - IP Interna: 10.238.97.67 (IIS)
  - IP Pública: 190.242.127.238
  - Puerto: 2000

RUTA DE DESPLIEGUE:
  C:\inetpub\wwwroot\bital-api-negocio\

PASOS RÁPIDOS:
  1. Copiar todos los archivos de esta carpeta al servidor en la ruta indicada
  2. En IIS Manager:
	 - Crear Application Pool: "BitalApiNegocioPool" (No Managed Code)
	 - Crear sitio web: "BitalApiNegocio" apuntando a la carpeta
	 - Configurar binding: http:*:8080
  3. Dar permisos a IIS_IUSRS en la carpeta
  4. Abrir puerto 2000 en Windows Firewall
  5. Iniciar el sitio en IIS
  6. Probar: http://localhost:8080/health

IMPORTANTE:
  - Verificar que appsettings.Production.json tenga la contraseña real de BD
  - El servidor debe tener .NET 8 Hosting Bundle instalado
  - La BD está en: 10.238.97.69 (VitalHIS)

DOCUMENTACIÓN COMPLETA:
  Ver archivo: backend\DEPLOYMENT-IIS-GUIDE.md

URLs DE PRUEBA (después del despliegue):
  - Health: http://190.242.127.238:8080/health
  - Swagger: http://190.242.127.238:8080/swagger
  - Info: http://190.242.127.238:8080/

ENDPOINTS PRINCIPALES:
  - GET /api/v1/pacientes/search?termino=lopez
  - GET /api/v1/atenciones/1
  - GET /api/v1/atenciones/hospitalarias

SOPORTE:
  soporte.bital@clinicadelrio.com

=============================================================================
"@

Set-Content -Path $readmeFile -Value $readmeContent -Encoding UTF8
Write-Success "Instrucciones guardadas en: $readmeFile"

# Abrir carpeta de salida
if ($OpenFolder) {
	Start-Process explorer.exe $OutputPath
}

Write-Host "`n"
Write-Success "¡Publicación completada exitosamente!"
Write-Host "`nPresiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
