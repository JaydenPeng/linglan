<template>
  <div class="settings-page">
    <div class="page-header">
      <h1 class="page-title">设置</h1>
    </div>

    <!-- API 配置父卡片 -->
    <div class="config-card">
      <div class="card-header">
        <div class="service-info">
          <h2 class="service-name">API 配置</h2>
          <span class="section-desc">配置图片和视频生成服务的访问密钥</span>
        </div>
      </div>
      <div class="card-body sub-cards">
        <!-- 即梦配置区块 -->
        <div class="sub-card">
          <div class="sub-card-header clickable" @click="jimengExpanded = !jimengExpanded">
            <div class="service-info">
              <span class="sub-service-name">即梦 (Jimeng)</span>
              <div class="header-right">
                <span class="status-badge" :class="{ configured: configStore.jimengConfigured }">
                  {{ configStore.jimengConfigured ? '✓ 已配置' : '○ 未配置' }}
                </span>
                <span class="expand-icon" :class="{ expanded: jimengExpanded }">▾</span>
              </div>
            </div>
          </div>
          <transition name="collapse">
            <div v-if="jimengExpanded" class="sub-card-body">
              <div class="form-group">
                <label class="input-label">Access Key (AK)</label>
                <input v-model="jimengAk" type="password" class="input-field" placeholder="请输入 Access Key" />
              </div>
              <div class="form-group">
                <label class="input-label">Secret Key (SK)</label>
                <input v-model="jimengSk" type="password" class="input-field" placeholder="请输入 Secret Key" />
              </div>
              <button class="save-btn" @click="saveJimeng" :disabled="!jimengAk || !jimengSk">保存即梦密钥</button>
            </div>
          </transition>
        </div>

        <!-- 可灵配置区块 -->
        <div class="sub-card">
          <div class="sub-card-header clickable" @click="klingExpanded = !klingExpanded">
            <div class="service-info">
              <span class="sub-service-name">可灵 (Kling)</span>
              <div class="header-right">
                <span class="status-badge" :class="{ configured: configStore.klingConfigured }">
                  {{ configStore.klingConfigured ? '✓ 已配置' : '○ 未配置' }}
                </span>
                <span class="expand-icon" :class="{ expanded: klingExpanded }">▾</span>
              </div>
            </div>
          </div>
          <transition name="collapse">
            <div v-if="klingExpanded" class="sub-card-body">
              <div class="form-group">
                <label class="input-label">Access Key (AK)</label>
                <input v-model="klingAk" type="password" class="input-field" placeholder="请输入 Access Key" />
              </div>
              <div class="form-group">
                <label class="input-label">Secret Key (SK)</label>
                <input v-model="klingSk" type="password" class="input-field" placeholder="请输入 Secret Key" />
              </div>
              <button class="save-btn" @click="saveKling" :disabled="!klingAk || !klingSk">保存可灵密钥</button>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- 开发者选项 -->
    <div class="config-card">
      <div class="card-header">
        <div class="service-info">
          <h2 class="service-name">开发者选项</h2>
        </div>
      </div>
      <div class="card-body">
        <div class="toggle-row">
          <div class="toggle-info">
            <span class="toggle-label">显示接口日志</span>
            <span class="toggle-desc">在底部导航栏显示日志入口，用于查看接口调用记录</span>
          </div>
          <button
            :class="['toggle-btn', { active: configStore.showLogsTab }]"
            @click="toggleLogsTab"
            type="button"
          >
            <span class="toggle-thumb" />
          </button>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <transition name="fade">
      <div v-if="message" class="message-toast" :class="messageType">
        {{ message }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfigStore } from '../store/configStore'
import { useUiStore } from '../store/uiStore'

const configStore = useConfigStore()
const uiStore = useUiStore()
const jimengAk = ref('')
const jimengSk = ref('')
const klingAk = ref('')
const klingSk = ref('')
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const jimengExpanded = ref(false)
const klingExpanded = ref(false)

onMounted(() => configStore.refreshStatus())

async function toggleLogsTab() {
  const newVal = !configStore.showLogsTab
  await configStore.setShowLogsTab(newVal)
  uiStore.setShowLogsTab(newVal)
}

