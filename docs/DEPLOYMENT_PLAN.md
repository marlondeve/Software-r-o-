# Plan de Deployment - Arquitectura Final

## 🎯 Objetivo

**Estado Actual (Desarrollo)**:
- ApiConsultas: `http://186.190.254.230:8080` (Público)
- ApiNegocio: `http://localhost:5042` (Local)

**Estado Objetivo (Producción)**:
- ApiNegocio: `http://186.190.254.230:8080` (Público - Puerto 8080)
- ApiConsultas: `http://localhost:5000` (Interno - Solo accesible desde el servidor)

---

## 📋 CAMBIOS NECESARIOS

### 1. BITAL.APICONSULTAS (Cambiar a comunicación interna)

#### 1.1 Cambiar el puerto y binding

**Archivo**: `backend/Bital.ApiConsultas/appsettings.Production.json`

```json
{
  "Kestrel": {
	"Endpoints": {
	  "Http": {
		"Url": "http://localhost:5000"
	  }
	}
  }
}
```

**Archivo**: `backend/Bital.ApiConsultas/Program.cs`

Asegurar que en producción escuche solo en localhost:

```csharp
if (builder.Environment.IsProduction())
{
	builder.WebHost.UseUrls("http://localhost:5000");
}
```

#### 1.2 Eliminar CORS público (Ya no lo necesita)

**Archivo**: `backend/Bital.ApiConsultas/Program.cs`

```csharp
// ANTES (Desarrollo)
app.UseCors("AllowFrontend");

// DESPUÉS (Producción) - Comentar o remover CORS
// Solo ApiNegocio consumirá esta API localmente, no necesita CORS
if (!app.Environment.IsProduction())
{
	app.UseCors("AllowFrontend");
}
```

#### 1.3 Agregar autenticación interna entre APIs

**Archivo**: `backend/Bital.ApiConsultas/appsettings.Production.json`

```json
{
  "ApiSecurity": {
	"InternalApiKey": "CAMBIAR_ESTE_TOKEN_EN_PRODUCCION_12345"
  }
}
```

**Archivo**: `backend/Bital.ApiConsultas/Middleware/InternalApiKeyMiddleware.cs` (NUEVO)

```csharp
namespace Bital.ApiConsultas.Middleware;

public class InternalApiKeyMiddleware
{
	private readonly RequestDelegate _next;
	private readonly string _apiKey;
	private readonly ILogger<InternalApiKeyMiddleware> _logger;

	public InternalApiKeyMiddleware(
		RequestDelegate next, 
		IConfiguration configuration,
		ILogger<InternalApiKeyMiddleware> logger)
	{
		_next = next;
		_apiKey = configuration["ApiSecurity:InternalApiKey"] 
			?? throw new InvalidOperationException("InternalApiKey no configurado");
		_logger = logger;
	}

	public async Task InvokeAsync(HttpContext context)
	{
		// Health check siempre permitido
		if (context.Request.Path.StartsWithSegments("/health"))
		{
			await _next(context);
			return;
		}

		// Verificar API Key en header
		if (!context.Request.Headers.TryGetValue("X-Internal-Api-Key", out var extractedApiKey))
		{
			_logger.LogWarning("Intento de acceso sin API Key desde {IP}", context.Connection.RemoteIpAddress);
			context.Response.StatusCode = 401;
			await context.Response.WriteAsJsonAsync(new { error = "API Key requerida" });
			return;
		}

		if (!string.Equals(extractedApiKey, _apiKey, StringComparison.Ordinal))
		{
			_logger.LogWarning("API Key inválida desde {IP}", context.Connection.RemoteIpAddress);
			context.Response.StatusCode = 403;
			await context.Response.WriteAsJsonAsync(new { error = "API Key inválida" });
			return;
		}

		await _next(context);
	}
}

public static class InternalApiKeyMiddlewareExtensions
{
	public static IApplicationBuilder UseInternalApiKey(this IApplicationBuilder builder)
	{
		return builder.UseMiddleware<InternalApiKeyMiddleware>();
	}
}
```

**Archivo**: `backend/Bital.ApiConsultas/Program.cs`

