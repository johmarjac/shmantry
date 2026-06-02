using shmantry.Web.Components;
using shmantry.Shared.Services;
using shmantry.Web.Services;
using MudBlazor.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Services.AddSingleton<IFormFactor, FormFactor>();
builder.Services.AddSingleton<IShmantryService, shmantry.Web.Services.ShmantryService>();
builder.Services.AddSingleton<IBarcodeScannerService, shmantry.Web.Services.BarcodeScannerService>();

builder.Services.AddHttpClient<IOpenFoodFactsService, OpenFoodFactsService>(client =>
{
    client.DefaultRequestHeaders.UserAgent.TryParseAdd("Shmantry/1.0 (food-inventory)");
});

builder.Services.AddMudServices();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}
app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();
app.UseAntiforgery();
app.MapStaticAssets();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode()
    .AddAdditionalAssemblies(typeof(shmantry.Shared._Imports).Assembly);

app.Run();
