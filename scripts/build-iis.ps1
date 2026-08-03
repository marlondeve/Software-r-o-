# Build unificado para despliegue en IIS
# Uso: .\scripts\build-iis.ps1 [-Target all|apinegocio|frontend]

param(
	[ValidateSet("all", "apinegocio", "frontend")]
	[string]$Target = "all",
	[string]$OutputRoot = "",
	[switch]$SelfContained = $false
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
	Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Ok([string]$Message) {
	Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Fail([string]$Message) {
	Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Publish-DotNetApi {
	param(
		[string]$ProjectName,
		[string]$ProjectDir,
		[string]$OutputPath
	)

	Write-Step "Publicando $ProjectName..."

	if (Test-Path $OutputPath) {
		Remove-Item $OutputPath -Recurse -Force
	}

	$csproj = Join-Path $ProjectDir "$ProjectName.csproj"
	if (-not (Test-Path $csproj)) {
		throw "No se encontró el proyecto: $csproj"
	}

	Push-Location $ProjectDir
	try {
		dotnet clean -c Release -v q
		dotnet build -c Release -v minimal --no-incremental
		if ($LASTEXITCODE -ne 0) { throw "Fallo dotnet build en $ProjectName" }

		$publishArgs = @(
			"publish"
			"-c", "Release"
			"-o", $OutputPath
			"-v", "minimal"
			"--no-build"
			"--self-contained", ($(if ($SelfContained) { "true" } else { "false" }))
		)

		if ($SelfContained) {
			$publishArgs += "-r", "win-x64"
		}

		& dotnet @publishArgs
		if ($LASTEXITCODE -ne 0) { throw "Fallo dotnet publish en $ProjectName" }

		$dll = Join-Path $OutputPath "$ProjectName.dll"
		if (-not (Test-Path $dll)) {
			throw "No se generó $ProjectName.dll en $OutputPath"
		}

		$logsDir = Join-Path $OutputPath "logs"
		if (-not (Test-Path $logsDir)) {
			New-Item -ItemType Directory -Path $logsDir | Out-Null
		}
	} finally {
		Pop-Location
	}

	$fileCount = (Get-ChildItem $OutputPath -Recurse -File).Count
	$totalSizeMb = [math]::Round(((Get-ChildItem $OutputPath -Recurse -File | Measure-Object Length -Sum).Sum / 1MB), 2)
	Write-Ok "$ProjectName publicado ($fileCount archivos, $totalSizeMb MB) -> $OutputPath"
}

function Build-Frontend {
	param([string]$OutputPath)

	Write-Step "Compilando frontend (React/Vite)..."

	$frontendDir = Join-Path $repoRoot "frontend"
	if (-not (Test-Path $frontendDir)) {
		throw "No se encontró la carpeta frontend"
	}

	$envProduction = Join-Path $frontendDir ".env.production"
	$envProductionExample = Join-Path $frontendDir ".env.production.example"
	if (-not (Test-Path $envProductionExample)) {
		throw "Falta frontend/.env.production.example"
	}
	if (-not (Test-Path $envProduction)) {
		Copy-Item $envProductionExample $envProduction -Force
		Write-Ok "Generado frontend/.env.production desde .env.production.example"
	} else {
		$versionLine = "VITE_APP_VERSION=$productVersion"
		$content = Get-Content $envProduction -Raw
		if ($content -match '(?m)^VITE_APP_VERSION=.*$') {
			$content = [regex]::Replace($content, '(?m)^VITE_APP_VERSION=.*$', $versionLine)
		} else {
			$content = $content.TrimEnd() + "`n$versionLine`n"
		}
		Set-Content -Path $envProduction -Value $content -NoNewline
		Write-Ok "Sincronizado VITE_APP_VERSION=$productVersion en .env.production"
	}

	Push-Location $repoRoot
	try {
		pnpm --filter frontend build:iis
		if ($LASTEXITCODE -ne 0) { throw "Fallo pnpm build:iis" }
	} finally {
		Pop-Location
	}

	$distDir = Join-Path $frontendDir "dist"
	if (-not (Test-Path $distDir)) {
		throw "No se generó frontend/dist"
	}

	if (Test-Path $OutputPath) {
		Remove-Item $OutputPath -Recurse -Force
	}

	New-Item -ItemType Directory -Path $OutputPath | Out-Null
	Copy-Item -Path (Join-Path $distDir "*") -Destination $OutputPath -Recurse -Force

	$fileCount = (Get-ChildItem $OutputPath -Recurse -File).Count
	$totalSizeMb = [math]::Round(((Get-ChildItem $OutputPath -Recurse -File | Measure-Object Length -Sum).Sum / 1MB), 2)
	Write-Ok "Frontend publicado ($fileCount archivos, $totalSizeMb MB) -> $OutputPath"
}

$scriptRoot = Split-Path -Parent $PSCommandPath
$repoRoot = Split-Path -Parent $scriptRoot
$backendRoot = Join-Path $repoRoot "backend"

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
	$OutputRoot = Join-Path $repoRoot "deploy"
}

$frontendPkg = Get-Content (Join-Path $repoRoot "frontend\package.json") -Raw | ConvertFrom-Json
$productVersion = $frontendPkg.version

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║     RioSoft $productVersion — Build para despliegue IIS       ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

Write-Ok "Versión producto: $productVersion"

Write-Step "Verificando herramientas..."
$dotnetVersion = dotnet --version
Write-Ok ".NET SDK $dotnetVersion"

$nodeVersion = node --version
$pnpmVersion = pnpm --version
Write-Ok "Node $nodeVersion / pnpm $pnpmVersion"

$startTime = Get-Date
$results = @()

try {
	if ($Target -eq "all" -or $Target -eq "apinegocio") {
		$out = Join-Path $OutputRoot "apinegocio"
		Publish-DotNetApi -ProjectName "Bital.ApiNegocio" `
			-ProjectDir (Join-Path $backendRoot "Bital.ApiNegocio") `
			-OutputPath $out
		$results += "apinegocio -> $out"
	}

	if ($Target -eq "all" -or $Target -eq "frontend") {
		$out = Join-Path $OutputRoot "frontend"
		Build-Frontend -OutputPath $out
		$results += "frontend -> $out"
	}

	$elapsed = (Get-Date) - $startTime

	Write-Host "`n$('=' * 60)" -ForegroundColor Gray
	Write-Host " BUILD COMPLETADO en $([math]::Round($elapsed.TotalSeconds, 1))s" -ForegroundColor Green
	Write-Host "$('=' * 60)" -ForegroundColor Gray

	foreach ($line in $results) {
		Write-Host "  - $line" -ForegroundColor White
	}

	Write-Host @"

Rutas de despliegue en IIS:
  ApiNegocio -> C:\inetpub\wwwroot\bital-api-negocio\
  Frontend   -> C:\inetpub\wwwroot\bital-frontend\

Guía: backend\DEPLOYMENT-IIS-GUIDE.md
"@ -ForegroundColor Yellow

} catch {
	Write-Fail $_.Exception.Message
	exit 1
}
