using Bital.Domain.Enums;

namespace Bital.Application.DTOs.DietasCocina;

// Filtros para listado de usuarios
public class FiltrosUsuariosDto
{
    public Guid? RolModuloId { get; set; }
    public bool? Activo { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 24;
}

// DTO de usuario en listado
public class UsuarioModuloDto
{
    public Guid Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Identificacion { get; set; }
    public Guid RolModuloId { get; set; }
    public string RolNombre { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public DateTime? UltimoAcceso { get; set; }
    public DateTime CreadoEn { get; set; }
}

// DTO para crear usuario
public class CrearUsuarioDto
{
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Identificacion { get; set; }
    public Guid RolModuloId { get; set; }
    public string? Observaciones { get; set; }
}

// DTO para editar usuario
public class EditarUsuarioDto
{
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Identificacion { get; set; }
    public string? Observaciones { get; set; }
}

// DTO para cambiar rol
public class CambiarRolDto
{
    public Guid RolModuloId { get; set; }
}

// DTO para cambiar estado
public class CambiarEstadoDto
{
    public bool Activo { get; set; }
}

// Lista paginada de usuarios
public class ListaUsuariosDto
{
    public List<UsuarioModuloDto> Data { get; set; } = new();
    public MetaPaginacionDto Meta { get; set; } = new();
}

public class RolModuloDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool EsSistema { get; set; }
    public bool Activo { get; set; }
    public int TotalPermisos { get; set; }
}

public class CrearRolDto
{
    public string Nombre { get; set; } = string.Empty;
    public List<RutaDietas> Rutas { get; set; } = new();
}

public class EditarRolDto
{
    public string Nombre { get; set; } = string.Empty;
}

public class RolPermisosDetalleDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool EsSistema { get; set; }
    public List<RutaDietas> Rutas { get; set; } = new();
}

// Matriz de permisos por rol
public class MatrizPermisosDto
{
    public List<RolPermisosDetalleDto> Data { get; set; } = new();
}

// DTO para actualizar permisos de un rol
public class ActualizarPermisosRolDto
{
    public List<RutaDietas> Rutas { get; set; } = new();
}
