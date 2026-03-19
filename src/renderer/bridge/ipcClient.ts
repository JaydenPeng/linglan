import type { ConfigStatus, SaveConfigPayload, IpcResult } from '../../shared/types'
import type { VideoSubmitParams, VideoTask } from '../../shared/types/video'

declare global {
  interface Window {
    electron: {
      getConfigStatus(): Promise<IpcResult<ConfigStatus>>
      saveConfig(payload: SaveConfigPayload): Promise<IpcResult>
      clearConfig(provider: 'jimeng' | 'kling'): Promise<IpcResult>
      ipcRenderer: {
        invoke(channel: 'video:submit', params: VideoSubmitParams): Promise<{ task_id: string } | { error: string }>
        invoke(channel: 'video:poll', params: { task_id: string }): Promise<VideoTask | { error: string }>
        invoke(channel: 'image:download', params: { url: string; filename: string }): Promise<IpcResult>
        invoke(channel: string, ...args: unknown[]): Promise<unknown>
      }
    }
  }
}

export {}
