import type { ConfigStatus, SaveConfigPayload, IpcResult } from '../../shared/types'

declare global {
  interface Window {
    electron: {
      getConfigStatus(): Promise<IpcResult<ConfigStatus>>
      saveConfig(payload: SaveConfigPayload): Promise<IpcResult>
      clearConfig(provider: 'jimeng' | 'kling'): Promise<IpcResult>
    }
  }
}

export {}
