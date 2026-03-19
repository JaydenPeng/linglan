<template>
  <div class="history-item" :class="{ sliding: isSliding }">
    <!-- 主内容区 -->
    <div
      class="item-main"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @mousedown="onMouseDown"
    >
      <!-- 缩略图 -->
      <div class="thumb-wrap">
        <img
          v-if="record.type === 'image' && record.result_url"
          :src="record.result_url"
          class="thumb"
          alt="缩略图"
        />
        <img
          v-else-if="record.type === 'video' && record.cover_url"
          :src="record.cover_url"
          class="thumb"
          alt="视频封面"
        />
        <div v-else class="thumb thumb-placeholder">
          <span>{{ record.type === 'video' ? '🎬' : '🖼️' }}</span>
        </div>
      </div>

      <!-- 文字信息 -->
      <div class="item-info">
        <p class="item-prompt">{{ record.prompt }}</p>
        <div class="item-meta">
          <span class="badge" :class="record.type">{{ record.type === 'image' ? '图片' : '视频' }}</span>
          <span class="item-time">{{ relativeTime(record.created_at) }}</span>
        </div>
      </div>

      <!-- 收藏星标 -->
      <span v-if="record.is_favorite" class="fav-star">★</span>
    </div>

    <!-- 左滑操作区 -->
    <div class="slide-actions" :style="{ width: actionsVisible ? '180px' : '0' }">
      <button class="action-btn reuse" type="button" @click="onReuse">复用</button>
      <button class="action-btn fav" type="button" @click="onToggleFav">
        {{ record.is_favorite ? '取消收藏' : '收藏' }}
      </button>
      <button class="action-btn del" type="button" @click="showDeleteConfirm = true">删除</button>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteConfirm" class="confirm-overlay" @click.self="showDeleteConfirm = false">
      <div class="confirm-dialog">
        <p>确认删除这条记录？</p>
        <div class="confirm-btns">
          <button type="button" @click="showDeleteConfirm = false">取消</button>
          <button type="button" class="danger" @click="onDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useHistoryStore } from '../store/historyStore'
import type { HistoryRecord } from '@shared/types/history'

const props = defineProps<{ record: HistoryRecord }>()
const emit = defineEmits<{ (e: 'reuse-prompt', prompt: string): void }>()

const historyStore = useHistoryStore()
const actionsVisible = ref(false)
const isSliding = ref(false)
const showDeleteConfirm = ref(false)

// 触摸/鼠标滑动检测
let startX = 0
let startY = 0
let isDragging = false

function onTouchStart(e: TouchEvent) {
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
  isDragging = true
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging) return
  const dx = e.touches[0].clientX - startX
  const dy = Math.abs(e.touches[0].clientY - startY)
  if (dy > 10) { isDragging = false; return }
  if (dx < -30) { actionsVisible.value = true; isSliding.value = true }
  else if (dx > 30) { actionsVisible.value = false; isSliding.value = false }
}

function onTouchEnd() { isDragging = false }

function onMouseDown(e: MouseEvent) {
  startX = e.clientX
  const onMove = (ev: MouseEvent) => {
    const dx = ev.clientX - startX
    if (dx < -40) { actionsVisible.value = true; isSliding.value = true }
    else if (dx > 40) { actionsVisible.value = false; isSliding.value = false }
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function onReuse() {
  emit('reuse-prompt', props.record.prompt)
  actionsVisible.value = false
  isSliding.value = false
}

function onToggleFav() {
  historyStore.toggleFavorite(props.record.id)
  actionsVisible.value = false
  isSliding.value = false
}

function onDelete() {
  historyStore.deleteRecord(props.record.id)
  showDeleteConfirm.value = false
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}小时前`
  const day = Math.floor(hr / 24)
  return `${day}天前`
}
</script>

<style scoped>
.history-item {
  position: relative;
  display: flex;
  overflow: hidden;
  border-radius: 10px;
  background: #1a1a1a;
  margin-bottom: 8px;
  user-select: none;
}
.item-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  min-width: 0;
}
.thumb-wrap { flex-shrink: 0; }
.thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
}
.thumb-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.item-info { flex: 1; min-width: 0; }
.item-prompt {
  font-size: 13px;
  color: #ddd;
  margin: 0 0 6px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.item-meta { display: flex; align-items: center; gap: 8px; }
.badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.badge.image { background: #1e3a5f; color: #5ba3f5; }
.badge.video { background: #3a1e5f; color: #a57ff5; }
.item-time { font-size: 11px; color: #555; }
.fav-star { color: #f5c518; font-size: 16px; flex-shrink: 0; }
.slide-actions {
  display: flex;
  overflow: hidden;
  transition: width 0.2s ease;
  flex-shrink: 0;
}
.action-btn {
  flex: 1;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  padding: 0 8px;
}
.action-btn.reuse { background: #6c63ff; color: #fff; }
.action-btn.fav { background: #c8860a; color: #fff; }
.action-btn.del { background: #c0392b; color: #fff; }
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.confirm-dialog {
  background: #222;
  border-radius: 12px;
  padding: 20px 24px;
  min-width: 240px;
  text-align: center;
}
.confirm-dialog p { margin: 0 0 16px; font-size: 14px; color: #ddd; }
.confirm-btns { display: flex; gap: 12px; justify-content: center; }
.confirm-btns button {
  padding: 8px 20px;
  border-radius: 8px;
  border: 1px solid #444;
  background: #333;
  color: #ccc;
  cursor: pointer;
  font-size: 13px;
}
.confirm-btns button.danger { background: #c0392b; border-color: #c0392b; color: #fff; }
</style>
