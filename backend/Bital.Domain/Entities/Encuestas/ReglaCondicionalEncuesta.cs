using Bital.Domain.Common;

namespace Bital.Domain.Entities.Encuestas;

public class ReglaCondicionalEncuesta : EntityBase
{
    public string Descripcion { get; set; } = string.Empty;
    public string Campo { get; set; } = string.Empty;
    public string Operador { get; set; } = string.Empty;
    public string Valor { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string Estado { get; set; } = "activa";
    public bool EsPredeterminada { get; set; }
}