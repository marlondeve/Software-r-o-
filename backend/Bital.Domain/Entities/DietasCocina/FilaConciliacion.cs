using System;

namespace Bital.Domain.Entities.DietasCocina;

/// <summary>
/// Línea de conciliación para comparar dietas entregadas vs facturadas
/// </summary>
public class FilaConciliacion
{
    public Guid Id { get; set; }

    /// <summary>
    /// Número de factura del proveedor
    /// </summary>
    public string NumeroFactura { get; set; } = string.Empty;

    /// <summary>
    /// Proveedor de alimentos
    /// </summary>
    public string Proveedor { get; set; } = string.Empty;

    /// <summary>
    /// Periodo de facturación (ej: "2026-01", "2026-W03")
    /// </summary>
    public string Periodo { get; set; } = string.Empty;

    /// <summary>
    /// Fecha operativa de la dieta
    /// </summary>
    public DateTime FechaOperativa { get; set; }

    /// <summary>
    /// Tiempo de comida
    /// </summary>
    public string Comida { get; set; } = string.Empty;

    /// <summary>
    /// ID del paciente
    /// </summary>
    public string PacienteId { get; set; } = string.Empty;

    /// <summary>
    /// Nombre del paciente
    /// </summary>
    public string Paciente { get; set; } = string.Empty;

    /// <summary>
    /// Cédula del paciente
    /// </summary>
    public string Cedula { get; set; } = string.Empty;

    /// <summary>
    /// Pabellón/servicio
    /// </summary>
    public string Pabellon { get; set; } = string.Empty;

    /// <summary>
    /// Habitación
    /// </summary>
    public string Habitacion { get; set; } = string.Empty;

    /// <summary>
    /// Tipo de dieta
    /// </summary>
    public string TipoDieta { get; set; } = string.Empty;

    /// <summary>
    /// Consistencia
    /// </summary>
    public string Consistencia { get; set; } = string.Empty;

    /// <summary>
    /// Cantidad solicitada (según sistema)
    /// </summary>
    public int CantidadSolicitada { get; set; }

    /// <summary>
    /// Cantidad entregada (según etiquetas)
    /// </summary>
    public int CantidadEntregada { get; set; }

    /// <summary>
    /// Cantidad facturada (según proveedor)
    /// </summary>
    public int CantidadFacturada { get; set; }

    /// <summary>
    /// Diferencia: facturada - entregada
    /// </summary>
    public int Diferencia { get; set; }

    /// <summary>
    /// Valor unitario
    /// </summary>
    public decimal ValorUnitario { get; set; }

    /// <summary>
    /// Valor total facturado
    /// </summary>
    public decimal ValorTotal { get; set; }

    /// <summary>
    /// Estado de conciliación: pendiente, conciliado, en_revision, rechazado
    /// </summary>
    public string Estado { get; set; } = "pendiente";

    /// <summary>
    /// Motivo de conciliación o rechazo
    /// </summary>
    public string? Motivo { get; set; }

    /// <summary>
    /// Observaciones adicionales
    /// </summary>
    public string? Observaciones { get; set; }

    /// <summary>
    /// Usuario que resolvió la conciliación
    /// </summary>
    public string? ResueltoPor { get; set; }

    /// <summary>
    /// Fecha de resolución
    /// </summary>
    public DateTime? ResueltaEn { get; set; }

    /// <summary>
    /// Referencia a la fila de dieta relacionada
    /// </summary>
    public Guid? FilaDietaId { get; set; }
    public FilaDieta? FilaDieta { get; set; }

    /// <summary>
    /// Referencia a la etiqueta relacionada
    /// </summary>
    public Guid? EtiquetaId { get; set; }
    public EtiquetaEnfermera? Etiqueta { get; set; }

    /// <summary>
    /// Fecha de creación del registro
    /// </summary>
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Usuario que creó el registro
    /// </summary>
    public string CreadoPor { get; set; } = string.Empty;

    /// <summary>
    /// Fecha de última modificación
    /// </summary>
    public DateTime? ModificadoEn { get; set; }

    /// <summary>
    /// Usuario que modificó el registro
    /// </summary>
    public string? ModificadoPor { get; set; }
}
