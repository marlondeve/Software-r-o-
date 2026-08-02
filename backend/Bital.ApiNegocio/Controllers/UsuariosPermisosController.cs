using Asp.Versioning;
using Bital.ApiNegocio.Extensions;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Enums;
using Bital.Infrastructure.DietasCocina;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/dietas-cocina")]
[Authorize]
public class UsuariosPermisosController : ControllerBase
{
    private readonly IUsuariosPermisosService _service;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<UsuariosPermisosController> _logger;

    public UsuariosPermisosController(
        IUsuariosPermisosService service,
        IWebHostEnvironment environment,
        ILogger<UsuariosPermisosController> logger)
    {
        _service = service;
        _environment = environment;
        _logger = logger;
    }

    [HttpGet("usuarios")]
    public async Task<ActionResult<ListaUsuariosDto>> ObtenerUsuarios(
        [FromQuery] Guid? rolModuloId,
        [FromQuery] bool? estado,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PaginacionHelper.DefaultPageSize)
    {
        try
        {
            var filtros = new FiltrosUsuariosDto
            {
                RolModuloId = rolModuloId,
                Activo = estado,
                Page = page,
                PageSize = pageSize
            };

            var resultado = await _service.ObtenerUsuariosAsync(filtros);
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener usuarios del módulo");
            return StatusCode(500, new { message = "Error al obtener usuarios" });
        }
    }

