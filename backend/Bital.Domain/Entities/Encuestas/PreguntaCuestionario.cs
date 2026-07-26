using Bital.Domain.Common;

namespace Bital.Domain.Entities.Encuestas;

public class PreguntaCuestionario : EntityBase
{
    public Guid SeccionCuestionarioId { get; set; }
    public string Texto { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public bool EsRequerida { get; set; }
    public int Orden { get; set; }
    public bool Activa { get; set; } = true;
    public SeccionCuestionario? Seccion { get; set; }
    public ICollection<OpcionPreguntaCuestionario> Opciones { get; set; } = new List<OpcionPreguntaCuestionario>();
    public LogicaPreguntaCuestionario? Logica { get; set; }
}
