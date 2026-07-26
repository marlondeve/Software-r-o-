using System;
using System.Collections.Generic;
using Bital.Domain.Common;
using Bital.Domain.Enums;

namespace Bital.Domain.Entities.Encuestas;

public class CapturaEncuesta : EntityBase
{
    public string Consecutivo { get; set; } = string.Empty;
    public Guid CuestionarioEncuestaId { get; set; }
    public string NumeroDocumento { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Servicio { get; set; } = string.Empty;
    public string? Pabellon { get; set; }
    public string? Telefono { get; set; }
    public int? NumeroAtencion { get; set; }
    public CanalEncuesta Canal { get; set; }
    public EstadoEncuesta Estado { get; set; } = EstadoEncuesta.EnProceso;
    public DateTime FechaInicio { get; set; } = DateTime.UtcNow;
    public DateTime? FechaUltimaActualizacion { get; set; }
    public DateTime? FechaFinalizacion { get; set; }
    public string? UsuarioFinaliza { get; set; }
    public string? MotivoAnulacion { get; set; }
    public DateTime? FechaAnulacion { get; set; }
    public string? UsuarioAnulacion { get; set; }
    public int? Sat { get; set; }
    public int? Nps { get; set; }
    public bool RequiereSeguimiento { get; set; }

    public CuestionarioEncuesta? Cuestionario { get; set; }
    public ICollection<RespuestaCapturaEncuesta> Respuestas { get; set; } = new List<RespuestaCapturaEncuesta>();
    public ICollection<IntentoLlamadaEncuesta> IntentosLlamada { get; set; } = new List<IntentoLlamadaEncuesta>();
}