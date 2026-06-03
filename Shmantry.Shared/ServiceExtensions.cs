using Microsoft.Extensions.DependencyInjection;

namespace Shmantry.Shared;

public static class ServiceExtensions
{
    public static IServiceCollection AddSharedServices(this IServiceCollection services)
    {
        // Register shared services here
        return services;
    }
}
