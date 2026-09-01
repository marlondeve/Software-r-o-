using Asp.Versioning;
using Bital.ApiNegocio.Extensions;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Enums;
using Bital.Infrastructure.DietasCocina;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/dietas-cocina")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly IPermisosOperativosService _permisos;

    public DashboardController(
        IDashboardService dashboardService,
        IPermisosOperativosService permisos)
    {
        _dashboardService = dashboardService;
        _permisos = permisos;
    }

    /// <summary>
    /// Dashboard inicio nutricionista con KPIs operativos
    /// </summary>
    [HttpGet("dashboard/nutricionista")]
    public async Task<ActionResult<object>> ObtenerDashboardNutricionista(
        [FromQuery] DateTime? fecha,
        [FromQuery] string? comida)
    {
        var dashboard = await _dashboardService.ObtenerDashboardNutricionistaAsync(fecha, comida);
        return Ok(new { data = dashboard });
    }

    /// <summary>
    /// Dashboard inicio proveedor con progreso y alertas
    /// </summary>
    [HttpGet("dashboard/proveedor")]
    public async Task<ActionResult<object>> ObtenerDashboardProveedor([FromQuery] string? comida)
    {
        var dashboard = await _dashboardService.ObtenerDashboardProveedorAsync(comida);
        return Ok(new { data = dashboard });
    }

    /// <summary>
    /// Dashboard inicio enfermera con KPIs clínicos
    /// </summary>
    [HttpGet("dashboard/enfermera")]
    public async Task<ActionResult<object>> ObtenerDashboardEnfermera(
        [FromQuery] string? comida,
        [FromQuery] string? pabellon)
    {
        var dashboard = await _dashboardService.ObtenerDashboardEnfermeraAsync(comida, pabellon);
        return Ok(new { data = dashboard });
    }

    /// <summary>
    /// Reporte completo nutricionista con filtros, KPIs, hitos y gráficos
    /// </summary>
    [HttpGet("reportes/nutricionista")]
    public async Task<ActionResult<object>> ObtenerReporteNutricionista(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] string? servicio,
        [FromQuery] string? horario,
        [FromQuery] string? comida,
        [FromQuery] string? formato)
    {
        var filtros = new FiltrosReportesDto
        {
            Desde = desde,
            Hasta = hasta,
            Servicio = servicio,
            Horario = horario,
            Comida = comida
        };

        var reporte = await _dashboardService.ObtenerReporteNutricionistaAsync(filtros);

        if (string.Equals(formato, "csv", StringComparison.OrdinalIgnoreCase))
        {
            var csv = CsvExportHelper.Generar(
                reporte.Kpis.Select(k => (IReadOnlyList<string?>)[k.Etiqueta, k.Valor.ToString(), k.Formato]),
                ["Indicador", "Valor", "Formato"]);
            return File(csv, "text/csv", $"reporte-nutricionista-{DateTime.UtcNow:yyyyMMdd}.csv");
        }

        if (string.Equals(formato, "xlsx", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                await _permisos.VerificarRutaAsync(
                    User.GetRolModuloId(),
                    RutaDietas.ExportarReportes,
                    HttpContext.RequestAborted);

                var bytes = await ReporteDashboardExcelExport.GenerarAsync(
                    "Reportes clínicos",
                    reporte.Filtros,
                    reporte.Kpis,
                    reporte.Hitos,
                    reporte.Graficos,
                    reporte.Hallazgos,
                    HttpContext.RequestAborted);

                var nombre = $"reporte-clinico-{DateTime.UtcNow:yyyyMMdd}.xlsx";
                return File(
                    bytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    nombre);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
            }
        }

        return Ok(new { data = reporte });
    }

    /// <summary>
    /// Reporte operativo proveedor con KPIs y hallazgos
    /// </summary>
    [HttpGet("reportes/proveedor")]
    public async Task<ActionResult<object>> ObtenerReporteProveedor(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] string? servicio,
        [FromQuery] string? horario,
        [FromQuery] string? comida,
        [FromQuery] string? formato)
    {
        var filtros = new FiltrosReportesDto
        {
            Desde = desde,
            Hasta = hasta,
            Servicio = servicio,
            Horario = horario,
            Comida = comida
        };

        var reporte = await _dashboardService.ObtenerReporteProveedorAsync(filtros);

        if (string.Equals(formato, "csv", StringComparison.OrdinalIgnoreCase))
        {
            var csv = CsvExportHelper.Generar(
                reporte.Kpis.Select(k => (IReadOnlyList<string?>)[k.Etiqueta, k.Valor.ToString(), k.Formato]),
                ["Indicador", "Valor", "Formato"]);
            return File(csv, "text/csv", $"reporte-proveedor-{DateTime.UtcNow:yyyyMMdd}.csv");
        }

        if (string.Equals(formato, "xlsx", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                await _permisos.VerificarRutaAsync(
                    User.GetRolModuloId(),
                    RutaDietas.ExportarReportes,
                    HttpContext.RequestAborted);

                var bytes = await ReporteDashboardExcelExport.GenerarAsync(
                    "Reportes de producción",
                    reporte.Filtros,
                    reporte.Kpis,
                    reporte.Hitos,
                    reporte.Graficos,
                    reporte.Hallazgos,
                    HttpContext.RequestAborted);

                var nombre = $"reporte-produccion-{DateTime.UtcNow:yyyyMMdd}.xlsx";
                return File(
                    bytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    nombre);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
            }
        }

        return Ok(new { data = reporte });
    }
}
