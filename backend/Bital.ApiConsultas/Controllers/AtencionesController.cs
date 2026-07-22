using Asp.Versioning;
using Bital.ApiConsultas.Contracts.Responses;
using Bital.ApiConsultas.Services;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiConsultas.Controllers;

/// <summary>
/// Controller para consultas de atenciones hospitalarias desde Vital
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Produces("application/json")]
public class AtencionesController : ControllerBase
{
    private readonly IAtencionesQueryService _atencionesService;
    private readonly ILogger<AtencionesController> _logger;

    public AtencionesController(
        IAtencionesQueryService atencionesService,
        ILogger<AtencionesController> logger)
    {
        _atencionesService = atencionesService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todas las atenciones activas o filtradas por servicio
    /// </summary>
    /// <param name="servicioId">ID del servicio hospitalario (opcional)</param>
    /// <param name="cancellationToken">Token de cancelación</param>
    /// <returns>Lista de atenciones activas</returns>
    /// <response code="200">Retorna la lista de atenciones</response>
    /// <response code="500">Error interno del servidor</response>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AtencionResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ApiResponse<IEnumerable<AtencionResponse>>>> GetAtenciones(
        [FromQuery] string? servicioId,
        CancellationToken cancellationToken)
    {
        try
        {
            IEnumerable<AtencionResponse> atenciones;

            if (!string.IsNullOrWhiteSpace(servicioId))
            {
                _logger.LogInformation("GET /api/v1/atenciones?servicioId={ServicioId}", servicioId);
                atenciones = await _atencionesService.GetAtencionesPorServicioAsync(servicioId, cancellationToken);
            }
            else
            {
                _logger.LogInformation("GET /api/v1/atenciones - Todas las atenciones activas");
                atenciones = await _atencionesService.GetAtencionesActivasAsync(cancellationToken);
            }

            var response = new ApiResponse<IEnumerable<AtencionResponse>>(atenciones);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al consultar atenciones");
            return Problem(
                title: "Error al consultar atenciones",
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }

    /// <summary>
    /// Obtiene una atención específica por su ID
    /// </summary>
    /// <param name="id">ID de la atención</param>
    /// <param name="cancellationToken">Token de cancelación</param>
    /// <returns>Datos de la atención</returns>
    /// <response code="200">Retorna la atención</response>
    /// <response code="404">Atención no encontrada</response>
    /// <response code="500">Error interno del servidor</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<AtencionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ApiResponse<AtencionResponse>>> GetAtencionPorId(
        string id,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("GET /api/v1/atenciones/{Id}", id);

            var atencion = await _atencionesService.GetAtencionPorIdAsync(id, cancellationToken);

            if (atencion == null)
            {
                _logger.LogWarning("Atención {Id} no encontrada", id);
                return NotFound(new ProblemDetails
                {
                    Title = "Atención no encontrada",
                    Detail = $"No se encontró una atención con ID '{id}'",
                    Status = StatusCodes.Status404NotFound,
                    Instance = HttpContext.Request.Path
                });
            }

            var response = new ApiResponse<AtencionResponse>(atencion);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al consultar atención {Id}", id);
            return Problem(
                title: "Error al consultar atención",
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }

    /// <summary>
    /// Obtiene atenciones activas de un paciente por su documento
    /// </summary>
    /// <param name="numeroDocumento">Número de documento del paciente</param>
    /// <param name="tipoDocumento">Tipo de documento (CC, TI, etc.)</param>
    /// <param name="cancellationToken">Token de cancelación</param>
    /// <returns>Lista de atenciones del paciente</returns>
    /// <response code="200">Retorna la lista de atenciones del paciente</response>
    /// <response code="400">Parámetros inválidos</response>
    /// <response code="500">Error interno del servidor</response>
    [HttpGet("paciente")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AtencionResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ApiResponse<IEnumerable<AtencionResponse>>>> GetAtencionesPorPaciente(
        [FromQuery] string numeroDocumento,
        [FromQuery] string tipoDocumento,
        CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(numeroDocumento) || string.IsNullOrWhiteSpace(tipoDocumento))
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Parámetros inválidos",
                    Detail = "Se requieren numeroDocumento y tipoDocumento",
                    Status = StatusCodes.Status400BadRequest,
                    Instance = HttpContext.Request.Path
                });
            }

            _logger.LogInformation("GET /api/v1/atenciones/paciente?numeroDocumento={NumDoc}&tipoDocumento={TipoDoc}",
                numeroDocumento, tipoDocumento);

            var atenciones = await _atencionesService.GetAtencionesPorPacienteAsync(
                numeroDocumento,
                tipoDocumento,
                cancellationToken);

            var response = new ApiResponse<IEnumerable<AtencionResponse>>(atenciones);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al consultar atenciones del paciente {TipoDoc}-{NumDoc}",
                tipoDocumento, numeroDocumento);
            return Problem(
                title: "Error al consultar atenciones del paciente",
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }
}
