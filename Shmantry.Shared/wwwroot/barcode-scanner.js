let _dotNet = null;
let _observer = null;

function injectHideCanvasStyle() {
    if (document.getElementById('quagga-style-fix')) return;
    const style = document.createElement('style');
    style.id = 'quagga-style-fix';
    style.textContent = 'canvas.drawingBuffer { display: none !important; }';
    document.head.appendChild(style);
}

function applyVideoStyles(containerEl) {
    const video = containerEl.querySelector('video');
    if (video) {
        video.style.setProperty('width', '100%', 'important');
        video.style.setProperty('height', 'auto', 'important');
        video.style.setProperty('display', 'block', 'important');
        video.style.setProperty('object-fit', 'cover', 'important');
        video.style.setProperty('max-height', '70vh', 'important');
    }
}

export async function initScanner(containerEl, dotNetHelper) {
    _dotNet = dotNetHelper;

    injectHideCanvasStyle();

    _observer = new MutationObserver(() => applyVideoStyles(containerEl));
    _observer.observe(containerEl, { childList: true, subtree: true, attributes: true });

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
        applyVideoStyles(containerEl);
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
