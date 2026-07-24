# 🌐 Guía de Consumo API - Bital.ApiConsultas (Producción)

> **Documentación para equipo de Frontend**  
> API de consultas de datos del HIS Vital para aplicaciones Bital

---

## 📡 URLs de Producción

### Servidor Principal
```
Base URL:   http://186.190.254.230:2000
API Base:   http://186.190.254.230:2000/api/v1
Swagger:    http://186.190.254.230:2000/swagger
Health:     http://186.190.254.230:2000/health
```

### Servidor Interno (Red Clínica)
```
Base URL:   http://10.238.97.67:2000
API Base:   http://10.238.97.67:2000/api/v1
```

---

## 🚀 Inicio Rápido

### Verificar que la API está funcionando

```javascript
// JavaScript/TypeScript
const API_BASE = 'http://186.190.254.230:2000/api/v1';

// Health check
fetch('http://186.190.254.230:2000/health')
  .then(res => res.json())
  .then(data => console.log('API Status:', data.status));
```

---

## 🔐 Autenticación y Headers

### Headers Requeridos
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

> **Nota**: Actualmente la API no requiere autenticación. Se implementará JWT en futuras versiones.

### Configuración de CORS
La API ya está configurada para aceptar requests desde:
- `http://localhost:5173` (desarrollo Vite)
- `http://localhost:3000` (desarrollo general)
- Agregar URL de producción cuando esté disponible

---

## 📚 Endpoints Disponibles

### 1. 👤 Pacientes

#### Buscar Pacientes
```http
GET /api/v1/pacientes/search?termino={busqueda}
```

**Parámetros:**
- `termino` (string, requerido): Texto a buscar (nombre, apellido o cédula)

**Ejemplo:**
```javascript
// Buscar pacientes por nombre
const searchPatients = async (searchTerm) => {
  const response = await fetch(
	`${API_BASE}/pacientes/search?termino=${encodeURIComponent(searchTerm)}`,
	{ headers }
  );

  if (!response.ok) {
	throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data; // Array de pacientes
};

// Uso
const pacientes = await searchPatients('lopez');
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
	{
	  "cedula": "1003195163",
	  "tipoDocumento": "CC",
	  "nombreCompleto": "MANUEL DE JESUS LOPEZ MARTINEZ",
	  "primerNombre": "MANUEL",
	  "segundoNombre": "DE JESUS",
	  "primerApellido": "LOPEZ",
	  "segundoApellido": "MARTINEZ",
	  "fechaNacimiento": "1956-09-08T00:00:00",
	  "edad": 67,
	  "sexo": "M",
	  "telefono": null,
	  "direccion": null,
	  "email": null
	}
  ],
  "errors": null,
  "timestamp": "2026-07-23T21:30:00Z"
}
```

---

### 2. 🏥 Atenciones (Ingresos Hospitalarios)

#### Listar Todas las Atenciones Activas
```http
GET /api/v1/atenciones
```

**Ejemplo:**
```javascript
const getActiveAtenciones = async () => {
  const response = await fetch(`${API_BASE}/atenciones`, { headers });
  const data = await response.json();
  return data.data;
};
```

#### Filtrar por Servicio
```http
GET /api/v1/atenciones?servicioId={servicioId}
```

**Parámetros:**
- `servicioId` (string, opcional): Código del servicio hospitalario

**Ejemplo:**
```javascript
const getAtencionesByService = async (servicioId) => {
  const response = await fetch(
	`${API_BASE}/atenciones?servicioId=${servicioId}`,
	{ headers }
  );
  const data = await response.json();
  return data.data;
};
```

#### Obtener Atención por ID
```http
GET /api/v1/atenciones/{id}
```

**Parámetros:**
- `id` (number, requerido): Consecutivo del ingreso

**Ejemplo:**
```javascript
const getAtencionById = async (id) => {
  const response = await fetch(`${API_BASE}/atenciones/${id}`, { headers });

  if (response.status === 404) {
	return null; // Atención no encontrada
  }

  const data = await response.json();
  return data.data;
};

// Uso
const atencion = await getAtencionById(1);
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
	"cedula": "1003195163",
	"tipoDocumento": "CC",
	"consecutivo": 1,
	"paciente": {
	  "cedula": "1003195163",
	  "tipoDocumento": "CC",
	  "nombreCompleto": "MANUEL DE JESUS LOPEZ MARTINEZ",
	  "primerNombre": "MANUEL",
	  "segundoNombre": "DE JESUS",
	  "primerApellido": "LOPEZ",
	  "segundoApellido": "MARTINEZ",
	  "fechaNacimiento": "1956-09-08T00:00:00",
	  "edad": 67,
	  "sexo": "M"
	},
	"claseProcedimiento": "URGENCIAS",
	"fechaAdmision": "2024-07-15T08:30:00",
	"fechaEgreso": "2024-07-18T14:00:00",
	"estaActivo": false,
	"estadoActual": "Egresado",
	"diagnosticoEntrada": "J18.9 - Neumonía",
	"diagnosticoSalida": "J18.9 - Neumonía controlada",
	"tipoHospitalizacion": "URGENTE",
	"numeroFactura": "FAC-2024-00123"
  }
}
```

