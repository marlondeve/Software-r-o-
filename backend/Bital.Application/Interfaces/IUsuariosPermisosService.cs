using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.Interfaces;

public interface IUsuariosPermisosService
{
    // Gestión de usuarios
    Task<ListaUsuariosDto> ObtenerUsuariosAsync(FiltrosUsuariosDto filtros);
    Task<UsuarioModuloDto> CrearUsuarioAsync(CrearUsuarioDto dto, string creadoPor);
    Task<UsuarioModuloDto> EditarUsuarioAsync(Guid id, EditarUsuarioDto dto);
    Task<UsuarioModuloDto> CambiarRolAsync(Guid id, CambiarRolDto dto);
    Task<UsuarioModuloDto> CambiarEstadoAsync(Guid id, CambiarEstadoDto dto);

    // Gestión de roles y permisos
    Task<List<RolModuloDto>> ListarRolesAsync();
    Task<RolModuloDto> CrearRolAsync(CrearRolDto dto, string creadoPor);
    Task<RolModuloDto> EditarRolAsync(Guid rolModuloId, EditarRolDto dto);
    Task<MatrizPermisosDto> ObtenerMatrizPermisosAsync();
    Task ActualizarPermisosRolAsync(Guid rolModuloId, ActualizarPermisosRolDto dto);
    Task EliminarRolAsync(Guid rolModuloId);
    Task<Guid?> ResolverRolModuloIdPorNombreAsync(string nombreRol);

    Task<RestablecerPasswordResponseDto> RestablecerPasswordAsync(Guid id, string solicitadoPor);
    Task<LoginModuloResponseDto> LoginAsync(LoginModuloDto dto);
    Task<CambiarPasswordResponseDto> CambiarPasswordAsync(CambiarPasswordDto dto);
}
