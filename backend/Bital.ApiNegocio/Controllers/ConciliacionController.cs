using Asp.Versioning;
using Bital.ApiNegocio.Extensions;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Infrastructure.DietasCocina;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

/// <summary>
/// Controlador para conciliación de dietas vs facturación
/// </summary>
[ApiController]
[Route("api/v{version:apiVersion}/dietas-cocina/conciliacion")]
[Authorize]
[ApiVersion("1.0")]
public class ConciliacionController : ControllerBase
{
    private readonly IConciliacionService _conciliacionService;

    public ConciliacionController(IConciliacionService conciliacionService)
    {
        _conciliacionService = conciliacionService;
    }

    /// <summary>
    /// Lista líneas de conciliación con filtros opcionales
    /// </summary>
    /// <param name="busqueda">Búsqueda por paciente, cédula o número de factura</param>
    /// <param name="numeroFactura">Filtrar por número de factura</param>
    /// <param name="periodo">Filtrar por periodo (ej: 2026-01)</param>
    /// <param name="proveedor">Filtrar por proveedor</param>
    /// <param name="estado">Filtrar por estado (pendiente, conciliado, en_revision)</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Lista de líneas de conciliación</returns>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerConciliacion(
        [FromQuery] string? busqueda,
        [FromQuery] string? numeroFactura,
        [FromQuery] string? periodo,
        [FromQuery] string? proveedor,
        [FromQuery] string? estado,
        [FromQuery] string? formato,
        CancellationToken cancellationToken)
    {
        var lineas = await _conciliacionService.ObtenerConciliacionAsync(
            busqueda, numeroFactura, periodo, proveedor, estado, cancellationToken);

        if (string.Equals(formato, "csv", StringComparison.OrdinalIgnoreCase))
        {
            var csv = CsvExportHelper.Generar(
                lineas.Select(l => (IReadOnlyList<string?>)[
                    l.Id.ToString(),
                    l.NumeroFactura,
                    l.Paciente,
                    l.Comida,
                    l.Estado,
                    l.CantidadSolicitada.ToString(),
                    l.CantidadFacturada.ToString(),
                    l.Diferencia.ToString(),
                    l.ValorTotal.ToString("F2")]),
                ["Id", "Factura", "Paciente", "Comida", "Estado", "CantSist", "CantFact", "Dif", "ValorTotal"]);
            return File(csv, "text/csv", $"conciliacion-{DateTime.UtcNow:yyyyMMdd}.csv");
        }

        // Calcular KPIs si no hay filtros de búsqueda específicos
        var incluirKpis = string.IsNullOrWhiteSpace(busqueda) && string.IsNullOrWhiteSpace(numeroFactura);
        if (incluirKpis)
        {
            var kpis = await _conciliacionService.ObtenerKpisConciliacionAsync(
                periodo, proveedor, cancellationToken);

            return Ok(new
            {
                data = lineas,
                kpis,
                count = lineas.Count
            });
        }

        return Ok(new { data = lineas, count = lineas.Count });
    }

    /// <summary>
    /// Obtiene el detalle completo de una línea de conciliación
    /// </summary>
    /// <param name="id">ID de la línea de conciliación</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Detalle de conciliación con eventos y alertas</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(DetalleConciliacionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerDetalleConciliacion(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            var detalle = await _conciliacionService.ObtenerDetalleConciliacionAsync(id, cancellationToken);
            return Ok(new { data = detalle });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Marca una línea como conciliada
    /// </summary>
    /// <param name="id">ID de la línea de conciliación</param>
    /// <param name="datos">Motivo y observaciones</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Línea actualizada</returns>
    [HttpPatch("{id}/conciliado")]
    [ProducesResponseType(typeof(FilaConciliacionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarcarConciliado(
        Guid id,
        [FromBody] MarcarConciliadoDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = User.GetUsuarioIdentificacion();
            var linea = await _conciliacionService.MarcarConciliadoAsync(id, datos, usuario, cancellationToken);
            return Ok(new { data = linea });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Marca una línea como pendiente de revisión
    /// </summary>
    /// <param name="id">ID de la línea de conciliación</param>
    /// <param name="datos">Motivo y observaciones opcionales</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Línea actualizada</returns>
    [HttpPatch("{id}/pendiente-revision")]
    [ProducesResponseType(typeof(FilaConciliacionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarcarPendienteRevision(
        Guid id,
        [FromBody] MarcarPendienteRevisionDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = User.GetUsuarioIdentificacion();
            var linea = await _conciliacionService.MarcarPendienteRevisionAsync(id, datos, usuario, cancellationToken);
            return Ok(new { data = linea });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene KPIs agregados de conciliación
    /// </summary>
    /// <param name="periodo">Filtrar por periodo</param>
    /// <param name="proveedor">Filtrar por proveedor</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Lista de KPIs</returns>
    [HttpGet("kpis")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerKpisConciliacion(
        [FromQuery] string? periodo,
        [FromQuery] string? proveedor,
        CancellationToken cancellationToken)
    {
        var kpis = await _conciliacionService.ObtenerKpisConciliacionAsync(periodo, proveedor, cancellationToken);
        return Ok(new { data = kpis });
    }

    /// <summary>
    /// Carga documento de factura asociado a una línea de conciliación
    /// </summary>
    [HttpPost("{id}/factura")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SubirFacturaConciliacion(
        Guid id,
        IFormFile factura,
        CancellationToken cancellationToken)
    {
        if (factura == null || factura.Length == 0)
        {
            return BadRequest(new { error = "Archivo de factura requerido" });
        }

        try
        {
            var usuario = User.GetUsuarioIdentificacion();
            await using var stream = factura.OpenReadStream();
            var linea = await _conciliacionService.SubirFacturaAsync(
                id,
                stream,
                factura.FileName,
                usuario,
                cancellationToken);
            return Ok(new { data = linea });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
