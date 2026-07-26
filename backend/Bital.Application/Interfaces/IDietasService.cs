using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.Interfaces;

/// <summary>
/// Servicio de lógica de negocio para Dietas y Cocina
/// </summary>
public interface IDietasService
{
    /// <summary>
    /// Obtiene el censo de dietas para una fecha y comida específica
    /// </summary>
    Task<CensoDietasDto> ObtenerCensoAsync(DateTime fecha, string comida, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtiene las dietas de un paciente específico
    /// </summary>
    Task<List<FilaDietaDto>> ObtenerDietasPacienteAsync(string pacienteId, DateTime fecha, CancellationToken cancellationToken = default);

    /// <summary>
    /// Solicita o actualiza una dieta para un paciente
    /// </summary>
    Task<FilaDietaDto> SolicitarDietaAsync(Guid filaDietaId, SolicitudDietaDto solicitud, string usuario, CancellationToken cancellationToken = default);

    /// <summary>
    /// Confirma una dieta individual (debe estar en estado Solicitada)
    /// </summary>
    Task<FilaDietaDto> ConfirmarDietaAsync(Guid filaDietaId, SolicitudDietaDto confirmacion, string usuario, CancellationToken cancellationToken = default);

    /// <summary>
    /// Confirma múltiples dietas de forma masiva
    /// </summary>
    Task<int> ConfirmarDietasMasivasAsync(ConfirmacionMasivaDto confirmacion, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cancela una dieta
    /// </summary>
    Task<bool> CancelarDietaAsync(Guid filaDietaId, string usuario, string motivo, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtiene el catálogo de dietas activas
    /// </summary>
    Task<List<DietaCatalogoDto>> ObtenerCatalogoDietasAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Registra una novedad en una dieta
    /// </summary>
    Task<FilaDietaDto> RegistrarNovedadAsync(Guid filaDietaId, NovedadDietaDto novedad, string usuario, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtiene el detalle completo de una dieta
    /// </summary>
    Task<FilaDietaDto> ObtenerDetalleDietaAsync(Guid filaDietaId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtiene el historial de eventos de trazabilidad de una dieta
    /// </summary>
    Task<List<EventoTrazabilidadDto>> ObtenerHistorialDietaAsync(Guid filaDietaId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Busca dietas con filtros avanzados
    /// </summary>
    Task<CensoDietasDto> BuscarDietasAsync(FiltrosDietasDto filtros, CancellationToken cancellationToken = default);
}
