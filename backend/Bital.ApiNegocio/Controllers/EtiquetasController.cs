using Asp.Versioning;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

/// <summary>
/// Controlador para gestión de etiquetas y logística de enfermería
/// </summary>
[ApiController]
[Route("api/v{version:apiVersion}/dietas-cocina/etiquetas")]
[ApiVersion("1.0")]
public class EtiquetasController : ControllerBase
{
    private readonly IEtiquetasService _etiquetasService;

    public EtiquetasController(IEtiquetasService etiquetasService)
    {
        _etiquetasService = etiquetasService;
    }

    /// <summary>
    /// Obtiene las etiquetas con filtros opcionales
    /// </summary>
    /// <param name="comida">Tiempo de comida (opcional)</param>
    /// <param name="estadoLogistica">Estado logístico (opcional)</param>
    /// <param name="pabellon">Pabellón (opcional)</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Lista de etiquetas</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<EtiquetaEnfermeraDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<EtiquetaEnfermeraDto>>> ObtenerEtiquetas(
        [FromQuery] string? comida,
        [FromQuery] string? estadoLogistica,
        [FromQuery] string? pabellon,
        CancellationToken cancellationToken)
    {
        var etiquetas = await _etiquetasService.ObtenerEtiquetasAsync(
            comida, estadoLogistica, pabellon, cancellationToken);
        return Ok(etiquetas);
    }

    /// <summary>
    /// Busca una etiqueta por su código QR/barcode
    /// </summary>
    /// <param name="codigo">Código de la etiqueta</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Etiqueta encontrada</returns>
    [HttpGet("buscar")]
    [ProducesResponseType(typeof(EtiquetaEnfermeraDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EtiquetaEnfermeraDto>> BuscarEtiquetaPorCodigo(
        [FromQuery] string codigo,
        CancellationToken cancellationToken)
    {
        var etiqueta = await _etiquetasService.BuscarEtiquetaPorCodigoAsync(codigo, cancellationToken);

        if (etiqueta == null)
            return NotFound(new { error = $"Etiqueta con código {codigo} no encontrada" });

        return Ok(etiqueta);
    }

    /// <summary>
    /// Genera etiquetas a partir de órdenes de cocina completadas
    /// </summary>
    /// <param name="datos">IDs de las órdenes</param>
    /// <param name="cancellationToken"></param>
    /// <returns>IDs de las etiquetas generadas</returns>
    [HttpPost("generar")]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerarEtiquetas(
        [FromBody] GenerarEtiquetasDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = "TestUser"; // TODO: JWT
            var etiquetaIds = await _etiquetasService.GenerarEtiquetasAsync(datos, usuario, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new { etiquetaIds, totalGeneradas = etiquetaIds.Count });
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
    /// <param name="datos">IDs de las etiquetas</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Etiquetas actualizadas</returns>
    [HttpPatch("bulk/impresas")]
    [ProducesResponseType(typeof(List<EtiquetaEnfermeraDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<EtiquetaEnfermeraDto>>> MarcarEtiquetasImpresas(
        [FromBody] MarcarImpresasDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            var etiquetas = await _etiquetasService.MarcarEtiquetasImpresasAsync(datos, cancellationToken);
            return Ok(etiquetas);
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
    /// <param name="datos">IDs de las etiquetas</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Etiquetas actualizadas</returns>
    [HttpPatch("bulk/reimpresas")]
    [ProducesResponseType(typeof(List<EtiquetaEnfermeraDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<EtiquetaEnfermeraDto>>> ReimprimirEtiquetas(
        [FromBody] MarcarImpresasDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            var etiquetas = await _etiquetasService.ReimprimirEtiquetasAsync(datos, cancellationToken);
            return Ok(etiquetas);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Confirma pre-entrega en enfermería
    /// </summary>
    /// <param name="etiquetaId">ID de la etiqueta</param>
    /// <param name="datos">Datos de pre-entrega</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Etiqueta actualizada</returns>
    [HttpPatch("{etiquetaId}/pre-entrega")]
    [ProducesResponseType(typeof(EtiquetaEnfermeraDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EtiquetaEnfermeraDto>> ConfirmarPreEntrega(
        Guid etiquetaId,
        [FromBody] ConfirmarPreEntregaDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = "TestUser"; // TODO: JWT
            var etiqueta = await _etiquetasService.ConfirmarPreEntregaAsync(etiquetaId, datos, usuario, cancellationToken);
            return Ok(etiqueta);
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
    /// <param name="etiquetaId">ID de la etiqueta</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Etiqueta actualizada</returns>
    [HttpPatch("{etiquetaId}/entrega")]
    [ProducesResponseType(typeof(EtiquetaEnfermeraDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EtiquetaEnfermeraDto>> ConfirmarEntrega(
        Guid etiquetaId,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = "TestUser"; // TODO: JWT
            var etiqueta = await _etiquetasService.ConfirmarEntregaAsync(etiquetaId, usuario, cancellationToken);
            return Ok(etiqueta);
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
    /// Registra devolución de dieta
    /// </summary>
    /// <param name="etiquetaId">ID de la etiqueta</param>
    /// <param name="datos">Datos de devolución</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Etiqueta actualizada</returns>
    [HttpPatch("{etiquetaId}/devolucion")]
    [ProducesResponseType(typeof(EtiquetaEnfermeraDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EtiquetaEnfermeraDto>> ConfirmarDevolucion(
        Guid etiquetaId,
        [FromBody] ConfirmarDevolucionDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = "TestUser"; // TODO: JWT
            var etiqueta = await _etiquetasService.ConfirmarDevolucionAsync(etiquetaId, datos, usuario, cancellationToken);
            return Ok(etiqueta);
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
    /// <param name="etiquetaId">ID de la etiqueta</param>
    /// <param name="foto">Archivo de imagen</param>
    /// <param name="cancellationToken"></param>
    /// <returns>URL de la foto</returns>
    [HttpPost("{etiquetaId}/foto-devolucion")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubirFotoDevolucion(
        Guid etiquetaId,
        IFormFile foto,
        CancellationToken cancellationToken)
    {
        try
        {
            if (foto == null || foto.Length == 0)
                return BadRequest(new { error = "Archivo de foto requerido" });

            // Validar tamaño (5MB)
            if (foto.Length > 5 * 1024 * 1024)
                return BadRequest(new { error = "El archivo no debe superar 5MB" });

            // Validar tipo
            var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(foto.FileName).ToLowerInvariant();
            if (!extensionesPermitidas.Contains(extension))
                return BadRequest(new { error = "Solo se permiten archivos JPG y PNG" });

            using var stream = foto.OpenReadStream();
            var url = await _etiquetasService.SubirFotoDevolucionAsync(
                etiquetaId, stream, foto.FileName, cancellationToken);

            return Ok(new { url });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Genera PDF de etiquetas (placeholder)
    /// </summary>
    /// <param name="ids">IDs de las etiquetas</param>
    /// <returns>PDF</returns>
    [HttpGet("pdf")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    public IActionResult GenerarPdfEtiquetas([FromQuery] string ids)
    {
        // TODO: Implementar generación de PDF usando QuestPDF o similar
        return Ok(new { message = "Endpoint PDF pendiente de implementación", ids });
    }
}
