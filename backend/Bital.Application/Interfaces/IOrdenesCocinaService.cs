using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.Interfaces;

/// <summary>
/// Servicio de lógica de negocio para Órdenes de Cocina
/// </summary>
public interface IOrdenesCocinaService
{
    /// <summary>
    /// Obtiene todas las órdenes de cocina con filtros opcionales
    /// </summary>
    Task<List<OrdenCocinaDto>> ObtenerOrdenesAsync(DateTime? fecha, string? comida, string? estado, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtiene el detalle completo de una orden específica
    /// </summary>
    Task<OrdenCocinaDto> ObtenerDetalleOrdenAsync(Guid ordenId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Crea una nueva orden de cocina a partir de dietas confirmadas
    /// </summary>
    Task<OrdenCocinaDto> CrearOrdenAsync(CrearOrdenCocinaDto datos, string usuario, CancellationToken cancellationToken = default);

    /// <summary>
    /// Actualiza el estado de una orden de cocina
    /// </summary>
    Task<OrdenCocinaDto> ActualizarEstadoOrdenAsync(Guid ordenId, ActualizarEstadoOrdenDto datos, string usuario, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cancela una orden de cocina
    /// </summary>
    Task<bool> CancelarOrdenAsync(Guid ordenId, string motivo, string usuario, CancellationToken cancellationToken = default);
}
