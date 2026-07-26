using Bital.Domain.Common;

namespace Bital.Domain.Entities.DietasCocina;

/// <summary>
/// Evento de auditoría para trazabilidad de operaciones críticas en Dietas-Cocina
/// </summary>
public class EventoAuditoria : EntityBase
{
    /// <summary>
    /// Módulo del sistema donde ocurrió el evento (ej: Dietas, Órdenes, Etiquetas, Conciliación)
    /// </summary>
    public required string Modulo { get; set; }

    /// <summary>
    /// Acción realizada (ej: Crear, Modificar, Eliminar, Aprobar, Rechazar)
    /// </summary>
    public required string Accion { get; set; }

    /// <summary>
    /// Resultado de la operación (Exitoso, Fallido)
    /// </summary>
    public required string Resultado { get; set; }

    /// <summary>
    /// Usuario que realizó la operación
    /// </summary>
    public required string Usuario { get; set; }

    /// <summary>
    /// Dirección IP desde donde se realizó la operación
    /// </summary>
    public string? DireccionIp { get; set; }

    /// <summary>
    /// Tipo de entidad afectada (ej: FilaDieta, OrdenCocina, EtiquetaEnfermera)
    /// </summary>
    public string? TipoEntidad { get; set; }

    /// <summary>
    /// ID de la entidad afectada
    /// </summary>
    public Guid? EntidadId { get; set; }

    /// <summary>
    /// Datos del estado anterior (JSON serializado)
    /// </summary>
    public string? DatosAntes { get; set; }

    /// <summary>
    /// Datos del estado posterior (JSON serializado)
    /// </summary>
    public string? DatosDespues { get; set; }

    /// <summary>
    /// Información adicional o contexto de la operación
    /// </summary>
    public string? Metadata { get; set; }

    /// <summary>
    /// Mensaje de error si la operación falló
    /// </summary>
    public string? MensajeError { get; set; }

    /// <summary>
    /// Duración de la operación en milisegundos
    /// </summary>
    public int? DuracionMs { get; set; }

    /// <summary>
    /// Timestamp del evento (heredado de EntityBase.CreadoEn)
    /// </summary>
    public DateTime FechaEvento => CreadoEn;
}
