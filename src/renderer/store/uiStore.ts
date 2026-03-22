import { defineStore } from 'pinia'
import { ref } from 'vue'

export type TabId = 'video' | 'create' | 'tasks' | 'history' | 'settings'

export const useUiStore = defineStore('ui', () => {
  const activeTab = ref<TabId>('video')
  function switchTab(tab: TabId) {
    activeTab.value = tab
  }
  return { activeTab, switchTab }
})
