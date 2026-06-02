using SQLite;
using shmantry.Shared.Models;
using shmantry.Shared.Services;

namespace shmantry.Services;

public class ShmantryService : IShmantryService
{
    private SQLiteAsyncConnection? _db;

    public bool IsAppInitialized()
    {
        if (_db != null) return true;
        var path = Preferences.Default.Get("db_file", string.Empty);
        return !string.IsNullOrEmpty(path) && File.Exists(path);
    }

    public async Task<bool> CreateDatabaseAsync()
    {
        try
        {
            // Default: create in app data directory. User can move the file to a sync
            // folder (Dropbox, OneDrive) and reopen it via OpenDatabaseAsync.
            var path = Path.Combine(FileSystem.AppDataDirectory, "shmantry.db");
            if (File.Exists(path)) File.Delete(path);
            await InitDatabaseAsync(path);
            Preferences.Default.Set("db_file", path);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> OpenDatabaseAsync()
    {
        try
        {
            var result = await FilePicker.Default.PickAsync(new PickOptions
            {
                PickerTitle = "Shmantry-Datenbank öffnen"
            });

            if (result == null) return false;

            await InitDatabaseAsync(result.FullPath);
            Preferences.Default.Set("db_file", result.FullPath);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public void CloseDatabase()
    {
        _db?.CloseAsync();
        _db = null;
        Preferences.Default.Remove("db_file");
    }

    private async Task EnsureDbAsync()
    {
        if (_db != null) return;

        var path = Preferences.Default.Get("db_file", string.Empty);
        if (!string.IsNullOrEmpty(path) && File.Exists(path))
        {
            await InitDatabaseAsync(path);
            return;
        }

        throw new InvalidOperationException("Keine Datenbank geöffnet.");
    }

    private async Task InitDatabaseAsync(string path)
    {
        _db = new SQLiteAsyncConnection(path);
        await _db.CreateTableAsync<Home>();
        await _db.CreateTableAsync<StorageLocation>();
        await _db.CreateTableAsync<FoodItem>();
        await _db.CreateTableAsync<ItemEntry>();
    }

    // --- Homes ---

    public async Task<List<Home>> GetHomesAsync()
    {
        await EnsureDbAsync();
        return await _db!.Table<Home>().OrderBy(h => h.CreatedAt).ToListAsync();
    }

    public async Task<Home> CreateHomeAsync(string name, string? description = null)
    {
        await EnsureDbAsync();
        var home = new Home { Name = name, Description = description };
        await _db!.InsertAsync(home);
        return home;
    }

    public async Task UpdateHomeAsync(Home home)
    {
        await EnsureDbAsync();
        await _db!.UpdateAsync(home);
    }

    public async Task DeleteHomeAsync(string homeId)
    {
        await EnsureDbAsync();
        var locations = await _db!.Table<StorageLocation>()
            .Where(l => l.HomeId == homeId).ToListAsync();

        foreach (var loc in locations)
            await DeleteStorageLocationAsync(loc.Id);

        await _db!.DeleteAsync<Home>(homeId);
    }

    // --- Storage Locations ---

    public async Task<List<StorageLocation>> GetStorageLocationsAsync(string homeId)
    {
        await EnsureDbAsync();
        return await _db!.Table<StorageLocation>()
            .Where(l => l.HomeId == homeId)
            .OrderBy(l => l.CreatedAt)
            .ToListAsync();
    }

    public async Task<StorageLocation> CreateStorageLocationAsync(string homeId, string name, string? description = null)
    {
        await EnsureDbAsync();
        var location = new StorageLocation { HomeId = homeId, Name = name, Description = description };
        await _db!.InsertAsync(location);
        return location;
    }

    public async Task UpdateStorageLocationAsync(StorageLocation location)
    {
        await EnsureDbAsync();
        await _db!.UpdateAsync(location);
    }

    public async Task DeleteStorageLocationAsync(string locationId)
    {
        await EnsureDbAsync();
        await _db!.Table<ItemEntry>().DeleteAsync(e => e.StorageLocationId == locationId);
        await _db!.DeleteAsync<StorageLocation>(locationId);
    }

    // --- Food Items ---

    public async Task<FoodItem?> GetFoodItemByBarcodeAsync(string barcode)
    {
        await EnsureDbAsync();
        return await _db!.Table<FoodItem>()
            .Where(f => f.Barcode == barcode)
            .FirstOrDefaultAsync();
    }

    public async Task<FoodItem> SaveFoodItemAsync(FoodItem item)
    {
        await EnsureDbAsync();
        var existing = await _db!.FindAsync<FoodItem>(item.Id);
        if (existing != null)
            await _db!.UpdateAsync(item);
        else
            await _db!.InsertAsync(item);
        return item;
    }

    // --- Item Entries ---

    public async Task<List<ItemEntryWithDetails>> GetItemEntriesAsync(string storageLocationId)
    {
        await EnsureDbAsync();
        var entries = await _db!.Table<ItemEntry>()
            .Where(e => e.StorageLocationId == storageLocationId)
            .ToListAsync();
        return await EnrichAsync(entries);
    }

    public async Task<List<ItemEntryWithDetails>> SearchByBarcodeAsync(string barcode)
    {
        await EnsureDbAsync();
        var foodItem = await _db!.Table<FoodItem>()
            .Where(f => f.Barcode == barcode)
            .FirstOrDefaultAsync();

        if (foodItem == null) return [];

        var entries = await _db!.Table<ItemEntry>()
            .Where(e => e.FoodItemId == foodItem.Id)
            .ToListAsync();
        return await EnrichAsync(entries);
    }

    public async Task<ItemEntry> AddItemEntryAsync(string storageLocationId, string foodItemId, int quantity,
        DateTime? bestBeforeDate = null, string? notes = null)
    {
        await EnsureDbAsync();
        var entry = new ItemEntry
        {
            StorageLocationId = storageLocationId,
            FoodItemId = foodItemId,
            Quantity = quantity,
            BestBeforeDate = bestBeforeDate,
            Notes = notes
        };
        await _db!.InsertAsync(entry);
        return entry;
    }

    public async Task UpdateItemEntryAsync(ItemEntry entry)
    {
        await EnsureDbAsync();
        await _db!.UpdateAsync(entry);
    }

    public async Task DeleteItemEntryAsync(string entryId)
    {
        await EnsureDbAsync();
        await _db!.DeleteAsync<ItemEntry>(entryId);
    }

    public async Task TransferItemAsync(string entryId, string targetStorageLocationId, int quantity)
    {
        await EnsureDbAsync();
        var entry = await _db!.FindAsync<ItemEntry>(entryId);
        if (entry == null) return;

        if (quantity >= entry.Quantity)
        {
            entry.StorageLocationId = targetStorageLocationId;
            await _db!.UpdateAsync(entry);
        }
        else
        {
            entry.Quantity -= quantity;
            await _db!.UpdateAsync(entry);

            var split = new ItemEntry
            {
                FoodItemId = entry.FoodItemId,
                StorageLocationId = targetStorageLocationId,
                Quantity = quantity,
                BestBeforeDate = entry.BestBeforeDate,
                Notes = entry.Notes
            };
            await _db!.InsertAsync(split);
        }
    }

    private async Task<List<ItemEntryWithDetails>> EnrichAsync(List<ItemEntry> entries)
    {
        var result = new List<ItemEntryWithDetails>(entries.Count);
        foreach (var e in entries)
        {
            var food = await _db!.FindAsync<FoodItem>(e.FoodItemId);
            var loc = await _db!.FindAsync<StorageLocation>(e.StorageLocationId);
            var home = loc != null ? await _db!.FindAsync<Home>(loc.HomeId) : null;

            result.Add(new ItemEntryWithDetails
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
            });
        }
        return result;
    }

    public void Dispose()
    {
        _db?.CloseAsync();
        _db = null;
    }
}
