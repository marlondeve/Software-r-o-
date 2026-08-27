using Asp.Versioning;
using Bital.ApiNegocio.Extensions;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

/// <summary>
/// API de gestión de Dietas y Cocina
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/dietas-cocina")]
[Authorize]
[Produces("application/json")]
public class DietasCocinaController : ControllerBase
{
    private readonly IDietasService _dietasService;
    private readonly ILogger<DietasCocinaController> _logger;

    public DietasCocinaController(
        IDietasService dietasService,
        ILogger<DietasCocinaController> logger)
    {
        _dietasService = dietasService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene el censo de dietas para una fecha y tiempo de comida
    /// </summary>
    /// <param name="fecha">Fecha operativa (formato: yyyy-MM-dd)</param>
    /// <param name="comida">Tiempo de comida: Desayuno, MediaNueve, Almuerzo, Onces, Cena, MediaNoche</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Censo con las filas de dietas</returns>
    [HttpGet("censo")]
    [ProducesResponseType(typeof(CensoDietasDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CensoDietasDto>> ObtenerCenso(
        [FromQuery] DateTime fecha,
        [FromQuery] string comida,
        CancellationToken cancellationToken)
    {
        try
        {
            var censo = await _dietasService.ObtenerCensoAsync(fecha, comida, cancellationToken);
            return Ok(censo);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener censo de dietas para {Fecha} {Comida}", fecha, comida);
            return StatusCode(500, new
            {
                error = "No se pudo obtener el censo de dietas.",
                detail = ex.Message,
            });
        }
    }

    /// <summary>
    /// Obtiene todas las dietas de un paciente para una fecha específica
    /// </summary>
    /// <param name="pacienteId">ID del paciente en el sistema HIS</param>
    /// <param name="fecha">Fecha operativa</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Lista de dietas del paciente</returns>
    [HttpGet("paciente/{pacienteId}/dietas")]
    [ProducesResponseType(typeof(List<FilaDietaDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<FilaDietaDto>>> ObtenerDietasPaciente(
        string pacienteId,
        [FromQuery] DateTime fecha,
        CancellationToken cancellationToken)
    {
        var dietas = await _dietasService.ObtenerDietasPacienteAsync(pacienteId, fecha, cancellationToken);
        return Ok(dietas);
    }

    /// <summary>
    /// Solicita o actualiza una dieta para un paciente
    /// </summary>
    /// <param name="filaDietaId">ID de la fila de dieta</param>
    /// <param name="solicitud">Datos de la solicitud</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Datos actualizados de la dieta</returns>
    [HttpPost("dietas/{filaDietaId}/solicitud")]
    [ProducesResponseType(typeof(FilaDietaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FilaDietaDto>> SolicitarDieta(
        Guid filaDietaId,
        [FromBody] SolicitudDietaDto solicitud,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = User.GetUsuarioNombreDisplay();

            var resultado = await _dietasService.SolicitarDietaAsync(filaDietaId, solicitud, usuario, cancellationToken);
            return Ok(resultado);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Dieta {filaDietaId} no encontrada" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Confirma una dieta individual (debe estar en estado Solicitada)
    /// </summary>
    /// <param name="filaDietaId">ID de la fila de dieta</param>
    /// <param name="confirmacion">Datos de confirmación (opcional, puede ajustar dieta/consistencia)</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Dieta confirmada</returns>
    [HttpPost("dietas/{filaDietaId}/confirmar")]
    [ProducesResponseType(typeof(FilaDietaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfirmarDieta(
        Guid filaDietaId,
        [FromBody] SolicitudDietaDto? confirmacion,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = User.GetUsuarioIdentificacion();

            // Si no viene body, crear uno vacío
            confirmacion ??= new SolicitudDietaDto();

            var resultado = await _dietasService.ConfirmarDietaAsync(filaDietaId, confirmacion, usuario, cancellationToken);

            return Ok(resultado);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Dieta {filaDietaId} no encontrada" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Confirma múltiples dietas de forma masiva
    /// </summary>
    /// <param name="confirmacion">IDs de las dietas a confirmar</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Número de dietas confirmadas</returns>
    [HttpPost("dietas/bulk/confirmar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfirmarDietasMasivas(
        [FromBody] ConfirmacionMasivaDto confirmacion,
        CancellationToken cancellationToken)
    {
        try
        {
            confirmacion.Usuario = User.GetUsuarioIdentificacion();

            var confirmadas = await _dietasService.ConfirmarDietasMasivasAsync(confirmacion, cancellationToken);

            return Ok(new
            {
                confirmadas,
                total = confirmacion.DietasIds.Count,
                message = $"{confirmadas} dietas confirmadas exitosamente"
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Cancela una dieta
    /// </summary>
    /// <param name="filaDietaId">ID de la fila de dieta</param>
    /// <param name="motivo">Motivo de la cancelación</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Resultado de la operación</returns>
    [HttpPost("dietas/{filaDietaId}/cancelar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelarDieta(
        Guid filaDietaId,
        [FromBody] CancelarDietaDto cancelacion,
        CancellationToken cancellationToken)
    {
            var usuario = User.GetUsuarioIdentificacion();

        var resultado = await _dietasService.CancelarDietaAsync(
            filaDietaId,
            cancelacion,
            usuario,
            cancellationToken);

        if (!resultado)
            return NotFound(new { error = $"Dieta {filaDietaId} no encontrada" });

        return Ok(new { message = "Dieta cancelada exitosamente", dietaId = filaDietaId });
    }

    /// <summary>
    /// Reactiva una dieta cancelada a Pendiente (sin solicitud).
    /// </summary>
    [HttpPost("dietas/{filaDietaId}/reactivar")]
    [ProducesResponseType(typeof(FilaDietaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReactivarDieta(
        Guid filaDietaId,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = User.GetUsuarioIdentificacion();
            var resultado = await _dietasService.ReactivarDietaCanceladaAsync(
                filaDietaId,
                usuario,
                cancellationToken);
            return Ok(resultado);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Dieta {filaDietaId} no encontrada" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("catalogo")]
    [ProducesResponseType(typeof(List<DietaCatalogoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DietaCatalogoDto>>> ObtenerCatalogo(
        CancellationToken cancellationToken)
    {
        var catalogo = await _dietasService.ObtenerCatalogoDietasAsync(cancellationToken);
        return Ok(catalogo);
    }

    [HttpGet("catalogo/{id:guid}")]
    [ProducesResponseType(typeof(DietaCatalogoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DietaCatalogoDto>> ObtenerCatalogoPorId(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            var dieta = await _dietasService.ObtenerCatalogoDietaPorIdAsync(id, cancellationToken);
            return Ok(dieta);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Dieta de catálogo {id} no encontrada" });
        }
    }

    [HttpPost("catalogo")]
    [ProducesResponseType(typeof(DietaCatalogoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DietaCatalogoDto>> CrearCatalogo(
        [FromBody] CrearDietaCatalogoDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = User.GetUsuarioIdentificacion();
            var dieta = await _dietasService.CrearDietaCatalogoAsync(dto, usuario, cancellationToken);
            return CreatedAtAction(nameof(ObtenerCatalogoPorId), new { id = dieta.Id }, dieta);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("catalogo/{id:guid}")]
    [ProducesResponseType(typeof(DietaCatalogoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DietaCatalogoDto>> ActualizarCatalogo(
        Guid id,
        [FromBody] ActualizarDietaCatalogoDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = User.GetUsuarioIdentificacion();
            var dieta = await _dietasService.ActualizarDietaCatalogoAsync(id, dto, usuario, cancellationToken);
            return Ok(dieta);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Dieta de catálogo {id} no encontrada" });
        }
    }

    [HttpPatch("catalogo/{id:guid}/desactivar")]
    [ProducesResponseType(typeof(DietaCatalogoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DietaCatalogoDto>> DesactivarCatalogo(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = User.GetUsuarioIdentificacion();
            var dieta = await _dietasService.DesactivarDietaCatalogoAsync(id, usuario, cancellationToken);
            return Ok(dieta);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Dieta de catálogo {id} no encontrada" });
        }
    }

    [HttpGet("catalogo/{id:guid}/tarifas")]
    [ProducesResponseType(typeof(List<TarifaHistoricoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<TarifaHistoricoDto>>> ObtenerTarifasCatalogo(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            var tarifas = await _dietasService.ObtenerTarifasDietaAsync(id, cancellationToken);
            return Ok(tarifas);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Dieta de catálogo {id} no encontrada" });
        }
    }

    [HttpPost("catalogo/{id:guid}/tarifas")]
    [ProducesResponseType(typeof(List<TarifaHistoricoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<TarifaHistoricoDto>>> RegistrarTarifaCatalogo(
        Guid id,
        [FromBody] NuevaTarifaDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = User.GetUsuarioIdentificacion();
            var tarifas = await _dietasService.RegistrarTarifaDietaAsync(id, dto, usuario, cancellationToken);
            return CreatedAtAction(nameof(ObtenerTarifasCatalogo), new { id }, tarifas);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Dieta de catálogo {id} no encontrada" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Registra una novedad en una dieta
    /// </summary>
    /// <param name="filaDietaId">ID de la fila de dieta</param>
    /// <param name="novedad">Datos de la novedad</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Datos actualizados de la dieta</returns>
    [HttpPost("dietas/{filaDietaId}/novedad")]
    [ProducesResponseType(typeof(FilaDietaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FilaDietaDto>> RegistrarNovedad(
        Guid filaDietaId,
        [FromBody] NovedadDietaDto novedad,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = User.GetUsuarioIdentificacion();
            var resultado = await _dietasService.RegistrarNovedadAsync(filaDietaId, novedad, usuario, cancellationToken);
            return Ok(resultado);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Dieta {filaDietaId} no encontrada" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene el detalle completo de una dieta
    /// </summary>
    /// <param name="filaDietaId">ID de la fila de dieta</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Detalle de la dieta</returns>
    [HttpGet("dietas/{filaDietaId}")]
    [ProducesResponseType(typeof(FilaDietaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FilaDietaDto>> ObtenerDetalleDieta(
        Guid filaDietaId,
        CancellationToken cancellationToken)
    {
        try
        {
            var detalle = await _dietasService.ObtenerDetalleDietaAsync(filaDietaId, cancellationToken);
            return Ok(detalle);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Dieta {filaDietaId} no encontrada" });
        }
    }

    /// <summary>
    /// Obtiene el historial de eventos de trazabilidad de una dieta
    /// </summary>
    /// <param name="filaDietaId">ID de la fila de dieta</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Lista de eventos de trazabilidad</returns>
    [HttpGet("dietas/{filaDietaId}/historial")]
    [ProducesResponseType(typeof(List<EventoTrazabilidadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<EventoTrazabilidadDto>>> ObtenerHistorialDieta(
        Guid filaDietaId,
        CancellationToken cancellationToken)
    {
        try
        {
            var historial = await _dietasService.ObtenerHistorialDietaAsync(filaDietaId, cancellationToken);
            return Ok(historial);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Dieta {filaDietaId} no encontrada" });
        }
    }

    /// <summary>
    /// Busca dietas con filtros avanzados
    /// </summary>
    /// <param name="filtros">Filtros de búsqueda</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Censo de dietas filtrado</returns>
    [HttpPost("dietas/buscar")]
    [ProducesResponseType(typeof(CensoDietasDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CensoDietasDto>> BuscarDietas(
        [FromBody] FiltrosDietasDto filtros,
        CancellationToken cancellationToken)
    {
        var resultado = await _dietasService.BuscarDietasAsync(filtros, cancellationToken);
        return Ok(resultado);
    }

    /// <summary>
    /// [Development] Siembra N dietas seed listas para generar etiquetas (órdenes Completada).
    /// </summary>
    [HttpPost("_test/seed-listas-para-etiquetas")]
    [AllowAnonymous]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> SeedListasParaEtiquetas(
        [FromQuery] int cantidad = 20,
        [FromQuery] string comida = "Desayuno",
        [FromQuery] DateTime? fecha = null,
        [FromServices] IWebHostEnvironment environment = null!,
        CancellationToken cancellationToken = default)
    {
        if (!environment.IsDevelopment())
            return NotFound();

        try
        {
            var resultado = await _dietasService.SeedListasParaEtiquetasDevAsync(
                fecha ?? DateTime.Today,
                comida,
                cantidad,
                User.Identity?.Name ?? "dev-seed",
                cancellationToken);
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en seed-listas-para-etiquetas");
            return BadRequest(new { error = ex.Message });
        }
    }
}
