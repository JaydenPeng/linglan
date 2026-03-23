<template>
  <div class="task-history-page">
    <!-- 顶部切换栏 -->
    <div class="filter-bar">
      <button
        :class="['filter-btn', { active: activeView === 'tasks' }]"
        type="button"
        @click="activeView = 'tasks'"
      >任务</button>
      <button
        :class="['filter-btn', { active: activeView === 'favorites' }]"
        type="button"
        @click="activeView = 'favorites'"
      >收藏</button>
    </div>

    <!-- 任务视图 -->
    <div v-if="activeView === 'tasks'" class="view-content">
      <!-- 空状态 -->
      <div v-if="taskStore.tasks.length === 0 && videoStore.tasks.length === 0" class="empty-state">
        <span class="empty-icon">🖼️</span>
        <p>还没有任务，切换到「图片」或「视频」Tab 开始创建</p>
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
          @toggle-favorite="toggleImageFavorite"
        />
        <VideoTaskCard
          v-for="task in videoStore.tasks"
          :key="task.task_id"
          :task="task"
          @toggle-favorite="toggleVideoFavorite"
        />
      </div>
    </div>

    <!-- 收藏视图 -->
    <div v-else class="view-content">
      <!-- 空状态 -->
      <div v-if="favoriteTasks.length === 0" class="empty-state">
        <span class="empty-icon">⭐</span>
        <p>还没有收藏的任务</p>
        <p class="empty-hint-small">在任务卡片上右滑可以收藏</p>
      </div>

      <!-- 收藏任务列表 -->
      <div v-else class="task-list">
        <TaskCard
          v-for="task in favoriteImageTasks"
          :key="task.id"
          :task="task"
          @preview="openPreview"
          @retry="handleRetry"
          @cancel="handleCancel"
          @toggle-favorite="toggleImageFavorite"
        />
        <VideoTaskCard
          v-for="task in favoriteVideoTasks"
          :key="task.task_id"
          :task="task"
          @toggle-favorite="toggleVideoFavorite"
        />
      </div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTaskStore } from '../../stores/taskStore'
import { useHistoryStore } from '../store/historyStore'
import { useUiStore } from '../store/uiStore'
import { useVideoTaskStore } from '../store/videoTaskStore'
import { TaskStatus } from '../../types/image'
import type { ImageTask } from '../../types/image'
import TaskCard from '../components/TaskCard.vue'
import VideoTaskCard from '../components/VideoTaskCard.vue'
import ImagePreviewModal from '../components/ImagePreviewModal.vue'
import HistoryItem from '../components/HistoryItem.vue'

const taskStore = useTaskStore()
const historyStore = useHistoryStore()
const uiStore = useUiStore()
const videoStore = useVideoTaskStore()
const activeView = ref<'tasks' | 'favorites'>('tasks')
const previewState = ref<{ task: ImageTask; index: number } | null>(null)

const favoriteTasks = computed(() => [
  ...taskStore.tasks.filter(t => t.isFavorite),
  ...videoStore.tasks.filter(t => t.isFavorite)
])

const favoriteImageTasks = computed(() => taskStore.tasks.filter(t => t.isFavorite))
const favoriteVideoTasks = computed(() => videoStore.tasks.filter(t => t.isFavorite))

let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = window.imageApi.onStatusUpdate(({ localId, patch }) => {
    taskStore.updateTask(localId, patch as Partial<ImageTask>)
  })
})

onUnmounted(() => {
  unsubscribe?.()
})

function toggleImageFavorite(taskId: string) {
  taskStore.toggleFavorite(taskId)
}

function toggleVideoFavorite(taskId: string) {
  videoStore.toggleFavorite(taskId)
}

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

function onReusePrompt(prompt: string) {
  sessionStorage.setItem('linglan-reuse-prompt', prompt)
  uiStore.switchTab('video')
}
</script>

<style scoped>
.task-history-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filter-bar {
  display: flex;
  gap: 0;
  padding: 12px 16px;
  background: #0d0d0d;
  border-bottom: 1px solid #222;
  flex-shrink: 0;
}

.filter-btn {
  flex: 1;
  padding: 8px 16px;
  border: 1px solid #333;
  background: none;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-btn:first-child {
  border-radius: 8px 0 0 8px;
  border-right: none;
}

.filter-btn:last-child {
  border-radius: 0 8px 8px 0;
}

.filter-btn.active {
  background: #6c63ff;
  border-color: #6c63ff;
  color: #fff;
}

.view-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 16px;
  color: #555;
}

.empty-icon {
  font-size: 48px;
}

.empty-state p {
  font-size: 14px;
  text-align: center;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 600px;
  margin: 0 auto;
}

.history-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-btn-small {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid #333;
  background: none;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-btn-small.active {
  background: #6c63ff;
  border-color: #6c63ff;
  color: #fff;
}

.history-list {
  display: flex;
  flex-direction: column;
}

.empty-hint {
  text-align: center;
  color: #555;
  font-size: 13px;
  padding: 40px 0;
}

.empty-hint-small {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}
</style>
