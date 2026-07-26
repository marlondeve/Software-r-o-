using Bital.Application.DTOs.DietasCocina;
using Bital.Domain.Enums;

namespace Bital.Application.Interfaces;

public interface IUsuariosPermisosService
{
    // Gestión de usuarios
    Task<ListaUsuariosDto> ObtenerUsuariosAsync(FiltrosUsuariosDto filtros);
    Task<UsuarioModuloDto> CrearUsuarioAsync(CrearUsuarioDto dto, string creadoPor);
    Task<UsuarioModuloDto> EditarUsuarioAsync(Guid id, EditarUsuarioDto dto);
    Task<UsuarioModuloDto> CambiarRolAsync(Guid id, CambiarRolDto dto);
    Task<UsuarioModuloDto> CambiarEstadoAsync(Guid id, CambiarEstadoDto dto);

    // Gestión de permisos
    Task<MatrizPermisosDto> ObtenerMatrizPermisosAsync();
    Task ActualizarPermisosRolAsync(RolDietas rol, ActualizarPermisosRolDto dto);
}
