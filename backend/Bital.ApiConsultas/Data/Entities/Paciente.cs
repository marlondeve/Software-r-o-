using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Bital.ApiConsultas.Data.Entities;

/// <summary>
/// Entidad de Paciente desde Vital HIS
/// NOTA: Ajustar nombres de tabla y columnas según schema real de Vital
/// </summary>
[Table("Pacientes")] // Ajustar nombre real de tabla
public class Paciente
{
    [Key]
    [Column("PacienteID")]
    public string PacienteId { get; set; } = string.Empty;

    [Column("NumeroDocumento")]
    [StringLength(50)]
    public string NumeroDocumento { get; set; } = string.Empty;

    [Column("TipoDocumento")]
    [StringLength(10)]
    public string TipoDocumento { get; set; } = string.Empty;

    [Column("PrimerNombre")]
    [StringLength(100)]
    public string PrimerNombre { get; set; } = string.Empty;

    [Column("SegundoNombre")]
    [StringLength(100)]
    public string? SegundoNombre { get; set; }

    [Column("PrimerApellido")]
    [StringLength(100)]
    public string PrimerApellido { get; set; } = string.Empty;

    [Column("SegundoApellido")]
    [StringLength(100)]
    public string? SegundoApellido { get; set; }

    [Column("FechaNacimiento")]
    public DateTime FechaNacimiento { get; set; }

    [Column("Genero")]
    [StringLength(10)]
    public string Genero { get; set; } = string.Empty;

    [Column("Telefono")]
    [StringLength(50)]
    public string? Telefono { get; set; }

    [Column("Email")]
    [StringLength(200)]
    public string? Email { get; set; }

    [Column("Direccion")]
    [StringLength(300)]
    public string? Direccion { get; set; }

    [Column("Ciudad")]
    [StringLength(100)]
    public string? Ciudad { get; set; }

    [Column("EPS")]
    [StringLength(200)]
    public string? EPS { get; set; }

    [Column("TipoAfiliacion")]
    [StringLength(50)]
    public string? TipoAfiliacion { get; set; }

    // Propiedad calculada
    [NotMapped]
    public string NombreCompleto =>
        $"{PrimerNombre} {SegundoNombre} {PrimerApellido} {SegundoApellido}".Replace("  ", " ").Trim();

    [NotMapped]
    public int Edad
    {
        get
        {
            var hoy = DateTime.Today;
            var edad = hoy.Year - FechaNacimiento.Year;
            if (FechaNacimiento.Date > hoy.AddYears(-edad)) edad--;
            return edad;
        }
    }
}
