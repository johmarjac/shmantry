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

            if (useNative) {
                // Chrome/Edge desktop & Android – native BarcodeDetector, manage camera ourselves
                let stream = null;

                function cleanup() {
                    active = false;
                    if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
                    overlay.remove();
                    style.remove();
                }

                cancelBtn.onclick = function () { cleanup(); resolve(null); };

                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: { ideal: 'environment' } }
                    });
                    video.srcObject = stream;
                    await video.play();
                } catch {
                    cleanup();
                    shmantry._toast('Kamera-Zugriff verweigert');
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
                        if (barcodes.length > 0) { cleanup(); resolve(barcodes[0].rawValue); }
                        else requestAnimationFrame(scan);
                    }).catch(function () { if (active) requestAnimationFrame(scan); });
                }
                scan();

            } else {
                // ZXing fallback – iOS Safari, Firefox, all other browsers.
                // Let ZXing manage the camera via decodeFromConstraints (handles getUserMedia internally).
                const hints = new Map();
                hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
                    ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8,
                    ZXing.BarcodeFormat.CODE_128, ZXing.BarcodeFormat.CODE_39,
                    ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E,
                    ZXing.BarcodeFormat.QR_CODE, ZXing.BarcodeFormat.DATA_MATRIX
                ]);
                const zxReader = new ZXing.BrowserMultiFormatReader(hints);
                let controls = null;

                function cleanup() {
                    active = false;
                    if (controls) { try { controls.stop(); } catch { } }
                    overlay.remove();
                    style.remove();
                }

                cancelBtn.onclick = function () { cleanup(); resolve(null); };

                try {
                    // decodeFromConstraints starts the camera, attaches stream to video,
                    // and fires the callback on every frame (result=null if no barcode yet).
                    controls = await zxReader.decodeFromConstraints(
                        { video: { facingMode: { ideal: 'environment' } } },
                        video,
                        function (result, error) {
                            if (!active) return;
                            if (result) { cleanup(); resolve(result.getText()); }
                            // error here is just NotFoundException (no barcode in frame) — ignore
                        }
                    );
                } catch {
                    cleanup();
                    shmantry._toast('Kamera-Zugriff verweigert');
                    resolve(null);
                }
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

            const base = document.querySelector('base');
            const redirectUri = base ? base.href : (window.location.origin + '/');

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

        signIn: async function () {
            const app = await this._getApp();
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

        signOut: async function () {
            try {
                const app = await this._getApp();
                const accounts = app.getAllAccounts();
                if (accounts.length > 0) await app.logoutPopup({ account: accounts[0] });
            } finally { this._app = null; }
        }
    }
};
