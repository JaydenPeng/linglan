import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { VideoSubmitParams, VideoTask } from '@shared/types/video'

export const useVideoTaskStore = defineStore('videoTask', () => {
  const tasks = ref<VideoTask[]>([])

  const submitting = ref(false)

  // 轮询 interval map: task_id -> intervalId
  const pollingMap = new Map<string, ReturnType<typeof setInterval>>()

  function startPolling(task_id: string) {
    if (pollingMap.has(task_id)) return
    const id = setInterval(async () => {
      try {
        const result = await window.electron.ipcRenderer.invoke('video:poll', { task_id })
        if (result && !result.error) {
          const task = result as VideoTask
          const idx = tasks.value.findIndex(t => t.task_id === task_id)
          if (idx !== -1) {
            // 合并数据，保留原有的 prompt、aspect_ratio、duration、mode
            tasks.value[idx] = { ...tasks.value[idx], ...task }
          }
          if (task.status === 'succeed' || task.status === 'failed') {
            clearInterval(id)
            pollingMap.delete(task_id)
          }
        }
      } catch {
        // 轮询失败时静默忽略，下次继续
      }
    }, 3000)
    pollingMap.set(task_id, id)
  }

  async function submitTask(params: VideoSubmitParams): Promise<{ success: boolean; error?: string }> {
    submitting.value = true
    try {
      const result = await window.electron.ipcRenderer.invoke('video:submit', params)
      if (result && result.task_id) {
        const newTask: VideoTask = {
          task_id: result.task_id,
          status: 'submitted',
          prompt: params.prompt,
          aspect_ratio: params.aspect_ratio,
          duration: params.duration,
          mode: params.mode,
          created_at: Date.now(),
        }
        tasks.value.unshift(newTask)
        startPolling(result.task_id)
        return { success: true }
      } else if (result && result.error) {
        return { success: false, error: result.error }
      } else {
        return { success: false, error: '提交失败，请重试' }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '提交失败，请重试' }
    } finally {
      submitting.value = false
    }
  }

  function toggleFavorite(task_id: string) {
    const idx = tasks.value.findIndex(t => t.task_id === task_id)
    if (idx !== -1) {
      tasks.value[idx] = {
        ...tasks.value[idx],
        isFavorite: !tasks.value[idx].isFavorite
      }
    }
  }

  const favoriteTasks = () => tasks.value.filter(t => t.isFavorite)

  return { tasks, submitting, submitTask, toggleFavorite, favoriteTasks }
})
