# Guía de Despliegue — RioSoft en IIS

Despliegue del **frontend React** y **Bital.ApiNegocio** (API de RioSoft) en Windows Server con IIS.

**Última actualización:** 2026-08-27

---

## Arquitectura en producción

```text
Internet
    │
    ▼ HTTPS :443 / :8080
┌─────────────────────────────────────────┐
│  IIS — Sitio BitalFrontend              │
│  C:\inetpub\wwwroot\bital-frontend\     │
│  • SPA React (archivos estáticos)       │
│  • web.config: proxy /api/v1, /health,  │
│    /hubs → :8081 (WebSockets ON)        │
└──────────────────┬──────────────────────┘
                   │ http://127.0.0.1:8081
                   ▼
┌─────────────────────────────────────────┐
│  IIS — Sitio BitalApiNegocio            │
│  C:\inetpub\wwwroot\bital-api-negocio\  │
│  • ASP.NET Core 8 (in-process)          │
│  • Hub SignalR /hubs/dietas-cocina      │
│  • Solo binding localhost:8081          │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
  BitalNegocio          Hosvital_Pruebas
  (10.238.97.66)        (10.238.97.69, read-only)
```

| Componente | URL pública | Binding IIS |
|---|---|---|
| Frontend | `https://riosoft.clinicadelrio.org` (también `:8080`) | HTTPS :443 y :8080 |
| API | No expuesta — proxy interno | `http://127.0.0.1:8081` |

---

## Prerrequisitos en el servidor

