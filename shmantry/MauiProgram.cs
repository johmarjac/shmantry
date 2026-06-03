using Microsoft.Extensions.Logging;
using shmantry.Shared.Services;
using shmantry.Services;
using MudBlazor.Services;
using ZXing.Net.Maui.Controls;

namespace shmantry;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseZXingNet()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
            });

        builder.Services.AddSingleton<IFormFactor, FormFactor>();
        builder.Services.AddSingleton<IShmantryService, ShmantryService>();
        builder.Services.AddSingleton<IBarcodeScannerService, BarcodeScannerService>();

        builder.Services.AddHttpClient<IOpenFoodFactsService, OpenFoodFactsService>(client =>
        {
            client.DefaultRequestHeaders.UserAgent.TryParseAdd("Shmantry/1.0 (food-inventory)");
        });

        builder.Services.AddMauiBlazorWebView();
        builder.Services.AddMudServices();

#if DEBUG
        builder.Services.AddBlazorWebViewDeveloperTools();
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
