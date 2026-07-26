# Cambios Necesarios para Deployment Final

## 📌 Resumen

**Infraestructura de Producción:**
- **Servidor de Aplicaciones (ApiNegocio)**: `10.238.97.67` → Público en `http://186.190.254.230:8080`
- **Servidor de Base de Datos HIS (Vital)**: `10.238.97.69`
  - Base de datos: `Hosvital_Pruebas`
  - Usuario: `Rio`
  - Contraseña: `Cl1n1c42026*`
- **Base de Datos BitalNegocio**: Por definir ubicación (opciones: `10.238.97.69` o `10.238.97.67`)

**Arquitectura Desarrollo (Actual):**
- **ApiConsultas**: Pública en `http://186.190.254.230:8080` → Lee de BD Vital (`10.238.97.69`)
- **ApiNegocio**: Local en `http://localhost:5042` → Consume ApiConsultas + BD local

**Arquitectura Producción (Target):**
- **ApiNegocio**: Pública en `http://186.190.254.230:8080` ✅ → BD BitalNegocio
- **ApiConsultas**: Interna en `http://localhost:5000` (mismo servidor `10.238.97.67`) 🔒 → BD Vital (`10.238.97.69`)

---

## ✅ ARCHIVOS YA CREADOS/MODIFICADOS

### 1. Configuración de Producción

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `backend/Bital.ApiNegocio/appsettings.Production.json` | ✅ Creado | Config para puerto 8080, ApiConsultas localhost:5000 |
| `backend/Bital.ApiConsultas/appsettings.Production.json` | ✅ Modificado | Config para localhost:5000, API Key, CORS deshabilitado |

### 2. Seguridad

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `backend/Bital.ApiConsultas/Middleware/InternalApiKeyMiddleware.cs` | ✅ Creado | Valida API Key y origen localhost |
| `backend/Bital.ApiConsultas/Program.cs` | ✅ Modificado | Usa middleware de seguridad |
| `backend/Bital.ApiNegocio/Program.cs` | ✅ Modificado | Agrega API Key en HttpClient |

### 3. Documentación

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `docs/DEPLOYMENT_PLAN.md` | ✅ Creado | Plan completo de deployment (12 páginas) |
| `docs/DEPLOYMENT_SUMMARY.md` | ✅ Este archivo | Resumen ejecutivo |
| `docs/GUIA_CONSUMO_FRONTEND.md` | ✅ Creado | Guía completa para consumir API desde frontend |
| `scripts/deploy.sh` | ✅ Creado | Script automatizado de deployment |

---

## 🎯 LO QUE FALTA HACER (SOLO AL DEPLOYAR)

### 1. Configurar Secrets en el Servidor

**Archivo a crear**: `/var/www/bital/apiconsultas.config/appsettings.Production.json`

```json
{
  "ApiSecurity": {
	"InternalApiKey": "GENERAR_TOKEN_SEGURO_AQUI"
  }
}
```

**Archivo a crear**: `/var/www/bital/apinegocio.config/appsettings.Production.json`

```json
{
  "ConnectionStrings": {
	"BitalDatabase": "Server=...;Database=BitalNegocio;User Id=...;Password=..."
  },
  "ApiConsultas": {
	"BaseUrl": "http://localhost:5000",
	"ApiKey": "EL_MISMO_TOKEN_DE_ARRIBA"
  },
  "Jwt": {
	"Key": "GENERAR_KEY_JWT_MINIMO_32_CARACTERES",
	"Issuer": "Bital.ApiNegocio",
	"Audience": "Bital.Frontend",
	"ExpirationMinutes": 480
  }
}
```

**Generar tokens seguros:**
```bash
# API Key (32 caracteres alfanuméricos)
openssl rand -base64 32

# JWT Key (64 caracteres)
openssl rand -base64 64
```

### 2. Configurar Systemd Services

**Archivo**: `/etc/systemd/system/bital-apiconsultas.service`
```ini
[Unit]
Description=Bital API Consultas (Interna)
After=network.target

[Service]
Type=notify
WorkingDirectory=/var/www/bital/apiconsultas
ExecStart=/usr/bin/dotnet /var/www/bital/apiconsultas/Bital.ApiConsultas.dll
Restart=always
RestartSec=10
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
```

