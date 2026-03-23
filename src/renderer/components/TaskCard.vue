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
      <p class="prompt-preview">{{ task.params.prompt }}</p>

      <!-- 请求参数信息 -->
      <div class="params-info">
        <span class="param-tag type-tag">图片</span>
        <span v-if="task.params.aspect_ratio" class="param-tag">{{ task.params.aspect_ratio }}</span>
        <span v-if="resolutionText" class="param-tag">{{ resolutionText }}</span>
      </div>

      <!-- 处理中：进度条动画 -->
      <div v-if="isActive" class="progress-bar">
        <div class="progress-fill" />
      </div>

      <!-- 成功：缩略图 -->
      <div v-if="task.status === TaskStatus.SUCCESS && task.resultUrls?.length" class="thumbnails">
        <img
          v-for="(url, i) in task.resultUrls"
          :key="i"
          :src="url"
          class="thumbnail"
          @click="$emit('preview', { task, index: i })"
        />
      </div>

      <!-- 失败：错误信息 -->
      <p v-if="task.status === TaskStatus.FAILED" class="error-msg">{{ task.errorMsg }}</p>

      <!-- 操作按钮行 -->
      <div class="actions">
        <div class="left-info">
          <div class="status-badge" :class="statusClass">{{ statusLabel }}</div>
          <span class="time">{{ timeAgo }}</span>
        </div>
        <div class="action-btns">
          <button v-if="task.status === TaskStatus.FAILED" class="action-btn retry-btn" type="button" @click="$emit('retry', task)">
            重试
          </button>
          <button v-if="isActive" class="action-btn cancel-btn" type="button" @click="$emit('cancel', task)">
            取消
          </button>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { TaskStatus } from '../../types/image'
import type { ImageTask } from '../../types/image'

const props = defineProps<{ task: ImageTask }>()
const emit = defineEmits<{
  preview: [{ task: ImageTask; index: number }]
  retry: [task: ImageTask]
  cancel: [task: ImageTask]
  toggleFavorite: [taskId: string]
}>()

function toggleFavorite() {
  emit('toggleFavorite', props.task.id)
}

const isActive = computed(() =>
  props.task.status === TaskStatus.PENDING || props.task.status === TaskStatus.PROCESSING
)

const statusLabel = computed(() => ({
  [TaskStatus.PENDING]: '已提交',
  [TaskStatus.PROCESSING]: '处理中',
  [TaskStatus.SUCCESS]: '成功',
  [TaskStatus.FAILED]: '失败',
  [TaskStatus.CANCELLED]: '已取消',
}[props.task.status]))

const statusClass = computed(() => ({
  [TaskStatus.PENDING]: 'status-pending',
  [TaskStatus.PROCESSING]: 'status-processing',
  [TaskStatus.SUCCESS]: 'status-success',
  [TaskStatus.FAILED]: 'status-failed',
  [TaskStatus.CANCELLED]: 'status-cancelled',
}[props.task.status]))

const resolutionText = computed(() => {
  const w = props.task.params.width
  const h = props.task.params.height
  if (!w || !h) return ''
  return `${w}×${h}`
})

const timeAgo = computed(() => {
  const diff = Date.now() - props.task.createdAt
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  return `${Math.floor(diff / 3600000)} 小时前`
})
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

/* 右上角：收藏按钮 */
.top-right-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
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

.status-badge {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}
.status-pending { background: rgba(26,115,232,0.15); color: #5a9cf0; }
.status-processing { background: rgba(245,124,0,0.15); color: #f5a623; }
.status-success { background: rgba(46,125,50,0.15); color: #4caf50; }
.status-failed { background: rgba(198,40,40,0.15); color: #ef5350; }
.status-cancelled { background: rgba(117,117,117,0.15); color: #9e9e9e; }
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
.thumbnails { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0; }
.thumbnail { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; cursor: pointer; }
.error-msg { color: #ef5350; font-size: 13px; margin: 4px 0 8px; }
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.retry-btn:hover { border-color: #6c63ff; color: #a89fff; }
.cancel-btn:hover { border-color: #666; color: #ccc; }
</style>
