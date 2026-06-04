let _dotNet = null;

function applyStyles(containerEl) {
    const video = containerEl.querySelector('video');
    if (video) {
        video.style.width = '100%';
        video.style.height = 'auto';
        video.style.display = 'block';
        video.style.objectFit = 'contain';
    }
    const canvas = containerEl.querySelector('canvas.drawingBuffer');
    if (canvas) {
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
    }
}

export async function initScanner(containerEl, dotNetHelper) {
    _dotNet = dotNetHelper;

    await new Promise((resolve, reject) => {
        Quagga.init({
            inputStream: {
                type: 'LiveStream',
                target: containerEl,
                constraints: {
                    facingMode: { ideal: 'environment' }
                }
            },
            locator: {
                patchSize: 'medium',
                halfSample: true
            },
            numOfWorkers: 4,
            frequency: 10,
            decoder: {
                readers: ['ean_reader', 'ean_8_reader']
            },
            locate: true
        }, err => {
            if (err) { reject(err); return; }
            resolve();
        });
    }).then(() => {
        applyStyles(containerEl);
        Quagga.start();
        dotNetHelper.invokeMethodAsync('OnScannerReady');
    }).catch(err => {
        dotNetHelper.invokeMethodAsync('OnScannerError', err.toString());
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
