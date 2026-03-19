<template>
  <div class="video-params-form">
    <!-- 时长滑块 -->
    <div class="form-group">
      <label>时长：{{ modelValue.duration }} 秒</label>
      <input
        type="range"
        min="3"
        max="15"
        step="1"
        :value="modelValue.duration"
        @input="update('duration', Number(($event.target as HTMLInputElement).value))"
        class="duration-range"
      />
      <div class="range-labels"><span>3s</span><span>15s</span></div>
    </div>

    <!-- 宽高比按钮组 -->
    <div class="form-group">
      <label>宽高比</label>
      <div class="ratio-group">
        <button
          v-for="ratio in ratios"
          :key="ratio.value"
          :class="['ratio-btn', { active: modelValue.aspect_ratio === ratio.value }]"
          @click="update('aspect_ratio', ratio.value)"
          type="button"
        >
          <span class="ratio-icon">{{ ratio.icon }}</span>
          <span>{{ ratio.value }}</span>
        </button>
      </div>
    </div>

    <!-- 模式选择 -->
    <div class="form-group">
      <label>生成模式</label>
      <div class="mode-group">
        <button
          v-for="mode in modes"
          :key="mode.value"
          :class="['mode-btn', { active: modelValue.mode === mode.value }, mode.value]"
          @click="update('mode', mode.value)"
          type="button"
        >
          {{ mode.label }}
          <span v-if="mode.value === 'multi_shot'" class="multi-badge">多镜头</span>
        </button>
      </div>
    </div>

    <!-- 首帧/尾帧上传 -->
    <div class="form-group frames-group">
      <div class="frame-upload">
        <label>首帧图片</label>
        <div v-if="headPreview" class="thumb-wrap">
          <img :src="headPreview" class="thumb" alt="首帧预览" />
          <button class="clear-btn" @click="clearFrame('head')" type="button">×</button>
        </div>
        <button v-else class="upload-btn" @click="triggerUpload('head')" type="button">+ 选择图片</button>
        <input ref="headInput" type="file" accept="image/*" class="hidden-input" @change="onFileChange($event, 'head')" />
      </div>
      <div class="frame-upload">
        <label>尾帧图片</label>
        <div v-if="tailPreview" class="thumb-wrap">
          <img :src="tailPreview" class="thumb" alt="尾帧预览" />
          <button class="clear-btn" @click="clearFrame('tail')" type="button">×</button>
        </div>
        <button v-else class="upload-btn" @click="triggerUpload('tail')" type="button">+ 选择图片</button>
        <input ref="tailInput" type="file" accept="image/*" class="hidden-input" @change="onFileChange($event, 'tail')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { VideoSubmitParams, VideoMode } from '@shared/types/video'

const props = defineProps<{ modelValue: VideoSubmitParams }>()
const emit = defineEmits<{ 'update:modelValue': [value: VideoSubmitParams] }>()

const headInput = ref<HTMLInputElement | null>(null)
const tailInput = ref<HTMLInputElement | null>(null)
const headPreview = ref<string | null>(props.modelValue.image_url ?? null)
const tailPreview = ref<string | null>(props.modelValue.image_tail_url ?? null)

const ratios = [
  { value: '16:9' as const, icon: '▬' },
  { value: '9:16' as const, icon: '▮' },
  { value: '1:1' as const, icon: '■' },
]

const modes = [
  { value: 'std' as VideoMode, label: '标准' },
  { value: 'pro' as VideoMode, label: '专业' },
  { value: 'multi_shot' as VideoMode, label: '多镜头' },
]

function update<K extends keyof VideoSubmitParams>(key: K, value: VideoSubmitParams[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function triggerUpload(type: 'head' | 'tail') {
  if (type === 'head') headInput.value?.click()
  else tailInput.value?.click()
}

function onFileChange(event: Event, type: 'head' | 'tail') {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    if (type === 'head') {
      headPreview.value = dataUrl
      update('image_url', dataUrl)
    } else {
      tailPreview.value = dataUrl
      update('image_tail_url', dataUrl)
    }
  }
  reader.readAsDataURL(file)
}

function clearFrame(type: 'head' | 'tail') {
  if (type === 'head') {
    headPreview.value = null
    update('image_url', undefined)
    if (headInput.value) headInput.value.value = ''
  } else {
    tailPreview.value = null
    update('image_tail_url', undefined)
    if (tailInput.value) tailInput.value.value = ''
  }
}
</script>

<style scoped>
.video-params-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; color: #888; }
.duration-range { width: 100%; accent-color: #6c63ff; }
.range-labels { display: flex; justify-content: space-between; font-size: 11px; color: #666; }
.ratio-group, .mode-group { display: flex; gap: 8px; }
.ratio-btn, .mode-btn {
  flex: 1; padding: 8px 4px; border: 1px solid #333; border-radius: 8px;
  background: #1a1a1a; color: #ccc; cursor: pointer; font-size: 13px;
  display: flex; flex-direction: column; align-items: center; gap: 2px; transition: all 0.15s;
}
.ratio-btn.active, .mode-btn.active { border-color: #6c63ff; background: #2a2060; color: #fff; }
.ratio-icon { font-size: 18px; }
.mode-btn { flex-direction: row; justify-content: center; gap: 6px; }
.mode-btn.multi_shot { border-color: #444; }
.mode-btn.multi_shot.active { border-color: #f59e0b; background: #2a1f00; }
.multi-badge {
  background: #f59e0b; color: #000; font-size: 10px; padding: 1px 5px;
  border-radius: 4px; font-weight: 600;
}
.frames-group { flex-direction: row; gap: 12px; }
.frame-upload { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.frame-upload label { font-size: 13px; color: #888; }
.upload-btn {
  width: 64px; height: 64px; border: 1px dashed #444; border-radius: 8px;
  background: #1a1a1a; color: #666; cursor: pointer; font-size: 20px;
}
.thumb-wrap { position: relative; width: 64px; height: 64px; }
.thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; }
.clear-btn {
  position: absolute; top: -6px; right: -6px; width: 18px; height: 18px;
  border-radius: 50%; background: #e53e3e; color: #fff; border: none;
  cursor: pointer; font-size: 12px; line-height: 1; display: flex; align-items: center; justify-content: center;
}
.hidden-input { display: none; }
</style>
