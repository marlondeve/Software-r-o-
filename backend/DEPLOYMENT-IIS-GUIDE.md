# Guía de Despliegue - Bital.ApiNegocio en IIS

## 📋 Información de Infraestructura

### Servidores
- **API Server (IIS)**: `10.238.97.67` (IP interna) / `186.190.254.230` (IP pública)
- **Database Server**: `10.238.97.69` (SQL Server - Vital HIS)
- **Puerto Habilitado**: `2000`
- **Protocolo**: HTTP (interno) - considerar HTTPS con certificado para producción

### URLs de Acceso
- **Interna**: `http://10.238.97.67:8080/api/v1/`
- **Externa**: `http://186.190.254.230:8080/api/v1/`
- **Swagger UI**: `http://186.190.254.230:8080/swagger`
- **Health Check**: `http://186.190.254.230:8080/health`

---

## 🔧 Pre-requisitos en el Servidor IIS (10.238.97.67)

### 1. .NET 8 Runtime & Hosting Bundle
Descargar e instalar desde: https://dotnet.microsoft.com/download/dotnet/8.0

**Versión requerida**: .NET 8.0 Hosting Bundle para IIS

```powershell
# Verificar instalación en el servidor
dotnet --list-runtimes
# Debe mostrar: Microsoft.AspNetCore.App 8.0.x
```

### 2. IIS y componentes necesarios
En el servidor, habilitar las siguientes características de Windows:

```powershell
# Ejecutar como Administrador en el servidor 10.238.97.67
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HealthAndDiagnostics
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Security
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Performance
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerManagementTools
Enable-WindowsOptionalFeature -Online -FeatureName IIS-IIS6ManagementCompatibility
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Metabase
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementConsole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-BasicAuthentication
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WindowsAuthentication
Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DefaultDocument
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DirectoryBrowsing
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationInit
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ISAPIExtensions
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ISAPIFilter
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45
```

### 3. Crear estructura de directorios en el servidor

```powershell
# Ejecutar en el servidor 10.238.97.67
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\bital-api-consultas" -Force
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\bital-api-consultas\logs" -Force
```

### 4. Configurar permisos de directorio

```powershell
# Dar permisos al usuario de IIS
$acl = Get-Acl "C:\inetpub\wwwroot\bital-api-consultas"
$permission = "IIS_IUSRS","FullControl","ContainerInherit,ObjectInherit","None","Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
Set-Acl "C:\inetpub\wwwroot\bital-api-consultas" $acl

# Permisos para logs
$acl = Get-Acl "C:\inetpub\wwwroot\bital-api-consultas\logs"
$permission = "IIS_IUSRS","FullControl","ContainerInherit,ObjectInherit","None","Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
Set-Acl "C:\inetpub\wwwroot\bital-api-consultas\logs" $acl
```

---

## 📦 Paso 1: Compilar y Publicar la API (Desde tu máquina de desarrollo)

### 1.1 Preparar credenciales de Base de Datos

**IMPORTANTE**: Antes de publicar, debes reemplazar `#{VITAL_DB_PASSWORD}#` en `appsettings.Production.json` con la contraseña real del usuario `bital_readonly`.

```json
// En backend/Bital.ApiNegocio/appsettings.Production.json
"ConnectionStrings": {
  "VitalDatabase": "Server=10.238.97.69;Database=VitalHIS;User Id=bital_readonly;Password=TU_PASSWORD_REAL_AQUI;TrustServerCertificate=True;Connection Timeout=30;",
  ...
}
```

⚠️ **Seguridad**: Nunca subas este archivo a Git con la contraseña real. Usa variables de entorno o Azure Key Vault en producción seria.

### 1.2 Compilar en modo Release

```powershell
# Desde tu máquina de desarrollo (C:\Users\Juan Dev\Desktop\Software-r-o-)
cd backend/Bital.ApiNegocio

# Limpiar builds anteriores
dotnet clean -c Release

# Compilar
dotnet build -c Release
```

### 1.3 Publicar para IIS

