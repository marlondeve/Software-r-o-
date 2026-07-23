using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Bital.ApiConsultas.Data.Entities;

/// <summary>
/// Entidad CAPBAS - Datos demográficos del paciente en Vital HIS
/// </summary>
[Table("CAPBAS")]
public class CapBasica
{
    [Key]
    [Column("MPCedu")]
    [MaxLength(16)]
    public string Cedula { get; set; } = string.Empty;

    [Key]
    [Column("MPTDoc")]
    [MaxLength(3)]
    public string TipoDocumento { get; set; } = string.Empty;

    [Column("MPNom1")]
    [MaxLength(60)]
    public string? PrimerNombre { get; set; }

    [Column("MPNom2")]
    [MaxLength(60)]
    public string? SegundoNombre { get; set; }

    [Column("MPApe1")]
    [MaxLength(60)]
    public string? PrimerApellido { get; set; }

    [Column("MPApe2")]
    [MaxLength(60)]
    public string? SegundoApellido { get; set; }

    [Column("MPFchN")]
    public DateTime? FechaNacimiento { get; set; }

    [Column("MPSexo")]
    [MaxLength(1)]
    public string? Sexo { get; set; }

    [Column("MPDire")]
    [MaxLength(200)]
    public string? Direccion { get; set; }

    [Column("MPTele")]
    [MaxLength(50)]
    public string? Telefono { get; set; }

    [Column("MDCodD")]
    [MaxLength(8)]
    public string? CodigoDepartamento { get; set; }

    [Column("MDCodM")]
    [MaxLength(8)]
    public string? CodigoMunicipio { get; set; }

    [Column("MDCodB")]
    [MaxLength(8)]
    public string? CodigoBarrio { get; set; }

    [Column("MpMail")]
    [MaxLength(200)]
    public string? Email { get; set; }

    [Column("MPEstPac")]
    [MaxLength(1)]
    public string? EstadoPaciente { get; set; }

    [Column("MPCodPai")]
    [MaxLength(3)]
    public string? CodigoPais { get; set; }

    // Propiedades calculadas
    [NotMapped]
    public string NombreCompleto =>
        $"{PrimerNombre?.Trim()} {SegundoNombre?.Trim()} {PrimerApellido?.Trim()} {SegundoApellido?.Trim()}"
            .Replace("  ", " ").Trim();

    [NotMapped]
    public int? Edad
    {
        get
        {
            if (!FechaNacimiento.HasValue) return null;
            var hoy = DateTime.Today;
            var edad = hoy.Year - FechaNacimiento.Value.Year;
            if (FechaNacimiento.Value.Date > hoy.AddYears(-edad)) edad--;
            return edad;
        }
    }

    // Navegación
    public MaestroPaciente? MaestroPaciente { get; set; }
}
