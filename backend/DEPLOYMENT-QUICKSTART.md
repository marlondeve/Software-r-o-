# Despliegue Rápido — RioSoft en IIS

**Versión:** 1.2.0

**Última actualización:** 2026-08-03

## Infraestructura

| Componente | Detalle |
|---|---|
| Frontend público | `https://riosoft.clinicadelriomonteria.com:8080` |
| API interna | `http://127.0.0.1:8081` (proxy desde frontend) |
| BD BitalNegocio | `10.238.97.66:1433` |
| BD Vital | `10.238.97.69:1433` (Hosvital_Pruebas) |

---

## Paso 1 — Build (dev)

```powershell
pnpm install
pnpm build:iis
```

Salida: `deploy/apinegocio/` + `deploy/frontend/`

---

## Paso 2 — Copiar al servidor

| Origen | Destino |
|---|---|
| `deploy/apinegocio/*` | `C:\inetpub\wwwroot\bital-api-negocio\` |
| `deploy/frontend/*` | `C:\inetpub\wwwroot\bital-frontend\` |

Verificar `appsettings.Production.json` antes de publicar (JWT, connection strings).

---

## Paso 3 — IIS

### API (interno)

- Pool: `BitalApiNegocioPool` — No Managed Code
- Sitio: `BitalApiNegocio` → `C:\inetpub\wwwroot\bital-api-negocio`
- Binding: `http://127.0.0.1:8081`

### Frontend (público)

- Pool: `BitalFrontendPool` — No Managed Code
- Sitio: `BitalFrontend` → `C:\inetpub\wwwroot\bital-frontend`
- Binding: **HTTPS** puerto **8080** + certificado SSL
- Habilitar **ARR proxy** + **URL Rewrite**

Guía HTTPS: [docs/PASOS-HTTPS-IIS-FRONTEND.md](../docs/PASOS-HTTPS-IIS-FRONTEND.md)

---

## Verificación

```powershell
# En el servidor
Invoke-RestMethod http://127.0.0.1:8081/health
Invoke-RestMethod https://riosoft.clinicadelriomonteria.com:8080/health

# Login de prueba (después de migración SQL)
# usuario: admin / password: admin
```

---

## Logs y reinicio

```powershell
Get-Content "C:\logs\bital-api-negocio\app-*.log" -Tail 50
Restart-WebAppPool -Name BitalApiNegocioPool
Restart-Website -Name BitalFrontend
```

---

## Documentación completa

- [DEPLOYMENT-IIS-GUIDE.md](./DEPLOYMENT-IIS-GUIDE.md)
- [CIBERSEGURIDAD-PRODUCCION.md](../docs/CIBERSEGURIDAD-PRODUCCION.md)
- [FRONTEND-API-GUIDE.md](./FRONTEND-API-GUIDE.md)

**Soporte:** soporte@clinicadelrio.com
