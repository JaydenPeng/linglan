import { describe, it, expect } from 'vitest'
import type { PromptTemplate, PromptCategory } from '../promptTemplate'
import { BUILTIN_TEMPLATES } from '../promptTemplate'

describe('PromptTemplate 类型', () => {
  it('PromptCategory 包含所有预期分类', () => {
    const categories: PromptCategory[] = ['风景', '人物', '动漫', '建筑', '抽象', '自定义']
    expect(categories).toHaveLength(6)
  })

  it('PromptTemplate 包含所有必填字段', () => {
    const tpl: PromptTemplate = {
      id: 'bt-001',
      title: '金色草原日落',
      content: '金色草原，夕阳西下，光线柔和',
      category: '风景',
      is_builtin: true,
      created_at: 0,
    }
    expect(tpl.id).toBe('bt-001')
    expect(tpl.title).toBe('金色草原日落')
    expect(tpl.content).toBe('金色草原，夕阳西下，光线柔和')
    expect(tpl.category).toBe('风景')
    expect(tpl.is_builtin).toBe(true)
    expect(tpl.created_at).toBe(0)
  })
})

describe('BUILTIN_TEMPLATES', () => {
  it('共有 15 条内置模板', () => {
    expect(BUILTIN_TEMPLATES).toHaveLength(15)
  })

  it('每条模板 is_builtin 为 true', () => {
    BUILTIN_TEMPLATES.forEach(tpl => {
      expect(tpl.is_builtin).toBe(true)
    })
  })

  it('覆盖 5 个非自定义分类，每类 3 条', () => {
    const categories: PromptCategory[] = ['风景', '人物', '动漫', '建筑', '抽象']
    categories.forEach(cat => {
      const count = BUILTIN_TEMPLATES.filter(t => t.category === cat).length
      expect(count).toBe(3)
    })
  })

  it('所有模板 id 唯一', () => {
    const ids = BUILTIN_TEMPLATES.map(t => t.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('所有模板 title 和 content 非空', () => {
    BUILTIN_TEMPLATES.forEach(tpl => {
      expect(tpl.title.length).toBeGreaterThan(0)
      expect(tpl.content.length).toBeGreaterThan(0)
    })
  })
})
