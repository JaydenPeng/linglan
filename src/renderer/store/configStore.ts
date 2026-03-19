import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('config', () => {
  const jimengConfigured = ref(false)
  const klingConfigured = ref(false)
  const loading = ref(false)

  async function refreshStatus(): Promise<void> {
    loading.value = true
    try {
      const result = await window.electron.getConfigStatus()
      if (result.success && result.data) {
        jimengConfigured.value = result.data.jimengConfigured
        klingConfigured.value = result.data.klingConfigured
      }
    } finally {
      loading.value = false
    }
  }

  return { jimengConfigured, klingConfigured, loading, refreshStatus }
})
