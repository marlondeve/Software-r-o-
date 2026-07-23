using Serilog;
using Serilog.Events;

namespace Bital.ApiConsultas.Extensions;

public static class SerilogExtensions
{
    public static void ConfigureSerilog(this WebApplicationBuilder builder)
    {
        Log.Logger = new LoggerConfiguration()
            .ReadFrom.Configuration(builder.Configuration)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", "Bital.ApiConsultas")
            .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
            .CreateLogger();

        builder.Host.UseSerilog();

        Log.Information("Serilog configurado para {Application} en ambiente {Environment}",
            "Bital.ApiConsultas",
            builder.Environment.EnvironmentName);
    }

    public static void UseSerilogRequestLogging(this WebApplication app)
    {
        app.UseSerilogRequestLogging(options =>
        {
            options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} respondió {StatusCode} en {Elapsed:0.0000} ms";
            options.GetLevel = (httpContext, elapsed, ex) => ex != null
                ? LogEventLevel.Error
                : httpContext.Response.StatusCode > 499
                    ? LogEventLevel.Error
                    : LogEventLevel.Information;

            options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
            {
                diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
                diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
                diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].ToString());
                diagnosticContext.Set("RemoteIP", httpContext.Connection.RemoteIpAddress?.ToString());
            };
        });
    }
}
