export interface ConfigStatus {
  jimengConfigured: boolean
  klingConfigured: boolean
}

export interface SaveConfigPayload {
  jimengAk?: string
  jimengSk?: string
  klingAk?: string
  klingSk?: string
}

export interface IpcResult<T = void> {
  success: boolean
  data?: T
  error?: string
}
