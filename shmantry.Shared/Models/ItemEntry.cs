using SQLite;

namespace shmantry.Shared.Models;

[Table("ItemEntries")]
public class ItemEntry
{
    [PrimaryKey]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [NotNull, Indexed]
    public string FoodItemId { get; set; } = string.Empty;
    [NotNull, Indexed]
    public string StorageLocationId { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public DateTime? BestBeforeDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
