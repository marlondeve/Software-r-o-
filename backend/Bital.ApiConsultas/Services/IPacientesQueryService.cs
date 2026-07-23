using Bital.ApiConsultas.Contracts.Responses;

namespace Bital.ApiConsultas.Services;

/// <summary>
/// Servicio de consultas para pacientes
/// </summary>
public interface IPacientesQueryService
{
    /// <summary>
    /// Busca un paciente por número y tipo de documento
    /// </summary>
    Task<PacienteResponse?> GetPacientePorDocumentoAsync(
        string numeroDocumento,
        string tipoDocumento,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtiene un paciente por su ID
    /// </summary>
    Task<PacienteResponse?> GetPacientePorIdAsync(
        string pacienteId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Busca pacientes por nombre (búsqueda parcial)
    /// </summary>
    Task<IEnumerable<PacienteResponse>> BuscarPacientesPorNombreAsync(
        string searchTerm,
        int maxResults = 20,
        CancellationToken cancellationToken = default);
}
