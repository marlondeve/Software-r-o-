using Bital.Shared.Contracts.Responses;
using Bital.Shared.Contracts.Services;
using Bital.Infrastructure.DietasCocina;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.Data.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Data;

namespace Bital.Infrastructure.Services;

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

    public async Task<IEnumerable<EncuestaCapturaPresencialResponse>> GetCapturaPresencialAsync(
        string? servicio = null,
        string? pabellon = null,
        string? estado = null,
        string? busqueda = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Consultando captura presencial para encuestas");

        var sql = @"
            WITH Base AS (
                SELECT 
                    i.IngCsc AS IdIngreso,
                    RTRIM(LTRIM(i.MPTDoc)) AS TipoDocumento,
                    RTRIM(LTRIM(i.MPCedu)) AS Cedula,
                    RTRIM(LTRIM(ISNULL(cap.MPNom1, ''))) + ' ' + 
                    RTRIM(LTRIM(ISNULL(cap.MPNom2, ''))) + ' ' + 
                    RTRIM(LTRIM(ISNULL(cap.MPApe1, ''))) + ' ' + 
                    RTRIM(LTRIM(ISNULL(cap.MPApe2, ''))) AS NombreCompleto,
                    RTRIM(LTRIM(ISNULL(i.ClaPro, ''))) AS Servicio,
                    RTRIM(LTRIM(ISNULL(i.MPCodP, ''))) AS CodigoPabellon,
                    RTRIM(LTRIM(ISNULL(map.MPNomP, ''))) AS Pabellon,
                    RTRIM(LTRIM(ISNULL(i.MPNumC, ''))) AS Cama,
                    CASE 
                        WHEN i.IngFecEgr IS NULL THEN 'Activo'
                        ELSE 'Egresado'
                    END AS EstadoPaciente,
                    i.IngFecAdm AS FechaIngreso,
                    RTRIM(LTRIM(ISNULL(cap.MPTele, ''))) AS Telefono,
                    RTRIM(LTRIM(ISNULL(i.IngHsp, ''))) AS TipoHospitalizacion,
                    RTRIM(LTRIM(ISNULL(memp.MENOMB, ''))) AS Empresa,
                    ROW_NUMBER() OVER (
                        PARTITION BY i.IngCsc, RTRIM(LTRIM(i.MPCedu)), RTRIM(LTRIM(i.MPTDoc))
                        ORDER BY i.IngFecAdm DESC, i.IngCsc DESC
                    ) AS rn
                FROM INGRESOS i
                INNER JOIN CAPBAS cap ON RTRIM(LTRIM(cap.MPCedu)) = RTRIM(LTRIM(i.MPCedu))
                    AND RTRIM(LTRIM(cap.MPTDoc)) = RTRIM(LTRIM(i.MPTDoc))
                INNER JOIN MAEPAB map ON map.MPCodP = i.MPCodP
                INNER JOIN MAEPAC mac ON mac.MPCedu = cap.MPCedu
                INNER JOIN MAEEMP memp ON memp.MENNIT = mac.MENNIT
            )
            SELECT *
            FROM Base
            WHERE rn = 1";

        var filtros = new List<string>();
        var parametros = new List<object>();

        if (!string.IsNullOrWhiteSpace(servicio))
        {
            filtros.Add("RTRIM(LTRIM(ISNULL(i.IngSerCod, ''))) = @p" + parametros.Count);
            parametros.Add(servicio.Trim());
        }

        if (!string.IsNullOrWhiteSpace(pabellon))
        {
            filtros.Add("RTRIM(LTRIM(ISNULL(Pabellon, ''))) = @p" + parametros.Count);
            parametros.Add(pabellon.Trim());
        }

        if (!string.IsNullOrWhiteSpace(estado))
        {
            filtros.Add("RTRIM(LTRIM(ISNULL(EstadoPaciente, ''))) = @p" + parametros.Count);
            parametros.Add(estado.Trim());
        }

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            filtros.Add("(NombreCompleto LIKE '%' + @p" + parametros.Count + " + '%' OR Cedula LIKE '%' + @p" + parametros.Count + " + '%')");
            parametros.Add(busqueda.Trim());
        }

        if (filtros.Count > 0)
        {
            sql += " AND " + string.Join(" AND ", filtros);
        }

        sql += " ORDER BY Pabellon, Cama, NombreCompleto";

        var resultados = new List<EncuestaCapturaPresencialResponse>();

        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            command.CommandType = CommandType.Text;

            for (int i = 0; i < parametros.Count; i++)
            {
                var param = command.CreateParameter();
                param.ParameterName = $"@p{i}";
                param.Value = parametros[i] ?? DBNull.Value;
                command.Parameters.Add(param);
            }

            using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                resultados.Add(new EncuestaCapturaPresencialResponse
                {
                    IdIngreso = Convert.ToInt32(reader["IdIngreso"]),
                    TipoDocumento = reader.IsDBNull(reader.GetOrdinal("TipoDocumento")) ? string.Empty : reader.GetString(reader.GetOrdinal("TipoDocumento")).Trim(),
                    Cedula = reader.IsDBNull(reader.GetOrdinal("Cedula")) ? string.Empty : reader.GetString(reader.GetOrdinal("Cedula")).Trim(),
                    NombreCompleto = reader.IsDBNull(reader.GetOrdinal("NombreCompleto")) ? string.Empty : reader.GetString(reader.GetOrdinal("NombreCompleto")).Trim(),
                    Empresa = reader.IsDBNull(reader.GetOrdinal("Empresa")) ? null : reader.GetString(reader.GetOrdinal("Empresa")).Trim(),
                    Servicio = DietasReglasNegocio.ResolverServicioClinico(
                        reader.IsDBNull(reader.GetOrdinal("Servicio"))
                            ? null
                            : reader.GetString(reader.GetOrdinal("Servicio")).Trim(),
                        reader.IsDBNull(reader.GetOrdinal("Pabellon"))
                            ? string.Empty
                            : reader.GetString(reader.GetOrdinal("Pabellon")).Trim()),
                    CodigoPabellon = reader.IsDBNull(reader.GetOrdinal("CodigoPabellon")) ? null : reader.GetString(reader.GetOrdinal("CodigoPabellon")).Trim(),
                    Pabellon = reader.IsDBNull(reader.GetOrdinal("Pabellon")) ? string.Empty : reader.GetString(reader.GetOrdinal("Pabellon")).Trim(),
                    Cama = reader.IsDBNull(reader.GetOrdinal("Cama")) ? string.Empty : reader.GetString(reader.GetOrdinal("Cama")).Trim(),
                    EstadoPaciente = reader.IsDBNull(reader.GetOrdinal("EstadoPaciente")) ? string.Empty : reader.GetString(reader.GetOrdinal("EstadoPaciente")).Trim(),
                    FechaIngreso = reader.IsDBNull(reader.GetOrdinal("FechaIngreso")) ? null : reader.GetDateTime(reader.GetOrdinal("FechaIngreso")),
                    Telefono = reader.IsDBNull(reader.GetOrdinal("Telefono")) ? null : reader.GetString(reader.GetOrdinal("Telefono")).Trim(),
                    TipoHospitalizacion = reader.IsDBNull(reader.GetOrdinal("TipoHospitalizacion")) ? null : reader.GetString(reader.GetOrdinal("TipoHospitalizacion")).Trim()
                });
            }
        }
        finally
        {
            await connection.CloseAsync();
        }

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
        int consecutivo,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Consultando ingreso con consecutivo {Consecutivo}", consecutivo);

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
            WHERE i.IngCsc = @p0";

        var resultados = await EjecutarQueryAtencionesAsync(sql, cancellationToken, (short)consecutivo);

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

    public async Task<IEnumerable<AtencionHospitalariaResponse>> GetAtencionesHospitalariasAsync(
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Consultando atenciones hospitalarias activas para módulo de Dietas");

        var sql = @"
            SELECT  
                i.IngCsc AS IdIngreso,
                i.MPTDoc AS TipoDocumento, 
                i.MPcedu AS Cedula, 
                CONCAT_WS(' ', RTRIM(LTRIM(cap.MPNom1)), RTRIM(LTRIM(cap.MPNom2)), RTRIM(LTRIM(cap.MPApe1)), RTRIM(LTRIM(cap.MPApe2))) AS NombreCompleto, 
                map.MPNomP AS Pabellon,
                i.MPNumC AS Cama
            FROM INGRESOS i 
            INNER JOIN CAPBAS cap ON RTRIM(LTRIM(cap.MPCedu)) = RTRIM(LTRIM(i.MPcedu))
                AND RTRIM(LTRIM(cap.MPTDoc)) = RTRIM(LTRIM(i.MPTDoc))
            INNER JOIN MAEPAB map ON map.MPCodP = i.MPCodP
            WHERE i.IngFecEgr IS NULL 
              AND (i.IngEstSld = 0 OR i.IngEstSld IS NULL)      
              AND (i.INGATNACT = '2')
            ORDER BY map.MPNomP, i.MPNumC";

        var resultados = await EjecutarQueryHospitalariasAsync(sql, cancellationToken);

        _logger.LogInformation("Se encontraron {Count} atenciones hospitalarias activas", resultados.Count);

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

    /// <summary>
    /// Ejecuta queries de atenciones hospitalarias usando ADO.NET puro
    /// </summary>
    private async Task<List<AtencionHospitalariaResponse>> EjecutarQueryHospitalariasAsync(
        string sql,
        CancellationToken cancellationToken,
        params object[] parameters)
    {
        var resultados = new List<AtencionHospitalariaResponse>();

        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            command.CommandType = CommandType.Text;

            // Agregar parámetros si existen
            for (int i = 0; i < parameters.Length; i++)
            {
                var param = command.CreateParameter();
                param.ParameterName = $"@p{i}";
                param.Value = parameters[i] ?? DBNull.Value;
                command.Parameters.Add(param);
            }

            using var reader = await command.ExecuteReaderAsync(cancellationToken);

            while (await reader.ReadAsync(cancellationToken))
            {
                var atencion = new AtencionHospitalariaResponse
                {
                    IdIngreso = reader.GetInt16(reader.GetOrdinal("IdIngreso")),
                    TipoDocumento = reader.IsDBNull(reader.GetOrdinal("TipoDocumento")) 
                        ? string.Empty 
                        : reader.GetString(reader.GetOrdinal("TipoDocumento")).Trim(),
                    Cedula = reader.IsDBNull(reader.GetOrdinal("Cedula")) 
                        ? string.Empty 
                        : reader.GetString(reader.GetOrdinal("Cedula")).Trim(),
                    NombreCompleto = reader.IsDBNull(reader.GetOrdinal("NombreCompleto")) 
                        ? string.Empty 
                        : reader.GetString(reader.GetOrdinal("NombreCompleto")).Trim(),
                    Pabellon = reader.IsDBNull(reader.GetOrdinal("Pabellon")) 
                        ? string.Empty 
                        : reader.GetString(reader.GetOrdinal("Pabellon")).Trim(),
                    Cama = reader.IsDBNull(reader.GetOrdinal("Cama")) 
                        ? string.Empty 
                        : reader.GetString(reader.GetOrdinal("Cama")).Trim()
                };

                resultados.Add(atencion);
            }
        }
        finally
        {
            await connection.CloseAsync();
        }

        return resultados;
    }
}
