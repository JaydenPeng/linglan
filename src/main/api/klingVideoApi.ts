import * as https from 'https'
import type { VideoSubmitParams, VideoTask } from '../../shared/types/video'

const KLING_BASE = 'api.klingai.com'

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
  jwtToken: string
): Promise<string> {
  const body = JSON.stringify({
    prompt: params.prompt,
    ...(params.image_url ? { image_url: params.image_url } : {}),
    ...(params.image_tail_url ? { image_tail_url: params.image_tail_url } : {}),
    duration: params.duration,
    aspect_ratio: params.aspect_ratio,
    mode: params.mode
  })

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

  const raw = await httpsRequest(options, body)
  const json = JSON.parse(raw)
  return json.data.task_id as string
}

export async function pollVideoTask(
  taskId: string,
  jwtToken: string
): Promise<VideoTask> {
  const options: https.RequestOptions = {
    hostname: KLING_BASE,
    path: `/v1/videos/omni-video/${taskId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  }

  const raw = await httpsRequest(options)
  const json = JSON.parse(raw)
  const d = json.data
  const videos: Array<{ url: string; cover_image_url?: string }> =
    d.task_result?.videos ?? []

  const task: VideoTask = {
    task_id: d.task_id,
    status: d.task_status,
    created_at: d.created_at,
    ...(videos[0]?.url ? { video_url: videos[0].url } : {}),
    ...(videos[0]?.cover_image_url ? { cover_url: videos[0].cover_image_url } : {}),
    ...(d.task_status_msg ? { error_message: d.task_status_msg } : {})
  }
  return task
}
