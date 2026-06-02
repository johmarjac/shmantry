using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using shmantry.Shared.Services;
using shmantry.Web.Services;
using MudBlazor.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<shmantry.Web.Components.App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddSingleton<IFormFactor, FormFactor>();
builder.Services.AddSingleton<IShmantryService, ShmantryService>();
builder.Services.AddSingleton<IBarcodeScannerService, BarcodeScannerService>();

// In WASM, HttpClient is browser-managed — create directly instead of using IHttpClientFactory
var offHttp = new HttpClient();
offHttp.DefaultRequestHeaders.UserAgent.TryParseAdd("Shmantry/1.0 (food-inventory)");
builder.Services.AddSingleton<IOpenFoodFactsService>(new OpenFoodFactsService(offHttp));

builder.Services.AddMudServices();

await builder.Build().RunAsync();
