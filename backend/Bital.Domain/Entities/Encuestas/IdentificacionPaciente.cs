using Bital.Domain.Common;
using Bital.Domain.Enums;

namespace Bital.Domain.Entities.Encuestas;

public class IdentificacionPaciente : EntityBase
{
    public string NumeroDocumento { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public CanalEncuesta Canal { get; set; }
    public EstadoEncuesta Estado { get; set; } = EstadoEncuesta.Pendiente;
    public string? NombresPaciente { get; set; }
    public string? ApellidosPaciente { get; set; }
    public string? ServicioAtencion { get; set; }
    public string? Pabellon { get; set; }
    public string? Telefono { get; set; }
    public int? NumeroAtencion { get; set; }
    public DateTime FechaIdentificacion { get; set; } = DateTime.UtcNow;
    public string? UsuarioIdentificador { get; set; }
}