```powershell
# Publicar en una carpeta local
dotnet publish -c Release -o "C:\temp\bital-api-consultas-deploy" --self-contained false

# Si quieres incluir el runtime de .NET (más pesado pero más independiente)
# dotnet publish -c Release -o "C:\temp\bital-api-consultas-deploy" --self-contained true -r win-x64
```

Esto creará todos los archivos necesarios en `C:\temp\bital-api-consultas-deploy\`.

---

## 🚀 Paso 2: Transferir Archivos al Servidor IIS

### Opción A: Usando RDP (Recomendado)
1. Conectarse al servidor `10.238.97.67` por RDP
2. Copiar la carpeta `C:\temp\bital-api-consultas-deploy\` desde tu máquina
3. Pegar en `C:\inetpub\wwwroot\bital-api-consultas\` del servidor

### Opción B: Usando PowerShell Remoting

```powershell
# Desde tu máquina de desarrollo
$serverIP = "10.238.97.67"
$credentials = Get-Credential # Ingresar credenciales de admin del servidor

# Crear sesión remota
$session = New-PSSession -ComputerName $serverIP -Credential $credentials

# Copiar archivos
Copy-Item -Path "C:\temp\bital-api-consultas-deploy\*" -Destination "C:\inetpub\wwwroot\bital-api-consultas\" -ToSession $session -Recurse -Force

# Cerrar sesión
Remove-PSSession $session
```

### Opción C: Usando FTP/SFTP
Si tienes configurado un servidor FTP/SFTP en `10.238.97.67`, usa FileZilla o WinSCP.

---

## 🌐 Paso 3: Configurar IIS en el Servidor

### 3.1 Abrir IIS Manager en el servidor
```powershell
# En el servidor 10.238.97.67
inetmgr
```

### 3.2 Crear Application Pool

1. En IIS Manager, clic derecho en **Application Pools** → **Add Application Pool**
2. Configurar:
	  - **Name**: `BitalApiNegocioPool`
   - **.NET CLR version**: `No Managed Code` (importante para .NET Core/8)
   - **Managed pipeline mode**: `Integrated`
   - **Start application pool immediately**: ✅

3. Clic derecho en `BitalApiNegocioPool` → **Advanced Settings**:
   - **Identity**: `ApplicationPoolIdentity` (recomendado)
   - **Start Mode**: `AlwaysRunning`
   - **Idle Time-out (minutes)**: `0` (para que no se detenga)
   - **Regular Time Interval (minutes)**: `0` (deshabilitar reciclaje automático)

### 3.3 Crear sitio web o aplicación

#### Opción A: Como sitio web independiente (Recomendado)

1. Clic derecho en **Sites** → **Add Website**
2. Configurar:
	  - **Site name**: `BitalApiNegocio`
   - **Application pool**: `BitalApiNegocioPool`
   - **Physical path**: `C:\inetpub\wwwroot\bital-api-consultas`
   - **Binding**:
	 - **Type**: `http`
	 - **IP address**: `10.238.97.67` (o "All Unassigned" si quieres que escuche en todas)
	 - **Port**: `2000`
	 - **Host name**: (dejar vacío)

#### Opción B: Como aplicación bajo Default Web Site

Si prefieres que esté bajo el sitio por defecto con una ruta virtual:

1. Clic derecho en **Default Web Site** → **Add Application**
2. Configurar:
   - **Alias**: `bital-api-consultas`
	  - **Application pool**: `BitalApiNegocioPool`
   - **Physical path**: `C:\inetpub\wwwroot\bital-api-consultas`

En este caso, la URL sería: `http://10.238.97.67/bital-api-consultas/`

### 3.4 Configurar Bindings para puerto 2000

Si usaste la Opción A (sitio independiente), el puerto 2000 ya está configurado.

Si usaste la Opción B (aplicación), necesitas:
1. Clic derecho en **Default Web Site** → **Edit Bindings**
2. **Add** → Agregar binding:
   - **Type**: `http`
   - **IP**: `10.238.97.67`
   - **Port**: `2000`

### 3.5 Verificar módulo ASP.NET Core

1. En IIS Manager, selecciona el sitio `BitalApiNegocio`
2. Doble clic en **Modules**
3. Verifica que aparezca: `AspNetCoreModuleV2`

Si no aparece, instala el **ASP.NET Core Hosting Bundle** (paso 1.1).

