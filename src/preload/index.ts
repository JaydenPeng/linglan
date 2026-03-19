import { contextBridge, ipcRenderer } from 'electron'
import type { ConfigStatus, SaveConfigPayload, IpcResult } from '../shared/types'
import type { ImageParams } from '../types/image'
import { IPC_CHANNELS } from '../types/image'

const electronAPI = {
  getConfigStatus: (): Promise<IpcResult<ConfigStatus>> =>
    ipcRenderer.invoke('config:getStatus'),

  saveConfig: (payload: SaveConfigPayload): Promise<IpcResult> =>
    ipcRenderer.invoke('config:save', payload),

  clearConfig: (provider: 'jimeng' | 'kling'): Promise<IpcResult> =>
    ipcRenderer.invoke('config:clear', provider)
}

contextBridge.exposeInMainWorld('electron', electronAPI)

export type ElectronAPI = typeof electronAPI

// --- imageApi ---

const imageApi = {
  submit: (localId: string, params: ImageParams): Promise<{ jobId: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.IMAGE_SUBMIT, localId, params),

  cancel: (localId: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.IMAGE_CANCEL, localId),

  download: (url: string): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.IMAGE_DOWNLOAD, url),

  onStatusUpdate: (cb: (update: { localId: string; patch: object }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, update: { localId: string; patch: object }) => cb(update)
    ipcRenderer.on(IPC_CHANNELS.IMAGE_STATUS_UPDATE, handler)
    // 返回取消订阅函数
    return () => ipcRenderer.removeListener(IPC_CHANNELS.IMAGE_STATUS_UPDATE, handler)
  }
}

contextBridge.exposeInMainWorld('imageApi', imageApi)

export type ImageAPI = typeof imageApi

declare global {
  interface Window {
    imageApi: {
      submit: (localId: string, params: ImageParams) => Promise<{ jobId: string }>
      cancel: (localId: string) => Promise<void>
      download: (url: string) => Promise<{ ok: boolean; error?: string }>
      onStatusUpdate: (cb: (update: { localId: string; patch: object }) => void) => () => void
    }
  }
}
