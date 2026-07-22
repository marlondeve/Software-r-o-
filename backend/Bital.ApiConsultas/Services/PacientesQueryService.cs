using Bital.ApiConsultas.Contracts.Responses;
using Bital.ApiConsultas.Data;
using Microsoft.EntityFrameworkCore;

namespace Bital.ApiConsultas.Services;

/// <summary>
/// Implementación del servicio de consultas para pacientes
/// </summary>
public class PacientesQueryService : IPacientesQueryService
{
    private readonly VitalDbContext _context;
    private readonly ILogger<PacientesQueryService> _logger;

    public PacientesQueryService(
        VitalDbContext context,
        ILogger<PacientesQueryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PacienteResponse?> GetPacientePorDocumentoAsync(
        string numeroDocumento,
        string tipoDocumento,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Consultando paciente {TipoDoc}-{NumDoc}", tipoDocumento, numeroDocumento);

        var paciente = await _context.Pacientes
            .Where(p => p.NumeroDocumento == numeroDocumento &&
                       p.TipoDocumento == tipoDocumento)
            .Select(p => new PacienteResponse
            {
                PacienteId = p.PacienteId,
                NumeroDocumento = p.NumeroDocumento,
                TipoDocumento = p.TipoDocumento,
                NombreCompleto = p.NombreCompleto,
                PrimerNombre = p.PrimerNombre,
                SegundoNombre = p.SegundoNombre,
                PrimerApellido = p.PrimerApellido,
                SegundoApellido = p.SegundoApellido,
                FechaNacimiento = p.FechaNacimiento,
                Edad = p.Edad,
                Genero = p.Genero,
                Telefono = p.Telefono,
                Email = p.Email,
                Direccion = p.Direccion,
                Ciudad = p.Ciudad,
                EPS = p.EPS,
                TipoAfiliacion = p.TipoAfiliacion
            })
            .FirstOrDefaultAsync(cancellationToken);

        return paciente;
    }

    public async Task<PacienteResponse?> GetPacientePorIdAsync(
        string pacienteId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Consultando paciente por ID {PacienteId}", pacienteId);

        var paciente = await _context.Pacientes
            .Where(p => p.PacienteId == pacienteId)
            .Select(p => new PacienteResponse
            {
                PacienteId = p.PacienteId,
                NumeroDocumento = p.NumeroDocumento,
                TipoDocumento = p.TipoDocumento,
                NombreCompleto = p.NombreCompleto,
                PrimerNombre = p.PrimerNombre,
                SegundoNombre = p.SegundoNombre,
                PrimerApellido = p.PrimerApellido,
                SegundoApellido = p.SegundoApellido,
                FechaNacimiento = p.FechaNacimiento,
                Edad = p.Edad,
                Genero = p.Genero,
                Telefono = p.Telefono,
                Email = p.Email,
                Direccion = p.Direccion,
                Ciudad = p.Ciudad,
                EPS = p.EPS,
                TipoAfiliacion = p.TipoAfiliacion
            })
            .FirstOrDefaultAsync(cancellationToken);

        return paciente;
    }

    public async Task<IEnumerable<PacienteResponse>> BuscarPacientesPorNombreAsync(
        string searchTerm,
        int maxResults = 20,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Buscando pacientes con término '{SearchTerm}'", searchTerm);

        var searchLower = searchTerm.ToLower();

        var pacientes = await _context.Pacientes
            .Where(p =>
                p.PrimerNombre.ToLower().Contains(searchLower) ||
                p.PrimerApellido.ToLower().Contains(searchLower) ||
                p.NumeroDocumento.Contains(searchTerm))
            .Take(maxResults)
            .Select(p => new PacienteResponse
            {
                PacienteId = p.PacienteId,
                NumeroDocumento = p.NumeroDocumento,
                TipoDocumento = p.TipoDocumento,
                NombreCompleto = p.NombreCompleto,
                PrimerNombre = p.PrimerNombre,
                SegundoNombre = p.SegundoNombre,
                PrimerApellido = p.PrimerApellido,
                SegundoApellido = p.SegundoApellido,
                FechaNacimiento = p.FechaNacimiento,
                Edad = p.Edad,
                Genero = p.Genero,
                Telefono = p.Telefono,
                Email = p.Email,
                Direccion = p.Direccion,
                Ciudad = p.Ciudad,
                EPS = p.EPS,
                TipoAfiliacion = p.TipoAfiliacion
            })
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Se encontraron {Count} pacientes", pacientes.Count);

        return pacientes;
    }
}
