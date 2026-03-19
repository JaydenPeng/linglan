import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePromptTemplateStore } from '../promptTemplateStore'
import { BUILTIN_TEMPLATES } from '@shared/types/promptTemplate'

describe('promptTemplateStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('templates 包含所有内置模板', () => {
    const store = usePromptTemplateStore()
    const builtinCount = store.templates.filter(t => t.is_builtin).length
    expect(builtinCount).toBe(BUILTIN_TEMPLATES.length)
  })

  it('初始状态无自定义模板', () => {
    const store = usePromptTemplateStore()
    const custom = store.templates.filter(t => !t.is_builtin)
    expect(custom).toHaveLength(0)
  })

  it('addCustomTemplate 创建并保存自定义模板', () => {
    const store = usePromptTemplateStore()
    store.addCustomTemplate('我的模板', '自定义内容描述', '自定义')
    const custom = store.templates.filter(t => !t.is_builtin)
    expect(custom).toHaveLength(1)
    expect(custom[0].title).toBe('我的模板')
    expect(custom[0].content).toBe('自定义内容描述')
    expect(custom[0].category).toBe('自定义')
    expect(custom[0].is_builtin).toBe(false)
  })

  it('deleteCustomTemplate 删除自定义模板', () => {
    const store = usePromptTemplateStore()
    store.addCustomTemplate('我的模板', '内容', '自定义')
    const custom = store.templates.filter(t => !t.is_builtin)
    expect(custom).toHaveLength(1)
    store.deleteCustomTemplate(custom[0].id)
    expect(store.templates.filter(t => !t.is_builtin)).toHaveLength(0)
  })

  it('deleteCustomTemplate 拒绝删除内置模板', () => {
    const store = usePromptTemplateStore()
    const builtinId = BUILTIN_TEMPLATES[0].id
    store.deleteCustomTemplate(builtinId)
    // 内置模板数量不变
    expect(store.templates.filter(t => t.is_builtin)).toHaveLength(BUILTIN_TEMPLATES.length)
  })

  it('getByCategory 返回指定分类的模板', () => {
    const store = usePromptTemplateStore()
    const landscapes = store.getByCategory('风景')
    expect(landscapes.length).toBeGreaterThan(0)
    landscapes.forEach(t => expect(t.category).toBe('风景'))
  })

  it('templates 是内置模板和自定义模板的合并', () => {
    const store = usePromptTemplateStore()
    store.addCustomTemplate('自定义1', '内容1', '自定义')
    expect(store.templates.length).toBe(BUILTIN_TEMPLATES.length + 1)
  })
})
