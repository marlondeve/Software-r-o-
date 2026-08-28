using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Bital.ApiNegocio.Hubs;

[Authorize]
public class DietasCocinaHub : Hub
{
    public const string Path = "/hubs/dietas-cocina";
    public const string GrupoOperativo = "dietas-cocina";

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GrupoOperativo);
        await base.OnConnectedAsync();
    }

    public async Task UnirseAComida(string comida, string fecha)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GrupoOperativo);
        if (!string.IsNullOrWhiteSpace(comida))
            await Groups.AddToGroupAsync(Context.ConnectionId, $"comida:{comida}");
        if (!string.IsNullOrWhiteSpace(fecha))
            await Groups.AddToGroupAsync(Context.ConnectionId, $"fecha:{fecha}");
    }
}
