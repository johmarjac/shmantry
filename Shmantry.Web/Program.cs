using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Shmantry.Shared;
using Shmantry.Shared.Services;
using Shmantry.Web.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<Routes>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddSharedServices();
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

builder.Services.AddMsalAuthentication(options =>
{
    builder.Configuration.Bind("AzureAd", options.ProviderOptions.Authentication);
    options.ProviderOptions.Authentication.PostLogoutRedirectUri = builder.HostEnvironment.BaseAddress;
    options.ProviderOptions.DefaultAccessTokenScopes.Add("https://graph.microsoft.com/Files.ReadWrite.AppFolder");
    options.ProviderOptions.DefaultAccessTokenScopes.Add("https://graph.microsoft.com/User.Read");
});
builder.Services.AddScoped<IAuthNavigationService, MsalAuthNavigationService>();
builder.Services.AddScoped<IOneDriveService, OneDriveService>();

await builder.Build().RunAsync();
