# Ciberseguridad — producción IIS HTTPS

Checklist y configuración de seguridad para **RioSoft** en `https://riosoft.clinicadelriomonteria.com:8080`.

**Última actualización:** 2026-08-03

> **Despliegue:** `appsettings.Production.json` contiene la configuración del servidor. La plantilla sin secretos está en `appsettings.Production.example.json`.

---

## Estado implementado en código

| Control | Dónde |
|--------|--------|
| Cookie de sesión **Secure + HttpOnly + SameSite=Strict** (HTTPS, mismo origen) | `AuthCookieExtensions.cs` |
| **HSTS** + headers de seguridad en API | `SecurityExtensions.cs` → `Program.cs` |
| **Rate limiting** login / cambiar contraseña (10 req/min por IP) | `AuthController` |
| **PBKDF2** para contraseñas (migración automática desde SHA-256 legacy al login) | `PasswordHasher.cs` |
| Endpoints `_test/*` **solo Development** | `UsuariosPermisosController`, `AuditoriaController` |
| Redirect **HTTP → HTTPS** + **HSTS** + **CSP** en frontend | `frontend/public/web.config` |
| API interno solo `127.0.0.1:8081` | `appsettings.Production.json` → `Kestrel` |
| CORS restringido a origen HTTPS del frontend | `Cors:AllowedOrigins` |
| WebDAV deshabilitado (evita HTTP 405 en PUT/PATCH) | `web.config` frontend y API |

---

## Modelo de autenticación

```text
Navegador ──HTTPS :8080──► IIS (BitalFrontend)
                              ├── /api/v1/*  → proxy → 127.0.0.1:8081 (ApiNegocio)
                              ├── /health    → proxy → 127.0.0.1:8081
                              └── SPA React
ApiNegocio emite cookie de sesión segura; el JS del frontend no lee el JWT (solo perfil en `sessionStorage`).
```

---

## Acciones obligatorias en el servidor

### 1. Secretos en producción

Preferir variables de entorno IIS sobre valores en archivos versionados:

```xml
<!-- backend/Bital.ApiNegocio/web.config -->
<environmentVariable name="Jwt__Key" value="..." />
<environmentVariable name="ConnectionStrings__BitalDatabase" value="..." />
```

Plantilla: `appsettings.Production.example.json`.

### 2. CORS

Origen principal:

```json
"https://riosoft.clinicadelriomonteria.com:8080"
```

Reducir orígenes HTTP de diagnóstico cuando ya no se necesiten.

### 3. HTTPS puerto 8080

- Binding IIS con certificado SSL + SNI
- Regla redirect en `frontend/public/web.config`
- Firewall: solo **8080/TCP** entrante para el frontend

Guía paso a paso: [PASOS-HTTPS-IIS-FRONTEND.md](./PASOS-HTTPS-IIS-FRONTEND.md)

### 4. API no expuesta

- Binding **solo** `127.0.0.1:8081`
- No abrir puerto 8081 en firewall perimetral
- Swagger: deshabilitar o restringir en producción si no se usa

### 5. IIS / ARR

- [ ] Certificado válido en binding HTTPS puerto **8080**
- [ ] ARR proxy habilitado a nivel servidor
- [ ] Application pool con identidad de mínimo privilegio
- [ ] Permisos: lectura en frontend, lectura+logs en API
- [ ] Logs en `C:\logs\bital-api-negocio\` con permisos de escritura para el pool

### 6. Validación rápida

```powershell
curl -I https://riosoft.clinicadelriomonteria.com:8080
curl -I http://riosoft.clinicadelriomonteria.com:8080
curl https://riosoft.clinicadelriomonteria.com:8080/health
```

Tras login (DevTools → Cookies): `bital_access_token` con **Secure** + **HttpOnly** + **SameSite=Strict** (requiere acceso por HTTPS).

Herramientas: [SSL Labs](https://www.ssllabs.com/ssltest/), [Security Headers](https://securityheaders.com/).

---

## Pendientes recomendados

- RBAC completo en backend (policies por rol, no solo en frontend)
- Auditoría de intentos fallidos de login / bloqueo temporal
- Secretos en Key Vault o DPAPI si el entorno lo permite
- Revisión periódica: `dotnet list package --vulnerable`, `pnpm audit`

---

## Referencias

- [PASOS-HTTPS-IIS-FRONTEND.md](./PASOS-HTTPS-IIS-FRONTEND.md)
- [backend/DEPLOYMENT-IIS-GUIDE.md](../backend/DEPLOYMENT-IIS-GUIDE.md)
- [backend/FRONTEND-API-GUIDE.md](../backend/FRONTEND-API-GUIDE.md) — autenticación
