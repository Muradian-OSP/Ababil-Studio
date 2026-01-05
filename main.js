const { BrowserWindow, app, ipcMain } = require('electron');
const url = require('url');
const path = require('path');

// Native library service
let nativeLib = null;

async function initializeNativeLibrary() {
    try {
        const koffi = require('koffi');
        const fs = require('fs');

        // Paths to try for the library
        const pathsToTry = [
            path.join(__dirname, 'services/libababil_core.dylib'),
            path.join(process.cwd(), 'services/libababil_core.dylib'),
            path.join(__dirname, '../services/libababil_core.dylib'),
        ];

        // Add home directory path
        const homeDir = process.env.HOME || '';
        if (homeDir) {
            pathsToTry.push(
                path.join(
                    homeDir,
                    'Developer/ababil_studio/services/libababil_core.dylib'
                )
            );
        }

        let lib = null;
        let loadedPath = null;

        for (const libPath of pathsToTry) {
            try {
                if (fs.existsSync(libPath)) {
                    lib = koffi.load(libPath);
                    loadedPath = libPath;
                    console.log(
                        `[NativeLibrary] Successfully loaded from: ${libPath}`
                    );
                    break;
                }
            } catch (e) {
                console.log(`[NativeLibrary] Failed to load from ${libPath}:`, e);
            }
        }

        if (!lib) {
            console.error(
                '[NativeLibrary] Could not load libababil_core.dylib from any path'
            );
            console.error('Tried paths:', pathsToTry);
            return {
                initialized: false,
                error: 'Library not found',
                pathsTried: pathsToTry,
            };
        }

        // Define the function signatures
        const makeHttpRequest = lib.func('make_http_request', 'str', ['str']);
        const freeString = lib.func('free_string', 'void', ['str']);

        nativeLib = {
            makeHttpRequest,
            freeString,
            initialized: true,
            libraryPath: loadedPath,
        };

        console.log('[NativeLibrary] Initialized successfully');
        return { initialized: true, libraryPath: loadedPath };
    } catch (error) {
        console.error('[NativeLibrary] Failed to initialize:', error);
        return { initialized: false, error: error.message };
    }
}

// IPC Handlers
function setupIpcHandlers() {
    // Handle HTTP request via native library
    ipcMain.handle('native:makeHttpRequest', async (event, requestJson) => {
        if (!nativeLib || !nativeLib.initialized) {
            return JSON.stringify({
                status_code: 0,
                headers: [],
                body: 'Error: Native library not initialized',
                duration_ms: 0,
            });
        }

        try {
            const result = nativeLib.makeHttpRequest(requestJson);
            return (
                result ||
                JSON.stringify({
                    status_code: 0,
                    headers: [],
                    body: 'Error: Null response from native library',
                    duration_ms: 0,
                })
            );
        } catch (error) {
            return JSON.stringify({
                status_code: 0,
                headers: [],
                body: `Error: ${error.message}`,
                duration_ms: 0,
            });
        }
    });

    // Get native library status
    ipcMain.handle('native:getStatus', async () => {
        if (!nativeLib) {
            return { initialized: false, error: 'Not initialized' };
        }
        return {
            initialized: nativeLib.initialized,
            libraryPath: nativeLib.libraryPath,
        };
    });
}

async function createWindow() {
    // Initialize native library first
    await initializeNativeLibrary();

    // Setup IPC handlers
    setupIpcHandlers();

    const mainWindow = new BrowserWindow({
        title: 'Ababil Studio',
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // Use React dev server in development, build folder in production
    const startUrl =
        process.env.NODE_ENV === 'production'
            ? url.format({
                  pathname: path.join(__dirname, './build/index.html'),
                  protocol: 'file:',
                  slashes: true,
              })
            : 'http://localhost:3000';

    mainWindow.loadURL(startUrl);

    // Open DevTools in development
    if (process.env.NODE_ENV !== 'production') {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
