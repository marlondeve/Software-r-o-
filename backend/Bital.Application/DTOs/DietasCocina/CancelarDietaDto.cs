namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// Payload para cancelar una dieta (normal o tardía).
/// </summary>
public class CancelarDietaDto
{
    public required string Motivo { get; set; }

    public required string Justificacion { get; set; }

    /// <summary>
    /// Obligatorio cuando la cancelación es tardía (dieta confirmada o en cocina).
    /// </summary>
    public bool AceptaFacturacion { get; set; }

    /// <summary>
    /// Rol del usuario que cancela (Nutricionista, Doctor, Administrador, Enfermera, etc.).
    /// </summary>
    public string? RolUsuario { get; set; }
}
