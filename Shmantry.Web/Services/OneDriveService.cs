using Microsoft.AspNetCore.Components.WebAssembly.Authentication;
using Shmantry.Shared.Services;
using System.Net.Http.Headers;

namespace Shmantry.Web.Services;

public class OneDriveService : IOneDriveService
{
    private readonly IAccessTokenProvider _tokenProvider;
    private readonly HttpClient _http;

    public OneDriveService(IAccessTokenProvider tokenProvider, HttpClient http)
    {
        _tokenProvider = tokenProvider;
        _http = http;
    }

    public async Task<bool?> CheckShmantryFileExistsAsync()
    {
        var tokenResult = await _tokenProvider.RequestAccessToken(
            new AccessTokenRequestOptions { Scopes = ["https://graph.microsoft.com/Files.ReadWrite.AppFolder"] });

        if (!tokenResult.TryGetToken(out var token))
            return null;

        using var request = new HttpRequestMessage(HttpMethod.Get,
            "https://graph.microsoft.com/v1.0/me/drive/special/approot:/shmantry.json");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token.Value);

        var response = await _http.SendAsync(request);
        return response.StatusCode == System.Net.HttpStatusCode.OK;
    }
}
