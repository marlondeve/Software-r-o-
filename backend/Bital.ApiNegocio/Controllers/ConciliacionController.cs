using System.Text;
using Asp.Versioning;
using Bital.ApiNegocio.Extensions;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Enums;
using Bital.Infrastructure.DietasCocina;
using Bital.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/dietas-cocina/conciliacion")]
[Authorize]
[ApiVersion("1.0")]
public class ConciliacionController : ControllerBase
{
    private readonly IConciliacionService _conciliacionService;
    private readonly IPermisosOperativosService _permisos;

    public ConciliacionController(
        IConciliacionService conciliacionService,
        IPermisosOperativosService permisos)
    {
        _conciliacionService = conciliacionService;
        _permisos = permisos;
    }

    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerConciliacion(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] string? busqueda,
        [FromQuery] string? numeroFactura,
        [FromQuery] string? periodo,
        [FromQuery] string? estado,
        [FromQuery] string? formato,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var csv = string.Equals(formato, "csv", StringComparison.OrdinalIgnoreCase);
        var resultado = await _conciliacionService.ObtenerConciliacionAsync(
            desde, hasta, busqueda, numeroFactura, periodo, estado,
            page, pageSize, csv, cancellationToken);

        var lineas = resultado.Data;

        if (csv)
        {
            var bytes = CsvExportHelper.Generar(
                lineas.Select(l => (IReadOnlyList<string?>)[
                    l.Comida,
                    l.EtiquetaPlanilla,
                    l.Tarifa.ToString("F2"),
                    l.CantidadSistema.ToString(),
                    l.CantidadCocina?.ToString() ?? "",
                    l.DiferenciaCantidad.ToString(),
                    l.ValorSistema.ToString("F2"),
                    l.ValorCocina?.ToString("F2") ?? "",
                    l.Estado]),
                ["Comida", "Linea", "Tarifa", "Sistema", "Cocina", "DifCantidad", "ValorSistema", "ValorCocina", "Estado"]);
            return File(bytes, "text/csv", $"conciliacion-{DateTime.UtcNow:yyyyMMdd}.csv");
        }

        var kpis = ConciliacionService.CalcularKpis(lineas);

