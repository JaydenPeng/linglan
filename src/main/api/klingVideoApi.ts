import * as https from 'https'
import type { VideoSubmitParams, VideoTask } from '../../shared/types/video'

const KLING_BASE = 'api-beijing.klingai.com'

type PushLogFn = (payload: {
  method: string
  url: string
  level: 'info' | 'error'
  requestBody?: string
  responseBody?: string
  statusCode?: number
  message?: string
  error?: string
}) => void

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

export async function submitVideoTask(
  params: VideoSubmitParams,
  jwtToken: string,
  pushLog: PushLogFn
): Promise<string> {
  const imageList: Array<{ image_url: string; type?: 'first_frame' | 'end_frame' }> = []
  if (params.image_url) imageList.push({ image_url: params.image_url, type: 'first_frame' })
  if (params.image_tail_url) imageList.push({ image_url: params.image_tail_url, type: 'end_frame' })

  const body = JSON.stringify({
    prompt: params.prompt,
    ...(imageList.length > 0 ? { image_list: imageList } : {}),
    duration: String(params.duration),
    aspect_ratio: params.aspect_ratio,
    mode: params.mode
  })

  const url = `https://${KLING_BASE}/v1/videos/omni-video`
  const options: https.RequestOptions = {
    hostname: KLING_BASE,
    path: '/v1/videos/omni-video',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Length': Buffer.byteLength(body)
    }
  }

  console.log('[klingVideoApi] 提交视频任务', url, body)

  try {
    const raw = await httpsRequest(options, body)
    const json = JSON.parse(raw)

    pushLog({
      method: 'POST',
      url,
      level: 'info',
      message: '提交视频任务成功',
      requestBody: body,
      responseBody: raw
    })

    console.log('[klingVideoApi] 提交成功 raw:', raw)
    return json.data.task_id as string
  } catch (err) {
    pushLog({
      method: 'POST',
      url,
      level: 'error',
      message: '提交视频任务失败',
      requestBody: body,
      error: String(err)
    })
    throw err
  }
}

export async function pollVideoTask(
  taskId: string,
  jwtToken: string,
  pushLog: PushLogFn
): Promise<VideoTask> {
  const url = `https://${KLING_BASE}/v1/videos/omni-video/${taskId}`
  const options: https.RequestOptions = {
    hostname: KLING_BASE,
    path: `/v1/videos/omni-video/${taskId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  }

  pushLog({
    method: 'GET',
    url,
    level: 'info',
    message: `轮询视频任务状态 task_id=${taskId}`
  })

  console.log('[klingVideoApi] 轮询视频任务状态', url)

  try {
    const raw = await httpsRequest(options)
    const json = JSON.parse(raw)
    const d = json.data
    const videos: Array<{ url: string; cover_image_url?: string }> =
      d.task_result?.videos ?? []

    const jobStatus = d.task_status

    pushLog({
      method: 'GET',
      url,
      level: 'info',
      message: `视频任务状态: ${jobStatus}`,
      responseBody: raw
    })

    console.log('[klingVideoApi] 轮询响应 jobStatus:', jobStatus, 'raw:', raw)

    const task: VideoTask = {
      task_id: d.task_id,
      status: d.task_status,
      created_at: d.created_at,
      ...(videos[0]?.url ? { video_url: videos[0].url } : {}),
      ...(videos[0]?.cover_image_url ? { cover_url: videos[0].cover_image_url } : {}),
      ...(d.task_status_msg ? { error_message: d.task_status_msg } : {})
    }
    return task
  } catch (err) {
    pushLog({
      method: 'GET',
      url,
      level: 'error',
      message: '轮询视频任务失败',
      error: String(err)
    })
    throw err
  }
}
