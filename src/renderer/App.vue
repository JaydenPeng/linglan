<template>
  <div id="app">
    <!-- Tab Bar -->
    <nav class="tab-bar">
      <button
        v-for="tab in visibleTabs"
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
      <CreatePage v-else-if="activeTab === 'create'" @navigate="onNavigate" />
      <TaskHistoryPage v-else-if="activeTab === 'taskHistory'" />
      <LogsPage v-else-if="activeTab === 'logs'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import Settings from './pages/Settings.vue'
import VideoGeneratePage from './pages/VideoGeneratePage.vue'
import CreatePage from './pages/CreatePage.vue'
import TaskHistoryPage from './pages/TaskHistoryPage.vue'
import LogsPage from './pages/LogsPage.vue'
import { useUiStore, type TabId } from './store/uiStore'
import { useConfigStore } from './store/configStore'
import { logger } from './utils/logger'

const uiStore = useUiStore()
const configStore = useConfigStore()
const { activeTab } = storeToRefs(uiStore)

onMounted(() => {
  configStore.refreshStatus().then(() => {
    uiStore.setShowLogsTab(configStore.showLogsTab)
  })
  window.imageApi.onApiLog((log: any) => {
    console.log('[App] onApiLog 收到日志:', log)
    logger.logApi({
      method: log.method,
      url: log.url,
      level: log.level,
      message: log.message,
      error: log.error,
      requestBody: log.requestBody,
      responseBody: log.responseBody,
    })
  })
  window.videoApi.onApiLog((log: any) => {
    console.log('[App] videoApi onApiLog 收到日志:', log)
    logger.logApi({
      method: log.method,
      url: log.url,
      level: log.level,
      message: log.message,
      error: log.error,
      requestBody: log.requestBody,
      responseBody: log.responseBody,
    })
  })
})

function onNavigate(tab: string) {
  uiStore.switchTab(tab as TabId)
}

const allTabs = [
  { id: 'video' as const, label: '视频', icon: '🎬' },
  { id: 'create' as const, label: '图片', icon: '🖼️' },
  { id: 'taskHistory' as const, label: '任务', icon: '📋' },
  { id: 'logs' as const, label: '日志', icon: '📝' },
  { id: 'settings' as const, label: '设置', icon: '⚙️' },
]

const visibleTabs = computed(() =>
  allTabs.filter(tab => tab.id !== 'logs' || uiStore.showLogsTab)
)
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0d0d0d; color: #eee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
#app { display: flex; flex-direction: column; height: 100vh; }
.page-content { flex: 1; overflow-y: auto; }

/* 隐藏滚动条 */
.page-content::-webkit-scrollbar {
  display: none;
}
.page-content {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.tab-bar {
  display: flex;
  background: #111;
  border-top: 1px solid #222;
  flex-shrink: 0;
  order: 2;
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
</style>
