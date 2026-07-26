using Bital.Domain.Common;

namespace Bital.Domain.Entities.Encuestas;

public class SeccionCuestionario : EntityBase
{
    public Guid CuestionarioEncuestaId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int Orden { get; set; }
    public CuestionarioEncuesta? Cuestionario { get; set; }
    public ICollection<PreguntaCuestionario> Preguntas { get; set; } = new List<PreguntaCuestionario>();
}
