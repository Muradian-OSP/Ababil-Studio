const { BrowserWindow, app } = require('electron');
const url = require('url');
const path = require('path');

function createWindow() {
    const mainWindow = new BrowserWindow({
        title: 'Ababil Studios',
        width: 1280,
        height: 800,
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
}
app.whenReady().then(createWindow);
