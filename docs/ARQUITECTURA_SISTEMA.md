# 🏗️ Arquitectura del Sistema Bital

## Ambientes de Ejecución

### ✅ Producción

**ApiConsultas (HIS Bridge)**
- URL: `http://186.190.254.230:8080`
- Estado: ✅ Desplegada y funcionando
- Propósito: Bridge de solo lectura con HIS Vital
- Endpoints principales:
  - `/health` - Health check
  - `/swagger` - Documentación
  - `/api/v1/pacientes/*` - Datos de pacientes
  - `/api/v1/ingresos/*` - Ingresos hospitalarios
  - `/api/v1/camas/*` - Ocupación de camas
  - Y más...

**ApiNegocio (Business Logic)**
- URL: 🚧 Pendiente de despliegue
- Estado: 🔨 En desarrollo local
- Base de datos: Remota en `10.238.97.69:1433`

---

### 💻 Desarrollo Local

**ApiNegocio**
- URL: `http://localhost:5042`
- Ambiente: Development
- Base de datos: **Local** - `DESKTOP-P43447B\SQLEXPRESS` (BitalNegocio)
- Apunta a: **ApiConsultas en producción** (`http://186.190.254.230:8080`)

---

## 📡 Flujo de Comunicación Actual

```
┌──────────────────────┐
│  React Frontend      │
│  (Desarrollo)        │
│  localhost:5173      │
└──────────┬───────────┘
		   │
		   ▼
┌──────────────────────────┐
│  Bital.ApiNegocio        │  ← Desarrollo LOCAL
│  http://localhost:5042    │
│  DB: SQLEXPRESS (local)  │
└──────────┬───────────────┘
		   │
		   │ HTTP Client
		   ▼
┌──────────────────────────┐
│  Bital.ApiConsultas      │  ← PRODUCCIÓN
│  http://186.190.254.230:8080
│  (Solo lectura HIS)      │
└──────────────────────────┘
```

---

## 🔧 Configuración de Conexión

### appsettings.Development.json (ApiNegocio)

```json
{
  "ConnectionStrings": {
	"BitalDatabase": "Data Source=DESKTOP-P43447B\\SQLEXPRESS;Initial Catalog=BitalNegocio;Integrated Security=True;..."
  },
  "ApiConsultas": {
	"BaseUrl": "http://186.190.254.230:8080"  // ← Producción
  }
}
```

### appsettings.json (ApiNegocio - Producción futura)

```json
{
  "ConnectionStrings": {
	"BitalDatabase": "Server=10.238.97.69,1433;Database=BitalNegocio;User Id=sa;Password=...;..."
  },
  "ApiConsultas": {
	"BaseUrl": "http://186.190.254.230:8080"  // ← Mismo servidor
  }
}
```

---

## 🎯 Ventajas de esta Arquitectura

### ✅ En Desarrollo
1. **Datos reales**: Trabajo con datos reales del HIS desde ApiConsultas en producción
2. **BD local**: Puedo hacer cambios/pruebas sin afectar producción
3. **Rápido**: No necesito levantar ApiConsultas localmente
4. **Aislado**: Mis cambios en ApiNegocio no afectan a otros

### ✅ En Producción
1. **Separación de responsabilidades**: ApiConsultas (HIS) vs ApiNegocio (lógica)
2. **Escalabilidad independiente**: Cada API puede escalar por separado
3. **Seguridad**: ApiNegocio agrega capa de autenticación/autorización
4. **Auditoría**: Toda modificación queda registrada en BitalNegocio

---

## 📝 Notas Importantes

1. **ApiConsultas es READ-ONLY**: Solo consulta, nunca modifica el HIS
2. **ApiNegocio es el cerebro**: Toda lógica de negocio, validaciones, y escritura
3. **Frontend solo habla con ApiNegocio**: No accede directamente a ApiConsultas
4. **Base de datos Bital**: Separada completamente del HIS Vital

---

## 🚀 Iniciar el Sistema Localmente

### 1. Verificar que ApiConsultas (prod) responde
```powershell
Invoke-RestMethod -Uri "http://186.190.254.230:8080/health"
```

### 2. Iniciar ApiNegocio local
```powershell
cd backend/Bital.ApiNegocio
dotnet run
# Disponible en: http://localhost:5042
```

### 3. Iniciar Frontend
```powershell
cd frontend
npm run dev
# Disponible en: http://localhost:5173
```

---

## 🔒 Seguridad

- [ ] ApiNegocio debe validar tokens JWT antes de llamar ApiConsultas
- [ ] Configurar CORS estricto en producción
- [ ] SSL/TLS obligatorio en producción (HTTPS)
- [ ] Logs de auditoría en todas las operaciones de escritura
- [ ] Rate limiting en ApiNegocio

---

**Última actualización**: 25/01/2026  
**Developer**: Juan Dev  
**Rama**: `feature/api-consultas-juandev`
