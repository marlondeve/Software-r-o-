using System.Reflection;
using System.Text;
using Asp.Versioning;
using Bital.ApiNegocio.Extensions;
using Bital.Application.Interfaces;
using Bital.Application.Options;
using Bital.Infrastructure.Extensions;
using Bital.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

// Asegurar carpeta de logs en producción (permisos IIS en C:\logs)
const string preferredProdLogDir = @"C:\logs\bital-api-negocio";
if (!builder.Environment.IsDevelopment())
{
    try { Directory.CreateDirectory(preferredProdLogDir); }
    catch { /* fallback a logs/ en la carpeta de la app */ }
}

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
            : Directory.Exists(preferredProdLogDir)
                ? Path.Combine(preferredProdLogDir, "app-.log")
                : "logs/bital-api-negocio-.log",
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
            Title = "RioSoft API",
            Description = "API de lógica de negocio para RioSoft (Dietas-Cocina, Encuestas SIAO)",
            Contact = new Microsoft.OpenApi.Models.OpenApiContact
            {
                Name = "Equipo RioSoft - Clínica del Río",
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

    // JWT
    builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
    var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
                     ?? new JwtOptions();
    if (string.IsNullOrWhiteSpace(jwtOptions.Key) || jwtOptions.Key.Length < 32)
    {
        throw new InvalidOperationException(
            "Configure Jwt:Key con al menos 32 caracteres en appsettings o la variable Jwt__Key.");
    }

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidAudience = jwtOptions.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
                ClockSkew = TimeSpan.FromMinutes(1),
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    if (context.Request.Cookies.TryGetValue(jwtOptions.CookieName, out var token))
                    {
                        context.Token = token;
                    }

                    return Task.CompletedTask;
                },
            };
        });

    builder.Services.AddAuthorization();

    builder.Services.AddBitalSecurity();

    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<IAuditoriaContextoRequest, Bital.Infrastructure.DietasCocina.AuditoriaContextoRequest>();

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
    builder.Services.AddScoped<Bital.Application.Interfaces.IPermisosOperativosService, Bital.Infrastructure.Services.PermisosOperativosService>();
    builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
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

    var applyMigrations = app.Environment.IsDevelopment()
        || builder.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup");

    if (applyMigrations)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Bital.Infrastructure.Data.BitalNegocioDbContext>();
        try
        {
            var pendientes = (await db.Database.GetPendingMigrationsAsync()).ToList();
            if (pendientes.Count > 0)
            {
                Log.Information("Aplicando {Count} migraciones EF pendientes: {Migraciones}",
                    pendientes.Count, string.Join(", ", pendientes));
                await db.Database.MigrateAsync();
                Log.Information("Migraciones EF aplicadas.");
            }
            else
            {
                Log.Information("No hay migraciones EF pendientes.");
            }
        }
        catch (Exception ex)
        {
            Log.Fatal(ex,
                "Fallo al aplicar migraciones EF. Ejecute backend\\scripts\\Migrate-BitalNegocio.ps1 " +
                "o backend\\scripts\\04-TiempoComidaTarifaHistorico.sql en el servidor SQL.");
            throw;
        }

        if (app.Environment.IsDevelopment())
        {
            await Bital.Infrastructure.Data.QuestionnaireSchemaInitializer.EnsureCreatedAsync(db);
        }
    }

    try
    {
        if (builder.Configuration.GetValue<bool>("CatalogoDietas:SeedFcrIfEmpty"))
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<Bital.Infrastructure.Data.BitalNegocioDbContext>();
            if (await Bital.Infrastructure.DietasCocina.CatalogoDietasFcrSeed.EnsureFcrSeededAsync(db))
            {
                Log.Information("Catálogo FCR insertado (BD vacía, primer despliegue).");
            }
        }
        else if (builder.Configuration.GetValue<bool>("CatalogoDietas:ReseedFcrTarifasOnStartup"))
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<Bital.Infrastructure.Data.BitalNegocioDbContext>();
            Log.Warning("Reseed FCR forzado: se eliminará el catálogo existente.");
            await Bital.Infrastructure.DietasCocina.CatalogoDietasFcrSeed.ReseedAsync(db);
            Log.Information("Reseed catálogo FCR completado.");
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Error al sembrar catálogo FCR al iniciar. Revise esquema BD y migraciones.");
    }

    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Bital.Infrastructure.Data.BitalNegocioDbContext>();
        await Bital.Infrastructure.DietasCocina.RolModuloDefaultsSeed.EnsureDefaultRolesAsync(db);
        Log.Information("Roles por defecto del módulo dietas verificados.");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Error al verificar roles por defecto del módulo dietas.");
    }

    // Swagger en todos los entornos (para desarrollo/staging)
    if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "RioSoft API v1");
            c.RoutePrefix = "swagger";
        });
    }

    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000}ms";
        options.GetLevel = (httpContext, elapsed, ex) => LogEventLevel.Information;
    });

    app.UseBitalSecurity(app.Environment);

    app.UseCors("AllowFrontend");

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    app.MapHealthChecks("/health");

    var productVersion = Assembly.GetExecutingAssembly()
        .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
        ?? Assembly.GetExecutingAssembly().GetName().Version?.ToString(3)
        ?? "1.2.4";

    app.MapGet("/", () => new
    {
        Service = "RioSoft.ApiNegocio",
        Product = "RioSoft",
        Version = productVersion,
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
