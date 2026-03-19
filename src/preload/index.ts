import { contextBridge, ipcRenderer } from 'electron'
import type { ConfigStatus, SaveConfigPayload, IpcResult } from '../shared/types'

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
