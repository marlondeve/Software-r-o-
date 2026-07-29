# Despliegue Hostinger + API en clínica

Arquitectura objetivo:

```text
Usuario
  ↓ HTTPS
https://riosoft.clinicadelriomonteria.com     ← Hostinger (React SPA)
  ↓ proxy .htaccess (/api/v1, /health)
http://api.clinicadelriomonteria.com:8080     ← IIS servidor clínica (Bital.ApiNegocio)
```

## DNS

| Registro | Tipo | Destino |
|----------|------|---------|
| `riosoft` | A o CNAME | Hostinger (IP del hosting) |
| `api` | A | `186.190.254.230` (servidor IIS de la clínica) |

El puerto **8080** no va en el DNS; se configura en IIS (binding) y firewall.

## Servidor API (clínica)

### IIS

- Sitio: `ApiBitalNegocioProc` (o equivalente)
- Binding: `http:*:8080:api.clinicadelriomonteria.com`
- Ruta física: carpeta con `Bital.ApiNegocio.dll` y `web.config`
- Application pool: **No Managed Code**
- Firewall: puerto **8080** abierto (ya funciona)

### Publicar

```powershell
cd backend/Bital.ApiNegocio
dotnet publish -c Release -o C:\ruta\publicacion
```

Copiar al servidor (ej. `E:\APIS\Bital\Bital.ApiNegocioProc`).

### Configuración (`appsettings.Production.json`)

- `Jwt:CrossOriginCookies`: `true`
- `Cors:AllowedOrigins`: incluir `https://riosoft.clinicadelriomonteria.com`
- `Kestrel` / binding IIS: puerto **8080**

### Probar API

```powershell
Invoke-RestMethod http://api.clinicadelriomonteria.com:8080/health
Invoke-RestMethod http://api.clinicadelriomonteria.com:8080/
```

## Frontend (Hostinger)

### 1. Variables de entorno

```bash
cd frontend
cp .env.hostinger.example .env.hostinger
```

Contenido de `.env.hostinger`:

```env
VITE_BITAL_API_BASE_URL=/api/v1
VITE_BITAL_API_HEALTH_URL=/health
HOSTINGER_API_PROXY=http://api.clinicadelriomonteria.com:8080
```

### 2. Build

Desde la raíz del monorepo:

```bash
pnpm build:hostinger
```

O desde `frontend/`:

```bash
pnpm build:hostinger
```

El build genera `frontend/dist/.htaccess` con reglas de proxy hacia el API.

### 3. Subir a Hostinger

Subir **todo** el contenido de `frontend/dist/` a la carpeta del subdominio `riosoft` (File Manager o FTP).

Asegurarse de que `.htaccess` esté en la raíz del sitio.

### 4. Verificar

| URL | Esperado |
|-----|----------|
| `https://riosoft.clinicadelriomonteria.com/` | Login / SPA |
| `https://riosoft.clinicadelriomonteria.com/health` | `Healthy` |
| `http://api.clinicadelriomonteria.com:8080/health` | `Healthy` (directo al API) |

## Requisito Hostinger: mod_proxy

El `.htaccess` usa la flag `[P]` (proxy). Requiere **mod_proxy** en Apache.

Si `https://riosoft.../health` devuelve 404 o 500:

1. Confirmar que `.htaccess` está en la raíz del sitio.
2. Contactar soporte Hostinger para habilitar proxy inverso en `.htaccess`.
3. Alternativa: plan VPS de Hostinger con control total de Apache.

## HTTPS en la API (opcional, futuro)

No es necesario para este esquema: Hostinger habla HTTP con el API por detrás.

Para exponer `https://api.clinicadelriomonteria.com` sin `:8080`:

1. Abrir puerto **443** en firewall/router.
2. Binding HTTPS en IIS con certificado válido para `api.clinicadelriomonteria.com`.
3. Actualizar `HOSTINGER_API_PROXY` a `https://api.clinicadelriomonteria.com`.

## Checklist

- [ ] DNS `api` → `186.190.254.230`
- [ ] DNS `riosoft` → Hostinger
- [ ] API responde en `http://api.clinicadelriomonteria.com:8080/health`
- [ ] CORS incluye `https://riosoft.clinicadelriomonteria.com`
- [ ] `pnpm build:hostinger` ejecutado
- [ ] `dist/` subido a Hostinger con `.htaccess`
- [ ] `https://riosoft.../health` responde OK
- [ ] Login funcional desde el frontend