#### Obtener Atenciones de un Paciente
```http
GET /api/v1/atenciones/paciente?numeroDocumento={cedula}&tipoDocumento={tipo}
```

**Parámetros:**
- `numeroDocumento` (string, requerido): Cédula del paciente
- `tipoDocumento` (string, requerido): Tipo de documento (CC, TI, CE, etc.)

**Ejemplo:**
```javascript
const getPatientAtenciones = async (cedula, tipoDoc = 'CC') => {
  const params = new URLSearchParams({
	numeroDocumento: cedula,
	tipoDocumento: tipoDoc
  });

  const response = await fetch(
	`${API_BASE}/atenciones/paciente?${params}`,
	{ headers }
  );

  const data = await response.json();
  return data.data;
};

// Uso
const atenciones = await getPatientAtenciones('1003195163', 'CC');
```

---

### 3. 🍽️ Atenciones Hospitalarias (Módulo Dietas)

#### Obtener Pacientes Hospitalizados (Pabellones 3-7)
```http
GET /api/v1/atenciones/hospitalarias
```

> **Uso específico**: Este endpoint está diseñado para el módulo de Dietas-Cocina.  
> Retorna solo pacientes actualmente hospitalizados en pabellones 3, 4, 5, 6 y 7.

**Ejemplo:**
```javascript
const getHospitalizedPatients = async () => {
  const response = await fetch(
	`${API_BASE}/atenciones/hospitalarias`,
	{ headers }
  );

  const data = await response.json();
  return data.data;
};
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
	{
	  "idIngreso": 2,
	  "tipoDocumento": "CC",
	  "cedula": "1067923999",
	  "nombreCompleto": "YERALDINE PEÑATE HOYOS",
	  "pabellon": "HOSPITALIZACION PISO 3",
	  "cama": "3HP02"
	},
	{
	  "idIngreso": 15,
	  "tipoDocumento": "CC",
	  "cedula": "1234567890",
	  "nombreCompleto": "MARIA RODRIGUEZ GOMEZ",
	  "pabellon": "HOSPITALIZACION PISO 4",
	  "cama": "4HP05"
	}
  ]
}
```

**Campo por campo:**
- `idIngreso`: ID único del ingreso (usar para referencias)
- `tipoDocumento`: Tipo de documento del paciente
- `cedula`: Número de documento
- `nombreCompleto`: Nombre completo del paciente
- `pabellon`: Nombre del pabellón/área de hospitalización
- `cama`: Código de la cama asignada

---

## 🔄 Formato de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "data": { /* ... datos del endpoint ... */ },
  "errors": null,
  "timestamp": "2026-07-23T21:30:00Z"
}
```

### Respuesta con Error 4xx/5xx
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Atención no encontrada",
  "status": 404,
  "detail": "No se encontró una atención con ID '999'",
  "instance": "/api/v1/atenciones/999",
  "traceId": "00-abc123..."
}
```

---

## 🛡️ Manejo de Errores

### Códigos de Estado HTTP

| Código | Significado | Acción |
|--------|-------------|--------|
| `200` | OK | Datos obtenidos correctamente |
| `400` | Bad Request | Validar parámetros enviados |
| `404` | Not Found | Recurso no existe |
| `500` | Server Error | Reportar al equipo backend |

### Ejemplo de Manejo de Errores
```javascript
const safeApiCall = async (url) => {
  try {
	const response = await fetch(url, { headers });

	if (!response.ok) {
	  const error = await response.json();
	  throw new Error(error.detail || error.title || 'Error desconocido');
	}

	const data = await response.json();
	return data.data;

  } catch (error) {
	console.error('Error en API:', error.message);
	// Mostrar mensaje al usuario
	return null;
  }
};
```

---

## 📦 Service Helper (React/TypeScript)

### Ejemplo de Servicio Reutilizable

