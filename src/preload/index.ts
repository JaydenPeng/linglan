import { contextBridge, ipcRenderer } from 'electron'
import type { ConfigStatus, SaveConfigPayload, IpcResult } from '../shared/types'
import type { ImageParams } from '../types/image'
import { IPC_CHANNELS } from '../types/image'
import type { VideoSubmitParams, VideoTask } from '../shared/types/video'
import { VIDEO_IPC_CHANNELS } from '../shared/types/video'

const electronAPI = {
  getConfigStatus: (): Promise<IpcResult<ConfigStatus>> =>
    ipcRenderer.invoke('config:get-status'),

  saveConfig: (payload: SaveConfigPayload): Promise<IpcResult> =>
    ipcRenderer.invoke('config:save', payload),

  clearConfig: (provider: 'jimeng' | 'kling'): Promise<IpcResult> =>
    ipcRenderer.invoke('config:clear', provider),

  // 视频 API
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]): Promise<any> => {
      // 只允许视频相关的 IPC 通道
      if (channel === 'video:submit' || channel === 'video:poll') {
        return ipcRenderer.invoke(channel, ...args)
      }
      throw new Error(`IPC channel ${channel} is not allowed`)
    }
  }
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
    return () => ipcRenderer.removeListener(IPC_CHANNELS.IMAGE_STATUS_UPDATE, handler)
  },

  onApiLog: (cb: (log: object) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, log: object) => cb(log)
    ipcRenderer.on(IPC_CHANNELS.IMAGE_LOG, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.IMAGE_LOG, handler)
  }
}

contextBridge.exposeInMainWorld('imageApi', imageApi)

export type ImageAPI = typeof imageApi

// --- videoApi ---

const videoApi = {
  onApiLog: (cb: (log: object) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, log: object) => cb(log)
    ipcRenderer.on(VIDEO_IPC_CHANNELS.VIDEO_LOG, handler)
    return () => ipcRenderer.removeListener(VIDEO_IPC_CHANNELS.VIDEO_LOG, handler)
  }
}

contextBridge.exposeInMainWorld('videoApi', videoApi)

export type VideoAPI = typeof videoApi

declare global {
  interface Window {
    imageApi: {
      submit: (localId: string, params: ImageParams) => Promise<{ jobId: string }>
      cancel: (localId: string) => Promise<void>
      download: (url: string) => Promise<{ ok: boolean; error?: string }>
      onStatusUpdate: (cb: (update: { localId: string; patch: object }) => void) => () => void
      onApiLog: (cb: (log: object) => void) => () => void
    }
    videoApi: {
      onApiLog: (cb: (log: object) => void) => () => void
    }
  }
}
