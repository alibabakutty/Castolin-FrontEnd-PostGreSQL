import { app, BrowserWindow } from 'electron';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
  });

  win.loadFile("dist/index.html"); // load the Vite build
}

app.whenReady().then(() => {
  createWindow();
});
