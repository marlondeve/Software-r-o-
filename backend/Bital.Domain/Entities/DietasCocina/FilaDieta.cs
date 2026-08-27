using Bital.Domain.Common;
using Bital.Domain.Enums;

namespace Bital.Domain.Entities.DietasCocina;

/// <summary>
/// Fila operativa del censo de dietas por paciente, comida y turno
/// </summary>
public class FilaDieta : EntityBase
{
    // ============================================================================
    // Identificación del paciente (desde HIS)
    // ============================================================================

    /// <summary>
    /// ID del paciente en el sistema HIS
    /// </summary>
    public string PacienteId { get; set; } = string.Empty;

    /// <summary>
    /// Consecutivo de ingreso hospitalario (Vital)
    /// </summary>
    public int? IdIngreso { get; set; }

    /// <summary>
    /// Número de documento del paciente
    /// </summary>
    public string? Cedula { get; set; }

    /// <summary>
    /// Tipo de documento (CC, TI, etc.)
    /// </summary>
    public string? TipoDocumento { get; set; }

    /// <summary>
    /// Nombre completo del paciente
    /// </summary>
    public string Paciente { get; set; } = string.Empty;

    /// <summary>
    /// Edad calculada del paciente
    /// </summary>
    public int Edad { get; set; }

    // ============================================================================
    // Ubicación hospitalaria (desde HIS)
    // ============================================================================

    /// <summary>
    /// Servicio clínico (ej: Medicina Interna, Cirugía)
    /// </summary>
    public string Servicio { get; set; } = string.Empty;

    /// <summary>
    /// Pabellón hospitalario (3-7)
    /// </summary>
    public string Pabellon { get; set; } = string.Empty;

    /// <summary>
    /// Número de habitación
    /// </summary>
    public string Habitacion { get; set; } = string.Empty;

    // ============================================================================
    // Datos de la dieta (Bital)
    // ============================================================================

    /// <summary>
    /// Tiempo de comida (Desayuno, Almuerzo, etc.)
    /// </summary>
    public TiempoComida Comida { get; set; }

    /// <summary>
    /// Consistencia de la dieta (obligatoria al confirmar)
    /// </summary>
    public string? Consistencia { get; set; }

    /// <summary>
    /// ID del tipo de dieta desde el catálogo
    /// </summary>
    public Guid? TipoDietaId { get; set; }

    /// <summary>
    /// Descripción de la dieta (desde catálogo o personalizada)
    /// </summary>
    public string? DescripcionDieta { get; set; }

    // ============================================================================
    // Condiciones clínicas
    // ============================================================================

    /// <summary>
    /// Paciente en aislamiento
    /// </summary>
    public bool Aislado { get; set; }

    /// <summary>
    /// Tipo o razón del aislamiento
    /// </summary>
    public string Aislamiento { get; set; } = string.Empty;

    /// <summary>
    /// Observaciones específicas del aislamiento
    /// </summary>
    public string? ObservacionAislamiento { get; set; }

    /// <summary>
    /// Paciente con alergias alimentarias
    /// </summary>
    public bool Alergico { get; set; }

    /// <summary>
    /// Detalle de alergias
    /// </summary>
    public string Alergias { get; set; } = string.Empty;

    // ============================================================================
    // Observaciones y solicitud
    // ============================================================================

    /// <summary>
    /// Observaciones generales de la dieta
    /// </summary>
    public string? Observaciones { get; set; }

    /// <summary>
    /// Usuario que solicitó/confirmó la dieta
    /// </summary>
    public string? SolicitadoPor { get; set; }

    /// <summary>
    /// Fecha y hora de solicitud
    /// </summary>
    public DateTime? SolicitadoEn { get; set; }

    // ============================================================================
    // Estado y ciclo
    // ============================================================================

    /// <summary>
    /// Estado actual en el ciclo de vida
    /// </summary>
    public EstadoDieta Estado { get; set; } = EstadoDieta.Pendiente;

    /// <summary>
    /// Indica si la cancelación fue tardía (fuera de ventana)
    /// </summary>
    public bool CancelacionTardia { get; set; }

    /// <summary>
    /// Paciente con salida clínica después del límite de novedades: la dieta no se
    /// cancela porque cocina ya la produjo y el proveedor debe enviarla.
    /// </summary>
    public bool SalidaClinicaSostenida { get; set; }

    /// <summary>
    /// ID de la orden de cocina generada al confirmar
    /// </summary>
    public Guid? OrdenCocinaId { get; set; }

    /// <summary>
    /// Fecha operativa de la dieta (día del servicio)
    /// </summary>
    public DateTime FechaOperativa { get; set; }

    // ============================================================================
    // Navegación
    // ============================================================================

    /// <summary>
    /// Catálogo de tipo de dieta (si aplica)
    /// </summary>
    public DietaCatalogo? TipoDieta { get; set; }
}
