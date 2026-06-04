let _dotNet = null;
let _observer = null;

function applyStyles(containerEl) {
    const video = containerEl.querySelector('video');
    if (video) {
        video.style.width = '100%';
        video.style.height = 'auto';
        video.style.display = 'block';
        video.style.objectFit = 'cover';
    }
    const canvas = containerEl.querySelector('canvas.drawingBuffer');
    if (canvas) {
        canvas.style.display = 'none';
    }
}

export async function initScanner(containerEl, dotNetHelper) {
    _dotNet = dotNetHelper;

    _observer = new MutationObserver(() => applyStyles(containerEl));
    _observer.observe(containerEl, { childList: true, subtree: true });

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
        Quagga.start();
        applyStyles(containerEl);
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
    if (_observer) { _observer.disconnect(); _observer = null; }
    try { Quagga.stop(); } catch {}
    _dotNet = null;
}
