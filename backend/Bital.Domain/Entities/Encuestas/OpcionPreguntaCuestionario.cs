using Bital.Domain.Common;

namespace Bital.Domain.Entities.Encuestas;

public class OpcionPreguntaCuestionario : EntityBase
{
    public Guid PreguntaCuestionarioId { get; set; }
    public string Texto { get; set; } = string.Empty;
    public string? Valor { get; set; }
    public int Orden { get; set; }
    public PreguntaCuestionario? Pregunta { get; set; }
}
