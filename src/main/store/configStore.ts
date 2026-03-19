import Store from 'electron-store'
import { safeStorage } from 'electron'

const store = new Store<Record<string, string>>()

export function saveCredentials(key: string, value: string): void {
  // safeStorage 必须在 app.whenReady 后调用（IPC handler 中调用时 app 已就绪）
  const encrypted = safeStorage.encryptString(value)
  store.set(key, encrypted.toString('base64'))
}

export function getCredentials(key: string): string | null {
  const raw = store.get(key)
  if (!raw) return null
  try {
    return safeStorage.decryptString(Buffer.from(raw, 'base64'))
  } catch {
    return null
  }
}

export function hasCredentials(key: string): boolean {
  return !!store.get(key)
}
