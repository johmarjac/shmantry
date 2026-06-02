using Microsoft.JSInterop;
using shmantry.Shared.Services;

namespace shmantry.Web.Services;

public class BarcodeScannerService : IBarcodeScannerService
{
    private readonly IJSRuntime _js;

    public BarcodeScannerService(IJSRuntime js) => _js = js;

    public bool IsSupported => true;

    public async Task<string?> ScanBarcodeAsync() =>
        await _js.InvokeAsync<string?>("shmantry.scanBarcode");
}
