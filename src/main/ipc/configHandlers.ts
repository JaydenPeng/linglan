import { ipcMain } from 'electron'
import { saveCredentials, getCredentials, hasCredentials } from '../store/configStore'
import { buildJimengAuthHeaders } from '../auth/hmacSigner'
import { getKlingToken } from '../auth/jwtSigner'
import type { SaveConfigPayload, ConfigStatus, IpcResult } from '../../shared/types'

export function registerConfigHandlers(): void {
  ipcMain.handle('config:save', async (_event, payload: SaveConfigPayload): Promise<IpcResult> => {
    try {
      if (payload.jimengAk) saveCredentials('jimeng_ak', payload.jimengAk)
      if (payload.jimengSk) saveCredentials('jimeng_sk', payload.jimengSk)
      if (payload.klingAk) saveCredentials('kling_ak', payload.klingAk)
      if (payload.klingSk) saveCredentials('kling_sk', payload.klingSk)
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('config:get-status', async (): Promise<IpcResult<ConfigStatus>> => {
    return {
      success: true,
      data: {
        jimengConfigured: hasCredentials('jimeng_ak') && hasCredentials('jimeng_sk'),
        klingConfigured: hasCredentials('kling_ak') && hasCredentials('kling_sk'),
      }
    }
  })

  ipcMain.handle('config:verify-jimeng', async (): Promise<IpcResult> => {
    const ak = getCredentials('jimeng_ak')
    const sk = getCredentials('jimeng_sk')
    if (!ak || !sk) return { success: false, error: '即梦密钥未配置' }
    try {
      // 只验证签名逻辑，不发网络请求
      buildJimengAuthHeaders(ak, sk, 'CVSync2AsyncSubmitTask', '{}')
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('config:verify-kling', async (): Promise<IpcResult> => {
    const ak = getCredentials('kling_ak')
    const sk = getCredentials('kling_sk')
    if (!ak || !sk) return { success: false, error: '可灵密钥未配置' }
    try {
      await getKlingToken(ak, sk)
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })
}
