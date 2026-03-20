<template>
  <div class="preview-overlay" @click.self="emit('close')">
    <div class="preview-container">
      <!-- 顶部工具栏 -->
      <div class="preview-toolbar">
        <span class="slide-counter" v-if="urls.length > 1">
          {{ currentIndex + 1 }} / {{ urls.length }}
        </span>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <!-- 图片滑动区域 -->
      <div
        class="slides-track-wrapper"
        @touchstart="onTouchStart"
        @touchend="onTouchEnd"
      >
        <div
          class="slides-track"
          :style="{ transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))` }"
        >
          <div class="slide" v-for="(url, i) in urls" :key="i">
            <img :src="url" class="preview-image" :alt="`图片 ${i + 1}`" />
          </div>
        </div>
      </div>

      <!-- 左右切换按钮（多图时显示） -->
      <template v-if="urls.length > 1">
        <button class="nav-btn nav-prev" :disabled="currentIndex === 0" @click="prev">‹</button>
        <button class="nav-btn nav-next" :disabled="currentIndex === urls.length - 1" @click="next">›</button>
      </template>

      <!-- 底部操作栏 -->
      <div class="action-bar">
        <button class="action-btn" @click="handleDownload" :disabled="downloading">
          {{ downloading ? '保存中...' : '⬇ 下载' }}
        </button>
        <button class="action-btn" @click="showSharePanel = true">
          ↗ 分享
        </button>
      </div>
    </div>

    <!-- Toast 提示 -->
    <div class="toast" :class="{ visible: toastVisible }">{{ toastMsg }}</div>

    <!-- 分享面板 -->
    <div v-if="showSharePanel" class="share-overlay" @click.self="showSharePanel = false">
      <div class="share-panel">
        <div class="share-title">分享图片</div>
        <button class="share-item" @click="copyLink">
          <span>🔗</span>
          <span>复制图片链接</span>
        </button>
        <button class="share-item" @click="handleDownload">
          <span>🖼</span>
          <span>保存到本地</span>
        </button>
        <button class="share-item" @click="openInBrowser">
          <span>↗</span>
          <span>在浏览器中打开</span>
        </button>
        <button class="share-cancel" @click="showSharePanel = false">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ImageTask } from '../../types/image'

const props = defineProps<{ task: ImageTask; initialIndex: number }>()
const emit = defineEmits<{ close: [] }>()

const urls = computed(() => props.task.resultUrls ?? [])
const currentIndex = ref(props.initialIndex)

// 滑动手势
let touchStartX = 0
const dragOffset = ref(0)

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
}

function onTouchEnd(e: TouchEvent) {
  const delta = e.changedTouches[0].clientX - touchStartX
  if (delta < -50 && currentIndex.value < urls.value.length - 1) {
    currentIndex.value++
  } else if (delta > 50 && currentIndex.value > 0) {
    currentIndex.value--
  }
  dragOffset.value = 0
}

function prev() {
  if (currentIndex.value > 0) currentIndex.value--
}

function next() {
  if (currentIndex.value < urls.value.length - 1) currentIndex.value++
}

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

// 下载
const downloading = ref(false)
const showSharePanel = ref(false)

async function handleDownload() {
  showSharePanel.value = false
  const url = urls.value[currentIndex.value]
  if (!url) return
  downloading.value = true
  try {
    const result = await window.imageApi.download(url)
    if (result.ok) {
      showToast('已保存到本地')
    } else if (result.error) {
      showToast(`保存失败：${result.error}`)
    }
  } catch {
    showToast('保存失败，请重试')
  } finally {
    downloading.value = false
  }
}

// 复制链接
async function copyLink() {
  showSharePanel.value = false
  const url = urls.value[currentIndex.value]
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    showToast('链接已复制')
  } catch {
    showToast('复制失败，请手动复制')
  }
}

// 在浏览器中打开
function openInBrowser() {
  showSharePanel.value = false
  const url = urls.value[currentIndex.value]
  if (url) window.open(url, '_blank')
}
</script>

<style scoped>
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  position: relative;
  flex-shrink: 0;
}

.slide-counter {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.close-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
}

.slides-track-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.slides-track {
  display: flex;
  height: 100%;
  transition: transform 0.3s ease;
}

.slide {
  flex: 0 0 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.4);
  border: none;
  color: #fff;
  font-size: 32px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: background 0.2s;
  line-height: 1;
}

.nav-btn:disabled {
  opacity: 0.2;
  cursor: default;
}

.nav-btn:not(:disabled):hover {
  background: rgba(0, 0, 0, 0.7);
}

.nav-prev { left: 8px; }
.nav-next { right: 8px; }

.action-bar {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 12px 16px;
  flex-shrink: 0;
}

.action-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.action-btn:not(:disabled):hover { background: rgba(255, 255, 255, 0.18); }

.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.25s, transform 0.25s;
  pointer-events: none;
  white-space: nowrap;
  z-index: 1100;
}

.toast.visible {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.share-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1050;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.share-panel {
  background: #1c1c1e;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 480px;
  padding: 16px 0;
}

.share-title {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  padding: 0 16px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.share-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  background: none;
  border: none;
  color: #fff;
  font-size: 16px;
  padding: 16px 24px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.share-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.share-cancel {
  display: block;
  width: calc(100% - 32px);
  margin: 8px 16px 0;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #fff;
  font-size: 16px;
  padding: 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.share-cancel:hover {
  background: rgba(255, 255, 255, 0.14);
}
</style>
