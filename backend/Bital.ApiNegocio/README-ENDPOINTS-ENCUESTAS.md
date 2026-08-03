# Guía de endpoints del módulo de encuestas

Este documento explica los endpoints reales que el frontend debe consumir para el módulo de encuestas en `Bital.ApiNegocio`.

La idea es que esta guía sirva como apoyo directo para el formulario y para las pantallas operativas del equipo frontend: qué hace cada endpoint, en qué momento usarlo y qué resultado esperar.

## Base URL

| Entorno | URL |
|---|---|
| Desarrollo local | `http://localhost:8080` |
| Producción (vía proxy IIS) | `https://riosoft.clinicadelriomonteria.com:8080` — rutas relativas `/api/v1` |

Prefijo de versión: `/api/v1`

> Todos los endpoints requieren cookie de sesión JWT salvo los marcados como anónimos. Ver [FRONTEND-API-GUIDE.md](../FRONTEND-API-GUIDE.md#autenticación).

---

## 1. Pacientes, captura y flujo de encuesta

Esta sección cubre el flujo que normalmente sigue el formulario de captura. El frontend debe usar estos endpoints cuando un usuario busque un paciente, inicie una encuesta, guarde respuestas parciales o complete el registro.

### ¿Qué hace esta sección?

- Permite identificar al paciente.
- Recupera atenciones disponibles para asociar la encuesta.
- Inicia la captura presencial o telefónica.
- Guarda respuestas parciales mientras el formulario está abierto.
- Finaliza la encuesta cuando el usuario confirma el envío.

### Buscar pacientes

Usar cuando el formulario necesite autocompletar pacientes por nombre, documento o texto parcial.

El parámetro `termino` es el texto que escribe el usuario y `maxResults` limita la cantidad de coincidencias.

```http
GET /api/v1/encuestas/pacientes/search?termino=juan&maxResults=10
```

### Obtener atenciones de un paciente

Usar después de identificar al paciente para mostrar las atenciones vigentes y permitir seleccionar la correcta antes de iniciar la encuesta.

`cedula` representa el documento del paciente y `tipoDocumento` ayuda a filtrar correctamente.

```http
GET /api/v1/encuestas/pacientes/{cedula}/atenciones?tipoDocumento=CC
```

### Identificar paciente

Usar cuando el usuario ya eligió al paciente o cuando el formulario necesita validar la persona antes de continuar.

Este endpoint es el punto de entrada para asociar documento, tipo de documento, canal y atención.

```http
POST /api/v1/encuestas/pacientes/identificar
```

Body:

```json
{
  "numeroDocumento": "1003195163",
  "tipoDocumento": "CC",
  "canal": "Presencial",
  "numeroAtencion": 12345
}
```

### Cola de captura presencial

Usar para listar pacientes o atenciones pendientes de captura en el módulo presencial.

El frontend puede usar esta lista como bandeja de trabajo, aplicando filtros por servicio y paginación.

```http
GET /api/v1/encuestas/captura/presencial/pendientes?servicio=Hospitalizaci%C3%B3n&page=1&pageSize=10
```

### Iniciar captura presencial

Usar cuando el usuario vaya a empezar a diligenciar el formulario de encuesta. El endpoint crea la captura inicial y devuelve el identificador que luego se usa para guardar respuestas y completar.

El `pacienteId` viene de la selección previa y `cuestionarioId` indica qué encuesta se va a aplicar.

```http
POST /api/v1/encuestas/captura/presencial/{pacienteId}/iniciar
```

Body:

```json
{
  "cuestionarioId": "guid-del-cuestionario"
}
```

### Guardar respuestas parciales

Usar para autosalvar o para que el formulario vaya persistiendo respuestas a medida que el usuario avanza.

Este endpoint no debe verse como cierre de la encuesta, sino como una forma segura de no perder información si el usuario se detiene a mitad del proceso.

```http
PUT /api/v1/encuestas/captura/{encuestaId}/respuestas
```

### Completar encuesta

Usar cuando el formulario ya esté completo y el usuario confirme el envío final.

Después de llamar este endpoint, la captura pasa a estado final y se usa en listados, indicadores y brechas.

```http
POST /api/v1/encuestas/captura/{encuestaId}/completar
```

### Cola de captura telefónica

Usar para mostrar la bandeja de llamadas pendientes.

Suele ser la primera pantalla del flujo telefónico, donde el usuario revisa a quién debe llamar.

```http
GET /api/v1/encuestas/captura/telefonica/pendientes?busqueda=123&page=1&pageSize=10
```

### Registrar intento de llamada

Usar para dejar trazabilidad de cada llamada intentada.

Sirve para auditar cuántos intentos se realizaron antes de iniciar o completar una encuesta telefónica.

```http
POST /api/v1/encuestas/captura/telefonica/{id}/intento
```

### Iniciar encuesta telefónica

Usar cuando la llamada realmente va a comenzar y el formulario telefónico debe abrirse con los datos de la atención.

```http
POST /api/v1/encuestas/captura/telefonica/{id}/iniciar-encuesta
```

---

## 2. Encuestas realizadas

Esta sección sirve para consultar el histórico de encuestas ya terminadas. El frontend la usa en consultas, tablas, filtros y pantallas de detalle.

### Listar encuestas realizadas

Usar para construir una grilla o tabla con filtros por fecha, servicio, canal, estado y puntajes.

Los parámetros `page` y `pageSize` controlan la paginación.

```http
GET /api/v1/encuestas/realizadas?fechaDesde=2026-07-01&fechaHasta=2026-07-31&servicio=Hospitalizaci%C3%B3n&canal=Presencial&estado=Completada&sat=5&nps=10&page=1&pageSize=10
```

### Obtener detalle de una realizada

Usar para abrir una vista de detalle o modal con toda la información de una encuesta ya completada.

```http
GET /api/v1/encuestas/realizadas/{id}
```

### Anular encuesta realizada

Usar solo cuando se detecte un registro incorrecto o duplicado y sea necesario dejar trazabilidad del motivo.

El frontend debe pedir confirmación al usuario antes de ejecutar esta acción.

```http
POST /api/v1/encuestas/realizadas/{id}/anular
```

Body:

```json
{
  "motivo": "Registro incorrecto",
  "confirmada": true
}
```

---

## 3. Indicadores y brechas

Esta sección alimenta tarjetas, KPIs, gráficos y tableros de análisis.

### Indicadores de experiencia

Usar cuando la pantalla necesite métricas agregadas del módulo, por ejemplo satisfacción general, volumen por canal o comportamiento por servicio.

El parámetro `rango` indica el período analítico que quiere ver el usuario.

```http
GET /api/v1/encuestas/indicadores/experiencia?rango=30d&servicio=Hospitalizaci%C3%B3n&canal=Presencial
```

### Nivel de satisfacción

Usar para un resumen más específico del comportamiento de satisfacción.

Puede ayudar a pintar una tarjeta o gráfico rápido en un dashboard.

```http
GET /api/v1/encuestas/indicadores/experiencia/nivel-satisfaccion?rango=30d&servicio=Hospitalizaci%C3%B3n&canal=Presencial
```

### Análisis de brechas

Usar para listar oportunidades de mejora o problemas detectados en las respuestas.

Normalmente se consume en tableros de seguimiento o en una vista de analítica.

```http
GET /api/v1/encuestas/indicadores/brechas?servicio=Hospitalizaci%C3%B3n&estado=Completada&desde=2026-07-01&hasta=2026-07-31&page=1&pageSize=10
```

---

## 4. Cuestionarios

Esta sección cubre el mantenimiento de cuestionarios. Se usa en formularios administrativos donde se crean o editan encuestas.

### Listar cuestionarios

Usar para cargar el selector o la tabla de cuestionarios disponibles para aplicar.

Los filtros ayudan a filtrar por estado y canal.

```http
GET /api/v1/encuestas/cuestionarios?estado=Activo&canal=Presencial&page=1&pageSize=10
```

### Detalle de cuestionario

```http
GET /api/v1/encuestas/cuestionarios/{id}
```

### Crear cuestionario

Usar cuando el usuario administre una nueva encuesta desde el formulario de cuestionarios.

```http
POST /api/v1/encuestas/cuestionarios
```

### Actualizar cuestionario

Usar cuando el formulario edite un cuestionario ya existente.

```http
PUT /api/v1/encuestas/cuestionarios/{id}
```

### Cambiar estado

Usar para activar o desactivar un cuestionario sin eliminarlo.

```http
PATCH /api/v1/encuestas/cuestionarios/{id}/estado
```

### Duplicar cuestionario

Usar cuando el usuario quiera reutilizar una estructura previa como base de una nueva encuesta.

```http
POST /api/v1/encuestas/cuestionarios/{id}/duplicar
```

### Eliminar cuestionario

Usar solo si el cuestionario ya no debe seguir disponible.

El frontend debería pedir confirmación antes de ejecutar esta acción.

```http
DELETE /api/v1/encuestas/cuestionarios/{id}
```

### Obtener estructura

Usar al abrir el editor gráfico o formulario complejo de preguntas para pintar la estructura completa.

```http
GET /api/v1/encuestas/cuestionarios/{id}/estructura
```

### Guardar estructura

Usar cuando el usuario reorganiza preguntas, secciones o lógica del cuestionario.

```http
PUT /api/v1/encuestas/cuestionarios/{id}/estructura
```

### Agregar pregunta

Usar para insertar una nueva pregunta en una encuesta existente.

```http
POST /api/v1/encuestas/cuestionarios/{id}/preguntas
```

### Editar pregunta

Usar cuando el formulario de edición de preguntas modifica texto, opciones o configuración.

```http
PUT /api/v1/encuestas/cuestionarios/{id}/preguntas/{preguntaId}
```

### Actualizar lógica de pregunta

Usar para reglas de visibilidad, dependencias o saltos condicionales entre preguntas.

```http
PUT /api/v1/encuestas/cuestionarios/{id}/preguntas/{preguntaId}/logica
```

---

## 5. Parámetros

Esta sección agrupa reglas de funcionamiento general del módulo.

El frontend la usa en pantallas de configuración o administración, no en el flujo operativo de captura.

### Reglas activas

Usar para consultar las reglas que afectan validaciones o comportamiento de encuestas.

```http
GET /api/v1/encuestas/parametros/reglas
```

### Crear regla

Usar para registrar una nueva regla de negocio del módulo.

```http
POST /api/v1/encuestas/parametros/reglas
```

### Cambiar estado de regla

Usar para habilitar o deshabilitar una regla sin borrarla.

```http
PATCH /api/v1/encuestas/parametros/reglas/{id}/estado
```

### Modo prueba

Usar para consultar o cambiar el modo de pruebas del módulo.

Esto normalmente se expone en pantallas administrativas.

```http
GET /api/v1/encuestas/parametros/modo-prueba
PUT /api/v1/encuestas/parametros/modo-prueba
```

---

## 6. Auditoría y usuarios de encuestas

Esta sección corresponde a administración interna del módulo. El frontend la usa en pantallas de control, trazabilidad y gestión básica de usuarios.

### Auditoría de encuestas

Usar para revisar actividad del módulo, cambios y eventos relevantes.

Los filtros ayudan a acotar por módulo, resultado y paginación.

```http
GET /api/v1/encuestas/audit?modulo=Encuestas&resultado=exito&page=1&pageSize=20
```

### Detalle de auditoría

Usar cuando el usuario abre un evento específico para ver más información.

```http
GET /api/v1/encuestas/audit/{id}
```

### Usuarios del módulo

Usar para mostrar y administrar usuarios con acceso al módulo.

```http
GET /api/v1/encuestas/users?rol=Administrador&estado=true&page=1&pageSize=10
```

### Crear usuario del módulo

Usar desde el formulario de administración de usuarios.

```http
POST /api/v1/encuestas/users
```

### Cambiar rol de usuario

Usar para ajustar permisos o responsabilidades dentro del módulo.

```http
PATCH /api/v1/encuestas/users/{id}/rol
```

### Dashboard de inicio

Usar para cargar el resumen principal cuando el usuario entra al módulo.

```http
GET /api/v1/encuestas/dashboard/inicio
```

---

## 7. Notas para el frontend

- Las rutas antiguas documentadas en algunos análisis (`/surveys`, `/indicators`, `/gap-analysis`, `/params`) ya fueron reemplazadas por rutas reales bajo `/api/v1/encuestas/...`.
- El frontend debe consumir los endpoints reales de este documento.
- La API responde con envelopes tipo `{ data, meta }` o `{ data }` según el endpoint.
- En formularios, conviene guardar primero el identificador devuelto por el backend y luego usarlo para editar, completar o anular.
- Si el frontend necesita una ruta que aún no aparece aquí, debe revisarse contra el controlador real antes de usar una ruta histórica de la documentación.
