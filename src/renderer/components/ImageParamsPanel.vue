<template>
  <div class="params-panel">
    <div class="params-header">参数配置</div>

    <div class="params-content">
      <!-- 宽高比选择 -->
      <div class="param-group">
        <label class="param-label">宽高比</label>
        <div class="ratio-group">
          <button
            v-for="ratio in ratios"
            :key="ratio.value"
            :class="['ratio-btn', { active: localParams.aspect_ratio === ratio.value }]"
            @click="localParams.aspect_ratio = ratio.value"
            type="button"
          >
            <span class="ratio-icon">{{ ratio.icon }}</span>
            <span>{{ ratio.label }}</span>
          </button>
        </div>
      </div>

      <!-- 分辨率选择 -->
      <div class="param-group">
        <label class="param-label">分辨率</label>
        <div class="resolution-group">
          <button
            v-for="res in availableResolutions"
            :key="res.value"
            :class="['resolution-btn', { active: currentResolution === res.value }]"
            @click="selectResolution(res)"
            type="button"
          >
            {{ res.label }}
          </button>
        </div>
      </div>

      <!-- 强制单图 -->
      <div class="param-row">
        <label class="param-label">强制单图输出</label>
        <label class="toggle-switch">
          <input type="checkbox" v-model="localParams.force_single" />
          <span class="slider"></span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ImageParams } from '../../types/image'
import { logger } from '../utils/logger'

const props = defineProps<{ modelValue: Partial<ImageParams> }>()
const emit = defineEmits<{ 'update:modelValue': [value: Partial<ImageParams>] }>()

const localParams = ref<Partial<ImageParams>>({
  aspect_ratio: '1:1',
  force_single: false,
  width: 2048,
  height: 2048,
  ...props.modelValue
})

const ratios = [
  { value: '1:1', icon: '■', label: '1:1' },
  { value: '16:9', icon: '▬', label: '16:9' },
  { value: '9:16', icon: '▮', label: '9:16' },
  { value: '4:3', icon: '▭', label: '4:3' },
]

// 根据文档推荐的分辨率配置
const resolutionsByRatio = {
  '1:1': [
    { value: '1K', label: '1K (1024×1024)', width: 1024, height: 1024 },
    { value: '2K', label: '2K (2048×2048)', width: 2048, height: 2048 },
    { value: '4K', label: '4K (4096×4096)', width: 4096, height: 4096 },
  ],
  '16:9': [
    { value: '2K', label: '2K (2560×1440)', width: 2560, height: 1440 },
    { value: '4K', label: '4K (5404×3040)', width: 5404, height: 3040 },
  ],
  '9:16': [
    { value: '2K', label: '2K (1440×2560)', width: 1440, height: 2560 },
    { value: '4K', label: '4K (3040×5404)', width: 3040, height: 5404 },
  ],
  '4:3': [
    { value: '2K', label: '2K (2304×1728)', width: 2304, height: 1728 },
    { value: '4K', label: '4K (4694×3520)', width: 4694, height: 3520 },
  ],
}

const availableResolutions = computed(() => {
  const ratio = localParams.value.aspect_ratio || '1:1'
  return resolutionsByRatio[ratio as keyof typeof resolutionsByRatio] || resolutionsByRatio['1:1']
})

const currentResolution = computed(() => {
  const w = localParams.value.width
  const h = localParams.value.height
  const res = availableResolutions.value.find(r => r.width === w && r.height === h)
  return res?.value || availableResolutions.value[1]?.value || '2K'
})

function selectResolution(res: { width: number; height: number }) {
  localParams.value.width = res.width
  localParams.value.height = res.height
}

// 监听宽高比变化，自动切换到对应的默认分辨率
watch(() => localParams.value.aspect_ratio, (newRatio) => {
  const ratio = newRatio || '1:1'
  const resolutions = resolutionsByRatio[ratio as keyof typeof resolutionsByRatio]
  if (resolutions && resolutions.length > 0) {
    // 默认选择第二个分辨率（通常是 2K）
    const defaultRes = resolutions[1] || resolutions[0]
    localParams.value.width = defaultRes.width
    localParams.value.height = defaultRes.height
  }
})

watch(localParams, (val) => {
  emit('update:modelValue', val)

  // 记录组件日志
  logger.logComponent({
    component: 'ImageParamsPanel',
    action: '保存图片参数',
    data: {
      aspect_ratio: val.aspect_ratio,
      force_single: val.force_single,
      width: val.width,
      height: val.height
    }
  })
}, { deep: true })
</script>

<style scoped>
.params-panel {
  border: 1px solid #333;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 16px;
}
.params-header {
  background: #1a1a1a;
  color: #888;
  padding: 10px 16px;
  font-size: 13px;
  border-bottom: 1px solid #333;
}
.params-content { background: #151515; padding: 8px 0; }
.param-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 16px;
}
.param-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
}
.param-label { font-size: 14px; color: #ccc; }
.ratio-group { display: flex; gap: 8px; }
.ratio-btn {
  flex: 1;
  padding: 8px 4px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #1a1a1a;
  color: #ccc;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  min-width: 0;
}
.ratio-btn.active {
  border-color: #6c63ff;
  background: #2a2060;
  color: #fff;
}
.ratio-btn:hover:not(.active) {
  border-color: #444;
  background: #222;
}
.ratio-icon { font-size: 18px; }
.resolution-group { display: flex; gap: 8px; }
.resolution-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #1a1a1a;
  color: #ccc;
  cursor: pointer;
  font-size: 13px;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.resolution-btn.active {
  border-color: #6c63ff;
  background: #2a2060;
  color: #fff;
}
.resolution-btn:hover:not(.active) {
  border-color: #444;
  background: #222;
}
.toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute;
  inset: 0;
  background: #444;
  border-radius: 24px;
  cursor: pointer;
  transition: background 0.2s;
}
.slider::before {
  content: '';
  position: absolute;
  width: 18px; height: 18px;
  left: 3px; top: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}
.toggle-switch input:checked + .slider { background: #6c63ff; }
.toggle-switch input:checked + .slider::before { transform: translateX(20px); }
</style>
