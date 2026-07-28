using Asp.Versioning;
using Bital.Application.DTOs.Encuestas;
using Bital.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/encuestas/parametros")]
[Authorize]
public class ParametrosEncuestasController : ControllerBase
{
    private readonly IEncuestasBffService _service;
    private readonly ILogger<ParametrosEncuestasController> _logger;

    public ParametrosEncuestasController(IEncuestasBffService service, ILogger<ParametrosEncuestasController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("reglas")]
    public async Task<ActionResult<RespuestaParametrosEncuestaDto>> ObtenerReglas(CancellationToken cancellationToken = default)
    {
        var resultado = await _service.ObtenerReglasEncuestasAsync(cancellationToken);
        return Ok(new { data = resultado.Data });
    }

    [HttpPost("reglas")]
    public async Task<ActionResult<ReglaCondicionalEncuestaDto>> CrearRegla([FromBody] NuevaReglaEncuestaDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.CrearReglaEncuestaAsync(request, cancellationToken);
            return Ok(new { data = resultado });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Datos inválidos para crear regla de encuestas");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("reglas/{id}/estado")]
    public async Task<ActionResult<ReglaCondicionalEncuestaDto>> CambiarEstado([FromRoute] string id, [FromBody] CambiarEstadoReglaEncuestaDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.CambiarEstadoReglaEncuestaAsync(id, request, cancellationToken);
            return Ok(new { data = resultado });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "No se encontró la regla {Id}", id);
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("modo-prueba")]
    public async Task<ActionResult<EstadoModoPruebaEncuestaDto>> ObtenerModoPrueba(CancellationToken cancellationToken = default)
    {
        var resultado = await _service.ObtenerModoPruebaEncuestaAsync(cancellationToken);
        return Ok(new { data = resultado });
    }

    [HttpPut("modo-prueba")]
    public async Task<ActionResult<EstadoModoPruebaEncuestaDto>> ActualizarModoPrueba([FromBody] EstadoModoPruebaEncuestaDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.ActualizarModoPruebaEncuestaAsync(request, cancellationToken);
            return Ok(new { data = resultado });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar el modo prueba de encuestas");
            return StatusCode(500, new { error = "Error al actualizar el modo prueba" });
        }
    }
}