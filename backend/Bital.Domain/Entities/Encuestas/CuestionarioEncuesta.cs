using Bital.Domain.Common;
using Bital.Domain.Enums;

namespace Bital.Domain.Entities.Encuestas;

public class CuestionarioEncuesta : EntityBase
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public CanalEncuesta Canal { get; set; }
    public EstadoCuestionario Estado { get; set; } = EstadoCuestionario.Borrador;
    public ICollection<SeccionCuestionario> Secciones { get; set; } = new List<SeccionCuestionario>();
}
