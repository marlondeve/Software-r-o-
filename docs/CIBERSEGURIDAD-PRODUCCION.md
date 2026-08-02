# Ciberseguridad — producción IIS HTTPS

Checklist y configuración de seguridad para **RIOSOFT / BITAL** en `https://riosoft.clinicadelriomonteria.com:8080`.

> **Despliegue:** se mantiene `appsettings.Production.json` con la configuración real del servidor para publicar (`dotnet publish`). La plantilla sin secretos está en `appsettings.Production.example.json` solo como referencia.

---

## Estado implementado en código

| Control | Dónde |
|--------|--------|
| JWT en cookie **HttpOnly + Secure + SameSite=Strict** (prod) | `AuthCookieExtensions.cs` |
| **HSTS** + headers de seguridad en API | `SecurityExtensions.cs` → `Program.cs` |
| **Rate limiting** login / cambiar contraseña (10 req/min por IP) | `AuthController` |
| **PBKDF2** para contraseñas (migración automática al iniciar sesión) | `PasswordHasher.cs` |
| Endpoints `_test/*` **solo Development** | `UsuariosPermisosController`, `AuditoriaController` |
| Redirect **HTTP → HTTPS** + **HSTS** + **CSP** en frontend | `frontend/public/web.config` |
| API interno solo `127.0.0.1:8081` | `appsettings.Production` / Kestrel |
| CORS restringido a origen HTTPS del frontend | `Cors:AllowedOrigins` |

---

## Acciones obligatorias en el servidor (post-despliegue HTTPS)

### 1. Secretos en producción (opcional)

`appsettings.Production.json` se usa tal cual en el release. Si en el futuro quieren sacar secretos del repositorio, pueden definirlos como variables IIS sin cambiar el flujo de publish:

```xml
<environmentVariable name="Jwt__Key" value="..." />
<environmentVariable name="ConnectionStrings__BitalDatabase" value="..." />
```

Plantilla de referencia: `appsettings.Production.example.json`.

### 2. CORS

Origen principal de producción:

```json
"https://riosoft.clinicadelriomonteria.com:8080"
```

Los orígenes HTTP adicionales en `appsettings.Production.json` son para acceso interno/diagnóstico; pueden reducirse cuando ya no se necesiten.

### 3. Redirect HTTP → HTTPS (puerto 8080)

- Regla en `frontend/public/web.config`: `http://…:8080` → `https://…:8080`
- Binding IIS: certificado SSL en puerto **8080**
- Verificar firewall: puerto **8080** HTTPS hacia el servidor

### 4. ApiConsultas (si sigue desplegada)

- Restringir a `127.0.0.1` o red interna.
- Añadir autenticación o consolidar en ApiNegocio.
- Deshabilitar Swagger y `DiagnosticoController` en producción.

### 5. IIS / ARR

- [ ] Certificado válido en binding HTTPS puerto **8080** + SNI
- [ ] ARR proxy habilitado
- [ ] Application pool identidad de mínimo privilegio
- [ ] Permisos de carpeta: lectura para `IIS_IUSRS`, sin escritura innecesaria

### 6. Validación rápida

```powershell
# Headers de seguridad
curl -I https://riosoft.clinicadelriomonteria.com:8080

# Redirect HTTP → HTTPS (mismo puerto)
curl -I http://riosoft.clinicadelriomonteria.com:8080

# Cookie Secure en login (DevTools → Application → Cookies)
# Debe aparecer bital_access_token con Secure + HttpOnly
```

Herramientas externas recomendadas: [SSL Labs](https://www.ssllabs.com/ssltest/), [Security Headers](https://securityheaders.com/).

---

## Modelo de autenticación (referencia)

```text
Navegador ──HTTPS──► IIS (BitalFrontend)
                         ├── /api/v1/*  → proxy → 127.0.0.1:8081 (ApiNegocio)
                         └── SPA React
ApiNegocio emite cookie HttpOnly; el JS del frontend NO lee el JWT.
```

---

## Pendientes recomendados (siguiente iteración)

- RBAC completo en backend (policies por rol, no solo en frontend).
- Auditoría de intentos fallidos de login / bloqueo temporal de cuenta.
- Secretos en Azure Key Vault o DPAPI si el entorno lo permite.
- Revisión periódica de dependencias (`dotnet list package --vulnerable`, `pnpm audit`).

---

Ver también: [PASOS-HTTPS-IIS-FRONTEND.md](./PASOS-HTTPS-IIS-FRONTEND.md)
