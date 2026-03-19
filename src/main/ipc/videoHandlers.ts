import type { IpcMain } from 'electron'
import type { VideoSubmitParams } from '../../shared/types/video'
import { submitVideoTask, pollVideoTask } from '../api/klingVideoApi'
import { getCredentials } from '../store/configStore'
import { getKlingToken } from '../auth/jwtSigner'

export function registerVideoHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('video:submit', async (_event, params: VideoSubmitParams) => {
    try {
      const ak = getCredentials('klingAk')
      const sk = getCredentials('klingSk')
      if (!ak || !sk) {
        return { error: '可灵 API 密钥未配置，请在设置中填写 AK/SK' }
      }
      const token = await getKlingToken(ak, sk)
      const taskId = await submitVideoTask(params, token)
      return { task_id: taskId }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('video:poll', async (_event, { task_id }: { task_id: string }) => {
    try {
      const ak = getCredentials('klingAk')
      const sk = getCredentials('klingSk')
      if (!ak || !sk) {
        return { error: '可灵 API 密钥未配置，请在设置中填写 AK/SK' }
      }
      const token = await getKlingToken(ak, sk)
      return await pollVideoTask(task_id, token)
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }
  })
}
