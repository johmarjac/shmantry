using System.Net.Http.Json;
using System.Text.Json.Serialization;
using shmantry.Shared.Models;

namespace shmantry.Shared.Services;

public class OpenFoodFactsService : IOpenFoodFactsService
{
    private readonly HttpClient _http;

    public OpenFoodFactsService(HttpClient http)
    {
        _http = http;
    }

    public async Task<FoodItem?> LookupBarcodeAsync(string barcode)
    {
        try
        {
            var response = await _http.GetFromJsonAsync<OffResponse>(
                $"https://world.openfoodfacts.org/api/v2/product/{barcode}.json?fields=product_name,brands,image_url,nutriscore_grade");

            if (response?.Status != 1 || response.Product == null)
                return null;

            var p = response.Product;
            return new FoodItem
            {
                Barcode = barcode,
                Name = !string.IsNullOrWhiteSpace(p.ProductName) ? p.ProductName : barcode,
                Brand = p.Brands,
                ImageUrl = p.ImageUrl,
                NutriScore = p.NutriscoreGrade?.ToUpperInvariant()
            };
        }
        catch
        {
            return null;
        }
    }

    private sealed class OffResponse
    {
        [JsonPropertyName("status")]
        public int Status { get; set; }

        [JsonPropertyName("product")]
        public OffProduct? Product { get; set; }
    }

    private sealed class OffProduct
    {
        [JsonPropertyName("product_name")]
        public string? ProductName { get; set; }

        [JsonPropertyName("brands")]
        public string? Brands { get; set; }

        [JsonPropertyName("image_url")]
        public string? ImageUrl { get; set; }

        [JsonPropertyName("nutriscore_grade")]
        public string? NutriscoreGrade { get; set; }
    }
}
