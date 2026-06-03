let stream = null;
const CAPTURE_W = 640;
const CAPTURE_H = 480;

export async function startCamera(videoEl) {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width:  { ideal: CAPTURE_W },
                height: { ideal: CAPTURE_H }
            }
        });
        videoEl.srcObject = stream;
        await new Promise(resolve => { videoEl.onloadedmetadata = resolve; });
        await videoEl.play();
        return true;
    } catch (err) {
        console.error('Camera error:', err);
        return false;
    }
}

export function captureFrame(videoEl, canvasEl) {
    if (!videoEl.videoWidth || !videoEl.videoHeight) return new Uint8Array(0);
    canvasEl.width  = CAPTURE_W;
    canvasEl.height = CAPTURE_H;
    const ctx = canvasEl.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(videoEl, 0, 0, CAPTURE_W, CAPTURE_H);
    return new Uint8Array(ctx.getImageData(0, 0, CAPTURE_W, CAPTURE_H).data.buffer);
}

export function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
    }
}
