# HTTPS en IIS — Frontend RioSoft

Guía para configurar **HTTPS** en el sitio frontend de RioSoft.

**URL de producción:** `https://riosoft.clinicadelriomonteria.com:8080`

**Última actualización:** 2026-08-03

Ver también: [CIBERSEGURIDAD-PRODUCCION.md](./CIBERSEGURIDAD-PRODUCCION.md) · [backend/DEPLOYMENT-IIS-GUIDE.md](../backend/DEPLOYMENT-IIS-GUIDE.md)

---

## Resumen

| Elemento | Valor |
|---|---|
| Sitio IIS | `BitalFrontend` |
| Ruta física | `C:\inetpub\wwwroot\bital-frontend\` |
| Binding HTTPS | Puerto **8080**, SNI, certificado válido |
| Redirect HTTP→HTTPS | Regla en `frontend/public/web.config` |
| Proxy API | `/api/v1/*` y `/health` → `http://127.0.0.1:8081` |

El certificado va en el **sitio frontend**, no en el sitio API interno.

---

## Prerrequisitos

1. Certificado SSL emitido para `riosoft.clinicadelriomonteria.com` (o wildcard `*.clinicadelriomonteria.com`)
2. DNS apuntando al servidor IIS
3. Puertos **8080** TCP abiertos en firewall (entrada HTTPS)
4. Módulos IIS: **URL Rewrite**, **ARR** (proxy habilitado)
5. Build desplegado con `pnpm build:iis` (incluye `web.config` con reglas HTTPS y proxy)

---

## Paso 1 — Importar certificado

1. Abrir **IIS Manager** → servidor → **Server Certificates**
2. **Import…** o **Complete Certificate Request…** según el proveedor
3. Verificar que el certificado aparece con fecha de expiración válida

Alternativa PowerShell (certificado en archivo PFX):

```powershell
$pwd = Read-Host "Contraseña PFX" -AsSecureString
Import-PfxCertificate -FilePath "C:\certs\riosoft.pfx" -CertStoreLocation Cert:\LocalMachine\My -Password $pwd
```

---

## Paso 2 — Binding HTTPS en el sitio frontend

1. IIS Manager → **Sites** → `BitalFrontend` → **Bindings…**
2. **Add…**
   - Type: `https`
   - IP address: All Unassigned (o IP específica del servidor)
   - Port: **8080**
   - Host name: `riosoft.clinicadelriomonteria.com`
   - SSL certificate: seleccionar el certificado importado
   - ✅ Require Server Name Indication (SNI)
3. **OK** y reiniciar el sitio

Binding HTTP opcional (solo para redirect):

- Type: `http`, Port: **8080**, mismo host
- El `web.config` redirige automáticamente a HTTPS

---

## Paso 3 — Habilitar ARR proxy

1. IIS Manager → seleccionar el **servidor** (nodo raíz)
2. **Application Request Routing Cache** → **Server Proxy Settings…**
3. ✅ **Enable proxy**
4. Apply

Sin este paso, las reglas de rewrite hacia `127.0.0.1:8081` devuelven 502.

---

## Paso 4 — Verificar web.config

El build copia `frontend/public/web.config` a la raíz del sitio. Debe incluir:

- Regla **HTTP to HTTPS** (puerto 8080)
- Regla **API proxy** → `http://127.0.0.1:8081/api/v1/{R:1}`
- Regla **Health proxy** → `http://127.0.0.1:8081/health`
- Regla **SPA fallback** → `/index.html`
- Headers: HSTS, CSP, X-Frame-Options, etc.

No editar manualmente salvo ajustes de CSP; regenerar con `pnpm build:iis:frontend` si se pierde.

---

## Paso 5 — CORS en el API

En `appsettings.Production.json` del API, `Cors:AllowedOrigins` debe incluir:

```json
"https://riosoft.clinicadelriomonteria.com:8080"
```

Reiniciar el pool `BitalApiNegocioPool` tras cambios.

---

## Validación

```powershell
# Redirect HTTP → HTTPS
curl -I http://riosoft.clinicadelriomonteria.com:8080

# Headers de seguridad
curl -I https://riosoft.clinicadelriomonteria.com:8080

# Health vía proxy
curl https://riosoft.clinicadelriomonteria.com:8080/health

# SPA
curl -I https://riosoft.clinicadelriomonteria.com:8080/login
```

En el navegador (DevTools → Application → Cookies), tras login:

Tras login (DevTools → Cookies): `bital_access_token` con **Secure**, **HttpOnly** y **SameSite=Strict**.

Herramientas externas: [SSL Labs](https://www.ssllabs.com/ssltest/), [Security Headers](https://securityheaders.com/).

---

## Troubleshooting

| Problema | Solución |
|---|---|
| ERR_SSL_PROTOCOL_ERROR | Verificar binding HTTPS :8080 y certificado asignado |
| 502 Bad Gateway en `/api/v1` | API caída o ARR proxy deshabilitado; probar `127.0.0.1:8081/health` |
| Cookie sin flag Secure | Acceder solo por HTTPS; verificar `AuthCookieExtensions` en prod |
| Mixed content | Frontend debe usar URLs relativas (`/api/v1`) |
| Certificado expirado | Renovar e importar; actualizar binding |

---

## Renovación de certificado

1. Importar nuevo certificado en **Server Certificates**
2. Editar binding HTTPS del sitio → seleccionar nuevo certificado
3. Verificar con `curl -I` y SSL Labs
4. Programar recordatorio 30 días antes del vencimiento
