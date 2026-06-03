using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.WebAssembly.Authentication;
using Shmantry.Shared.Services;

namespace Shmantry.Web.Services;

#pragma warning disable CS0618
public class MsalAuthNavigationService : IAuthNavigationService
{
    private readonly NavigationManager _nav;
    private readonly SignOutSessionStateManager _signOutManager;

    public MsalAuthNavigationService(NavigationManager nav, SignOutSessionStateManager signOutManager)
    {
        _nav = nav;
        _signOutManager = signOutManager;
    }

    public void NavigateToLogin() =>
        _nav.NavigateTo($"{_nav.BaseUri}authentication/login");

    public async Task NavigateToLogoutAsync()
    {
        await _signOutManager.SetSignOutState();
        _nav.NavigateTo($"{_nav.BaseUri}authentication/logout");
    }
}
#pragma warning restore CS0618
