using Asp.Versioning;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth")]
public class AuthController : ControllerBase
{
    private readonly IUsuariosPermisosService _usuariosService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IUsuariosPermisosService usuariosService,
        ILogger<AuthController> logger)
    {
        _usuariosService = usuariosService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<object>> Login([FromBody] LoginModuloDto dto)
    {
        try
        {
            var resultado = await _usuariosService.LoginAsync(dto);
            return Ok(new { data = resultado });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al iniciar sesión");
            return StatusCode(500, new { message = "Error al iniciar sesión" });
        }
    }

    [HttpPost("cambiar-password")]
    public async Task<ActionResult<object>> CambiarPassword([FromBody] CambiarPasswordDto dto)
    {
        try
        {
            var resultado = await _usuariosService.CambiarPasswordAsync(dto);
            return Ok(new { data = resultado });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al cambiar contraseña");
            return StatusCode(500, new { message = "Error al cambiar contraseña" });
        }
    }
}
