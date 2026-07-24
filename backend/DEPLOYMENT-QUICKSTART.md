# 🚀 Despliegue Rápido - Bital.ApiConsultas en IIS

## 📋 Resumen de Infraestructura

| Componente | Dirección | Puerto | Descripción |
|------------|-----------|--------|-------------|
| **API Server** | `10.238.97.67` (interna)<br>`186.190.254.230` (pública) | `2000` | IIS Windows Server |
| **Database** | `10.238.97.69` | `1433` | SQL Server - Vital HIS |

## ⚡ Despliegue en 3 Pasos

### 📦 Paso 1: Publicar (en tu máquina de desarrollo)

```powershell
cd backend
.\publish-to-iis.ps1
```

Este script:
- Compila la API en modo Release
- Publica en `C:\temp\bital-api-consultas-deploy`
- Verifica todos los archivos necesarios

**⚠️ IMPORTANTE**: Antes de publicar, edita `backend/Bital.ApiConsultas/appsettings.Production.json` y reemplaza:

```json
"Password=#{VITAL_DB_PASSWORD}#"
```

Por la contraseña real del usuario `bital_readonly`.

---

### 🖥️ Paso 2: Configurar IIS (en el servidor 10.238.97.67)

1. **Copiar el script al servidor**:
   - Archivo: `backend/setup-iis-server.ps1`
   - Destino: cualquier ubicación en el servidor

2. **Ejecutar como Administrador**:
   ```powershell
   .\setup-iis-server.ps1
   ```

Este script automáticamente:
- ✅ Crea Application Pool `.NET 8`
- ✅ Crea sitio web en puerto 2000
- ✅ Configura permisos de carpeta
- ✅ Abre puerto en firewall
- ✅ Inicia el sitio

---

### 📂 Paso 3: Copiar archivos publicados

**Desde** (tu máquina): `C:\temp\bital-api-consultas-deploy\`  
**Hacia** (servidor): `C:\inetpub\wwwroot\bital-api-consultas\`

**Métodos**:

#### Opción A: RDP (más simple)
1. Conectar a `10.238.97.67` por Remote Desktop
2. Copiar/pegar carpeta completa

#### Opción B: PowerShell Remoting
```powershell
$session = New-PSSession -ComputerName 10.238.97.67
Copy-Item -Path "C:\temp\bital-api-consultas-deploy\*" `
		  -Destination "C:\inetpub\wwwroot\bital-api-consultas\" `
		  -ToSession $session -Recurse -Force
Remove-PSSession $session
```

---

## ✅ Verificación Post-Despliegue

### En el servidor (10.238.97.67)

```powershell
# Health check
Invoke-RestMethod http://localhost:8080/health

# Info de la API
Invoke-RestMethod http://localhost:8080/

# Abrir Swagger
Start-Process "http://localhost:8080/swagger"
```

### Desde cualquier máquina (acceso externo)

```powershell
# Health check público
Invoke-RestMethod http://186.190.254.230:8080/health

# Swagger público
Start-Process "http://186.190.254.230:8080/swagger"

# Probar endpoint de pacientes
Invoke-RestMethod "http://186.190.254.230:8080/api/v1/pacientes/search?termino=lopez"

# Probar endpoint de atenciones
Invoke-RestMethod "http://186.190.254.230:8080/api/v1/atenciones/1"
```

---

## 🔍 Logs y Troubleshooting

### Ver logs de la aplicación

```powershell
# En el servidor
Get-Content "C:\inetpub\wwwroot\bital-api-consultas\logs\app-*.log" -Tail 100 -Wait
```

### Ver logs de IIS

```powershell
Get-Content "C:\inetpub\wwwroot\bital-api-consultas\logs\stdout*.log" -Tail 50
```

### Reiniciar el sitio

```powershell
Restart-WebAppPool -Name BitalApiConsultasPool
Restart-Website -Name BitalApiConsultas
```

### Verificar estado

```powershell
Get-Website -Name BitalApiConsultas
Get-WebAppPoolState -Name BitalApiConsultasPool
```

---

## 🆘 Problemas Comunes

### ❌ Error 500.19 - web.config inválido
**Causa**: ASP.NET Core Module no instalado  
**Solución**: Instalar .NET 8 Hosting Bundle desde https://dotnet.microsoft.com/download/dotnet/8.0

### ❌ Error 500.30 - No puede iniciar la app
**Causa**: Runtime .NET 8 faltante o permisos incorrectos  
**Solución**: 
```powershell
# Verificar runtime
dotnet --list-runtimes

# Verificar permisos
icacls "C:\inetpub\wwwroot\bital-api-consultas" /grant IIS_IUSRS:F /T
```

### ❌ No puede conectar a SQL Server
**Solución**:
```powershell
# Probar conectividad desde el servidor IIS
Test-NetConnection -ComputerName 10.238.97.69 -Port 1433
```

---

## 📚 Documentación Completa

- **Guía Detallada**: `backend/DEPLOYMENT-IIS-GUIDE.md`
- **Documentación API**: `backend/FRONTEND-API-GUIDE.md`
- **README Principal**: `backend/README.md`

---

## 🌐 URLs Finales

| Endpoint | URL Externa |
|----------|-------------|
| **Swagger UI** | http://186.190.254.230:8080/swagger |
| **Health Check** | http://186.190.254.230:8080/health |
| **API Base** | http://186.190.254.230:8080/api/v1/ |
| **Pacientes** | http://186.190.254.230:8080/api/v1/pacientes/search?termino=... |
| **Atenciones** | http://186.190.254.230:8080/api/v1/atenciones/{id} |
| **Atenciones Hospitalarias** | http://186.190.254.230:8080/api/v1/atenciones/hospitalarias |

---

## 📞 Soporte

**Equipo Bital**: soporte.bital@clinicadelrio.com

---

## 🔄 Actualizaciones Futuras

Para actualizar la API después del primer despliegue:

```powershell
# 1. Publicar nueva versión
cd backend
.\publish-to-iis.ps1

# 2. En el servidor, detener el sitio
Stop-Website -Name BitalApiConsultas

# 3. Copiar archivos actualizados
# (usando RDP o PowerShell Remoting)

# 4. Reiniciar el sitio
Start-Website -Name BitalApiConsultas
```

---

**Última actualización**: $(Get-Date -Format "yyyy-MM-dd")  
**Versión**: 1.0  
**Plataforma**: .NET 8 + IIS + Windows Server
