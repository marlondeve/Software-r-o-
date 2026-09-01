using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.Interfaces;

public interface IConciliacionService
{
    Task<ListaConciliacionDto> ObtenerConciliacionAsync(
        DateTime? desde = null,
        DateTime? hasta = null,
        string? busqueda = null,
        string? numeroFactura = null,
        string? periodo = null,
        string? estado = null,
        int page = 1,
        int pageSize = 50,
        bool sinPaginar = false,
        CancellationToken cancellationToken = default);

    Task<DetalleConciliacionDto> ObtenerDetalleConciliacionAsync(
        Guid id,
        DateTime? desde = null,
        DateTime? hasta = null,
        string? periodo = null,
        CancellationToken cancellationToken = default);

    Task<FilaConciliacionDto> MarcarConciliadoAsync(
        Guid id,
        MarcarConciliadoDto datos,
        string usuario,
        CancellationToken cancellationToken = default);

    Task<FilaConciliacionDto> MarcarPendienteRevisionAsync(
        Guid id,
        MarcarPendienteRevisionDto datos,
        string usuario,
        CancellationToken cancellationToken = default);

    Task<List<KpiConciliacionDto>> ObtenerKpisConciliacionAsync(
        DateTime? desde = null,
        DateTime? hasta = null,
        string? periodo = null,
        CancellationToken cancellationToken = default);

    Task<FilaConciliacionDto> SubirFacturaAsync(
        Guid id,
        Stream archivo,
        string nombreArchivo,
        string usuario,
        CancellationToken cancellationToken = default);

    Task SubirFacturaPeriodoAsync(
        DateTime desde,
        DateTime hasta,
        Stream archivo,
        string nombreArchivo,
        string? numeroFactura,
        string usuario,
        string? periodo = null,
        CancellationToken cancellationToken = default);

    Task<ListaConciliacionDto> CargarPlanillaAsync(
        CargarPlanillaCocinaDto datos,
        string usuario,
        CancellationToken cancellationToken = default);
}
