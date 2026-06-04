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

async function enableAutofocus(containerEl) {
    const video = containerEl.querySelector('video');
    const track = video?.srcObject?.getVideoTracks?.()?.[0];
    if (!track) return;
    const caps = track.getCapabilities?.() ?? {};
    if (caps.focusMode?.includes('continuous')) {
        try { await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }); } catch {}
    }
}

async function startQuagga(containerEl, dotNetHelper, deviceId) {
    const constraints = deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: { ideal: 'environment' } };

    await new Promise((resolve, reject) => {
        Quagga.init({
            inputStream: {
                type: 'LiveStream',
                target: containerEl,
                constraints
            },
            locator: { patchSize: 'medium', halfSample: true },
            numOfWorkers: 4,
            frequency: 10,
            decoder: { readers: ['ean_reader', 'ean_8_reader'] },
            locate: true
        }, err => {
            if (err) { reject(err); return; }
            resolve();
        });
    });

    Quagga.start();
    applyVideoStyles(containerEl);
    enableAutofocus(containerEl);

    Quagga.onDetected(result => {
        const code = result?.codeResult?.code;
        if (code) dotNetHelper.invokeMethodAsync('OnBarcodeDetected', code);
    });
}

export async function getCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
        .filter(d => d.kind === 'videoinput')
        .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Kamera ${i + 1}`
        }));
}

export async function initScanner(containerEl, dotNetHelper, deviceId) {
    _dotNet = dotNetHelper;

    injectHideCanvasStyle();

    _observer = new MutationObserver(() => applyVideoStyles(containerEl));
    _observer.observe(containerEl, { childList: true, subtree: true, attributes: true });

    await startQuagga(containerEl, dotNetHelper, deviceId || null)
        .then(() => dotNetHelper.invokeMethodAsync('OnScannerReady'))
        .catch(err => dotNetHelper.invokeMethodAsync('OnScannerError', err.toString()));
}

export async function switchCamera(containerEl, dotNetHelper, deviceId) {
    try { Quagga.stop(); } catch {}
    await startQuagga(containerEl, dotNetHelper, deviceId)
        .catch(err => dotNetHelper.invokeMethodAsync('OnScannerError', err.toString()));
}

export function stopScanner() {
    if (_observer) { _observer.disconnect(); _observer = null; }
    try { Quagga.stop(); } catch {}
    _dotNet = null;
}
