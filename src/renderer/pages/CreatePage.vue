<template>
  <div class="create-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">创建图片任务</h2>
    </div>

    <!-- Tab 切换 -->
    <div class="tab-switch">
      <button
        :class="['switch-btn', { active: activeTab === 'text2img' }]"
        type="button"
        @click="activeTab = 'text2img'"
      >文生图</button>
      <button
        :class="['switch-btn', { active: activeTab === 'img2img' }]"
        type="button"
        @click="activeTab = 'img2img'"
      >图生图</button>
    </div>

    <!-- 提示词输入 -->
    <textarea
      v-model="prompt"
      class="prompt-input"
      placeholder="描述你想生成的图片..."
      rows="4"
    />

    <!-- 图生图：参考图上传 -->
    <div v-if="activeTab === 'img2img'" class="ref-image-area" @click="pickRefImage">
      <img v-if="refImagePreview" :src="refImagePreview" class="ref-preview" />
      <div v-else class="ref-placeholder">
        <span class="ref-icon">🖼️</span>
        <span>点击上传参考图片</span>
      </div>
    </div>

    <!-- 参数配置（折叠） -->
    <ImageParamsPanel v-model="imageParams" />

    <!-- 提交按钮 -->
    <button
      class="submit-btn"
      :disabled="!prompt.trim() || submitting"
      @click="handleSubmit"
      type="button"
    >
      <span v-if="submitting" class="spinner" />
      {{ submitting ? '提交中...' : '开始生成' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTaskStore } from '../../stores/taskStore'
import { TaskStatus, TaskType } from '../../types/image'
import type { ImageParams, ImageTask } from '../../types/image'
import ImageParamsPanel from '../components/ImageParamsPanel.vue'

const emit = defineEmits<{ navigate: [tab: string] }>()

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
  emit('navigate', 'tasks')
}
</script>

<style scoped>
.create-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}
.page-header { padding-bottom: 4px; }
.page-title { font-size: 18px; font-weight: 600; color: #eee; margin: 0; }
.tab-switch {
  display: flex;
  background: #1a1a1a;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
  border: 1px solid #2a2a2a;
}
.switch-btn {
  flex: 1;
  background: none;
  border: none;
  color: #777;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.switch-btn.active { background: #2a2a2a; color: #eee; }
.switch-btn:hover:not(.active) { color: #aaa; }
.prompt-input {
  width: 100%;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 10px;
  color: #eee;
  padding: 10px 12px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}
.prompt-input:focus { outline: none; border-color: #6c63ff; }
.ref-image-area {
  border: 2px dashed #333;
  border-radius: 12px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.15s;
}
.ref-image-area:hover { border-color: #6c63ff; }
.ref-preview { width: 100%; height: 100%; object-fit: cover; }
.ref-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #555; }
.ref-icon { font-size: 32px; }
.submit-btn {
  padding: 12px;
  background: #6c63ff;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s;
}
.submit-btn:disabled { background: #3a3a5a; color: #666; cursor: not-allowed; }
.submit-btn:not(:disabled):hover { background: #5a52e0; }
.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
