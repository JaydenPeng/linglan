<template>
  <div id="app">
    <!-- Tab Bar -->
    <nav class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
        type="button"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>

    <!-- 页面内容 -->
    <main class="page-content">
      <Settings v-if="activeTab === 'settings'" />
      <VideoGeneratePage v-else-if="activeTab === 'video'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Settings from './pages/Settings.vue'
import VideoGeneratePage from './pages/VideoGeneratePage.vue'

const activeTab = ref<'settings' | 'video'>('video')

const tabs = [
  { id: 'video' as const, label: '视频', icon: '🎬' },
  { id: 'settings' as const, label: '设置', icon: '⚙️' },
]
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0d0d0d; color: #eee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
#app { display: flex; flex-direction: column; height: 100vh; }
.tab-bar {
  display: flex;
  background: #111;
  border-bottom: 1px solid #222;
  flex-shrink: 0;
}
.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 11px;
  transition: color 0.15s;
}
.tab-btn.active { color: #6c63ff; }
.tab-btn:hover:not(.active) { color: #999; }
.tab-icon { font-size: 20px; }
.tab-label { font-size: 11px; }
.page-content { flex: 1; overflow-y: auto; }
</style>
