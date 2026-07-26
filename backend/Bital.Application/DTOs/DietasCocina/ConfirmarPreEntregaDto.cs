namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para confirmar pre-entrega en enfermería
/// </summary>
public class ConfirmarPreEntregaDto
{
    /// <summary>
    /// Usuario que recibe (opcional, puede obtenerse del contexto)
    /// </summary>
    public string? RecibidoPor { get; set; }
}
