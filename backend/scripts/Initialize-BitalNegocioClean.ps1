<#
.SYNOPSIS
    Crea una base BitalNegocio vacía con catálogo FCR y roles predefinidos.

.DESCRIPTION
    1. Crea (o recrea) la base de datos y esquemas bital + dietas
    2. Aplica migraciones Entity Framework Core (esquema completo)
    3. Inserta catálogo FCR, parámetros operativos y roles con permisos

    NO inserta: censo Vital, órdenes ni etiquetas.
    SÍ inserta: usuario administrador inicial (admin / admin).

.PARAMETER ServerInstance
    Instancia SQL Server. Ej: localhost\SQLEXPRESS

.PARAMETER BitalDatabase
    Nombre de la base destino (default: BitalNegocio)

.PARAMETER SqlUser / SqlPassword
    Autenticación SQL. Si se omiten, usa Windows Authentication.

.PARAMETER DropExisting
    Elimina la base existente antes de crearla (instalación desde cero).

.EXAMPLE
    .\Initialize-BitalNegocioClean.ps1

.EXAMPLE
    .\Initialize-BitalNegocioClean.ps1 -ServerInstance "localhost\SQLEXPRESS" -DropExisting

.EXAMPLE
    .\Initialize-BitalNegocioClean.ps1 -ServerInstance "10.238.97.66" -SqlUser "sa" -SqlPassword "***" -DropExisting
#>
[CmdletBinding()]
param(
    [string] $ServerInstance = "localhost\SQLEXPRESS",
    [string] $BitalDatabase = "BitalNegocio",
    [string] $SqlUser = "",
    [string] $SqlPassword = "",
    [switch] $DropExisting,
    [switch] $SkipEfMigration
)

$ErrorActionPreference = "Stop"

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendRoot = Split-Path -Parent $ScriptRoot

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Get-EfConnectionString {
    if ($SqlUser) {
        return "Server=$ServerInstance;Database=$BitalDatabase;User Id=$SqlUser;Password=$SqlPassword;TrustServerCertificate=True;Encrypt=True;MultipleActiveResultSets=true"
    }
    return "Server=$ServerInstance;Database=$BitalDatabase;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=True;MultipleActiveResultSets=true"
}

function Get-SqlCmdArgs([string]$Database = "master") {
    $sqlCmdArgs = @("-S", $ServerInstance, "-d", $Database, "-b", "-C", "-f", "65001")
    if ($SqlUser) {
        $sqlCmdArgs += @("-U", $SqlUser, "-P", $SqlPassword)
    }
    else {
        $sqlCmdArgs += "-E"
    }
    return $sqlCmdArgs
}

function Invoke-SqlFile([string]$FilePath, [string]$Database = "master", [hashtable]$Variables = @{}) {
    if (-not (Test-Path $FilePath)) {
        throw "No se encontro el script SQL: $FilePath"
    }

    $sqlCmdArgs = Get-SqlCmdArgs -Database $Database
    foreach ($key in $Variables.Keys) {
        $sqlCmdArgs += @("-v", "$key=`"$($Variables[$key])`"")
    }
    $sqlCmdArgs += @("-i", $FilePath)

    Write-Host "sqlcmd $($sqlCmdArgs -join ' ')"
    & sqlcmd @sqlCmdArgs
    if ($LASTEXITCODE -ne 0) {
        throw "sqlcmd fallo ($FilePath) con codigo $LASTEXITCODE"
    }
}

Write-Step "Verificando herramientas"
if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
    throw "sqlcmd no está en PATH. Instale SQL Server Command Line Utilities."
}

if (-not $SkipEfMigration) {
    if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
        throw "dotnet SDK no encontrado. Requerido para migraciones EF."
    }
}

Write-Step "Configuración"
Write-Host "  Servidor       : $ServerInstance"
Write-Host "  Base de datos  : $BitalDatabase"
Write-Host "  DropExisting   : $($DropExisting.IsPresent)"

Write-Step "Paso 1/4 - Crear base y esquemas"
Invoke-SqlFile `
    -FilePath (Join-Path $ScriptRoot "00-DropAndCreateDatabase.sql") `
    -Database "master" `
    -Variables @{
        DatabaseName = $BitalDatabase
        DropExisting = $(if ($DropExisting) { "1" } else { "0" })
    }

if (-not $SkipEfMigration) {
    Write-Step "Paso 2/4 - Migraciones EF (base hasta encuestas)"
    $connectionString = Get-EfConnectionString
    Push-Location $BackendRoot
    try {
        & dotnet ef database update 20260726010348_AddPacientesEncuestas `
            --project "Bital.Infrastructure\Bital.Infrastructure.csproj" `
            --startup-project "Bital.ApiNegocio\Bital.ApiNegocio.csproj" `
            --context BitalNegocioDbContext `
            --connection $connectionString
        if ($LASTEXITCODE -ne 0) {
            throw "dotnet ef database update (base) fallo con codigo $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }

    Write-Step "Paso 3/4 - Bootstrap tablas cuestionarios + migraciones EF restantes"
    Invoke-SqlFile `
        -FilePath (Join-Path $ScriptRoot "05-QuestionnaireBootstrap.sql") `
        -Database $BitalDatabase `
        -Variables @{
            DatabaseName = $BitalDatabase
        }

    Push-Location $BackendRoot
    try {
        & dotnet ef database update `
            --project "Bital.Infrastructure\Bital.Infrastructure.csproj" `
            --startup-project "Bital.ApiNegocio\Bital.ApiNegocio.csproj" `
            --context BitalNegocioDbContext `
            --connection $connectionString
        if ($LASTEXITCODE -ne 0) {
            throw "dotnet ef database update (final) fallo con codigo $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Step "Paso 2-3/4 - Omitido (SkipEfMigration)"
}

Write-Step "Paso 4/4 - Sembrar catalogo FCR, parametros y roles predefinidos"
Invoke-SqlFile `
    -FilePath (Join-Path $ScriptRoot "06-SeedCleanInstall.sql") `
    -Database $BitalDatabase `
    -Variables @{
        DatabaseName = $BitalDatabase
    }

Write-Step "Instalación limpia completada"
Write-Host @"

Base $BitalDatabase lista con:
  - Esquema completo (EF migrations)
  - 12 dietas FCR + tarifas 2025/2026 por tiempo de comida
  - Parámetros operativos, tiempos de comida y categorías de edad
  - 5 roles: Administrador, Nutricionista, Proveedor, Enfermera, Auxiliar de Cocina
  - Permisos por rol
  - Usuario admin: identificacion admin / contraseña admin (cambiar en primer acceso)

Próximos pasos:
  1. Actualizar connection string en appsettings.Development.json
  2. Iniciar API: dotnet run --project backend/Bital.ApiNegocio
  3. Iniciar sesión con usuario admin y contraseña admin

"@ -ForegroundColor Green
