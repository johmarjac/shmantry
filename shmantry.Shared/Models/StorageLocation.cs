using SQLite;

namespace shmantry.Shared.Models;

[Table("StorageLocations")]
public class StorageLocation
{
    [PrimaryKey]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [NotNull, Indexed]
    public string HomeId { get; set; } = string.Empty;
    [NotNull]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
