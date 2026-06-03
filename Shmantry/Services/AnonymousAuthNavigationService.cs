using Shmantry.Shared.Services;

namespace Shmantry.Services;

public class AnonymousAuthNavigationService : IAuthNavigationService
{
    public void NavigateToLogin() { }
    public Task NavigateToLogoutAsync() => Task.CompletedTask;
}
