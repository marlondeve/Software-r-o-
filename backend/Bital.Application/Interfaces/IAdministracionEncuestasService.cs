using Bital.Application.DTOs.Encuestas;

namespace Bital.Application.Interfaces;

public interface IAdministracionEncuestasService
{
    Task<ListaAuditoriaEncuestasDto> ObtenerAuditoriaAsync(FiltrosAuditoriaEncuestasDto filtros);
    Task<DetalleAuditoriaEncuestaDto?> ObtenerDetalleAuditoriaAsync(Guid id);
    Task<ListaUsuariosEncuestasDto> ObtenerUsuariosAsync(FiltrosUsuariosEncuestasDto filtros);
    Task<UsuarioEncuestasModuloDto> CrearUsuarioAsync(CrearUsuarioEncuestasDto dto);
    Task<UsuarioEncuestasModuloDto> CambiarRolAsync(Guid id, CambiarRolEncuestasDto dto);
    Task<DashboardInicioEncuestasDto> ObtenerDashboardInicioAsync();
}
