using SQLite;

namespace shmantry.Shared.Models;

[Table("Homes")]
public class Home
{
    [PrimaryKey]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [NotNull]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
