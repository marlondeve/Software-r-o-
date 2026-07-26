# Arquitectura del Sistema Bital

## 🏗️ Arquitectura Completa - Producción

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            INTERNET / RED LAN                            │
└────────────────────────────────┬────────────────────────────────────────┘
								 │
								 │ HTTP
								 ↓
					┌────────────────────────────┐
					│    FRONTEND (React/Vue)    │
					│                            │
					│  - Aplicación web Bital    │
					│  - Login usuarios          │
					│  - Módulo Dietas           │
					│  - Módulo Encuestas SIAO   │
					└────────────┬───────────────┘
								 │
								 │ HTTP + JWT Token
								 ↓
┌────────────────────────────────────────────────────────────────────────────┐
│              SERVIDOR DE APLICACIONES (186.190.254.230)                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                   BITAL.APINEGOCIO (Puerto 8080)                  │    │
│  │                           [PÚBLICO]                               │    │
│  ├──────────────────────────────────────────────────────────────────┤    │
│  │  Responsabilidades:                                               │    │
│  │  ✓ Autenticación JWT                                              │    │
│  │  ✓ Lógica de negocio                                              │    │
│  │  ✓ Gestión de dietas (solicitud, confirmación, cancelación)      │    │
│  │  ✓ Gestión de encuestas SIAO                                      │    │
│  │  ✓ Generación de órdenes de cocina                                │    │
│  │  ✓ Trazabilidad y auditoría                                       │    │
│  │                                                                    │    │
│  │  Endpoints principales:                                            │    │
│  │  • POST /api/v1/auth/login                                        │    │
│  │  • GET  /api/v1/dietas-cocina/censo                               │    │
│  │  • GET  /api/v1/dietas-cocina/catalogo                            │    │
│  │  • POST /api/v1/dietas-cocina/dietas/{id}/solicitud              │    │
│  │  • POST /api/v1/dietas-cocina/dietas/{id}/confirmar              │    │
│  │  • POST /api/v1/dietas-cocina/dietas/bulk/confirmar              │    │
│  │  • POST /api/v1/dietas-cocina/dietas/{id}/cancelar               │    │
│  └────────────────────┬─────────────────────────────────────────────┘    │
│                       │                                                   │
│                       │ HTTP + X-Internal-Api-Key                         │
│                       ↓                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                BITAL.APICONSULTAS (Puerto 5000)                   │    │
│  │                    [INTERNO - Solo localhost]                     │    │
│  ├──────────────────────────────────────────────────────────────────┤    │
│  │  Responsabilidades:                                               │    │
│  │  ✓ Bridge read-only al HIS Vital                                  │    │
│  │  ✓ Consulta de pacientes hospitalizados                           │    │
│  │  ✓ Consulta de atenciones activas                                 │    │
│  │  ✓ Transformación de datos Vital → Bital                          │    │
│  │                                                                    │    │
│  │  Seguridad:                                                        │    │
│  │  • Solo acepta peticiones desde localhost                         │    │
│  │  • Requiere X-Internal-Api-Key header                             │    │
│  │  • CORS deshabilitado                                              │    │
│  │                                                                    │    │
│  │  Endpoints:                                                        │    │
│  │  • GET /api/v1/Atenciones/hospitalarias                           │    │
│  │  • GET /api/v1/Pacientes/{id}                                     │    │
│  │  • GET /health                                                     │    │
│  └────────────────────┬─────────────────────────────────────────────┘    │
│                       │                                                   │
└───────────────────────┼───────────────────────────────────────────────────┘
						│
						│ SQL Server Connection
						│ Server=10.238.97.69
						│ User=Rio
						↓
