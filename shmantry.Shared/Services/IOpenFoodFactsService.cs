using shmantry.Shared.Models;

namespace shmantry.Shared.Services;

public interface IOpenFoodFactsService
{
    Task<FoodItem?> LookupBarcodeAsync(string barcode);
}
