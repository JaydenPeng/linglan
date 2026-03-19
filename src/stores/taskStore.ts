import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ImageTask } from '../types/image'
import { TaskStatus } from '../types/image'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<ImageTask[]>([])

  function addTask(task: ImageTask) {
    tasks.value.unshift(task)  // 最新任务排在最前
  }

  function updateTask(id: string, patch: Partial<ImageTask>) {
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx !== -1) {
      tasks.value[idx] = { ...tasks.value[idx], ...patch, updatedAt: Date.now() }
    }
  }

  function cancelTask(id: string) {
    updateTask(id, { status: TaskStatus.CANCELLED })
  }

  // 按状态筛选
  const activeTasks = () => tasks.value.filter(
    t => t.status === TaskStatus.PENDING || t.status === TaskStatus.PROCESSING
  )

  return { tasks, addTask, updateTask, cancelTask, activeTasks }
})