---

## 🔥 Paso 4: Configurar Firewall en el Servidor

### 4.1 Abrir puerto 2000 en Windows Firewall

```powershell
# En el servidor 10.238.97.67, ejecutar como Administrador
New-NetFirewallRule -DisplayName "Bital API Consultas - Puerto 2000" -Direction Inbound -LocalPort 2000 -Protocol TCP -Action Allow

# Verificar regla
Get-NetFirewallRule -DisplayName "Bital API Consultas - Puerto 2000"
```

### 4.2 Verificar que el puerto esté abierto

```powershell
# En el servidor, verificar que el proceso esté escuchando
netstat -ano | findstr :8080
```

---

## ✅ Paso 5: Probar el Despliegue

### 5.1 Desde el mismo servidor (10.238.97.67)

```powershell
# Probar health check
Invoke-RestMethod http://localhost:8080/health

# Probar endpoint de info
Invoke-RestMethod http://localhost:8080/

# Swagger
Start-Process "http://localhost:8080/swagger"
```

### 5.2 Desde tu máquina de desarrollo

```powershell
# Probar acceso interno
Invoke-RestMethod http://10.238.97.67:8080/health

# Probar acceso externo (IP pública)
Invoke-RestMethod http://186.190.254.230:8080/health

# Abrir Swagger en navegador
Start-Process "http://186.190.254.230:8080/swagger"
```

### 5.3 Probar endpoints de la API

```powershell
# Endpoint de pacientes
Invoke-RestMethod "http://186.190.254.230:8080/api/v1/pacientes/search?termino=lopez"

# Endpoint de atenciones
Invoke-RestMethod "http://186.190.254.230:8080/api/v1/atenciones/1"

# Endpoint de atenciones hospitalarias (para Dietas)
Invoke-RestMethod "http://186.190.254.230:8080/api/v1/atenciones/hospitalarias"
```

---

## 🐛 Troubleshooting

### Problema 1: Error 500.19 - web.config no válido

**Solución**: Verificar que el módulo `AspNetCoreModuleV2` esté instalado:
```powershell
# Reinstalar ASP.NET Core Hosting Bundle
# Descargar de: https://dotnet.microsoft.com/download/dotnet/8.0
# Ejecutar: dotnet-hosting-8.0.x-win.exe
# Reiniciar IIS: iisreset
```

### Problema 2: Error 500.30 - No se puede iniciar la aplicación

**Causas comunes**:
- Runtime de .NET 8 no instalado
- Permisos incorrectos en la carpeta
- `web.config` apuntando al DLL incorrecto

**Solución**:
```powershell
# Ver logs de IIS
Get-Content "C:\inetpub\wwwroot\bital-api-consultas\logs\stdout*.log" -Tail 50

# Ver logs de la aplicación
Get-Content "C:\inetpub\wwwroot\bital-api-consultas\logs\app-*.log" -Tail 50
```

### Problema 3: No puede conectar a SQL Server (10.238.97.69)

**Solución**:
```powershell
# Verificar conectividad desde el servidor IIS
Test-NetConnection -ComputerName 10.238.97.69 -Port 1433

# Probar conexión SQL desde el servidor IIS
sqlcmd -S 10.238.97.69 -U bital_readonly -P "TU_PASSWORD" -Q "SELECT @@VERSION"
```

Si falla:
- Verificar que SQL Server permita conexiones remotas
- Verificar que el puerto 1433 esté abierto en el firewall de `10.238.97.69`
- Verificar credenciales del usuario `bital_readonly`

### Problema 4: CORS - Frontend no puede consumir la API

**Solución**: Agregar el origen del frontend en `appsettings.Production.json`:
```json
"Cors": {
  "AllowedOrigins": [
	"http://186.190.254.230:8080",
	"http://tu-frontend-url-aqui:puerto"
  ]
}
```

Reiniciar la aplicación después del cambio.

### Problema 5: Puerto 2000 no accesible desde fuera

**Solución**:
1. Verificar que el firewall de Windows tenga la regla habilitada (paso 4.1)
2. Verificar que el router/firewall de red permita tráfico al puerto 2000
3. Contactar al equipo de redes para habilitar NAT/port forwarding de `186.190.254.230:8080` → `10.238.97.67:8080`

