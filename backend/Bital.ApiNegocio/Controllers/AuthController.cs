using Asp.Versioning;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Application.Options;
using Bital.ApiNegocio.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace Bital.ApiNegocio.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth")]
public class AuthController : ControllerBase
{
    private readonly IUsuariosPermisosService _usuariosService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly JwtOptions _jwtOptions;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IUsuariosPermisosService usuariosService,
        IJwtTokenService jwtTokenService,
        IOptions<JwtOptions> jwtOptions,
        IWebHostEnvironment environment,
        ILogger<AuthController> logger)
    {
        _usuariosService = usuariosService;
        _jwtTokenService = jwtTokenService;
        _jwtOptions = jwtOptions.Value;
        _environment = environment;
        _logger = logger;
    }

    [AllowAnonymous]
    [EnableRateLimiting(SecurityExtensions.AuthRateLimitPolicy)]
    [HttpPost("login")]
    public async Task<ActionResult<object>> Login([FromBody] LoginModuloDto dto)
    {
        try
        {
            var resultado = await _usuariosService.LoginAsync(dto);
            var token = _jwtTokenService.GenerateToken(resultado);
            Response.AppendAuthCookie(token, _jwtOptions, _environment);
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

    [Authorize]
    [HttpGet("me")]
    public ActionResult<object> ObtenerSesionActual()
    {
        return Ok(new { data = User.ToLoginModuloResponse() });
    }

    [Authorize]
    [HttpPost("logout")]
    public ActionResult<object> Logout()
    {
        Response.DeleteAuthCookie(_jwtOptions, _environment);
        return Ok(new { data = new { mensaje = "Sesión cerrada correctamente." } });
    }

    [AllowAnonymous]
    [EnableRateLimiting(SecurityExtensions.AuthRateLimitPolicy)]
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
