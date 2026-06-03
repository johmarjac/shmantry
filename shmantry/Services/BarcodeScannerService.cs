using shmantry.Shared.Services;

namespace shmantry.Services;

public class BarcodeScannerService : IBarcodeScannerService
{
    public bool IsSupported => true;

    public Task<string?> ScanBarcodeAsync()
    {
        var tcs = new TaskCompletionSource<string?>();

        MainThread.BeginInvokeOnMainThread(async () =>
        {
            try
            {
                var page = new ScannerPage(tcs);
                var root = Application.Current?.MainPage;
                if (root != null)
                    await root.Navigation.PushModalAsync(page, animated: true);
                else
                    tcs.TrySetResult(null);
            }
            catch (Exception ex)
            {
                tcs.TrySetException(ex);
            }
        });

        return tcs.Task;
    }
}
