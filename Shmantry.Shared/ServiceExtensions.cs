using Microsoft.Extensions.DependencyInjection;
using MudBlazor.Services;

namespace Shmantry.Shared;

public static class ServiceExtensions
{
    public static IServiceCollection AddSharedServices(this IServiceCollection services)
    {
        services.AddMudServices();
        return services;
    }
}
