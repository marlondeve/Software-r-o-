# Guía paso a paso — Frontend BITAL en HTTPS (IIS)

Configuración del frontend en IIS con certificado SSL, subdominio y proxy al API interno.

**Servidor:** `SERVERAPPFCR` (`10.238.97.67` / IP pública `186.190.254.230`)  
**Sitio IIS:** `BitalFrontend`  
**Dominio:** `riosoft.clinicadelriomonteria.com`  
**Estado actual:** HTTPS en `https://riosoft.clinicadelriomonteria.com:8080`. Ver [CIBERSEGURIDAD-PRODUCCION.md](./CIBERSEGURIDAD-PRODUCCION.md) para checklist de seguridad.

---

## Arquitectura objetivo

```text
https://riosoft.clinicadelriomonteria.com  (puerto 443, certificado SSL)
        │
        ├── /login, /dietas-cocina/*  →  archivos estáticos (React)
        ├── /api/v1/*                 →  proxy → 127.0.0.1:8081
        └── /health                   →  proxy → 127.0.0.1:8081
```

El API escucha solo en `127.0.0.1:8081`. El `web.config` del frontend hace proxy interno; no es necesario exponer el API públicamente.

---

## Prerrequisitos (verificar antes de continuar)

- [ ] DNS de `riosoft.clinicadelriomonteria.com` apunta a `186.190.254.230`
- [ ] Sitio **`BitalFrontend`** creado en IIS
- [ ] CSR (`.req`) generado **en `SERVERAPPFCR`** (mismo servidor donde se instalará el certificado)
- [ ] **URL Rewrite** instalado en IIS
- [ ] **Application Request Routing (ARR)** instalado y proxy habilitado
- [ ] API corriendo en `127.0.0.1:8081`

### Habilitar proxy ARR

1. IIS Manager → clic en el **servidor** (`SERVERAPPFCR`)
2. **Application Request Routing Cache** → **Server Proxy Settings**
3. Marcar **Enable proxy** → **Apply**

### Verificar DNS

```powershell
nslookup riosoft.clinicadelriomonteria.com
```

Debe resolver a `186.190.254.230`.

---

## Fase 1 — Instalar el certificado en IIS

> **Importante:** El archivo `.req` es la **solicitud** (CSR). El certificado entregado por TI/CA es un archivo **`.cer`**, **`.crt`** o **`.p7b`**. No uses el `.req` en "Completar solicitud de certificado".

### 1. Copiar el archivo al servidor

Guardar el certificado entregado por TI en:

```text
C:\temp\riosoft.clinicadelriomonteria.com.cer
```

### 2. Completar la solicitud de certificado

1. IIS Manager → clic en el **servidor** → **Certificados de servidor**
2. Panel derecho → **Completar solicitud de certificado...**
3. Configuración:

| Campo | Valor |
|---|---|
| Archivo que contiene la respuesta | `C:\temp\riosoft.clinicadelriomonteria.com.cer` |
| Nombre descriptivo | `riosoft.clinicadelriomonteria.com` |
| Almacén de certificados | **Personal** |

4. **Aceptar**

### 3. Verificar instalación

En la lista de certificados debe aparecer `riosoft.clinicadelriomonteria.com` con emisor y fecha de vencimiento.

### Error frecuente

Si aparece:

> *"No se encuentra la solicitud de certificado asociada con este archivo..."*

Causas:

1. Se seleccionó el `.req` en lugar del `.cer` entregado por la CA
2. El `.req` se generó en **otro equipo** distinto a `SERVERAPPFCR`

**Solución:** Generar un nuevo `.req` en `SERVERAPPFCR` y pedir a TI que emita el certificado con ese CSR, o pedir un `.pfx` con clave privada para importar directamente.

---

## Fase 2 — Configurar HTTPS en BitalFrontend

### 4. Agregar binding HTTPS

1. IIS → **Sitios** → **`BitalFrontend`**
2. Panel derecho → **Enlaces...**
3. **Agregar...**

| Campo | Valor |
|---|---|
| Tipo | `https` |
| Dirección IP | Todas las no asignadas |
| Puerto | `443` |
| Nombre de host | `riosoft.clinicadelriomonteria.com` |
| Certificado SSL | `riosoft.clinicadelriomonteria.com` |
| Requerir Indicación de nombre de servidor | ✅ (si aparece la opción) |

4. **Aceptar**

### 5. (Opcional) Binding HTTP para redirección

Si se desea redirigir `http://` → `https://`:

1. **Enlaces...** → **Agregar...**
2. Tipo: `http`, Puerto: `80`, Nombre de host: `riosoft.clinicadelriomonteria.com`

---

## Fase 3 — Desplegar el frontend

### 6. Build en máquina de desarrollo

```powershell
cd frontend
pnpm build:iis
```

### 7. Copiar archivos al servidor

Copiar **todo** el contenido de `frontend/dist/` a la carpeta física del sitio `BitalFrontend` (ver ruta en IIS → **Configuración básica...**).

Debe quedar en la raíz del sitio:

- `index.html`
- carpeta `assets/`
- **`web.config`**

### 8. Permisos de carpeta

```powershell
$path = "C:\inetpub\wwwroot\bital-frontend"   # ajustar si la ruta es distinta
$acl = Get-Acl $path
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow"
)
$acl.SetAccessRule($rule)
Set-Acl $path $acl
```

---

## Fase 4 — Firewall

### 9. Abrir puertos

En PowerShell como Administrador:

```powershell
New-NetFirewallRule -DisplayName "BITAL Frontend HTTPS 443" `
  -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

Si se agregó redirección HTTP:

```powershell
New-NetFirewallRule -DisplayName "BITAL Frontend HTTP 80" `
  -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
