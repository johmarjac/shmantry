using ZXing.Net.Maui;

namespace shmantry;

public partial class ScannerPage : ContentPage
{
    private readonly TaskCompletionSource<string?> _tcs;
    private bool _handled;

    public ScannerPage(TaskCompletionSource<string?> tcs)
    {
        InitializeComponent();
        _tcs = tcs;

        BarcodeReader.Options = new BarcodeReaderOptions
        {
            Formats = BarcodeFormats.All,
            AutoRotate = true,
            Multiple = false
        };
    }

    private void OnBarcodesDetected(object sender, BarcodeDetectionEventArgs e)
    {
        if (_handled) return;
        var result = e.Results?.FirstOrDefault();
        if (result == null) return;

        _handled = true;
        BarcodeReader.IsDetecting = false;

        MainThread.BeginInvokeOnMainThread(async () =>
        {
            _tcs.TrySetResult(result.Value);
            await Navigation.PopModalAsync(animated: true);
        });
    }

    private void OnCancel(object sender, EventArgs e)
    {
        if (_handled) return;
        _handled = true;
        BarcodeReader.IsDetecting = false;

        MainThread.BeginInvokeOnMainThread(async () =>
        {
            _tcs.TrySetResult(null);
            await Navigation.PopModalAsync(animated: true);
        });
    }

    protected override bool OnBackButtonPressed()
    {
        if (!_handled)
        {
            _handled = true;
            BarcodeReader.IsDetecting = false;
            _tcs.TrySetResult(null);
            MainThread.BeginInvokeOnMainThread(async () =>
                await Navigation.PopModalAsync(animated: true));
        }
        return true;
    }
}
