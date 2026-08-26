namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para una fila del censo de dietas
/// </summary>
public class FilaDietaDto
{
    public Guid Id { get; set; }

    // Datos del paciente
    public string PacienteId { get; set; } = string.Empty;
    public int? IdIngreso { get; set; }
    public string? Cedula { get; set; }
    public string? TipoDocumento { get; set; }
    public string Paciente { get; set; } = string.Empty;
    public int Edad { get; set; }

    // Ubicación
    public string Servicio { get; set; } = string.Empty;
    public string Pabellon { get; set; } = string.Empty;
    public string Habitacion { get; set; } = string.Empty;

    // Dieta
    public string Comida { get; set; } = string.Empty;
    public string? Consistencia { get; set; }
    public Guid? TipoDietaId { get; set; }
    public string? DescripcionDieta { get; set; }

    // Condiciones clínicas
    public bool Aislado { get; set; }
    public string Aislamiento { get; set; } = string.Empty;
    public string? ObservacionAislamiento { get; set; }
    public bool Alergico { get; set; }
    public string Alergias { get; set; } = string.Empty;

    // Estado
    public string Estado { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public string? SolicitadoPor { get; set; }
    public DateTime? SolicitadoEn { get; set; }
    public bool CancelacionTardia { get; set; }

    /// <summary>
    /// True cuando la cancelación fue por salida clínica HIS (no manual).
    /// La UI muestra «Salida clínica» en lugar de «Cancelada».
    /// </summary>
    public bool CancelacionPorSalidaClinica { get; set; }

    public Guid? OrdenCocinaId { get; set; }

    public DateTime FechaOperativa { get; set; }
}
