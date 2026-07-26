using Asp.Versioning;
using Bital.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// 1. Configurar Serilog
// ============================================================================
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(
        path: builder.Environment.IsDevelopment()
            ? "logs/bital-api-negocio-.log"
            : builder.Configuration["Serilog:LogPath"] ?? "C:\\logs\\bital-api-negocio\\app-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 7)
    .CreateLogger();

builder.Host.UseSerilog();

try
{
    Log.Information("Iniciando Bital.ApiNegocio...");

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
        options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Version = "v1",
            Title = "Bital API Negocio",
            Description = "API de lógica de negocio para módulos Bital (Dietas-Cocina, Encuestas SIAO)",
            Contact = new Microsoft.OpenApi.Models.OpenApiContact
            {
                Name = "Equipo Bital - Clínica del Río",
                Email = "soporte.bital@clinicadelrio.com"
            }
        });

        // Incluir comentarios XML
        var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath))
        {
            options.IncludeXmlComments(xmlPath);
        }
    });

    // CORS
    var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                      ?? builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                      ?? new[] { "http://localhost:5173", "http://localhost:3000" };

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins(corsOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    // DbContext (EF Core)
    builder.Services.AddDbContext<Bital.Infrastructure.Data.BitalNegocioDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("BitalDatabase")));

    // Servicios de consulta internos del host único
    builder.Services.AddVitalDatabase(builder.Configuration);
    builder.Services.AddQueryServices();

    // Servicios de aplicación
    builder.Services.AddScoped<Bital.Application.Interfaces.IDietasService, Bital.Infrastructure.Services.DietasService>();
    builder.Services.AddScoped<Bital.Application.Interfaces.IOrdenesCocinaService, Bital.Infrastructure.OrdenesCocinaService>();
    builder.Services.AddScoped<Bital.Application.Interfaces.IEtiquetasService, Bital.Infrastructure.Services.EtiquetasService>();
    builder.Services.AddScoped<Bital.Application.Interfaces.IConciliacionService, Bital.Infrastructure.Services.ConciliacionService>();
    builder.Services.AddScoped<Bital.Application.Interfaces.IDashboardService, Bital.Infrastructure.Services.DashboardService>();
    builder.Services.AddScoped<Bital.Application.Interfaces.IParametrosService, Bital.Infrastructure.Services.ParametrosService>();
    builder.Services.AddScoped<Bital.Application.Interfaces.IAuditoriaService, Bital.Infrastructure.Services.AuditoriaService>();
    builder.Services.AddScoped<Bital.Application.Interfaces.IUsuariosPermisosService, Bital.Infrastructure.Services.UsuariosPermisosService>();
    builder.Services.AddScoped<Bital.Application.Interfaces.IAdministracionEncuestasService, Bital.Infrastructure.Services.AdministracionEncuestasService>();
    builder.Services.AddScoped<Bital.Application.Interfaces.IEncuestasBffService, Bital.Infrastructure.Services.EncuestasProxyService>();
    builder.Services.AddScoped<Bital.Application.Interfaces.ICuestionariosService, Bital.Infrastructure.Services.CuestionariosService>();

    // Health Checks
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<Bital.Infrastructure.Data.BitalNegocioDbContext>("database");

    // ============================================================================
    // 3. Configurar Pipeline
    // ============================================================================

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Bital.Infrastructure.Data.BitalNegocioDbContext>();
        db.Database.Migrate();
        await Bital.Infrastructure.Data.QuestionnaireSchemaInitializer.EnsureCreatedAsync(db);
    }

    // Swagger en todos los entornos (para desarrollo/staging)
    if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "Bital API Negocio v1");
            c.RoutePrefix = "swagger";
        });
    }

    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000}ms";
        options.GetLevel = (httpContext, elapsed, ex) => LogEventLevel.Information;
    });

    app.UseCors("AllowFrontend");

    // app.UseAuthentication(); // TODO: Habilitar cuando se implemente JWT
    // app.UseAuthorization();

    app.MapControllers();

    app.MapHealthChecks("/health");

    app.MapGet("/", () => new
    {
        Service = "Bital.ApiNegocio",
        Version = "1.0",
        Status = "Running",
        Environment = app.Environment.EnvironmentName,
        Timestamp = DateTime.UtcNow
    })
    .WithName("Root")
    .WithTags("Info");

    Log.Information("Bital.ApiNegocio iniciado correctamente en {Url}", 
        builder.Configuration["ASPNETCORE_URLS"] ?? "http://localhost:5042");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "La aplicación falló al iniciar");
}
finally
{
    Log.CloseAndFlush();
}
