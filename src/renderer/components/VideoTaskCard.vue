<template>
  <div class="video-task-card" :class="task.status">
    <!-- 封面/骨架屏区域 -->
    <div class="cover-area" @click="onCoverClick">
      <img v-if="task.cover_url && !showPlayer" :src="task.cover_url" class="cover-img" alt="视频封面" />
      <div v-else-if="!task.cover_url && !showPlayer" class="skeleton" />
      <VideoPlayer v-if="showPlayer && task.video_url" :src="task.video_url" />
      <div v-if="task.status === 'succeed' && !showPlayer" class="play-overlay">▶</div>
    </div>

    <!-- 状态 badge + 信息 -->
    <div class="card-body">
      <span class="status-badge" :class="task.status">{{ statusLabel }}</span>
      <p v-if="task.status === 'failed'" class="error-msg">{{ task.error_message ?? '生成失败' }}</p>
      <p class="created-time">{{ formatTime(task.created_at) }}</p>
    </div>

    <!-- 下载按钮（仅成功时显示） -->
    <div v-if="task.status === 'succeed' && task.video_url" class="card-footer">
      <button class="download-btn" @click="download" type="button">下载视频</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { VideoTask } from '@shared/types/video'
import VideoPlayer from './VideoPlayer.vue'

const props = defineProps<{ task: VideoTask }>()

const showPlayer = ref(false)

const statusLabel = computed(() => {
  const map: Record<VideoTask['status'], string> = {
    submitted: '已提交',
    processing: '处理中',
    succeed: '已完成',
    failed: '失败',
  }
  return map[props.task.status]
})

function onCoverClick() {
  if (props.task.status === 'succeed' && props.task.video_url) {
    showPlayer.value = !showPlayer.value
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

async function download() {
  if (!props.task.video_url) return
  try {
    await window.electron.ipcRenderer.invoke('image:download', {
      url: props.task.video_url,
      filename: `video-${props.task.task_id}.mp4`,
    })
  } catch {
    // 降级：直接打开链接
    window.open(props.task.video_url, '_blank')
  }
}
</script>

<style scoped>
.video-task-card {
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #2a2a2a;
}
.cover-area {
  position: relative;
  width: 100%;
  min-height: 120px;
  background: #111;
  cursor: pointer;
}
.cover-img {
  width: 100%;
  display: block;
  border-radius: 0;
}
.skeleton {
  width: 100%;
  height: 120px;
  background: linear-gradient(90deg, #1e1e1e 25%, #2a2a2a 50%, #1e1e1e 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: rgba(255,255,255,0.8);
  background: rgba(0,0,0,0.3);
  opacity: 0;
  transition: opacity 0.2s;
}
.cover-area:hover .play-overlay { opacity: 1; }
.card-body {
  padding: 10px 12px 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.status-badge.submitted { background: #2a3a5a; color: #7ab3ff; }
.status-badge.processing { background: #2a3a5a; color: #7ab3ff; }
.status-badge.succeed { background: #1a3a2a; color: #4ade80; }
.status-badge.failed { background: #3a1a1a; color: #f87171; }
.error-msg { font-size: 12px; color: #f87171; margin: 0; }
.created-time { font-size: 11px; color: #555; margin: 0 0 0 auto; }
.card-footer { padding: 0 12px 10px; }
.download-btn {
  width: 100%;
  padding: 7px;
  background: #2a2060;
  border: 1px solid #6c63ff;
  border-radius: 8px;
  color: #a89fff;
  cursor: pointer;
  font-size: 13px;
}
.download-btn:hover { background: #3a2f80; }
</style>
