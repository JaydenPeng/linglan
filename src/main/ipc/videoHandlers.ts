import type { IpcMain, BrowserWindow } from 'electron'
import type { VideoSubmitParams } from '../../shared/types/video'
import { VIDEO_IPC_CHANNELS } from '../../shared/types/video'
import { pollVideoTask, submitVideoTask } from '../api/klingVideoApi'
import { getCredentials } from '../store/configStore'
import { getKlingToken } from '../auth/jwtSigner'
// import { submitVideoTask } from '../api/klingVideoApi'

// 日志推送辅助（win 可能还未初始化，用可选链）
let _win: BrowserWindow | null = null

function pushLog(payload: {
  method: string
  url: string
  level: 'info' | 'error'
  requestBody?: string
  responseBody?: string
  statusCode?: number
  message?: string
  error?: string
}) {
  _win?.webContents.send(VIDEO_IPC_CHANNELS.VIDEO_LOG, payload)
}

export function registerVideoHandlers(ipcMain: IpcMain, win: BrowserWindow): void {
  _win = win
  ipcMain.handle('video:submit', async (_event, params: VideoSubmitParams) => {
    try {
      // Mock 返回值，避免频繁调用第三方接口
      // const mockResponse = `{"code":0,"message":"SUCCEED","request_id":"393e82ba-31aa-466e-91d0-12859a4b3b02","data":{"task_id":"864729756657946682","task_status":"submitted","task_info":{},"created_at":${Date.now()},"updated_at":${Date.now()}}}`
      // const data = JSON.parse(mockResponse)
      // pushLog({
      //   method: 'POST',
      //   url: 'https://api-beijing.klingai.com/v1/videos/omni-video',
      //   level: 'info',
      //   message: '提交视频任务 (Mock)',
      //   requestBody: JSON.stringify(params),
      //   responseBody: mockResponse
      // })
      // return { task_id: data.data.task_id }

      const ak = getCredentials('kling_ak')
      const sk = getCredentials('kling_sk')
      if (!ak || !sk) {
        return { error: '可灵 API 密钥未配置，请在设置中填写 AK/SK' }
      }
      const token = await getKlingToken(ak, sk)
      pushLog({
        method: 'POST',
        url: 'https://api-beijing.klingai.com/v1/videos/omni-video',
        level: 'info',
        message: `AK长度=${ak.length} AK前2位=${ak.substring(0, 2)} SK长度=${sk.length}`
      })
      const taskId = await submitVideoTask(params, token, pushLog)
      return { task_id: taskId }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      pushLog({
        method: 'POST',
        url: 'https://api-beijing.klingai.com/v1/videos/omni-video',
        level: 'error',
        message: '提交视频任务失败',
        error: errorMsg
      })
      return { error: errorMsg }
    }
  })

  ipcMain.handle('video:poll', async (_event, { task_id }: { task_id: string }) => {
    try {
      // 真实调用：查询视频任务状态
      const ak = getCredentials('kling_ak')
      const sk = getCredentials('kling_sk')
      if (!ak || !sk) {
        return { error: '可灵 API 密钥未配置，请在设置中填写 AK/SK' }
      }
      const token = await getKlingToken(ak, sk)
      return await pollVideoTask(task_id, token, pushLog)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      pushLog({
        method: 'GET',
        url: `https://api-beijing.klingai.com/v1/videos/omni-video/${task_id}`,
        level: 'error',
        message: '轮询视频任务失败',
        error: errorMsg
      })
      return { error: errorMsg }
    }
  })
}
