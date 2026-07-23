using Asp.Versioning;
using Bital.ApiConsultas.Extensions;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// 1. Configurar Serilog
// ============================================================================
builder.ConfigureSerilog();

try
{
    Log.Information("Iniciando Bital.ApiConsultas...");

    // ============================================================================
    // 2. Configurar Servicios
    // ============================================================================

    // API Versioning
    builder.Services.AddApiVersioning(options =>
    {
        options.DefaultApiVersion = new ApiVersion(1, 0);
        options.AssumeDefaultVersionWhenUnspecified = true;
        options.ReportApiVersions = true;
        options.ApiVersionReader = ApiVersionReader.Combine(
            new UrlSegmentApiVersionReader(),
            new HeaderApiVersionReader("X-Api-Version")
        );
    })
    .AddApiExplorer(options =>
    {
        options.GroupNameFormat = "'v'VVV";
        options.SubstituteApiVersionInUrl = true;
    });

    // Controllers
    builder.Services.AddControllers();

    // Swagger/OpenAPI
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        var apiOptions = builder.Configuration.GetSection("ApiOptions");
        options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Version = "v1",
            Title = apiOptions["Name"] ?? "Bital API Consultas",
            Description = apiOptions["Description"] ?? "API Bridge read-only para consultas al HIS Vital",
            Contact = new Microsoft.OpenApi.Models.OpenApiContact
            {
                Name = apiOptions["ContactName"],
                Email = apiOptions["ContactEmail"]
            }
        });

        // Incluir XML comments para documentación
        var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath))
        {
            options.IncludeXmlComments(xmlPath);
        }
    });

    // CORS
    var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins(corsOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .WithExposedHeaders("X-Correlation-Id", "X-Api-Version");
        });
    });

    // Database & Services
    builder.Services.AddVitalDatabase(builder.Configuration);
    builder.Services.AddQueryServices();

    // Health Checks
    builder.Services.AddBitalHealthChecks(builder.Configuration);

    // ============================================================================
    // 3. Construir la aplicación
    // ============================================================================
    var app = builder.Build();

    // ============================================================================
    // 4. Configurar Pipeline HTTP
    // ============================================================================

    // Logging de requests HTTP
    app.UseSerilogRequestLogging();

    // Swagger (solo en Development)
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "Bital API Consultas v1");
            options.RoutePrefix = "swagger";
        });
        Log.Information("Swagger habilitado en: {SwaggerUrl}", "https://localhost:5003/swagger");
    }

    // HTTPS Redirection
    app.UseHttpsRedirection();

    // CORS
    app.UseCors("AllowFrontend");

    // Authorization (preparado para futuro)
    // app.UseAuthorization();

    // Controllers
    app.MapControllers();

    // Health Checks
    app.MapHealthChecks("/health");

    // Endpoint raíz
    app.MapGet("/", () => new
    {
        service = "Bital API Consultas",
        version = "v1",
        status = "running",
        timestamp = DateTime.UtcNow,
        documentation = "/swagger"
    })
    .WithTags("Info")
    .Produces<object>();

    Log.Information("Bital.ApiConsultas iniciado correctamente en {Environment}", app.Environment.EnvironmentName);

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "La aplicación falló al iniciar");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
