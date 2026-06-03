namespace shmantry.Shared.Models;

public class ExportData
{
    public List<Home> Homes { get; set; } = [];
    public List<StorageLocation> Locations { get; set; } = [];
    public List<FoodItem> FoodItems { get; set; } = [];
    public List<ItemEntry> Entries { get; set; } = [];
    public AppSettings? Settings { get; set; }
    public DateTime? ExportedAt { get; set; }
}
