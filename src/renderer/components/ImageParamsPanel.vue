<template>
  <div class="params-panel">
    <button class="expand-toggle" type="button" @click="expanded = !expanded">
      <span>参数配置</span>
      <span class="toggle-icon">{{ expanded ? '▲' : '▼' }}</span>
    </button>

    <div v-if="expanded" class="params-content">
      <!-- 宽高比选择 -->
      <div class="param-row">
        <label class="param-label">宽高比</label>
        <select v-model="localParams.aspect_ratio" class="param-select">
          <option value="1:1">1:1 方形</option>
          <option value="16:9">16:9 横屏</option>
          <option value="9:16">9:16 竖屏</option>
          <option value="4:3">4:3</option>
        </select>
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
import { ref, watch } from 'vue'
import type { ImageParams } from '../../types/image'

const props = defineProps<{ modelValue: Partial<ImageParams> }>()
const emit = defineEmits<{ 'update:modelValue': [value: Partial<ImageParams>] }>()

const expanded = ref(false)
const localParams = ref<Partial<ImageParams>>({ aspect_ratio: '1:1', force_single: false, ...props.modelValue })

watch(localParams, (val) => emit('update:modelValue', val), { deep: true })
</script>

<style scoped>
.params-panel {
  border: 1px solid #333;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 16px;
}
.expand-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1a1a1a;
  border: none;
  color: #ccc;
  padding: 12px 16px;
  font-size: 14px;
  cursor: pointer;
}
.expand-toggle:hover { background: #222; }
.toggle-icon { font-size: 10px; color: #888; }
.params-content { background: #151515; padding: 8px 0; }
.param-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
}
.param-label { font-size: 14px; color: #ccc; }
.param-select {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #eee;
  padding: 4px 8px;
  font-size: 13px;
  cursor: pointer;
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
