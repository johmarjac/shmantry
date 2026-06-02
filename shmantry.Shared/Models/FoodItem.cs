using SQLite;

namespace shmantry.Shared.Models;

[Table("FoodItems")]
public class FoodItem
{
    [PrimaryKey]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [Indexed]
    public string? Barcode { get; set; }
    [NotNull]
    public string Name { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? ImageUrl { get; set; }
    public string? NutriScore { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
