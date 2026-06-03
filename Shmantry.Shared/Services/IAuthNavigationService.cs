namespace Shmantry.Shared.Services;

public interface IAuthNavigationService
{
    void NavigateToLogin();
    Task NavigateToLogoutAsync();
}
