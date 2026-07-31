using Asp.Versioning;
using Bital.ApiNegocio.Extensions;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Enums;
using Bital.Infrastructure.DietasCocina;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

/// <summary>
/// Controlador para gestión de etiquetas y logística de enfermería
/// </summary>
[ApiController]
[Route("api/v{version:apiVersion}/dietas-cocina/etiquetas")]
[Authorize]
[ApiVersion("1.0")]
public class EtiquetasController : ControllerBase
{
    private readonly IEtiquetasService _etiquetasService;
    private readonly IPermisosOperativosService _permisos;

    public EtiquetasController(
        IEtiquetasService etiquetasService,
        IPermisosOperativosService permisos)
    {
        _etiquetasService = etiquetasService;
        _permisos = permisos;
    }

    /// <summary>
    /// Catálogo de motivos de devolución alineado con el frontend.
    /// </summary>
    [HttpGet("catalogos/motivos-devolucion")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public ActionResult<object> ObtenerMotivosDevolucion()
    {
        return Ok(new
        {
            antesEntrega = MotivosEtiquetasCatalogo.DevolucionAntesEntrega,
            postEntrega = MotivosEtiquetasCatalogo.DevolucionPostEntrega,
        });
    }

    /// <summary>
    /// Obtiene las etiquetas con filtros opcionales
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<EtiquetaEnfermeraDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<EtiquetaEnfermeraDto>>> ObtenerEtiquetas(
        [FromQuery] string? comida,
        [FromQuery] string? estadoLogistica,
        [FromQuery] string? pabellon,
        CancellationToken cancellationToken)
    {
        try
        {
            await _permisos.VerificarConsultaEtiquetasAsync(User.GetRolModuloId(), cancellationToken);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbidWithMessage(ex.Message);
        }

        var etiquetas = await _etiquetasService.ObtenerEtiquetasAsync(
            comida, estadoLogistica, pabellon, cancellationToken);
        return Ok(etiquetas);
    }

    /// <summary>
    /// Busca una etiqueta por su código QR/barcode
    /// </summary>
    [HttpGet("buscar")]
    [ProducesResponseType(typeof(EtiquetaEnfermeraDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<EtiquetaEnfermeraDto>> BuscarEtiquetaPorCodigo(
        [FromQuery] string codigo,
        CancellationToken cancellationToken)
    {
        try
        {
            await _permisos.VerificarConsultaEtiquetasAsync(User.GetRolModuloId(), cancellationToken);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbidWithMessage(ex.Message);
        }

        var etiqueta = await _etiquetasService.BuscarEtiquetaPorCodigoAsync(codigo, cancellationToken);

        if (etiqueta == null)
            return NotFound(new { error = $"Etiqueta con código {codigo} no encontrada" });

        return Ok(etiqueta);
    }

    /// <summary>
    /// Genera etiquetas a partir de órdenes de cocina completadas
    /// </summary>
    [HttpPost("generar")]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GenerarEtiquetas(
        [FromBody] GenerarEtiquetasDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            await _permisos.VerificarRutaAsync(
                User.GetRolModuloId(), RutaDietas.ImprimirEtiquetas, cancellationToken);

            var usuario = User.GetUsuarioIdentificacion();
            var etiquetaIds = await _etiquetasService.GenerarEtiquetasAsync(datos, usuario, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new { etiquetaIds, totalGeneradas = etiquetaIds.Count });
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbidWithMessage(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Marca etiquetas como impresas
    /// </summary>
    [HttpPatch("bulk/impresas")]
    [ProducesResponseType(typeof(List<EtiquetaEnfermeraDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<EtiquetaEnfermeraDto>>> MarcarEtiquetasImpresas(
        [FromBody] MarcarImpresasDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            await _permisos.VerificarRutaAsync(
                User.GetRolModuloId(), RutaDietas.ImprimirEtiquetas, cancellationToken);

            var etiquetas = await _etiquetasService.MarcarEtiquetasImpresasAsync(datos, cancellationToken);
            return Ok(etiquetas);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbidWithMessage(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Marca etiquetas para reimpresión
    /// </summary>
    [HttpPatch("bulk/reimpresas")]
    [ProducesResponseType(typeof(List<EtiquetaEnfermeraDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<EtiquetaEnfermeraDto>>> ReimprimirEtiquetas(
        [FromBody] MarcarImpresasDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            await _permisos.VerificarRutaAsync(
                User.GetRolModuloId(), RutaDietas.ImprimirEtiquetas, cancellationToken);

            var etiquetas = await _etiquetasService.ReimprimirEtiquetasAsync(datos, cancellationToken);
            return Ok(etiquetas);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbidWithMessage(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Confirma pre-entrega en enfermería (recepción del proveedor)
    /// </summary>
    [HttpPatch("{etiquetaId}/pre-entrega")]
    [ProducesResponseType(typeof(EtiquetaEnfermeraDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<EtiquetaEnfermeraDto>> ConfirmarPreEntrega(
        Guid etiquetaId,
        [FromBody] ConfirmarPreEntregaDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            await _permisos.VerificarRutaAsync(
                User.GetRolModuloId(), RutaDietas.RecepcionProveedor, cancellationToken);

            var usuario = User.GetUsuarioIdentificacion();
            var etiqueta = await _etiquetasService.ConfirmarPreEntregaAsync(
                etiquetaId, datos, usuario, cancellationToken);
            return Ok(etiqueta);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbidWithMessage(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Confirma entrega al paciente
    /// </summary>
    [HttpPatch("{etiquetaId}/entrega")]
    [ProducesResponseType(typeof(EtiquetaEnfermeraDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<EtiquetaEnfermeraDto>> ConfirmarEntrega(
        Guid etiquetaId,
        CancellationToken cancellationToken)
    {
        try
        {
            await _permisos.VerificarRutaAsync(
                User.GetRolModuloId(), RutaDietas.EntregaPaciente, cancellationToken);

            var usuario = User.GetUsuarioIdentificacion();
            var etiqueta = await _etiquetasService.ConfirmarEntregaAsync(
                etiquetaId, usuario, cancellationToken);
            return Ok(etiqueta);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbidWithMessage(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Registra devolución de dieta (rechazo antes de entrega o recogida post-entrega)
    /// </summary>
    [HttpPatch("{etiquetaId}/devolucion")]
    [ProducesResponseType(typeof(EtiquetaEnfermeraDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<EtiquetaEnfermeraDto>> ConfirmarDevolucion(
        Guid etiquetaId,
        [FromBody] ConfirmarDevolucionDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            var etiquetaPreview = await ObtenerEtiquetaPorIdAsync(etiquetaId, cancellationToken);
            if (etiquetaPreview == null)
                return NotFound(new { error = $"Etiqueta {etiquetaId} no encontrada" });

            var permiso = EtiquetasReglasNegocio.PermisoDevolucionPorEstado(etiquetaPreview.EstadoLogistica);
            await _permisos.VerificarRutaAsync(User.GetRolModuloId(), permiso, cancellationToken);

            var usuario = User.GetUsuarioIdentificacion();
            var etiqueta = await _etiquetasService.ConfirmarDevolucionAsync(
                etiquetaId, datos, usuario, cancellationToken);
            return Ok(etiqueta);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbidWithMessage(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Sube foto de evidencia de devolución
    /// </summary>
    [HttpPost("{etiquetaId}/foto-devolucion")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SubirFotoDevolucion(
        Guid etiquetaId,
        IFormFile foto,
        CancellationToken cancellationToken)
    {
        try
        {
            await _permisos.VerificarConsultaEtiquetasAsync(User.GetRolModuloId(), cancellationToken);

            if (foto == null || foto.Length == 0)
                return BadRequest(new { error = "Archivo de foto requerido" });

            if (foto.Length > 5 * 1024 * 1024)
                return BadRequest(new { error = "El archivo no debe superar 5MB" });

            var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(foto.FileName).ToLowerInvariant();
            if (!extensionesPermitidas.Contains(extension))
                return BadRequest(new { error = "Solo se permiten archivos JPG y PNG" });

            using var stream = foto.OpenReadStream();
            var url = await _etiquetasService.SubirFotoDevolucionAsync(
                etiquetaId, stream, foto.FileName, cancellationToken);

            return Ok(new { url });
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbidWithMessage(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Genera PDF de etiquetas
    /// </summary>
    [HttpGet("pdf")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GenerarPdfEtiquetas(
        [FromQuery] string ids,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(ids))
        {
            return BadRequest(new { error = "Parámetro ids requerido" });
        }

        try
        {
            await _permisos.VerificarRutaAsync(
                User.GetRolModuloId(), RutaDietas.ImprimirEtiquetas, cancellationToken);

            var etiquetaIds = ids
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(id => Guid.Parse(id))
                .ToList();

            var pdf = await _etiquetasService.GenerarPdfEtiquetasAsync(etiquetaIds, cancellationToken);
            return File(pdf, "application/pdf", $"etiquetas-{DateTime.UtcNow:yyyyMMddHHmmss}.pdf");
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbidWithMessage(ex.Message);
        }
        catch (FormatException)
        {
            return BadRequest(new { error = "IDs de etiqueta inválidos" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    private async Task<EtiquetaEnfermeraDto?> ObtenerEtiquetaPorIdAsync(
        Guid etiquetaId,
        CancellationToken cancellationToken)
    {
        var etiquetas = await _etiquetasService.ObtenerEtiquetasAsync(cancellationToken: cancellationToken);
        return etiquetas.FirstOrDefault(e => e.Id == etiquetaId);
    }

    private ObjectResult ForbidWithMessage(string message) =>
        StatusCode(StatusCodes.Status403Forbidden, new { error = message });
}
