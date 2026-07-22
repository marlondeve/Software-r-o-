using Bital.ApiConsultas.Contracts.Responses;
using Bital.ApiConsultas.Data;
using Microsoft.EntityFrameworkCore;

namespace Bital.ApiConsultas.Services;

/// <summary>
/// Implementación del servicio de consultas para atenciones
/// </summary>
public class AtencionesQueryService : IAtencionesQueryService
{
    private readonly VitalDbContext _context;
    private readonly ILogger<AtencionesQueryService> _logger;

    public AtencionesQueryService(
        VitalDbContext context,
        ILogger<AtencionesQueryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<AtencionResponse>> GetAtencionesActivasAsync(
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Consultando atenciones activas desde Vital");

        var atenciones = await _context.Atenciones
            .Include(a => a.Paciente)
            .Where(a => a.Estado == "Activa" || a.Estado == "ACTIVA") // Ajustar según valores reales
            .Select(a => new AtencionResponse
            {
                AtencionId = a.AtencionId,
                NumeroAtencion = a.NumeroAtencion,
                Paciente = new PacienteBasicoResponse
                {
                    PacienteId = a.Paciente!.PacienteId,
                    NumeroDocumento = a.Paciente.NumeroDocumento,
                    TipoDocumento = a.Paciente.TipoDocumento,
                    NombreCompleto = a.Paciente.NombreCompleto,
                    PrimerNombre = a.Paciente.PrimerNombre,
                    SegundoNombre = a.Paciente.SegundoNombre,
                    PrimerApellido = a.Paciente.PrimerApellido,
                    SegundoApellido = a.Paciente.SegundoApellido,
                    FechaNacimiento = a.Paciente.FechaNacimiento,
                    Edad = a.Paciente.Edad,
                    Genero = a.Paciente.Genero
                },
                ServicioId = a.ServicioId,
                ServicioNombre = a.ServicioNombre,
                HabitacionNumero = a.HabitacionNumero,
                CamaNumero = a.CamaNumero,
                FechaIngreso = a.FechaIngreso,
                Estado = a.Estado,
                TipoAtencion = a.TipoAtencion,
                Diagnostico = a.Diagnostico
            })
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Se encontraron {Count} atenciones activas", atenciones.Count);

        return atenciones;
    }

    public async Task<IEnumerable<AtencionResponse>> GetAtencionesPorServicioAsync(
        string servicioId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Consultando atenciones activas para servicio {ServicioId}", servicioId);

        var atenciones = await _context.Atenciones
            .Include(a => a.Paciente)
            .Where(a => a.ServicioId == servicioId &&
                       (a.Estado == "Activa" || a.Estado == "ACTIVA"))
            .Select(a => new AtencionResponse
            {
                AtencionId = a.AtencionId,
                NumeroAtencion = a.NumeroAtencion,
                Paciente = new PacienteBasicoResponse
                {
                    PacienteId = a.Paciente!.PacienteId,
                    NumeroDocumento = a.Paciente.NumeroDocumento,
                    TipoDocumento = a.Paciente.TipoDocumento,
                    NombreCompleto = a.Paciente.NombreCompleto,
                    PrimerNombre = a.Paciente.PrimerNombre,
                    SegundoNombre = a.Paciente.SegundoNombre,
                    PrimerApellido = a.Paciente.PrimerApellido,
                    SegundoApellido = a.Paciente.SegundoApellido,
                    FechaNacimiento = a.Paciente.FechaNacimiento,
                    Edad = a.Paciente.Edad,
                    Genero = a.Paciente.Genero
                },
                ServicioId = a.ServicioId,
                ServicioNombre = a.ServicioNombre,
                HabitacionNumero = a.HabitacionNumero,
                CamaNumero = a.CamaNumero,
                FechaIngreso = a.FechaIngreso,
                Estado = a.Estado,
                TipoAtencion = a.TipoAtencion,
                Diagnostico = a.Diagnostico
            })
            .ToListAsync(cancellationToken);

        return atenciones;
    }

    public async Task<AtencionResponse?> GetAtencionPorIdAsync(
        string atencionId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Consultando atención {AtencionId}", atencionId);

        var atencion = await _context.Atenciones
            .Include(a => a.Paciente)
            .Where(a => a.AtencionId == atencionId)
            .Select(a => new AtencionResponse
            {
                AtencionId = a.AtencionId,
                NumeroAtencion = a.NumeroAtencion,
                Paciente = new PacienteBasicoResponse
                {
                    PacienteId = a.Paciente!.PacienteId,
                    NumeroDocumento = a.Paciente.NumeroDocumento,
                    TipoDocumento = a.Paciente.TipoDocumento,
                    NombreCompleto = a.Paciente.NombreCompleto,
                    PrimerNombre = a.Paciente.PrimerNombre,
                    SegundoNombre = a.Paciente.SegundoNombre,
                    PrimerApellido = a.Paciente.PrimerApellido,
                    SegundoApellido = a.Paciente.SegundoApellido,
                    FechaNacimiento = a.Paciente.FechaNacimiento,
                    Edad = a.Paciente.Edad,
                    Genero = a.Paciente.Genero
                },
                ServicioId = a.ServicioId,
                ServicioNombre = a.ServicioNombre,
                HabitacionNumero = a.HabitacionNumero,
                CamaNumero = a.CamaNumero,
                FechaIngreso = a.FechaIngreso,
                Estado = a.Estado,
                TipoAtencion = a.TipoAtencion,
                Diagnostico = a.Diagnostico
            })
            .FirstOrDefaultAsync(cancellationToken);

        return atencion;
    }

    public async Task<IEnumerable<AtencionResponse>> GetAtencionesPorPacienteAsync(
        string numeroDocumento,
        string tipoDocumento,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Consultando atenciones para paciente {TipoDoc}-{NumDoc}",
            tipoDocumento, numeroDocumento);

        var atenciones = await _context.Atenciones
            .Include(a => a.Paciente)
            .Where(a => a.Paciente!.NumeroDocumento == numeroDocumento &&
                       a.Paciente.TipoDocumento == tipoDocumento &&
                       (a.Estado == "Activa" || a.Estado == "ACTIVA"))
            .Select(a => new AtencionResponse
            {
                AtencionId = a.AtencionId,
                NumeroAtencion = a.NumeroAtencion,
                Paciente = new PacienteBasicoResponse
                {
                    PacienteId = a.Paciente!.PacienteId,
                    NumeroDocumento = a.Paciente.NumeroDocumento,
                    TipoDocumento = a.Paciente.TipoDocumento,
                    NombreCompleto = a.Paciente.NombreCompleto,
                    PrimerNombre = a.Paciente.PrimerNombre,
                    SegundoNombre = a.Paciente.SegundoNombre,
                    PrimerApellido = a.Paciente.PrimerApellido,
                    SegundoApellido = a.Paciente.SegundoApellido,
                    FechaNacimiento = a.Paciente.FechaNacimiento,
                    Edad = a.Paciente.Edad,
                    Genero = a.Paciente.Genero
                },
                ServicioId = a.ServicioId,
                ServicioNombre = a.ServicioNombre,
                HabitacionNumero = a.HabitacionNumero,
                CamaNumero = a.CamaNumero,
                FechaIngreso = a.FechaIngreso,
                Estado = a.Estado,
                TipoAtencion = a.TipoAtencion,
                Diagnostico = a.Diagnostico
            })
            .ToListAsync(cancellationToken);

        return atenciones;
    }
}
