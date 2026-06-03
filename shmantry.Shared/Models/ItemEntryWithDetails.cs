namespace shmantry.Shared.Models;

public class ItemEntryWithDetails
{
    public string Id { get; set; } = string.Empty;
    public string StorageLocationId { get; set; } = string.Empty;
    public string StorageLocationName { get; set; } = string.Empty;
    public string HomeId { get; set; } = string.Empty;
    public string HomeName { get; set; } = string.Empty;
    public string FoodItemId { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? ImageUrl { get; set; }
    public string? NutriScore { get; set; }
    public int Quantity { get; set; }
    public DateTime? BestBeforeDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ExpiryWarningDays { get; set; } = 7;

    public bool IsExpiringSoon =>
        BestBeforeDate.HasValue && BestBeforeDate.Value.Date <= DateTime.Today.AddDays(ExpiryWarningDays);

    public bool IsExpired =>
        BestBeforeDate.HasValue && BestBeforeDate.Value.Date < DateTime.Today;
}
