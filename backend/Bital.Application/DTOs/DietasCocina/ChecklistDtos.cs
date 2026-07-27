namespace Bital.Application.DTOs.DietasCocina;

public class ChecklistItemDto
{
    public required string Id { get; set; }
    public required string Label { get; set; }
    public bool Obligatorio { get; set; }
    public bool Completado { get; set; }
}

public class ActualizarChecklistOrdenDto
{
    public required List<ChecklistItemActualizarDto> Items { get; set; }
}

public class ChecklistItemActualizarDto
{
    public required string Id { get; set; }
    public bool Completado { get; set; }
}
