using System;
using System.Threading.Tasks;
using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.Interfaces;

public interface IDashboardService
{
    /// <summary>
    /// Dashboard para rol Nutricionista con KPIs operativos, distribuciones y actividad reciente
    /// </summary>
    Task<DashboardNutricionistaDto> ObtenerDashboardNutricionistaAsync(DateTime? fecha, string? comida);

    /// <summary>
    /// Dashboard para rol Proveedor con progreso de entregas y alertas operativas
    /// </summary>
    Task<DashboardProveedorDto> ObtenerDashboardProveedorAsync(string? comida);

    /// <summary>
    /// Dashboard para rol Enfermera con KPIs clínicos y alertas de atención
    /// </summary>
    Task<DashboardEnfermeraDto> ObtenerDashboardEnfermeraAsync(string? comida, string? pabellon);

    /// <summary>
    /// Reporte completo para nutricionista con KPIs, hitos, y gráficos según filtros
    /// </summary>
    Task<ReporteNutricionistaDto> ObtenerReporteNutricionistaAsync(FiltrosReportesDto filtros);

    /// <summary>
    /// Reporte operativo para proveedor con KPIs, hallazgos y gráficos de rendimiento
    /// </summary>
    Task<ReporteProveedorDto> ObtenerReporteProveedorAsync(FiltrosReportesDto filtros);
}
