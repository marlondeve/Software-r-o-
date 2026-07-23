using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Bital.ApiConsultas.Data.Entities;

/// <summary>
/// Entidad MAEPAC - Maestro de afiliación del paciente en Vital HIS
/// </summary>
[Table("MAEPAC")]
public class MaestroPaciente
{
    [Key]
    [Column("MPCedu")]
    [MaxLength(16)]
    public string Cedula { get; set; } = string.Empty;

    [Key]
    [Column("MPTDoc")]
    [MaxLength(3)]
    public string TipoDocumento { get; set; } = string.Empty;

    [Column("MENNIT")]
    [MaxLength(10)]
    public string? NitEntidad { get; set; }

    [Column("MTUCod")]
    [MaxLength(1)]
    public string? CodigoTipoUsuario { get; set; }

    [Column("MTCodP")]
    [MaxLength(1)]
    public string? CodigoTipoPaciente { get; set; }

    [Column("MPCUOM")]
    public DateTime? FechaUltimaOrdenMedica { get; set; }

    [Column("MPstatus")]
    [MaxLength(1)]
    public string? Estado { get; set; }

    [Column("MPACMO")]
    public decimal? Acumulado { get; set; }

    [Column("MPOrd")]
    public short? OrdenActual { get; set; }

    [Column("UltCtvPrx")]
    public short? UltimoConsecutivoProximo { get; set; }

    [Column("MPFchAfl")]
    public DateTime? FechaAfiliacion { get; set; }

    [Column("MenTitCed")]
    [MaxLength(16)]
    public string? CedulaTitular { get; set; }

    [Column("MenTitTip")]
    [MaxLength(3)]
    public string? TipoDocumentoTitular { get; set; }

    [Column("MenTitNom")]
    [MaxLength(200)]
    public string? NombreTitular { get; set; }

    [Column("MenTitPar")]
    [MaxLength(1)]
    public string? ParentescoTitular { get; set; }

    [Column("MenTitular")]
    public short? EsTitular { get; set; }

    // Navegación
    public CapBasica? CapBasica { get; set; }
    public ICollection<Ingreso> Ingresos { get; set; } = new List<Ingreso>();
}
