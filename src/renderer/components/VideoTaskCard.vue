<template>
  <div class="task-card-wrapper">
    <!-- 任务卡片 -->
    <div class="task-card">
      <!-- 右上角：收藏按钮 -->
      <div class="top-right-actions">
        <button class="favorite-btn" @click.stop="toggleFavorite" type="button">
          <span class="favorite-icon">{{ task.isFavorite ? '★' : '☆' }}</span>
        </button>
      </div>

      <div class="card-content">
      <!-- 提示词预览 -->
      <p class="prompt-preview">{{ task.prompt }}</p>

      <!-- 参数标签 -->
      <div class="params-info">
        <span class="param-tag type-tag">视频</span>
        <span v-if="task.aspect_ratio" class="param-tag">{{ task.aspect_ratio }}</span>
        <span v-if="task.duration" class="param-tag">{{ task.duration }}s</span>
        <span v-if="task.mode" class="param-tag">{{ task.mode === 'pro' ? 'Pro' : '标准' }}</span>
      </div>

      <!-- 处理中：进度条动画 -->
      <div v-if="isActive" class="progress-bar">
        <div class="progress-fill" />
      </div>

      <!-- 成功：视频缩略图 -->
      <div v-if="task.status === 'succeed' && task.video_url" class="video-thumbnail-container">
        <div class="video-thumbnail" @click="openFullscreen">
          <video :src="task.video_url" class="thumbnail-video" muted />
          <div class="play-overlay">
            <div class="play-icon">▶</div>
          </div>
        </div>
      </div>

      <!-- 全屏播放器 -->
      <Teleport to="body">
        <div v-if="showFullscreen" class="fullscreen-overlay" @click="closeFullscreen">
          <div class="fullscreen-content" @click.stop>
            <button class="close-btn" @click="closeFullscreen" type="button">✕</button>
            <div class="fullscreen-player">
              <VideoPlayer :src="task.video_url!" />
              <!-- 右侧操作按钮（抖音风格） -->
              <div class="video-actions">
                <button class="video-action-btn" type="button" @click.stop="download" title="下载">
                  <span class="action-icon">⬇</span>
                </button>
                <button class="video-action-btn" type="button" @click.stop="share" title="分享">
                  <span class="action-icon">⤴</span>
                </button>
              </div>
            </div>
            <!-- Toast 提示 -->
            <Transition name="toast">
              <div v-if="showToast" class="toast">{{ toastMessage }}</div>
            </Transition>
          </div>
        </div>
      </Teleport>

      <!-- 失败：错误信息 -->
      <p v-if="task.status === 'failed'" class="error-msg">{{ task.error_message ?? '生成失败' }}</p>

      <!-- 操作按钮行 -->
      <div class="actions">
        <div class="left-info">
          <div class="status-badge" :class="statusClass">{{ statusLabel }}</div>
          <span class="time">{{ formatTime(task.created_at) }}</span>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { VideoTask } from '@shared/types/video'
import VideoPlayer from './VideoPlayer.vue'

const props = defineProps<{ task: VideoTask }>()
const emit = defineEmits<{
  toggleFavorite: [taskId: string]
}>()

const showFullscreen = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

function openFullscreen() {
  showFullscreen.value = true
}

function closeFullscreen() {
  showFullscreen.value = false
}

const isActive = computed(() =>
  props.task.status === 'submitted' || props.task.status === 'processing'
)

const statusLabel = computed(() => ({
  submitted: '已提交',
  processing: '处理中',
  succeed: '成功',
  failed: '失败',
}[props.task.status]))

const statusClass = computed(() => ({
  submitted: 'status-pending',
  processing: 'status-processing',
  succeed: 'status-success',
  failed: 'status-failed',
}[props.task.status]))

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  return `${Math.floor(diff / 3600000)} 小时前`
}

async function download() {
  if (!props.task.video_url) return
  try {
    await window.electron.ipcRenderer.invoke('image:download', {
      url: props.task.video_url,
      filename: `video-${props.task.task_id}.mp4`,
    })
  } catch {
    window.open(props.task.video_url, '_blank')
  }
}

async function share() {
  if (!props.task.video_url) return
  try {
    await navigator.clipboard.writeText(props.task.video_url)
    toastMessage.value = '链接已复制'
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
    toastMessage.value = '复制失败'
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 2000)
  }
}

function toggleFavorite() {
  emit('toggleFavorite', props.task.task_id)
}
</script>

<style scoped>
.task-card-wrapper {
  position: relative;
  margin: 8px 0;
  border-radius: 12px;
}

.task-card {
  position: relative;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
}

/* 右上角：状态标签和收藏按钮 */
.top-right-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.favorite-btn {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.favorite-btn:hover {
  transform: scale(1.15);
}

.favorite-btn .favorite-icon {
  font-size: 24px;
  line-height: 1;
  color: #ffd700;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}
.status-pending { background: rgba(26,115,232,0.15); color: #5a9cf0; }
.status-processing { background: rgba(245,124,0,0.15); color: #f5a623; }
.status-success { background: rgba(46,125,50,0.15); color: #4caf50; }
.status-failed { background: rgba(198,40,40,0.15); color: #ef5350; }
.card-content { padding: 12px 14px; }
.prompt-preview {
  margin: 0 0 8px;
  font-size: 14px;
  color: #ccc;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  padding-right: 60px;
}
.params-info {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.param-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  font-size: 11px;
  color: #888;
  font-weight: 500;
}
.type-tag {
  background: linear-gradient(135deg, #6c63ff 0%, #8b7fff 100%);
  border-color: #6c63ff;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 0 8px rgba(108, 99, 255, 0.4);
}
.progress-bar {
  height: 3px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;
}
.progress-fill {
  height: 100%;
  background: #6c63ff;
  border-radius: 2px;
  animation: progress-slide 1.5s ease-in-out infinite;
  width: 40%;
}
@keyframes progress-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
.video-thumbnail-container {
  margin: 8px 0;
}
.video-thumbnail {
  position: relative;
  width: 160px;
  height: 90px;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}
.thumbnail-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  opacity: 0;
  transition: opacity 0.2s;
}
.video-thumbnail:hover .play-overlay {
  opacity: 1;
}
.play-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(108, 99, 255, 0.9);
  border-radius: 50%;
  color: #fff;
  font-size: 18px;
  padding-left: 3px;
}
.fullscreen-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(10px);
}
.fullscreen-content {
  position: relative;
  width: 90%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.fullscreen-player {
  position: relative;
  width: 100%;
  max-height: 80vh;
}
.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 抖音风格的右侧操作按钮 */
.video-actions {
  position: absolute;
  right: 16px;
  bottom: 80px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 10;
}
.video-action-btn {
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
.video-action-btn:hover {
  background: rgba(108, 99, 255, 0.8);
  transform: scale(1.1);
}
.video-action-btn:active {
  transform: scale(0.95);
}
.video-action-btn .action-icon {
  font-size: 22px;
  line-height: 1;
}

/* Toast 提示 */
.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 10001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Toast 过渡动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}
.error-msg { color: #ef5350; font-size: 13px; margin: 4px 0 8px; }
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: 8px;
}

/* 左下角：状态标签和时间 */
.left-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time { font-size: 12px; color: #555; }
.action-btns { display: flex; gap: 8px; }
.action-btn {
  background: none;
  border: 1px solid #444;
  border-radius: 6px;
  color: #aaa;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.download-btn:hover { border-color: #6c63ff; color: #a89fff; }
</style>
