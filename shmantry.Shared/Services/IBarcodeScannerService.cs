namespace shmantry.Shared.Services;

public interface IBarcodeScannerService
{
    bool IsSupported { get; }
    Task<string?> ScanBarcodeAsync();
}
