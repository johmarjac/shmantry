using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.WebAssembly.Authentication;
using Shmantry.Shared.Services;

namespace Shmantry.Web.Services;

public class MsalAuthNavigationService : IAuthNavigationService
{
    private readonly NavigationManager _nav;

    public MsalAuthNavigationService(NavigationManager nav) => _nav = nav;

    public void NavigateToLogin() =>
        _nav.NavigateToLogin($"{_nav.BaseUri}authentication/login");

    public Task NavigateToLogoutAsync()
    {
        _nav.NavigateToLogout($"{_nav.BaseUri}authentication/logout");
        return Task.CompletedTask;
    }
}
