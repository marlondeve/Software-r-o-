using Asp.Versioning;
using Bital.ApiNegocio.Extensions;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

/// <summary>
/// Reportes operativos de la vista de preparación de dietas (proveedor).
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/dietas-cocina/cocina")]
[Authorize]
public class CocinaController : ControllerBase
{
    private readonly ICocinaReporteService _reporteService;
    private readonly IPermisosOperativosService _permisos;

    public CocinaController(
        ICocinaReporteService reporteService,
        IPermisosOperativosService permisos)
    {
        _reporteService = reporteService;
        _permisos = permisos;
    }

    /// <summary>
    /// Descarga el reporte operativo de bandejas en Excel (.xlsx).
    /// </summary>
    [HttpGet("reporte")]
    [Produces("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DescargarReporte(
        [FromQuery] DateTime? fecha,
        [FromQuery] string comida,
        [FromQuery] string? pabellon,
        [FromQuery] string? habitacion,
        [FromQuery] string? tipoDieta,
        [FromQuery] string? consistencia,
        [FromQuery] string? estadoCocina,
        [FromQuery] string? seguimiento,
        [FromQuery] bool? soloAislados,
        [FromQuery] string? busqueda,
        [FromQuery] string? formato,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(comida))
            return BadRequest(new { error = "El parámetro comida es obligatorio." });

        if (!string.IsNullOrWhiteSpace(formato)
            && !string.Equals(formato, "xlsx", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "Solo se admite formato=xlsx." });
        }

        try
        {
            await _permisos.VerificarRutaAsync(
                User.GetRolModuloId(),
                RutaDietas.ExportarReportes,
                cancellationToken);

            var filtros = new FiltrosReporteCocinaDto
            {
                Fecha = (fecha ?? DateTime.Today).Date,
                Comida = comida,
                Pabellon = pabellon,
                Habitacion = habitacion,
                TipoDieta = tipoDieta,
                Consistencia = consistencia,
                EstadoCocina = estadoCocina,
                Seguimiento = seguimiento,
                SoloAislados = soloAislados,
                Busqueda = busqueda,
            };

            var bytes = await _reporteService.GenerarReporteExcelAsync(filtros, cancellationToken);
            var nombre = $"reporte-cocina-{filtros.Fecha:yyyyMMdd}-{comida}.xlsx";
            return File(
                bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                nombre);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbidWithMessage(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private ObjectResult ForbidWithMessage(string message) =>
        StatusCode(StatusCodes.Status403Forbidden, new { error = message });
}
