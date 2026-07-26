using System;
using Bital.Domain.Common;

namespace Bital.Domain.Entities.Encuestas;

public class IntentoLlamadaEncuesta : EntityBase
{
    public Guid CapturaEncuestaId { get; set; }
    public string Resultado { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public DateTime FechaIntento { get; set; } = DateTime.UtcNow;
    public string? UsuarioRegistro { get; set; }

    public CapturaEncuesta? CapturaEncuesta { get; set; }
}