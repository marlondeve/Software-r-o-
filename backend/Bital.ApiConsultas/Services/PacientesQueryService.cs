using Bital.ApiConsultas.Contracts.Responses;
using Bital.ApiConsultas.Data;
using Microsoft.EntityFrameworkCore;

namespace Bital.ApiConsultas.Services;

/// <summary>
/// Implementación del servicio de consultas para pacientes desde Vital HIS
/// Combina datos de CAPBAS (demográficos) y MAEPAC (afiliación)
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

        var sql = @"
            SELECT TOP 1
                RTRIM(LTRIM(c.MPCedu)) AS Cedula,
                RTRIM(LTRIM(c.MPTDoc)) AS TipoDocumento,
                RTRIM(LTRIM(ISNULL(c.MPNom1, ''))) AS PrimerNombre,
                RTRIM(LTRIM(ISNULL(c.MPNom2, ''))) AS SegundoNombre,
                RTRIM(LTRIM(ISNULL(c.MPApe1, ''))) AS PrimerApellido,
                RTRIM(LTRIM(ISNULL(c.MPApe2, ''))) AS SegundoApellido,
                c.MPFchN AS FechaNacimiento,
                RTRIM(LTRIM(ISNULL(c.MPSexo, ''))) AS Sexo,
                RTRIM(LTRIM(ISNULL(c.MPTele, ''))) AS Telefono,
                RTRIM(LTRIM(ISNULL(c.MpMail, ''))) AS Email,
                RTRIM(LTRIM(ISNULL(c.MPDire, ''))) AS Direccion,
                RTRIM(LTRIM(ISNULL(c.MDCodM, ''))) AS CodigoMunicipio,
                RTRIM(LTRIM(ISNULL(m.MPstatus, ''))) AS Estado,
                RTRIM(LTRIM(ISNULL(m.MENNIT, ''))) AS NitEntidad,
                m.MPFchAfl AS FechaAfiliacion
            FROM CAPBAS c
            LEFT JOIN MAEPAC m ON c.MPCedu = m.MPCedu AND c.MPTDoc = m.MPTDoc
            WHERE c.MPCedu = {0} AND c.MPTDoc = {1}";

        var resultado = await _context.Database
            .SqlQueryRaw<PacienteDto>(sql, numeroDocumento, tipoDocumento)
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        if (resultado == null)
            return null;

        return MapearPacienteResponse(resultado);
    }

    public async Task<PacienteResponse?> GetPacientePorIdAsync(
        string pacienteId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Consultando paciente por ID {PacienteId}", pacienteId);

        var sql = @"
            SELECT TOP 1
                RTRIM(LTRIM(c.MPCedu)) AS Cedula,
                RTRIM(LTRIM(c.MPTDoc)) AS TipoDocumento,
                RTRIM(LTRIM(ISNULL(c.MPNom1, ''))) AS PrimerNombre,
                RTRIM(LTRIM(ISNULL(c.MPNom2, ''))) AS SegundoNombre,
                RTRIM(LTRIM(ISNULL(c.MPApe1, ''))) AS PrimerApellido,
                RTRIM(LTRIM(ISNULL(c.MPApe2, ''))) AS SegundoApellido,
                c.MPFchN AS FechaNacimiento,
                RTRIM(LTRIM(ISNULL(c.MPSexo, ''))) AS Sexo,
                RTRIM(LTRIM(ISNULL(c.MPTele, ''))) AS Telefono,
                RTRIM(LTRIM(ISNULL(c.MpMail, ''))) AS Email,
                RTRIM(LTRIM(ISNULL(c.MPDire, ''))) AS Direccion,
                RTRIM(LTRIM(ISNULL(c.MDCodM, ''))) AS CodigoMunicipio,
                RTRIM(LTRIM(ISNULL(m.MPstatus, ''))) AS Estado,
                RTRIM(LTRIM(ISNULL(m.MENNIT, ''))) AS NitEntidad,
                m.MPFchAfl AS FechaAfiliacion
            FROM CAPBAS c
            LEFT JOIN MAEPAC m ON c.MPCedu = m.MPCedu AND c.MPTDoc = m.MPTDoc
            WHERE c.MPCedu = {0}";

        var resultado = await _context.Database
            .SqlQueryRaw<PacienteDto>(sql, pacienteId)
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        if (resultado == null)
            return null;

        return MapearPacienteResponse(resultado);
    }

    public async Task<IEnumerable<PacienteResponse>> BuscarPacientesPorNombreAsync(
        string searchTerm,
        int maxResults = 20,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Buscando pacientes con término '{SearchTerm}'", searchTerm);

        var sql = $@"
            SELECT TOP {maxResults}
                RTRIM(LTRIM(c.MPCedu)) AS Cedula,
                RTRIM(LTRIM(c.MPTDoc)) AS TipoDocumento,
                RTRIM(LTRIM(ISNULL(c.MPNom1, ''))) AS PrimerNombre,
                RTRIM(LTRIM(ISNULL(c.MPNom2, ''))) AS SegundoNombre,
                RTRIM(LTRIM(ISNULL(c.MPApe1, ''))) AS PrimerApellido,
                RTRIM(LTRIM(ISNULL(c.MPApe2, ''))) AS SegundoApellido,
                c.MPFchN AS FechaNacimiento,
                RTRIM(LTRIM(ISNULL(c.MPSexo, ''))) AS Sexo,
                RTRIM(LTRIM(ISNULL(c.MPTele, ''))) AS Telefono,
                RTRIM(LTRIM(ISNULL(c.MpMail, ''))) AS Email,
                RTRIM(LTRIM(ISNULL(c.MPDire, ''))) AS Direccion,
                RTRIM(LTRIM(ISNULL(c.MDCodM, ''))) AS CodigoMunicipio,
                RTRIM(LTRIM(ISNULL(m.MPstatus, ''))) AS Estado,
                RTRIM(LTRIM(ISNULL(m.MENNIT, ''))) AS NitEntidad,
                m.MPFchAfl AS FechaAfiliacion
            FROM CAPBAS c
            LEFT JOIN MAEPAC m ON c.MPCedu = m.MPCedu AND c.MPTDoc = m.MPTDoc
            WHERE c.MPCedu LIKE {{0}}
               OR LOWER(c.MPNom1) LIKE {{0}}
               OR LOWER(c.MPApe1) LIKE {{0}}
            ORDER BY c.MPApe1, c.MPNom1";

        var searchPattern = $"%{searchTerm}%";

        var resultados = await _context.Database
            .SqlQueryRaw<PacienteDto>(sql, searchPattern)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Se encontraron {Count} pacientes", resultados.Count);

        return resultados.Select(MapearPacienteResponse).ToList();
    }

    private PacienteResponse MapearPacienteResponse(PacienteDto dto)
    {
        int? edad = null;
        if (dto.FechaNacimiento.HasValue)
        {
            var hoy = DateTime.Today;
            edad = hoy.Year - dto.FechaNacimiento.Value.Year;
            if (dto.FechaNacimiento.Value.Date > hoy.AddYears(-edad.Value))
                edad--;
        }

        var nombreCompleto = $"{dto.PrimerNombre} {dto.SegundoNombre} {dto.PrimerApellido} {dto.SegundoApellido}"
            .Replace("  ", " ").Trim();

        return new PacienteResponse
        {
            Cedula = dto.Cedula ?? string.Empty,
            TipoDocumento = dto.TipoDocumento ?? string.Empty,
            NombreCompleto = nombreCompleto,
            PrimerNombre = string.IsNullOrEmpty(dto.PrimerNombre) ? null : dto.PrimerNombre,
            SegundoNombre = string.IsNullOrEmpty(dto.SegundoNombre) ? null : dto.SegundoNombre,
            PrimerApellido = string.IsNullOrEmpty(dto.PrimerApellido) ? null : dto.PrimerApellido,
            SegundoApellido = string.IsNullOrEmpty(dto.SegundoApellido) ? null : dto.SegundoApellido,
            FechaNacimiento = dto.FechaNacimiento,
            Edad = edad,
            Sexo = string.IsNullOrEmpty(dto.Sexo) ? null : dto.Sexo,
            Telefono = string.IsNullOrEmpty(dto.Telefono) ? null : dto.Telefono,
            Email = string.IsNullOrEmpty(dto.Email) ? null : dto.Email,
            Direccion = string.IsNullOrEmpty(dto.Direccion) ? null : dto.Direccion,
            Municipio = string.IsNullOrEmpty(dto.CodigoMunicipio) ? null : dto.CodigoMunicipio,
            Estado = string.IsNullOrEmpty(dto.Estado) ? null : dto.Estado,
            NitEntidad = string.IsNullOrEmpty(dto.NitEntidad) ? null : dto.NitEntidad,
            FechaAfiliacion = dto.FechaAfiliacion
        };
    }

    /// <summary>
    /// DTO interno para mapear resultados SQL Raw
    /// </summary>
    private class PacienteDto
    {
        public string? Cedula { get; set; }
        public string? TipoDocumento { get; set; }
        public string? PrimerNombre { get; set; }
        public string? SegundoNombre { get; set; }
        public string? PrimerApellido { get; set; }
        public string? SegundoApellido { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public string? Sexo { get; set; }
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public string? Direccion { get; set; }
        public string? CodigoMunicipio { get; set; }
        public string? Estado { get; set; }
        public string? NitEntidad { get; set; }
        public DateTime? FechaAfiliacion { get; set; }
    }
}