```

Confirmar con el equipo de redes que el NAT/firewall perimetral permita tráfico entrante a `443` (y `80` si aplica) hacia `10.238.97.67`.

---

## Fase 5 — Redirección HTTP → HTTPS (opcional)

### 10. Editar web.config

Agregar esta regla **al inicio** de `<rules>`, antes del proxy al API:

```xml
<rule name="HTTP to HTTPS" stopProcessing="true">
  <match url="(.*)" />
  <conditions>
    <add input="{HTTPS}" pattern="off" ignoreCase="true" />
  </conditions>
  <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
</rule>
```

El `web.config` completo del frontend incluye además:

- Proxy `/api/v1/*` → `http://127.0.0.1:8081/api/v1/{R:1}`
- Proxy `/health` → `http://127.0.0.1:8081/health`
- Fallback SPA para React Router

Ver: [`frontend/public/web.config`](../frontend/public/web.config)

---

## Fase 6 — CORS en el API

### 11. Actualizar appsettings.Production.json

En `backend/Bital.ApiNegocio/appsettings.Production.json`, agregar el origen HTTPS:

```json
"Cors": {
  "AllowedOrigins": [
    "https://riosoft.clinicadelriomonteria.com",
    "http://186.190.254.230:8080"
  ]
}
```

Reiniciar el Application Pool del API:

```powershell
Restart-WebAppPool -Name "NombreDelPoolDelAPI"
```

> Usar el nombre real del pool en IIS (por ejemplo `ApiBitaNegocioPred` u otro según el servidor).

---

## Fase 7 — Pruebas

### 12. Desde el servidor

```powershell
Invoke-WebRequest https://localhost/login -UseBasicParsing
Invoke-RestMethod https://localhost/health
```

### 13. Desde cualquier PC

| URL | Resultado esperado |
|---|---|
| `https://riosoft.clinicadelriomonteria.com/login` | Pantalla de login, candado verde |
| `https://riosoft.clinicadelriomonteria.com/health` | `Healthy` |
| `https://riosoft.clinicadelriomonteria.com/dietas-cocina/inicio` | Carga correctamente al recargar (F5) |
| DevTools → Network | Llamadas a `/api/v1/...` sin errores CORS |

---

## Fase 8 — Retirar acceso por :8080

Cuando HTTPS funcione correctamente:

1. IIS → sitio que escucha en `:8080` → **Enlaces...**
2. Eliminar el binding `http :8080`
3. (Opcional) Deshabilitar regla de firewall del puerto 8080

El frontend quedará accesible solo en:

```text
https://riosoft.clinicadelriomonteria.com
```

---

## Alternativa — Certificado en formato .pfx

Si TI entrega un `.pfx` (certificado + clave privada) en lugar de `.cer`:

1. IIS → **Certificados de servidor** → **Importar...**
2. Seleccionar el `.pfx` e ingresar la contraseña
3. Almacén: **Personal**
4. Continuar desde la **Fase 2** (configurar binding HTTPS)

---

## Datos del CSR (referencia)

Al generar la solicitud de certificado, usar:

| Campo | Valor |
|---|---|
| Nombre común | `riosoft.clinicadelriomonteria.com` |
| Organización | Clinica del Rio |
| Unidad organizativa | Clinica del Rio |
| Ciudad | Montería |
| Estado/provincia | Cordoba |
| País | `CO` (Colombia) |

> **No** usar solo `RIOSOFT` como nombre común ni `ES` como país.

---

## Tiempos estimados de entrega del certificado

| Tipo | Tiempo típico |
|---|---|
| Autofirmado (pruebas) | Inmediato |
| Let's Encrypt (win-acme) | 2–10 minutos |
| CA interna de la clínica | 1–3 días hábiles |
| CA comercial (DV) | 15 min – 24 h |
| CA comercial (OV/EV) | 3–10 días hábiles |

---

## Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| Error al completar solicitud | Se usó `.req` en lugar de `.cer` | Importar el `.cer` entregado por la CA |
| Error al completar solicitud | CSR generado en otro servidor | Regenerar `.req` en `SERVERAPPFCR` o importar `.pfx` |
| Certificado inválido en navegador | CN distinto al dominio | CN debe ser `riosoft.clinicadelriomonteria.com` |
| 502 en `/api/v1` o `/health` | API no corre o ARR deshabilitado | Verificar API en `:8081` y proxy ARR |
| 404 al recargar rutas SPA | Falta regla en `web.config` | Confirmar `web.config` en la raíz del sitio |
| CORS en consola del navegador | Origen HTTPS no en `AllowedOrigins` | Actualizar CORS y reiniciar pool del API |

---

## Checklist final

```text
[ ] Certificado .cer / .pfx copiado a C:\temp\
[ ] Completar solicitud de certificado (con .cer, NO .req)
[ ] Certificado visible en Certificados de servidor
[ ] Binding HTTPS 443 en BitalFrontend
[ ] Build frontend (pnpm build:iis) copiado a carpeta del sitio
[ ] web.config presente en la raíz
[ ] URL Rewrite instalado
[ ] ARR proxy habilitado
[ ] Firewall 443 abierto
[ ] CORS actualizado en appsettings.Production.json
[ ] Pruebas OK en https://riosoft.clinicadelriomonteria.com
[ ] Binding :8080 retirado
```

---

## Documentación relacionada

- [frontend/README.md](../frontend/README.md) — Stack, build y despliegue IIS
- [backend/DEPLOYMENT-IIS-GUIDE.md](../backend/DEPLOYMENT-IIS-GUIDE.md) — Despliegue del API en IIS
- [frontend/public/web.config](../frontend/public/web.config) — Proxy y fallback SPA
