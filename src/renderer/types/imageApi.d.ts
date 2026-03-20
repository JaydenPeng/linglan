import type { ImageParams } from '../../types/image'

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

export {}
