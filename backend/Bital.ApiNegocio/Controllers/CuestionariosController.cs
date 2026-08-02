using Asp.Versioning;
using Bital.Application.DTOs.Encuestas;
using Bital.Application.Interfaces;
using Bital.Infrastructure.DietasCocina;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/encuestas/cuestionarios")]
[Authorize]
public class CuestionariosController : ControllerBase
{
    private readonly ICuestionariosService _service;
    private readonly ILogger<CuestionariosController> _logger;

    public CuestionariosController(ICuestionariosService service, ILogger<CuestionariosController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<object>> ObtenerCuestionarios(
        [FromQuery] Bital.Domain.Enums.EstadoCuestionario? estado,
        [FromQuery] Bital.Domain.Enums.CanalEncuesta? canal,
        [FromQuery] string? busqueda,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PaginacionHelper.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        var resultado = await _service.ObtenerCuestionariosAsync(new FiltrosCuestionariosDto
        {
            Estado = estado,
            Canal = canal,
            Busqueda = busqueda,
            Page = page,
            PageSize = pageSize
        }, cancellationToken);

        return Ok(new { data = resultado.Data, meta = resultado.Meta });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<object>> ObtenerCuestionario(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.ObtenerCuestionarioAsync(id, cancellationToken);
            return Ok(new { data = resultado });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Cuestionario no encontrado {Id}", id);
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<object>> CrearCuestionario([FromBody] CuestionarioCreacionDto dto, CancellationToken cancellationToken = default)
    {
        var resultado = await _service.CrearCuestionarioAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(ObtenerCuestionario), new { id = resultado.Id }, new { data = resultado });
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<object>> ActualizarCuestionario(Guid id, [FromBody] CuestionarioActualizacionDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.ActualizarCuestionarioAsync(id, dto, cancellationToken);
            return Ok(new { data = resultado });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Cuestionario no encontrado {Id}", id);
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/estado")]
    public async Task<ActionResult<object>> CambiarEstado(Guid id, [FromBody] CuestionarioEstadoDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.CambiarEstadoAsync(id, dto, cancellationToken);
            return Ok(new { data = resultado });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Cuestionario no encontrado {Id}", id);
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/duplicar")]
    public async Task<ActionResult<object>> DuplicarCuestionario(Guid id, [FromBody] CuestionarioDuplicadoDto? dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.DuplicarCuestionarioAsync(id, dto, cancellationToken);
            return CreatedAtAction(nameof(ObtenerCuestionario), new { id = resultado.Id }, new { data = resultado });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Cuestionario no encontrado {Id}", id);
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> EliminarCuestionario(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            await _service.EliminarCuestionarioAsync(id, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Cuestionario no encontrado {Id}", id);
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "No se puede eliminar el cuestionario {Id}", id);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}/estructura")]
    public async Task<ActionResult<object>> ObtenerEstructura(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.ObtenerEstructuraAsync(id, cancellationToken);
            return Ok(new { data = resultado.Secciones });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Cuestionario no encontrado {Id}", id);
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}/estructura")]
    public async Task<ActionResult<object>> GuardarEstructura(Guid id, [FromBody] EstructuraCuestionarioDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.GuardarEstructuraAsync(id, dto, cancellationToken);
            return Ok(new { data = resultado.Secciones });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Cuestionario no encontrado {Id}", id);
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/preguntas")]
    public async Task<ActionResult<object>> AgregarPregunta(Guid id, [FromBody] PreguntaCuestionarioCreacionDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.AgregarPreguntaAsync(id, dto, cancellationToken);
            return Ok(new { data = resultado });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Cuestionario no encontrado {Id}", id);
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}/preguntas/{preguntaId:guid}")]
    public async Task<ActionResult<object>> EditarPregunta(Guid id, Guid preguntaId, [FromBody] PreguntaCuestionarioActualizacionDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.EditarPreguntaAsync(id, preguntaId, dto, cancellationToken);
            return Ok(new { data = resultado });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Cuestionario o pregunta no encontrada {Id} / {PreguntaId}", id, preguntaId);
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}/preguntas/{preguntaId:guid}/logica")]
    public async Task<ActionResult<object>> ActualizarLogica(Guid id, Guid preguntaId, [FromBody] LogicaPreguntaCuestionarioDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var resultado = await _service.ActualizarLogicaAsync(id, preguntaId, dto, cancellationToken);
            return Ok(new { data = resultado });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Cuestionario o pregunta no encontrada {Id} / {PreguntaId}", id, preguntaId);
            return NotFound(new { message = ex.Message });
        }
    }
}
