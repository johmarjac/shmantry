using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.Extensions.Logging;
using Shmantry.Services;
using Shmantry.Shared;
using Shmantry.Shared.Services;

namespace Shmantry;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        builder.Services.AddMauiBlazorWebView();
        builder.Services.AddSharedServices();
        builder.Services.AddAuthorizationCore();
        builder.Services.AddScoped<AuthenticationStateProvider, AnonymousAuthStateProvider>();
        builder.Services.AddScoped<IAuthNavigationService, AnonymousAuthNavigationService>();

#if DEBUG
        builder.Services.AddBlazorWebViewDeveloperTools();
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
