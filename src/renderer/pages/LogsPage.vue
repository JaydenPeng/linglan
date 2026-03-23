<template>
  <div class="logs-page">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <h2 class="page-title">日志</h2>
      <button class="clear-btn" @click="clearCurrentLogs" type="button">清空</button>
    </div>

    <!-- Tab 切换 -->
    <div class="log-tabs">
      <button
        :class="['tab-btn', { active: activeLogTab === 'api' }]"
        @click="activeLogTab = 'api'"
        type="button"
      >
        <span class="tab-icon">🌐</span>
        <span>API日志</span>
        <span v-if="apiLogs.length > 0" class="tab-badge">{{ apiLogs.length }}</span>
      </button>
      <button
        :class="['tab-btn', { active: activeLogTab === 'component' }]"
        @click="activeLogTab = 'component'"
        type="button"
      >
        <span class="tab-icon">🧩</span>
        <span>组件日志</span>
        <span v-if="componentLogs.length > 0" class="tab-badge">{{ componentLogs.length }}</span>
      </button>
    </div>

    <!-- API日志内容 -->
    <div v-if="activeLogTab === 'api'" class="log-content-area">
      <div v-if="apiLogs.length === 0" class="empty-state">
        <span class="empty-icon">🌐</span>
        <p>暂无API调用日志</p>
      </div>
      <div v-else class="logs-list">
        <div
          v-for="log in apiLogs"
          :key="log.id"
          :class="['log-item', log.level]"
        >
          <div class="log-header">
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <span :class="['log-level', log.level]">{{ log.level.toUpperCase() }}</span>
          </div>
          <div class="log-body">
            <div class="log-method">{{ log.method }} {{ log.url }}</div>
            <div v-if="log.message" class="log-message">{{ log.message }}</div>
            <div v-if="log.requestBody" class="log-data">
              <span class="log-data-label">请求参数：</span>{{ formatData(log.requestBody) }}
            </div>
            <div v-if="log.responseBody" class="log-data">
              <span class="log-data-label">返回值：</span>{{ formatData(log.responseBody) }}
            </div>
            <div v-if="log.error" class="log-error">{{ log.error }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 组件日志内容 -->
    <div v-if="activeLogTab === 'component'" class="log-content-area">
      <div v-if="componentLogs.length === 0" class="empty-state">
        <span class="empty-icon">🧩</span>
        <p>暂无组件保存日志</p>
      </div>
      <div v-else class="logs-list">
        <div
          v-for="log in componentLogs"
          :key="log.id"
          class="log-item component"
        >
          <div class="log-header">
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <span class="log-component">{{ log.component }}</span>
          </div>
          <div class="log-body">
            <div class="log-action">{{ log.action }}</div>
            <div v-if="log.data" class="log-data">{{ formatData(log.data) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { logger, type ApiLog, type ComponentLog } from '../utils/logger'

const activeLogTab = ref<'api' | 'component'>('api')
const apiLogs = ref<ApiLog[]>([])
const componentLogs = ref<ComponentLog[]>([])

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatData(data: any): string {
  if (typeof data === 'string') {
    try {
      return JSON.stringify(JSON.parse(data), null, 2)
    } catch {
      return data
    }
  }
  return JSON.stringify(data, null, 2)
}

function clearCurrentLogs() {
  if (activeLogTab.value === 'api') {
    logger.clearApiLogs()
    updateLogs()
  } else {
    logger.clearComponentLogs()
    updateLogs()
  }
}

function updateLogs() {
  apiLogs.value = logger.getApiLogs()
  componentLogs.value = logger.getComponentLogs()
}

// 监听日志变化
onMounted(() => {
  updateLogs()
  logger.addListener(updateLogs)
})

onUnmounted(() => {
  logger.removeListener(updateLogs)
})

</script>

<style scoped>
.logs-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #eee;
  margin: 0;
}

.clear-btn {
  padding: 6px 16px;
  background: #333;
  border: 1px solid #444;
  border-radius: 6px;
  color: #aaa;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #444;
  color: #eee;
}

/* Tab 切换样式 */
.log-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #333;
}

.log-tabs .tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.log-tabs .tab-btn:hover {
  color: #aaa;
}

.log-tabs .tab-btn.active {
  color: #6c63ff;
  border-bottom-color: #6c63ff;
}

.log-tabs .tab-icon {
  font-size: 16px;
}

.tab-badge {
  background: #333;
  color: #aaa;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.log-tabs .tab-btn.active .tab-badge {
  background: #6c63ff;
  color: #fff;
}

/* 日志内容区域 */
.log-content-area {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 16px;
  color: #555;
}

.empty-icon {
  font-size: 48px;
}

.empty-state p {
  font-size: 14px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  transition: border-color 0.2s;
}

.log-item:hover {
  border-color: #444;
}

.log-item.info {
  border-left: 3px solid #3b82f6;
}

.log-item.error {
  border-left: 3px solid #ef4444;
}

.log-item.component {
  border-left: 3px solid #8b5cf6;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-time {
  font-size: 12px;
  color: #888;
  font-family: 'Consolas', 'Monaco', monospace;
}

.log-level {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.log-level.info {
  background: #1e3a5f;
  color: #60a5fa;
}

.log-level.error {
  background: #3a1a1a;
  color: #f87171;
}

.log-component {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: #2a2a3a;
  color: #a78bfa;
}

.log-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-method {
  font-size: 13px;
  color: #eee;
  font-family: 'Consolas', 'Monaco', monospace;
}

.log-message {
  font-size: 12px;
  color: #aaa;
  padding: 4px 8px;
  background: #222;
  border-radius: 4px;
}

.log-error {
  font-size: 12px;
  color: #f87171;
  padding: 4px 8px;
  background: #2a1a1a;
  border-radius: 4px;
  margin-top: 4px;
}

.log-action {
  font-size: 13px;
  color: #eee;
  font-weight: 500;
}

.log-data-label {
  color: #6c63ff;
  font-weight: 500;
  margin-right: 4px;
}

.log-data {
  font-size: 12px;
  color: #aaa;
  padding: 8px;
  background: #222;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}
</style>