**Archivo**: `/etc/systemd/system/bital-apinegocio.service`
```ini
[Unit]
Description=Bital API Negocio (Pública)
After=network.target bital-apiconsultas.service
Requires=bital-apiconsultas.service

[Service]
Type=notify
WorkingDirectory=/var/www/bital/apinegocio
ExecStart=/usr/bin/dotnet /var/www/bital/apinegocio/Bital.ApiNegocio.dll
Restart=always
RestartSec=10
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
```

### 3. Crear Base de Datos BitalNegocio

**Opciones:**

#### Opción A: En el mismo servidor SQL del HIS (10.238.97.69)

```sql
-- Conectar a SQL Server en 10.238.97.69
-- VENTAJA: Misma infraestructura, fácil mantenimiento
-- DESVENTAJA: Comparte recursos con Hosvital_Pruebas

CREATE DATABASE BitalNegocio;
GO

USE BitalNegocio;
GO

-- Crear usuario con permisos mínimos
CREATE LOGIN bital_negocio WITH PASSWORD = 'PASSWORD_SEGURO_AQUI';
CREATE USER bital_negocio FOR LOGIN bital_negocio;

-- Permisos mínimos necesarios
ALTER ROLE db_datareader ADD MEMBER bital_negocio;
ALTER ROLE db_datawriter ADD MEMBER bital_negocio;
ALTER ROLE db_ddladmin ADD MEMBER bital_negocio; -- Solo para migrations
GO
```

**Connection String para ApiNegocio:**
```json
{
  "ConnectionStrings": {
    "BitalDatabase": "Server=10.238.97.69;Database=BitalNegocio;User Id=bital_negocio;Password=PASSWORD_SEGURO_AQUI;TrustServerCertificate=True;Connection Timeout=30;"
  }
}
```

#### Opción B: En SQL Express local del servidor de aplicaciones (186.190.254.230)

```sql
-- SQL Express en el servidor 186.190.254.230
-- VENTAJA: No impacta rendimiento del HIS
-- DESVENTAJA: Requiere instalar SQL Express

CREATE DATABASE BitalNegocio;
GO

USE BitalNegocio;
GO

-- Usar autenticación Windows
CREATE LOGIN [SERVIDOR\www-data] FROM WINDOWS;
CREATE USER [SERVIDOR\www-data] FOR LOGIN [SERVIDOR\www-data];
ALTER ROLE db_owner ADD MEMBER [SERVIDOR\www-data];
GO
```

**Connection String para ApiNegocio:**
```json
{
  "ConnectionStrings": {
    "BitalDatabase": "Server=localhost\\SQLEXPRESS;Database=BitalNegocio;Integrated Security=True;TrustServerCertificate=True;"
  }
}
```

**📊 Recomendación:** Usar la **Opción A** (mismo servidor 10.238.97.69) si el servidor SQL tiene recursos suficientes. Es más simple y usa la infraestructura existente.

### 4. Ejecutar Deployment

```bash
# Dar permisos al script
chmod +x scripts/deploy.sh

# Deploy completo (ambas APIs)
./scripts/deploy.sh all

# O individualmente
./scripts/deploy.sh apiconsultas
./scripts/deploy.sh apinegocio
```

---

## 🔍 VALIDACIÓN POST-DEPLOYMENT

### 1. Verificar que ApiConsultas NO sea accesible desde internet

```bash
# Desde tu máquina local (debe FALLAR)
curl http://186.190.254.230:5000/health
# Esperado: Connection refused o Timeout

# Desde el servidor (debe FUNCIONAR)
ssh admin@186.190.254.230
curl http://localhost:5000/health
# Esperado: {"status":"Healthy"}
```

### 2. Verificar que ApiNegocio SÍ sea accesible desde internet

```bash
# Desde tu máquina local (debe FUNCIONAR)
curl http://186.190.254.230:8080/health
# Esperado: {"status":"Healthy"}
```

