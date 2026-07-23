using Asp.Versioning;
using Bital.ApiConsultas.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bital.ApiConsultas.Controllers;

/// <summary>
/// Controller para diagnóstico y pruebas de conectividad
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Produces("application/json")]
public class DiagnosticoController : ControllerBase
{
    private readonly VitalDbContext _context;
    private readonly ILogger<DiagnosticoController> _logger;
    private readonly IConfiguration _configuration;

    public DiagnosticoController(
        VitalDbContext context,
        ILogger<DiagnosticoController> logger,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Prueba de conectividad a la base de datos Vital
    /// </summary>
    /// <returns>Estado de la conexión</returns>
    [HttpGet("test-conexion")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<object>> TestConexion()
    {
        try
        {
            _logger.LogInformation("Probando conexión a base de datos Vital...");

            var startTime = DateTime.UtcNow;

            // Intentar abrir conexión y ejecutar query simple
            var canConnect = await _context.Database.CanConnectAsync();

            if (!canConnect)
            {
                _logger.LogError("No se pudo conectar a la base de datos");
                return StatusCode(500, new
                {
                    exito = false,
                    mensaje = "No se pudo conectar a la base de datos",
                    timestamp = DateTime.UtcNow
                });
            }

            // Ejecutar query simple para verificar
            var resultado = await _context.Database.ExecuteSqlRawAsync("SELECT 1");

            var elapsed = DateTime.UtcNow - startTime;

            _logger.LogInformation("Conexión exitosa a base de datos Vital en {ElapsedMs}ms", elapsed.TotalMilliseconds);

            return Ok(new
            {
                exito = true,
                mensaje = "Conexión exitosa a la base de datos Vital",
                servidor = GetServerFromConnectionString(),
                baseDatos = _context.Database.GetDbConnection().Database,
                tiempoRespuesta = $"{elapsed.TotalMilliseconds:F2} ms",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al probar conexión a base de datos");
            return StatusCode(500, new
            {
                exito = false,
                mensaje = "Error al conectar a la base de datos",
                error = ex.Message,
                tipoError = ex.GetType().Name,
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Lista las tablas disponibles en la base de datos
    /// </summary>
    [HttpGet("listar-tablas")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<object>> ListarTablas()
    {
        try
        {
            _logger.LogInformation("Consultando tablas en base de datos Vital...");

            var query = @"
                SELECT 
                    TABLE_SCHEMA as Esquema,
                    TABLE_NAME as NombreTabla,
                    TABLE_TYPE as TipoTabla
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_SCHEMA, TABLE_NAME";

            var connection = _context.Database.GetDbConnection();
            await connection.OpenAsync();

            var command = connection.CreateCommand();
            command.CommandText = query;

            var tablas = new List<object>();

            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    tablas.Add(new
                    {
                        esquema = reader.GetString(0),
                        tabla = reader.GetString(1),
                        tipo = reader.GetString(2)
                    });
                }
            }

            await connection.CloseAsync();

            _logger.LogInformation("Se encontraron {Count} tablas", tablas.Count);

            return Ok(new
            {
                exito = true,
                totalTablas = tablas.Count,
                tablas = tablas,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al listar tablas");
            return StatusCode(500, new
            {
                exito = false,
                mensaje = "Error al listar tablas",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Muestra información de configuración (sin datos sensibles)
    /// </summary>
    [HttpGet("info")]
    public ActionResult<object> GetInfo()
    {
        return Ok(new
        {
            ambiente = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
            servidor = GetServerFromConnectionString(),
            baseDatos = "Hosvital_Pruebas",
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Muestra la estructura de una tabla (columnas, tipos, nullable)
    /// </summary>
    [HttpGet("estructura-tabla/{nombreTabla}")]
    public async Task<ActionResult<object>> EstructuraTabla(string nombreTabla)
    {
        try
        {
            var query = $@"
                SELECT 
                    COLUMN_NAME as NombreColumna,
                    DATA_TYPE as TipoDato,
                    CHARACTER_MAXIMUM_LENGTH as Longitud,
                    IS_NULLABLE as Nullable,
                    COLUMN_DEFAULT as ValorPorDefecto
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = '{nombreTabla.Replace("'", "''")}'
                ORDER BY ORDINAL_POSITION";

            var connection = _context.Database.GetDbConnection();
            await connection.OpenAsync();

            var command = connection.CreateCommand();
            command.CommandText = query;

            var columnas = new List<object>();

            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    columnas.Add(new
                    {
                        nombreColumna = reader.GetString(0),
                        tipoDato = reader.GetString(1),
                        longitud = reader.IsDBNull(2) ? (int?)null : reader.GetInt32(2),
                        nullable = reader.GetString(3),
                        valorPorDefecto = reader.IsDBNull(4) ? null : reader.GetString(4)
                    });
                }
            }

            await connection.CloseAsync();

            return Ok(new
            {
                exito = true,
                tabla = nombreTabla,
                totalColumnas = columnas.Count,
                columnas = columnas,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al consultar estructura de tabla {Tabla}", nombreTabla);
            return StatusCode(500, new
            {
                exito = false,
                mensaje = $"Error al consultar estructura de tabla {nombreTabla}",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Muestra registros de ejemplo de una tabla (máximo 5)
    /// </summary>
    [HttpGet("muestra-datos/{nombreTabla}")]
    public async Task<ActionResult<object>> MuestraDatos(string nombreTabla)
    {
        try
        {
            var query = $"SELECT TOP 5 * FROM {nombreTabla.Replace("'", "''")}";

            var connection = _context.Database.GetDbConnection();
            await connection.OpenAsync();

            var command = connection.CreateCommand();
            command.CommandText = query;

            var registros = new List<Dictionary<string, object>>();

            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    var registro = new Dictionary<string, object>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        registro[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                    }
                    registros.Add(registro);
                }
            }

            await connection.CloseAsync();

            return Ok(new
            {
                exito = true,
                tabla = nombreTabla,
                totalRegistros = registros.Count,
                registros = registros,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al consultar datos de tabla {Tabla}", nombreTabla);
            return StatusCode(500, new
            {
                exito = false,
                mensaje = $"Error al consultar datos de tabla {nombreTabla}",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }

    private string GetServerFromConnectionString()
    {
        var connectionString = _configuration.GetConnectionString("VitalDatabase");
        if (string.IsNullOrEmpty(connectionString))
            return "No configurado";

        var serverPart = connectionString.Split(';')
            .FirstOrDefault(s => s.TrimStart().StartsWith("Server=", StringComparison.OrdinalIgnoreCase)
                              || s.TrimStart().StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase));

        if (serverPart == null)
            return "Desconocido";

        return serverPart.Split('=')[1].Trim();
    }
}
