import { ipcMain, BrowserWindow, dialog, shell } from 'electron'
import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'
import type { ImageParams } from '../types/image'
import { IPC_CHANNELS, TaskStatus } from '../types/image'
import { signRequest } from './api/hmacSigner'
import { getCredentials } from './store/configStore'

const JIMENG_HOST = 'visual.volcengineapi.com'
const POLL_INTERVAL_MS = 3000
const MAX_POLL_COUNT = 200 // 10 分钟上限

// 活跃轮询 Map：localId -> intervalId
const activePollers = new Map<string, ReturnType<typeof setInterval>>()

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
  _win?.webContents.send(IPC_CHANNELS.IMAGE_LOG, payload)
}

function httpsRequest(options: https.RequestOptions, body?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data)
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

// 提交图片生成任务，返回 job_id
async function submitImageTask(params: ImageParams): Promise<{ taskId: string; reqKey: string }> {
  const ak = getCredentials('jimeng_ak')
  const sk = getCredentials('jimeng_sk')
  if (!ak || !sk) {
    throw new Error('即梦 API 密钥未配置，请在设置中填写 AK/SK')
  }

  const body = JSON.stringify({
    req_key: params.ref_image ? 'img2img_xl_sft' : 'high_aes_general_v21_L',
    prompt: params.prompt,
    width: params.width ?? 1024,
    height: params.height ?? 1024,
    return_url: true,
    ...(params.force_single && { use_sr: false, ddim_steps: 25 }),
    ...(params.ref_image && { binary_data_base64: [params.ref_image] }),
  })

  const query = 'Action=CVSync2AsyncSubmitTask&Version=2022-08-31'
  const reqPath = `/?${query}`
  const headers = signRequest('POST', reqPath, body, ak, sk)

  const url = `https://${JIMENG_HOST}${reqPath}`

  try {
    const raw = await httpsRequest(
      {
        hostname: JIMENG_HOST,
        path: reqPath,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      body
    )
    // const raw = `{"code":10000,"data":{"task_id":"5294140511646776242"},"message":"Success","request_id":"202603222142503BCD7FA620BE186AAFEB","status":10000,"time_elapsed":"155.327601ms"}`
    const data = JSON.parse(raw)
    pushLog({ method: 'POST', url, level: 'info', message: '提交图片任务', requestBody: body, responseBody: raw })

    if (data.code !== 10000) {
      throw new Error(data.message ?? '提交任务失败')
    }
    return { taskId: data.data.task_id as string, reqKey: params.ref_image ? 'img2img_xl_sft' : 'high_aes_general_v21_L' }
  } catch (err) {
    pushLog({ method: 'POST', url, level: 'error', error: String(err) })
    throw err
  }
}

// 查询任务状态
async function queryTaskStatus(
  jobId: string,
  reqKey: string
): Promise<{ status: TaskStatus; urls?: string[]; error?: string }> {
  const ak = getCredentials('jimeng_ak')
  const sk = getCredentials('jimeng_sk')
  if (!ak || !sk) {
    throw new Error('即梦 API 密钥未配置')
  }

  const query = `Action=CVSync2AsyncGetResult&Version=2022-08-31`
  const reqPath = `/?${query}`
  const body = JSON.stringify({
    req_key: reqKey,
    task_id: jobId,
    req_json: JSON.stringify({ return_url: true })
  })
  const headers = signRequest('POST', reqPath, body, ak, sk)
  const url = `https://${JIMENG_HOST}${reqPath}`

  pushLog({ method: 'POST', url, level: 'info', message: `轮询任务状态 task_id=${jobId}` })

  try {
    const raw = await httpsRequest({
      hostname: JIMENG_HOST,
      path: reqPath,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(body),
      },
    }, body)

    const data = JSON.parse(raw)
    const jobStatus = data.data?.status

    pushLog({ method: 'POST', url, level: 'info', message: `任务状态: ${jobStatus}`, responseBody: raw })

    if (jobStatus === 'done') {
      const urls = data.data?.image_urls ?? []
      return { status: TaskStatus.SUCCESS, urls }
    } else if (jobStatus === 'failed') {
      return { status: TaskStatus.FAILED, error: data.message ?? '生成失败' }
    } else {
      return { status: TaskStatus.PROCESSING }
    }
  } catch (err) {
    pushLog({ method: 'POST', url, level: 'error', error: String(err) })
    throw err
  }
}

// 启动轮询
function startPolling(localId: string, jobId: string, reqKey: string, win: BrowserWindow): void {
  let count = 0
  const timer = setInterval(async () => {
    count++
    if (count > MAX_POLL_COUNT) {
      clearInterval(timer)
      activePollers.delete(localId)
      win.webContents.send(IPC_CHANNELS.IMAGE_STATUS_UPDATE, {
        localId,
        patch: { status: TaskStatus.FAILED, errorMsg: '任务超时' },
      })
      return
    }

    try {
      const result = await queryTaskStatus(jobId, reqKey)
      if (result.status !== TaskStatus.PROCESSING) {
        clearInterval(timer)
        activePollers.delete(localId)
      }
      win.webContents.send(IPC_CHANNELS.IMAGE_STATUS_UPDATE, {
        localId,
        patch: {
          status: result.status,
          ...(result.urls && { resultUrls: result.urls }),
          ...(result.error && { errorMsg: result.error }),
        },
      })
    } catch {
      // 网络错误不停止轮询，继续重试
    }
  }, POLL_INTERVAL_MS)

  activePollers.set(localId, timer)
}

// 注册 IPC 处理器（在主进程 ready 后调用）
export function registerImageHandlers(win: BrowserWindow): void {
  _win = win
  ipcMain.handle(IPC_CHANNELS.IMAGE_SUBMIT, async (_event, localId: string, params: ImageParams) => {
    try {
      const { taskId, reqKey } = await submitImageTask(params)
      // 立即推送 PROCESSING 状态
      win.webContents.send(IPC_CHANNELS.IMAGE_STATUS_UPDATE, {
        localId,
        patch: { status: TaskStatus.PROCESSING, jobId: taskId },
      })
      startPolling(localId, taskId, reqKey, win)
      return { jobId: taskId }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.IMAGE_CANCEL, async (_event, localId: string) => {
    const timer = activePollers.get(localId)
    if (timer) {
      clearInterval(timer)
      activePollers.delete(localId)
    }
    win.webContents.send(IPC_CHANNELS.IMAGE_STATUS_UPDATE, {
      localId,
      patch: { status: TaskStatus.CANCELLED },
    })
  })

  // 下载图片到本地：弹出保存对话框，下载 URL 内容并写入文件
  ipcMain.handle(IPC_CHANNELS.IMAGE_DOWNLOAD, async (_event, url: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const ext = url.includes('.png') ? 'png' : 'jpg'
      const defaultName = `linglan_${Date.now()}.${ext}`
      const { filePath, canceled } = await dialog.showSaveDialog(win, {
        defaultPath: defaultName,
        filters: [{ name: '图片', extensions: ['jpg', 'png', 'webp'] }],
      })
      if (canceled || !filePath) return { ok: false }

      const buffer = await new Promise<Buffer>((resolve, reject) => {
        https.get(url, (res) => {
          const chunks: Buffer[] = []
          res.on('data', (chunk: Buffer) => chunks.push(chunk))
          res.on('end', () => resolve(Buffer.concat(chunks)))
          res.on('error', reject)
        }).on('error', reject)
      })

      fs.writeFileSync(filePath, buffer)
      // 下载完成后在文件管理器中高亮显示
      shell.showItemInFolder(filePath)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })
}
