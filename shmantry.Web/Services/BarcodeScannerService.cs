using shmantry.Shared.Services;

namespace shmantry.Web.Services;

public class BarcodeScannerService : IBarcodeScannerService
{
    public bool IsSupported => false;

    public Task<string?> ScanBarcodeAsync() => Task.FromResult<string?>(null);
}
