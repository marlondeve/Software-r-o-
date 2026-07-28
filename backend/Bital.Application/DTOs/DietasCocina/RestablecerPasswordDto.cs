namespace Bital.Application.DTOs.DietasCocina;

public class RestablecerPasswordResponseDto
{
    public required string Identificacion { get; set; }
    public required string PasswordTemporal { get; set; }
    public required string Mensaje { get; set; }
}
