using System;
using Bital.Domain.Common;

namespace Bital.Domain.Entities.Encuestas;

public class RespuestaCapturaEncuesta : EntityBase
{
    public Guid CapturaEncuestaId { get; set; }
    public Guid PreguntaCuestionarioId { get; set; }
    public Guid? OpcionPreguntaCuestionarioId { get; set; }
    public string? ValorTexto { get; set; }
    public string? ValorMultiple { get; set; }
    public DateTime FechaRespuesta { get; set; } = DateTime.UtcNow;

    public CapturaEncuesta? CapturaEncuesta { get; set; }
    public PreguntaCuestionario? Pregunta { get; set; }
    public OpcionPreguntaCuestionario? Opcion { get; set; }
}