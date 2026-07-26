using Bital.Domain.Common;
using Bital.Domain.Enums;

namespace Bital.Domain.Entities.DietasCocina;

public class UsuarioModulo : EntityBase
{
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Identificacion { get; set; }
    public RolDietas Rol { get; set; }
    public bool Activo { get; set; } = true;
    public string? Observaciones { get; set; }
    public DateTime? UltimoAcceso { get; set; }
}