┌────────────────────────────────────────────────────────────────────────────┐
│              SERVIDOR DE BASE DE DATOS (10.238.97.69)                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                 SQL SERVER (Puerto 1433)                          │    │
│  ├──────────────────────────────────────────────────────────────────┤    │
│  │                                                                    │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │         HOSVITAL_PRUEBAS (HIS Vital)                        │  │    │
│  │  │                                                              │  │    │
│  │  │  • Pacientes                                                │  │    │
│  │  │  • Atenciones                                               │  │    │
│  │  │  • Ingresos                                                 │  │    │
│  │  │  • Ubicaciones                                              │  │    │
│  │  │  • Historia clínica                                         │  │    │
│  │  │                                                              │  │    │
│  │  │  Acceso: READ-ONLY desde ApiConsultas                       │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  │                                                                    │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │         BITALNEGOCIO (Base de datos Bital)                  │  │    │
│  │  │                                                              │  │    │
│  │  │  Schema: dietas                                             │  │    │
│  │  │  • FilasDietas          (Censo operativo)                  │  │    │
│  │  │  • DietasCatalogo       (Tipos de dieta)                   │  │    │
│  │  │  • TarifasHistorico     (Tarifas por año)                  │  │    │
│  │  │  • EventosTrazabilidad  (Auditoría)                        │  │    │
│  │  │  • OrdenesCocina        (Órdenes de producción)            │  │    │
│  │  │                                                              │  │    │
│  │  │  Schema: encuestas_siao (Futuro)                            │  │    │
│  │  │  • ...                                                       │  │    │
│  │  │                                                              │  │    │
│  │  │  Acceso: READ-WRITE desde ApiNegocio                        │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  │                                                                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos - Ejemplo: Obtener Censo de Dietas

```
1. Frontend
   │
   │ GET /api/v1/dietas-cocina/censo?fecha=2026-07-25&comida=Almuerzo
   │ Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   │
   ↓
2. ApiNegocio (186.190.254.230:8080)
   │
   ├─→ Valida JWT token ✓
   │
   ├─→ Consulta BD local: ¿Existen filas para esta fecha/comida?
   │   │
   │   ↓ SQL: SELECT * FROM dietas.FilasDietas 
   │        WHERE FechaOperativa = '2026-07-25' AND Comida = 'Almuerzo'
   │   │
   │   └─→ BitalNegocio DB (10.238.97.69)
   │       Resultado: 0 filas (primera vez)
   │
   ├─→ Llama a ApiConsultas para obtener pacientes hospitalizados
   │   │
   │   │ GET http://localhost:5000/api/v1/Atenciones/hospitalarias
   │   │ X-Internal-Api-Key: token-secreto-interno
   │   │
   │   ↓
   │   3. ApiConsultas (localhost:5000)
   │      │
   │      ├─→ Valida API Key interna ✓
   │      ├─→ Valida origen localhost ✓
   │      │
   │      ├─→ Consulta HIS Vital
   │      │   │
   │      │   ↓ SQL: SELECT idIngreso, tipoDocumento, cedula, nombreCompleto,
   │      │            pabellon, cama
   │      │        FROM Hosvital_Pruebas.dbo.vw_AtencionesDietas
   │      │        WHERE estado = 'ACTIVO' AND pabellon IN ('3','4','5','6','7')
   │      │   │
   │      │   └─→ Hosvital_Pruebas DB (10.238.97.69)
   │      │       Resultado: 4 pacientes
   │      │
   │      └─→ Retorna: { "data": [paciente1, paciente2, ...] }
   │
   ├─→ Recibe lista de pacientes de ApiConsultas
   │
   ├─→ Por cada paciente:
   │   • Crea nueva fila en BD local con estado "Pendiente"
   │   │
   │   ↓ INSERT INTO dietas.FilasDietas 
   │        (PacienteId, IdIngreso, Paciente, Pabellon, Habitacion, 
   │         Comida, Estado, FechaOperativa)
   │     VALUES ('CC-1000179089', 1, 'LUISA FERNANDA...', 'PISO 3', 
   │             '3HP01', 'Almuerzo', 'Pendiente', '2026-07-25')
   │   │
   │   └─→ BitalNegocio DB (10.238.97.69)
   │       Se insertan 4 filas nuevas
   │
   └─→ Retorna censo completo con estadísticas
	   {
		 "filas": [...],
		 "totalPacientes": 4,
		 "dietasPendientes": 4,
		 "dietasSolicitadas": 0,
		 "dietasConfirmadas": 0
	   }
	   │
	   ↓
4. Frontend
   Muestra el censo para que Nutrición trabaje
```

---

## 🔒 Seguridad por Capas