1. **Windows Server** con IIS habilitado
2. **[.NET 8 Hosting Bundle](https://dotnet.microsoft.com/download/dotnet/8.0)** — incluye ASP.NET Core Module V2
3. **URL Rewrite** + **Application Request Routing (ARR)** con proxy habilitado
4. **Protocolo WebSocket** en IIS (característica de Windows) — obligatorio para SignalR
5. **Certificado SSL** para el subdominio (puertos 443 y 8080)
6. Conectividad SQL Server a `10.238.97.66` (BitalNegocio) y `10.238.97.69` (Vital)

Verificar runtime:

```powershell
dotnet --list-runtimes
# Debe incluir: Microsoft.AspNetCore.App 8.0.x
```

---

## Paso 1 — Build (máquina de desarrollo)

Desde la raíz del monorepo:

```powershell
pnpm install
pnpm build:iis
```

Salida:

| Carpeta | Contenido |
|---|---|
| `deploy/apinegocio/` | API publicada |
| `deploy/frontend/` | SPA + `web.config` |

Alternativa solo API:

```powershell
cd backend
.\publish-to-iis.ps1 -NonInteractive
# Salida: deploy/apinegocio/
```

Antes de publicar, verificar `backend/Bital.ApiNegocio/appsettings.Production.json` (connection strings, `Jwt:Key`, `Kestrel` en `127.0.0.1:8081`).

---

## Paso 2 — Copiar archivos al servidor

| Origen | Destino en servidor |
|---|---|
| `deploy/apinegocio/*` | `C:\inetpub\wwwroot\bital-api-negocio\` |
| `deploy/frontend/*` | `C:\inetpub\wwwroot\bital-frontend\` |

Métodos: RDP, PowerShell Remoting o compartido de red.

Permisos mínimos:

```powershell
icacls "C:\inetpub\wwwroot\bital-api-negocio" /grant IIS_IUSRS:(OI)(CI)M /T
icacls "C:\inetpub\wwwroot\bital-frontend" /grant IIS_IUSRS:(OI)(CI)R /T
New-Item -ItemType Directory -Force -Path "C:\logs\bital-api-negocio"
icacls "C:\logs\bital-api-negocio" /grant "IIS AppPool\BitalApiNegocioPool:(OI)(CI)M"
```

---

## Paso 3 — Sitio API (interno)

### Application Pool

| Propiedad | Valor |
|---|---|
| Nombre | `BitalApiNegocioPool` |
| .NET CLR | **No Managed Code** |
| Pipeline | Integrated |
| Identity | ApplicationPoolIdentity |

### Sitio web

| Propiedad | Valor |
|---|---|
| Nombre | `BitalApiNegocio` |
| Ruta física | `C:\inetpub\wwwroot\bital-api-negocio` |
| Binding | `http`, IP `127.0.0.1`, puerto **8081** |

> No abrir el puerto 8081 en el firewall externo. Solo localhost.

### Verificación local en el servidor

```powershell
Invoke-RestMethod http://127.0.0.1:8081/health
# → Healthy
```

---

## Paso 4 — Sitio Frontend (público)

### Application Pool

| Propiedad | Valor |
|---|---|
| Nombre | `BitalFrontendPool` |
| .NET CLR | **No Managed Code** |

### Sitio web

| Propiedad | Valor |
|---|---|
| Nombre | `BitalFrontend` |
| Ruta física | `C:\inetpub\wwwroot\bital-frontend` |
| Binding HTTPS | puertos **443** y **8080**, certificado SSL, host `riosoft.clinicadelrio.org` |

### ARR / URL Rewrite

1. IIS Manager → servidor → **Application Request Routing Cache** → **Server Proxy Settings** → Enable proxy
2. Confirmar que `web.config` del frontend incluye reglas de proxy a `127.0.0.1:8081` (viene en el build desde `frontend/public/web.config`): `/api/v1`, `/health` y **`/hubs`**

### WebSockets (SignalR 1.2.8+)

Sin esto el hub no conecta; la app sigue funcionando con fallback de censo cada 60 s, pero no habrá push en vivo.

1. **Instalar la característica** (como admin), si no está:
   ```powershell
   Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
   ```
2. **IIS Manager** → sitio `BitalApiNegocio` → **Configuración de WebSocket** → **Habilitado** (`web.config` del API ya trae `<webSocket enabled="true" />`).
3. Mismo check en el sitio `BitalFrontend` (proxy ARR del upgrade WebSocket).
4. Tras desplegar el frontend 1.2.8+, verificar que existe la regla **SignalR hubs proxy** (`^hubs/` → `http://127.0.0.1:8081/hubs/...`).
5. **App pool del API** (recomendado para el sync HIS continuo):
   - *Start Mode* = **AlwaysRunning**
   - *Idle Time-out* = **0** (o alto)
   - Sitio → *Preload Enabled* = **true**  
   Así `CensoHisSyncHostedService` no se detiene cuando no hay usuarios conectados.

Prueba rápida tras login en Dietas y Cocina: en DevTools → Network debe aparecer `hubs/dietas-cocina` (negotiate / websocket) en verde. Si falla, el fallback de 60 s mantiene el censo.

Guía detallada HTTPS: [docs/PASOS-HTTPS-IIS-FRONTEND.md](../docs/PASOS-HTTPS-IIS-FRONTEND.md)

---

## Paso 5 — Verificación end-to-end

Desde el servidor:

```powershell
Invoke-RestMethod http://127.0.0.1:8081/health
Invoke-RestMethod https://riosoft.clinicadelrio.org/health
Invoke-RestMethod https://riosoft.clinicadelrio.org:8080/health
```

Desde red externa:

```powershell
curl -I https://riosoft.clinicadelrio.org
curl https://riosoft.clinicadelrio.org/health
curl -I https://riosoft.clinicadelrio.org:8080
curl https://riosoft.clinicadelrio.org:8080/health
```

Probar login y rutas SPA:

- `/login`
- `/dietas-cocina/inicio`
- Recarga F5 en ruta profunda (fallback SPA)

---

## Actualización de versiones

```powershell
# En dev
pnpm build:iis

# En servidor — detener sitios, copiar archivos, reiniciar
Stop-Website -Name BitalApiNegocio
Stop-Website -Name BitalFrontend
# ... copiar deploy/* ...
Start-Website -Name BitalApiNegocio
Start-Website -Name BitalFrontend
Restart-WebAppPool -Name BitalApiNegocioPool
```

---

## Troubleshooting

| Síntoma | Causa probable | Acción |
|---|---|---|
| 500.30 / app no inicia | Hosting Bundle faltante | Instalar .NET 8 Hosting Bundle |
| 502 en `/api/v1/*` | API caída o ARR deshabilitado | Verificar `127.0.0.1:8081/health`, habilitar proxy ARR |
| 405 en PUT/PATCH | WebDAV activo | `web.config` ya lo deshabilita; verificar en IIS |
| 401 en endpoints | Cookie expirada o CORS | Verificar `Cors:AllowedOrigins` incluye origen HTTPS |
| SignalR no conecta / 404 en `/hubs/*` | Falta proxy `/hubs` o WebSockets OFF | Desplegar `web.config` del frontend 1.2.8+; habilitar WebSockets en ambos sitios; feature `IIS-WebSockets` |
| Censo HIS no actualiza solo | App pool en idle | AlwaysRunning + Preload + Idle Time-out 0 en pool del API |
| SQL error en health | Connection string | Probar conectividad a `.66` y `.69:1433` |
| Logs | — | `C:\logs\bital-api-negocio\app-*.log` |

---

## Referencias

- [DEPLOYMENT-QUICKSTART.md](./DEPLOYMENT-QUICKSTART.md)
- [CIBERSEGURIDAD-PRODUCCION.md](../docs/CIBERSEGURIDAD-PRODUCCION.md)
- [FRONTEND-API-GUIDE.md](./FRONTEND-API-GUIDE.md)
- Script build: `scripts/build-iis.ps1`
- Script setup API (legacy, revisar puerto): `backend/setup-iis-server.ps1`