```csharp
// Agregar después de UseAuthentication (solo en producción)
if (app.Environment.IsProduction())
{
	app.UseInternalApiKey();
}
```

#### 1.4 Restringir acceso solo desde localhost

**Archivo**: `backend/Bital.ApiConsultas/Program.cs`

```csharp
// Middleware para validar que las peticiones vengan de localhost
if (app.Environment.IsProduction())
{
	app.Use(async (context, next) =>
	{
		var remoteIp = context.Connection.RemoteIpAddress;
		var isLocalhost = remoteIp?.ToString() == "::1" || 
						 remoteIp?.ToString() == "127.0.0.1" ||
						 IPAddress.IsLoopback(remoteIp);

		if (!isLocalhost && !context.Request.Path.StartsWithSegments("/health"))
		{
			context.Response.StatusCode = 403;
			await context.Response.WriteAsJsonAsync(new { error = "Acceso denegado" });
			return;
		}

		await next();
	});
}
```

---

### 2. BITAL.APINEGOCIO (API Pública)

#### 2.1 Cambiar URL de ApiConsultas a localhost

**Archivo**: `backend/Bital.ApiNegocio/appsettings.Production.json` (NUEVO)

```json
{
  "ConnectionStrings": {
	"BitalDatabase": "Data Source=SERVIDOR_PRODUCCION;Initial Catalog=BitalNegocio;User ID=bital_user;Password=PASSWORD_SEGURO;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "ApiConsultas": {
	"BaseUrl": "http://localhost:5000",
	"ApiKey": "CAMBIAR_ESTE_TOKEN_EN_PRODUCCION_12345"
  },
  "Jwt": {
	"Key": "CAMBIAR_ESTE_KEY_EN_PRODUCCION_MINIMO_32_CARACTERES",
	"Issuer": "Bital.ApiNegocio",
	"Audience": "Bital.Frontend",
	"ExpirationMinutes": 480
  },
  "AllowedOrigins": [
	"http://186.190.254.230",
	"http://localhost:3000"
  ],
  "Logging": {
	"LogLevel": {
	  "Default": "Information",
	  "Microsoft.AspNetCore": "Warning",
	  "Microsoft.EntityFrameworkCore": "Warning"
	}
  },
  "Serilog": {
	"WriteTo": [
	  {
		"Name": "File",
		"Args": {
		  "path": "/var/log/bital/apinegocio-.log",
		  "rollingInterval": "Day",
		  "retainedFileCountLimit": 30
		}
	  }
	]
  }
}
```

#### 2.2 Configurar HttpClient con API Key

**Archivo**: `backend/Bital.ApiNegocio/Program.cs`

```csharp
// ANTES
builder.Services.AddHttpClient("ApiConsultas", client =>
{
	var baseUrl = builder.Configuration["ApiConsultas:BaseUrl"] 
		?? throw new InvalidOperationException("ApiConsultas:BaseUrl no configurado");
	client.BaseAddress = new Uri(baseUrl);
	client.Timeout = TimeSpan.FromSeconds(30);
});

// DESPUÉS (con API Key)
builder.Services.AddHttpClient("ApiConsultas", client =>
{
	var baseUrl = builder.Configuration["ApiConsultas:BaseUrl"] 
		?? throw new InvalidOperationException("ApiConsultas:BaseUrl no configurado");
	client.BaseAddress = new Uri(baseUrl);
	client.Timeout = TimeSpan.FromSeconds(30);

	// Agregar API Key para comunicación interna
	var apiKey = builder.Configuration["ApiConsultas:ApiKey"];
	if (!string.IsNullOrEmpty(apiKey))
	{
		client.DefaultRequestHeaders.Add("X-Internal-Api-Key", apiKey);
	}
});
```

#### 2.3 Configurar puerto 8080 para producción

**Archivo**: `backend/Bital.ApiNegocio/appsettings.Production.json`

```json
{
  "Kestrel": {
	"Endpoints": {
	  "Http": {
		"Url": "http://0.0.0.0:8080"
	  }
	}
  }
}
```

#### 2.4 Activar autenticación JWT en producción