| Capa | Componente | Mecanismo | Validación |
|------|-----------|-----------|------------|
| **1** | Frontend → ApiNegocio | JWT Bearer Token | Usuario autenticado, token no expirado |
| **2** | ApiNegocio → ApiConsultas | X-Internal-Api-Key | Token secreto compartido |
| **3** | ApiConsultas | IP Validation | Solo acepta localhost (127.0.0.1) |
| **4** | ApiConsultas → BD Vital | SQL Authentication | Usuario read-only (Rio) |
| **5** | ApiNegocio → BD BitalNegocio | SQL Authentication | Usuario read-write (bital_negocio) |

---

## 📊 Separación de Responsabilidades

### ApiConsultas (Bridge HIS)
- ✅ Solo lectura de datos operativos del HIS
- ✅ Transformación de esquema Vital → Bital
- ✅ Caché de consultas frecuentes
- ❌ NO tiene lógica de negocio
- ❌ NO persiste datos
- ❌ NO es accesible desde internet

### ApiNegocio (Aplicación)
- ✅ Lógica de negocio completa
- ✅ Persistencia de estado (dietas, encuestas)
- ✅ Generación de reportes
- ✅ Auditoría y trazabilidad
- ✅ Integración con otros sistemas
- ✅ API pública para frontend

---

## 🚀 Beneficios de esta Arquitectura

1. **Seguridad multicapa**: 
   - ApiConsultas protegida, no expuesta a internet
   - ApiNegocio con autenticación JWT
   - Separación de credenciales de BD

2. **Escalabilidad**:
   - Cada API puede escalar independientemente
   - ApiConsultas puede tener múltiples instancias
   - Cache en ApiConsultas sin afectar ApiNegocio

3. **Mantenibilidad**:
   - Cambios en HIS solo afectan ApiConsultas
   - Lógica de negocio aislada en ApiNegocio
   - Deploy independiente de cada API

4. **Performance**:
   - ApiConsultas optimizada solo para lectura
   - Conexión SQL con ApplicationIntent=ReadOnly
   - Cache de catálogos en ApiNegocio

5. **Trazabilidad**:
   - Logs separados por API
   - Auditoría completa en BD BitalNegocio
   - Correlación de requests con X-Correlation-Id

---

## 🔧 Tecnologías Utilizadas

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Runtime | .NET | 8.0 |
| Framework | ASP.NET Core | 8.0 |
| ORM | Entity Framework Core | 8.0 |
| Base de Datos | SQL Server | 2019+ |
| Logging | Serilog | 3.x |
| API Docs | Swagger/OpenAPI | 3.0 |
| Autenticación | JWT Bearer | - |
| Health Checks | ASP.NET Core Health Checks | 8.0 |
| Versionado API | Asp.Versioning.Mvc | 8.x |

---

## 📍 Puertos y Endpoints

### Desarrollo
- **ApiConsultas**: `http://186.190.254.230:8080` (Temporal)
- **ApiNegocio**: `http://localhost:5042`
- **Frontend**: `http://localhost:5173` (Vite) o `http://localhost:3000` (React)

### Producción
- **ApiNegocio**: `http://186.190.254.230:8080` (Público)
- **ApiConsultas**: `http://localhost:5000` (Interno)
- **Frontend**: `http://186.190.254.230` (Nginx)

---

## 🗄️ Modelo de Datos

### Base de Datos: Hosvital_Pruebas (HIS Vital)
- **Modo**: Solo lectura
- **Acceso**: ApiConsultas
- **Propósito**: Datos operativos hospitalarios

### Base de Datos: BitalNegocio
- **Modo**: Lectura/Escritura
- **Acceso**: ApiNegocio
- **Propósito**: Datos de negocio Bital

**Esquema `dietas`:**
```sql
dietas.FilasDietas           -- Censo operativo de dietas
dietas.DietasCatalogo        -- Catálogo de tipos de dieta
dietas.TarifasHistorico      -- Tarifas por año
dietas.EventosTrazabilidad   -- Auditoría de cambios
dietas.OrdenesCocina         -- Órdenes de producción
```

**Esquema `encuestas_siao`:** (Futuro)
```sql
encuestas_siao.Encuestas
encuestas_siao.Preguntas
encuestas_siao.Respuestas
-- ...
```
