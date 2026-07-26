using Bital.Domain.Common;

namespace Bital.Domain.Entities.Encuestas;

public class LogicaPreguntaCuestionario : EntityBase
{
    public Guid PreguntaCuestionarioId { get; set; }
    public Guid? PreguntaOrigenId { get; set; }
    public string? Operador { get; set; }
    public string? Valor { get; set; }
    public string? Accion { get; set; }
    public PreguntaCuestionario? Pregunta { get; set; }
}
