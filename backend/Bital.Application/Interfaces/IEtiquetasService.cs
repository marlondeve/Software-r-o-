using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.Interfaces;

/// <summary>
/// Servicio para gestión de etiquetas y logística de enfermería
/// </summary>
public interface IEtiquetasService
{
    /// <summary>
    /// Obtiene las etiquetas con filtros opcionales
    /// </summary>
    Task<List<EtiquetaEnfermeraDto>> ObtenerEtiquetasAsync(
        string? comida = null,
        string? estadoLogistica = null,
        string? pabellon = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Busca una etiqueta por su código QR/barcode
    /// </summary>
    Task<EtiquetaEnfermeraDto?> BuscarEtiquetaPorCodigoAsync(
        string codigo,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Genera etiquetas a partir de órdenes completadas
    /// </summary>
    Task<List<Guid>> GenerarEtiquetasAsync(
        GenerarEtiquetasDto datos,
        string usuario,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Marca etiquetas como impresas
    /// </summary>
    Task<List<EtiquetaEnfermeraDto>> MarcarEtiquetasImpresasAsync(
        MarcarImpresasDto datos,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Marca etiquetas para reimpresión
    /// </summary>
    Task<List<EtiquetaEnfermeraDto>> ReimprimirEtiquetasAsync(
        MarcarImpresasDto datos,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Confirma pre-entrega en enfermería
    /// </summary>
    Task<EtiquetaEnfermeraDto> ConfirmarPreEntregaAsync(
        Guid etiquetaId,
        ConfirmarPreEntregaDto datos,
        string usuario,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Confirma entrega al paciente
    /// </summary>
    Task<EtiquetaEnfermeraDto> ConfirmarEntregaAsync(
        Guid etiquetaId,
        string usuario,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Registra devolución de dieta
    /// </summary>
    Task<EtiquetaEnfermeraDto> ConfirmarDevolucionAsync(
        Guid etiquetaId,
        ConfirmarDevolucionDto datos,
        string usuario,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Sube foto de evidencia de devolución
    /// </summary>
    Task<string> SubirFotoDevolucionAsync(
        Guid etiquetaId,
        Stream fotoStream,
        string nombreArchivo,
        CancellationToken cancellationToken = default);

    Task<byte[]> GenerarPdfEtiquetasAsync(
        IEnumerable<Guid> etiquetaIds,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// PDF de calibración con el mismo layout térmico (sin persistir etiqueta).
    /// </summary>
    Task<byte[]> GenerarPdfEtiquetaPruebaAsync(
        CancellationToken cancellationToken = default);
}
