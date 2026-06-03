window.shmantry = {

    // ─── File I/O ────────────────────────────────────────────────────────────

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

    pickLocalFile: function () {
        return new Promise(function (resolve) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.style.display = 'none';
            input.onchange = async function () {
                const file = input.files[0];
                input.remove();
                if (!file) { resolve(null); return; }
                resolve(await file.text());
            };
            document.body.appendChild(input);
            input.click();
        });
    },

    // ─── Camera barcode scanning ─────────────────────────────────────────────

    _loadZXing: function () {
        return new Promise(function (resolve, reject) {
            if (window.ZXing) { resolve(); return; }
            const s = document.createElement('script');
            s.src = 'js/zxing.min.js';
            s.onload = resolve;
            s.onerror = function () { reject(new Error('ZXing konnte nicht geladen werden')); };
            document.head.appendChild(s);
        });
    },

    _createScanOverlay: function () {
        const style = document.createElement('style');
        style.textContent = '@keyframes shmScan{0%,100%{top:15%}50%{top:78%}}';
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';

        const videoWrap = document.createElement('div');
        videoWrap.style.cssText = 'position:relative;width:min(90vw,400px);';

        const video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
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
        return { overlay, video, cancelBtn, style };
    },

    _toast: function (msg) {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:8px;z-index:10001;font-family:Roboto,sans-serif;font-size:14px;white-space:nowrap;';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 3500);
    },

    scanBarcode: function () {
        return new Promise(async function (resolve) {
            const useNative = ('BarcodeDetector' in window);

            if (!useNative) {
                try { await shmantry._loadZXing(); }
                catch {
                    shmantry._toast('Kamera-Bibliothek konnte nicht geladen werden');
                    resolve(null);
                    return;
                }
            }

            const { overlay, video, cancelBtn, style } = shmantry._createScanOverlay();
            document.body.appendChild(overlay);

            let active = true;
            let stream = null;

            function cleanup() {
                active = false;
                if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
                overlay.remove();
                style.remove();
            }

            cancelBtn.onclick = function () { cleanup(); resolve(null); };

            // Try environment-facing first (mobile), fall back to any camera (desktop)
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' } }
                });
            } catch {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                } catch (err) {
                    cleanup();
                    const n = err && err.name ? err.name : '';
                    const msg =
                        (n === 'NotReadableError' || n === 'TrackStartError')
                            ? 'Kamera wird von einer anderen App verwendet – bitte schließen und erneut versuchen'
                        : (n === 'NotFoundError' || n === 'DevicesNotFoundError')
                            ? 'Keine Kamera gefunden'
                        : (n === 'NotAllowedError' || n === 'PermissionDeniedError')
                            ? 'Kamera-Zugriff verweigert'
                        : 'Kamera konnte nicht geöffnet werden' + (err.message ? ': ' + err.message : '');
                    shmantry._toast(msg);
                    resolve(null);
                    return;
                }
            }
            try {
                video.srcObject = stream;
                await video.play();
            } catch {
                cleanup();
                shmantry._toast('Kamera konnte nicht gestartet werden');
                resolve(null);
                return;
            }

            if (useNative) {
                // Chrome/Edge desktop & Android – native BarcodeDetector
                const detector = new BarcodeDetector({
                    formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code', 'data_matrix']
                });
                function scan() {
                    if (!active) return;
                    detector.detect(video).then(function (barcodes) {
                        if (!active) return;
                        if (barcodes.length > 0) { cleanup(); resolve(barcodes[0].rawValue); }
                        else requestAnimationFrame(scan);
                    }).catch(function () { if (active) requestAnimationFrame(scan); });
                }
                scan();

            } else {
                // ZXing canvas polling – iOS WebKit (14+) and Firefox.
                // drawImage(video) + getImageData() works on same-origin getUserMedia streams.
                const hints = new Map();
                hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
                    ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8,
                    ZXing.BarcodeFormat.CODE_128, ZXing.BarcodeFormat.CODE_39,
                    ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E,
                    ZXing.BarcodeFormat.QR_CODE, ZXing.BarcodeFormat.DATA_MATRIX
                ]);
                const reader = new ZXing.MultiFormatReader();
                reader.setHints(hints);
                const canvas = document.createElement('canvas');

                function pollFrame() {
                    if (!active) return;
                    if (video.readyState >= 2 && video.videoWidth > 0) {
                        if (canvas.width !== video.videoWidth)  canvas.width  = video.videoWidth;
                        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
                        canvas.getContext('2d').drawImage(video, 0, 0);
                        try {
                            const lum = new ZXing.HTMLCanvasElementLuminanceSource(canvas);
                            const bmp = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(lum));
                            const result = reader.decode(bmp);
                            cleanup();
                            resolve(result.getText());
                            return;
                        } catch { /* NotFoundException – no barcode in this frame, keep polling */ }
                    }
                    setTimeout(pollFrame, 150);
                }
                pollFrame();
            }
        });
    },

    // ─── OneDrive – MSAL + Microsoft Graph ──────────────────────────────────

    oneDrive: {
        _app: null,
        _SCOPES: ['Files.ReadWrite.AppFolder', 'User.Read'],
        _FILE: 'https://graph.microsoft.com/v1.0/me/drive/special/approot:/shmantry-backup.json:/content',

        _loadMsal: function () {
            return new Promise(function (resolve, reject) {
                if (window.msal) { resolve(); return; }
                const s = document.createElement('script');
                s.src = 'js/msal-browser.min.js';
                s.onload = resolve;
                s.onerror = function () { reject(new Error('MSAL konnte nicht geladen werden')); };
                document.head.appendChild(s);
            });
        },

        _CLIENT_ID: '2ecd8dad-f10f-4632-b1a1-11923f9dcfc2',

        _getApp: async function () {
            if (this._app) return this._app;
            await this._loadMsal();

            // auth.html is a minimal page that doesn't load Blazor.
            // Without it, Blazor's router calls history.replaceState on load and strips
            // the #code= hash before MSAL can read it, causing hash_empty_error.
            const base = document.querySelector('base');
            const baseHref = base ? base.href : (window.location.origin + '/');
            const redirectUri = baseHref + 'auth.html';

            this._app = new msal.PublicClientApplication({
                auth: {
                    clientId: this._CLIENT_ID,
                    authority: 'https://login.microsoftonline.com/consumers',
                    redirectUri: redirectUri
                },
                cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: false }
            });
            await this._app.initialize();
            return this._app;
        },

        _token: async function () {
            const app = await this._getApp();
            const accounts = app.getAllAccounts();
            if (accounts.length > 0) {
                try {
                    const r = await app.acquireTokenSilent({ scopes: this._SCOPES, account: accounts[0] });
                    return r.accessToken;
                } catch { /* silent failed, fall through to popup */ }
            }
            shmantry.oneDrive._clearInteractionLock();
            const r = await app.loginPopup({ scopes: this._SCOPES });
            return r.accessToken;
        },

        isSignedIn: async function () {
            try { return (await this._getApp()).getAllAccounts().length > 0; } catch { return false; }
        },

        getAccountName: async function () {
            try {
                const accounts = (await this._getApp()).getAllAccounts();
                if (accounts.length > 0) return accounts[0].name || accounts[0].username || 'Verbunden';
            } catch { }
            return null;
        },

        _clearInteractionLock: function () {
            for (const k of [...Object.keys(sessionStorage)]) {
                if (k.includes('interaction')) sessionStorage.removeItem(k);
            }
        },

        signIn: async function () {
            const app = await this._getApp();
            shmantry.oneDrive._clearInteractionLock();
            await app.loginPopup({ scopes: this._SCOPES });
        },

        loadFile: async function () {
            const token = await this._token();
            const resp = await fetch(this._FILE, { headers: { Authorization: 'Bearer ' + token } });
            if (resp.status === 404) return null;
            if (!resp.ok) throw new Error('Graph API HTTP ' + resp.status);
            return await resp.text();
        },

        saveFile: async function (content) {
            const token = await this._token();
            const resp = await fetch(this._FILE, {
                method: 'PUT',
                headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
                body: content
            });
            if (!resp.ok) throw new Error('Graph API HTTP ' + resp.status);
        },

        signOut: function () {
            this._app = null;
            // MSAL v2 uses "msal." prefix; v3 may also key by clientId.
            // Clear everything matching either pattern so no version leaves state behind.
            const cid = this._CLIENT_ID.toLowerCase();
            for (const storage of [sessionStorage, localStorage]) {
                for (const k of [...Object.keys(storage)]) {
                    const kl = k.toLowerCase();
                    if (kl.startsWith('msal.') || kl.includes(cid)) storage.removeItem(k);
                }
            }
        }
    }
};
