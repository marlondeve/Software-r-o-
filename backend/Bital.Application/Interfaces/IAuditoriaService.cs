using System.Threading.Tasks;
using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.Interfaces;

public interface IAuditoriaService
{
    /// <summary>
    /// Lista eventos de auditoría con filtros y paginación
    /// </summary>
    Task<ListaEventosAuditoriaDto> ObtenerEventosAsync(FiltrosAuditoriaDto filtros);

    /// <summary>
    /// Obtiene el detalle completo de un evento de auditoría
    /// </summary>
    Task<DetalleAuditoriaDto?> ObtenerDetalleEventoAsync(Guid id);

    /// <summary>
    /// Registra un nuevo evento de auditoría
    /// </summary>
    Task RegistrarEventoAsync(
        string modulo,
        string accion,
        string resultado,
        string usuario,
        string? tipoEntidad = null,
        Guid? entidadId = null,
        string? datosAntes = null,
        string? datosDespues = null,
        string? metadata = null,
        string? mensajeError = null,
        int? duracionMs = null,
        string? direccionIp = null);
}
