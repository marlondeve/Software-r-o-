using Asp.Versioning;
using Bital.ApiConsultas.Contracts.Responses;
using Bital.ApiConsultas.Services;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiConsultas.Controllers;

/// <summary>
/// Controller para consultas de pacientes desde Vital
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Produces("application/json")]
public class PacientesController : ControllerBase
{
    private readonly IPacientesQueryService _pacientesService;
    private readonly ILogger<PacientesController> _logger;

    public PacientesController(
        IPacientesQueryService pacientesService,
        ILogger<PacientesController> logger)
    {
        _pacientesService = pacientesService;
        _logger = logger;
    }

    /// <summary>
    /// Busca un paciente por número y tipo de documento
    /// </summary>
    /// <param name="numeroDocumento">Número de documento del paciente</param>
    /// <param name="tipoDocumento">Tipo de documento (CC, TI, etc.)</param>
    /// <param name="cancellationToken">Token de cancelación</param>
    /// <returns>Datos del paciente</returns>
    /// <response code="200">Retorna el paciente</response>
    /// <response code="400">Parámetros inválidos</response>
    /// <response code="404">Paciente no encontrado</response>
    /// <response code="500">Error interno del servidor</response>
    [HttpGet("buscar")]
    [ProducesResponseType(typeof(ApiResponse<PacienteResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ApiResponse<PacienteResponse>>> BuscarPorDocumento(
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

            _logger.LogInformation("GET /api/v1/pacientes/buscar?numeroDocumento={NumDoc}&tipoDocumento={TipoDoc}",
                numeroDocumento, tipoDocumento);

            var paciente = await _pacientesService.GetPacientePorDocumentoAsync(
                numeroDocumento,
                tipoDocumento,
                cancellationToken);

            if (paciente == null)
            {
                _logger.LogWarning("Paciente {TipoDoc}-{NumDoc} no encontrado", tipoDocumento, numeroDocumento);
                return NotFound(new ProblemDetails
                {
                    Title = "Paciente no encontrado",
                    Detail = $"No se encontró un paciente con documento {tipoDocumento}-{numeroDocumento}",
                    Status = StatusCodes.Status404NotFound,
                    Instance = HttpContext.Request.Path
                });
            }

            var response = new ApiResponse<PacienteResponse>(paciente);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al buscar paciente {TipoDoc}-{NumDoc}", tipoDocumento, numeroDocumento);
            return Problem(
                title: "Error al buscar paciente",
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }

    /// <summary>
    /// Obtiene un paciente por su ID
    /// </summary>
    /// <param name="id">ID del paciente</param>
    /// <param name="cancellationToken">Token de cancelación</param>
    /// <returns>Datos del paciente</returns>
    /// <response code="200">Retorna el paciente</response>
    /// <response code="404">Paciente no encontrado</response>
    /// <response code="500">Error interno del servidor</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<PacienteResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ApiResponse<PacienteResponse>>> GetPorId(
        string id,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("GET /api/v1/pacientes/{Id}", id);

            var paciente = await _pacientesService.GetPacientePorIdAsync(id, cancellationToken);

            if (paciente == null)
            {
                _logger.LogWarning("Paciente {Id} no encontrado", id);
                return NotFound(new ProblemDetails
                {
                    Title = "Paciente no encontrado",
                    Detail = $"No se encontró un paciente con ID '{id}'",
                    Status = StatusCodes.Status404NotFound,
                    Instance = HttpContext.Request.Path
                });
            }

            var response = new ApiResponse<PacienteResponse>(paciente);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener paciente {Id}", id);
            return Problem(
                title: "Error al obtener paciente",
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }

    /// <summary>
    /// Busca pacientes por nombre o número de documento (búsqueda parcial)
    /// </summary>
    /// <param name="search">Término de búsqueda</param>
    /// <param name="maxResults">Número máximo de resultados (default: 20)</param>
    /// <param name="cancellationToken">Token de cancelación</param>
    /// <returns>Lista de pacientes que coinciden</returns>
    /// <response code="200">Retorna la lista de pacientes</response>
    /// <response code="400">Parámetros inválidos</response>
    /// <response code="500">Error interno del servidor</response>
    [HttpGet("search")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PacienteResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ApiResponse<IEnumerable<PacienteResponse>>>> Search(
        [FromQuery] string search,
        [FromQuery] int maxResults,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(search) || search.Length < 3)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Parámetros inválidos",
                    Detail = "El término de búsqueda debe tener al menos 3 caracteres",
                    Status = StatusCodes.Status400BadRequest,
                    Instance = HttpContext.Request.Path
                });
            }

            if (maxResults < 1 || maxResults > 100 || maxResults == 0)
            {
                maxResults = 20;
            }

            _logger.LogInformation("GET /api/v1/pacientes/search?search={Search}&maxResults={MaxResults}",
                search, maxResults);

            var pacientes = await _pacientesService.BuscarPacientesPorNombreAsync(
                search,
                maxResults,
                cancellationToken);

            var response = new ApiResponse<IEnumerable<PacienteResponse>>(pacientes);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al buscar pacientes con término '{Search}'", search);
            return Problem(
                title: "Error al buscar pacientes",
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }
}
