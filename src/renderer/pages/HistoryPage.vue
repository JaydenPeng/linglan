<template>
  <div class="history-page">
    <!-- 顶部筛选 -->
    <div class="filter-bar">
      <button
        :class="['filter-btn', { active: filter === 'all' }]"
        type="button"
        @click="filter = 'all'"
      >全部</button>
      <button
        :class="['filter-btn', { active: filter === 'favorite' }]"
        type="button"
        @click="filter = 'favorite'"
      >已收藏</button>
    </div>

    <!-- 列表 -->
    <div class="list-wrap">
      <HistoryItem
        v-for="record in displayRecords"
        :key="record.id"
        :record="record"
        @reuse-prompt="onReusePrompt"
      />
      <div v-if="displayRecords.length === 0" class="empty-hint">暂无记录</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHistoryStore } from '../store/historyStore'
import { useUiStore } from '../store/uiStore'
import HistoryItem from '../components/HistoryItem.vue'

const historyStore = useHistoryStore()
const uiStore = useUiStore()
const filter = ref<'all' | 'favorite'>('all')

const displayRecords = computed(() => historyStore.filteredRecords(filter.value))

function onReusePrompt(prompt: string) {
  sessionStorage.setItem('linglan-reuse-prompt', prompt)
  uiStore.switchTab('video')
}
</script>

<style scoped>
.history-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 16px;
}
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.filter-btn {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid #333;
  background: none;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.filter-btn.active {
  background: #6c63ff;
  border-color: #6c63ff;
  color: #fff;
}
.list-wrap { flex: 1; overflow-y: auto; }
.empty-hint {
  text-align: center;
  color: #555;
  font-size: 13px;
  padding: 40px 0;
}
</style>
