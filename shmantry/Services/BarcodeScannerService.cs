using shmantry.Shared.Services;

namespace shmantry.Services;

// Placeholder — replace with ZXing.Net.Maui.Controls integration:
// 1. Add package ZXing.Net.Maui.Controls
// 2. Call builder.UseZXing() in MauiProgram.cs
// 3. Create ScannerPage with CameraBarcodeReaderView
// 4. Navigate to it and return result via TaskCompletionSource
public class BarcodeScannerService : IBarcodeScannerService
{
    public bool IsSupported => false;

    public Task<string?> ScanBarcodeAsync() => Task.FromResult<string?>(null);
}
