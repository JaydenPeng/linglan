/**
 * 跨平台密钥存储服务
 * Capacitor 环境使用 Preferences API（原生存储）
 */

import { Preferences } from '@capacitor/preferences'

export async function getItem(key: string): Promise<string | null> {
  const { value } = await Preferences.get({ key })
  return value
}

export async function setItem(key: string, value: string): Promise<void> {
  await Preferences.set({ key, value })
}

export async function removeItem(key: string): Promise<void> {
  await Preferences.remove({ key })
}
