<template>
  <div class="video-generate-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">创建视频任务</h2>
    </div>

    <!-- Tab 切换 -->
    <div class="tab-switch">
      <button
        :class="['switch-btn', { active: activeTab === 'text2video' }]"
        type="button"
        @click="activeTab = 'text2video'"
      >文生视频</button>
      <button
        :class="['switch-btn', { active: activeTab === 'img2video' }]"
        type="button"
        @click="activeTab = 'img2video'"
      >图生视频</button>
    </div>

    <!-- 提示词输入 -->
    <div class="prompt-section">
      <textarea
        v-model="prompt"
        class="prompt-input"
        :placeholder="activeTab === 'img2video' ? '描述你想基于图片生成的视频...' : '描述你想生成的视频...'"
        rows="3"
      />
      <button class="template-btn" type="button" @click="templatePanelOpen = true">从模板选择</button>
    </div>

    <!-- 提示词模板面板 -->
    <PromptTemplatePanel
      :is-open="templatePanelOpen"
      @close="templatePanelOpen = false"
      @select="onTemplateSelect"
    />

    <!-- 图生视频：首帧和尾帧上传 -->
    <div v-if="activeTab === 'img2video' && params.mode !== 'multi_shot'" class="frames-section">
      <div class="frame-upload-group">
        <label class="section-label">首帧图片</label>
        <div v-if="headFrameImage" class="frame-preview-container">
          <img :src="headFrameImage" class="frame-preview-image" alt="首帧预览" />
          <button class="remove-frame-btn" @click="removeFrame('head')" type="button">×</button>
        </div>
        <button v-else class="upload-frame-btn" @click="triggerFrameUpload('head')" type="button">
          <span class="upload-icon">🖼️</span>
          <span>上传首帧</span>
        </button>
        <input ref="headFrameInput" type="file" accept="image/*" class="hidden-file-input" @change="onFrameUpload($event, 'head')" />
      </div>

      <div class="frame-upload-group">
        <label class="section-label">尾帧图片（可选）</label>
        <div v-if="tailFrameImage" class="frame-preview-container">
          <img :src="tailFrameImage" class="frame-preview-image" alt="尾帧预览" />
          <button class="remove-frame-btn" @click="removeFrame('tail')" type="button">×</button>
        </div>
        <button v-else class="upload-frame-btn" @click="triggerFrameUpload('tail')" type="button" :disabled="!headFrameImage">
          <span class="upload-icon">🖼️</span>
          <span>上传尾帧</span>
        </button>
        <input ref="tailFrameInput" type="file" accept="image/*" class="hidden-file-input" @change="onFrameUpload($event, 'tail')" />
        <p v-if="!headFrameImage" class="frame-hint">需要先上传首帧</p>
      </div>
    </div>

    <!-- 参数表单 -->
    <VideoParamsForm v-model="params" :show-frames="false" />

    <!-- 提交按钮 -->
    <button
      class="submit-btn"
      :disabled="!prompt.trim() || videoStore.submitting"
      @click="submit"
      type="button"
    >
      <span v-if="videoStore.submitting" class="spinner" />
      {{ videoStore.submitting ? '提交中...' : '生成视频' }}
    </button>

    <!-- Toast 提示 -->
    <Transition name="toast">
      <div v-if="toastVisible" class="toast">{{ toastMsg }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useVideoTaskStore } from '../store/videoTaskStore'
import { useUiStore } from '../store/uiStore'
import VideoParamsForm from '../components/VideoParamsForm.vue'
import VideoTaskCard from '../components/VideoTaskCard.vue'
import PromptTemplatePanel from '../components/PromptTemplatePanel.vue'
import type { VideoSubmitParams } from '@shared/types/video'

const videoStore = useVideoTaskStore()
const uiStore = useUiStore()
const activeTab = ref<'text2video' | 'img2video'>('text2video')
const prompt = ref('')
const templatePanelOpen = ref(false)

const params = ref<VideoSubmitParams>({
  prompt: '',
  duration: 5,
  aspect_ratio: '16:9',
  mode: 'std',
})

