import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { registerVideoHandlers } from './ipc/videoHandlers'
import { registerConfigHandlers } from './ipc/configHandlers'
import { registerImageHandlers } from './imageHandler'

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  registerConfigHandlers()  // IPC 处理器在 app.whenReady 后注册（safeStorage 需要 app 就绪）
  registerVideoHandlers(ipcMain)
  const win = createWindow()
  registerImageHandlers(win)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
