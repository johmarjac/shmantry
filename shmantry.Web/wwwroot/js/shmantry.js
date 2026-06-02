window.shmantry = {

    // Trigger a JSON file download in the browser
    downloadFile: function (filename, content) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Open a file picker and return the file content as a string (or null if cancelled)
    pickLocalFile: function () {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.style.display = 'none';
            input.onchange = async () => {
                const file = input.files[0];
                input.remove();
                if (!file) { resolve(null); return; }
                resolve(await file.text());
            };
            document.body.appendChild(input);
            input.click();
        });
    },

    // Fetch a file from an OneDrive sharing link using the Graph shares API
    fetchOneDriveLink: async function (sharingUrl) {
        const encoded = btoa(sharingUrl).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const url = 'https://api.onedrive.com/v1.0/shares/u!' + encoded + '/root/content';
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('OneDrive-API: HTTP ' + resp.status);
        return await resp.text();
    },

    // Camera barcode scanning using the BarcodeDetector API (Chrome/Edge/Android)
    scanBarcode: function () {
        return new Promise(async function (resolve) {
            if (!('BarcodeDetector' in window)) {
                const toast = document.createElement('div');
                toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:8px;z-index:10000;font-family:Roboto,sans-serif;font-size:14px;white-space:nowrap;';
                toast.textContent = 'Barcode-Scanner nicht verfügbar (Chrome/Edge erforderlich)';
                document.body.appendChild(toast);
                setTimeout(function () { toast.remove(); }, 3000);
                resolve(null);
                return;
            }

            const style = document.createElement('style');
            style.textContent = '@keyframes shmScan{0%,100%{top:15%}50%{top:78%}}';
            document.head.appendChild(style);

            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';

            const videoWrap = document.createElement('div');
            videoWrap.style.cssText = 'position:relative;width:min(90vw,400px);';

            const video = document.createElement('video');
            video.setAttribute('playsinline', '');
            video.style.cssText = 'width:100%;border-radius:8px;background:#000;display:block;';

            const scanLine = document.createElement('div');
            scanLine.style.cssText = 'position:absolute;left:8%;right:8%;height:2px;background:#fd8122;box-shadow:0 0 10px #fd8122;animation:shmScan 2s ease-in-out infinite;';

            videoWrap.append(video, scanLine);

            const hint = document.createElement('p');
            hint.textContent = 'Barcode in den Rahmen halten…';
            hint.style.cssText = 'color:#ccc;margin:0;font-family:Roboto,sans-serif;font-size:14px;';

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Abbrechen';
            cancelBtn.style.cssText = 'padding:10px 32px;background:#fd8122;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:1rem;font-family:Roboto,sans-serif;';

            overlay.append(videoWrap, hint, cancelBtn);
            document.body.appendChild(overlay);

            let stream = null;
            let active = true;

            function cleanup() {
                active = false;
                if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
                overlay.remove();
                style.remove();
            }

            cancelBtn.onclick = function () { cleanup(); resolve(null); };

            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                video.srcObject = stream;
                await video.play();
            } catch (_) {
                cleanup();
                resolve(null);
                return;
            }

            const detector = new BarcodeDetector({
                formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code', 'data_matrix']
            });

            function scan() {
                if (!active) return;
                detector.detect(video).then(function (barcodes) {
                    if (!active) return;
                    if (barcodes.length > 0) {
                        cleanup();
                        resolve(barcodes[0].rawValue);
                    } else {
                        requestAnimationFrame(scan);
                    }
                }).catch(function () {
                    if (active) requestAnimationFrame(scan);
                });
            }

            scan();
        });
    }
};
