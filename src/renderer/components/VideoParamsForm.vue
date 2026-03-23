<template>
  <div class="video-params-form">
    <!-- 时长滑块 -->
    <div class="form-group">
      <div class="duration-header">
        <label>时长</label>
        <span class="duration-value">{{ modelValue.duration }} 秒</span>
      </div>
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

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { VideoSubmitParams, VideoMode } from '@shared/types/video'

const props = defineProps<{
  modelValue: VideoSubmitParams
  showFrames?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: VideoSubmitParams] }>()

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
</script>

<style scoped>
.video-params-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; color: #888; }
.duration-header { display: flex; justify-content: space-between; align-items: center; }
.duration-value { font-size: 13px; color: #6c63ff; font-weight: 600; }
.duration-range { width: 100%; accent-color: #6c63ff; }
.range-labels { display: flex; justify-content: space-between; font-size: 11px; color: #666; }
.ratio-group, .mode-group { display: flex; gap: 8px; }
.ratio-btn, .mode-btn {
  flex: 1; padding: 8px 4px; border: 1px solid #333; border-radius: 8px;
  background: #1a1a1a; color: #ccc; cursor: pointer; font-size: 13px;
  display: flex; flex-direction: column; align-items: center; gap: 2px; transition: border-color 0.15s, background 0.15s, color 0.15s;
  min-width: 0;
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
</style>
