using Asp.Versioning;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Bital.ApiNegocio.Controllers;

/// <summary>
/// Controlador para gestión de órdenes de cocina
/// </summary>
[ApiController]
[Route("api/v{version:apiVersion}/ordenes-cocina")]
[ApiVersion("1.0")]
public class OrdenesCocinaController : ControllerBase
{
    private readonly IOrdenesCocinaService _ordenesService;

    public OrdenesCocinaController(IOrdenesCocinaService ordenesService)
    {
        _ordenesService = ordenesService;
    }

    /// <summary>
    /// Obtiene todas las órdenes de cocina con filtros opcionales
    /// </summary>
    /// <param name="fecha">Fecha operativa (opcional)</param>
    /// <param name="comida">Tiempo de comida (opcional)</param>
    /// <param name="estado">Estado de la orden (opcional)</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Lista de órdenes de cocina</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<OrdenCocinaDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<OrdenCocinaDto>>> ObtenerOrdenes(
        [FromQuery] DateTime? fecha,
        [FromQuery] string? comida,
        [FromQuery] string? estado,
        CancellationToken cancellationToken)
    {
        var ordenes = await _ordenesService.ObtenerOrdenesAsync(fecha, comida, estado, cancellationToken);
        return Ok(ordenes);
    }

    /// <summary>
    /// Obtiene el detalle completo de una orden específica
    /// </summary>
    /// <param name="ordenId">ID de la orden</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Detalle de la orden con lista de dietas</returns>
    [HttpGet("{ordenId}")]
    [ProducesResponseType(typeof(OrdenCocinaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrdenCocinaDto>> ObtenerDetalleOrden(
        Guid ordenId,
        CancellationToken cancellationToken)
    {
        try
        {
            var detalle = await _ordenesService.ObtenerDetalleOrdenAsync(ordenId, cancellationToken);
            return Ok(detalle);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Orden {ordenId} no encontrada" });
        }
    }

    /// <summary>
    /// Crea una nueva orden de cocina a partir de dietas confirmadas
    /// </summary>
    /// <param name="datos">Datos de la orden a crear</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Orden creada</returns>
    [HttpPost]
    [ProducesResponseType(typeof(OrdenCocinaDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OrdenCocinaDto>> CrearOrden(
        [FromBody] CrearOrdenCocinaDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = "TestUser"; // TODO: JWT
            var orden = await _ordenesService.CrearOrdenAsync(datos, usuario, cancellationToken);
            return CreatedAtAction(nameof(ObtenerDetalleOrden), new { ordenId = orden.Id }, orden);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Actualiza el estado de una orden de cocina
    /// </summary>
    /// <param name="ordenId">ID de la orden</param>
    /// <param name="datos">Nuevo estado y observaciones</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Orden actualizada</returns>
    [HttpPatch("{ordenId}/estado")]
    [ProducesResponseType(typeof(OrdenCocinaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrdenCocinaDto>> ActualizarEstadoOrden(
        Guid ordenId,
        [FromBody] ActualizarEstadoOrdenDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = "TestUser"; // TODO: JWT
            var orden = await _ordenesService.ActualizarEstadoOrdenAsync(ordenId, datos, usuario, cancellationToken);
            return Ok(orden);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Orden {ordenId} no encontrada" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Actualiza el checklist operativo de una orden
    /// </summary>
    [HttpPatch("{ordenId}/checklist")]
    [ProducesResponseType(typeof(OrdenCocinaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrdenCocinaDto>> ActualizarChecklistOrden(
        Guid ordenId,
        [FromBody] ActualizarChecklistOrdenDto datos,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = "TestUser";
            var orden = await _ordenesService.ActualizarChecklistOrdenAsync(
                ordenId,
                datos,
                usuario,
                cancellationToken);
            return Ok(orden);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Orden {ordenId} no encontrada" });
        }
    }

    /// <summary>
    /// Cancela una orden de cocina
    /// </summary>
    /// <param name="ordenId">ID de la orden</param>
    /// <param name="motivo">Motivo de cancelación</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Resultado de la operación</returns>
    [HttpPost("{ordenId}/cancelar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelarOrden(
        Guid ordenId,
        [FromBody] string motivo,
        CancellationToken cancellationToken)
    {
        try
        {
            var usuario = "TestUser"; // TODO: JWT
            await _ordenesService.CancelarOrdenAsync(ordenId, motivo, usuario, cancellationToken);
            return Ok(new { message = "Orden cancelada exitosamente", ordenId });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = $"Orden {ordenId} no encontrada" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
