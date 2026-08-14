<#
.SYNOPSIS
    Migra BitalNegocio en SQL Server 2019+: esquema EF + datos iniciales + censo Vital.

.DESCRIPTION
    1. Crea la base BitalNegocio (01-CreateDatabase.sql) si no existe
    2. Aplica migraciones Entity Framework Core (incluye roles dinamicos RolesModulo)
    3. Ejecuta 02-MigrateData.sql (catalogo, usuarios, permisos, censo desde Hosvital)

.PARAMETER ServerInstance
    Instancia SQL Server. Ej: localhost\SQLEXPRESS, 10.238.97.69

.PARAMETER BitalDatabase
    Base de datos destino (default: BitalNegocio)

.PARAMETER VitalDatabase
    Base HIS Vital de solo lectura (default: Hosvital_Pruebas)

.PARAMETER SqlUser / SqlPassword
    Autenticacion SQL. Si se omiten, usa Windows Authentication.

.PARAMETER FechaOperativa
    Fecha del censo a generar (default: hoy, formato yyyy-MM-dd)

.PARAMETER SkipCreateDatabase
    No ejecutar 01-CreateDatabase.sql

.PARAMETER SkipEfMigration
    No ejecutar dotnet ef database update

.PARAMETER SkipDataMigration
    No ejecutar 02-MigrateData.sql

.EXAMPLE
    .\Migrate-BitalNegocio.ps1

.EXAMPLE
    .\Migrate-BitalNegocio.ps1 -ServerInstance "10.238.97.69" -SqlUser "sa" -SqlPassword "***"
#>
[CmdletBinding()]
param(
    [string] $ServerInstance = "localhost\SQLEXPRESS",
    [string] $BitalDatabase = "BitalNegocio",
    [string] $VitalDatabase = "Hosvital_Pruebas",
    [string] $SqlUser = "",
    [string] $SqlPassword = "",
    [string] $FechaOperativa = (Get-Date -Format "yyyy-MM-dd"),
    [switch] $SkipCreateDatabase,
    [switch] $SkipEfMigration,
    [switch] $SkipDataMigration
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
    $args = @(
        "-S", $ServerInstance,
        "-d", $Database,
        "-b",
        "-C",
        "-f", "65001"
    )
    if ($SqlUser) {
        $args += @("-U", $SqlUser, "-P", $SqlPassword)
    }
    else {
        $args += "-E"
    }
    return $args
}

function Invoke-SqlFile([string]$FilePath, [string]$Database = "master", [hashtable]$Variables = @{}) {
    if (-not (Test-Path $FilePath)) {
        throw "No se encontro el script SQL: $FilePath"
    }

    $args = Get-SqlCmdArgs -Database $Database
    foreach ($key in $Variables.Keys) {
        $args += @("-v", "$key=`"$($Variables[$key])`"")
    }
    $args += @("-i", $FilePath)

    Write-Host "sqlcmd $($args -join ' ')"
    & sqlcmd @args
    if ($LASTEXITCODE -ne 0) {
        throw "sqlcmd fallo ($FilePath) con codigo $LASTEXITCODE"
    }
}

Write-Step "Verificando herramientas"
if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
    throw "sqlcmd no esta en PATH. Instale SQL Server Command Line Utilities."
}

if (-not $SkipEfMigration) {
    if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
        throw "dotnet SDK no encontrado. Requerido para migraciones EF."
    }
}

Write-Step "Configuracion"
Write-Host "  Servidor     : $ServerInstance"
Write-Host "  BitalNegocio : $BitalDatabase"
Write-Host "  Vital (HIS)  : $VitalDatabase"
Write-Host "  Fecha censo  : $FechaOperativa"

if (-not $SkipCreateDatabase) {
    Write-Step "Creando base y esquemas ($BitalDatabase)"
    Invoke-SqlFile `
        -FilePath (Join-Path $ScriptRoot "01-CreateDatabase.sql") `
        -Database "master" `
        -Variables @{
            DatabaseName = $BitalDatabase
        }
}

if (-not $SkipEfMigration) {
    Write-Step "Aplicando migraciones Entity Framework"
    $connectionString = Get-EfConnectionString
    Push-Location $BackendRoot
    try {
        dotnet ef database update `
            --project "Bital.Infrastructure\Bital.Infrastructure.csproj" `
            --startup-project "Bital.ApiNegocio\Bital.ApiNegocio.csproj" `
            --context BitalNegocioDbContext `
            --connection $connectionString
        if ($LASTEXITCODE -ne 0) {
            throw "dotnet ef database update fallo con codigo $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}

if (-not $SkipDataMigration) {
    Write-Step "Migrando datos (catalogo, roles, usuarios, censo Vital)"
    Invoke-SqlFile `
        -FilePath (Join-Path $ScriptRoot "02-MigrateData.sql") `
        -Database $BitalDatabase `
        -Variables @{
            DatabaseName   = $BitalDatabase
            VitalDatabase  = $VitalDatabase
            FechaOperativa = $FechaOperativa
        }
}

Write-Step "Migracion completada"
Write-Host @"

Proximos pasos:
  1. Verificar connection string en Bital.ApiNegocio/appsettings.Development.json
  2. Iniciar API: dotnet run --project backend/Bital.ApiNegocio
  3. Login institucional: identificacion = contraseña inicial (ej. admin / admin)
  4. Cambiar contraseña en el primer acceso
  5. Roles dinamicos: gestionar en Usuarios y roles > Crear rol

"@ -ForegroundColor Green
