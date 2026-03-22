import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isCapacitor } from '../bridge/platform'
import { getItem } from '../../services/storageService'

export const useConfigStore = defineStore('config', () => {
  const jimengConfigured = ref(false)
  const klingConfigured = ref(false)
  const loading = ref(false)

  async function refreshStatus(): Promise<void> {
    loading.value = true
    try {
      if (isCapacitor()) {
        // Capacitor 路径：直接读取 storageService（Preferences）
        const jimengAk = await getItem('jimeng_ak')
        const klingAk = await getItem('kling_ak')
        jimengConfigured.value = !!jimengAk
        klingConfigured.value = !!klingAk
      } else {
        // Electron 路径：IPC（保持原有行为不变）
        const result = await window.electron.getConfigStatus()
        if (result.success && result.data) {
          jimengConfigured.value = result.data.jimengConfigured
          klingConfigured.value = result.data.klingConfigured
        }
      }
    } finally {
      loading.value = false
    }
  }

  return { jimengConfigured, klingConfigured, loading, refreshStatus }
})
