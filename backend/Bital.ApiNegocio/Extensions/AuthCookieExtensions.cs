using Bital.Application.Options;

namespace Bital.ApiNegocio.Extensions;

public static class AuthCookieExtensions
{
    public static void AppendAuthCookie(
        this HttpResponse response,
        string token,
        JwtOptions options,
        IWebHostEnvironment environment)
    {
        var cookieOptions = BuildCookieOptions(options, environment, response.HttpContext.Request.IsHttps);
        cookieOptions.MaxAge = TimeSpan.FromMinutes(options.ExpirationMinutes);

        response.Cookies.Append(options.CookieName, token, cookieOptions);
    }

    public static void DeleteAuthCookie(
        this HttpResponse response,
        JwtOptions options,
        IWebHostEnvironment environment)
    {
        response.Cookies.Delete(
            options.CookieName,
            BuildCookieOptions(options, environment, response.HttpContext.Request.IsHttps));
    }

    private static CookieOptions BuildCookieOptions(
        JwtOptions options,
        IWebHostEnvironment environment,
        bool isHttps)
    {
        var crossOrigin = options.CrossOriginCookies;
        // En producción (proxy IIS same-origin) la cookie debe ser Secure aunque Kestrel escuche HTTP en localhost.
        var secure = crossOrigin || environment.IsProduction() || isHttps;

        return new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = crossOrigin
                ? SameSiteMode.None
                : environment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.Strict,
            Path = "/",
        };
    }
}
