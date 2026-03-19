<template>
  <div class="video-generate-page">
    <!-- 提示词输入 -->
    <div class="prompt-section">
      <textarea
        v-model="prompt"
        class="prompt-input"
        placeholder="描述你想生成的视频..."
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

    <!-- 参数表单 -->
    <VideoParamsForm v-model="params" />

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

    <!-- 任务列表 -->
    <div v-if="videoStore.tasks.length > 0" class="task-list">
      <h3 class="section-title">生成记录</h3>
      <VideoTaskCard
        v-for="task in videoStore.tasks"
        :key="task.task_id"
        :task="task"
      />
    </div>
    <div v-else class="empty-hint">暂无生成记录，填写参数后点击"生成视频"开始</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useVideoTaskStore } from '../store/videoTaskStore'
import VideoParamsForm from '../components/VideoParamsForm.vue'
import VideoTaskCard from '../components/VideoTaskCard.vue'
import PromptTemplatePanel from '../components/PromptTemplatePanel.vue'
import type { VideoSubmitParams } from '@shared/types/video'

const videoStore = useVideoTaskStore()
const prompt = ref('')
const templatePanelOpen = ref(false)

const params = reactive<VideoSubmitParams>({
  prompt: '',
  duration: 5,
  aspect_ratio: '16:9',
  mode: 'std',
})

onMounted(() => {
  const reuse = sessionStorage.getItem('linglan-reuse-prompt')
  if (reuse) {
    prompt.value = reuse
    sessionStorage.removeItem('linglan-reuse-prompt')
  }
})

async function submit() {
  if (!prompt.value.trim() || videoStore.submitting) return
  await videoStore.submitTask({ ...params, prompt: prompt.value.trim() })
}

function onTemplateSelect(content: string) {
  prompt.value = content
}
</script>

<style scoped>
.video-generate-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}
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
.task-list { display: flex; flex-direction: column; gap: 12px; }
.empty-hint { text-align: center; color: #555; font-size: 13px; padding: 24px 0; }
</style>
