using shmantry.Shared.Models;

namespace shmantry.Shared.Services;

public interface IShmantryService : IDisposable
{
    bool IsAppInitialized();
    Task<bool> CreateDatabaseAsync();
    Task<bool> OpenDatabaseAsync();
    void CloseDatabase();

    Task<List<Home>> GetHomesAsync();
    Task<Home> CreateHomeAsync(string name, string? description = null);
    Task UpdateHomeAsync(Home home);
    Task DeleteHomeAsync(string homeId);

    Task<List<StorageLocation>> GetStorageLocationsAsync(string homeId);
    Task<StorageLocation> CreateStorageLocationAsync(string homeId, string name, string? description = null);
    Task UpdateStorageLocationAsync(StorageLocation location);
    Task DeleteStorageLocationAsync(string locationId);

    Task<FoodItem?> GetFoodItemByBarcodeAsync(string barcode);
    Task<FoodItem> SaveFoodItemAsync(FoodItem item);

    Task<List<ItemEntryWithDetails>> GetItemEntriesAsync(string storageLocationId);
    Task<List<ItemEntryWithDetails>> SearchByBarcodeAsync(string barcode);
    Task<ItemEntry> AddItemEntryAsync(string storageLocationId, string foodItemId, int quantity, DateTime? bestBeforeDate = null, string? notes = null);
    Task UpdateItemEntryAsync(ItemEntry entry);
    Task DeleteItemEntryAsync(string entryId);
    Task TransferItemAsync(string entryId, string targetStorageLocationId, int quantity);
}
