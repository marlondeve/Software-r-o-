using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Bital.ApiConsultas.Data.Entities;

/// <summary>
/// Entidad INGRESOS - Movimientos y atenciones del paciente en Vital HIS
/// </summary>
[Table("INGRESOS")]
public class Ingreso
{
    [Key]
    [Column("MPCedu")]
    [MaxLength(16)]
    public string Cedula { get; set; } = string.Empty;

    [Key]
    [Column("MPTDoc")]
    [MaxLength(3)]
    public string TipoDocumento { get; set; } = string.Empty;

    [Key]
    [Column("IngCsc")]
    public int Consecutivo { get; set; }

    [Column("ClaPro")]
    [MaxLength(6)]
    public string? ClaseProcedimiento { get; set; }

    [Column("IngFecAdm")]
    public DateTime? FechaAdmision { get; set; }

    [Column("IngNit")]
    [MaxLength(10)]
    public string? NitEntidad { get; set; }

    [Column("IngFac")]
    [MaxLength(20)]
    public string? NumeroFactura { get; set; }

    [Column("IngDoc")]
    [MaxLength(20)]
    public string? NumeroDocumento { get; set; }

    [Column("IngEntDx")]
    [MaxLength(6)]
    public string? DiagnosticoEntrada { get; set; }

    [Column("IngHsp")]
    [MaxLength(1)]
    public string? TipoHospitalizacion { get; set; }

    [Column("IngExtEst")]
    [MaxLength(1)]
    public string? EstadoExterno { get; set; }

    [Column("IngEstSld")]
    [MaxLength(1)]
    public string? EstadoSalida { get; set; }

    [Column("IngUsrReg")]
    [MaxLength(4)]
    public string? UsuarioRegistro { get; set; }

    [Column("IngIPS")]
    [MaxLength(10)]
    public string? CodigoIPS { get; set; }

    [Column("IngFecEgr")]
    public DateTime? FechaEgreso { get; set; }

    [Column("IngSalDx")]
    [MaxLength(6)]
    public string? DiagnosticoSalida { get; set; }

    [Column("IngDxTip")]
    [MaxLength(2)]
    public string? TipoDiagnostico { get; set; }

    [Column("IngNotObl")]
    [MaxLength(1)]
    public string? NotificacionObligatoria { get; set; }

    [Column("IngEntDx2")]
    [MaxLength(6)]
    public string? DiagnosticoEntrada2 { get; set; }

    [Column("IngNmResp")]
    [MaxLength(200)]
    public string? NombreResponsable { get; set; }

    // Propiedades calculadas
    [NotMapped]
    public bool EstaActivo => !FechaEgreso.HasValue;

    [NotMapped]
    public string EstadoActual => EstaActivo ? "Activo" : "Egresado";

    // Navegación
    public MaestroPaciente? MaestroPaciente { get; set; }
}

