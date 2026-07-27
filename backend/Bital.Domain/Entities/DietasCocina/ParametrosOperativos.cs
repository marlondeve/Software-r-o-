using Bital.Domain.Common;

namespace Bital.Domain.Entities.DietasCocina;

/// <summary>
/// Configuración operativa global del módulo dietas-cocina (singleton)
/// </summary>
public class ParametrosOperativos : EntityBase
{
    /// <summary>
    /// Modo de carga anticipada: por-comida | todas-desde-manana
    /// </summary>
    public string ModoCarga { get; set; } = "por-comida";
}