**Archivo**: `backend/Bital.ApiNegocio/Controllers/DietasCocinaController.cs`

```csharp
// Descomentar los atributos [Authorize] cuando se despliegue
[ApiController]
[Route("api/v{version:apiVersion}/dietas-cocina")]
[ApiVersion("1.0")]
[Authorize] // ← ACTIVAR EN PRODUCCIÓN
public class DietasCocinaController : ControllerBase
{
	// ...
}
```

---

### 3. CONFIGURACIÓN DEL SERVIDOR (Linux/Ubuntu)

#### 3.1 Systemd Services

**Archivo**: `/etc/systemd/system/bital-apiconsultas.service`

```ini
[Unit]
Description=Bital API Consultas (Interna)
After=network.target

[Service]
Type=notify
WorkingDirectory=/var/www/bital/apiconsultas
ExecStart=/usr/bin/dotnet /var/www/bital/apiconsultas/Bital.ApiConsultas.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=bital-apiconsultas
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

[Install]
WantedBy=multi-user.target
```

**Archivo**: `/etc/systemd/system/bital-apinegocio.service`

```ini
[Unit]
Description=Bital API Negocio (Pública)
After=network.target bital-apiconsultas.service
Requires=bital-apiconsultas.service

[Service]
Type=notify
WorkingDirectory=/var/www/bital/apinegocio
ExecStart=/usr/bin/dotnet /var/www/bital/apinegocio/Bital.ApiNegocio.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=bital-apinegocio
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

[Install]
WantedBy=multi-user.target
```

#### 3.2 Firewall (UFW)

```bash
# Solo ApiNegocio debe ser accesible desde internet
sudo ufw allow 8080/tcp comment 'Bital API Negocio'

# ApiConsultas NO debe ser accesible desde fuera
# (Solo escucha en localhost:5000, no necesita regla de firewall)
```

#### 3.3 Nginx Reverse Proxy (Opcional pero recomendado)

**Archivo**: `/etc/nginx/sites-available/bital`

```nginx
server {
	listen 80;
	server_name 186.190.254.230;

	# Redirigir HTTP a HTTPS (cuando tengas certificado)
	# return 301 https://$server_name$request_uri;

	location / {
		proxy_pass http://localhost:8080;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection keep-alive;
		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;

		# Timeouts
		proxy_connect_timeout 60s;
		proxy_send_timeout 60s;
		proxy_read_timeout 60s;
	}
}
```

---

### 4. SEGURIDAD ADICIONAL

#### 4.1 Secrets Management

**NO GUARDAR EN appsettings.Production.json**:
- Connection strings con passwords
- JWT Keys
- API Keys internas

**Usar variables de entorno o Azure Key Vault**:

```bash
# /etc/environment o en systemd service
export ConnectionStrings__BitalDatabase="Server=...;Password=..."
export ApiConsultas__ApiKey="token-seguro-generado"
export Jwt__Key="clave-jwt-segura-32-caracteres-minimo"
```

#### 4.2 Rate Limiting en ApiNegocio

**Archivo**: `backend/Bital.ApiNegocio/Bital.ApiNegocio.csproj`

```xml
<PackageReference Include="AspNetCoreRateLimit" Version="5.0.0" />
```

**Archivo**: `backend/Bital.ApiNegocio/Program.cs`

```csharp
// Rate limiting para proteger la API pública
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(options =>
{
	options.EnableEndpointRateLimiting = true;
	options.StackBlockedRequests = false;
	options.GeneralRules = new List<RateLimitRule>
	{
		new RateLimitRule
		{
			Endpoint = "*",
			Period = "1m",
			Limit = 60
		}
	};
});
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
builder.Services.AddInMemoryRateLimiting();

// ...

app.UseIpRateLimiting();
```

---

## 📝 CHECKLIST DE DEPLOYMENT

### Pre-deployment
- [ ] Generar API Key segura para comunicación interna
- [ ] Generar JWT Key segura (mínimo 32 caracteres)
- [ ] Crear usuario de base de datos en SQL Server con permisos mínimos
- [ ] Configurar connection string de producción
- [ ] Crear directorio de logs: `/var/log/bital/`
- [ ] Configurar variables de entorno en servidor

