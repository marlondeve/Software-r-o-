namespace Bital.Application.DTOs.DietasCocina;

public class LoginModuloDto
{
    public string Usuario { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginModuloResponseDto
{
    public Guid Id { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public Guid RolModuloId { get; set; }
    public string RolNombre { get; set; } = string.Empty;
}

public class CambiarPasswordDto
{
    public string Usuario { get; set; } = string.Empty;
    public string PasswordActual { get; set; } = string.Empty;
    public string PasswordNueva { get; set; } = string.Empty;
}

public class CambiarPasswordResponseDto
{
    public string Mensaje { get; set; } = string.Empty;
}
