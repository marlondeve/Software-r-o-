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
    Task<bool> CancelarDietaAsync(Guid filaDietaId, CancelarDietaDto cancelacion, string usuario, CancellationToken cancellationToken = default);

    /// <summary>
    /// Reactiva una dieta cancelada a Pendiente (sin solicitud) para volver a gestionarla.
    /// </summary>
    Task<FilaDietaDto> ReactivarDietaCanceladaAsync(Guid filaDietaId, string usuario, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtiene el catálogo de dietas activas
    /// </summary>
    Task<List<DietaCatalogoDto>> ObtenerCatalogoDietasAsync(CancellationToken cancellationToken = default);

    Task<DietaCatalogoDto> ObtenerCatalogoDietaPorIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<DietaCatalogoDto> CrearDietaCatalogoAsync(CrearDietaCatalogoDto dto, string usuario, CancellationToken cancellationToken = default);

    Task<DietaCatalogoDto> ActualizarDietaCatalogoAsync(Guid id, ActualizarDietaCatalogoDto dto, string usuario, CancellationToken cancellationToken = default);

    Task<DietaCatalogoDto> DesactivarDietaCatalogoAsync(Guid id, string usuario, CancellationToken cancellationToken = default);

    Task<List<TarifaHistoricoDto>> ObtenerTarifasDietaAsync(Guid id, CancellationToken cancellationToken = default);

    Task<List<TarifaHistoricoDto>> RegistrarTarifaDietaAsync(Guid id, NuevaTarifaDto dto, string usuario, CancellationToken cancellationToken = default);

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

    /// <summary>
    /// [Development] Crea N dietas seed en estado lista (órdenes Completada) listas para generar etiquetas.
    /// </summary>
    Task<object> SeedListasParaEtiquetasDevAsync(
        DateTime fecha,
        string comida,
        int cantidad,
        string usuario,
        CancellationToken cancellationToken = default);
}
