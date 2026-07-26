using Asp.Versioning;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/dietas-cocina")]
public class UsuariosPermisosController : ControllerBase
{
    private readonly IUsuariosPermisosService _service;
    private readonly ILogger<UsuariosPermisosController> _logger;

    public UsuariosPermisosController(
        IUsuariosPermisosService service,
        ILogger<UsuariosPermisosController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene lista de usuarios del módulo Dietas con filtros opcionales
    /// </summary>
    [HttpGet("usuarios")]
    public async Task<ActionResult<ListaUsuariosDto>> ObtenerUsuarios(
        [FromQuery] RolDietas? rol,
        [FromQuery] bool? estado,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var filtros = new FiltrosUsuariosDto
            {
                Rol = rol,
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

    /// <summary>
    /// Crea un nuevo usuario del módulo Dietas
    /// </summary>
    [HttpPost("usuarios")]
    public async Task<ActionResult<object>> CrearUsuario([FromBody] CrearUsuarioDto dto)
    {
        try
        {
            var resultado = await _service.CrearUsuarioAsync(dto, "system");
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

    /// <summary>
    /// Edita datos básicos de un usuario
    /// </summary>
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

    /// <summary>
    /// Cambia el rol de un usuario
    /// </summary>
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al cambiar rol del usuario {Id}", id);
            return StatusCode(500, new { message = "Error al cambiar rol" });
        }
    }

    /// <summary>
    /// Activa o desactiva un usuario
    /// </summary>
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

    /// <summary>
    /// Obtiene la matriz de permisos (rutas permitidas por rol)
    /// </summary>
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

    /// <summary>
    /// Actualiza los permisos (rutas permitidas) de un rol específico
    /// </summary>
    [HttpPut("roles/{rol}/permisos")]
    public async Task<ActionResult<object>> ActualizarPermisosRol(RolDietas rol, [FromBody] ActualizarPermisosRolDto dto)
    {
        try
        {
            await _service.ActualizarPermisosRolAsync(rol, dto);
            return Ok(new { data = new { rol, rutas = dto.Rutas } });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar permisos del rol {Rol}", rol);
            return StatusCode(500, new { message = "Error al actualizar permisos" });
        }
    }

    /// <summary>
    /// [TEMPORAL] Inserta datos de prueba para usuarios y permisos
    /// </summary>
    [HttpPost("_test/seed-usuarios-permisos")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<ActionResult> SeedDatosPrueba()
    {
        try
        {
            // Crear usuarios de prueba
            var usuario1 = await _service.CrearUsuarioAsync(new CrearUsuarioDto
            {
                NombreCompleto = "María García",
                Email = "maria.garcia@clinicadelrio.com",
                Identificacion = "1000123456",
                Rol = RolDietas.Admin,
                Observaciones = "Usuario administrador de prueba"
            }, "system");

            var usuario2 = await _service.CrearUsuarioAsync(new CrearUsuarioDto
            {
                NombreCompleto = "Carlos Rodríguez",
                Email = "carlos.rodriguez@clinicadelrio.com",
                Identificacion = "1000234567",
                Rol = RolDietas.Nutricionista,
                Observaciones = "Nutricionista de prueba"
            }, "system");

            var usuario3 = await _service.CrearUsuarioAsync(new CrearUsuarioDto
            {
                NombreCompleto = "Ana López",
                Email = "ana.lopez@clinicadelrio.com",
                Identificacion = "1000345678",
                Rol = RolDietas.Cocinero,
                Observaciones = "Cocinero de prueba"
            }, "system");

            var usuario4 = await _service.CrearUsuarioAsync(new CrearUsuarioDto
            {
                NombreCompleto = "Pedro Martínez",
                Email = "pedro.martinez@clinicadelrio.com",
                Identificacion = "1000456789",
                Rol = RolDietas.Enfermera,
                Observaciones = "Enfermera de prueba"
            }, "system");

            // Configurar permisos por rol
            await _service.ActualizarPermisosRolAsync(RolDietas.Admin, new ActualizarPermisosRolDto
            {
                Rutas = Enum.GetValues<RutaDietas>().ToList() // Admin tiene todos los permisos
            });

            await _service.ActualizarPermisosRolAsync(RolDietas.Nutricionista, new ActualizarPermisosRolDto
            {
                Rutas = new List<RutaDietas>
                {
                    RutaDietas.ListarDietas,
                    RutaDietas.CrearDieta,
                    RutaDietas.EditarDieta,
                    RutaDietas.ListarOrdenes,
                    RutaDietas.VerDashboard,
                    RutaDietas.ExportarReportes,
                    RutaDietas.VerParametros,
                    RutaDietas.VerAuditoria
                }
            });

            await _service.ActualizarPermisosRolAsync(RolDietas.Cocinero, new ActualizarPermisosRolDto
            {
                Rutas = new List<RutaDietas>
                {
                    RutaDietas.ListarOrdenes,
                    RutaDietas.ModificarOrden,
                    RutaDietas.CancelarOrden,
                    RutaDietas.ImprimirEtiquetas,
                    RutaDietas.VerDashboard
                }
            });

            await _service.ActualizarPermisosRolAsync(RolDietas.Enfermera, new ActualizarPermisosRolDto
            {
                Rutas = new List<RutaDietas>
                {
                    RutaDietas.ListarEtiquetas,
                    RutaDietas.ImprimirEtiquetas,
                    RutaDietas.VerDashboard
                }
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
