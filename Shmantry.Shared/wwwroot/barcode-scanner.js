let _dotNet = null;

export function initScanner(containerEl, dotNetHelper) {
    _dotNet = dotNetHelper;

    Quagga.init({
        inputStream: {
            type: 'LiveStream',
            target: containerEl,
            constraints: {
                facingMode: { ideal: 'environment' },
                width:  { ideal: 1280 },
                height: { ideal: 720 }
            }
        },
        locator: {
            patchSize: 'medium',
            halfSample: true
        },
        numOfWorkers: 4,
        frequency: 10,
        decoder: {
            readers: [
                'ean_reader',
                'ean_8_reader',
            ]
        },
        locate: true
    }, err => {
        if (err) {
            dotNetHelper.invokeMethodAsync('OnScannerError', err.toString());
            return;
        }
        Quagga.start();
        dotNetHelper.invokeMethodAsync('OnScannerReady');
    });

    Quagga.onDetected(result => {
        const code = result?.codeResult?.code;
        if (code) dotNetHelper.invokeMethodAsync('OnBarcodeDetected', code);
    });
}

export function stopScanner() {
    try { Quagga.stop(); } catch {}
    _dotNet = null;
}