        return Ok(new
        {
            data = lineas,
            kpis,
            count = resultado.Meta.Total,
            meta = resultado.Meta
        });
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DetalleConciliacionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerDetalleConciliacion(
        Guid id,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] string? periodo,
        CancellationToken cancellationToken)
    {
        try
        {
            var detalle = await _conciliacionService.ObtenerDetalleConciliacionAsync(
                id, desde, hasta, periodo, cancellationToken);
            return Ok(new { data = detalle });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/conciliado")]
    [ProducesResponseType(typeof(FilaConciliacionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarcarConciliado(
        Guid id,
        [FromBody] MarcarConciliadoDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            await VerificarResolucionAsync(RutaDietas.AprobarConciliacion, cancellationToken);
            var usuario = User.GetUsuarioIdentificacion();
            var linea = await _conciliacionService.MarcarConciliadoAsync(
                id, datos ?? new MarcarConciliadoDto(), usuario, cancellationToken);
            return Ok(new { data = linea });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
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

    [HttpPatch("{id:guid}/pendiente-revision")]
    [ProducesResponseType(typeof(FilaConciliacionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarcarPendienteRevision(
        Guid id,
        [FromBody] MarcarPendienteRevisionDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            await VerificarResolucionAsync(RutaDietas.RechazarConciliacion, cancellationToken);
            var usuario = User.GetUsuarioIdentificacion();
            var linea = await _conciliacionService.MarcarPendienteRevisionAsync(
                id, datos ?? new MarcarPendienteRevisionDto(), usuario, cancellationToken);
            return Ok(new { data = linea });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
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

    [HttpGet("kpis")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerKpisConciliacion(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] string? periodo,
        CancellationToken cancellationToken)
    {
        var kpis = await _conciliacionService.ObtenerKpisConciliacionAsync(
            desde, hasta, periodo, cancellationToken);
        return Ok(new { data = kpis });
    }

    [HttpPost("planilla")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> CargarPlanilla(
        [FromBody] CargarPlanillaCocinaDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            await VerificarCapturaPlanillaAsync(cancellationToken);
            var usuario = User.GetUsuarioIdentificacion();
            var resultado = await _conciliacionService.CargarPlanillaAsync(
                datos ?? new CargarPlanillaCocinaDto(), usuario, cancellationToken);
            return Ok(new { data = resultado.Data, meta = resultado.Meta });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
    }

    [HttpPost("planilla/csv")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> CargarPlanillaCsv(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] string? periodo,
        [FromQuery] string? numeroFactura,
        IFormFile planilla,
        CancellationToken cancellationToken)
    {
        if (planilla == null || planilla.Length == 0)
            return BadRequest(new { error = "Archivo CSV de planilla requerido" });

        try
        {
            await VerificarCapturaPlanillaAsync(cancellationToken);
            var usuario = User.GetUsuarioIdentificacion();
            await using var stream = planilla.OpenReadStream();
            using var reader = new StreamReader(stream, Encoding.UTF8);
            var csv = await reader.ReadToEndAsync(cancellationToken);
            var dto = new CargarPlanillaCocinaDto
            {
                Desde = desde,
                Hasta = hasta,
                Periodo = periodo,
                NumeroFactura = numeroFactura,
                Lineas = Bital.Infrastructure.Services.ConciliacionService.ParsearCsvPlanilla(csv),
            };
            var resultado = await _conciliacionService.CargarPlanillaAsync(dto, usuario, cancellationToken);
            return Ok(new { data = resultado.Data, meta = resultado.Meta });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/factura")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> SubirFacturaConciliacion(
        Guid id,
        IFormFile factura,
        CancellationToken cancellationToken)
    {
        if (factura == null || factura.Length == 0)
            return BadRequest(new { error = "Archivo de factura requerido" });

        try
        {
            await VerificarResolucionAsync(RutaDietas.AprobarConciliacion, cancellationToken);
            var usuario = User.GetUsuarioIdentificacion();
            await using var stream = factura.OpenReadStream();
            var linea = await _conciliacionService.SubirFacturaAsync(
                id, stream, factura.FileName, usuario, cancellationToken);
            return Ok(new { data = linea });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost("factura")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> SubirFacturaPeriodo(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] string? periodo,
        [FromQuery] string? numeroFactura,
        IFormFile factura,
        CancellationToken cancellationToken)
    {
        if (factura == null || factura.Length == 0)
            return BadRequest(new { error = "Archivo de factura requerido" });

        try
        {
            await VerificarResolucionAsync(RutaDietas.AprobarConciliacion, cancellationToken);
            var usuario = User.GetUsuarioIdentificacion();
            await using var stream = factura.OpenReadStream();
            await _conciliacionService.SubirFacturaPeriodoAsync(
                desde ?? default,
                hasta ?? default,
                stream,
                factura.FileName,
                numeroFactura,
                usuario,
                periodo,
                cancellationToken);
            return Ok(new { data = new { ok = true } });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
    }

    private async Task VerificarResolucionAsync(RutaDietas ruta, CancellationToken cancellationToken)
    {
        var rolId = User.GetRolModuloId();
        if (rolId == RolModuloSeed.Administrador)
            return;
        await _permisos.VerificarRutaAsync(rolId, ruta, cancellationToken);
    }

    private async Task VerificarCapturaPlanillaAsync(CancellationToken cancellationToken)
    {
        var rolId = User.GetRolModuloId();
        if (rolId == RolModuloSeed.Administrador)
            return;

        if (rolId == RolModuloSeed.Proveedor)
        {
            throw new UnauthorizedAccessException(
                "El rol Proveedor no puede registrar cantidades en conciliación.");
        }

        if (await _permisos.UsuarioTieneRutaAsync(rolId, RutaDietas.CargarPlanillaConciliacion, cancellationToken)
            || await _permisos.UsuarioTieneRutaAsync(rolId, RutaDietas.AprobarConciliacion, cancellationToken))
        {
            return;
        }

        throw new UnauthorizedAccessException(
            "No tiene permiso para registrar cantidades de la planilla de cocina.");
    }
}
