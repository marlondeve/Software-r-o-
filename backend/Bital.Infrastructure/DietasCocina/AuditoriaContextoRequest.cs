using System.Text.Json;
using System.Text.RegularExpressions;
using Bital.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Bital.Infrastructure.DietasCocina;

public class AuditoriaContextoRequest : IAuditoriaContextoRequest
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditoriaContextoRequest(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? ObtenerDireccionIp()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null) return null;

        var forwarded = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            var primera = forwarded.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(primera)) return primera;
        }

        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(realIp)) return realIp.Trim();

        return context.Connection.RemoteIpAddress?.ToString();
    }

    public string? ObtenerUserAgent()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null) return null;

        var userAgent = context.Request.Headers.UserAgent.ToString();
        return string.IsNullOrWhiteSpace(userAgent) ? null : userAgent;
    }

    public string? ConstruirMetadataCliente()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null) return null;

        var userAgent = ObtenerUserAgent();
        var plataforma = context.Request.Headers["X-Client-Platform"].FirstOrDefault();

        var metadata = new Dictionary<string, string?>();
        if (!string.IsNullOrWhiteSpace(userAgent))
            metadata["userAgent"] = userAgent;
        metadata["dispositivo"] = DescribirDispositivo(userAgent);
        metadata["sistema"] = string.IsNullOrWhiteSpace(plataforma) ? "Bital Web" : $"Bital {plataforma.Trim()}";

        return JsonSerializer.Serialize(metadata);
    }

    internal static string DescribirDispositivo(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent)) return "Desconocido";

        var navegador = "Navegador";
        if (userAgent.Contains("Edg/", StringComparison.OrdinalIgnoreCase)) navegador = "Edge";
        else if (userAgent.Contains("Chrome/", StringComparison.OrdinalIgnoreCase)) navegador = "Chrome";
        else if (userAgent.Contains("Firefox/", StringComparison.OrdinalIgnoreCase)) navegador = "Firefox";
        else if (userAgent.Contains("Safari/", StringComparison.OrdinalIgnoreCase)
                 && !userAgent.Contains("Chrome/", StringComparison.OrdinalIgnoreCase)) navegador = "Safari";

        var sistema = "Desconocido";
        if (userAgent.Contains("Windows", StringComparison.OrdinalIgnoreCase)) sistema = "Windows";
        else if (userAgent.Contains("Mac OS", StringComparison.OrdinalIgnoreCase)) sistema = "macOS";
        else if (userAgent.Contains("Android", StringComparison.OrdinalIgnoreCase)) sistema = "Android";
        else if (Regex.IsMatch(userAgent, @"iPhone|iPad|iPod", RegexOptions.IgnoreCase)) sistema = "iOS";
        else if (userAgent.Contains("Linux", StringComparison.OrdinalIgnoreCase)) sistema = "Linux";

        return $"{navegador} · {sistema}";
    }
}
