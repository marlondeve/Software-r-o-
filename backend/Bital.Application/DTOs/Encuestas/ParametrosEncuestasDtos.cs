namespace Bital.Application.DTOs.Encuestas;

public class ReglaCondicionalEncuestaDto
{
    public string Id { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string Modificado { get; set; } = string.Empty;
}

public class NuevaReglaEncuestaDto
{
    public string Descripcion { get; set; } = string.Empty;
    public string Campo { get; set; } = string.Empty;
    public string Operador { get; set; } = string.Empty;
    public string Valor { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
}

public class CambiarEstadoReglaEncuestaDto
{
    public string Estado { get; set; } = string.Empty;
}

public class EstadoModoPruebaEncuestaDto
{
    public bool Activo { get; set; }
}

public class RespuestaParametrosEncuestaDto
{
    public List<ReglaCondicionalEncuestaDto> Data { get; set; } = new();
}