```typescript
// src/services/bitalApiService.ts

const API_BASE = 'http://186.190.254.230:2000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  errors: string[] | null;
  timestamp: string;
}

interface Paciente {
  cedula: string;
  tipoDocumento: string;
  nombreCompleto: string;
  edad: number;
  sexo: string;
  // ... otros campos
}

interface AtencionHospitalaria {
  idIngreso: number;
  tipoDocumento: string;
  cedula: string;
  nombreCompleto: string;
  pabellon: string;
  cama: string;
}

class BitalApiService {
  private headers = {
	'Content-Type': 'application/json',
	'Accept': 'application/json'
  };

  private async fetchApi<T>(endpoint: string): Promise<T> {
	const response = await fetch(`${API_BASE}${endpoint}`, {
	  headers: this.headers
	});

	if (!response.ok) {
	  const error = await response.json();
	  throw new Error(error.detail || 'Error en la API');
	}

	const data: ApiResponse<T> = await response.json();
	return data.data;
  }

  async searchPacientes(termino: string): Promise<Paciente[]> {
	return this.fetchApi<Paciente[]>(
	  `/pacientes/search?termino=${encodeURIComponent(termino)}`
	);
  }

  async getAtencionById(id: number) {
	try {
	  return await this.fetchApi(`/atenciones/${id}`);
	} catch (error) {
	  if (error.message.includes('404')) {
		return null;
	  }
	  throw error;
	}
  }

  async getHospitalizedPatients(): Promise<AtencionHospitalaria[]> {
	return this.fetchApi<AtencionHospitalaria[]>('/atenciones/hospitalarias');
  }

  async checkHealth(): Promise<{ status: string }> {
	const response = await fetch('http://186.190.254.230:2000/health');
	return response.json();
  }
}

export const bitalApi = new BitalApiService();
export type { Paciente, AtencionHospitalaria };
```

### Uso en Componente React
```tsx
// src/components/PatientSearch.tsx
import { useState } from 'react';
import { bitalApi, Paciente } from '../services/bitalApiService';

export const PatientSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
	if (!searchTerm) return;

	setLoading(true);
	setError(null);

	try {
	  const results = await bitalApi.searchPacientes(searchTerm);
	  setPatients(results);
	} catch (err) {
	  setError('Error al buscar pacientes');
	  console.error(err);
	} finally {
	  setLoading(false);
	}
  };

  return (
	<div>
	  <input
		type="text"
		value={searchTerm}
		onChange={(e) => setSearchTerm(e.target.value)}
		placeholder="Buscar paciente por nombre o cédula"
	  />
	  <button onClick={handleSearch} disabled={loading}>
		{loading ? 'Buscando...' : 'Buscar'}
	  </button>

	  {error && <p className="error">{error}</p>}

	  <ul>
		{patients.map(p => (
		  <li key={`${p.tipoDocumento}-${p.cedula}`}>
			{p.nombreCompleto} - {p.tipoDocumento} {p.cedula} (Edad: {p.edad})
		  </li>
		))}
	  </ul>
	</div>
  );
};
```

---

## 🧪 Datos de Prueba

### Pacientes Reales en BD (para testing)

```javascript
// Pacientes que existen en la base de datos Vital
const TEST_PATIENTS = [
  {
	cedula: '1003195163',
	tipoDocumento: 'CC',
	nombre: 'MANUEL DE JESUS LOPEZ MARTINEZ'
  },
  {
	cedula: '1067923999',
	tipoDocumento: 'CC',
	nombre: 'YERALDINE PEÑATE HOYOS'
  }
];

// Atenciones reales
const TEST_ATENCIONES = [
  { id: 1, paciente: 'MANUEL DE JESUS LOPEZ MARTINEZ', estado: 'Egresado' },
  { id: 2, paciente: 'YERALDINE PEÑATE HOYOS', estado: 'Activo', cama: '3HP02' }
];
```

---

## 🐛 Debugging

### Verificar Conectividad
```javascript
// Probar si la API está accesible
const testApi = async () => {
  try {
	const response = await fetch('http://186.190.254.230:2000/health');
	const data = await response.json();
	console.log('✅ API disponible:', data);
  } catch (error) {
	console.error('❌ API no disponible:', error);
  }
};

testApi();
```

### Ver Documentación Completa (Swagger)
```
http://186.190.254.230:2000/swagger
```

---

## 📞 Soporte y Contacto

### Equipo Backend
- **Email**: soporte.bital@clinicadelrio.com
- **Repositorio**: https://github.com/marlondeve/Software-r-o-
- **Rama**: `feature/api-consultas-juandev`

### Reportar Problemas
1. Verificar endpoint en Swagger
2. Verificar que el servidor esté activo (`/health`)
3. Revisar logs de red (DevTools → Network)
4. Reportar con:
   - URL exacta usada
   - Parámetros enviados
   - Respuesta completa del servidor

---

## 📚 Documentación Adicional

- **Guía Frontend Completa**: `backend/FRONTEND-API-GUIDE.md`
- **Guía de Despliegue**: `backend/DEPLOYMENT-QUICKSTART.md`
- **README General**: `backend/README.md`

---

## 🔄 Historial de Cambios

### v1.0.0 (2026-07-23)
- ✅ Endpoint de búsqueda de pacientes
- ✅ Endpoints de atenciones (CRUD básico)
- ✅ Endpoint especializado para Dietas (atenciones hospitalarias)
- ✅ Simplificación de ID de atenciones (consecutivo numérico)
- ✅ Documentación completa con ejemplos

---

**Última actualización**: 2026-07-23  
**Versión API**: v1.0  
**Entorno**: Producción  
**Base URL**: http://186.190.254.230:2000