---

## 📊 Monitoreo Post-Despliegue

### Logs de la aplicación
```powershell
# En el servidor 10.238.97.67
Get-Content "C:\inetpub\wwwroot\bital-api-consultas\logs\app-*.log" -Tail 100 -Wait
```

### Logs de IIS
```powershell
# Logs de stdout (errores de inicio)
Get-Content "C:\inetpub\wwwroot\bital-api-consultas\logs\stdout*.log" -Tail 50

# Event Viewer - Application logs
Get-EventLog -LogName Application -Source "IIS AspNetCore Module" -Newest 20
```

### Health Check periódico
```powershell
# Crear script de monitoreo (guardar como C:\scripts\monitor-bital-api.ps1)
while ($true) {
	try {
		$response = Invoke-RestMethod http://localhost:8080/health
		Write-Host "[$(Get-Date)] OK - Status: $($response.status)" -ForegroundColor Green
	} catch {
		Write-Host "[$(Get-Date)] ERROR - API no responde" -ForegroundColor Red
	}
	Start-Sleep -Seconds 60
}
```

---

## 🔄 Actualización de la API (Despliegues futuros)

1. Detener el sitio en IIS:
   ```powershell
	  Stop-IISSite -Name "BitalApiNegocio"
   ```

2. Reemplazar archivos:
   ```powershell
   Copy-Item -Path "C:\temp\nueva-version\*" -Destination "C:\inetpub\wwwroot\bital-api-consultas\" -Recurse -Force
   ```

3. Reiniciar el sitio:
   ```powershell
	  Start-IISSite -Name "BitalApiNegocio"
   ```

4. Verificar:
   ```powershell
   Invoke-RestMethod http://localhost:8080/health
   ```

---

## 🔐 Recomendaciones de Seguridad

### Para Producción Seria:

1. **HTTPS**: Configurar certificado SSL/TLS en IIS
   - Obtener certificado de Let's Encrypt o CA comercial
   - Cambiar binding a HTTPS en puerto 443
   - Redirigir HTTP → HTTPS

2. **Autenticación**: Implementar JWT o API Keys
   - Agregar middleware de autenticación
   - Validar tokens en cada request

3. **Rate Limiting**: Limitar requests por IP
   - Usar middleware AspNetCoreRateLimit
   - Configurar límites por endpoint

4. **Secrets Management**: No guardar passwords en archivos
   - Usar Azure Key Vault
   - Variables de entorno encriptadas
   - Windows Credential Manager

5. **Logs**: Enviar logs a sistema centralizado
   - Configurar Serilog para enviar a Seq/ELK/Azure Monitor

---

## 📞 Contacto

Para soporte del despliegue:
- **Equipo Bital**: soporte.bital@clinicadelrio.com
- **Documentación API**: Ver `backend/FRONTEND-API-GUIDE.md`

---

## ✅ Checklist de Despliegue

- [ ] .NET 8 Hosting Bundle instalado en servidor
- [ ] IIS habilitado y configurado
- [ ] Carpeta `C:\inetpub\wwwroot\bital-api-consultas` creada
- [ ] Permisos de carpeta configurados para IIS_IUSRS
- [ ] Contraseña real en `appsettings.Production.json`
- [ ] API compilada en modo Release
- [ ] Archivos transferidos al servidor
- [ ] Application Pool `BitalApiNegocioPool` creado
- [ ] Sitio web `BitalApiNegocio` configurado en puerto 2000
- [ ] Firewall Windows abierto para puerto 2000
- [ ] Conectividad SQL verificada (`10.238.97.69:1433`)
- [ ] Health check respondiendo: `http://localhost:8080/health`
- [ ] Swagger accesible: `http://186.190.254.230:8080/swagger`
- [ ] Endpoints de API probados desde frontend
- [ ] CORS configurado para origenes del frontend
- [ ] Logs monitoreados y funcionando

---

**Fecha de creación**: $(Get-Date -Format "yyyy-MM-dd")  
**Versión API**: 1.0  
**Plataforma**: .NET 8 + IIS + Windows Server
