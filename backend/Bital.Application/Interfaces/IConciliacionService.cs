using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.Interfaces;

/// <summary>
/// Servicio de conciliación de dietas vs facturación
/// </summary>
public interface IConciliacionService
{
    /// <summary>
    /// Obtiene líneas de conciliación con filtros opcionales (paginado, máx. 24 por página).
    /// </summary>
    Task<ListaConciliacionDto> ObtenerConciliacionAsync(
        string? busqueda = null,
        string? numeroFactura = null,
        string? periodo = null,
        string? proveedor = null,
        string? estado = null,
        int page = 1,
        int pageSize = 24,
        bool sinPaginar = false,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtiene el detalle completo de una línea de conciliación
    /// </summary>
    Task<DetalleConciliacionDto> ObtenerDetalleConciliacionAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Marca una línea como conciliada
    /// </summary>
    Task<FilaConciliacionDto> MarcarConciliadoAsync(
        Guid id,
        MarcarConciliadoDto datos,
        string usuario,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Marca una línea como pendiente de revisión
    /// </summary>
    Task<FilaConciliacionDto> MarcarPendienteRevisionAsync(
        Guid id,
        MarcarPendienteRevisionDto datos,
        string usuario,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Calcula KPIs agregados de conciliación
    /// </summary>
    Task<List<KpiConciliacionDto>> ObtenerKpisConciliacionAsync(
        string? periodo = null,
        string? proveedor = null,
        CancellationToken cancellationToken = default);

    Task<FilaConciliacionDto> SubirFacturaAsync(
        Guid id,
        Stream archivo,
        string nombreArchivo,
        string usuario,
        CancellationToken cancellationToken = default);
}
