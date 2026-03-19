<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>创建任务</ion-title>
      </ion-toolbar>
      <!-- Tab 切换 -->
      <ion-segment v-model="activeTab">
        <ion-segment-button value="text2img">文生图</ion-segment-button>
        <ion-segment-button value="img2img">图生图</ion-segment-button>
      </ion-segment>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- 提示词输入 -->
      <ion-textarea
        v-model="prompt"
        placeholder="描述你想生成的图片..."
        :auto-grow="true"
        :rows="3"
        class="prompt-input"
      />

      <!-- 图生图：参考图上传 -->
      <div v-if="activeTab === 'img2img'" class="ref-image-area" @click="pickRefImage">
        <img v-if="refImagePreview" :src="refImagePreview" class="ref-preview" />
        <div v-else class="ref-placeholder">
          <ion-icon :icon="imageOutline" />
          <span>点击上传参考图片</span>
        </div>
      </div>

      <!-- 参数配置（折叠） -->
      <ImageParamsPanel v-model="imageParams" />

      <!-- 提交按钮 -->
      <ion-button expand="block" :disabled="!prompt.trim() || submitting" @click="handleSubmit">
        {{ submitting ? '提交中...' : '开始生成' }}
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonTextarea, IonButton, IonIcon
} from '@ionic/vue'
import { imageOutline } from 'ionicons/icons'
import { useTaskStore } from '../stores/taskStore'
import { TaskStatus, TaskType } from '../types/image'
import type { ImageParams, ImageTask } from '../types/image'
import ImageParamsPanel from '../components/ImageParamsPanel.vue'

const router = useRouter()
const taskStore = useTaskStore()

const activeTab = ref<'text2img' | 'img2img'>('text2img')
const prompt = ref('')
const refImageBase64 = ref<string>('')
const refImagePreview = ref<string>('')
const imageParams = ref<Partial<ImageParams>>({ aspect_ratio: '1:1', force_single: false })
const submitting = ref(false)

async function pickRefImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      refImagePreview.value = result
      // 去掉 data:image/xxx;base64, 前缀
      refImageBase64.value = result.split(',')[1]
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

async function handleSubmit() {
  if (!prompt.value.trim() || submitting.value) return
  submitting.value = true

  const localId = crypto.randomUUID()
  const params: ImageParams = {
    prompt: prompt.value.trim(),
    ...imageParams.value,
    ...(activeTab.value === 'img2img' && refImageBase64.value
      ? { ref_image: refImageBase64.value }
      : {}),
  }

  const task: ImageTask = {
    id: localId,
    type: activeTab.value === 'text2img' ? TaskType.TEXT_TO_IMAGE : TaskType.IMAGE_TO_IMAGE,
    status: TaskStatus.PENDING,
    params,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  taskStore.addTask(task)

  try {
    await window.imageApi.submit(localId, params)
  } catch (err) {
    taskStore.updateTask(localId, { status: TaskStatus.FAILED, errorMsg: String(err) })
  } finally {
    submitting.value = false
  }

  // 提交后跳转任务列表
  router.push('/tasks')
}
</script>

<style scoped>
.prompt-input { margin-bottom: 16px; }
.ref-image-area {
  border: 2px dashed var(--ion-color-medium);
  border-radius: 12px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  cursor: pointer;
  overflow: hidden;
}
.ref-preview { width: 100%; height: 100%; object-fit: cover; }
.ref-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--ion-color-medium); }
</style>
