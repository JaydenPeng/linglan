---
phase: "03-视频生成与体验完善"
plan: "02"
subsystem: "数据层 - 历史记录与提示词模板"
tags: [pinia, typescript, persistedstate, history, prompt-template]
dependency_graph:
  requires: []
  provides:
    - src/shared/types/history.ts
    - src/shared/types/promptTemplate.ts
    - src/renderer/store/historyStore.ts
    - src/renderer/store/promptTemplateStore.ts
  affects:
    - src/renderer/main.ts
tech_stack:
  added:
    - pinia-plugin-persistedstate
  patterns:
    - Pinia Composition API defineStore
    - localStorage 持久化（pinia-plugin-persistedstate）
    - TDD（RED→GREEN）
key_files:
  created:
    - src/shared/types/history.ts
    - src/shared/types/promptTemplate.ts
    - src/renderer/store/historyStore.ts
    - src/renderer/store/promptTemplateStore.ts
    - src/shared/types/__tests__/history.test.ts
    - src/shared/types/__tests__/promptTemplate.test.ts
    - src/renderer/store/__tests__/historyStore.test.ts
    - src/renderer/store/__tests__/promptTemplateStore.test.ts
  modified:
    - src/renderer/main.ts
    - package.json
decisions:
  - "store 目录沿用项目已有的 src/renderer/store/（单数），不新建 stores/ 目录"
  - "promptTemplateStore persist 只序列化 customTemplates，内置模板从代码常量加载，避免 localStorage 冗余"
  - "deleteCustomTemplate 通过检查 customTemplates 数组（而非 is_builtin 字段）来拒绝删除内置模板，逻辑更简洁"
metrics:
  duration: "4 min"
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_created: 8
  files_modified: 2
  tests_added: 26
---

# Phase 03 Plan 02: 历史记录与提示词模板数据层 Summary

历史记录和提示词模板的类型定义 + Pinia store（含 localStorage 持久化）+ 15 条内置模板数据，为 Plan 04 UI 层提供完整数据契约。

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | 定义历史记录和提示词模板类型 | 4aae801 | history.ts, promptTemplate.ts, 2 test files |
| 2 | 实现 historyStore 和 promptTemplateStore | fc52384 | historyStore.ts, promptTemplateStore.ts, 2 test files, main.ts |

## Verification

- src/shared/types/history.ts 导出 HistoryRecordType、HistoryRecord
- src/shared/types/promptTemplate.ts 导出 PromptCategory、PromptTemplate、BUILTIN_TEMPLATES（15 条，覆盖风景/人物/动漫/建筑/抽象各 3 条）
- historyStore persist key: `linglan-history`
- promptTemplateStore persist key: `linglan-prompt-templates`，仅持久化 customTemplates
- 全量测试：44 passed（7 test files）

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] 注册 pinia-plugin-persistedstate 插件**
- **Found during:** Task 2
- **Issue:** main.ts 中 createPinia() 未注册 persistedstate 插件，persist 配置不会生效
- **Fix:** 安装 pinia-plugin-persistedstate，在 main.ts 中 pinia.use(piniaPluginPersistedstate)
- **Files modified:** src/renderer/main.ts, package.json
- **Commit:** fc52384

**2. [Rule 1 - Deviation] store 目录路径调整**
- **Found during:** Task 2
- **Issue:** 计划中路径为 src/renderer/stores/（复数），项目实际目录为 src/renderer/store/（单数）
- **Fix:** 沿用已有目录 src/renderer/store/
- **Files modified:** 无额外修改，直接使用正确路径

## Decisions Made

1. store 目录沿用 `src/renderer/store/`（单数），与 configStore.ts 保持一致
2. promptTemplateStore 的 persist 配置使用 `pick: ['customTemplates']`，内置模板从代码常量加载
3. deleteCustomTemplate 通过检查 customTemplates ref 而非 is_builtin 字段来防止删除内置模板

## Self-Check: PASSED

- FOUND: src/shared/types/history.ts
- FOUND: src/shared/types/promptTemplate.ts
- FOUND: src/renderer/store/historyStore.ts
- FOUND: src/renderer/store/promptTemplateStore.ts
- FOUND commit: 4aae801
- FOUND commit: fc52384
