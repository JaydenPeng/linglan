<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>任务列表</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/create">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="taskStore.tasks.length === 0" class="empty-state">
        <ion-icon :icon="imagesOutline" size="large" />
        <p>还没有任务，点击右上角开始创建</p>
      </div>

      <TaskCard
        v-for="task in taskStore.tasks"
        :key="task.id"
        :task="task"
        @preview="openPreview"
        @retry="handleRetry"
        @cancel="handleCancel"
      />
    </ion-content>

    <!-- 全屏预览（Plan 05 实现，此处预留插槽） -->
    <ImagePreviewModal
      v-if="previewState"
      :task="previewState.task"
      :initial-index="previewState.index"
      @close="previewState = null"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon
} from '@ionic/vue'
import { addOutline, imagesOutline } from 'ionicons/icons'
import { useTaskStore } from '../stores/taskStore'
import { TaskStatus } from '../types/image'
import type { ImageTask } from '../types/image'
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
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; height: 60vh; gap: 16px;
  color: var(--ion-color-medium);
}
</style>