### 3. Verificar comunicación interna

```bash
# En el servidor
curl http://localhost:8080/api/v1/dietas-cocina/catalogo
# Debe retornar el catálogo de dietas (ApiNegocio llamando a ApiConsultas internamente)
```

### 4. Ver logs en tiempo real

```bash
# Ver logs de ambas APIs
sudo journalctl -u bital-apiconsultas -u bital-apinegocio -f

# Ver solo errores
sudo journalctl -u bital-* -p err -f
```

---

## 🚨 ROLLBACK EN CASO DE PROBLEMAS

```bash
# En el servidor
sudo systemctl stop bital-apinegocio
sudo systemctl stop bital-apiconsultas

# Restaurar backup (ver backups disponibles)
ls -lh /var/backups/bital/

# Restaurar
cd /var/www/bital
sudo tar -xzf /var/backups/bital/apiconsultas_20260725_143000.tar.gz
sudo tar -xzf /var/backups/bital/apinegocio_20260725_143000.tar.gz

# Reiniciar
sudo systemctl start bital-apiconsultas
sudo systemctl start bital-apinegocio
```

---

## 📊 DIFERENCIAS DESARROLLO vs PRODUCCIÓN

| Aspecto | Desarrollo (Ahora) | Producción (Deploy) |
|---------|-------------------|---------------------|
| **ApiConsultas URL** | `http://186.190.254.230:8080` | `http://localhost:5000` |
| **ApiConsultas Acceso** | Público | Solo localhost |
| **ApiConsultas CORS** | Habilitado | Deshabilitado |
| **ApiConsultas Seguridad** | Sin API Key | Con API Key |
| **ApiNegocio URL** | `http://localhost:5042` | `http://186.190.254.230:8080` |
| **ApiNegocio BD** | SQL Express local | SQL Server producción |
| **ApiNegocio JWT** | Comentado | Activado |
| **HttpClient Header** | Sin API Key | Con `X-Internal-Api-Key` |

---

## ✨ BENEFICIOS DE ESTA ARQUITECTURA

1. **Seguridad**: ApiConsultas solo accesible internamente
2. **Separación**: Consultas (read-only) vs Negocio (read-write)
3. **Escalabilidad**: Cada API en su propio servicio
4. **Trazabilidad**: Logs separados por API
5. **Mantenibilidad**: Deploy independiente de cada API
6. **Performance**: ApiConsultas optimizada solo para lectura

---

## 📞 CHECKLIST FINAL

Antes de deployar:
- [ ] Generar API Key segura con `openssl rand -base64 32`
- [ ] Generar JWT Key segura con `openssl rand -base64 64`
- [ ] Crear base de datos `BitalNegocio` en SQL Server
- [ ] Crear usuario SQL con permisos mínimos
- [ ] Crear archivos de configuración en `/var/www/bital/*.config/`
- [ ] Crear servicios systemd
- [ ] Ejecutar `./scripts/deploy.sh all`
- [ ] Validar health checks
- [ ] Validar que ApiConsultas NO sea accesible desde internet
- [ ] Validar que ApiNegocio SÍ sea accesible desde internet
- [ ] Probar endpoint de censo: `/api/v1/dietas-cocina/censo`
- [ ] Probar endpoint de catálogo: `/api/v1/dietas-cocina/catalogo`

---

## 🎓 PARA RECORDAR

**Durante desarrollo (AHORA)**:
- Ambos proyectos funcionan independientes
- ApiConsultas pública para que tu ApiNegocio local la consuma
- No hay API Key, no hay restricciones

**En producción (DEPLOY)**:
- ApiNegocio reemplaza a ApiConsultas en el puerto 8080
- ApiConsultas se mueve a localhost:5000
- Se activa autenticación interna entre APIs
- Frontend solo habla con ApiNegocio

**¿Necesitas cambiar algo ahora?** ❌ NO
**¿Cuándo aplicar cambios?** ✅ Al hacer deployment final

Los archivos ya están listos y preparados. Solo falta ejecutar el deployment cuando estés listo.
