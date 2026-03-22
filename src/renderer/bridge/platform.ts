/**
 * 平台环境检测工具
 * 用于区分 Electron 和 Capacitor 运行环境
 */

export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electron
}

export function isCapacitor(): boolean {
  return typeof window !== 'undefined' &&
    !!(window as any).Capacitor?.isNativePlatform?.()
}
