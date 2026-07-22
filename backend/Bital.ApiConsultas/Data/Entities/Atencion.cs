using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Bital.ApiConsultas.Data.Entities;

/// <summary>
/// Entidad de Atención hospitalaria desde Vital HIS
/// NOTA: Ajustar nombres de tabla y columnas según schema real de Vital
/// </summary>
[Table("Atenciones")] // Ajustar nombre real de tabla
public class Atencion
{
    [Key]
    [Column("AtencionID")]
    public string AtencionId { get; set; } = string.Empty;

    [Column("NumeroAtencion")]
    [StringLength(50)]
    public string NumeroAtencion { get; set; } = string.Empty;

    [Column("PacienteID")]
    public string PacienteId { get; set; } = string.Empty;

    [Column("ServicioID")]
    public string ServicioId { get; set; } = string.Empty;

    [Column("ServicioNombre")]
    [StringLength(200)]
    public string ServicioNombre { get; set; } = string.Empty;

    [Column("HabitacionNumero")]
    [StringLength(20)]
    public string? HabitacionNumero { get; set; }

    [Column("CamaNumero")]
    [StringLength(20)]
    public string? CamaNumero { get; set; }

    [Column("FechaIngreso")]
    public DateTime FechaIngreso { get; set; }

    [Column("Estado")]
    [StringLength(50)]
    public string Estado { get; set; } = string.Empty;

    [Column("TipoAtencion")]
    [StringLength(100)]
    public string? TipoAtencion { get; set; }

    [Column("Diagnostico")]
    [StringLength(500)]
    public string? Diagnostico { get; set; }

    // Relación con Paciente
    [ForeignKey(nameof(PacienteId))]
    public virtual Paciente? Paciente { get; set; }
}