### ApiConsultas
- [ ] Cambiar puerto a localhost:5000 en appsettings.Production.json
- [ ] Agregar InternalApiKeyMiddleware
- [ ] Agregar validación de IP localhost
- [ ] Deshabilitar CORS en producción
- [ ] Publicar aplicación: `dotnet publish -c Release`
- [ ] Copiar archivos a `/var/www/bital/apiconsultas/`
- [ ] Configurar systemd service
- [ ] Probar: `curl http://localhost:5000/health` (debe funcionar)
- [ ] Probar: `curl http://186.190.254.230:5000/health` (debe fallar)

### ApiNegocio
- [ ] Cambiar BaseUrl de ApiConsultas a http://localhost:5000
- [ ] Agregar API Key en HttpClient
- [ ] Configurar puerto 8080 en appsettings.Production.json
- [ ] Activar atributos [Authorize] en controllers
- [ ] Configurar CORS con orígenes permitidos
- [ ] Agregar rate limiting
- [ ] Publicar aplicación: `dotnet publish -c Release`
- [ ] Copiar archivos a `/var/www/bital/apinegocio/`
- [ ] Ejecutar migraciones de BD: `dotnet ef database update`
- [ ] Ejecutar script de seed data
- [ ] Configurar systemd service
- [ ] Probar: `curl http://186.190.254.230:8080/health` (debe funcionar)

### Servidor
- [ ] Instalar .NET 8 Runtime
- [ ] Configurar SQL Server connection
- [ ] Configurar firewall (solo puerto 8080)
- [ ] Habilitar servicios systemd
- [ ] Configurar Nginx reverse proxy (opcional)
- [ ] Configurar logs rotation
- [ ] Configurar backup de BD

### Validación Final
- [ ] Health checks funcionando en ambas APIs
- [ ] ApiNegocio puede consumir ApiConsultas internamente
- [ ] ApiConsultas NO es accesible desde internet
- [ ] Frontend puede consumir ApiNegocio
- [ ] JWT authentication funciona
- [ ] Rate limiting funciona
- [ ] Logs se están escribiendo correctamente

---

## 🚀 COMANDOS DE DEPLOYMENT

```bash
# 1. Publicar ambas APIs
cd backend/Bital.ApiConsultas
dotnet publish -c Release -o ./publish

cd ../Bital.ApiNegocio
dotnet publish -c Release -o ./publish

# 2. Copiar al servidor
scp -r ./publish user@186.190.254.230:/var/www/bital/apiconsultas/
scp -r ./publish user@186.190.254.230:/var/www/bital/apinegocio/

# 3. En el servidor
sudo systemctl daemon-reload
sudo systemctl enable bital-apiconsultas
sudo systemctl enable bital-apinegocio
sudo systemctl start bital-apiconsultas
sudo systemctl start bital-apinegocio

# 4. Verificar logs
sudo journalctl -u bital-apiconsultas -f
sudo journalctl -u bital-apinegocio -f

# 5. Verificar estado
sudo systemctl status bital-apiconsultas
sudo systemctl status bital-apinegocio
```

---

## 🔒 RESUMEN DE SEGURIDAD

| Componente | Puerto | Acceso | Autenticación |
|------------|--------|--------|---------------|
| ApiConsultas | 5000 | Solo localhost | API Key interna |
| ApiNegocio | 8080 | Público | JWT + Rate Limiting |
| Base de datos | 1433 | Solo localhost | SQL Auth |

**Flujo de comunicación seguro**:
1. Frontend → ApiNegocio (JWT)
2. ApiNegocio → ApiConsultas (API Key interna)
3. ApiConsultas → Base de datos Vital (SQL)
4. ApiNegocio → Base de datos BitalNegocio (SQL)

---

## 📞 CONTACTO EN CASO DE PROBLEMAS

- Logs ApiConsultas: `/var/log/bital/apiconsultas-*.log`
- Logs ApiNegocio: `/var/log/bital/apinegocio-*.log`
- Logs Sistema: `sudo journalctl -u bital-*`
