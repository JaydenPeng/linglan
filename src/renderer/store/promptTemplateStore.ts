import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { BUILTIN_TEMPLATES } from '@shared/types/promptTemplate'
import type { PromptTemplate, PromptCategory } from '@shared/types/promptTemplate'

export const usePromptTemplateStore = defineStore('promptTemplates', () => {
  const customTemplates = ref<PromptTemplate[]>([])

  const templates = computed<PromptTemplate[]>(() => [
    ...BUILTIN_TEMPLATES,
    ...customTemplates.value,
  ])

  function addCustomTemplate(title: string, content: string, category: PromptCategory): void {
    const newTemplate: PromptTemplate = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      content,
      category,
      is_builtin: false,
      created_at: Date.now(),
    }
    customTemplates.value.push(newTemplate)
  }

  function deleteCustomTemplate(id: string): void {
    const template = customTemplates.value.find(t => t.id === id)
    if (!template) return // 内置模板不在 customTemplates 中，直接忽略
    customTemplates.value = customTemplates.value.filter(t => t.id !== id)
  }

  function getByCategory(category: PromptCategory): PromptTemplate[] {
    return templates.value.filter(t => t.category === category)
  }

  return { customTemplates, templates, addCustomTemplate, deleteCustomTemplate, getByCategory }
}, {
  persist: {
    key: 'linglan-prompt-templates',
    pick: ['customTemplates'],
  },
})
