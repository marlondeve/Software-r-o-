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
        var cookieOptions = BuildCookieOptions(options, environment);
        cookieOptions.MaxAge = TimeSpan.FromMinutes(options.ExpirationMinutes);

        response.Cookies.Append(options.CookieName, token, cookieOptions);
    }

    public static void DeleteAuthCookie(
        this HttpResponse response,
        JwtOptions options,
        IWebHostEnvironment environment)
    {
        response.Cookies.Delete(options.CookieName, BuildCookieOptions(options, environment));
    }

    private static CookieOptions BuildCookieOptions(JwtOptions options, IWebHostEnvironment environment)
    {
        var crossOrigin = options.CrossOriginCookies;

        return new CookieOptions
        {
            HttpOnly = true,
            Secure = crossOrigin || !environment.IsDevelopment(),
            SameSite = crossOrigin
                ? SameSiteMode.None
                : environment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.Strict,
            Path = "/",
        };
    }
}
