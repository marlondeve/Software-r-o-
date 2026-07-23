using Bital.ApiConsultas.Contracts.Responses;
using Bital.ApiConsultas.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace Bital.ApiConsultas.Services;

/// <summary>
/// Implementación del servicio de consultas para ingresos/atenciones desde Vital HIS
/// Combina datos de INGRESOS (movimientos) y CAPBAS (datos del paciente)
/// Usa SQL Raw para evitar problemas de casting con el esquema legacy
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
        _logger.LogInformation("Consultando ingresos activos desde Vital");

        var sql = @"
            SELECT TOP 10
                i.MPCedu AS Cedula,
                i.MPTDoc AS TipoDocumento,
                i.IngCsc AS Consecutivo,
                c.MPNom1 AS PrimerNombre,
                c.MPNom2 AS SegundoNombre,
                c.MPApe1 AS PrimerApellido,
                c.MPApe2 AS SegundoApellido,
                c.MPFchN AS FechaNacimiento,
                c.MPSexo AS Sexo,
                i.ClaPro AS ClaseProcedimiento,
                i.IngFecAdm AS FechaAdmision,
                i.IngFecEgr AS FechaEgreso,
                i.IngEntDx AS DiagnosticoEntrada,
                i.IngSalDx AS DiagnosticoSalida,
                i.IngHsp AS TipoHospitalizacion,
                i.IngFac AS NumeroFactura
            FROM INGRESOS i
            INNER JOIN CAPBAS c ON RTRIM(LTRIM(i.MPCedu)) = RTRIM(LTRIM(c.MPCedu)) 
                AND RTRIM(LTRIM(i.MPTDoc)) = RTRIM(LTRIM(c.MPTDoc))
            WHERE i.IngFecEgr IS NULL
            ORDER BY i.IngFecAdm DESC";

        var resultados = await EjecutarQueryAtencionesAsync(sql, cancellationToken);

        _logger.LogInformation("Se encontraron {Count} ingresos activos", resultados.Count);

        return resultados;
    }

    public async Task<IEnumerable<AtencionResponse>> GetAtencionesPorServicioAsync(
        string servicioId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Consultando ingresos activos para clase de procedimiento {ClasePro}", servicioId);

        var sql = @"
            SELECT TOP 20
                i.MPCedu AS Cedula,
                i.MPTDoc AS TipoDocumento,
                i.IngCsc AS Consecutivo,
                c.MPNom1 AS PrimerNombre,
                c.MPNom2 AS SegundoNombre,
                c.MPApe1 AS PrimerApellido,
                c.MPApe2 AS SegundoApellido,
                c.MPFchN AS FechaNacimiento,
                c.MPSexo AS Sexo,
                i.ClaPro AS ClaseProcedimiento,
                i.IngFecAdm AS FechaAdmision,
                i.IngFecEgr AS FechaEgreso,
                i.IngEntDx AS DiagnosticoEntrada,
                i.IngSalDx AS DiagnosticoSalida,
                i.IngHsp AS TipoHospitalizacion,
                i.IngFac AS NumeroFactura
            FROM INGRESOS i
            INNER JOIN CAPBAS c ON RTRIM(LTRIM(i.MPCedu)) = RTRIM(LTRIM(c.MPCedu)) 
                AND RTRIM(LTRIM(i.MPTDoc)) = RTRIM(LTRIM(c.MPTDoc))
            WHERE RTRIM(LTRIM(i.ClaPro)) = @p0
              AND i.IngFecEgr IS NULL
            ORDER BY i.IngFecAdm DESC";

        var resultados = await EjecutarQueryAtencionesAsync(sql, cancellationToken, servicioId.Trim());

        _logger.LogInformation("Se encontraron {Count} ingresos para la clase de procedimiento {ClasePro}", 
            resultados.Count, servicioId);

        return resultados;
    }

    public async Task<AtencionResponse?> GetAtencionPorIdAsync(
        string atencionId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Consultando ingreso {AtencionId}", atencionId);

        // atencionId debe ser "cedula_tipoDoc_consecutivo"
        var partes = atencionId.Split('_');
        if (partes.Length != 3) return null;

        var cedula = partes[0];
        var tipoDoc = partes[1];
        if (!short.TryParse(partes[2], out var consecutivo)) return null;

        var sql = @"
            SELECT TOP 1
                i.MPCedu AS Cedula,
                i.MPTDoc AS TipoDocumento,
                i.IngCsc AS Consecutivo,
                c.MPNom1 AS PrimerNombre,
                c.MPNom2 AS SegundoNombre,
                c.MPApe1 AS PrimerApellido,
                c.MPApe2 AS SegundoApellido,
                c.MPFchN AS FechaNacimiento,
                c.MPSexo AS Sexo,
                i.ClaPro AS ClaseProcedimiento,
                i.IngFecAdm AS FechaAdmision,
                i.IngFecEgr AS FechaEgreso,
                i.IngEntDx AS DiagnosticoEntrada,
                i.IngSalDx AS DiagnosticoSalida,
                i.IngHsp AS TipoHospitalizacion,
                i.IngFac AS NumeroFactura
            FROM INGRESOS i
            INNER JOIN CAPBAS c ON RTRIM(LTRIM(i.MPCedu)) = RTRIM(LTRIM(c.MPCedu)) 
                AND RTRIM(LTRIM(i.MPTDoc)) = RTRIM(LTRIM(c.MPTDoc))
            WHERE RTRIM(LTRIM(i.MPCedu)) = @p0
              AND RTRIM(LTRIM(i.MPTDoc)) = @p1
              AND i.IngCsc = @p2";

        var resultados = await EjecutarQueryAtencionesAsync(sql, cancellationToken, cedula, tipoDoc, consecutivo);

        return resultados.FirstOrDefault();
    }

    public async Task<IEnumerable<AtencionResponse>> GetAtencionesPorPacienteAsync(
        string numeroDocumento,
        string tipoDocumento,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Consultando ingresos para paciente {TipoDoc}-{NumDoc}", tipoDocumento, numeroDocumento);

        var sql = @"
            SELECT TOP 50
                i.MPCedu AS Cedula,
                i.MPTDoc AS TipoDocumento,
                i.IngCsc AS Consecutivo,
                c.MPNom1 AS PrimerNombre,
                c.MPNom2 AS SegundoNombre,
                c.MPApe1 AS PrimerApellido,
                c.MPApe2 AS SegundoApellido,
                c.MPFchN AS FechaNacimiento,
                c.MPSexo AS Sexo,
                i.ClaPro AS ClaseProcedimiento,
                i.IngFecAdm AS FechaAdmision,
                i.IngFecEgr AS FechaEgreso,
                i.IngEntDx AS DiagnosticoEntrada,
                i.IngSalDx AS DiagnosticoSalida,
                i.IngHsp AS TipoHospitalizacion,
                i.IngFac AS NumeroFactura
            FROM INGRESOS i
            INNER JOIN CAPBAS c ON RTRIM(LTRIM(i.MPCedu)) = RTRIM(LTRIM(c.MPCedu)) 
                AND RTRIM(LTRIM(i.MPTDoc)) = RTRIM(LTRIM(c.MPTDoc))
            WHERE RTRIM(LTRIM(i.MPCedu)) = @p0
              AND RTRIM(LTRIM(i.MPTDoc)) = @p1
            ORDER BY i.IngFecAdm DESC";

        var resultados = await EjecutarQueryAtencionesAsync(sql, cancellationToken, 
            numeroDocumento.Trim(), tipoDocumento.Trim());

        _logger.LogInformation("Se encontraron {Count} ingresos para el paciente {TipoDoc}-{NumDoc}", 
            resultados.Count, tipoDocumento, numeroDocumento);

        return resultados;
    }

    /// <summary>
    /// Ejecuta queries de atenciones usando ADO.NET puro para evitar problemas de conversión de tipos con EF Core
    /// </summary>
    private async Task<List<AtencionResponse>> EjecutarQueryAtencionesAsync(
        string sql, 
        CancellationToken cancellationToken,
        params object[] parametros)
    {
        var resultados = new List<AtencionResponse>();

        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            command.CommandType = CommandType.Text;

            // Agregar parámetros si existen
            for (int i = 0; i < parametros.Length; i++)
            {
                var param = new SqlParameter($"@p{i}", parametros[i] ?? DBNull.Value);
                command.Parameters.Add(param);
            }

            using var reader = await command.ExecuteReaderAsync(cancellationToken);

            while (await reader.ReadAsync(cancellationToken))
            {
                var dto = new AtencionDto
                {
                    Cedula = (reader["Cedula"] as string)?.Trim(),
                    TipoDocumento = (reader["TipoDocumento"] as string)?.Trim(),
                    Consecutivo = reader["Consecutivo"] is short s ? s : (short)0,
                    PrimerNombre = (reader["PrimerNombre"] as string)?.Trim(),
                    SegundoNombre = (reader["SegundoNombre"] as string)?.Trim(),
                    PrimerApellido = (reader["PrimerApellido"] as string)?.Trim(),
                    SegundoApellido = (reader["SegundoApellido"] as string)?.Trim(),
                    FechaNacimiento = reader["FechaNacimiento"] as DateTime?,
                    Sexo = (reader["Sexo"] as string)?.Trim(),
                    ClaseProcedimiento = (reader["ClaseProcedimiento"] as string)?.Trim(),
                    FechaAdmision = reader["FechaAdmision"] as DateTime?,
                    FechaEgreso = reader["FechaEgreso"] as DateTime?,
                    DiagnosticoEntrada = (reader["DiagnosticoEntrada"] as string)?.Trim(),
                    DiagnosticoSalida = (reader["DiagnosticoSalida"] as string)?.Trim(),
                    TipoHospitalizacion = (reader["TipoHospitalizacion"] as string)?.Trim(),
                    NumeroFactura = (reader["NumeroFactura"] as string)?.Trim()
                };

                resultados.Add(MapearAtencionResponse(dto));
            }
        }
        finally
        {
            await connection.CloseAsync();
        }

        return resultados;
    }

    private AtencionResponse MapearAtencionResponse(AtencionDto dto)
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

        return new AtencionResponse
        {
            Cedula = dto.Cedula ?? string.Empty,
            TipoDocumento = dto.TipoDocumento ?? string.Empty,
            Consecutivo = (int)dto.Consecutivo,
            Paciente = new PacienteBasicoResponse
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
                Sexo = string.IsNullOrEmpty(dto.Sexo) ? null : dto.Sexo
            },
            ClaseProcedimiento = string.IsNullOrEmpty(dto.ClaseProcedimiento) ? null : dto.ClaseProcedimiento,
            FechaAdmision = dto.FechaAdmision,
            FechaEgreso = dto.FechaEgreso,
            EstaActivo = !dto.FechaEgreso.HasValue,
            EstadoActual = !dto.FechaEgreso.HasValue ? "Activo" : "Egresado",
            DiagnosticoEntrada = string.IsNullOrEmpty(dto.DiagnosticoEntrada) ? null : dto.DiagnosticoEntrada,
            DiagnosticoSalida = string.IsNullOrEmpty(dto.DiagnosticoSalida) ? null : dto.DiagnosticoSalida,
            TipoHospitalizacion = string.IsNullOrEmpty(dto.TipoHospitalizacion) ? null : dto.TipoHospitalizacion,
            NumeroFactura = string.IsNullOrEmpty(dto.NumeroFactura) ? null : dto.NumeroFactura
        };
    }

    /// <summary>
    /// DTO interno para mapear resultados SQL Raw
    /// </summary>
    private class AtencionDto
    {
        public string? Cedula { get; set; }
        public string? TipoDocumento { get; set; }
        public short Consecutivo { get; set; }  // smallint en SQL Server
        public string? PrimerNombre { get; set; }
        public string? SegundoNombre { get; set; }
        public string? PrimerApellido { get; set; }
        public string? SegundoApellido { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public string? Sexo { get; set; }
        public string? ClaseProcedimiento { get; set; }
        public DateTime? FechaAdmision { get; set; }
        public DateTime? FechaEgreso { get; set; }
        public string? DiagnosticoEntrada { get; set; }
        public string? DiagnosticoSalida { get; set; }
        public string? TipoHospitalizacion { get; set; }
        public string? NumeroFactura { get; set; }
    }
}
