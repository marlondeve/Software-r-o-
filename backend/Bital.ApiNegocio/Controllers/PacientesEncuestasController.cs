using Asp.Versioning;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.DTOs.Encuestas;
using Bital.Application.Interfaces;
using Bital.Infrastructure.DietasCocina;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/encuestas")]
[Authorize]
public class PacientesEncuestasController : ControllerBase
{
    private readonly IEncuestasBffService _service;
    private readonly ILogger<PacientesEncuestasController> _logger;

    public PacientesEncuestasController(
        IEncuestasBffService service,
        ILogger<PacientesEncuestasController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("pacientes/search")]
    public async Task<ActionResult<EnvelopePacientesDto>> BuscarPacientes(
        [FromQuery] string termino,
        [FromQuery] int maxResults = 10,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(termino))
        {
            return BadRequest(new { message = "El parámetro 'termino' es requerido" });
        }

        var resultado = await _service.BuscarPacientesAsync(termino, maxResults, cancellationToken);
        return Ok(resultado);
    }

    [HttpGet("pacientes/{cedula}/atenciones")]
    public async Task<ActionResult<EnvelopeAtencionesDto>> ObtenerAtencionesPaciente(
        [FromRoute] string cedula,
        [FromQuery] string tipoDocumento,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(cedula) || string.IsNullOrWhiteSpace(tipoDocumento))
        {
            return BadRequest(new { message = "Se requieren 'cedula' y 'tipoDocumento'" });
        }

        var resultado = await _service.ObtenerAtencionesAsync(cedula, tipoDocumento, cancellationToken);
        return Ok(resultado);
    }

    [HttpPost("pacientes/identificar")]
    public async Task<ActionResult<PacienteContextoDto>> IdentificarPaciente(
        [FromBody] IdentificarPacienteRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.NumeroDocumento) || string.IsNullOrWhiteSpace(request.TipoDocumento))
        {
            return BadRequest(new { message = "El paciente y el tipo de documento son obligatorios" });
        }

        var usuario = User?.Identity?.Name ?? "sistema";
        var resultado = await _service.RegistrarIdentificacionAsync(request, usuario, cancellationToken);
        return Ok(resultado);
    }

    /// <summary>
    /// Busca pacientes por término (documento, nombre) usando consultas internas reutilizadas
    /// </summary>
    [HttpGet("captura/presencial/pendientes")]
    public async Task<ActionResult<RespuestaCapturaPresencialDto>> ObtenerCapturaPresencial(
        [FromQuery] string? servicio,
        [FromQuery] string? pabellon,
        [FromQuery] string? estado,
        [FromQuery] string? busqueda,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PaginacionHelper.DefaultPageSize)
    {
        try
        {
            var resultado = await _service.ObtenerCapturaPresencialAsync(new FiltrosCapturaPresencialDto
            {
                Servicio = servicio,
                Pabellon = pabellon,
                Estado = estado,
                Busqueda = busqueda,
                Page = page,
                PageSize = pageSize
            });
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener captura presencial");
            return StatusCode(500, new { message = "Error al obtener captura presencial" });
        }
    }

    [HttpPost("captura/presencial/{pacienteId}/iniciar")]
    public async Task<ActionResult<InicioCapturaEncuestaResponseDto>> IniciarCapturaPresencial(
        [FromRoute] string pacienteId,
        [FromBody] IniciarCapturaEncuestaRequestDto request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.IniciarCapturaPresencialAsync(pacienteId, request.CuestionarioId, cancellationToken);
            return Ok(new { data = resultado });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al iniciar captura presencial {PacienteId}", pacienteId);
            return StatusCode(500, new { message = "Error al iniciar captura presencial" });
        }
    }

    [HttpPut("captura/{encuestaId}/respuestas")]
    public async Task<ActionResult<object>> GuardarRespuestas(
        [FromRoute] string encuestaId,
        [FromBody] GuardarRespuestasEncuestaRequestDto request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _service.GuardarRespuestasAsync(encuestaId, request, cancellationToken);
            return Ok(new { data = new { encuestaId, secciones = request.Secciones.Count } });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al guardar respuestas de encuesta {EncuestaId}", encuestaId);
            return StatusCode(500, new { message = "Error al guardar respuestas" });
        }
    }

    [HttpPost("captura/{encuestaId}/completar")]
    public async Task<ActionResult<FinalizarEncuestaResponseDto>> CompletarEncuesta(
        [FromRoute] string encuestaId,
        [FromBody] FinalizarEncuestaRequestDto request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.CompletarEncuestaAsync(encuestaId, request, cancellationToken);
            return Ok(new { data = resultado });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al completar encuesta {EncuestaId}", encuestaId);
            return StatusCode(500, new { message = "Error al completar encuesta" });
        }
    }

    [HttpGet("captura/telefonica/pendientes")]
    public async Task<ActionResult<RespuestaCapturaTelefonicaDto>> ObtenerCapturaTelefonica(
        [FromQuery] string? busqueda,
        [FromQuery] string? tipoHospitalizacion,
        [FromQuery] string? servicio,
        [FromQuery] string? estado,
        [FromQuery] DateTime? fechaCitaDesde,
        [FromQuery] DateTime? fechaCitaHasta,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PaginacionHelper.DefaultPageSize)
    {
        try
        {
            var resultado = await _service.ObtenerCapturaTelefonicaAsync(new FiltrosCapturaTelefonicaDto
            {
                Busqueda = busqueda,
                TipoHospitalizacion = tipoHospitalizacion,
                Servicio = servicio,
                Estado = estado,
                FechaCitaDesde = fechaCitaDesde,
                FechaCitaHasta = fechaCitaHasta,
                Page = page,
                PageSize = pageSize
            });
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener captura telefónica");
            return StatusCode(500, new { message = "Error al obtener captura telefónica" });
        }
    }

    [HttpPost("captura/telefonica/{id}/intento")]
    public async Task<ActionResult<object>> RegistrarIntentoLlamada(
        [FromRoute] string id,
        [FromBody] IntentoLlamadaRequestDto request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.RegistrarIntentoLlamadaAsync(id, request, cancellationToken);
            if (resultado == null)
            {
                return NotFound(new { message = "Fila telefónica no encontrada" });
            }

            return Ok(new { data = resultado });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al registrar intento telefónico {Id}", id);
            return StatusCode(500, new { message = "Error al registrar intento telefónico" });
        }
    }

    [HttpPost("captura/telefonica/{id}/iniciar-encuesta")]
    public async Task<ActionResult<RespuestaCapturaTelefonicaInicioDto>> IniciarEncuestaTelefonica(
        [FromRoute] string id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.IniciarEncuestaTelefonicaAsync(id, cancellationToken);
            return Ok(new { data = resultado });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al iniciar encuesta telefónica {Id}", id);
            return StatusCode(500, new { message = "Error al iniciar encuesta telefónica" });
        }
    }

    [HttpGet("realizadas")]
    public async Task<ActionResult<ListaEncuestasRealizadasDto>> ObtenerEncuestasRealizadas(
        [FromQuery] DateTime? fechaDesde,
        [FromQuery] DateTime? fechaHasta,
        [FromQuery] string? servicio,
        [FromQuery] string? canal,
        [FromQuery] string? estado,
        [FromQuery] string? sat,
        [FromQuery] string? nps,
        [FromQuery] string? busqueda,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PaginacionHelper.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        var resultado = await _service.ObtenerEncuestasRealizadasAsync(new FiltrosEncuestasRealizadasDto
        {
            FechaDesde = fechaDesde,
            FechaHasta = fechaHasta,
            Servicio = servicio,
            Canal = canal,
            Estado = estado,
            Sat = sat,
            Nps = nps,
            Busqueda = busqueda,
            Page = page,
            PageSize = pageSize
        }, cancellationToken);

        return Ok(new { data = resultado.Data, meta = resultado.Meta });
    }

    [HttpGet("realizadas/{id}")]
    public async Task<ActionResult<DetalleEncuestaRealizadaDto>> ObtenerEncuestaRealizada(
        [FromRoute] string id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.ObtenerEncuestaRealizadaAsync(id, cancellationToken);
            return Ok(new { data = resultado });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Encuesta realizada no encontrada {Id}", id);
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("realizadas/{id}/anular")]
    public async Task<ActionResult<DetalleEncuestaRealizadaDto>> AnularEncuestaRealizada(
        [FromRoute] string id,
        [FromBody] AnularEncuestaRequestDto request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var usuario = User?.Identity?.Name ?? "sistema";
            var resultado = await _service.AnularEncuestaRealizadaAsync(id, request, usuario, cancellationToken);
            return Ok(new { data = resultado });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Encuesta realizada no encontrada {Id}", id);
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "No se puede anular la encuesta realizada {Id}", id);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("indicadores/experiencia")]
    public async Task<ActionResult<RespuestaIndicadoresExperienciaDto>> ObtenerIndicadoresExperiencia(
        [FromQuery] string? rango,
        [FromQuery] string? servicio,
        [FromQuery] string? puntoAtencion,
        [FromQuery] string? eps,
        [FromQuery] string? contrato,
        [FromQuery] string? canal,
        CancellationToken cancellationToken = default)
    {
        var resultado = await _service.ObtenerIndicadoresExperienciaAsync(new FiltrosIndicadoresExperienciaDto
        {
            Rango = rango,
            Servicio = servicio,
            PuntoAtencion = puntoAtencion,
            Eps = eps,
            Contrato = contrato,
            Canal = canal
        }, cancellationToken);

        return Ok(new { data = resultado });
    }

    [HttpGet("indicadores/experiencia/nivel-satisfaccion")]
    public async Task<ActionResult<List<SegmentoBarraDto>>> ObtenerNivelSatisfaccion(
        [FromQuery] string? rango,
        [FromQuery] string? servicio,
        [FromQuery] string? puntoAtencion,
        [FromQuery] string? eps,
        [FromQuery] string? contrato,
        [FromQuery] string? canal,
        CancellationToken cancellationToken = default)
    {
        var resultado = await _service.ObtenerNivelSatisfaccionAsync(new FiltrosIndicadoresExperienciaDto
        {
            Rango = rango,
            Servicio = servicio,
            PuntoAtencion = puntoAtencion,
            Eps = eps,
            Contrato = contrato,
            Canal = canal
        }, cancellationToken);

        return Ok(new { data = resultado });
    }

    [HttpGet("indicadores/brechas")]
    public async Task<ActionResult<RespuestaAnalisisBrechasDto>> ObtenerAnalisisBrechas(
        [FromQuery] string? servicio,
        [FromQuery] string? estado,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] string? busqueda,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PaginacionHelper.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        var resultado = await _service.ObtenerAnalisisBrechasAsync(new FiltrosAnalisisBrechasDto
        {
            Servicio = servicio,
            Estado = estado,
            Desde = desde,
            Hasta = hasta,
            Busqueda = busqueda,
            Page = page,
            PageSize = pageSize
        }, cancellationToken);

        return Ok(new { data = resultado.Data, meta = resultado.Meta, kpis = resultado.Kpis });
    }
}
