let _dotNet = null;

export function initScanner(containerEl, dotNetHelper) {
    _dotNet = dotNetHelper;

    Quagga.init({
        inputStream: {
            type: 'LiveStream',
            target: containerEl,
            constraints: {
                facingMode: { ideal: 'environment' },
                width:  { min: 640, ideal: 1280 },
                height: { min: 480, ideal: 720 }
            }
        },
        locator: {
            patchSize: 'medium',
            halfSample: true
        },
        numOfWorkers: 0,
        frequency: 10,
        decoder: {
            readers: [
                'ean_reader',
                'ean_8_reader',
                'code_128_reader',
                'code_39_reader',
                'upc_reader',
                'upc_e_reader',
                'codabar_reader',
                'i2of5_reader',
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
