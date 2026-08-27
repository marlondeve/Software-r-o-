using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.Interfaces;

/// <summary>
/// Generación de reportes operativos para la vista de preparación de dietas (proveedor).
/// </summary>
public interface ICocinaReporteService
{
    /// <summary>
    /// Genera un archivo Excel (.xlsx) con el detalle de bandejas del turno.
    /// </summary>
    Task<byte[]> GenerarReporteExcelAsync(
        FiltrosReporteCocinaDto filtros,
        CancellationToken cancellationToken = default);
}
