---
phase: "02"
plan: "06"
subsystem: renderer-navigation
tags: [app-vue, tab-navigation, image-generation, ionic-removal]
dependency_graph:
  requires: [02-03, 02-04, 02-05]
  provides: [image-tab-navigation]
  affects: [src/renderer/App.vue]
tech_stack:
  added: []
  patterns: [emit-navigate, native-html-css, tsconfig-include-expansion]
key_files:
  created:
    - src/renderer/pages/CreatePage.vue
    - src/renderer/pages/TaskListPage.vue
    - src/renderer/components/ImageParamsPanel.vue
    - src/renderer/components/TaskCard.vue
    - src/renderer/components/ImagePreviewModal.vue
    - src/renderer/types/imageApi.d.ts
  modified:
    - src/renderer/App.vue
    - tsconfig.web.json
    - src/components/ImageParamsPanel.vue
    - src/components/TaskCard.vue
    - src/components/ImagePreviewModal.vue
    - src/views/CreateView.vue
decisions:
  - "[02-06]: 将 CreateView/TaskListView 迁移到 src/renderer/pages/ 以纳入 tsconfig.web.json 的 include 范围"
  - "[02-06]: 新增 src/renderer/types/imageApi.d.ts 声明 window.imageApi 类型，避免 TS2339 错误"
  - "[02-06]: tsconfig.web.json include 扩展覆盖 src/types 和 src/stores，支持跨目录类型引用"
  - "[02-06]: CreatePage 用 emit('navigate', 'tasks') 替代 router.push('/tasks')，App.vue 监听切换 activeTab"
metrics:
  duration: "25 min"
  completed_date: "2026-03-20"
---

# Phase 02 Plan 06: Gap Closure — 将图片生成 UI 接入 App.vue Tab 导航 Summary

**One-liner:** 将孤立的 CreateView/TaskListView 重写为原生 HTML+CSS 并迁移到 renderer 目录，接入 App.vue 五 Tab 导航，emit 替代 router.push 实现提交后跳转。

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 06-01 | 在 App.vue 中注册图片和任务 Tab | 59561a3 | Done |
| 06-02 | 验证 CreateView 提交后跳转到任务列表 | 59561a3 | Done (included in 06-01) |

## Verification Results

- App.vue 包含「图片」和「任务」两个 Tab 按钮: PASS
- 点击「图片」Tab 显示 CreatePage 组件: PASS
- 点击「任务」Tab 显示 TaskListPage 组件: PASS
- 提交图片任务后 emit navigate 自动跳转到「任务」Tab: PASS
- 现有 video/history/settings Tab 功能不受影响: PASS

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CreateView/TaskListView 使用 Ionic 组件，项目无 Ionic 初始化**
- **Found during:** Task 06-01
- **Issue:** src/views/CreateView.vue 和 TaskListView.vue 使用 IonPage/IonHeader 等 Ionic 组件，但 main.ts 未初始化 Ionic，会导致运行时报错
- **Fix:** 将两个文件重写为原生 HTML+CSS，迁移到 src/renderer/pages/ 目录
- **Files modified:** src/renderer/pages/CreatePage.vue, src/renderer/pages/TaskListPage.vue
- **Commit:** 59561a3

**2. [Rule 1 - Bug] ImageParamsPanel/TaskCard/ImagePreviewModal 同样使用 Ionic 组件**
- **Found during:** Task 06-01
- **Issue:** src/components/ 下三个组件均 import @ionic/vue，无法在无 Ionic 环境中运行
- **Fix:** 重写为原生 HTML+CSS，迁移到 src/renderer/components/
- **Files modified:** src/renderer/components/ImageParamsPanel.vue, TaskCard.vue, ImagePreviewModal.vue
- **Commit:** 59561a3

**3. [Rule 3 - Blocking] window.imageApi 类型在 tsconfig.web.json 范围外不可见**
- **Found during:** Task 06-01
- **Issue:** preload/index.ts 的 declare global 不在 tsconfig.web.json include 范围内，导致 TS2339 错误
- **Fix:** 新增 src/renderer/types/imageApi.d.ts，扩展 tsconfig.web.json include 覆盖 src/types 和 src/stores
- **Files modified:** src/renderer/types/imageApi.d.ts, tsconfig.web.json
- **Commit:** 59561a3

## Self-Check: PASSED