async function saveJimeng() {
  const result = await window.electron.saveConfig({
    jimengAk: jimengAk.value,
    jimengSk: jimengSk.value
  })

  if (result.success) {
    message.value = '✓ 即梦密钥已保存'
    messageType.value = 'success'
    jimengAk.value = ''
    jimengSk.value = ''
    await configStore.refreshStatus()
  } else {
    message.value = `✗ 保存失败: ${result.error}`
    messageType.value = 'error'
  }

  setTimeout(() => { message.value = '' }, 3000)
}

async function saveKling() {
  const result = await window.electron.saveConfig({
    klingAk: klingAk.value,
    klingSk: klingSk.value
  })

  if (result.success) {
    message.value = '✓ 可灵密钥已保存'
    messageType.value = 'success'
    klingAk.value = ''
    klingSk.value = ''
    await configStore.refreshStatus()
  } else {
    message.value = `✗ 保存失败: ${result.error}`
    messageType.value = 'error'
  }

  setTimeout(() => { message.value = '' }, 3000)
}
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  max-width: 700px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 8px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #eee;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #888;
  margin: 0;
}

.config-card {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.config-card:hover {
  border-color: #444;
}

.card-header {
  padding: 16px 20px;
  background: #151515;
}

.card-header.clickable {
  cursor: pointer;
  user-select: none;
}

.card-header.clickable:hover {
  background: #1a1a1a;
}

.card-body {
  border-top: 1px solid #2a2a2a;
  padding: 0;
}

.card-body.sub-cards {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.section-desc {
  font-size: 13px;
  color: #666;
}

.sub-card {
  border-top: 1px solid #2a2a2a;
}

.sub-card:first-child {
  border-top: none;
}

.sub-card-header {
  padding: 12px 20px;
  background: #111;
}

.sub-card-header.clickable {
  cursor: pointer;
  user-select: none;
}

.sub-card-header.clickable:hover {
  background: #161616;
}

.sub-service-name {
  font-size: 15px;
  font-weight: 500;
  color: #ccc;
}

.sub-card-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #0f0f0f;
  border-top: 1px solid #222;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expand-icon {
  color: #666;
  font-size: 16px;
  transition: transform 0.2s;
  display: inline-block;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.service-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.service-name {
  font-size: 18px;
  font-weight: 600;
  color: #eee;
  margin: 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: #2a2a2a;
  color: #888;
  transition: all 0.2s;
}

.status-badge.configured {
  background: #1a3a2a;
  color: #4ade80;
}

.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 13px;
  color: #aaa;
  font-weight: 500;
}

.input-field {
  width: 100%;
  padding: 10px 14px;
  background: #0f0f0f;
  border: 1px solid #333;
  border-radius: 8px;
  color: #eee;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', monospace;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
}

.input-field:focus {
  outline: none;
  border-color: #6c63ff;
  background: #151515;
}

.input-field::placeholder {
  color: #555;
}

.save-btn {
  padding: 12px 20px;
  background: #6c63ff;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  margin-top: 4px;
}

.save-btn:hover:not(:disabled) {
  background: #5a52e0;
  transform: translateY(-1px);
}

.save-btn:active:not(:disabled) {
  transform: translateY(0);
}

.save-btn:disabled {
  background: #3a3a5a;
  color: #666;
  cursor: not-allowed;
}

.message-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.message-toast.success {
  background: #1a3a2a;
  color: #4ade80;
  border: 1px solid #2a5a3a;
}

.message-toast.error {
  background: #3a1a1a;
  color: #f87171;
  border: 1px solid #5a2a2a;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toggle-label {
  font-size: 14px;
  color: #eee;
  font-weight: 500;
}

.toggle-desc {
  font-size: 12px;
  color: #666;
}

.toggle-btn {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: #333;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  padding: 0;
}

.toggle-btn.active {
  background: #6c63ff;
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
  display: block;
}

.toggle-btn.active .toggle-thumb {
  transform: translateX(20px);
}

.collapse-enter-active,
.collapse-leave-active {
  transition: opacity 0.2s;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
