using shmantry.Shared.Models;
using shmantry.Shared.Services;

namespace shmantry.Web.Services;

// In-memory implementation for WASM.
// Data lives only for the current session. Persistence via IndexedDB or JSON export/import
// can be added later. The setup screen is skipped — WASM has no local database file concept.
public class ShmantryService : IShmantryService
{
    private bool _initialized = true; // WASM: no file setup needed, start directly
    private readonly List<Home> _homes = [];
    private readonly List<StorageLocation> _locations = [];
    private readonly List<FoodItem> _foodItems = [];
    private readonly List<ItemEntry> _entries = [];

    public bool IsAppInitialized() => _initialized;

    public Task<bool> CreateDatabaseAsync()
    {
        _initialized = true;
        return Task.FromResult(true);
    }

    public Task<bool> OpenDatabaseAsync()
    {
        _initialized = true;
        return Task.FromResult(true);
    }

    public void CloseDatabase()
    {
        _initialized = false;
        _homes.Clear();
        _locations.Clear();
        _foodItems.Clear();
        _entries.Clear();
    }

    // --- Homes ---

    public Task<List<Home>> GetHomesAsync() =>
        Task.FromResult(_homes.OrderBy(h => h.CreatedAt).ToList());

    public Task<Home> CreateHomeAsync(string name, string? description = null)
    {
        var home = new Home { Name = name, Description = description };
        _homes.Add(home);
        return Task.FromResult(home);
    }

    public Task UpdateHomeAsync(Home home)
    {
        var i = _homes.FindIndex(h => h.Id == home.Id);
        if (i >= 0) _homes[i] = home;
        return Task.CompletedTask;
    }

    public Task DeleteHomeAsync(string homeId)
    {
        var locationIds = _locations.Where(l => l.HomeId == homeId).Select(l => l.Id).ToList();
        _entries.RemoveAll(e => locationIds.Contains(e.StorageLocationId));
        _locations.RemoveAll(l => l.HomeId == homeId);
        _homes.RemoveAll(h => h.Id == homeId);
        return Task.CompletedTask;
    }

    // --- Storage Locations ---

    public Task<List<StorageLocation>> GetStorageLocationsAsync(string homeId) =>
        Task.FromResult(_locations.Where(l => l.HomeId == homeId).OrderBy(l => l.CreatedAt).ToList());

    public Task<StorageLocation> CreateStorageLocationAsync(string homeId, string name, string? description = null)
    {
        var loc = new StorageLocation { HomeId = homeId, Name = name, Description = description };
        _locations.Add(loc);
        return Task.FromResult(loc);
    }

    public Task UpdateStorageLocationAsync(StorageLocation location)
    {
        var i = _locations.FindIndex(l => l.Id == location.Id);
        if (i >= 0) _locations[i] = location;
        return Task.CompletedTask;
    }

    public Task DeleteStorageLocationAsync(string locationId)
    {
        _entries.RemoveAll(e => e.StorageLocationId == locationId);
        _locations.RemoveAll(l => l.Id == locationId);
        return Task.CompletedTask;
    }

    // --- Food Items ---

    public Task<FoodItem?> GetFoodItemByBarcodeAsync(string barcode) =>
        Task.FromResult(_foodItems.FirstOrDefault(f => f.Barcode == barcode));

    public Task<FoodItem> SaveFoodItemAsync(FoodItem item)
    {
        var i = _foodItems.FindIndex(f => f.Id == item.Id);
        if (i >= 0) _foodItems[i] = item;
        else _foodItems.Add(item);
        return Task.FromResult(item);
    }

    // --- Item Entries ---

    public Task<List<ItemEntryWithDetails>> GetItemEntriesAsync(string storageLocationId)
    {
        var result = _entries
            .Where(e => e.StorageLocationId == storageLocationId)
            .Select(e => Enrich(e))
            .ToList();
        return Task.FromResult(result);
    }

    public Task<List<ItemEntryWithDetails>> SearchByBarcodeAsync(string barcode)
    {
        var food = _foodItems.FirstOrDefault(f => f.Barcode == barcode);
        if (food == null) return Task.FromResult(new List<ItemEntryWithDetails>());

        var result = _entries
            .Where(e => e.FoodItemId == food.Id)
            .Select(e => Enrich(e))
            .ToList();
        return Task.FromResult(result);
    }

    public Task<ItemEntry> AddItemEntryAsync(string storageLocationId, string foodItemId, int quantity,
        DateTime? bestBeforeDate = null, string? notes = null)
    {
        var entry = new ItemEntry
        {
            StorageLocationId = storageLocationId,
            FoodItemId = foodItemId,
            Quantity = quantity,
            BestBeforeDate = bestBeforeDate,
            Notes = notes
        };
        _entries.Add(entry);
        return Task.FromResult(entry);
    }

    public Task UpdateItemEntryAsync(ItemEntry entry)
    {
        var i = _entries.FindIndex(e => e.Id == entry.Id);
        if (i >= 0) _entries[i] = entry;
        return Task.CompletedTask;
    }

    public Task DeleteItemEntryAsync(string entryId)
    {
        _entries.RemoveAll(e => e.Id == entryId);
        return Task.CompletedTask;
    }

    public Task TransferItemAsync(string entryId, string targetStorageLocationId, int quantity)
    {
        var entry = _entries.FirstOrDefault(e => e.Id == entryId);
        if (entry == null) return Task.CompletedTask;

        if (quantity >= entry.Quantity)
        {
            entry.StorageLocationId = targetStorageLocationId;
        }
        else
        {
            entry.Quantity -= quantity;
            _entries.Add(new ItemEntry
            {
                FoodItemId = entry.FoodItemId,
                StorageLocationId = targetStorageLocationId,
                Quantity = quantity,
                BestBeforeDate = entry.BestBeforeDate,
                Notes = entry.Notes
            });
        }
        return Task.CompletedTask;
    }

    private ItemEntryWithDetails Enrich(ItemEntry e)
    {
        var food = _foodItems.FirstOrDefault(f => f.Id == e.FoodItemId);
        var loc = _locations.FirstOrDefault(l => l.Id == e.StorageLocationId);
        var home = loc != null ? _homes.FirstOrDefault(h => h.Id == loc.HomeId) : null;

        return new ItemEntryWithDetails
        {
            Id = e.Id,
            StorageLocationId = e.StorageLocationId,
            StorageLocationName = loc?.Name ?? string.Empty,
            HomeId = loc?.HomeId ?? string.Empty,
            HomeName = home?.Name ?? string.Empty,
            FoodItemId = e.FoodItemId,
            Barcode = food?.Barcode,
            Name = food?.Name ?? string.Empty,
            Brand = food?.Brand,
            ImageUrl = food?.ImageUrl,
            NutriScore = food?.NutriScore,
            Quantity = e.Quantity,
            BestBeforeDate = e.BestBeforeDate,
            Notes = e.Notes,
            CreatedAt = e.CreatedAt
        };
    }

    public void Dispose() { }
}
