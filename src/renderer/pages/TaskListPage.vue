<template>
  <div class="task-list-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">任务列表</h2>
    </div>

    <!-- 空状态 -->
    <div v-if="taskStore.tasks.length === 0" class="empty-state">
      <span class="empty-icon">🖼️</span>
      <p>还没有任务，切换到「图片」Tab 开始创建</p>
    </div>

    <!-- 任务卡片列表 -->
    <div v-else class="task-list">
      <TaskCard
        v-for="task in taskStore.tasks"
        :key="task.id"
        :task="task"
        @preview="openPreview"
        @retry="handleRetry"
        @cancel="handleCancel"
      />
    </div>

    <!-- 全屏预览 -->
    <ImagePreviewModal
      v-if="previewState"
      :task="previewState.task"
      :initial-index="previewState.index"
      @close="previewState = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTaskStore } from '../../stores/taskStore'
import { TaskStatus } from '../../types/image'
import type { ImageTask } from '../../types/image'
import TaskCard from '../components/TaskCard.vue'
import ImagePreviewModal from '../components/ImagePreviewModal.vue'

const taskStore = useTaskStore()
const previewState = ref<{ task: ImageTask; index: number } | null>(null)

let unsubscribe: (() => void) | null = null

onMounted(() => {
  // 监听主进程推送的状态更新
  unsubscribe = window.imageApi.onStatusUpdate(({ localId, patch }) => {
    taskStore.updateTask(localId, patch as Partial<ImageTask>)
  })
})

onUnmounted(() => {
  unsubscribe?.()
})

function openPreview(payload: { task: ImageTask; index: number }) {
  previewState.value = payload
}

async function handleRetry(task: ImageTask) {
  const newId = crypto.randomUUID()
  taskStore.addTask({
    ...task,
    id: newId,
    jobId: undefined,
    status: TaskStatus.PENDING,
    resultUrls: undefined,
    errorMsg: undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
  try {
    await window.imageApi.submit(newId, task.params)
  } catch (err) {
    taskStore.updateTask(newId, { status: TaskStatus.FAILED, errorMsg: String(err) })
  }
}

async function handleCancel(task: ImageTask) {
  taskStore.cancelTask(task.id)
  await window.imageApi.cancel(task.id)
}
</script>

<style scoped>
.task-list-page {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
  max-width: 600px;
  margin: 0 auto;
}
.page-header { padding-bottom: 4px; }
.page-title { font-size: 18px; font-weight: 600; color: #eee; margin: 0; }
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 16px;
  color: #555;
}
.empty-icon { font-size: 48px; }
.empty-state p { font-size: 14px; text-align: center; }
.task-list { display: flex; flex-direction: column; gap: 0; }
</style>
