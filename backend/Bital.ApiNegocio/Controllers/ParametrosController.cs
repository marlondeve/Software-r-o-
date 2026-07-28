using Asp.Versioning;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/dietas-cocina/parametros")]
[Authorize]
public class ParametrosController : ControllerBase
{
    private readonly IParametrosService _service;
    private readonly ILogger<ParametrosController> _logger;

    public ParametrosController(
        IParametrosService service,
        ILogger<ParametrosController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene la configuración de tiempos de comida
    /// </summary>
    /// <returns>Lista de tiempos de comida configurados</returns>
    [HttpGet("tiempos-comida")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ObtenerTiemposComida()
    {
        try
        {
            var tiempos = await _service.ObtenerTiemposComidaAsync();
            return Ok(new { data = tiempos });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener tiempos de comida");
            return StatusCode(500, new { error = "Error al obtener tiempos de comida" });
        }
    }

    /// <summary>
    /// Actualiza la configuración de tiempos de comida
    /// </summary>
    /// <param name="dto">Datos de actualización</param>
    /// <returns>Lista actualizada de tiempos de comida</returns>
    [HttpPut("tiempos-comida")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ActualizarTiemposComida([FromBody] ActualizarTiemposComidaDto dto)
    {
        try
        {
            var tiempos = await _service.ActualizarTiemposComidaAsync(dto);
            return Ok(new { data = tiempos });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Datos inválidos para actualizar tiempos de comida");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar tiempos de comida");
            return StatusCode(500, new { error = "Error al actualizar tiempos de comida" });
        }
    }

    /// <summary>
    /// Obtiene las categorías de edad configuradas
    /// </summary>
    /// <returns>Lista de categorías de edad</returns>
    [HttpGet("tipos-paciente")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ObtenerTiposPaciente()
    {
        try
        {
            var categorias = await _service.ObtenerCategoriasEdadAsync();
            return Ok(new { data = categorias });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener tipos de paciente");
            return StatusCode(500, new { error = "Error al obtener tipos de paciente" });
        }
    }

    /// <summary>
    /// Actualiza las categorías de edad
    /// </summary>
    /// <param name="dto">Datos de actualización</param>
    /// <returns>Lista actualizada de categorías de edad</returns>
    [HttpPut("tipos-paciente")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ActualizarTiposPaciente([FromBody] ActualizarCategoriasEdadDto dto)
    {
        try
        {
            var categorias = await _service.ActualizarCategoriasEdadAsync(dto);
            return Ok(new { data = categorias });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Datos inválidos para actualizar tipos de paciente");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar tipos de paciente");
            return StatusCode(500, new { error = "Error al actualizar tipos de paciente" });
        }
    }

    /// <summary>
    /// Simula la clasificación de edad de un paciente
    /// </summary>
    /// <param name="request">Edad a clasificar</param>
    /// <returns>Categoría correspondiente y factor de porción</returns>
    [HttpPost("tipos-paciente/clasificar")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ClasificarEdad([FromBody] ClasificarEdadRequestDto request)
    {
        try
        {
            if (request.Edad < 0)
                return BadRequest(new { error = "La edad debe ser un valor positivo" });

            var resultado = await _service.ClasificarEdadAsync(request.Edad);
            return Ok(new { data = resultado });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "No se encontró categoría para edad {Edad}", request.Edad);
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al clasificar edad");
            return StatusCode(500, new { error = "Error al clasificar edad" });
        }
    }
}