// 首帧和尾帧上传相关
const headFrameInput = ref<HTMLInputElement | null>(null)
const tailFrameInput = ref<HTMLInputElement | null>(null)
const headFrameImage = ref<string | null>(null)
const tailFrameImage = ref<string | null>(null)

// Toast
const toastMsg = ref('')
const toastVisible = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMsg.value = msg
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 2500)
}

onMounted(() => {
  const reuse = sessionStorage.getItem('linglan-reuse-prompt')
  if (reuse) {
    prompt.value = reuse
    sessionStorage.removeItem('linglan-reuse-prompt')
  }
})

async function submit() {
  if (!prompt.value.trim() || videoStore.submitting) return

  // 如果是图生视频模式，设置首帧和尾帧
  if (activeTab.value === 'img2video') {
    if (headFrameImage.value) {
      params.value.image_url = headFrameImage.value
    }
    if (tailFrameImage.value) {
      params.value.image_tail_url = tailFrameImage.value
    }
  }

  const result = await videoStore.submitTask({ ...params.value, prompt: prompt.value.trim() })
  if (result.success) {
    uiStore.switchTab('taskHistory')
  } else if (result.error) {
    showToast(result.error)
  }
}

function onTemplateSelect(content: string) {
  prompt.value = content
}

// 首帧和尾帧上传处理函数
function triggerFrameUpload(type: 'head' | 'tail') {
  if (type === 'head') {
    headFrameInput.value?.click()
  } else {
    tailFrameInput.value?.click()
  }
}

function onFrameUpload(event: Event, type: 'head' | 'tail') {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    if (type === 'head') {
      headFrameImage.value = dataUrl
    } else {
      tailFrameImage.value = dataUrl
    }
  }
  reader.readAsDataURL(file)
}

function removeFrame(type: 'head' | 'tail') {
  if (type === 'head') {
    headFrameImage.value = null
    // 如果移除首帧，也要移除尾帧（因为尾帧必须有首帧）
    tailFrameImage.value = null
    if (headFrameInput.value) headFrameInput.value.value = ''
    if (tailFrameInput.value) tailFrameInput.value.value = ''
  } else {
    tailFrameImage.value = null
    if (tailFrameInput.value) tailFrameInput.value.value = ''
  }
}
</script>

<style scoped>
.video-generate-page {
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
.prompt-section { display: flex; flex-direction: column; gap: 8px; }
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
}
.prompt-input:focus { outline: none; border-color: #6c63ff; }
.template-btn {
  align-self: flex-start;
  background: none;
  border: 1px solid #444;
  border-radius: 8px;
  color: #888;
  padding: 5px 12px;
  font-size: 12px;
  cursor: pointer;
}
.template-btn:hover { border-color: #6c63ff; color: #a89fff; }
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
.section-title { font-size: 14px; color: #888; margin: 0 0 8px; }
.task-list { display: flex; flex-direction: column; gap: 20px; }
.empty-hint { text-align: center; color: #555; font-size: 13px; padding: 24px 0; }

/* 首帧和尾帧上传区域 */
.frames-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.frame-upload-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.section-label {
  font-size: 13px;
  color: #888;
  font-weight: 500;
}
.upload-frame-btn {
  width: 100%;
  height: 140px;
  background: #1a1a1a;
  border: 2px dashed #444;
  border-radius: 10px;
  color: #888;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
}
.upload-frame-btn:hover:not(:disabled) {
  border-color: #6c63ff;
  background: #1f1f1f;
  color: #a89fff;
}
.upload-frame-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.upload-icon {
  font-size: 28px;
}
.frame-preview-container {
  position: relative;
  width: 100%;
  height: 140px;
  border-radius: 10px;
  overflow: hidden;
  background: #1a1a1a;
  border: 1px solid #333;
}
.frame-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.remove-frame-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(229, 62, 62, 0.9);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  transition: background 0.2s;
  backdrop-filter: blur(4px);
}
.remove-frame-btn:hover {
  background: rgba(229, 62, 62, 1);
}
.frame-hint {
  font-size: 11px;
  color: #666;
  margin: 0;
  text-align: center;
}
.hidden-file-input {
  display: none;
}

/* Toast 提示 */
.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 9999;
  max-width: 80%;
  text-align: center;
  backdrop-filter: blur(10px);
}
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
</style>
