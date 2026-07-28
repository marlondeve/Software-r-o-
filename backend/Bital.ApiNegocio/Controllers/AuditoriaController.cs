using Asp.Versioning;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Infrastructure.DietasCocina;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/dietas-cocina/auditoria")]
[Authorize]
public class AuditoriaController : ControllerBase
{
    private readonly IAuditoriaService _service;
    private readonly ILogger<AuditoriaController> _logger;

    public AuditoriaController(
        IAuditoriaService service,
        ILogger<AuditoriaController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Lista eventos de auditoría con filtros opcionales
    /// </summary>
    /// <param name="modulo">Filtrar por módulo (Dietas, Órdenes, Etiquetas, etc.)</param>
    /// <param name="resultado">Filtrar por resultado (Exitoso, Fallido)</param>
    /// <param name="desde">Fecha inicio (inclusiva)</param>
    /// <param name="hasta">Fecha fin (inclusiva)</param>
    /// <param name="usuario">Filtrar por nombre de usuario (búsqueda parcial)</param>
    /// <param name="page">Número de página (por defecto 1)</param>
    /// <param name="pageSize">Tamaño de página (por defecto 20)</param>
    /// <returns>Lista paginada de eventos de auditoría</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ListaEventosAuditoriaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ObtenerEventos(
        [FromQuery] string? modulo,
        [FromQuery] string? resultado,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] string? usuario,
        [FromQuery] string? formato,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var filtros = new FiltrosAuditoriaDto
            {
                Modulo = modulo,
                Resultado = resultado,
                Desde = desde,
                Hasta = hasta,
                Usuario = usuario,
                Page = page,
                PageSize = pageSize
            };

            var resultado_query = await _service.ObtenerEventosAsync(filtros);

            if (string.Equals(formato, "csv", StringComparison.OrdinalIgnoreCase))
            {
                var csv = CsvExportHelper.Generar(
                    resultado_query.Data.Select(e => (IReadOnlyList<string?>)[
                        e.Id.ToString(),
                        e.Modulo,
                        e.Accion,
                        e.Resultado,
                        e.Usuario,
                        CsvExportHelper.FormatearFecha(e.FechaEvento)]),
                    ["Id", "Modulo", "Accion", "Resultado", "Usuario", "Fecha"]);
                return File(csv, "text/csv", $"auditoria-{DateTime.UtcNow:yyyyMMdd}.csv");
            }

            return Ok(resultado_query);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener eventos de auditoría");
            return StatusCode(500, new { error = "Error al obtener eventos de auditoría" });
        }
    }

    /// <summary>
    /// Obtiene el detalle completo de un evento de auditoría
    /// </summary>
    /// <param name="id">ID del evento</param>
    /// <returns>Detalle del evento con datos antes/después y metadata</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ObtenerDetalleEvento(Guid id)
    {
        try
        {
            var detalle = await _service.ObtenerDetalleEventoAsync(id);

            if (detalle == null)
                return NotFound(new { error = "Evento de auditoría no encontrado" });

            return Ok(new { data = detalle });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener detalle de evento {EventoId}", id);
            return StatusCode(500, new { error = "Error al obtener detalle del evento" });
        }
    }

    /// <summary>
    /// [TEMPORAL] Insertar eventos de prueba para auditoría
    /// </summary>
    [HttpPost("_test/seed")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> SeedEventosPrueba()
    {
        try
        {
            // Evento 1: Crear dieta
            await _service.RegistrarEventoAsync(
                "Dietas",
                "Crear",
                "Exitoso",
                "admin",
                "FilaDieta",
                Guid.NewGuid(),
                null,
                "{\"paciente\":\"Juan Pérez\",\"dieta\":\"Blanda\",\"tiempoComida\":\"Desayuno\"}",
                "{\"accion\":\"creacion_manual\"}",
                null,
                125,
                "192.168.1.100"
            );

            // Evento 2: Modificar orden
            await _service.RegistrarEventoAsync(
                "Ordenes",
                "Modificar",
                "Exitoso",
                "cocinero1",
                "OrdenCocina",
                Guid.NewGuid(),
                "{\"estado\":\"Pendiente\"}",
                "{\"estado\":\"EnPreparacion\"}",
                null,
                null,
                85,
                "192.168.1.101"
            );

            // Evento 3: Imprimir etiqueta
            await _service.RegistrarEventoAsync(
                "Etiquetas",
                "Imprimir",
                "Exitoso",
                "enfermera1",
                "EtiquetaEnfermera",
                Guid.NewGuid(),
                null,
                "{\"impresora\":\"Sala-A\",\"cantidad\":1}",
                "{\"turno\":\"manana\"}",
                null,
                56,
                "192.168.1.102"
            );

            // Evento 4: Error en conciliación
            await _service.RegistrarEventoAsync(
                "Conciliacion",
                "Aprobar",
                "Fallido",
                "admin",
                "FilaConciliacion",
                Guid.NewGuid(),
                null,
                null,
                null,
                "Error de validación: Precio unitario no coincide",
                200,
                "192.168.1.100"
            );

            // Evento 5: Actualizar parámetro
            await _service.RegistrarEventoAsync(
                "Parametros",
                "Actualizar",
                "Exitoso",
                "admin",
                "TiempoComidaConfig",
                Guid.NewGuid(),
                "{\"horaCierre\":\"07:00\"}",
                "{\"horaCierre\":\"07:30\"}",
                "{\"motivo\":\"ajuste_operacional\"}",
                null,
                95,
                "192.168.1.100"
            );

            // Evento 6: Dashboard nutricionista
            await _service.RegistrarEventoAsync(
                "Dashboard",
                "Consultar",
                "Exitoso",
                "nutricionista1",
                null,
                null,
                null,
                null,
                "{\"filtros\":{\"desde\":\"2026-07-01\",\"hasta\":\"2026-07-31\"}}",
                null,
                450,
                "192.168.1.103"
            );

            return Ok(new { message = "6 eventos de prueba insertados exitosamente" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al insertar eventos de prueba");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