    [HttpPost("usuarios")]
    public async Task<ActionResult<object>> CrearUsuario([FromBody] CrearUsuarioDto dto)
    {
        try
        {
            var resultado = await _service.CrearUsuarioAsync(dto, User.GetUsuarioIdentificacion());
            return Ok(new { data = resultado });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Validación fallida al crear usuario");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear usuario");
            return StatusCode(500, new { message = "Error al crear usuario" });
        }
    }

    [HttpPut("usuarios/{id}")]
    public async Task<ActionResult<object>> EditarUsuario(Guid id, [FromBody] EditarUsuarioDto dto)
    {
        try
        {
            var resultado = await _service.EditarUsuarioAsync(id, dto);
            return Ok(new { data = resultado });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Usuario no encontrado");
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Validación fallida al editar usuario");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al editar usuario {Id}", id);
            return StatusCode(500, new { message = "Error al editar usuario" });
        }
    }

    [HttpPatch("usuarios/{id}/rol")]
    public async Task<ActionResult<object>> CambiarRol(Guid id, [FromBody] CambiarRolDto dto)
    {
        try
        {
            var resultado = await _service.CambiarRolAsync(id, dto);
            return Ok(new { data = resultado });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Usuario no encontrado");
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al cambiar rol del usuario {Id}", id);
            return StatusCode(500, new { message = "Error al cambiar rol" });
        }
    }

    [HttpPatch("usuarios/{id}/estado")]
    public async Task<ActionResult<object>> CambiarEstado(Guid id, [FromBody] CambiarEstadoDto dto)
    {
        try
        {
            var resultado = await _service.CambiarEstadoAsync(id, dto);
            return Ok(new { data = resultado });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Usuario no encontrado");
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al cambiar estado del usuario {Id}", id);
            return StatusCode(500, new { message = "Error al cambiar estado" });
        }
    }

    [HttpPost("usuarios/{id}/restablecer-password")]
    public async Task<ActionResult<object>> RestablecerPassword(Guid id)
    {
        try
        {
            var resultado = await _service.RestablecerPasswordAsync(id, User.GetUsuarioIdentificacion());
            return Ok(new { data = resultado });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al restablecer contraseña del usuario {Id}", id);
            return StatusCode(500, new { message = "Error al restablecer contraseña" });
        }
    }

    [HttpGet("roles")]
    public async Task<ActionResult<object>> ListarRoles()
    {
        try
        {
            var roles = await _service.ListarRolesAsync();
            return Ok(new { data = roles });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al listar roles");
            return StatusCode(500, new { message = "Error al listar roles" });
        }
    }

    [HttpPost("roles")]
    public async Task<ActionResult<object>> CrearRol([FromBody] CrearRolDto dto)
    {
        try
        {
            var rol = await _service.CrearRolAsync(dto, User.GetUsuarioIdentificacion());
            return Ok(new { data = rol });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear rol");
            return StatusCode(500, new { message = "Error al crear rol" });
        }
    }

    [HttpPut("roles/{id:guid}")]
    public async Task<ActionResult<object>> EditarRol(Guid id, [FromBody] EditarRolDto dto)
    {
        try
        {
            var rol = await _service.EditarRolAsync(id, dto);
            return Ok(new { data = rol });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al editar rol {Id}", id);
            return StatusCode(500, new { message = "Error al editar rol" });
        }
    }

    [HttpGet("roles/permisos")]
    public async Task<ActionResult<MatrizPermisosDto>> ObtenerMatrizPermisos()
    {
        try
        {
            var resultado = await _service.ObtenerMatrizPermisosAsync();
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener matriz de permisos");
            return StatusCode(500, new { message = "Error al obtener permisos" });
        }
    }

    [HttpPut("roles/{id:guid}/permisos")]
    public async Task<ActionResult<object>> ActualizarPermisosRol(Guid id, [FromBody] ActualizarPermisosRolDto dto)
    {
        try
        {
            await _service.ActualizarPermisosRolAsync(id, dto);
            return Ok(new { data = new { id, rutas = dto.Rutas } });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar permisos del rol {Id}", id);
            return StatusCode(500, new { message = "Error al actualizar permisos" });
        }
    }

    [HttpDelete("roles/{id:guid}")]
    public async Task<ActionResult<object>> EliminarRol(Guid id)
    {
        try
        {
            await _service.EliminarRolAsync(id);
            return Ok(new { message = "Rol eliminado correctamente." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar rol {Id}", id);
            return StatusCode(500, new { message = "Error al eliminar rol" });
        }
    }

    [HttpPost("_test/seed-usuarios-permisos")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<ActionResult> SeedDatosPrueba()
    {
        if (!_environment.IsDevelopment())
            return NotFound();

        try
        {
            await _service.CrearUsuarioAsync(new CrearUsuarioDto
            {
                NombreCompleto = "María García",
                Email = "maria.garcia@clinicadelrio.com",
                Identificacion = "1000123456",
                RolModuloId = RolModuloSeed.Administrador,
                Observaciones = "Usuario administrador de prueba"
            }, User.GetUsuarioIdentificacion());

            await _service.CrearUsuarioAsync(new CrearUsuarioDto
            {
                NombreCompleto = "Carlos Rodríguez",
                Email = "carlos.rodriguez@clinicadelrio.com",
                Identificacion = "1000234567",
                RolModuloId = RolModuloSeed.Nutricionista,
                Observaciones = "Nutricionista de prueba"
            }, User.GetUsuarioIdentificacion());

            await _service.CrearUsuarioAsync(new CrearUsuarioDto
            {
                NombreCompleto = "Ana López",
                Email = "ana.lopez@clinicadelrio.com",
                Identificacion = "1000345678",
                RolModuloId = RolModuloSeed.Proveedor,
                Observaciones = "Cocinero de prueba"
            }, User.GetUsuarioIdentificacion());

            await _service.CrearUsuarioAsync(new CrearUsuarioDto
            {
                NombreCompleto = "Pedro Martínez",
                Email = "pedro.martinez@clinicadelrio.com",
                Identificacion = "1000456789",
                RolModuloId = RolModuloSeed.Enfermera,
                Observaciones = "Enfermera de prueba"
            }, User.GetUsuarioIdentificacion());

            await _service.ActualizarPermisosRolAsync(RolModuloSeed.Administrador, new ActualizarPermisosRolDto
            {
                Rutas = Enum.GetValues<RutaDietas>().ToList()
            });

            await _service.ActualizarPermisosRolAsync(RolModuloSeed.Nutricionista, new ActualizarPermisosRolDto
            {
                Rutas = RolModuloSeed.PermisosNutricionista
            });

            await _service.ActualizarPermisosRolAsync(RolModuloSeed.Proveedor, new ActualizarPermisosRolDto
            {
                Rutas = RolModuloSeed.PermisosProveedor
            });

            await _service.ActualizarPermisosRolAsync(RolModuloSeed.Enfermera, new ActualizarPermisosRolDto
            {
                Rutas = RolModuloSeed.PermisosEnfermera
            });

            await _service.ActualizarPermisosRolAsync(RolModuloSeed.AuxiliarCocina, new ActualizarPermisosRolDto
            {
                Rutas = RolModuloSeed.PermisosAuxiliarCocina
            });

            return Ok(new { message = "Datos de prueba insertados correctamente" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al insertar datos de prueba");
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
