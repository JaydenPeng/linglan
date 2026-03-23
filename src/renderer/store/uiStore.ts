import { defineStore } from 'pinia'
import { ref } from 'vue'

export type TabId = 'video' | 'create' | 'taskHistory' | 'logs' | 'settings'

export const useUiStore = defineStore('ui', () => {
  const activeTab = ref<TabId>('video')
  const showLogsTab = ref(true)

  function switchTab(tab: TabId) {
    activeTab.value = tab
  }

  function setShowLogsTab(show: boolean) {
    showLogsTab.value = show
  }

  return { activeTab, showLogsTab, switchTab, setShowLogsTab }
})
