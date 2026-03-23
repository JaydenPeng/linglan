import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { registerVideoHandlers } from './ipc/videoHandlers'
import { registerConfigHandlers } from './ipc/configHandlers'
import { registerImageHandlers } from './imageHandler'

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 393,
    height: 852,
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
  Menu.setApplicationMenu(null)  // 隐藏菜单栏，必须在 app ready 后调用
  registerConfigHandlers()  // IPC 处理器在 app.whenReady 后注册（safeStorage 需要 app 就绪）
  const win = createWindow()
  registerVideoHandlers(ipcMain, win)
  registerImageHandlers(win)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
