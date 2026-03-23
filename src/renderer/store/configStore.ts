import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isCapacitor } from '../bridge/platform'
import { getItem, setItem } from '../../services/storageService'

export const useConfigStore = defineStore('config', () => {
  const jimengConfigured = ref(false)
  const klingConfigured = ref(false)
  const loading = ref(false)
  const showLogsTab = ref(false)

  async function refreshStatus(): Promise<void> {
    loading.value = true
    try {
      if (isCapacitor()) {
        // Capacitor 路径：直接读取 storageService（Preferences）
        const jimengAk = await getItem('jimeng_ak')
        const klingAk = await getItem('kling_ak')
        const logsTabSetting = await getItem('show_logs_tab')
        jimengConfigured.value = !!jimengAk
        klingConfigured.value = !!klingAk
        showLogsTab.value = logsTabSetting === 'true'
      } else {
        // Electron 路径：IPC（保持原有行为不变）
        const result = await window.electron.getConfigStatus()
        if (result.success && result.data) {
          jimengConfigured.value = result.data.jimengConfigured
          klingConfigured.value = result.data.klingConfigured
        }
        // 从 localStorage 读取日志开关设置
        const logsTabSetting = localStorage.getItem('show_logs_tab')
        showLogsTab.value = logsTabSetting === 'true'
      }
    } finally {
      loading.value = false
    }
  }

  async function setShowLogsTab(show: boolean): Promise<void> {
    showLogsTab.value = show
    if (isCapacitor()) {
      await setItem('show_logs_tab', show ? 'true' : 'false')
    } else {
      localStorage.setItem('show_logs_tab', show ? 'true' : 'false')
    }
  }

  return { jimengConfigured, klingConfigured, loading, showLogsTab, refreshStatus, setShowLogsTab }
})
