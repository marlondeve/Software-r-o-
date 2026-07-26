using Bital.Application.DTOs.Encuestas;

namespace Bital.Application.Interfaces;

public interface IPacientesEncuestasService
{
    /// <summary>
    /// Busca pacientes por término (nombre, documento)
    /// </summary>
    Task<EnvelopePacientesDto> BuscarPacientesAsync(string termino, int maxResults = 10);

    /// <summary>
    /// Obtiene las atenciones de un paciente
    /// </summary>
    Task<EnvelopeAtencionesDto> ObtenerAtencionesAsync(string cedula, string tipoDocumento);

    /// <summary>
    /// Registra la identificación de un paciente para iniciar encuesta
    /// </summary>
    Task<PacienteContextoDto> IdentificarPacienteAsync(IdentificarPacienteRequestDto request, string usuario);
}
