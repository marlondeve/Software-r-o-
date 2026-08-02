using Asp.Versioning;
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
public class EncuestasAdministracionController : ControllerBase
{
    private readonly IAdministracionEncuestasService _service;
    private readonly ILogger<EncuestasAdministracionController> _logger;

    public EncuestasAdministracionController(IAdministracionEncuestasService service, ILogger<EncuestasAdministracionController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("audit")]
    public async Task<ActionResult<ListaAuditoriaEncuestasDto>> ObtenerAuditoria(
        [FromQuery] string? modulo,
        [FromQuery] string? resultado,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] string? usuario,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PaginacionHelper.DefaultPageSize)
    {
        var resultadoQuery = await _service.ObtenerAuditoriaAsync(new FiltrosAuditoriaEncuestasDto
        {
            Modulo = modulo,
            Resultado = resultado,
            Desde = desde,
            Hasta = hasta,
            Usuario = usuario,
            Page = page,
            PageSize = pageSize
        });

        return Ok(new { data = resultadoQuery.Data, meta = resultadoQuery.Meta });
    }

    [HttpGet("audit/{id}")]
    public async Task<ActionResult<object>> ObtenerDetalleAuditoria([FromRoute] Guid id)
    {
        var detalle = await _service.ObtenerDetalleAuditoriaAsync(id);
        if (detalle == null)
        {
            return NotFound(new { message = "Evento de auditoría no encontrado" });
        }

        return Ok(new { data = detalle });
    }

    [HttpGet("users")]
    public async Task<ActionResult<ListaUsuariosEncuestasDto>> ObtenerUsuarios(
        [FromQuery] string? rol,
        [FromQuery] bool? estado,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PaginacionHelper.DefaultPageSize)
    {
        var resultado = await _service.ObtenerUsuariosAsync(new FiltrosUsuariosEncuestasDto
        {
            Rol = rol,
            Activo = estado,
            Page = page,
            PageSize = pageSize
        });

        return Ok(new { data = resultado.Data, meta = resultado.Meta });
    }

    [HttpPost("users")]
    public async Task<ActionResult<object>> CrearUsuario([FromBody] CrearUsuarioEncuestasDto dto)
    {
        var resultado = await _service.CrearUsuarioAsync(dto);
        return Ok(new { data = resultado });
    }

    [HttpPatch("users/{id}/rol")]
    public async Task<ActionResult<object>> CambiarRol([FromRoute] Guid id, [FromBody] CambiarRolEncuestasDto dto)
    {
        var resultado = await _service.CambiarRolAsync(id, dto);
        return Ok(new { data = resultado });
    }

    [HttpGet("dashboard/inicio")]
    public async Task<ActionResult<object>> ObtenerDashboardInicio()
    {
        var resultado = await _service.ObtenerDashboardInicioAsync();
        return Ok(new { data = resultado });
    }
}
