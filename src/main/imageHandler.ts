import { ipcMain, BrowserWindow } from 'electron'
import * as https from 'https'
import type { ImageParams } from '../types/image'
import { IPC_CHANNELS, TaskStatus } from '../types/image'
import { signRequest } from './api/hmacSigner'
import { getCredentials } from './store/configStore'

const JIMENG_HOST = 'visual.volcengineapi.com'
const POLL_INTERVAL_MS = 3000
const MAX_POLL_COUNT = 200 // 10 分钟上限

// 活跃轮询 Map：localId -> intervalId
const activePollers = new Map<string, ReturnType<typeof setInterval>>()

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
async function submitImageTask(params: ImageParams): Promise<string> {
  const ak = getCredentials('jiMengAk')
  const sk = getCredentials('jiMengSk')
  if (!ak || !sk) {
    throw new Error('即梦 API 密钥未配置，请在设置中填写 AK/SK')
  }

  const body = JSON.stringify({
    req_key: params.ref_image ? 'img2img_xl_sft' : 'high_aes_general_v21_L',
    prompt: params.prompt,
    width: params.width ?? 1024,
    height: params.height ?? 1024,
    return_url: true, // 必须为 true，否则返回 base64 数据
    ...(params.force_single && { use_sr: false, ddim_steps: 25 }),
    ...(params.ref_image && { binary_data_base64: [params.ref_image] }),
  })

  const query = 'Action=CVSync2AsyncSubmitTask&Version=2022-08-31'
  const path = `/?${query}`
  const headers = signRequest('POST', path, body, ak, sk)

  const raw = await httpsRequest(
    {
      hostname: JIMENG_HOST,
      path,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(body),
      },
    },
    body
  )

  const data = JSON.parse(raw)
  if (data.ResponseMetadata?.Error) {
    throw new Error(data.ResponseMetadata.Error.Message ?? '提交任务失败')
  }
  return data.Result.job_id as string
}

// 查询任务状态
async function queryTaskStatus(
  jobId: string
): Promise<{ status: TaskStatus; urls?: string[]; error?: string }> {
  const ak = getCredentials('jiMengAk')
  const sk = getCredentials('jiMengSk')
  if (!ak || !sk) {
    throw new Error('即梦 API 密钥未配置')
  }

  const query = `Action=CVSync2AsyncGetResult&Version=2022-08-31&job_id=${encodeURIComponent(jobId)}`
  const path = `/?${query}`
  const headers = signRequest('GET', path, '', ak, sk)

  const raw = await httpsRequest({
    hostname: JIMENG_HOST,
    path,
    method: 'GET',
    headers,
  })

  const data = JSON.parse(raw)
  const jobStatus = data.Result?.job_status

  if (jobStatus === 'done') {
    const urls = (data.Result?.images ?? []).map((img: { url: string }) => img.url)
    return { status: TaskStatus.SUCCESS, urls }
  } else if (jobStatus === 'failed') {
    return { status: TaskStatus.FAILED, error: data.Result?.message ?? '生成失败' }
  } else {
    return { status: TaskStatus.PROCESSING }
  }
}

// 启动轮询
function startPolling(localId: string, jobId: string, win: BrowserWindow): void {
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
      const result = await queryTaskStatus(jobId)
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
  ipcMain.handle(IPC_CHANNELS.IMAGE_SUBMIT, async (_event, localId: string, params: ImageParams) => {
    try {
      const jobId = await submitImageTask(params)
      // 立即推送 PROCESSING 状态
      win.webContents.send(IPC_CHANNELS.IMAGE_STATUS_UPDATE, {
        localId,
        patch: { status: TaskStatus.PROCESSING, jobId },
      })
      startPolling(localId, jobId, win)
      return { jobId }
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
}
